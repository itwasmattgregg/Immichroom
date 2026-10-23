use std::path::PathBuf;

use anyhow::{bail, Context, Result};
use clap::{Parser, Subcommand};
use immichroom_core::{
    bake_jpeg, compute_auto_tone_recipe, create_tri_x_warm_recipe, decode_jpeg_rgba,
    recipe_to_color_matrix, BUILTIN_TRI_X_WARM_ID,
};
use immichroom_immich::ImmichClient;

#[derive(Parser)]
#[command(name = "immichroom", about = "IMMICHROOM — Rust develop engine + Immich client")]
struct Cli {
    #[command(subcommand)]
    cmd: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Offline smoke: Auto Tone + Tri-X Warm bake (no Immich)
    Smoke,
    /// Ping Immich (IMMICH_BASE_URL + IMMICH_API_KEY)
    Ping,
    /// List recent Immich images
    List {
        #[arg(long, default_value_t = 20)]
        size: u32,
    },
    /// Download preview, apply Auto or Tri-X, optionally save recipe + write JPEG
    Develop {
        asset_id: String,
        #[arg(long, value_enum, default_value = "trix")]
        look: Look,
        #[arg(long)]
        save_recipe: bool,
        #[arg(long)]
        out: Option<PathBuf>,
    },
}

#[derive(Clone, clap::ValueEnum)]
enum Look {
    Auto,
    Trix,
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();
    match cli.cmd {
        Command::Smoke => smoke(),
        Command::Ping => ping().await,
        Command::List { size } => list(size).await,
        Command::Develop {
            asset_id,
            look,
            save_recipe,
            out,
        } => develop(&asset_id, look, save_recipe, out).await,
    }
}

fn smoke() -> Result<()> {
    let w = 64u32;
    let h = 64u32;
    let mut rgba = vec![0u8; (w * h * 4) as usize];
    for y in 0..h {
        for x in 0..w {
            let i = ((y * w + x) * 4) as usize;
            let v = ((x as f32 / (w - 1) as f32) * 255.0) as u8;
            rgba[i] = v;
            rgba[i + 1] = (v as f32 * 0.9) as u8;
            rgba[i + 2] = (v as f32 * 0.75) as u8;
            rgba[i + 3] = 255;
        }
    }
    let auto = compute_auto_tone_recipe(w, h, &rgba, 1.0);
    let trix = create_tri_x_warm_recipe();
    let matrix = recipe_to_color_matrix(&trix);
    let jpeg = bake_jpeg(w, h, &rgba, &trix, 64, 85)?;
    println!(
        "Auto Tone exposure/contrast: {} {}",
        auto.tone.exposure, auto.tone.contrast
    );
    println!(
        "Tri-X Warm preset_id: {} bw={}",
        trix.preset_id.as_deref().unwrap_or("?"),
        trix.bw.enabled
    );
    println!("Matrix[0..5]: {:?}", &matrix[..5]);
    println!("Baked JPEG bytes: {}", jpeg.len());
    assert_eq!(
        trix.preset_id.as_deref(),
        Some(BUILTIN_TRI_X_WARM_ID)
    );
    println!("smoke OK (Rust core)");
    Ok(())
}

async fn ping() -> Result<()> {
    let client = ImmichClient::from_env()?;
    let v = client.get_server_version().await?;
    let user = client.get_my_user().await?;
    let ver = v
        .version
        .unwrap_or_else(|| format!("{}.{}.{}", v.major.unwrap_or(0), v.minor.unwrap_or(0), v.patch.unwrap_or(0)));
    println!("Immich {ver} · logged in as {} ({})", user.email, user.name);
    Ok(())
}

async fn list(size: u32) -> Result<()> {
    let client = ImmichClient::from_env()?;
    let assets = client.list_recent_images(size).await?;
    for a in assets {
        println!(
            "{}  {}",
            a.id,
            a.original_file_name.unwrap_or_default()
        );
    }
    Ok(())
}

async fn develop(
    asset_id: &str,
    look: Look,
    save_recipe: bool,
    out: Option<PathBuf>,
) -> Result<()> {
    let client = ImmichClient::from_env()?;
    let bytes = client
        .download_preview(asset_id)
        .await
        .context("download preview")?;
    let (w, h, rgba) = decode_jpeg_rgba(&bytes).context("decode preview JPEG")?;
    let recipe = match look {
        Look::Auto => compute_auto_tone_recipe(w, h, &rgba, 1.0),
        Look::Trix => create_tri_x_warm_recipe(),
    };
    println!("{}", serde_json::to_string_pretty(&recipe)?);
    if save_recipe {
        client.save_edit_recipe(asset_id, &recipe).await?;
        println!("Saved EditRecipe to Immich metadata key immichroom");
    }
    if let Some(ref path) = out {
        let jpeg = bake_jpeg(w, h, &rgba, &recipe, 1600, 90)?;
        std::fs::write(path, jpeg)
            .with_context(|| format!("write {}", path.display()))?;
        println!("Wrote {}", path.display());
    }
    if !save_recipe && out.is_none() {
        bail!("pass --save-recipe and/or --out file.jpg");
    }
    Ok(())
}
