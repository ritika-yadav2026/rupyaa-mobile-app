import {
  addSslPinningErrorListener,
  initializeSslPinning,
  isSslPinningAvailable as isNativeSslPinningAvailable,
  type PinningOptions,
} from 'react-native-ssl-public-key-pinning';
import { API_ENDPOINTS, apiConfig, apiHeaders } from '@/src/config/api';

const SSL_PINNING_ENABLED = process.env.EXPO_PUBLIC_SSL_PINNING_ENABLED === 'true';

const FORCE_SSL_PINNING_FAILURE = false;
const PINNED_API_VERIFICATION_TIMEOUT_MS = 7000;

const PINNING_OPTIONS: PinningOptions = {
  // Only pin company-owned API domains. Do not pin third-party SDK or lender
  // redirect domains because certificate rotation is outside our control.
  'api.zapcash.in': {
    includeSubdomains: true,
    publicKeyHashes: [
      'MtJl1Xvef58yNU5l2BSZXkPz+Vv1TjGecQTf7W4Ix5k=', // current
      'gk7/DWT1g/Hy6epTqoEUpakPAj5rQl61TJvdxUwkXUo=', // backup
    ],
    expirationDate: '2026-11-04',
  },
  'staging2-api.zapcash.in': {
    includeSubdomains: true,
    publicKeyHashes: [
      'MtJl1Xvef58yNU5l2BSZXkPz+Vv1TjGecQTf7W4Ix5k=',
      '1o5BkbtUpveOPPaI+FQUmr/g+6Uog/vYk6o7Yh0fSpA=',
    ],
    expirationDate: '2026-11-04',
  },
};

const TEST_FAILURE_PINNING_OPTIONS: PinningOptions = Object.fromEntries(
  Object.keys(PINNING_OPTIONS).map((hostname) => [
    hostname,
    {
      ...PINNING_OPTIONS[hostname],
      publicKeyHashes: [
        'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
      ],
    },
  ]),
);

let sslPinningInitialized = false;
let sslPinningSubscription: { remove: () => void } | null = null;
let sslPinningErrorHandler: ((hostname: string) => void) | null = null;

export const isSslPinningAvailable = (): boolean => isNativeSslPinningAvailable();

const logSslPinningState = (message: string, extra?: Record<string, unknown>): void => {
  console.log('[SSL Pinning]', {
    message,
    enabled: SSL_PINNING_ENABLED,
    nativeAvailable: isSslPinningAvailable(),
    appEnv: process.env.EXPO_PUBLIC_APP_ENV,
    forceFailure: FORCE_SSL_PINNING_FAILURE,
    ...extra,
  });
};

const getHostname = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

const verifyPinnedApiConnection = async (
  onPinMismatch?: (hostname: string) => void,
): Promise<void> => {
  const url = `${apiConfig.baseUrl}${API_ENDPOINTS.external.encryptionStatus}`;
  const hostname = getHostname(url);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PINNED_API_VERIFICATION_TIMEOUT_MS);

  try {
    logSslPinningState('verifying pinned API connection', { hostname });
    await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: apiHeaders.getCommon(),
      signal: controller.signal,
    });
    logSslPinningState('pinned API connection verified', { hostname });
  } catch (error) {
    console.error('[SSL Pinning] Pinned API verification failed', {
      hostname,
      error: error instanceof Error ? error.message : String(error),
    });
    onPinMismatch?.(hostname);
  } finally {
    clearTimeout(timeoutId);
  }
};

const ensureSslPinningErrorListener = (onPinMismatch?: (hostname: string) => void): void => {
  if (onPinMismatch) {
    sslPinningErrorHandler = onPinMismatch;
  }

  if (sslPinningSubscription) {
    return;
  }

  sslPinningSubscription = addSslPinningErrorListener((error) => {
    const hostname = error.serverHostname;

    console.error('[SSL Pinning] Pin mismatch', {
      hostname,
    });
    sslPinningErrorHandler?.(hostname);
  });
};

export const setupSslPinning = async (onPinMismatch?: (hostname: string) => void): Promise<void> => {
  if (!SSL_PINNING_ENABLED) {
    logSslPinningState('disabled by env');
    return;
  }

  if (sslPinningInitialized) {
    if (!sslPinningSubscription && isSslPinningAvailable()) {
      ensureSslPinningErrorListener(onPinMismatch);
    } else if (onPinMismatch) {
      sslPinningErrorHandler = onPinMismatch;
    }

    logSslPinningState('already initialized');
    return;
  }

  if (!isSslPinningAvailable()) {
    if (__DEV__) {
      console.warn('[SSL Pinning] Native module unavailable. Are you using Expo Go?');
      return;
    }

    throw new Error('SSL pinning native module is unavailable in production build');
  }

  const options = FORCE_SSL_PINNING_FAILURE ? TEST_FAILURE_PINNING_OPTIONS : PINNING_OPTIONS;

  logSslPinningState('initializing', {
    domains: Object.keys(options),
  });

  await initializeSslPinning(options);
  ensureSslPinningErrorListener(onPinMismatch);
  sslPinningInitialized = true;
  logSslPinningState('initialized', {
    domains: Object.keys(options),
  });
  await verifyPinnedApiConnection(onPinMismatch);
};

export const cleanupSslPinningListener = (): void => {
  sslPinningSubscription?.remove();
  sslPinningSubscription = null;
  sslPinningErrorHandler = null;
};
