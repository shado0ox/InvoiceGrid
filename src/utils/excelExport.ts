import type * as XLSXTypes from 'xlsx';
import { InvoiceRow } from '../types';
import { currencyGroups, notifyExport } from './session';

function createInvoiceWorksheet(invoices: InvoiceRow[], XLSX: typeof XLSXTypes) {
  // Exact headers matching the screenshot provided:
  // Row 1: Arabic Headers
  const arabicHeaders = [
    'مسلسل',
    'التاريخ',
    'اسم المورد',
    'الرقم الضريبي',
    'رقم الفاتوره',
    'البيانات',
    'المبلغ قبل الضريبه',
    'الضريبه',
    'المبلغ بعد الضريبه',
  ];

  // Row 2: English Subheaders exactly as shown in the screenshot
  const englishHeaders = [
    'no',
    'date',
    "The seller's name",
    'tax number',
    'invoice number',
    'details',
    'amount befor tax',
    'tax',
    'last amount',
  ];

  // Data rows
  const dataRows = invoices.map((inv, idx) => [
    inv.no ?? idx + 1,
    inv.date || '',
    inv.sellerName || '',
    inv.taxNumber || '',
    inv.invoiceNumber || '',
    inv.details || '',
    Number.isFinite(inv.amountBeforeTax) ? inv.amountBeforeTax : '',
    Number.isFinite(inv.tax) ? inv.tax : '',
    Number.isFinite(inv.lastAmount) ? inv.lastAmount : '',
  ]);

  // Totals calculations
  const totalBeforeTax = invoices.reduce((sum, inv) => sum + (Number(inv.amountBeforeTax) || 0), 0);
  const totalTax = invoices.reduce((sum, inv) => sum + (Number(inv.tax) || 0), 0);
  const totalLastAmount = invoices.reduce((sum, inv) => sum + (Number(inv.lastAmount) || 0), 0);

  // Total summary row in Arabic
  const totalRowArabic = [
    'الإجمالي',
    '',
    '',
    '',
    '',
    `عدد الفواتير: ${invoices.length}`,
    invoices.some(inv => Number.isFinite(inv.amountBeforeTax)) ? Number(totalBeforeTax.toFixed(2)) : '',
    invoices.some(inv => Number.isFinite(inv.tax)) ? Number(totalTax.toFixed(2)) : '',
    invoices.some(inv => Number.isFinite(inv.lastAmount)) ? Number(totalLastAmount.toFixed(2)) : '',
  ];

  // Total summary row in English
  const totalRowEnglish = [
    'Total',
    '',
    '',
    '',
    '',
    `Total Invoices: ${invoices.length}`,
    invoices.some(inv => Number.isFinite(inv.amountBeforeTax)) ? Number(totalBeforeTax.toFixed(2)) : '',
    invoices.some(inv => Number.isFinite(inv.tax)) ? Number(totalTax.toFixed(2)) : '',
    invoices.some(inv => Number.isFinite(inv.lastAmount)) ? Number(totalLastAmount.toFixed(2)) : '',
  ];

  const fullSheetData = [
    arabicHeaders,
    englishHeaders,
    ...dataRows,
    [], // empty spacer row
    totalRowArabic,
    totalRowEnglish,
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(fullSheetData);

  // Set column widths for optimal display
  worksheet['!cols'] = [
    { wch: 8 },  // مسلسل / no
    { wch: 14 }, // التاريخ / date
    { wch: 28 }, // اسم المورد / The seller's name
    { wch: 22 }, // الرقم الضريبي / tax number
    { wch: 20 }, // رقم الفاتوره / invoice number
    { wch: 35 }, // البيانات / details
    { wch: 20 }, // المبلغ قبل الضريبه / amount befor tax
    { wch: 16 }, // الضريبه / tax
    { wch: 22 }, // المبلغ بعد الضريبه / last amount
  ];

  // Set worksheet view for Right-to-Left (RTL) reading if supported
  if (!worksheet['!views']) {
    worksheet['!views'] = [{ RTL: true }];
  }

  return worksheet;
}
export async function createInvoiceWorkbook(invoices: InvoiceRow[]) {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  const groups = currencyGroups(invoices);
  if (!groups.size) groups.set('UNKNOWN', []);
  let index = 0;
  for (const [currency, rows] of groups) {
    const label = groups.size === 1 ? 'فواتير المشتريات' : `${++index}-${currency.replace(/[\\/?*:\[\]]/g, '').slice(0, 20) || 'UNKNOWN'}`;
    XLSX.utils.book_append_sheet(workbook, createInvoiceWorksheet(rows, XLSX), label);
  }
  return workbook;
}
export async function exportInvoicesToExcel(invoices: InvoiceRow[], filename = 'InvoiceGrid_فواتير_المشتريات.xlsx') {
  const XLSX = await import('xlsx');
  const workbook = await createInvoiceWorkbook(invoices);
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
  notifyExport(invoices);
}

export function safeCSVText(value: string): string {
  const text = /^[\s]*[=+@-]/.test(value) ? `'${value}` : value;
  return `"${text.replace(/"/g, '\"\"')}"`;
}
export function exportInvoicesToCSV(invoices: InvoiceRow[], filename = 'InvoiceGrid_فواتير_المشتريات.csv') {
  const headers = [
    'مسلسل (no)',
    'التاريخ (date)',
    'اسم المورد (The seller\'s name)',
    'الرقم الضريبي (tax number)',
    'رقم الفاتوره (invoice number)',
    'البيانات (details)',
    'المبلغ قبل الضريبه (amount befor tax)',
    'الضريبه (tax)',
    'المبلغ بعد الضريبه (last amount)',
  ];

  const rows = invoices.map((inv, idx) => [
    inv.no ?? idx + 1,
    safeCSVText(inv.date || ''),
    safeCSVText(inv.sellerName || ''),
    safeCSVText(inv.taxNumber || ''),
    safeCSVText(inv.invoiceNumber || ''),
    safeCSVText(inv.details || ''),
    (Number.isFinite(inv.amountBeforeTax) ? inv.amountBeforeTax.toFixed(2) : ''),
    (Number.isFinite(inv.tax) ? inv.tax.toFixed(2) : ''),
    (Number.isFinite(inv.lastAmount) ? inv.lastAmount.toFixed(2) : ''),
  ]);

  // Add UTF-8 BOM so Excel opens Arabic correctly
  const csvContent = '\uFEFF' + [
    headers.join(','),
    ...rows.map(r => r.join(',')),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  notifyExport(invoices);
}

export async function copyInvoicesToClipboard(invoices: InvoiceRow[]): Promise<boolean> {
  const headers = [
    'مسلسل\tالتاريخ\tاسم المورد\tالرقم الضريبي\tرقم الفاتوره\tالبيانات\tالمبلغ قبل الضريبه\tالضريبه\tالمبلغ بعد الضريبه',
    'no\tdate\tThe seller\'s name\ttax number\tinvoice number\tdetails\tamount befor tax\ttax\tlast amount'
  ];

  const rows = invoices.map((inv, idx) => [
    inv.no ?? idx + 1,
    ...[inv.date, inv.sellerName, inv.taxNumber, inv.invoiceNumber, inv.details].map(value => {
      const text = (value || '').replace(/[\t\r\n]/g, ' ');
      return /^[\s]*[=+@-]/.test(text) ? `'${text}` : text;
    }),
    (Number.isFinite(inv.amountBeforeTax) ? inv.amountBeforeTax.toFixed(2) : ''),
    (Number.isFinite(inv.tax) ? inv.tax.toFixed(2) : ''),
    (Number.isFinite(inv.lastAmount) ? inv.lastAmount.toFixed(2) : ''),
  ].join('\t'));

  const textToCopy = [...headers, ...rows].join('\n');
  try {
    await navigator.clipboard.writeText(textToCopy);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
}
