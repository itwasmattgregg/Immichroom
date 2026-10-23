# IMMICHROOM iOS (SwiftUI + UniFFI)

Native shell over the Rust develop engine.

## One-time setup (Mac)

1. Install [Rust](https://rustup.rs) (`cargo` required).
2. Install Xcode from the App Store and open it once (accept license).
3. From the **repo root**:

```bash
chmod +x apps/ios/scripts/build-xcframework.sh
./apps/ios/scripts/build-xcframework.sh
python3 apps/ios/scripts/generate-xcodeproj.py
```

4. Open `apps/ios/Immichroom.xcodeproj` in Xcode.
5. Select your **Team** under Signing & Capabilities.
6. Run on a Simulator or device.

Connect with your Immich base URL (Tailscale hostname is fine) and an API key.

## What you get

| Screen | Behavior |
|--------|----------|
| Connect | Saves URL + API key, pings Immich via Rust |
| Library | Recent images grid (Rust downloads previews) |
| Develop | Auto Tone, Tri-X Warm, Reset, Save/Clear EditRecipe |

All develop math and Immich I/O run in **`immichroom-ffi` (Rust)**.

## Regenerate bindings

After changing `crates/immichroom-ffi`:

```bash
./apps/ios/scripts/build-xcframework.sh
```

`Generated/immichroom_ffi.swift` is updated automatically.
