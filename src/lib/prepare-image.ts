import { MAX_UPLOAD_BYTES, MAX_UPLOAD_DIMENSION } from "./analyse-config";

export class PrepareImageError extends Error {}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Make the screenshot small enough to send. Screenshots that already fit are sent
 * untouched; otherwise they're downscaled/re-encoded in the browser (never cropped).
 */
export async function prepareImageForUpload(file: File, width: number, height: number): Promise<File> {
  const longest = Math.max(width, height);
  if (file.size <= MAX_UPLOAD_BYTES && longest <= MAX_UPLOAD_DIMENSION) return file;

  const scale = Math.min(1, MAX_UPLOAD_DIMENSION / longest);
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new PrepareImageError("The screenshot couldn't be prepared for analysis.");
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new PrepareImageError("The screenshot couldn't be prepared for analysis.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  for (const [type, q] of [["image/png"], ["image/jpeg", 0.9], ["image/jpeg", 0.8], ["image/jpeg", 0.7]] as const) {
    const blob = await toBlob(canvas, type, q);
    if (blob && blob.size <= MAX_UPLOAD_BYTES) return new File([blob], "screenshot", { type });
  }
  throw new PrepareImageError("The screenshot is too large to send, even after resizing. Try capturing a smaller area.");
}
