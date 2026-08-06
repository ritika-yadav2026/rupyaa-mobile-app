import { getFCMPushToken, requestUserPermission } from '../firebase-messaging-helper';
import saveTokenToDb from './save-token-to-db';
import logPushDebug from './log-push-debug';

let isNotificationSetupInProgress: boolean = false;

/**
 * Ensure notification permissions are granted and sync the FCM token.
 * On iOS, `requestUserPermission` may show the system dialog; `getFCMPushToken` does not prompt.
 */
export default async function handleNotificationSetup(isAuthenticated: boolean, personalDetails: any): Promise<void> {
  if (isNotificationSetupInProgress) {
    logPushDebug('handleNotificationSetup already running', {});
    return;
  }
  isNotificationSetupInProgress = true;
  try {
    const hasPermission = await requestUserPermission();
    if (!hasPermission) {
      console.warn('Notification permissions are required.');
      return;
    }
    const token = await getFCMPushToken();
    if (!token) {
      logPushDebug('handleNotificationSetup missing token', {});
      return;
    }
    logPushDebug('handleNotificationSetup obtained token', { token });
    await saveTokenToDb(token, isAuthenticated, personalDetails);
  } finally {
    isNotificationSetupInProgress = false;
  }
}

