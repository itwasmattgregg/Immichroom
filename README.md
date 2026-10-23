# ImageRoom

Fast thin Lightroom-style mobile client over your **Immich** library — not a second photo manager.

This scaffold is **Phase 0 plumbing**: Expo app shell, Immich API service (auth + list assets / preview URLs), Develop stub, and a placeholder home screen.

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
cd ImageRoom
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

## Out of scope (this scaffold)

- Auto Tone, Tri-X Warm, EditRecipe metadata writes
- Cull / albums UI
- Versions / duplicates (V2)
- Filesystem / DNG sidecars

## Blockers

- **Immich URL + API key required** before `validateConnection()` / `listRecentAssets()` succeed.
- This environment has **no Immich config** checked in; use local `.env` (gitignored).
- Pushing to GitHub needs a remote (scaffold is on branch `cursor/imageroom-scaffold-6da5`).
