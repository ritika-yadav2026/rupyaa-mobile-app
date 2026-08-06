import { Platform } from 'react-native';
import { API_ENDPOINTS, apiConfig, apiHeaders } from '@/src/config/api';
import { devConfig } from '@/src/config/dev';
import { encryptPayload } from '@/src/utils/crypto';
import { useAuthStore } from '@/src/store/useAuthStore';
import { getEnableEncryption } from '@/src/config/resolvedAppConfig';
import { getCachedGeoLocationString } from '../location/geoLocation';
import { getOrCreateDeviceId } from '@/src/utils/deviceId-helper';

export interface SetFcmTokenPayload {
  firebaseToken: string;
  platform: string;
  appVersion?: string;
  otaVersion?: string;
}

/**
 * Registers the device FCM token with the backend.
 * Not gated by `enableStartupApis` — that flag is for optional startup jobs; push token registration
 * must still run after login when we have a valid session.
 */
export async function setFcmTokenOnServer(payload: SetFcmTokenPayload): Promise<boolean> {
  if (!payload.firebaseToken || (Platform.OS !== 'android' && Platform.OS !== 'ios')) {
    return false;
  }

  try {
    const url = `${apiConfig.baseUrl}${API_ENDPOINTS.user.setFcmToken}`;

    const token = useAuthStore.getState().accessToken;
    if (!token) {
      return false;
    }

    const bodyObj = {
      firebaseToken: payload.firebaseToken,
      platform: payload.platform,
      appVersion: payload.appVersion,
      otaVersion: payload.otaVersion,
    };
    const shouldEncrypt = getEnableEncryption();
    const [deviceId, geoLocationStr] = await Promise.all([
      getOrCreateDeviceId(),
      getCachedGeoLocationString(),
    ]);
    const headers: Record<string, string> = {
      'X-Device-Id': deviceId,
      'X-Geo-Location': geoLocationStr,
      ...apiHeaders.getCommon(),
      Authorization: `${token}`,
    };
    if (shouldEncrypt) {
      headers['X-Encrypted'] = 'true';
    }
    const body = shouldEncrypt
      ? JSON.stringify({ data: await encryptPayload(bodyObj) })
      : JSON.stringify(bodyObj);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      if (devConfig.enableDebugLogs) {
        console.log(
          '[FCM] setFcmTokenOnServer non-2xx status',
          response.status,
        );
      }
      return false;
    }

    return true;
  } catch (error) {
    if (devConfig.enableDebugLogs) {
      console.log('[FCM] setFcmTokenOnServer failed', error);
    }
    return false;
  }
}

