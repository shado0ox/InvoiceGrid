import type { InvoiceRow } from '../types';
export type LocalInvoice = Partial<InvoiceRow> & { ambiguousText?: boolean };
export function normalizeDigits(value: string) {
  return value.replace(/[٠-٩۰-۹]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.includes(digit) ? '٠١٢٣٤٥٦٧٨٩'.indexOf(digit) : '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))).replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '');
}
function money(value: string) {
  const clean = normalizeDigits(value).trim().replace(/٬|,/g, '').replace(/٫/g, '.');
  return /^-?\d+(?:\.\d{1,2})?$/.test(clean) && Number.isFinite(Number(clean)) ? Number(clean) : NaN;
}
export function decodeInvoiceQR(raw: string): LocalInvoice | null {
  const base64 = raw.trim();
  if (base64.length > 8192 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64) || base64.length % 4) return null;
  try {
    const bytes = Uint8Array.from(atob(base64), character => character.charCodeAt(0));
    const fields = new Map<number, string>();
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let offset = 0;
    while (offset < bytes.length) {
      if (offset + 2 > bytes.length) return null;
      const tag = bytes[offset++], length = bytes[offset++];
      if (offset + length > bytes.length || tag === 0) return null;
      if (tag <= 5) {
        if (fields.has(tag)) return null;
        fields.set(tag, decoder.decode(bytes.subarray(offset, offset + length)).trim());
      }
      offset += length;
    }
    const sellerName = fields.get(1) || '', taxNumber = normalizeDigits(fields.get(2) || '');
    const timestamp = fields.get(3) || '', lastAmount = money(fields.get(4) || ''), tax = money(fields.get(5) || '');
    const date = timestamp.slice(0, 10);
    if (!sellerName || !/^3\d{14}$/.test(taxNumber) || !/^\d{4}-\d{2}-\d{2}T/.test(timestamp) || !Number.isFinite(Date.parse(timestamp)) || new Date(date + 'T00:00:00Z').toISOString().slice(0,10) !== date || !Number.isFinite(lastAmount) || !Number.isFinite(tax)) return null;
    if ((lastAmount >= 0 && (tax < 0 || tax > lastAmount)) || (lastAmount < 0 && (tax > 0 || tax < lastAmount))) return null;
    return { sellerName, taxNumber, date, invoiceNumber: '', details: '', amountBeforeTax: Math.round((lastAmount - tax) * 100) / 100, tax, lastAmount, currency: 'SAR', extractionSource: 'QR', notes: 'بيانات QR؛ لم يتم التحقق من التوقيع أو أصالة الفاتورة. أكمل رقم الفاتورة والبيان من الأصل.' };
  } catch { return null; }
}
/** Label-based only: never infer VAT percentages or take arbitrary line-item sums. */
export function parseInvoiceText(raw: string): LocalInvoice {
  const text = normalizeDigits(raw);
  const find = (pattern: RegExp) => text.match(pattern)?.[1]?.trim() || '';
  const amount = (label: string) => money(find(new RegExp(`(?:${label})\\s*[:=]?\\s*(?:SAR\\s*)?(-?[0-9][0-9,٬]*(?:[.٫][0-9]{1,2})?)`, 'i')));
  const date = find(/(?:Invoice Date|Date|التاريخ|تاريخ الفاتورة)\s*[:=]?\s*(\d{4}-\d{2}-\d{2})/i);
  return {
    ambiguousText: (text.match(/Invoice (?:No\.?|Number|ID)|رقم الفاتورة/gi) || []).length > 1 || (text.match(/Grand Total|الإجمالي النهائي/gi) || []).length > 1,
    sellerName: find(/(?:Seller(?: Name)?|Supplier(?: Name)?|اسم المورد|اسم البائع)\s*[:=]\s*([^\n]+)/i),
    invoiceNumber: find(/(?:Invoice (?:No\.?|Number|ID)|رقم الفاتورة)\s*[:#=]?\s*([A-Za-z0-9][A-Za-z0-9._/-]*)/i),
    taxNumber: find(/(?:VAT (?:No\.?|Number|ID)|الرقم الضريبي)\s*[:=]?\s*(3\d{14})\b/i),
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date)) ? date : '',
    details: find(/(?:Description|Details|البيان|الوصف)\s*[:=]\s*([^\n]+)/i),
    amountBeforeTax: amount('Subtotal|Sub Total|Total Before Tax|الإجمالي قبل الضريبة|المبلغ قبل الضريبة|Total Amount'),
    tax: amount('Total VAT|VAT Amount|Tax Amount|إجمالي الضريبة|قيمة الضريبة'),
    lastAmount: amount('Grand Total|الإجمالي النهائي|الإجمالي شامل الضريبة'),
    currency: /\bSAR\b|ريال سعودي/i.test(text) ? 'SAR' : /\bUSD\b/i.test(text) ? 'USD' : /\bEGP\b/i.test(text) ? 'EGP' : 'UNKNOWN',
    extractionSource: 'PDF_TEXT',
  };
}
export function completeTextInvoice(row: LocalInvoice): boolean {
  return !row.ambiguousText && !!(row.sellerName && row.invoiceNumber && row.date && row.taxNumber && row.currency && row.currency !== 'UNKNOWN') && [row.amountBeforeTax, row.tax, row.lastAmount].every(value => typeof value === 'number' && Number.isFinite(value)) && Math.abs(row.amountBeforeTax! + row.tax! - row.lastAmount!) <= 0.02;
}
export function manualInvoice(partial: LocalInvoice = {}, reason = ''): LocalInvoice {
  return { date: '', sellerName: '', taxNumber: '', invoiceNumber: '', details: '', amountBeforeTax: NaN, tax: NaN, lastAmount: NaN, currency: 'UNKNOWN', ...partial, extractionSource: 'MANUAL', notes: [partial.notes, reason, 'تحتاج إدخالًا يدويًا؛ القيم غير المقروءة فارغة.'].filter(Boolean).join(' — ') };
}
