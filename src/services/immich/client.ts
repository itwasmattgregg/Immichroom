import { assertImmichConfigured, getEnv } from '../../config/env';
import type {
  ImmichAsset,
  ImmichAuthLoginRequest,
  ImmichCredentials,
  ImmichLoginResponse,
  ImmichSearchMetadataResponse,
  ImmichServerVersion,
  ImmichUser,
} from './types';

export type ImmichClientOptions = {
  baseUrl?: string;
  credentials?: ImmichCredentials | null;
  /** Injected fetch for tests */
  fetchImpl?: typeof fetch;
};

/**
 * Thin Immich HTTP client for IMMICHROOM.
 * Auth + library read paths only (no EditRecipe writes yet).
 */
export class ImmichClient {
  readonly baseUrl: string;
  private credentials: ImmichCredentials | null;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ImmichClientOptions = {}) {
    const env = getEnv();
    let baseUrl = options.baseUrl ?? env.immichBaseUrl;
    if (!baseUrl) {
      assertImmichConfigured(env);
      baseUrl = env.immichBaseUrl;
    }
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.credentials =
      options.credentials ??
      (env.immichApiKey ? { kind: 'apiKey', apiKey: env.immichApiKey } : null);
    this.fetchImpl = options.fetchImpl ?? fetch.bind(globalThis);
  }

  setCredentials(credentials: ImmichCredentials | null): void {
    this.credentials = credentials;
  }

  getCredentials(): ImmichCredentials | null {
    return this.credentials;
  }

  /** GET /api/server/version — cheap connectivity check */
  async getServerVersion(): Promise<ImmichServerVersion> {
    return this.request<ImmichServerVersion>('/api/server/version', {
      method: 'GET',
      auth: false,
    });
  }

  /** POST /api/auth/login */
  async login(body: ImmichAuthLoginRequest): Promise<ImmichLoginResponse> {
    const result = await this.request<ImmichLoginResponse>('/api/auth/login', {
      method: 'POST',
      auth: false,
      body,
    });
    this.credentials = { kind: 'bearer', accessToken: result.accessToken };
    return result;
  }

  /** GET /api/users/me */
  async getMyUser(): Promise<ImmichUser> {
    return this.request<ImmichUser>('/api/users/me', { method: 'GET' });
  }

  /**
   * Recent library assets via metadata search.
   * Uses Immich POST /api/search/metadata.
   */
  async listRecentAssets(options: { size?: number } = {}): Promise<ImmichAsset[]> {
    const size = options.size ?? 40;
    const data = await this.request<ImmichSearchMetadataResponse>('/api/search/metadata', {
      method: 'POST',
      body: {
        size,
        page: 1,
        order: 'desc',
      },
    });
    return data.assets?.items ?? [];
  }

  /** Thumbnail URL for an asset (requires auth headers when fetching). */
  thumbnailUrl(assetId: string, size: 'thumbnail' | 'preview' = 'thumbnail'): string {
    return `${this.baseUrl}/api/assets/${assetId}/thumbnail?size=${size}`;
  }

  /** Original / full download URL (use sparingly; prefer preview for Develop later). */
  originalUrl(assetId: string): string {
    return `${this.baseUrl}/api/assets/${assetId}/original`;
  }

  /** Headers needed to fetch media URLs from Immich. */
  mediaHeaders(): Record<string, string> {
    return this.authHeaders();
  }

  /**
   * Validates config + credentials: version ping, then /users/me when creds exist.
   */
  async validateConnection(): Promise<{
    version: ImmichServerVersion;
    user: ImmichUser | null;
  }> {
    const version = await this.getServerVersion();
    let user: ImmichUser | null = null;
    if (this.credentials) {
      user = await this.getMyUser();
    }
    return { version, user };
  }

  private authHeaders(): Record<string, string> {
    if (!this.credentials) {
      return {};
    }
    if (this.credentials.kind === 'apiKey') {
      return { 'x-api-key': this.credentials.apiKey };
    }
    return { Authorization: `Bearer ${this.credentials.accessToken}` };
  }

  private async request<T>(
    path: string,
    init: {
      method: string;
      body?: unknown;
      auth?: boolean;
    },
  ): Promise<T> {
    const requireAuth = init.auth !== false;
    if (requireAuth && !this.credentials) {
      throw new Error(
        'Immich credentials missing. Set EXPO_PUBLIC_IMMICH_API_KEY or call login().',
      );
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(requireAuth ? this.authHeaders() : {}),
    };

    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: init.method,
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(
        `Immich ${init.method} ${path} failed (${response.status}): ${text || response.statusText}`,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }
}

/** Default client using Expo public env. */
export function createImmichClient(options?: ImmichClientOptions): ImmichClient {
  return new ImmichClient(options);
}
