# IMMICHROOM

Fast thin Lightroom-style mobile client over your **Immich** library — not a second photo manager.

Phase 0+1 in progress: Expo shell, Immich API, **Auto Tone v1**, **Tri-X Warm**, EditRecipe metadata persistence, Develop screen.

## Stack

- Expo (SDK 58) + React Native + TypeScript
- Immich HTTP API (`src/services/immich`)
- Develop / EditRecipe module stub (`src/develop`) — no writes yet

## Folder structure

```
App.tsx
src/
  config/env.ts          # EXPO_PUBLIC_* config
  screens/HomeScreen.tsx
  components/            # UI building blocks (empty for now)
  services/immich/       # API client
  develop/               # Edit stub (Tri-X Warm / Auto later)
```

## Configure Immich

No Immich URL or credentials were found in the workspace. Copy the example env and fill in your server (Tailscale MagicDNS is fine):

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_IMMICH_BASE_URL=https://your-immich-host
EXPO_PUBLIC_IMMICH_API_KEY=your_api_key
```

Create an API key in the Immich web UI (Account → API Keys).

## Run

```bash
cd IMMICHROOM
npm install
npm start
```

Then press `i` (iOS simulator / Expo Go), `a` (Android), or scan the QR code with Expo Go.

Web smoke check:

```bash
npm run web
```

Typecheck:

```bash
npx tsc --noEmit
```

## Using the Immich client (no UI yet)

```ts
import { createImmichClient } from './src/services/immich';

const immich = createImmichClient();
const { version, user } = await immich.validateConnection();
const assets = await immich.listRecentAssets({ size: 20 });
const thumb = immich.thumbnailUrl(assets[0].id, 'preview');
// Fetch thumb with immich.mediaHeaders()
```

## Develop (Auto + Tri-X Warm)

1. Configure `.env` and `npm start` / `npm run web`
2. Home loads recent Immich images — tap one
3. **Auto** — histogram Auto Tone v1 on the preview
4. **Tri-X Warm** — built-in warm B&W (`builtin.tri-x-warm`)
5. **Save** — writes EditRecipe to Immich custom metadata key `immichroom`
6. **Reset** / **Clear saved** — empty recipe / delete metadata

Offline smoke (no Immich):

```bash
npm run smoke:develop
```

## Out of scope (still)

- Cull / albums UI
- Versions / duplicates (V2)
- Filesystem / DNG sidecars
- Contrast slider UI for Tri-X Warm (recipe supports contrastMin/Max)

## Blockers

- **Immich URL + API key required** before `validateConnection()` / `listRecentAssets()` succeed.
- This environment has **no Immich config** checked in; use local `.env` (gitignored).
- Pushing to GitHub needs a remote (scaffold is on branch `cursor/immichroom-rename-6da5`).
