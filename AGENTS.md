# IMMICHROOM (Rust-first)

IMMICHROOM is a fast thin Lightroom-style client over Immich.
**Primary implementation language: Rust** (`crates/`).

## Layout

- `crates/immichroom-core` — EditRecipe, Auto Tone, Tri-X Warm, bake
- `crates/immichroom-immich` — Immich HTTP client
- `crates/immichroom-cli` — CLI (`immichroom`)
- Expo/TS under the repo root is **legacy** — do not extend it for performance work

## Commands

```bash
cargo test -p immichroom-core
cargo run -p immichroom-cli -- smoke
cargo run -p immichroom-cli -- ping
```

## UI direction

SwiftUI + UniFFI (iOS first), then Kotlin/Compose. Not React Native.
