import test from 'node:test';
import assert from 'node:assert/strict';
import QRCode from 'qrcode';
import * as XLSX from 'xlsx';
import { decodeInvoiceQR, parseInvoiceText, completeTextInvoice, manualInvoice } from '../src/utils/localInvoice';
import { scanQRPixels } from '../src/utils/qrPixels';
import { createInvoiceWorkbook } from '../src/utils/excelExport';
import { needsReview } from '../src/utils/review';
import { SAMPLE_INVOICES } from '../src/data/sampleInvoices';
function payload(values: string[], extra: number[] = []) {
  const blocks = values.flatMap((value, index) => { const bytes = [...new TextEncoder().encode(value)]; return [index + 1, bytes.length, ...bytes]; });
  return Buffer.from([...blocks, ...extra]).toString('base64');
}
const fields = ['شركة تجريبية', '310123456700003', '2026-10-13T20:00:00+03:00', '115.00', '15.00'];
test('TLV uses UTF-8 byte lengths, derives net from encoded totals and does not invent an invoice number', () => {
  const row = decodeInvoiceQR(payload(fields));
  assert.equal(row?.sellerName, fields[0]); assert.equal(row?.amountBeforeTax, 100); assert.equal(row?.invoiceNumber, '');
  assert.equal(row?.extractionSource, 'QR');
});
test('phase-two binary tags, zero tax and credit amounts are handled without imposing a 15% rate', () => {
  assert.ok(decodeInvoiceQR(payload(fields, [6, 3, 255, 0, 128])));
  assert.equal(decodeInvoiceQR(payload([...fields.slice(0,3), '100.00', '0.00']))?.tax, 0);
  assert.equal(decodeInvoiceQR(payload([...fields.slice(0,3), '-115.00', '-15.00']))?.amountBeforeTax, -100);
});
test('URLs, generic barcodes, truncated TLV, duplicate fields and impossible totals are rejected', () => {
  for (const value of ['https://example.com/invoice', '1234567890123', 'AAAA', payload([...fields.slice(0,3), '10.00', '15.00']), payload(fields, [1,1,65])]) assert.equal(decodeInvoiceQR(value), null);
  const bytes = Buffer.from(payload(fields), 'base64'); assert.equal(decodeInvoiceQR(bytes.subarray(0,bytes.length-1).toString('base64')), null);
});
test('actual generated QR pixels are decoded, including rotated and inverted codes', async () => {
  const raw = payload(fields);
  const matrix = QRCode.create(raw, { errorCorrectionLevel: 'M' }).modules;
  const width = (matrix.size + 8) * 5;
  const pixels = new Uint8ClampedArray(width * width * 4).fill(255);
  for (let y=0;y<matrix.size;y++) for (let x=0;x<matrix.size;x++) if (matrix.get(y,x)) for (let dy=0;dy<5;dy++) for (let dx=0;dx<5;dx++) {
    const offset = (((y+4)*5+dy)*width+(x+4)*5+dx)*4;
    pixels[offset]=pixels[offset+1]=pixels[offset+2]=0;
  }
  assert.deepEqual(scanQRPixels(pixels,width,width),[raw]);
  const rotated = new Uint8ClampedArray(pixels.length);
  for(let y=0;y<width;y++) for(let x=0;x<width;x++) for(let c=0;c<4;c++) rotated[((width-1-y)*width+width-1-x)*4+c]=pixels[(y*width+x)*4+c];
  assert.deepEqual(scanQRPixels(rotated,width,width),[raw]);
  for(let i=0;i<pixels.length;i++) if(i%4!==3)pixels[i]=255-pixels[i];
  assert.deepEqual(scanQRPixels(pixels,width,width),[raw]);
});
test('native PDF text requires explicit labels and balanced actual amounts; no fallback tax is guessed', () => {
  const row = parseInvoiceText('Seller: Test Company\nVAT No: 310123456700003\nInvoice No: INV-123\nDate: 2026-10-13\nSubtotal: 100.00\nTotal VAT: 5.00\nGrand Total: 105.00 SAR');
  assert.equal(completeTextInvoice(row),true); assert.equal(row.tax,5);
  const partial = parseInvoiceText('Grand Total: 115.00 SAR');
  assert.equal(completeTextInvoice(partial),false); assert.equal(Number.isNaN(partial.tax),true);
});
test('failed pages retain partial text, need manual review and export unknown amounts as blanks', async () => {
  const partial = manualInvoice({ sellerName:'Known supplier' },'Provider error');
  const row = {...SAMPLE_INVOICES[0],...partial,id:'failed'};
  assert.equal(needsReview(row),true); assert.equal(row.sellerName,'Known supplier');
  const workbook = await createInvoiceWorkbook([row]);
  const rows:any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]],{header:1});
  assert.equal(rows[4][6],''); assert.equal(rows[4][7],''); assert.equal(rows[4][8],'');
  assert.equal(rows[2][6],''); assert.equal(rows[2][7],''); assert.equal(rows[2][8],'');
});

test('native text with multiple invoice labels cannot collapse into one local invoice', () => {
  const row = parseInvoiceText('Seller: Test\nInvoice No: ONE\nInvoice No: TWO\nGrand Total: 115 SAR\nGrand Total: 230 SAR');
  assert.equal(row.ambiguousText, true);
  assert.equal(completeTextInvoice(row), false);
});
