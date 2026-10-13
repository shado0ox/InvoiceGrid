# InvoiceGrid

A public Arabic/English invoice-to-Excel conversion desk. Every accountant supplies their own Gemini key for the current session. Extraction goes directly from the browser to Google; keys and documents never pass through this website’s server. No accounts, database or invoice archive.

Upload PDF/JPG/PNG/WebP up to 6 MB, compare editable fields with the original, and export the original nine-column template. Excel groups currencies into worksheets; CSV/clipboard require a single currency. Filters export visible rows. Download before closing the temporary session.

## Run locally (Node.js 22.12+)

```bash
npm ci
npm run dev
```

No server AI key is needed. Users configure their key in the browser. Keys and invoices are not stored in localStorage; reload clears the session.

## Public deployment without Orange Pi

Cloudflare Workers Static Assets serves the frontend. No Gemini secrets, Cloudflare Access, database, Docker or tunnel are required. The old server extraction endpoint is disabled and returns 410.

[دليل النشر العام وربط الدومين](docs/cloudflare-deployment.ar.md)

```bash
npm run lint
npm test
npm run build
npx wrangler deploy --dry-run
```

Provider quotas, charges and document processing policies belong to each user's Google account. Actual provider credentials and deployment must be tested separately; automated extraction tests use mocked responses.
