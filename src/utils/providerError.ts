/** Only expose a bounded provider message; never expose a supplied personal key. */
export function describeProviderError(error: any, apiKey = '') {
  let payload: any = error?.error || {};
  if (typeof error?.message === 'string') {
    try { const parsed = JSON.parse(error.message); payload = parsed.error || parsed; } catch { /* plain SDK error */ }
  }
  const status = Number(error?.status || error?.statusCode || payload?.code) || 502;
  let message = String(payload?.message || error?.message || '');
  if (apiKey) message = message.split(apiKey).join('[REDACTED]');
  message = message.replace(/AIza[\w-]+/g, '[REDACTED]').replace(/([?&](?:key|api_key)=)[^&\s]+/gi, '$1[REDACTED]').slice(0, 600);
  const details = Array.isArray(payload?.details) ? payload.details : [];
  const invalidKey = details.some((item: any) => item?.reason === 'API_KEY_INVALID') || /API_KEY_INVALID|API key not valid|invalid api key/i.test(message);
  const retryInfo = details.find((item: any) => String(item?.['@type'] || '').endsWith('google.rpc.RetryInfo'));
  const delay = Number.parseFloat(String(retryInfo?.retryDelay || ''));
  return { status, message, invalidKey, retryAfterSeconds: Number.isFinite(delay) && delay >= 0 ? Math.min(300, Math.max(1, Math.ceil(delay))) : 60 };
}
