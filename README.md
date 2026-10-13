# InvoiceGrid

A public Arabic/English invoice-to-Excel conversion desk. Reads Saudi ZATCA TLV QR codes first, then explicitly labelled native PDF text, locally in the browser. Gemini is optional: each accountant supplies their own key for unreadable pages. Only those pages go directly from the browser to Google; keys and documents never pass through this website’s server. No accounts, database or invoice archive.

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

## Local extraction and manual recovery

- PDF pages are processed individually; images and PDF QR decoding run in a background worker loaded on demand. Native PDF text is used only when its explicit fields and monetary totals are complete and consistent.
- Supported QR payloads are ZATCA Base64 TLV, not arbitrary product barcodes or invoice URLs. The app does not visit QR links or verify cryptographic signatures. QR normally omits invoice number and details; review and fill these beside the original.
- Without a key, or after provider rejection/quota exhaustion, unreadable pages remain as manual-review rows with their originals and any known fields. Unknown amounts stay blank in the table and Excel, rather than becoming zero.
- With a key, remaining pages use Gemini with bounded retries and quota backoff. A credential/quota/service failure stops further provider attempts for that batch while local extraction continues. Cancel stops remaining work.
- Multiple invoice labels in native page text are considered ambiguous and fall back to AI/manual review. Always review extracted totals; blurred or damaged QR images can still require manual entry.
- Nothing is archived. Export before closing/reloading. Loading PDF and QR libraries is deferred until uploading, keeping the initial page bundle small.
