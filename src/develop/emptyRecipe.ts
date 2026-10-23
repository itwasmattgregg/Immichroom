import type { EditRecipe } from './types';

export function createEmptyEditRecipe(): EditRecipe {
  return {
    version: 1,
    presetId: null,
    auto: null,
    tone: {
      exposure: 0,
      contrast: 0,
      highlights: 0,
      shadows: 0,
      whites: 0,
      blacks: 0,
    },
    wb: { temp: 0, tint: 0 },
    bw: {
      enabled: false,
      mix: { red: 40, yellow: 60, green: 40, cyan: 60, blue: 20, magenta: 80 },
      paperTone: { warmth: 0, whitePoint: 1 },
    },
    detail: { clarity: 0, sharpen: 0 },
    grain: { amount: 0, size: 25, roughness: 40, linkToExposure: false },
    updatedAt: new Date().toISOString(),
  };
}

export function touchRecipe(recipe: EditRecipe): EditRecipe {
  return { ...recipe, updatedAt: new Date().toISOString() };
}
