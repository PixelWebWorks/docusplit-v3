
// @ts-ignore
const pdfjsLib = window.pdfjsLib;
// @ts-ignore
const PDFLib = window.PDFLib;

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export const renderPageToImage = async (pdfDoc: any, pageNumber: number): Promise<string> => {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  canvas.height = viewport.height;
  canvas.width = viewport.width;

  if (!context) throw new Error("Canvas context is null");

  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;

  return canvas.toDataURL('image/jpeg', 0.8);
};

export const splitPdfIntoGroups = async (file: File, groups: number[][]): Promise<Blob[]> => {
  const existingPdfBytes = await file.arrayBuffer();
  const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
  const splitPdfs: Blob[] = [];

  for (const pageIndices of groups) {
    const subPdf = await PDFLib.PDFDocument.create();
    const copiedPages = await subPdf.copyPages(pdfDoc, pageIndices.map(i => i - 1));
    copiedPages.forEach((page: any) => subPdf.addPage(page));
    
    const pdfBytes = await subPdf.save();
    splitPdfs.push(new Blob([pdfBytes], { type: 'application/pdf' }));
  }

  return splitPdfs;
};
