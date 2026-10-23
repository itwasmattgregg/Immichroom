import type { EditRecipe } from './types';

/** 4×5 color matrix (row-major) for react-native-color-matrix-image-filters / CSS. */
export type ColorMatrix5 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

const IDENTITY: ColorMatrix5 = [
  1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0,
];

function multiply(a: ColorMatrix5, b: ColorMatrix5): ColorMatrix5 {
  const out = new Array(20).fill(0) as number[];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      out[row * 5 + col] =
        a[row * 5 + 0] * b[0 * 5 + col] +
        a[row * 5 + 1] * b[1 * 5 + col] +
        a[row * 5 + 2] * b[2 * 5 + col] +
        a[row * 5 + 3] * b[3 * 5 + col] +
        (col === 4 ? a[row * 5 + 4] : 0);
    }
  }
  return out as ColorMatrix5;
}

function exposureMatrix(stops: number): ColorMatrix5 {
  const f = Math.pow(2, stops);
  return [f, 0, 0, 0, 0, 0, f, 0, 0, 0, 0, 0, f, 0, 0, 0, 0, 0, 1, 0];
}

/** contrast around mid-gray 0.5; amount roughly -100..100 mapped */
function contrastMatrix(amount: number): ColorMatrix5 {
  const c = 1 + amount / 100;
  const t = 0.5 * (1 - c);
  return [c, 0, 0, 0, t, 0, c, 0, 0, t, 0, 0, c, 0, t, 0, 0, 0, 1, 0];
}

function wbMatrix(temp: number, tint: number): ColorMatrix5 {
  // Small channel gains from temp/tint offsets
  const r = 1 + temp / 2000 - tint / 4000;
  const g = 1 + tint / 4000;
  const b = 1 - temp / 2000 - tint / 4000;
  return [r, 0, 0, 0, 0, 0, g, 0, 0, 0, 0, 0, b, 0, 0, 0, 0, 0, 1, 0];
}

function bwMatrix(recipe: EditRecipe): ColorMatrix5 {
  const { mix, paperTone } = recipe.bw;
  const sum =
    mix.red + mix.yellow + mix.green + mix.cyan + mix.blue + mix.magenta || 1;
  // Approximate channel weights from mix
  const wr = (mix.red + mix.yellow * 0.5 + mix.magenta * 0.5) / sum;
  const wg = (mix.green + mix.yellow * 0.5 + mix.cyan * 0.5) / sum;
  const wb = (mix.blue + mix.cyan * 0.5 + mix.magenta * 0.5) / sum;
  const norm = wr + wg + wb || 1;
  const r = wr / norm;
  const g = wg / norm;
  const b = wb / norm;

  // Warm paper: lift R, slightly lift G, pull B; scale by whitePoint
  const warm = paperTone.warmth;
  const wp = paperTone.whitePoint;
  const rr = r * wp * (1 + warm * 0.15);
  const gg = g * wp * (1 + warm * 0.05);
  const bb = b * wp * (1 - warm * 0.1);
  const bias = warm * 0.02;

  return [
    rr,
    gg,
    bb,
    0,
    bias,
    rr,
    gg,
    bb,
    0,
    bias * 0.7,
    rr,
    gg,
    bb,
    0,
    bias * 0.2,
    0,
    0,
    0,
    1,
    0,
  ];
}

/** Highlights/shadows as soft channel bias (preview approximation). */
function toneBiasMatrix(recipe: EditRecipe): ColorMatrix5 {
  const h = recipe.tone.highlights / 400;
  const s = recipe.tone.shadows / 400;
  const w = recipe.tone.whites / 500;
  const k = recipe.tone.blacks / 500;
  const lift = s - k;
  const gain = 1 + w - h;
  return [
    gain,
    0,
    0,
    0,
    lift,
    0,
    gain,
    0,
    0,
    lift,
    0,
    0,
    gain,
    0,
    lift,
    0,
    0,
    0,
    1,
    0,
  ];
}

/** Build an approximate preview matrix from an EditRecipe. Grain is not in the matrix. */
export function recipeToColorMatrix(recipe: EditRecipe): ColorMatrix5 {
  let m: ColorMatrix5 = IDENTITY;
  m = multiply(exposureMatrix(recipe.tone.exposure), m);
  m = multiply(wbMatrix(recipe.wb.temp, recipe.wb.tint), m);
  m = multiply(contrastMatrix(recipe.tone.contrast), m);
  m = multiply(toneBiasMatrix(recipe), m);
  if (recipe.bw.enabled) {
    m = multiply(bwMatrix(recipe), m);
  }
  return m;
}

export function identityColorMatrix(): ColorMatrix5 {
  return IDENTITY.slice() as ColorMatrix5;
}
