import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, query, where, getDocs, setDoc, doc, Timestamp } from "firebase/firestore";
import { storage, db, auth } from "./firebase";
import { ResultFile } from "../types"; // Will update types to export this

export const uploadInvoiceToFirebase = async (
  file: ResultFile,
  branchId: string = "default_branch"
) => {
  try {
    const sanitize = (text: string) => text.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
    const safeShipTo = sanitize(file.shipTo || 'Unknown_Client');
    const safeInvoiceNo = sanitize(file.invoiceNo || 'Unknown_Invoice');
    
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
