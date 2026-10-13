import jsQR from 'jsqr';
/** Return QR payloads only; never follow URLs embedded in an untrusted QR. */
export function scanQRPixels(pixels: Uint8ClampedArray, width: number, height: number): string[] {
  const data = pixels.slice();
  const results: string[] = [];
  for (let index = 0; index < 6; index++) {
    const code = jsQR(data, width, height, { inversionAttempts: 'attemptBoth' });
    if (!code) break;
    if (!results.includes(code.data)) results.push(code.data);
    const corners = [code.location.topLeftCorner, code.location.topRightCorner, code.location.bottomLeftCorner, code.location.bottomRightCorner];
    const left = Math.max(0, Math.floor(Math.min(...corners.map(point => point.x))) - 4);
    const right = Math.min(width, Math.ceil(Math.max(...corners.map(point => point.x))) + 4);
    const top = Math.max(0, Math.floor(Math.min(...corners.map(point => point.y))) - 4);
    const bottom = Math.min(height, Math.ceil(Math.max(...corners.map(point => point.y))) + 4);
    for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) {
      const offset = (y * width + x) * 4;
      data[offset] = data[offset + 1] = data[offset + 2] = data[offset + 3] = 255;
    }
  }
  return results;
}
