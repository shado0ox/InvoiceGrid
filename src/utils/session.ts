import type { InvoiceRow } from '../types';
export function rowFingerprint(row: InvoiceRow): string {
  const { filePreviewUrl, ...data } = row;
  return JSON.stringify(data);
}
export function notifyExport(rows: InvoiceRow[]) {
  window.dispatchEvent(new CustomEvent('invoicegrid:export', { detail: rows }));
}
export function currencyGroups(rows: InvoiceRow[]): Map<string, InvoiceRow[]> {
  const groups = new Map<string, InvoiceRow[]>();
  for (const row of rows) {
    const currency = (row.currency || 'UNKNOWN').trim().toUpperCase();
    groups.set(currency, [...(groups.get(currency) || []), row]);
  }
  return groups;
}
