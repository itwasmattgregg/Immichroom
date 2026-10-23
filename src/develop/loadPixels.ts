import { Buffer } from 'buffer';
import jpeg from 'jpeg-js';
import { Platform } from 'react-native';
import type { PixelBuffer } from './autoTone';

/**
 * Decode Immich preview/thumbnail bytes into RGBA pixels for Auto Tone.
 * Prefers JPEG decode (Immich thumbs are typically JPEG).
 */
export async function loadPixelsFromUrl(
  url: string,
  headers: Record<string, string>,
): Promise<PixelBuffer> {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch preview (${response.status})`);
  }
  const mime = response.headers.get('content-type') ?? '';
  const buffer = await response.arrayBuffer();

  if (mime.includes('jpeg') || mime.includes('jpg') || isJpeg(buffer)) {
    return decodeJpeg(buffer);
  }

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return decodeWithBrowserCanvas(buffer, mime || 'image/jpeg');
  }

  // Last resort: try JPEG decode anyway (many servers omit content-type)
  try {
    return decodeJpeg(buffer);
  } catch {
    throw new Error(
      `Unsupported preview format for Auto Tone (${mime || 'unknown'}). Need JPEG preview.`,
    );
  }
}

function isJpeg(buffer: ArrayBuffer): boolean {
  const u = new Uint8Array(buffer);
  return u.length > 2 && u[0] === 0xff && u[1] === 0xd8;
}

function decodeJpeg(buffer: ArrayBuffer): PixelBuffer {
  const decoded = jpeg.decode(Buffer.from(buffer), { useTArray: true });
  return {
    width: decoded.width,
    height: decoded.height,
    data: decoded.data as Uint8Array,
  };
}

async function decodeWithBrowserCanvas(
  buffer: ArrayBuffer,
  mime: string,
): Promise<PixelBuffer> {
  const blob = new Blob([buffer], { type: mime });
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  const maxEdge = 512;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return {
    width: imageData.width,
    height: imageData.height,
    data: imageData.data,
  };
}
