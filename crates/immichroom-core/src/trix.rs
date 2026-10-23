use crate::recipe::{BwMix, EditRecipe, PaperTone};

pub const BUILTIN_TRI_X_WARM_ID: &str = "builtin.tri-x-warm";

/// Tri-X Warm — original IMMICHROOM built-in (not Leica/LUX/Greg Williams).
pub fn create_tri_x_warm_recipe() -> EditRecipe {
    let mut recipe = EditRecipe::empty().touch();
    recipe.preset_id = Some(BUILTIN_TRI_X_WARM_ID.into());
    recipe.auto = None;
    recipe.bw.enabled = true;
    recipe.bw.mix = BwMix {
        red: 25.0,
        yellow: 18.0,
        green: 12.0,
        cyan: 8.0,
        blue: 8.0,
        magenta: 12.0,
    };
    recipe.bw.paper_tone = PaperTone {
        warmth: 0.12,
        white_point: 0.96,
    };
    recipe.tone.exposure = 0.05;
    recipe.tone.contrast = 18.0;
    recipe.tone.contrast_min = Some(8.0);
    recipe.tone.contrast_max = Some(28.0);
    recipe.tone.highlights = -12.0;
    recipe.tone.shadows = 8.0;
    recipe.tone.whites = -5.0;
    recipe.tone.blacks = -8.0;
    recipe.detail.clarity = 0.0;
    recipe.detail.sharpen = 0.0;
    recipe.grain.amount = 28.0;
    recipe.grain.size = 25.0;
    recipe.grain.roughness = 40.0;
    recipe.grain.link_to_exposure = true;
    recipe
}

pub fn clamp_tri_x_warm_contrast(contrast: f32) -> f32 {
    contrast.clamp(8.0, 28.0)
}
