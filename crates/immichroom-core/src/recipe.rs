use chrono::Utc;
use serde::{Deserialize, Serialize};

/// Immich custom metadata key for the EditRecipe document.
pub const EDIT_RECIPE_METADATA_KEY: &str = "immichroom";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ToneSettings {
    pub exposure: f32,
    pub contrast: f32,
    pub highlights: f32,
    pub shadows: f32,
    pub whites: f32,
    pub blacks: f32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub contrast_min: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub contrast_max: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct WhiteBalanceSettings {
    pub temp: f32,
    pub tint: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct BwMix {
    pub red: f32,
    pub yellow: f32,
    pub green: f32,
    pub cyan: f32,
    pub blue: f32,
    pub magenta: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PaperTone {
    pub warmth: f32,
    pub white_point: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct BwSettings {
    pub enabled: bool,
    pub mix: BwMix,
    pub paper_tone: PaperTone,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct GrainSettings {
    pub amount: f32,
    pub size: f32,
    pub roughness: f32,
    pub link_to_exposure: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DetailSettings {
    pub clarity: f32,
    pub sharpen: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AutoMeta {
    pub engine: String,
    pub applied_at: String,
    pub strength: f32,
}

/// One develop look per Immich asset (MVP).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct EditRecipe {
    pub version: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preset_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub auto: Option<AutoMeta>,
    pub tone: ToneSettings,
    pub wb: WhiteBalanceSettings,
    pub bw: BwSettings,
    pub detail: DetailSettings,
    pub grain: GrainSettings,
    pub updated_at: String,
}

/// Wrapper stored as Immich metadata `value` (must be a JSON object).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ImmichroomMetadataValue {
    pub edit_recipe: EditRecipe,
}

impl EditRecipe {
    pub fn empty() -> Self {
        Self {
            version: 1,
            preset_id: None,
            auto: None,
            tone: ToneSettings {
                exposure: 0.0,
                contrast: 0.0,
                highlights: 0.0,
                shadows: 0.0,
                whites: 0.0,
                blacks: 0.0,
                contrast_min: None,
                contrast_max: None,
            },
            wb: WhiteBalanceSettings {
                temp: 0.0,
                tint: 0.0,
            },
            bw: BwSettings {
                enabled: false,
                mix: BwMix {
                    red: 40.0,
                    yellow: 60.0,
                    green: 40.0,
                    cyan: 60.0,
                    blue: 20.0,
                    magenta: 80.0,
                },
                paper_tone: PaperTone {
                    warmth: 0.0,
                    white_point: 1.0,
                },
            },
            detail: DetailSettings {
                clarity: 0.0,
                sharpen: 0.0,
            },
            grain: GrainSettings {
                amount: 0.0,
                size: 25.0,
                roughness: 40.0,
                link_to_exposure: false,
            },
            updated_at: Utc::now().to_rfc3339(),
        }
    }

    pub fn touch(mut self) -> Self {
        self.updated_at = Utc::now().to_rfc3339();
        self
    }
}
