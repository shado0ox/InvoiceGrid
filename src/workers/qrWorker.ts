import { scanQRPixels } from '../utils/qrPixels';
self.onmessage = event => {
  const { data, width, height } = event.data;
  try { self.postMessage({ values: scanQRPixels(new Uint8ClampedArray(data), width, height) }); }
  catch { self.postMessage({ values: [] }); }
};
