import { createRemoteJWKSet, jwtVerify } from 'jose';
import { extractInvoice, json, type ExtractEnv } from './extract';
export interface Env extends ExtractEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
}
const keys = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
export async function authorized(request: Request, env: Env): Promise<boolean> {
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return false;
  if (!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(env.ACCESS_TEAM_DOMAIN)) return false;
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return false;
  const issuer = `https://${env.ACCESS_TEAM_DOMAIN}`;
  try {
    let jwks = keys.get(issuer);
    if (!jwks) { jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`)); keys.set(issuer, jwks); }
    await jwtVerify(token, jwks, { issuer, audience: env.ACCESS_AUD, algorithms: ['RS256'] });
    return true;
  } catch { return false; }
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return json({ error: 'جهّز Cloudflare Access لحماية خدمة قراءة الفواتير.' }, 503);
    if (!await authorized(request, env)) return json({ error: 'انتهت جلسة الدخول. افتح التطبيق من الدومين المحمي وسجّل الدخول.' }, 401);
    if (url.pathname === '/api/health' && request.method === 'GET') return json({ status: 'ok' });
    if (url.pathname !== '/api/extract-invoice') return json({ error: 'Not found' }, 404);
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'JSON required' }, 415);
    // Read a bounded stream: Content-Length is not trusted and chunked uploads are also bounded.
    const reader = request.body?.getReader();
    if (!reader) return json({ error: 'Empty request' }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 9 * 1024 * 1024) { await reader.cancel(); return json({ error: 'File too large' }, 413); }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      return await extractInvoice(JSON.parse(new TextDecoder().decode(bytes)), env);
    } catch { return json({ error: 'Invalid request' }, 400); }
  },
};
