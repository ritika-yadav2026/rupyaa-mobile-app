import type { TalsecConfig } from 'freerasp-react-native';

import { freeRaspStaticConfig } from '@/src/config/freeRasp';

const parseCommaSeparated = (value: string | undefined): string[] => {
  if (!value) return [];
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
};

const appEnv = process.env.EXPO_PUBLIC_APP_ENV;
const isProd = appEnv === 'production';

const androidCertificateHashes = parseCommaSeparated(
  process.env.EXPO_PUBLIC_FREERASP_ANDROID_CERT_HASHES_B64,
);

// freeRASP expects Base64 of the raw SHA-256 signing certificate bytes (not Base64 of a hex string).
// For a SHA-256 digest (32 bytes), the Base64 encoding is typically 44 characters (ending with optional '=').
const base64Sha256Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

const invalidHashes = androidCertificateHashes.filter(
  (hash) => !base64Sha256Regex.test(hash) || hash.length !== 44,
);

export const freeRaspConfigValid =
  invalidHashes.length === 0 && androidCertificateHashes.length > 0;

if (!freeRaspConfigValid) {
  console.error(
    '[freeRASP] Config invalid — EXPO_PUBLIC_FREERASP_ANDROID_CERT_HASHES_B64 is missing or malformed. ' +
      'freeRASP will be disabled for this session. Regenerate using scripts/freerasp-android-cert-hash.sh.',
  );
}

export const freeRaspConfig: TalsecConfig = {
  androidConfig: {
    packageName: 'com.zapcash.loan',
    certificateHashes: androidCertificateHashes,
    supportedAlternativeStores: ['com.sec.android.app.samsungapps'],
  },
  iosConfig: {
    appBundleId: 'com.zapcash.loan',
    appTeamId: freeRaspStaticConfig.iosAppTeamId,
  },
  watcherMail: freeRaspStaticConfig.watcherMail,
  isProd,
  killOnBypass: isProd,
};
