import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { authorized, type Env } from '../worker/index';
import { extractInvoice } from '../worker/extract';
const assets = { fetch: async () => new Response('static application') };
test('assets are served without spending a Gemini call; API fails closed until Access is configured', async () => {
  assert.equal(await (await worker.fetch(new Request('https://invoices.example.com/'), { ASSETS: assets })).text(), 'static application');
  assert.equal((await worker.fetch(new Request('https://invoices.example.com/api/extract-invoice', { method: 'POST' }), { ASSETS: assets })).status, 503);
});
test('direct requests and forged Access assertions cannot use the OCR API', async () => {
  const env: Env = { ASSETS: assets, ACCESS_TEAM_DOMAIN: 'test.cloudflareaccess.com', ACCESS_AUD: 'test' };
  const request = new Request('https://invoices.example.com/api/extract-invoice', { method: 'POST' });
  assert.equal((await worker.fetch(request, env)).status, 401);
  assert.equal(await authorized(new Request(request, { headers: { 'Cf-Access-Jwt-Assertion': 'forged.token.signature' } }), env), false);
});
test('extraction rejects unsupported files and oversized payloads before contacting the provider', async () => {
  assert.equal((await extractInvoice({ mimeType: 'image/svg+xml', fileBase64: 'AAAA' }, {})).status, 400);
  assert.equal((await extractInvoice({ mimeType: 'image/png', fileBase64: 'A'.repeat(8388612) }, {})).status, 400);
  assert.equal((await extractInvoice({ mimeType: 'image/png', fileBase64: 'AAAA' }, {})).status, 503);
});

test('Access verifies signature, audience, issuer and expiration for validly signed tokens', async () => {
  const { generateKeyPair, exportJWK, SignJWT } = await import('jose');
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const jwk = { ...await exportJWK(publicKey), kid: 'test-key', alg: 'RS256', use: 'sig' };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ keys: [jwk] }), { headers: { 'content-type': 'application/json' } });
  const env: Env = { ASSETS: assets, ACCESS_TEAM_DOMAIN: 'signed-test.cloudflareaccess.com', ACCESS_AUD: 'invoicegrid-audience' };
  const make = async (audience: string, issuer: string, expires: number) => new SignJWT({}).setProtectedHeader({ alg: 'RS256', kid: 'test-key' }).setAudience(audience).setIssuer(issuer).setIssuedAt().setExpirationTime(expires).sign(privateKey);
  const request = (token: string) => new Request('https://invoices.example.com/api/health', { headers: { 'Cf-Access-Jwt-Assertion': token } });
  const now = Math.floor(Date.now() / 1000);
  const issuer = 'https://signed-test.cloudflareaccess.com';
  try {
    assert.equal(await authorized(request(await make(env.ACCESS_AUD!, issuer, now + 60)), env), true);
    assert.equal(await authorized(request(await make('wrong-audience', issuer, now + 60)), env), false);
    assert.equal(await authorized(request(await make(env.ACCESS_AUD!, 'https://wrong-issuer', now + 60)), env), false);
    assert.equal(await authorized(request(await make(env.ACCESS_AUD!, issuer, now - 60)), env), false);
  } finally { globalThis.fetch = originalFetch; }
});

test('provider contract returns numeric extracted rows without saving document data', async () => {
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ invoices: [{ date: '2026-10-13', sellerName: 'Test', taxNumber: '001234567890123', invoiceNumber: 'T-1', details: 'Test', currency: 'SAR', amountBeforeTax: 100, tax: 15, lastAmount: 115 }] }) }] } }] }), { headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const response = await extractInvoice({ mimeType: 'image/png', fileBase64: 'iVBORw0KGgo=', fileName: 'test.png' }, { GEMINI_API_KEY: 'test-only-key', GEMINI_MODEL: 'test-model' });
    assert.equal(response.status, 200);
    const data = await response.json() as any;
    assert.equal(data.invoices[0].taxNumber, '001234567890123');
    assert.equal(data.invoices[0].lastAmount, 115);
    assert.equal(requests, 1);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  } finally { globalThis.fetch = originalFetch; }
});
