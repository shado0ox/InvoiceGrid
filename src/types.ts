export interface InvoiceRow {
  id: string;
  no: number;
  date: string;
  sellerName: string;
  taxNumber: string;
  invoiceNumber: string;
  details: string;
  amountBeforeTax: number;
  tax: number;
  lastAmount: number;
  currency?: string;
  taxRatePercent?: number;
  fileName?: string;
  filePreviewUrl?: string;
  fileMimeType?: string;
  notes?: string;
  extractionSource?: 'QR' | 'PDF_TEXT' | 'GEMINI' | 'MANUAL';
  filePageNumber?: number;
}

export interface FileQueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  errorMessage?: string;
  extractedCount?: number;
}
