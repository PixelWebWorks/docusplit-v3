import React, { useState } from 'react';
import { Upload, FileText, Cloud, Loader2, AlertCircle, Scissors, Download, Archive, Clock, ShieldCheck, Check, FileSpreadsheet, CheckCircle, FileSearch } from 'lucide-react';
import { analyzeInvoicePage } from '../services/gemini';
import { renderPageToImage, splitPdfIntoGroups } from '../services/pdfService';
import { uploadInvoiceToFirebase } from '../services/firebaseService';
import { Settings, ResultFile, Discrepancy } from '../types';
import { useAuth } from '../context/AuthContext';

// @ts-ignore
const pdfjsLib = window.pdfjsLib;
// @ts-ignore
const JSZip = window.JSZip;
// @ts-ignore
const XLSX = window.XLSX;

interface UnifiedModuleProps {
  settings: Settings;
}

const UnifiedModule: React.FC<UnifiedModuleProps> = ({ settings }) => {
  const { branchId } = useAuth();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  
  const [resultFiles, setResultFiles] = useState<ResultFile[]>([]);
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [hasRunReconcile, setHasRunReconcile] = useState(false);
  
  const [isUploaded, setIsUploaded] = useState(false);

  const sanitize = (text: string) => text.replace(/[^a-z0-9]/gi, '_').substring(0, 50);

  const processFiles = async () => {
    if (!pdfFile) return;
    setIsProcessing(true);
    setProgress(0);
    setStatus('Starting automated analysis...');
    setResultFiles([]);
    setDiscrepancies([]);
    setHasRunReconcile(false);
    setIsUploaded(false);

    try {
      // 1. If Excel exists, read it first
      const excelIds = new Set<string>();
      if (excelFile) {
        setStatus('Reading Excel document...');
        const excelBuffer = await excelFile.arrayBuffer();
        const workbook = XLSX.read(excelBuffer);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const excelData = XLSX.utils.sheet_to_json(firstSheet) as any[];
        
        excelData.forEach(row => {
          const key = Object.keys(row).find(k => k.toLowerCase().replace(/\s/g, '') === 'pickticketno');
          if (key && row[key]) excelIds.add(String(row[key]).trim());
        });
      }

      // 2. Read PDF using pdf.js
      setStatus('Loading Master PDF...');
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;

      const invoiceGroups: { id: string; shipTo: string; pages: number[] }[] = [];
      let currentGroup: { id: string; shipTo: string; pages: number[] } | null = null;
      const pdfIds = new Set<string>();

      // 3. Scan each page with Gemini just once
      for (let i = 1; i <= totalPages; i++) {
        setStatus(`Analyzing page ${i} of ${totalPages} with Gemini AI...`);
        const img = await renderPageToImage(pdf, i);

        const metadata = await analyzeInvoicePage(img, 3, (attempt) => {
          setStatus(`Gemini limit reached. Retry ${attempt} for page ${i}...`);
        });

        const invoiceNo = metadata.invoiceNo || 'N-A';
        const shipTo = metadata.shipTo || 'Unknown_Client';
        
        if (metadata.invoiceNo) {
            pdfIds.add(metadata.invoiceNo.trim());
        }

        // Grouping logic for splitting
        if (metadata.invoiceNo && (!currentGroup || currentGroup.id !== metadata.invoiceNo)) {
          currentGroup = { id: metadata.invoiceNo, shipTo: shipTo, pages: [i] };
          invoiceGroups.push(currentGroup);
        } else if (currentGroup) {
          currentGroup.pages.push(i);
        } else {
          currentGroup = { id: invoiceNo, shipTo: shipTo, pages: [i] };
          invoiceGroups.push(currentGroup);
        }

        setProgress(Math.round((i / totalPages) * 100));

        if (i < totalPages) {
          await new Promise(resolve => setTimeout(resolve, 800)); // Rate limit buffer
        }
      }

      // 4. Generate Split Blobs
      setStatus('Cutting physical documents...');
      const blobs = await splitPdfIntoGroups(pdfFile, invoiceGroups.map(g => g.pages));
      const results = blobs.map((blob, idx) => {
        const group = invoiceGroups[idx];
        return {
          name: `${sanitize(group.shipTo)}_${sanitize(group.id)}.pdf`,
          blob: blob,
          shipTo: group.shipTo,
          invoiceNo: group.id
        };
      });

      setResultFiles(results);
      
      // 5. Cross-reference for Reconciliation (if Excel was provided)
      if (excelFile) {
        setStatus('Cross-referencing Excel vs PDF...');
        const allIds = new Set([...pdfIds, ...excelIds]);
        const reconciliationResults: Discrepancy[] = Array.from(allIds)
          .filter(id => id !== 'N-A')
          .map(id => ({
            id,
            inPdf: pdfIds.has(id),
            inExcel: excelIds.has(id)
          }))
          .sort((a, b) => {
             // Show mismatches at the top
             const aMatch = a.inPdf === a.inExcel;
             const bMatch = b.inPdf === b.inExcel;
             if (aMatch && !bMatch) return 1;
             if (!aMatch && bMatch) return -1;
             return a.id.localeCompare(b.id);
          });
        
        setDiscrepancies(reconciliationResults);
        setHasRunReconcile(true);
      }

      setStatus('Complete. Audit logs ready.');
    } catch (error: any) {
      console.error(error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadAsZip = async () => {
    if (resultFiles.length === 0) return;
    const zip = new JSZip();
    resultFiles.forEach(f => {
      zip.file(f.name, f.blob);
    });
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Brady_Audit_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const uploadToFirebase = async () => {
    try {
      setStatus('Uploading securely to Firebase Cloud Storage...');
      setIsProcessing(true);
      let uploadedCount = 0;

      for (const f of resultFiles) {
        setStatus(`Uploading invoice ${f.invoiceNo} (${++uploadedCount}/${resultFiles.length})...`);
        // Using branchId from Auth context
        await uploadInvoiceToFirebase(f, branchId);
      }
      
      setStatus('Success! Documents stored securely in Cloud Storage & Firestore.');
      setIsUploaded(true);
    } catch (err: any) {
      console.error(err);
      setStatus(`Upload error: ${err.message}. Are Firestore/Storage active?`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadReportPdf = async () => {
    if (discrepancies.length === 0) return;
    setStatus('Generating PDF Report...');
    try {
      // @ts-ignore
      const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage([600, 800]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      const titleSize = 24;
      const textSize = 12;
      
      page.drawText('Brady Audit Suite - Reconciliation Report', {
        x: 50,
        y: 750,
        size: titleSize,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      page.drawText(`Generated on: ${new Date().toLocaleString()}`, {
        x: 50,
        y: 730,
        size: 10,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
      });

      // Headers
      let y = 680;
      page.drawText('Invoice/Ticket ID', { x: 50, y, size: textSize, font: boldFont });
      page.drawText('In PDF', { x: 300, y, size: textSize, font: boldFont });
      page.drawText('In Excel', { x: 450, y, size: textSize, font: boldFont });
      
      y -= 30;

      for (const d of discrepancies) {
        if (y < 50) {
           page = pdfDoc.addPage([600, 800]);
           y = 750;
           page.drawText('Invoice/Ticket ID', { x: 50, y, size: textSize, font: boldFont });
           page.drawText('In PDF', { x: 300, y, size: textSize, font: boldFont });
           page.drawText('In Excel', { x: 450, y, size: textSize, font: boldFont });
           y -= 30;
        }
        
        page.drawText(d.id, { x: 50, y, size: textSize, font: font });
        
        const inPdfText = d.inPdf ? 'Yes' : 'No';
        const inPdfColor = d.inPdf ? rgb(0, 0.5, 0) : rgb(0.8, 0, 0);
        page.drawText(inPdfText, { x: 300, y, size: textSize, font: boldFont, color: inPdfColor });
        
        const inExcelText = d.inExcel ? 'Yes' : 'No';
        const inExcelColor = d.inExcel ? rgb(0, 0.5, 0) : rgb(0.8, 0, 0);
        page.drawText(inExcelText, { x: 450, y, size: textSize, font: boldFont, color: inExcelColor });
        
        y -= 20;
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Brady_Audit_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus('Complete. Audit logs ready.');
    } catch (e: any) {
      console.error(e);
      setStatus('Error generating report: ' + e.message);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full w-fit mx-auto md:mx-0">
        <ShieldCheck className="w-3 h-3 text-blue-400" />
        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Firebase Secure Mode</span>
      </div>

      <section className="glass p-8 rounded-2xl border border-white/10">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
          <Upload className="text-[#f84827]" />
          Brady Unified Audit
        </h2>
        
        <p className="text-sm text-slate-400 mb-6">
          Upload a physical master PDF to automatically split and categorize by store. 
          Upload an optional Excel routing log to instantly reconcile missing shipments.
        </p>

        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <label className="flex-1 w-full h-32 border-2 border-dashed border-white/20 rounded-xl hover:border-[#f84827]/50 transition-colors flex flex-col items-center justify-center cursor-pointer bg-white/5">
            <input type="file" accept="application/pdf" className="hidden" onChange={e => e.target.files && setPdfFile(e.target.files[0])} />
            <FileText className={`w-8 h-8 mb-2 ${pdfFile ? 'text-green-400' : 'text-slate-500'}`} />
            <span className="text-sm font-medium">{pdfFile ? pdfFile.name : "1. Required: Master PDF"}</span>
          </label>
          
          <label className="flex-1 w-full h-32 border-2 border-dashed border-white/20 rounded-xl hover:border-blue-500/50 transition-colors flex flex-col items-center justify-center cursor-pointer bg-white/5">
            <input type="file" accept=".xlsx" className="hidden" onChange={e => e.target.files && setExcelFile(e.target.files[0])} />
            <FileSpreadsheet className={`w-8 h-8 mb-2 ${excelFile ? 'text-blue-400' : 'text-slate-500'}`} />
            <span className="text-sm font-medium text-center">{excelFile ? excelFile.name : "2. Optional: Excel Routing"}</span>
          </label>
        </div>

        <button
          onClick={processFiles}
          disabled={!pdfFile || isProcessing}
          className="w-full py-4 rounded-xl font-bold bg-[#f84827] text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Scissors className="w-6 h-6" />}
          {isProcessing ? "Processing Intelligent Audit..." : "Execute Audit Workflow"}
        </button>

        {isProcessing && (
          <div className="mt-8 space-y-2">
            <div className="flex justify-between text-xs text-[#f84827]">
              <span className="flex items-center gap-2">
                {status.includes('limit') && <Clock className="w-3 h-3 animate-pulse" />}
                {status}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-[#f84827] h-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </section>

      {hasRunReconcile && (
        <section className="glass p-8 rounded-2xl animate-in fade-in slide-in-from-bottom-4 border border-white/10">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-4 items-start md:items-center">
            <h3 className="text-xl font-bold flex items-center gap-2"><FileSearch className="text-[#f84827]"/> Reconciliation Audit Results</h3>
            {discrepancies.length > 0 && (
              <button
                onClick={downloadReportPdf}
                className="flex items-center gap-2 px-4 py-2 bg-[#f84827]/10 hover:bg-[#f84827]/20 text-[#f84827] rounded-lg font-bold transition-all border border-[#f84827]/20 text-sm"
              >
                <FileText className="w-4 h-4" />
                Download PDF Report
              </button>
            )}
          </div>
          
          {discrepancies.length === 0 ? (
            <div className="text-center p-8 text-green-400 font-bold bg-green-500/10 rounded-xl border border-green-500/20">
              <CheckCircle className="mx-auto mb-2 w-8 h-8" />
              100% Match! No discrepancies found. But wait, we should show all the matched IDs too if they were read!
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-white/5">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-900 border-b border-white/5">
                  <tr>
                    <th className="p-4">Invoice / Ticket ID</th>
                    <th className="p-4 text-center">In PDF</th>
                    <th className="p-4 text-center">In Excel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {discrepancies.map((d, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono text-slate-300">{d.id}</td>
                      <td className="p-4 text-center text-lg">
                         {d.inPdf ? <span className="text-green-500">✅</span> : <span className="text-red-500">❌</span>}
                      </td>
                      <td className="p-4 text-center text-lg">
                         {d.inExcel ? <span className="text-green-500">✅</span> : <span className="text-red-500">❌</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* RESULT SPLIT FILES */}
      {resultFiles.length > 0 && !isProcessing && (
        <section className="glass p-8 rounded-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-4 delay-150">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2"><Scissors className="text-[#f84827]" /> Processed Invoices</h3>
              <p className="text-slate-400">{resultFiles.length} distinct documents generated.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={downloadAsZip}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 rounded-lg font-bold hover:bg-white/10 transition-all border border-white/10"
              >
                <Archive className="w-4 h-4" />
                Download Local ZIP
              </button>
              <button
                onClick={uploadToFirebase}
                disabled={isUploaded}
                className={`flex items-center gap-2 px-8 py-3 rounded-lg font-bold transition-all shadow-lg ${isUploaded
                    ? "bg-green-500 hover:bg-green-600 shadow-green-500/20 cursor-default text-white"
                    : "bg-blue-600 hover:bg-blue-500 hover:scale-105 shadow-blue-500/20 text-white"
                  }`}
              >
                {isUploaded ? <Check className="w-4 h-4 text-white" /> : <Cloud className="w-4 h-4 text-white" />}
                {isUploaded ? "Saved to Enterprise Cloud" : "Upload to Cloud"}
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto custom-scrollbar rounded-xl border border-white/5">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900 sticky top-0 shadow-md">
                <tr>
                  <th className="p-4 font-bold text-slate-300">File Routing & Target Location</th>
                  <th className="p-4 font-bold text-right text-slate-300">Size</th>
                  <th className="p-4 font-bold text-center text-slate-300">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {resultFiles.map((f, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="text-blue-400 text-[10px] font-bold uppercase mb-1 tracking-wider">Storage Path: /{sanitize(f.shipTo)}/{f.invoiceNo}</div>
                      <div className="text-slate-200 group-hover:text-white transition-colors">{f.name}</div>
                    </td>
                    <td className="p-4 text-right text-slate-500">{(f.blob.size / 1024).toFixed(1)} KB</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => {
                          const url = URL.createObjectURL(f.blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = f.name;
                          link.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="p-2 hover:bg-blue-500/20 rounded-lg text-blue-400 transition-colors"
                        title="Download Document"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {status.includes('Error') && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 animate-pulse">
          <AlertCircle className="w-8 h-8 shrink-0" />
          <span className="text-sm">{status}</span>
        </div>
      )}
    </div>
  );
};

export default UnifiedModule;
