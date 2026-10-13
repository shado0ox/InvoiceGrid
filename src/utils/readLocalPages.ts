import { completeTextInvoice, decodeInvoiceQR, parseInvoiceText, type LocalInvoice } from './localInvoice';
export interface InvoicePage {
  pageNumber: number;
  rows: LocalInvoice[];
  partial: LocalInvoice;
  imageBase64: string;
}
function check(signal: AbortSignal) { if (signal.aborted) throw new DOMException('Cancelled', 'AbortError'); }
const failedWorkers = new WeakSet<Worker>();
async function scanCanvas(canvas: HTMLCanvasElement, worker: Worker, signal: AbortSignal) {
  check(signal);
  if (failedWorkers.has(worker)) return [];
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return new Promise<string[]>((resolve, reject) => {
    const abort = () => { cleanup(); reject(new DOMException('Cancelled', 'AbortError')); };
    const onMessage = (event: MessageEvent) => { cleanup(); resolve(event.data.values || []); };
    const onError = () => { failedWorkers.add(worker); worker.terminate(); cleanup(); resolve([]); };
    // A blocked/missing worker must allow PDF text, AI and manual fallbacks.
    const timeout = setTimeout(onError, 15000);
    const cleanup = () => { clearTimeout(timeout); signal.removeEventListener('abort', abort); worker.removeEventListener('message', onMessage); worker.removeEventListener('error', onError); };
    check(signal); signal.addEventListener('abort', abort, { once: true }); worker.addEventListener('message', onMessage); worker.addEventListener('error', onError);
    worker.postMessage({ data: pixels.data.buffer, width: pixels.width, height: pixels.height }, [pixels.data.buffer]);
  });
}
async function recognize(canvas: HTMLCanvasElement, text: string, worker: Worker, signal: AbortSignal, pageNumber: number): Promise<InvoicePage> {
  const partial = parseInvoiceText(text);
  let values = await scanCanvas(canvas, worker, signal);
  // Crop corners when a small footer/header code is missed in a full-page scan.
  if (!values.some(value => decodeInvoiceQR(value))) {
    const crop = document.createElement('canvas'); crop.width = Math.ceil(canvas.width / 2); crop.height = Math.ceil(canvas.height / 2);
    for (const [x, y] of [[0,0], [canvas.width-crop.width,0], [0,canvas.height-crop.height], [canvas.width-crop.width,canvas.height-crop.height]]) {
      check(signal); crop.getContext('2d')!.drawImage(canvas, x, y, crop.width, crop.height, 0, 0, crop.width, crop.height);
      values.push(...await scanCanvas(crop, worker, signal));
    }
    crop.width = crop.height = 0;
  }
  // Some searchable PDFs include the literal TLV Base64 payload as text.
  values.push(...(text.match(/[A-Za-z0-9+/]{60,8192}={0,2}/g) || []));
  let rows = [...new Set(values)].map(decodeInvoiceQR).filter((row): row is LocalInvoice => !!row);
  if (rows.length === 1) rows = rows.map(row => ({ ...row, invoiceNumber: partial.invoiceNumber || '', details: partial.details || '' }));
  if (!rows.length && completeTextInvoice(partial)) rows = [partial];
  check(signal);
  return { pageNumber, rows, partial, imageBase64: rows.length ? '' : canvas.toDataURL('image/jpeg', .9).split(',')[1] };
}
export async function* readLocalPages(file: File, signal: AbortSignal, progress: (page: number, total: number) => void): AsyncGenerator<InvoicePage> {
  const worker = new Worker(new URL('../workers/qrWorker.ts', import.meta.url), { type: 'module' });
  worker.addEventListener('error', () => { failedWorkers.add(worker); worker.terminate(); });
  let loading: any;
  const abort = () => { worker.terminate(); loading?.destroy(); };
  signal.addEventListener('abort', abort, { once: true });
  try {
    check(signal);
    if (file.type === 'application/pdf') {
      const pdfjs = await import('pdfjs-dist');
      const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
      check(signal);
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      loading = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), useSystemFonts: true });
      const pdf = await loading.promise;
      for (let number = 1; number <= pdf.numPages; number++) {
        check(signal); progress(number, pdf.numPages);
        const page = await pdf.getPage(number);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: Math.min(2.5, 2200 / Math.max(base.width, base.height)) });
        const canvas = document.createElement('canvas'); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
        const render = page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport });
        const cancel = () => render.cancel(); signal.addEventListener('abort', cancel, { once: true });
        try {
          await render.promise;
          const content = await page.getTextContent();
          const text = content.items.map((item: any) => item.str ? item.str + (item.hasEOL ? '\n' : ' ') : '').join('');
          yield await recognize(canvas, text, worker, signal, number);
        } finally { signal.removeEventListener('abort', cancel); canvas.width = canvas.height = 0; page.cleanup(); }
      }
    } else {
      progress(1, 1);
      const url = URL.createObjectURL(file);
      const image = new Image(); image.src = url;
      try {
        await image.decode(); check(signal);
        const scale = Math.min(1, 2200 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas'); canvas.width = Math.ceil(image.naturalWidth * scale); canvas.height = Math.ceil(image.naturalHeight * scale);
        canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
        try { yield await recognize(canvas, '', worker, signal, 1); }
        finally { canvas.width = canvas.height = 0; }
      } finally { URL.revokeObjectURL(url); }
    }
  } finally { signal.removeEventListener('abort', abort); worker.terminate(); await loading?.destroy(); }
}
