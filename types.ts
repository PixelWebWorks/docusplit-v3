export enum Module {
  UNIFIED = 'UNIFIED', // Replaced SPLIT and RECONCILE
  SEARCH = 'SEARCH',
  SETTINGS = 'SETTINGS'
}

export interface Settings {
  driveClientId?: string; // Legacy, kept for reference if needed
  driveFolderId?: string; // Legacy
}

export interface InvoiceMetadata {
  invoiceNo: string | null;
  shipTo: string | null;
}

export interface Discrepancy {
  id: string;
  inPdf: boolean;
  inExcel: boolean;
}

export interface AppState {
  currentModule: Module;
  settings: Settings;
  isProcessing: boolean;
}

export interface ResultFile {
  name: string;
  blob: Blob;
  shipTo: string;
  invoiceNo: string;
}
