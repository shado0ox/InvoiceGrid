import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index';
import { extractInvoice } from '../src/utils/extractInvoices';
const assets = { fetch: async () => new Response('static application') };
test('public assets need no account and retired server extraction cannot use owner secrets', async () => {
  assert.equal(await (await worker.fetch(new Request('https://invoices.example.com/'), { ASSETS: assets })).text(), 'static application');
  assert.equal((await worker.fetch(new Request('https://invoices.example.com/api/extract-invoice', { method: 'POST' }), { ASSETS: assets })).status, 410);
});
test('unsupported, oversized files and missing personal keys never call the provider', async () => {
  assert.equal((await extractInvoice({ mimeType: 'image/svg+xml', fileBase64: 'AAAA' }, {})).status, 400);
  assert.equal((await extractInvoice({ mimeType: 'image/png', fileBase64: 'A'.repeat(8388612) }, {})).status, 400);
  assert.equal((await extractInvoice({ mimeType: 'image/png', fileBase64: 'AAAA' }, {})).status, 503);
});
test('provider contract returns numeric extracted rows without saving document data', async () => {
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ invoices: [{ date: '2026-10-13', sellerName: 'Test', taxNumber: '001234567890123', invoiceNumber: 'T-1', details: 'Test', currency: 'SAR', amountBeforeTax: 100, tax: 15, lastAmount: 115 }] }) }] } }] }), { headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const response = await extractInvoice({ mimeType: 'image/png', fileBase64: 'iVBORw0KGgo=', fileName: 'test.png' }, { apiKey: 'test-only-key', model: 'test-model' });
    assert.equal(response.status, 200);
    const data = await response.json() as any;
    assert.equal(data.invoices[0].taxNumber, '001234567890123');
    assert.equal(data.invoices[0].lastAmount, 115);
    assert.equal(requests, 1);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  } finally { globalThis.fetch = originalFetch; }
});
