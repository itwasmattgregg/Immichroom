//! Immich API client for IMMICHROOM (auth, assets, EditRecipe metadata).

use immichroom_core::{
    EditRecipe, ImmichroomMetadataValue, EDIT_RECIPE_METADATA_KEY,
};
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use serde::Deserialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ImmichError {
    #[error("http error: {0}")]
    Http(#[from] reqwest::Error),
    #[error("immich API {status}: {body}")]
    Api { status: u16, body: String },
    #[error("missing credentials")]
    MissingCredentials,
    #[error("config: {0}")]
    Config(String),
    #[error(transparent)]
    Core(#[from] immichroom_core::Error),
    #[error(transparent)]
    Serde(#[from] serde_json::Error),
}

#[derive(Debug, Clone)]
pub enum Credentials {
    ApiKey(String),
    Bearer(String),
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerVersion {
    pub major: Option<u32>,
    pub minor: Option<u32>,
    pub patch: Option<u32>,
    pub version: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: String,
    pub email: String,
    pub name: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Asset {
    pub id: String,
    #[serde(rename = "type")]
    pub asset_type: String,
    pub original_file_name: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SearchResponse {
    assets: SearchAssets,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SearchAssets {
    items: Vec<Asset>,
}

#[derive(Debug, Deserialize)]
struct MetadataRow {
    #[allow(dead_code)]
    key: String,
    value: serde_json::Value,
}

pub struct ImmichClient {
    base_url: String,
    credentials: Option<Credentials>,
    http: reqwest::Client,
}

impl ImmichClient {
    pub fn new(base_url: impl Into<String>, credentials: Option<Credentials>) -> Result<Self, ImmichError> {
        let base_url = base_url.into().trim_end_matches('/').to_string();
        if base_url.is_empty() {
            return Err(ImmichError::Config("base URL is empty".into()));
        }
        let http = reqwest::Client::builder()
            .user_agent("IMMICHROOM/0.1")
            .build()?;
        Ok(Self {
            base_url,
            credentials,
            http,
        })
    }

    pub fn from_env() -> Result<Self, ImmichError> {
        let base = std::env::var("IMMICH_BASE_URL")
            .or_else(|_| std::env::var("EXPO_PUBLIC_IMMICH_BASE_URL"))
            .map_err(|_| ImmichError::Config("set IMMICH_BASE_URL".into()))?;
        let key = std::env::var("IMMICH_API_KEY")
            .or_else(|_| std::env::var("EXPO_PUBLIC_IMMICH_API_KEY"))
            .ok();
        let creds = key.map(Credentials::ApiKey);
        Self::new(base, creds)
    }

    pub fn set_credentials(&mut self, credentials: Option<Credentials>) {
        self.credentials = credentials;
    }

    pub fn thumbnail_url(&self, asset_id: &str, size: &str) -> String {
        format!(
            "{}/api/assets/{}/thumbnail?size={}",
            self.base_url, asset_id, size
        )
    }

    pub async fn get_server_version(&self) -> Result<ServerVersion, ImmichError> {
        self.request_json(reqwest::Method::GET, "/api/server/version", None, false)
            .await
    }

    pub async fn get_my_user(&self) -> Result<User, ImmichError> {
        self.request_json(reqwest::Method::GET, "/api/users/me", None, true)
            .await
    }

    pub async fn list_recent_images(&self, size: u32) -> Result<Vec<Asset>, ImmichError> {
        let body = serde_json::json!({
            "size": size,
            "page": 1,
            "order": "desc",
        });
        let resp: SearchResponse = self
            .request_json(
                reqwest::Method::POST,
                "/api/search/metadata",
                Some(body),
                true,
            )
            .await?;
        Ok(resp
            .assets
            .items
            .into_iter()
            .filter(|a| a.asset_type == "IMAGE")
            .collect())
    }

    pub async fn download_bytes(&self, url: &str) -> Result<Vec<u8>, ImmichError> {
        let mut req = self.http.get(url);
        req = self.apply_auth(req)?;
        let resp = req.send().await?;
        let status = resp.status();
        if !status.is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(ImmichError::Api {
                status: status.as_u16(),
                body,
            });
        }
        Ok(resp.bytes().await?.to_vec())
    }

    pub async fn download_preview(&self, asset_id: &str) -> Result<Vec<u8>, ImmichError> {
        let url = self.thumbnail_url(asset_id, "preview");
        self.download_bytes(&url).await
    }

    pub async fn load_edit_recipe(&self, asset_id: &str) -> Result<Option<EditRecipe>, ImmichError> {
        let path = format!(
            "/api/assets/{}/metadata/{}",
            asset_id, EDIT_RECIPE_METADATA_KEY
        );
        match self
            .request_json::<MetadataRow>(reqwest::Method::GET, &path, None, true)
            .await
        {
            Ok(row) => {
                let value: ImmichroomMetadataValue = serde_json::from_value(row.value)?;
                if value.edit_recipe.version == 1 {
                    Ok(Some(value.edit_recipe))
                } else {
                    Ok(None)
                }
            }
            Err(ImmichError::Api { status: 404, .. }) => Ok(None),
            Err(e) => Err(e),
        }
    }

    pub async fn save_edit_recipe(
        &self,
        asset_id: &str,
        recipe: &EditRecipe,
    ) -> Result<(), ImmichError> {
        let value = ImmichroomMetadataValue {
            edit_recipe: recipe.clone(),
        };
        let body = serde_json::json!({
            "items": [{
                "key": EDIT_RECIPE_METADATA_KEY,
                "value": value,
            }]
        });
        let path = format!("/api/assets/{}/metadata", asset_id);
        let _: Vec<MetadataRow> = self
            .request_json(reqwest::Method::PUT, &path, Some(body), true)
            .await?;
        Ok(())
    }

    pub async fn clear_edit_recipe(&self, asset_id: &str) -> Result<(), ImmichError> {
        let path = format!(
            "/api/assets/{}/metadata/{}",
            asset_id, EDIT_RECIPE_METADATA_KEY
        );
        match self
            .request_unit(reqwest::Method::DELETE, &path, true)
            .await
        {
            Ok(()) => Ok(()),
            Err(ImmichError::Api { status: 404, .. }) => Ok(()),
            Err(e) => Err(e),
        }
    }

    fn apply_auth(&self, req: reqwest::RequestBuilder) -> Result<reqwest::RequestBuilder, ImmichError> {
        match &self.credentials {
            Some(Credentials::ApiKey(k)) => Ok(req.header("x-api-key", k.as_str())),
            Some(Credentials::Bearer(t)) => Ok(req.bearer_auth(t)),
            None => Err(ImmichError::MissingCredentials),
        }
    }

    async fn request_json<T: for<'de> Deserialize<'de>>(
        &self,
        method: reqwest::Method,
        path: &str,
        body: Option<serde_json::Value>,
        auth: bool,
    ) -> Result<T, ImmichError> {
        let url = format!("{}{}", self.base_url, path);
        let mut req = self.http.request(method, &url);
        if auth {
            req = self.apply_auth(req)?;
        }
        let mut headers = HeaderMap::new();
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
        req = req.headers(headers);
        if let Some(b) = body {
            req = req.json(&b);
        }
        let resp = req.send().await?;
        let status = resp.status();
        let text = resp.text().await?;
        if !status.is_success() {
            return Err(ImmichError::Api {
                status: status.as_u16(),
                body: text,
            });
        }
        if text.is_empty() {
            return Err(ImmichError::Api {
                status: status.as_u16(),
                body: "empty body".into(),
            });
        }
        Ok(serde_json::from_str(&text)?)
    }

    async fn request_unit(
        &self,
        method: reqwest::Method,
        path: &str,
        auth: bool,
    ) -> Result<(), ImmichError> {
        let url = format!("{}{}", self.base_url, path);
        let mut req = self.http.request(method, &url);
        if auth {
            req = self.apply_auth(req)?;
        }
        // silence unused import warning for AUTHORIZATION in some builds
        let _ = AUTHORIZATION;
        let resp = req.send().await?;
        let status = resp.status();
        if status.is_success() || status.as_u16() == 204 {
            return Ok(());
        }
        let body = resp.text().await.unwrap_or_default();
        Err(ImmichError::Api {
            status: status.as_u16(),
            body,
        })
    }
}
