# IMMICHROOM

Rust develop engine + SwiftUI (UniFFI). Expo/TS is legacy.

## Layout

- `crates/immichroom-core` — EditRecipe, Auto, Tri-X, bake
- `crates/immichroom-immich` — Immich HTTP
- `crates/immichroom-ffi` — UniFFI exports for Swift
- `apps/ios` — SwiftUI shell

## Commands

```bash
cargo test -p immichroom-core
cargo build -p immichroom-ffi
./apps/ios/scripts/build-xcframework.sh   # macOS + Xcode
python3 apps/ios/scripts/generate-xcodeproj.py
```
