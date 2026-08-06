import type { PlayInstallReferrerInfo } from 'react-native-play-install-referrer';

export const PLAY_INSTALL_REFERRER_STORED_VERSION = 1 as const;

export type StoredPlayInstallReferrerV1 = {
  v: typeof PLAY_INSTALL_REFERRER_STORED_VERSION;
  info: PlayInstallReferrerInfo;
  capturedAtMs: number;
  expiresAtMs: number;
};
