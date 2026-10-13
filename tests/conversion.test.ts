import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import { createInvoiceWorkbook, safeCSVText } from '../src/utils/excelExport';
import { rowFingerprint } from '../src/utils/session';
import { needsReview } from '../src/utils/review';
import { SAMPLE_INVOICES } from '../src/data/sampleInvoices';

test('Excel preserves all nine columns, tax IDs as text, and separates currency totals', async () => {
  const a = { ...SAMPLE_INVOICES[0], id: 'a', currency: 'SAR', taxNumber: '001234567890123', amountBeforeTax: 100, tax: 15, lastAmount: 115 };
  const b = { ...a, id: 'b', currency: 'USD', lastAmount: 230, amountBeforeTax: 200, tax: 30 };
  const workbook = await createInvoiceWorkbook([a, b]);
  const reopened = XLSX.read(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  assert.equal(reopened.SheetNames.length, 2);
  for (const [index, amount] of [115, 230].entries()) {
    const sheet = reopened.Sheets[reopened.SheetNames[index]];
    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
    assert.equal(rows[0].length, 9);
    assert.equal(rows[1][4], 'invoice number');
    assert.equal(rows[2][3], '001234567890123');
    assert.equal(rows.at(-1)![8], amount);
    assert.equal(sheet.D3.t, 's');
  }
});
test('CSV text cannot become a spreadsheet formula and quotes survive', () => {
  assert.equal(safeCSVText('=HYPERLINK("https://example.com")'), '"\'=HYPERLINK(""https://example.com"")"');
  assert.equal(safeCSVText(' شركة "س"'), '" شركة ""س"""');
});
test('changing an exported field dirties the session, while a preview URL does not', () => {
  const row = SAMPLE_INVOICES[0];
  assert.notEqual(rowFingerprint(row), rowFingerprint({ ...row, tax: row.tax + 1 }));
  assert.equal(rowFingerprint(row), rowFingerprint({ ...row, filePreviewUrl: 'blob:new' }));
});
test('missing fields and inconsistent totals are flagged for review', () => {
  const row = { ...SAMPLE_INVOICES[0], sellerName: 'Seller', date: '2026-10-13', invoiceNumber: '123', currency: 'SAR', amountBeforeTax: 100, tax: 15, lastAmount: 115 };
  assert.equal(needsReview(row), false);
  assert.equal(needsReview({ ...row, lastAmount: 120 }), true);
  assert.equal(needsReview({ ...row, date: '' }), true);
});
