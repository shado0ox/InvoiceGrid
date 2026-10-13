import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { extractInvoice } from './worker/extract';
dotenv.config();
const directory = path.dirname(fileURLToPath(import.meta.url));
async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '9mb' }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.post('/api/extract-invoice', async (req, res) => {
    const response = await extractInvoice(req.body, process.env);
    res.status(response.status).set('Cache-Control', 'no-store').type('json').send(await response.text());
  });
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
