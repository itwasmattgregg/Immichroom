import { createEmptyEditRecipe, touchRecipe } from '../emptyRecipe';
import type { EditRecipe } from '../types';

export const BUILTIN_TRI_X_WARM_ID = 'builtin.tri-x-warm' as const;

/**
 * Tri-X Warm — original IMMICHROOM built-in.
 * Warm documentary mono; constrained contrast; exposure-linked grain; no sharpening.
 * Not a Leica LUX / Greg Williams clone.
 */
export function createTriXWarmRecipe(overrides?: Partial<EditRecipe>): EditRecipe {
  const base = createEmptyEditRecipe();
  return touchRecipe({
    ...base,
    auto: null,
    bw: {
      enabled: true,
      mix: { red: 25, yellow: 18, green: 12, cyan: 8, blue: 8, magenta: 12 },
      paperTone: { warmth: 0.12, whitePoint: 0.96 },
    },
    tone: {
      exposure: 0.05,
      contrast: 18,
      contrastMin: 8,
      contrastMax: 28,
      highlights: -12,
      shadows: 8,
      whites: -5,
      blacks: -8,
    },
    wb: { temp: 0, tint: 0 },
    detail: { clarity: 0, sharpen: 0 },
    grain: { amount: 28, size: 25, roughness: 40, linkToExposure: true },
    ...overrides,
    version: 1,
    presetId: BUILTIN_TRI_X_WARM_ID,
  });
}

export function clampTriXWarmContrast(contrast: number): number {
  return Math.min(28, Math.max(8, contrast));
}
