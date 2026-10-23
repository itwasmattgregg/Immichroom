use crate::recipe::EditRecipe;

/// 4×5 row-major color matrix for preview / GPU later.
pub type ColorMatrix5 = [f32; 20];

pub const IDENTITY: ColorMatrix5 = [
    1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0,
    1.0, 0.0,
];

fn multiply(a: ColorMatrix5, b: ColorMatrix5) -> ColorMatrix5 {
    let mut out = [0.0; 20];
    for row in 0..4 {
        for col in 0..5 {
            let mut v = a[row * 5] * b[col]
                + a[row * 5 + 1] * b[5 + col]
                + a[row * 5 + 2] * b[10 + col]
                + a[row * 5 + 3] * b[15 + col];
            if col == 4 {
                v += a[row * 5 + 4];
            }
            out[row * 5 + col] = v;
        }
    }
    out
}

fn exposure_matrix(stops: f32) -> ColorMatrix5 {
    let f = 2f32.powf(stops);
    [f, 0.0, 0.0, 0.0, 0.0, 0.0, f, 0.0, 0.0, 0.0, 0.0, 0.0, f, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0]
}

fn contrast_matrix(amount: f32) -> ColorMatrix5 {
    let c = 1.0 + amount / 100.0;
    let t = 0.5 * (1.0 - c);
    [c, 0.0, 0.0, 0.0, t, 0.0, c, 0.0, 0.0, t, 0.0, 0.0, c, 0.0, t, 0.0, 0.0, 0.0, 1.0, 0.0]
}

fn wb_matrix(temp: f32, tint: f32) -> ColorMatrix5 {
    let r = 1.0 + temp / 2000.0 - tint / 4000.0;
    let g = 1.0 + tint / 4000.0;
    let b = 1.0 - temp / 2000.0 - tint / 4000.0;
    [r, 0.0, 0.0, 0.0, 0.0, 0.0, g, 0.0, 0.0, 0.0, 0.0, 0.0, b, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0]
}

fn tone_bias_matrix(recipe: &EditRecipe) -> ColorMatrix5 {
    let h = recipe.tone.highlights / 400.0;
    let s = recipe.tone.shadows / 400.0;
    let w = recipe.tone.whites / 500.0;
    let k = recipe.tone.blacks / 500.0;
    let lift = s - k;
    let gain = 1.0 + w - h;
    [
        gain, 0.0, 0.0, 0.0, lift, 0.0, gain, 0.0, 0.0, lift, 0.0, 0.0, gain, 0.0, lift, 0.0, 0.0,
        0.0, 1.0, 0.0,
    ]
}

fn bw_matrix(recipe: &EditRecipe) -> ColorMatrix5 {
    let mix = &recipe.bw.mix;
    let sum = mix.red + mix.yellow + mix.green + mix.cyan + mix.blue + mix.magenta;
    let sum = if sum == 0.0 { 1.0 } else { sum };
    let wr = (mix.red + mix.yellow * 0.5 + mix.magenta * 0.5) / sum;
    let wg = (mix.green + mix.yellow * 0.5 + mix.cyan * 0.5) / sum;
    let wb = (mix.blue + mix.cyan * 0.5 + mix.magenta * 0.5) / sum;
    let norm = wr + wg + wb;
    let norm = if norm == 0.0 { 1.0 } else { norm };
    let r = wr / norm;
    let g = wg / norm;
    let b = wb / norm;
    let warm = recipe.bw.paper_tone.warmth;
    let wp = recipe.bw.paper_tone.white_point;
    let rr = r * wp * (1.0 + warm * 0.15);
    let gg = g * wp * (1.0 + warm * 0.05);
    let bb = b * wp * (1.0 - warm * 0.1);
    let bias = warm * 0.02;
    [
        rr,
        gg,
        bb,
        0.0,
        bias,
        rr,
        gg,
        bb,
        0.0,
        bias * 0.7,
        rr,
        gg,
        bb,
        0.0,
        bias * 0.2,
        0.0,
        0.0,
        0.0,
        1.0,
        0.0,
    ]
}

pub fn recipe_to_color_matrix(recipe: &EditRecipe) -> ColorMatrix5 {
    let mut m = IDENTITY;
    m = multiply(exposure_matrix(recipe.tone.exposure), m);
    m = multiply(wb_matrix(recipe.wb.temp, recipe.wb.tint), m);
    m = multiply(contrast_matrix(recipe.tone.contrast), m);
    m = multiply(tone_bias_matrix(recipe), m);
    if recipe.bw.enabled {
        m = multiply(bw_matrix(recipe), m);
    }
    m
}
