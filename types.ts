
export enum Module {
  SPLIT = 'SPLIT',
  RECONCILE = 'RECONCILE',
  SETTINGS = 'SETTINGS'
}

export interface Settings {
  driveClientId: string;
  driveFolderId: string;
}

export interface InvoiceMetadata {
  invoiceNo: string | null;
  shipTo: string | null;
}

export interface Discrepancy {
  id: string;
  type: 'MISSING_IN_EXCEL' | 'MISSING_IN_PDF';
}

export interface AppState {
  currentModule: Module;
  settings: Settings;
  isProcessing: boolean;
}
