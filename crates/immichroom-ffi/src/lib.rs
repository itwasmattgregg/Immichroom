//! UniFFI surface for IMMICHROOM — consumed by SwiftUI (and later Kotlin).

uniffi::setup_scaffolding!();

use immichroom_core::{
    bake_jpeg, compute_auto_tone_recipe, create_tri_x_warm_recipe, decode_jpeg_rgba,
    recipe_to_color_matrix, EditRecipe, EDIT_RECIPE_METADATA_KEY,
};
use immichroom_immich::{Credentials, ImmichClient};
use std::sync::Mutex;

#[derive(Debug, thiserror::Error, uniffi::Error)]
pub enum ImmichroomError {
    #[error("{msg}")]
    Message { msg: String },
}

impl ImmichroomError {
    fn msg(s: impl Into<String>) -> Self {
        Self::Message { msg: s.into() }
    }
}

impl From<immichroom_core::Error> for ImmichroomError {
    fn from(e: immichroom_core::Error) -> Self {
        Self::msg(e.to_string())
    }
}

impl From<immichroom_immich::ImmichError> for ImmichroomError {
    fn from(e: immichroom_immich::ImmichError) -> Self {
        Self::msg(e.to_string())
    }
}

impl From<serde_json::Error> for ImmichroomError {
    fn from(e: serde_json::Error) -> Self {
        Self::msg(e.to_string())
    }
}

#[uniffi::export]
pub fn empty_recipe_json() -> String {
    serde_json::to_string(&EditRecipe::empty().touch()).expect("serialize")
}

#[uniffi::export]
pub fn tri_x_warm_recipe_json() -> String {
    serde_json::to_string(&create_tri_x_warm_recipe()).expect("serialize")
}

#[uniffi::export]
pub fn metadata_key() -> String {
    EDIT_RECIPE_METADATA_KEY.to_string()
}

#[uniffi::export]
pub fn auto_tone_from_jpeg(jpeg: Vec<u8>, strength: f32) -> Result<String, ImmichroomError> {
    let (w, h, rgba) = decode_jpeg_rgba(&jpeg)?;
    let recipe = compute_auto_tone_recipe(w, h, &rgba, strength);
    Ok(serde_json::to_string(&recipe)?)
}

#[uniffi::export]
pub fn bake_preview_jpeg(
    jpeg: Vec<u8>,
    recipe_json: String,
    max_edge: u32,
) -> Result<Vec<u8>, ImmichroomError> {
    let recipe: EditRecipe = serde_json::from_str(&recipe_json)?;
    let (w, h, rgba) = decode_jpeg_rgba(&jpeg)?;
    Ok(bake_jpeg(w, h, &rgba, &recipe, max_edge.max(64), 85)?)
}

#[uniffi::export]
pub fn recipe_color_matrix(recipe_json: String) -> Result<Vec<f32>, ImmichroomError> {
    let recipe: EditRecipe = serde_json::from_str(&recipe_json)?;
    Ok(recipe_to_color_matrix(&recipe).to_vec())
}

#[derive(uniffi::Record, Debug, Clone)]
pub struct AssetInfo {
    pub id: String,
    pub original_file_name: String,
}

#[derive(uniffi::Object)]
pub struct ImmichSession {
    inner: Mutex<Inner>,
}

struct Inner {
    client: ImmichClient,
    rt: tokio::runtime::Runtime,
}

#[uniffi::export]
impl ImmichSession {
    #[uniffi::constructor]
    pub fn new(base_url: String, api_key: String) -> Result<std::sync::Arc<Self>, ImmichroomError> {
        let client = ImmichClient::new(base_url, Some(Credentials::ApiKey(api_key)))?;
        let rt = tokio::runtime::Builder::new_multi_thread()
            .enable_all()
            .build()
            .map_err(|e| ImmichroomError::msg(e.to_string()))?;
        Ok(std::sync::Arc::new(Self {
            inner: Mutex::new(Inner { client, rt }),
        }))
    }

    pub fn ping(&self) -> Result<String, ImmichroomError> {
        let guard = self
            .inner
            .lock()
            .map_err(|e| ImmichroomError::msg(e.to_string()))?;
        let (ver, user) = guard.rt.block_on(async {
            let v = guard.client.get_server_version().await?;
            let u = guard.client.get_my_user().await?;
            Ok::<_, ImmichroomError>((v, u))
        })?;
        let version = ver.version.unwrap_or_else(|| {
            format!(
                "{}.{}.{}",
                ver.major.unwrap_or(0),
                ver.minor.unwrap_or(0),
                ver.patch.unwrap_or(0)
            )
        });
        Ok(format!("Immich {version} · {}", user.email))
    }

    pub fn list_recent(&self, size: u32) -> Result<Vec<AssetInfo>, ImmichroomError> {
        let guard = self
            .inner
            .lock()
            .map_err(|e| ImmichroomError::msg(e.to_string()))?;
        let assets = guard
            .rt
            .block_on(async { guard.client.list_recent_images(size).await })?;
        Ok(assets
            .into_iter()
            .map(|a| AssetInfo {
                id: a.id,
                original_file_name: a.original_file_name.unwrap_or_default(),
            })
            .collect())
    }

    pub fn download_preview(&self, asset_id: String) -> Result<Vec<u8>, ImmichroomError> {
        let guard = self
            .inner
            .lock()
            .map_err(|e| ImmichroomError::msg(e.to_string()))?;
        Ok(guard
            .rt
            .block_on(async { guard.client.download_preview(&asset_id).await })?)
    }

    pub fn load_recipe(&self, asset_id: String) -> Result<Option<String>, ImmichroomError> {
        let guard = self
            .inner
            .lock()
            .map_err(|e| ImmichroomError::msg(e.to_string()))?;
        let recipe = guard
            .rt
            .block_on(async { guard.client.load_edit_recipe(&asset_id).await })?;
        Ok(recipe.map(|r| serde_json::to_string(&r)).transpose()?)
    }

    pub fn save_recipe(&self, asset_id: String, recipe_json: String) -> Result<(), ImmichroomError> {
        let recipe: EditRecipe = serde_json::from_str(&recipe_json)?;
        let guard = self
            .inner
            .lock()
            .map_err(|e| ImmichroomError::msg(e.to_string()))?;
        guard
            .rt
            .block_on(async { guard.client.save_edit_recipe(&asset_id, &recipe).await })?;
        Ok(())
    }

    pub fn clear_recipe(&self, asset_id: String) -> Result<(), ImmichroomError> {
        let guard = self
            .inner
            .lock()
            .map_err(|e| ImmichroomError::msg(e.to_string()))?;
        guard
            .rt
            .block_on(async { guard.client.clear_edit_recipe(&asset_id).await })?;
        Ok(())
    }
}
