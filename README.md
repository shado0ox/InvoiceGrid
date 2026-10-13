# InvoiceGrid

A temporary Arabic/English invoice-to-Excel conversion desk. Upload PDF/JPG/PNG/WebP files, review extracted fields against the original, and export the original nine-column template. No invoice database, accounts module, or archive. Data remains in the current browser session; documents are sent to Gemini for extraction.

## Local development

Node.js 22.12+:

```bash
npm ci
cp .env.example .env
# Set GEMINI_API_KEY in .env
npm run dev
```

## Deploy without a home server

Cloudflare Workers hosts both Vite static assets and the extraction endpoint. The endpoint requires a cryptographically verified Cloudflare Access session; keep Gemini credentials in Worker Secrets. No Orange Pi, Docker, database, or tunnel is required.

[الدليل العربي للنشر وربط الدومين](docs/cloudflare-deployment.ar.md)

```bash
npm run lint
npm test
npm run build
npx wrangler deploy --dry-run
```

Exports preserve the nine original columns. Excel uses separate worksheets for different currencies, preserving row order within each currency. Filters export only visible results. Before-leaving warnings cover unexported and subsequently edited rows; the application does not persist invoices or guarantee browser download completion.
