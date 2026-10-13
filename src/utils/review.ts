import type { InvoiceRow } from '../types';
export function needsReview(row: InvoiceRow): boolean {
  return !row.sellerName?.trim() || !row.date?.trim() || !row.invoiceNumber?.trim() || !row.currency || row.currency === 'UNKNOWN' || [row.amountBeforeTax, row.tax, row.lastAmount].some(value => !Number.isFinite(value)) || Math.abs(row.amountBeforeTax + row.tax - row.lastAmount) > 0.02;
}
