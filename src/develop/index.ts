/**
 * Develop / edit module stub.
 * Phase 1 will host EditRecipe, Auto Tone, and Tri-X Warm here.
 * Do not add Immich metadata writes in this scaffold.
 */

export type EditRecipeStub = {
  version: 1;
  presetId?: string | null;
};

/** Placeholder — real develop engine lands in Phase 1. */
export function createEmptyEditRecipe(): EditRecipeStub {
  return { version: 1, presetId: null };
}

export const BUILTIN_TRI_X_WARM_ID = 'builtin.tri-x-warm' as const;
