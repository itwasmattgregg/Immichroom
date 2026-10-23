#!/usr/bin/env bash
# Build libimmichroom_ffi.xcframework + regenerate Swift bindings (macOS + Xcode required).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="$ROOT/apps/ios/Rust"
GEN="$ROOT/apps/ios/Generated"
FFI_CRATE="immichroom-ffi"
LIB_NAME="libimmichroom_ffi.a"

cd "$ROOT"

if ! command -v cargo >/dev/null; then
  echo "error: cargo not found. Install Rust: https://rustup.rs" >&2
  exit 1
fi

if ! command -v xcodebuild >/dev/null; then
  echo "error: xcodebuild not found. Install Xcode from the App Store." >&2
  exit 1
fi

rustup target add aarch64-apple-ios aarch64-apple-ios-sim x86_64-apple-ios 2>/dev/null || true

echo "→ Building Rust (device + simulator)…"
cargo build -p "$FFI_CRATE" --release --target aarch64-apple-ios
cargo build -p "$FFI_CRATE" --release --target aarch64-apple-ios-sim

# Intel Mac simulator (optional; ignore failure on Apple Silicon-only setups)
cargo build -p "$FFI_CRATE" --release --target x86_64-apple-ios 2>/dev/null || true

DEVICE_LIB="$ROOT/target/aarch64-apple-ios/release/$LIB_NAME"
SIM_A64="$ROOT/target/aarch64-apple-ios-sim/release/$LIB_NAME"
SIM_X64="$ROOT/target/x86_64-apple-ios/release/$LIB_NAME"
SIM_UNIVERSAL="$OUT/sim-universal/$LIB_NAME"

mkdir -p "$OUT/sim-universal" "$GEN"

if [[ -f "$SIM_X64" ]]; then
  lipo -create -output "$SIM_UNIVERSAL" "$SIM_A64" "$SIM_X64"
else
  cp "$SIM_A64" "$SIM_UNIVERSAL"
fi

echo "→ Regenerating Swift bindings…"
cargo run -q -p uniffi-bindgen -- generate \
  --library "$ROOT/target/aarch64-apple-ios/release/libimmichroom_ffi.a" \
  --language swift \
  --out-dir "$GEN"

# Modulemap path for XCFramework headers
HEADER_DIR="$OUT/Headers"
mkdir -p "$HEADER_DIR"
cp "$GEN/immichroom_ffiFFI.h" "$HEADER_DIR/"
# Keep modulemap minimal — Darwin "use" lines from uniffi break some XCFramework consumers
cat > "$HEADER_DIR/module.modulemap" <<'EOF'
module immichroom_ffiFFI {
  header "immichroom_ffiFFI.h"
  export *
}
EOF

rm -rf "$OUT/ImmichroomFFI.xcframework"
xcodebuild -create-xcframework \
  -library "$DEVICE_LIB" -headers "$HEADER_DIR" \
  -library "$SIM_UNIVERSAL" -headers "$HEADER_DIR" \
  -output "$OUT/ImmichroomFFI.xcframework"

echo "✓ XCFramework → $OUT/ImmichroomFFI.xcframework"
echo "✓ Swift       → $GEN/immichroom_ffi.swift"
echo
echo "Open apps/ios/Immichroom.xcodeproj in Xcode and Run on a simulator or device."
