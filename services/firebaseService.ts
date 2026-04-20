import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, query, where, getDocs, setDoc, doc, Timestamp } from "firebase/firestore";
import { storage, db, auth } from "./firebase";
import { ResultFile } from "../types"; // Will update types to export this

export const uploadInvoiceToFirebase = async (
  file: ResultFile,
  branchId: string = "default_branch"
) => {
  try {
    const sanitize = (text: string) => text.replace(/[^a-z0-9\s_\-]/gi, '').trim();
    
    // Limpiamos el número de factura para quedarnos solo con la parte final
    const rawInvoice = file.invoiceNo || 'Unknown_Invoice';
    const invoiceParts = rawInvoice.split(/[_\-\s]+/);
    const cleanInvoiceNo = invoiceParts[invoiceParts.length - 1] || rawInvoice;
    
    const safeShipTo = sanitize(file.shipTo || 'Unknown_Client').replace(/\s+/g, '_');
    const safeInvoiceNo = sanitize(cleanInvoiceNo).replace(/\s+/g, '_');
    
    // 1. Upload to Storage in folder structure: Branch / ShipTo / Invoice.pdf
    const storagePath = `invoices/${branchId}/${safeShipTo}/${safeInvoiceNo}.pdf`;
    const storageRef = ref(storage, storagePath);
    
    // Check if it exists? We can just overwrite it to keep it simple and clean
    await uploadBytes(storageRef, file.blob);
    const downloadUrl = await getDownloadURL(storageRef);

    // 2. Save metadata to Firestore (so it can be searched without reading buckets)
    // We use the invoiceNo as document ID to avoid duplicates
    const docRef = doc(db, 'invoices', safeInvoiceNo);
    await setDoc(docRef, {
      invoiceNo: file.invoiceNo,
      shipTo: file.shipTo,
      branchId: branchId,
      storagePath: storagePath,
      downloadUrl: downloadUrl,
      updatedAt: Timestamp.now(),
      fileName: file.name
    }, { merge: true }); // Merge ensures we update if exists

    return { success: true, url: downloadUrl };
  } catch (error) {
    console.error("Firebase upload error:", error);
    throw error;
  }
};
