use chrono::Utc;

use crate::recipe::{AutoMeta, EditRecipe};

fn luminance(r: f32, g: f32, b: f32) -> f32 {
    0.2126 * r + 0.7152 * g + 0.0722 * b
}

fn round2(n: f32) -> f32 {
    (n * 100.0).round() / 100.0
}

/// Histogram Auto Tone v1 — same intent as the TS engine, in Rust.
pub fn compute_auto_tone_recipe(
    width: u32,
    height: u32,
    rgba: &[u8],
    strength: f32,
) -> EditRecipe {
    debug_assert_eq!(rgba.len(), (width * height * 4) as usize);

    let mut hist = [0u32; 256];
    let mut r_sum = 0f64;
    let mut g_sum = 0f64;
    let mut b_sum = 0f64;
    let mut count = 0u32;

    let pixels = (width * height) as f32;
    let step = ((pixels / 20_000.0).sqrt().floor() as u32).max(1);

    for y in (0..height).step_by(step as usize) {
        for x in (0..width).step_by(step as usize) {
            let i = ((y * width + x) * 4) as usize;
            let r = rgba[i] as f32;
            let g = rgba[i + 1] as f32;
            let b = rgba[i + 2] as f32;
            let a = rgba[i + 3];
            if a < 16 {
                continue;
            }
            let lum = luminance(r, g, b).round().clamp(0.0, 255.0) as usize;
            hist[lum] += 1;
            r_sum += r as f64;
            g_sum += g as f64;
            b_sum += b as f64;
            count += 1;
        }
    }

    let mut recipe = EditRecipe::empty().touch();
    recipe.auto = Some(AutoMeta {
        engine: "tone-v1".into(),
        applied_at: Utc::now().to_rfc3339(),
        strength,
    });

    if count == 0 {
        return recipe;
    }

    let total: u32 = hist.iter().sum();
    let mut cum = 0u32;
    let mut p5 = 0u32;
    let mut p50 = 128u32;
    for (i, &h) in hist.iter().enumerate() {
        cum += h;
        if p5 == 0 && cum >= (total as f32 * 0.05) as u32 {
            p5 = i as u32;
        }
        if cum >= (total as f32 * 0.5) as u32 {
            p50 = i as u32;
            break;
        }
    }
    cum = 0;
    let mut p95 = 255u32;
    for i in (0..256).rev() {
        cum += hist[i];
        if cum >= (total as f32 * 0.05) as u32 {
            p95 = i as u32;
            break;
        }
    }

    let mid = p50 as f32 / 255.0;
    let mut exposure = (0.45 / mid.max(0.05)).log2();
    exposure = exposure.clamp(-1.2, 1.2) * strength;

    let spread = (p95 as f32 - p5 as f32) / 255.0;
    let mut contrast = (0.55 - spread) * 80.0;
    contrast = contrast.clamp(-20.0, 35.0) * strength;

    let mut highlights = 0.0;
    let mut shadows = 0.0;
    if p95 > 230 {
        highlights = -((p95 as f32 - 230.0) / 25.0) * 30.0 * strength;
    }
    if p5 < 25 {
        shadows = ((25.0 - p5 as f32) / 25.0) * 25.0 * strength;
    }

    let r_avg = r_sum / count as f64;
    let g_avg = g_sum / count as f64;
    let b_avg = b_sum / count as f64;
    let gray = ((r_avg + g_avg + b_avg) / 3.0).max(1.0);
    let mut temp = ((r_avg - b_avg) / gray) as f32 * -400.0;
    let mut tint = ((g_avg - (r_avg + b_avg) / 2.0) / gray) as f32 * -300.0;
    temp = temp.clamp(-400.0, 400.0) * strength * 0.5;
    tint = tint.clamp(-150.0, 150.0) * strength * 0.5;

    recipe.preset_id = None;
    recipe.tone.exposure = round2(exposure);
    recipe.tone.contrast = round2(contrast);
    recipe.tone.highlights = round2(highlights);
    recipe.tone.shadows = round2(shadows);
    recipe.tone.whites = round2(highlights * 0.3);
    recipe.tone.blacks = round2(-shadows * 0.2);
    recipe.wb.temp = round2(temp);
    recipe.wb.tint = round2(tint);
    recipe.detail.clarity = round2(4.0 * strength);
    recipe.detail.sharpen = 0.0;
    recipe
}
