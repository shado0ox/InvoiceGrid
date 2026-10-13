export interface Env { ASSETS: { fetch(request: Request): Promise<Response> }; }
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'Extraction runs directly in your browser with your own key.' }), { status: 410, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }
    return env.ASSETS.fetch(request);
  },
};
