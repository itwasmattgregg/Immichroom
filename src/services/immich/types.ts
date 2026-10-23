/** Minimal Immich DTOs used by the Phase 0 connection layer. */

export type ImmichAuthLoginRequest = {
  email: string;
  password: string;
};

export type ImmichLoginResponse = {
  accessToken: string;
  userId: string;
  userEmail: string;
  name: string;
  isAdmin: boolean;
};

export type ImmichUser = {
  id: string;
  email: string;
  name: string;
  isAdmin?: boolean;
};

export type ImmichServerVersion = {
  major?: number;
  minor?: number;
  patch?: number;
  version?: string;
};

export type ImmichAssetType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'OTHER';

export type ImmichAsset = {
  id: string;
  type: ImmichAssetType;
  originalFileName?: string;
  originalPath?: string;
  fileCreatedAt?: string;
  localDateTime?: string;
  isFavorite?: boolean;
  /** Immich rating: -1 reject, 1–5 stars, null unrated */
  exifInfo?: {
    rating?: number | null;
    description?: string | null;
  };
  thumbhash?: string | null;
};

export type ImmichSearchMetadataResponse = {
  assets: {
    total: number;
    count: number;
    items: ImmichAsset[];
    nextPage?: string | null;
  };
};

export type ImmichCredentials =
  | { kind: 'apiKey'; apiKey: string }
  | { kind: 'bearer'; accessToken: string };

export type ImmichAssetMetadataRow = {
  key: string;
  value: Record<string, unknown>;
};
