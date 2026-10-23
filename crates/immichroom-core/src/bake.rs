use base64::{engine::general_purpose::STANDARD as B64, Engine};
use image::{ImageBuffer, ImageEncoder, ImageFormat, Rgb, RgbImage};
use std::io::Cursor;

use crate::matrix::{recipe_to_color_matrix, ColorMatrix5};
use crate::recipe::EditRecipe;
use crate::Error;

fn apply_matrix(r: f32, g: f32, b: f32, m: &ColorMatrix5) -> (u8, u8, u8) {
    let nr = m[0] * r + m[1] * g + m[2] * b + m[4] * 255.0;
    let ng = m[5] * r + m[6] * g + m[7] * b + m[9] * 255.0;
    let nb = m[10] * r + m[11] * g + m[12] * b + m[14] * 255.0;
    (
        nr.clamp(0.0, 255.0) as u8,
        ng.clamp(0.0, 255.0) as u8,
        nb.clamp(0.0, 255.0) as u8,
    )
}

fn grain_noise(x: u32, y: u32, seed: f32) -> f32 {
    let n = ((x as f32) * 12.9898 + (y as f32) * 78.233 + seed * 45.164).sin() * 43758.5453;
    n - n.floor()
}

/// Decode JPEG bytes to RGBA8.
pub fn decode_jpeg_rgba(bytes: &[u8]) -> Result<(u32, u32, Vec<u8>), Error> {
    let img = image::load_from_memory_with_format(bytes, ImageFormat::Jpeg)
        .or_else(|_| image::load_from_memory(bytes))
        .map_err(|e| Error::Image(e.to_string()))?
        .to_rgba8();
    let (w, h) = img.dimensions();
    Ok((w, h, img.into_raw()))
}

/// Bake EditRecipe onto RGBA → JPEG bytes.
pub fn bake_jpeg(
    width: u32,
    height: u32,
    rgba: &[u8],
    recipe: &EditRecipe,
    max_edge: u32,
    quality: u8,
) -> Result<Vec<u8>, Error> {
    let scale = (max_edge as f32 / width.max(height) as f32).min(1.0);
    let out_w = ((width as f32) * scale).round().max(1.0) as u32;
    let out_h = ((height as f32) * scale).round().max(1.0) as u32;
    let m = recipe_to_color_matrix(recipe);
    let grain_amt = recipe.grain.amount / 100.0;
    let seed = if recipe.grain.link_to_exposure {
        1.0 + recipe.tone.exposure.abs()
    } else {
        1.0
    };

    let mut out: RgbImage = ImageBuffer::new(out_w, out_h);
    for y in 0..out_h {
        let sy = ((y as f32) / scale).floor().min((height - 1) as f32) as u32;
        for x in 0..out_w {
            let sx = ((x as f32) / scale).floor().min((width - 1) as f32) as u32;
            let i = ((sy * width + sx) * 4) as usize;
            let r = rgba[i] as f32;
            let g = rgba[i + 1] as f32;
            let b = rgba[i + 2] as f32;
            let _a = rgba[i + 3];
            let (mut nr, mut ng, mut nb) = apply_matrix(r, g, b, &m);
            if grain_amt > 0.0 {
                let n = (grain_noise(x, y, seed) - 0.5) * 255.0 * grain_amt;
                nr = (nr as f32 + n).clamp(0.0, 255.0) as u8;
                ng = (ng as f32 + n).clamp(0.0, 255.0) as u8;
                nb = (nb as f32 + n).clamp(0.0, 255.0) as u8;
            }
            out.put_pixel(x, y, Rgb([nr, ng, nb]));
        }
    }

    let mut buf = Cursor::new(Vec::new());
    let encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut buf, quality);
    encoder
        .write_image(out.as_raw(), out_w, out_h, image::ExtendedColorType::Rgb8)
        .map_err(|e| Error::Image(e.to_string()))?;
    Ok(buf.into_inner())
}

pub fn bake_preview_data_uri(
    width: u32,
    height: u32,
    rgba: &[u8],
    recipe: &EditRecipe,
    max_edge: u32,
) -> Result<String, Error> {
    let jpeg = bake_jpeg(width, height, rgba, recipe, max_edge, 85)?;
    Ok(format!("data:image/jpeg;base64,{}", B64.encode(jpeg)))
}
