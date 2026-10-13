import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.all('/api/*', (_req, res) => res.status(410).set('Cache-Control', 'no-store').json({ error: 'Extraction runs directly in your browser with your own key.' }));
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(directory, 'dist')));
    app.get('*', (_req, res) => res.sendFile(path.resolve(directory, 'dist/index.html')));
  } else {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }
  const port = Number(process.env.PORT || 3000);
  app.listen(port, '127.0.0.1', () => console.log(`InvoiceGrid local server: http://127.0.0.1:${port}`));
}
startServer();
