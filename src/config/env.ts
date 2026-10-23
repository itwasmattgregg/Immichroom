/**
 * Public runtime config for IMMICHROOM.
 * Set via Expo public env vars (see `.env.example`).
 */
export type ImmichRoomEnv = {
  /** Immich server origin, e.g. https://immich.tailnet.ts.net */
  immichBaseUrl: string | null;
  /** Optional long-lived API key (x-api-key). Prefer over password in the app. */
  immichApiKey: string | null;
};

function trimOrNull(value: string | undefined): string | null {
  const v = value?.trim();
  return v ? v.replace(/\/$/, '') : null;
}

export function getEnv(): ImmichRoomEnv {
  return {
    immichBaseUrl: trimOrNull(process.env.EXPO_PUBLIC_IMMICH_BASE_URL),
    immichApiKey: trimOrNull(process.env.EXPO_PUBLIC_IMMICH_API_KEY),
  };
}

export function assertImmichConfigured(env: ImmichRoomEnv = getEnv()): asserts env is ImmichRoomEnv & {
  immichBaseUrl: string;
} {
  if (!env.immichBaseUrl) {
    throw new Error(
      'Missing EXPO_PUBLIC_IMMICH_BASE_URL. Copy .env.example to .env and set your Immich URL.',
    );
  }
}
