/** One develop look per Immich asset (MVP). Stored in Immich custom metadata. */

export const EDIT_RECIPE_METADATA_KEY = 'immichroom' as const;

export type ToneSettings = {
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  /** Optional clamp for UI (Tri-X Warm) */
  contrastMin?: number;
  contrastMax?: number;
};

export type WhiteBalanceSettings = {
  /** Kelvin-ish offset mapped into matrix; 0 = as shot */
  temp: number;
  tint: number;
};

export type BwSettings = {
  enabled: boolean;
  mix: {
    red: number;
    yellow: number;
    green: number;
    cyan: number;
    blue: number;
    magenta: number;
  };
  paperTone: {
    /** 0–1 warm shift on highlights/mids */
    warmth: number;
    /** 0–1; <1 = slightly off-white paper */
    whitePoint: number;
  };
};

export type GrainSettings = {
  amount: number;
  size: number;
  roughness: number;
  linkToExposure: boolean;
};

export type DetailSettings = {
  clarity: number;
  sharpen: number;
};

export type AutoMeta = {
  engine: 'tone-v1';
  appliedAt: string;
  strength: number;
};

export type EditRecipe = {
  version: 1;
  presetId?: string | null;
  auto?: AutoMeta | null;
  tone: ToneSettings;
  wb: WhiteBalanceSettings;
  bw: BwSettings;
  detail: DetailSettings;
  grain: GrainSettings;
  updatedAt: string;
};

/** Immich metadata value wrapper (must be a JSON object). */
export type ImmichroomMetadataValue = {
  editRecipe: EditRecipe;
};
