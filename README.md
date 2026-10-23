# IMMICHROOM

Fast thin Lightroom-style client over your **Immich** library.

**Stack:** Rust develop engine + **SwiftUI** iOS shell via **UniFFI**.  
(The Expo/React Native tree in this repo is legacy — do not extend it.)

## Layout

```
crates/
  immichroom-core/     EditRecipe, Auto Tone, Tri-X Warm, bake
  immichroom-immich/   Immich HTTP client
  immichroom-ffi/      UniFFI surface (Swift)
  immichroom-cli/      CLI smoke / develop ops
apps/ios/              SwiftUI app + XCFramework build scripts
```

## Mac: run the iOS app

1. Install Rust: https://rustup.rs  
2. Install Xcode, then:

```bash
./apps/ios/scripts/build-xcframework.sh
python3 apps/ios/scripts/generate-xcodeproj.py
open apps/ios/Immichroom.xcodeproj
```

Details: [apps/ios/README.md](apps/ios/README.md)

## CLI (optional)

```bash
cargo run -p immichroom-cli -- smoke
export IMMICH_BASE_URL=https://your-immich
export IMMICH_API_KEY=...
cargo run -p immichroom-cli -- develop <asset-id> --look trix --out /tmp/out.jpg
```

## Product rules

- Thin client over Immich (not a second photo manager)
- Tri-X Warm = `builtin.tri-x-warm`
- One EditRecipe per asset (MVP); versions = V2
- No filesystem DNG/XMP sidecars
