import { Platform } from 'react-native';
import { isEmulator } from 'react-native-device-info';
import { Adjust } from 'react-native-adjust';
import {
  pushAdjustAttributionCaptured,
  pushAdjustAttributionError,
} from '@/src/services/logging';

const ADID_TIMEOUT_MS = 3000;
// Adjust attribution is best-effort for auth payloads. In local/dev builds the
// native callback can occasionally never resolve, so keep OTP verification from
// being blocked indefinitely while still giving production devices time to respond.
const ATTRIBUTION_TIMEOUT_MS = 3000;

type NullableString = string | null;

export type AdjustAttributionIds = {
  adid: NullableString;
  gps_adid: NullableString;
  idfa: NullableString;
  idfv: NullableString;
};

const safeResolve = (
  resolver: (callback: (value: NullableString) => void) => void
): Promise<NullableString> => {
  return new Promise((resolve) => {
    try {
      resolver((value) => resolve(value ?? null));
    } catch {
      resolve(null);
    }
  });
};

const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => resolve(fallback), timeoutMs);

    promise
      .then((value) => resolve(value))
      .catch(() => resolve(fallback))
      .finally(() => clearTimeout(timeoutId));
  });
};

const getAdidWithTimeout = (): Promise<NullableString> => {
  return safeResolve((callback) => {
    Adjust.getAdidWithTimeout(ADID_TIMEOUT_MS, callback);
  });
};

const getGoogleAdId = (): Promise<NullableString> => {
  return safeResolve((callback) => {
    Adjust.getGoogleAdId(callback);
  });
};

const getIdfa = (): Promise<NullableString> => {
  return safeResolve((callback) => {
    Adjust.getIdfa(callback);
  });
};

const getIdfv = (): Promise<NullableString> => {
  return safeResolve((callback) => {
    Adjust.getIdfv(callback);
  });
};

export async function getAdjustAttributionIdsForSaveAppInfo(): Promise<AdjustAttributionIds> {
  if (Platform.OS === 'android') {
    const [adid, gpsAdid] = await Promise.all([getAdidWithTimeout(), getGoogleAdId()]);
    return {
      adid,
      gps_adid: gpsAdid,
      idfa: null,
      idfv: null,
    };
  }

  if (Platform.OS === 'ios') {
    const [adid, idfa, idfv] = await Promise.all([getAdidWithTimeout(), getIdfa(), getIdfv()]);
    return {
      adid,
      gps_adid: null,
      idfa,
      idfv,
    };
  }

  return {
    adid: null,
    gps_adid: null,
    idfa: null,
    idfv: null,
  };
}

export type AdjustAttributionData = {
  trackerToken: NullableString;
  trackerName: NullableString;
  network: NullableString;
  campaign: NullableString;
  adgroup: NullableString;
  creative: NullableString;
  clickLabel: NullableString;
};

const EMPTY_ADJUST_ATTRIBUTION: AdjustAttributionData = {
  trackerToken: null,
  trackerName: null,
  network: null,
  campaign: null,
  adgroup: null,
  creative: null,
  clickLabel: null,
};

const getAdjustAttribution = (): Promise<AdjustAttributionData> => {
  return new Promise((resolve) => {
    try {
      Adjust.getAttribution((attribution) => {
        console.log('[AdjustAttributionIds] attribution', attribution);
        resolve(
          attribution
            ? {
                trackerToken: attribution.trackerToken ?? null,
                trackerName: attribution.trackerName ?? null,
                network: attribution.network ?? null,
                campaign: attribution.campaign ?? null,
                adgroup: attribution.adgroup ?? null,
                creative: attribution.creative ?? null,
                clickLabel: attribution.clickLabel ?? null,
              }
            : EMPTY_ADJUST_ATTRIBUTION
        );
      });
    } catch {
      console.log('[AdjustAttributionIds] error getting attribution');
      resolve(EMPTY_ADJUST_ATTRIBUTION);
    }
  });
};

/**
 * Resolves Adjust's server-side attribution (campaign/adgroup/creative/network).
 * Required because Adjust deep links (go.link/adj.st) only put an opaque
 * `adjust_reftag` in the Play Install Referrer string, not the campaign name —
 * the real values only come back through this SDK call.
 */
export async function getAdjustAttributionData(): Promise<AdjustAttributionData> {
  if (Platform.OS === 'web') {
    return EMPTY_ADJUST_ATTRIBUTION;
  }

  try {
    const data = await withTimeout(
      getAdjustAttribution(),
      ATTRIBUTION_TIMEOUT_MS,
      EMPTY_ADJUST_ATTRIBUTION
    );
    console.log('[AdjustAttributionIds] data', data);
    if (data.network || data.campaign || data.trackerToken) {
      pushAdjustAttributionCaptured({
        network: data.network ?? '',
        campaign: data.campaign ?? '',
        adgroup: data.adgroup ?? '',
        creative: data.creative ?? '',
        trackerToken: data.trackerToken ?? '',
      });
    }
    return data;
  } catch (error) {
    pushAdjustAttributionError(error);
    return EMPTY_ADJUST_ATTRIBUTION;
  }
}

const ADJUST_AUTH_PAYLOAD_KEY_MAP: Record<keyof AdjustAttributionData, string> = {
  trackerToken: 'adjust_tracker_token',
  trackerName: 'adjust_tracker_name',
  network: 'adjust_network',
  campaign: 'adjust_campaign',
  adgroup: 'adjust_adgroup',
  creative: 'adjust_creative',
  clickLabel: 'adjust_click_label',
};

/** Flat, non-empty Adjust attribution fields for merging into the OTP verify body. */
export async function getAdjustAttributionForAuthPayload(): Promise<
  Record<string, string> | undefined
> {
  if (Platform.OS === 'web') return undefined;
  if (Platform.OS === 'android' && (await isEmulator())) return undefined;

  const data = await getAdjustAttributionData();
  const params: Record<string, string> = {};
  for (const field of Object.keys(ADJUST_AUTH_PAYLOAD_KEY_MAP) as (keyof AdjustAttributionData)[]) {
    const value = data[field];
    if (value) params[ADJUST_AUTH_PAYLOAD_KEY_MAP[field]] = value;
  }

  return Object.keys(params).length > 0 ? params : undefined;
}
