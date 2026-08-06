import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logPushDebug from './log-push-debug';
import Constants from 'expo-constants';
import { useUserDetailsStore } from '@/src/store';
import { getOrCreateDeviceId } from '../deviceId-helper';
import { getInstallationId } from '../firebase-install-helper';
import { setFcmTokenOnServer } from '@/src/services/notifications/setFcmTokenOnServer';
import { consoleLogDev } from '../consoleLogDev';
import {
  markFcmTokenSaved,
  markFcmTokenSaveFinished,
  markFcmTokenSaveStarted,
  shouldDedupeFcmToken,
} from './pushTokenDedupeState';

/** Time interval for re-syncing token even if unchanged (24 hours in milliseconds) */
// const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;
const SYNC_INTERVAL_MS = 10;

const getLastSavedTokenKey = (platform: string, deviceId: string, userId?: string): string => {
  return `LAST_SAVED_PUSH_TOKEN:${platform}:${deviceId}:${userId || 'unknown'}`;
};

/**
 * Persist the FCM token for the authenticated user and avoid duplicate writes.
 */
export default async function saveTokenToDb(token: string, isAuthenticated: boolean, personalDetails: any ): Promise<void> {
  try {
    if (!isAuthenticated || !personalDetails) {
      logPushDebug('saveTokenToDb skipped unauthenticated user', {});
      return;
    }
    const userId = personalDetails?.userId;
    if (!token) {
      logPushDebug('saveTokenToDb skipped empty token', {});
      return;
    }
    if (shouldDedupeFcmToken(token)) {
      logPushDebug('saveTokenToDb deduped token write', { token });
      return;
    }
    markFcmTokenSaveStarted(token);
    if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
      logPushDebug('saveTokenToDb unsupported platform', { platform: Platform.OS });
      markFcmTokenSaveFinished(token);
      return;
    }
    const deviceId = (await getOrCreateDeviceId()) || (await getInstallationId());
    if (!deviceId) {
      console.warn('Device ID not available. Skipping user-token sync.');
      markFcmTokenSaveFinished(token);
      return;
    }
    const storageKey = getLastSavedTokenKey(Platform.OS, deviceId, userId);
    const lastPersistedToken = await AsyncStorage.getItem(storageKey);
    const payload = {
      deviceId,
      firebaseToken: token,
      platform: Platform.OS,
      appVersion: Constants.expoConfig?.version || '',
      otaVersion: Constants.expoConfig?.extra?.otaUpdateNumber || '',
    };
    consoleLogDev('[payload]', payload);
    const versionKey = `${storageKey}:version`;
    const lastPersistedVersion = await AsyncStorage.getItem(versionKey);
    const currentVersion = `${payload.appVersion}:${payload.otaVersion}`;
    const lastSyncTimeKey = `${storageKey}:lastSync`;
    const lastSyncTime = await AsyncStorage.getItem(lastSyncTimeKey);
    const now = Date.now();

    const shouldSkipSync =
      lastPersistedToken === token &&
      lastPersistedVersion === currentVersion &&
      lastSyncTime &&
      (now - parseInt(lastSyncTime, 10)) < SYNC_INTERVAL_MS;
    if (shouldSkipSync) {
      const timeSinceLastSyncMinutes = Math.floor((now - parseInt(lastSyncTime!, 10)) / 1000 / 60);
      logPushDebug('saveTokenToDb skipped - recently synced', {
        token,
        version: currentVersion,
        userId,
        timeSinceLastSyncMinutes,
      });
      markFcmTokenSaveFinished(token);
      return;
    }
    logPushDebug('saveTokenToDb syncing - reason', {
      tokenChanged: lastPersistedToken !== token,
      versionChanged: lastPersistedVersion !== currentVersion,
      timeLimitExceeded: !lastSyncTime || (now - parseInt(lastSyncTime, 10)) >= SYNC_INTERVAL_MS,
    });

    const registered = await setFcmTokenOnServer({
      firebaseToken: payload.firebaseToken,
      platform: payload.platform,
      appVersion: payload.appVersion,
      otaVersion: payload.otaVersion,
    });
    if (!registered) {
      logPushDebug('saveTokenToDb setFcmTokenOnServer failed or skipped before persist', {});
      return;
    }
    markFcmTokenSaved(token);
    await AsyncStorage.setItem(storageKey, token);
    await AsyncStorage.setItem(versionKey, currentVersion);
    await AsyncStorage.setItem(lastSyncTimeKey, now.toString());
    logPushDebug('saveTokenToDb synced token successfully', { token, deviceId, userId, syncTimestamp: now });
  } catch (error) {
    console.warn('Error saving FCM token to server:', error);
  } finally {
    markFcmTokenSaveFinished(token);
  }
}
