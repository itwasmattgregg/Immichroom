//! IMMICHROOM develop engine — EditRecipe, Auto Tone, Tri-X Warm, preview bake.

mod auto;
mod bake;
mod matrix;
mod recipe;
mod trix;

pub use auto::compute_auto_tone_recipe;
pub use bake::{bake_jpeg, bake_preview_data_uri, decode_jpeg_rgba};
pub use matrix::{recipe_to_color_matrix, ColorMatrix5, IDENTITY};
pub use recipe::{
    AutoMeta, BwMix, BwSettings, DetailSettings, EditRecipe, GrainSettings,
    ImmichroomMetadataValue, PaperTone, ToneSettings, WhiteBalanceSettings,
    EDIT_RECIPE_METADATA_KEY,
};
pub use trix::{clamp_tri_x_warm_contrast, create_tri_x_warm_recipe, BUILTIN_TRI_X_WARM_ID};

use thiserror::Error;

#[derive(Debug, Error)]
pub enum Error {
    #[error("image error: {0}")]
    Image(String),
    #[error("serde error: {0}")]
    Serde(#[from] serde_json::Error),
}

#[cfg(test)]
mod tests {
    use super::*;

    fn gradient(w: u32, h: u32) -> Vec<u8> {
        let mut data = vec![0u8; (w * h * 4) as usize];
        for y in 0..h {
            for x in 0..w {
                let i = ((y * w + x) * 4) as usize;
                let v = ((x as f32 / (w - 1) as f32) * 255.0) as u8;
                data[i] = v;
                data[i + 1] = (v as f32 * 0.9) as u8;
                data[i + 2] = (v as f32 * 0.75) as u8;
                data[i + 3] = 255;
            }
        }
        data
    }

    #[test]
    fn auto_and_trix_bake() {
        let w = 64;
        let h = 64;
        let px = gradient(w, h);
        let auto = compute_auto_tone_recipe(w, h, &px, 1.0);
        assert_eq!(auto.auto.as_ref().unwrap().engine, "tone-v1");
        let trix = create_tri_x_warm_recipe();
        assert_eq!(trix.preset_id.as_deref(), Some(BUILTIN_TRI_X_WARM_ID));
        assert!(trix.bw.enabled);
        let jpeg = bake_jpeg(w, h, &px, &trix, 64, 85).unwrap();
        assert!(jpeg.len() > 100);
        let _m = recipe_to_color_matrix(&trix);
    }
}
