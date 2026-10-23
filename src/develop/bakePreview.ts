import { Buffer } from 'buffer';
import jpeg from 'jpeg-js';
import type { ColorMatrix5 } from './colorMatrix';
import { recipeToColorMatrix } from './colorMatrix';
import type { PixelBuffer } from './autoTone';
import type { EditRecipe } from './types';

function applyMatrix(
  r: number,
  g: number,
  b: number,
  m: ColorMatrix5,
): [number, number, number] {
  const nr = m[0] * r + m[1] * g + m[2] * b + m[4] * 255;
  const ng = m[5] * r + m[6] * g + m[7] * b + m[9] * 255;
  const nb = m[10] * r + m[11] * g + m[12] * b + m[14] * 255;
  return [
    Math.max(0, Math.min(255, nr)),
    Math.max(0, Math.min(255, ng)),
    Math.max(0, Math.min(255, nb)),
  ];
}

/** Deterministic tiny hash noise for grain preview */
function grainNoise(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 45.164) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * Bake an EditRecipe onto pixels → JPEG data URI for cross-platform preview.
 * Downscales if needed for responsiveness.
 */
export function bakePreviewDataUri(
  source: PixelBuffer,
  recipe: EditRecipe,
  options: { maxEdge?: number; quality?: number } = {},
): string {
  const maxEdge = options.maxEdge ?? 720;
  const quality = options.quality ?? 0.85;
  const scale = Math.min(1, maxEdge / Math.max(source.width, source.height));
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));
  const out = Buffer.alloc(width * height * 4);
  const m = recipeToColorMatrix(recipe);
  const grainAmt = recipe.grain.amount / 100;
  const seed = recipe.grain.linkToExposure
    ? 1 + Math.abs(recipe.tone.exposure)
    : 1;

  for (let y = 0; y < height; y++) {
    const sy = Math.min(source.height - 1, Math.floor(y / scale));
    for (let x = 0; x < width; x++) {
      const sx = Math.min(source.width - 1, Math.floor(x / scale));
      const si = (sy * source.width + sx) * 4;
      const r = source.data[si];
      const g = source.data[si + 1];
      const b = source.data[si + 2];
      const a = source.data[si + 3] ?? 255;
      let [nr, ng, nb] = applyMatrix(r, g, b, m);
      if (grainAmt > 0) {
        const n = (grainNoise(x, y, seed) - 0.5) * 255 * grainAmt;
        nr = Math.max(0, Math.min(255, nr + n));
        ng = Math.max(0, Math.min(255, ng + n));
        nb = Math.max(0, Math.min(255, nb + n));
      }
      const di = (y * width + x) * 4;
      out[di] = nr;
      out[di + 1] = ng;
      out[di + 2] = nb;
      out[di + 3] = a;
    }
  }

  const encoded = jpeg.encode(
    { data: out, width, height },
    Math.round(quality * 100),
  );
  return `data:image/jpeg;base64,${Buffer.from(encoded.data).toString('base64')}`;
}
