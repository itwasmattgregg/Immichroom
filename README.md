# IMMICHROOM

Fast thin Lightroom-style client over your **Immich** library — **Rust-first**.

Auto Tone, Tri-X Warm, EditRecipe bake, and the Immich HTTP client live in a Rust workspace. The old Expo/React Native app under this repo is **legacy** (kept for reference only; not the speed path).

## Architecture

```
crates/
  immichroom-core/    EditRecipe, Auto Tone v1, Tri-X Warm, JPEG bake
  immichroom-immich/  Immich API (auth, assets, metadata)
  immichroom-cli/     `immichroom` binary for smoke + develop ops
```

Next UI step: **SwiftUI (iOS) + UniFFI** calling `immichroom-core` — not React Native.

## Requirements

- Rust 1.85+ (stable)
- Immich server + API key (for network commands)

```bash
# optional env
export IMMICH_BASE_URL=https://your-immich-host
export IMMICH_API_KEY=your_key
```

(Also accepts `EXPO_PUBLIC_IMMICH_*` for compatibility.)

## Build & smoke

```bash
cargo test -p immichroom-core
cargo run -p immichroom-cli -- smoke
```

## Immich commands

```bash
cargo run -p immichroom-cli -- ping
cargo run -p immichroom-cli -- list
cargo run -p immichroom-cli -- develop <asset-uuid> --look trix --out /tmp/out.jpg
cargo run -p immichroom-cli -- develop <asset-uuid> --look auto --save-recipe
```

EditRecipe is stored on the asset under Immich custom metadata key `immichroom` (same schema as before).

## Legacy Expo app

The TypeScript Expo UI (`App.tsx`, `src/`, `package.json`) is deprecated. Do not invest further in RN performance work — port features into Rust + a native shell instead.

## Product decisions (unchanged)

- Thin client over Immich (not a second photo manager)
- Tri-X Warm = `builtin.tri-x-warm` (not Leica/LUX naming)
- One EditRecipe per asset (MVP); versions = V2
- No filesystem DNG/XMP sidecars
