export interface IAppUpdatesResponse {
  platform: Platform;
  currentProductionVersion: string;
  minSupportedVersion: string;
  releaseNotes: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  id: string;
}

export type Platform = 'ios' | 'android';

export interface IAppUpdateCheckResponse {
  success: boolean;
  updateRequired: boolean;
  forceUpdate: boolean;
  currentProductionVersion: string;
  minSupportedVersion: string;
  releaseNotes?: string;
}