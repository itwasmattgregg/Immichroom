import { createEmptyEditRecipe, touchRecipe } from './emptyRecipe';
import type { EditRecipe } from './types';

export type PixelBuffer = {
  width: number;
  height: number;
  /** RGBA */
  data: Uint8ClampedArray | Uint8Array;
};

function luminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Histogram Auto Tone v1.
 * Targets mid-gray, gently expands contrast, pulls highlights/shadows, mild WB.
 */
export function computeAutoToneRecipe(
  pixels: PixelBuffer,
  strength = 1,
): EditRecipe {
  const { data, width, height } = pixels;
  const hist = new Array(256).fill(0) as number[];
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let count = 0;

  // Subsample for speed
  const step = Math.max(1, Math.floor(Math.sqrt((width * height) / 20000)));
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a < 16) continue;
      hist[Math.round(luminance(r, g, b))]++;
      rSum += r;
      gSum += g;
      bSum += b;
      count++;
    }
  }

  if (count === 0) {
    return touchRecipe({
      ...createEmptyEditRecipe(),
      auto: { engine: 'tone-v1', appliedAt: new Date().toISOString(), strength },
    });
  }

  const total = hist.reduce((a, b) => a + b, 0);
  let cum = 0;
  let p5 = 0;
  let p50 = 128;
  let p95 = 255;
  for (let i = 0; i < 256; i++) {
    cum += hist[i];
    if (cum >= total * 0.05 && p5 === 0) p5 = i;
    if (cum >= total * 0.5) {
      p50 = i;
      break;
    }
  }
  cum = 0;
  for (let i = 255; i >= 0; i--) {
    cum += hist[i];
    if (cum >= total * 0.05) {
      p95 = i;
      break;
    }
  }

  const mid = p50 / 255;
  // Exposure toward ~0.45 mid-gray (in stops, rough)
  let exposure = Math.log2(0.45 / Math.max(0.05, mid));
  exposure = Math.max(-1.2, Math.min(1.2, exposure)) * strength;

  const spread = (p95 - p5) / 255;
  let contrast = (0.55 - spread) * 80;
  contrast = Math.max(-20, Math.min(35, contrast)) * strength;

  let highlights = 0;
  let shadows = 0;
  if (p95 > 230) highlights = -((p95 - 230) / 25) * 30 * strength;
  if (p5 < 25) shadows = ((25 - p5) / 25) * 25 * strength;

  const rAvg = rSum / count;
  const gAvg = gSum / count;
  const bAvg = bSum / count;
  const gray = (rAvg + gAvg + bAvg) / 3;
  // temp >0 = warmer (more R); tint >0 = greener
  let temp = ((rAvg - bAvg) / Math.max(1, gray)) * -400;
  let tint = ((gAvg - (rAvg + bAvg) / 2) / Math.max(1, gray)) * -300;
  temp = Math.max(-400, Math.min(400, temp)) * strength * 0.5;
  tint = Math.max(-150, Math.min(150, tint)) * strength * 0.5;

  return touchRecipe({
    ...createEmptyEditRecipe(),
    presetId: null,
    auto: {
      engine: 'tone-v1',
      appliedAt: new Date().toISOString(),
      strength,
    },
    tone: {
      exposure: round2(exposure),
      contrast: round2(contrast),
      highlights: round2(highlights),
      shadows: round2(shadows),
      whites: round2(highlights * 0.3),
      blacks: round2(-shadows * 0.2),
    },
    wb: { temp: round2(temp), tint: round2(tint) },
    detail: { clarity: round2(4 * strength), sharpen: 0 },
    grain: { amount: 0, size: 25, roughness: 40, linkToExposure: false },
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
