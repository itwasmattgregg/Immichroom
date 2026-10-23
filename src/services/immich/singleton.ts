import { createImmichClient, type ImmichClient } from './client';

let client: ImmichClient | null = null;

/** Shared Immich client for screens (env-configured). */
export function getImmichClient(): ImmichClient {
  if (!client) {
    client = createImmichClient();
  }
  return client;
}

export function resetImmichClient(): void {
  client = null;
}
