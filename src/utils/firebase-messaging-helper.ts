import { PermissionsAndroid, Platform } from 'react-native';
import {
  AuthorizationStatus,
  getAPNSToken,
  getMessaging,
  getToken,
  hasPermission as getMessagingPermissionStatus,
  registerDeviceForRemoteMessages,
  requestPermission,
  subscribeToTopic,
  unsubscribeFromTopic,
} from '@react-native-firebase/messaging';
import { isEmulator } from 'react-native-device-info';
import { consoleLogDev } from "./common-helper";

// Request notification permissions
export const requestUserPermission = async (): Promise<boolean> => {
  // ✅ Android 13+ requires explicit runtime permission
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    const granted = result === PermissionsAndroid.RESULTS.GRANTED;
    consoleLogDev('[Android 13+] Notification permission:', granted);
    return granted;
  }

  // ✅ iOS and older Android versions
  const messaging = getMessaging();
  const authStatus = await requestPermission(messaging);
  const enabled =
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL;
  consoleLogDev('[Firebase] Authorization status:', authStatus, enabled);
  return enabled;
};

// Check permission status
export const requestUserNotificationPermissionStatus = async (): Promise<
  'granted' | 'denied' | 'undetermined'
> => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const androidGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return androidGranted ? 'granted' : 'denied';
  }

  const messaging = getMessaging();
  const authStatus = await getMessagingPermissionStatus(messaging);
  switch (authStatus) {
    case AuthorizationStatus.AUTHORIZED:
    case AuthorizationStatus.PROVISIONAL:
      return 'granted';
    case AuthorizationStatus.DENIED:
      return 'denied';
    default:
      return 'undetermined';
  }
};

/**
 * Returns an FCM token without showing the iOS notification permission dialog.
 * On iOS, call {@link requestUserPermission} first (e.g. permissions screen or settings).
 * Android path unchanged: no iOS-only permission call here.
 */
export const getFCMPushToken = async (): Promise<string | null> => {
  try {
    // APNs (and therefore FCM on iOS) is unsupported on simulators — skip silently.
    const runningOnEmulator = await isEmulator();
    if (runningOnEmulator) {
      consoleLogDev('[FCM] Skipping push token fetch — running on emulator/simulator');
      return null;
    }

    const messaging = getMessaging();
    if (Platform.OS === 'ios') {
      await registerDeviceForRemoteMessages(messaging);

      const authStatus = await getMessagingPermissionStatus(messaging);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        consoleLogDev(
          '[FCM] iOS alerts not authorized — skip token (use requestUserPermission to prompt)',
        );
        return null;
      }
    }

    const token = await getToken(messaging);
    consoleLogDev('FCM Token:', token);

    if (Platform.OS === 'ios') {
      const apnsToken = await getAPNSToken(messaging);
      consoleLogDev('APNS Token:', apnsToken);
    }

    return token;
  } catch (error) {
    console.error('Error fetching FCM token:', error);
    return null;
  }
};

// Toggle subscription to a specific topic
export const toggleTopicSubscription = async (
  topic: string,
  subscribe: boolean,
) => {
  try {
    const messaging = getMessaging();
    if (subscribe) {
      await subscribeToTopic(messaging, topic);
      consoleLogDev(`✅ Subscribed to topic: ${topic}`);
    } else {
      await unsubscribeFromTopic(messaging, topic);
      consoleLogDev(`❌ Unsubscribed from topic: ${topic}`);
    }
  } catch (error) {
    console.error(`Error toggling subscription for topic: ${topic}`, error);
  }
};
