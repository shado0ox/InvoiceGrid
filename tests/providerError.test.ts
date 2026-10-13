import test from 'node:test';
import assert from 'node:assert/strict';
import { describeProviderError } from '../src/utils/providerError';
import { extractInvoice } from '../src/utils/extractInvoices';
test('Gemini retry information is respected and personal keys are redacted', () => {
  const result = describeProviderError({ status: 429, message: JSON.stringify({ error: { message: 'quota secret-test-key', details: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '75.2s' }] } }) }, 'secret-test-key');
  assert.equal(result.retryAfterSeconds, 76);
  assert.equal(result.message.includes('secret-test-key'), false);
});
test('a document-related INVALID_ARGUMENT is not classified as an invalid key', () => {
  const result = describeProviderError({ status: 400, message: JSON.stringify({ error: { message: 'The document has no pages', status: 'INVALID_ARGUMENT' } }) });
  assert.equal(result.invalidKey, false);
});
test('an explicit invalid-key reason is recognized', () => {
  assert.equal(describeProviderError({ status: 400, message: JSON.stringify({ error: { message: 'Request rejected', details: [{ reason: 'API_KEY_INVALID' }] } }) }).invalidKey, true);
});
test('a rejected PDF returns a file error and cannot trigger credential cancellation', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ error: { code: 400, message: 'PDF document cannot be decoded', status: 'INVALID_ARGUMENT' } }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  try {
    const response = await extractInvoice({ mimeType: 'application/pdf', fileBase64: 'JVBERi0xLjc=', fileName: 'invoice.pdf' }, { apiKey: 'test-personal-key' });
    const data: any = await response.json();
    assert.equal(response.status, 400);
    assert.equal(data.credentialError, undefined);
    assert.equal(data.retryable, false);
    assert.match(data.error, /PDF document cannot be decoded/);
  } finally { globalThis.fetch = original; }
});
