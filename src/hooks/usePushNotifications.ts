import { useEffect, useRef, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import handleNotificationSetup from '../utils/notifications/handle-notification-setup';
import { getFCMPushToken } from '../utils/firebase-messaging-helper';
import saveTokenToDb from '../utils/notifications/save-token-to-db';
import logPushDebug from '../utils/notifications/log-push-debug';
import resolveNotificationKey from '../utils/notifications/resolve-notification-key';
import { useNotificationLinkNavigation } from './useNotificationLinkNavigation';
import { useAuthStore } from '../store/useAuthStore';
import { useUserDetailsStore } from '../store';
import { consoleLogDev } from '../utils/common-helper';


/**
 * Subscribes to notification events and routes deep links without breaking back navigation.
 * The hook deduplicates navigation events across foreground/background entry points.
 */
export const usePushNotifications = () => {
  const { navigateToNotificationLink } = useNotificationLinkNavigation();
  const [lastSyncedFcmToken, setLastSyncedFcmToken] = useState<string | null>(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const prevIsAuthenticatedRef = useRef<boolean>(isAuthenticated);
  const personalDetails = useUserDetailsStore((state) => state.personalDetails);
  const lastHandledNotificationKeyRef = useRef<string | null>(null);
  const lastHandledLinkRef = useRef<string | null>(null);
  const lastHandledTimestampRef = useRef<number>(0);

  /**
   * Navigate to the notification link if needed, guarded against duplicate events that would corrupt the back stack.
   */
  const handleNotificationNavigation = (link: unknown, notificationKey?: string | null): void => {
    logPushDebug('handleNotificationNavigation invoked', { link, notificationKey });
    if (typeof link !== 'string') {
      logPushDebug('handleNotificationNavigation skipped non-string link', { link });
      return;
    }
    const trimmedLink = link.trim();
    if (!trimmedLink) {
      logPushDebug('handleNotificationNavigation skipped empty link', {});
      return;
    }
    const now = Date.now();
    if (lastHandledLinkRef.current === trimmedLink && now - lastHandledTimestampRef.current < 5000) {
      logPushDebug('handleNotificationNavigation deduped recent link', { trimmedLink, elapsed: now - lastHandledTimestampRef.current });
      return;
    }
    if (notificationKey) {
      if (lastHandledNotificationKeyRef.current === notificationKey) {
        logPushDebug('handleNotificationNavigation deduped notification key', { notificationKey });
        return;
      }
      lastHandledNotificationKeyRef.current = notificationKey;
    }
    lastHandledLinkRef.current = trimmedLink;
    lastHandledTimestampRef.current = now;
    logPushDebug('handleNotificationNavigation navigating', { trimmedLink, notificationKey, timestamp: now });
    navigateToNotificationLink(trimmedLink);
  };

  // // Subscribe to notification events
  // const subscribeToNotificationEvents = () => {
  //   console.log('(Subscribing) INFO:: Subscribing to notification events...');
  //   // Background notifications handler
  //   messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  //     console.log('Message handled in the background!', remoteMessage);
  //   });
  //   // Foreground notifications
  //   const unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
  //     console.log('Foreground notification received:', remoteMessage);
  //     const alertName = remoteMessage?.data?.alert_name || remoteMessage?.notification?.title || '';
  //     const link = remoteMessage?.data?.link || null;
  //     DeviceEventEmitter.emit('show-alert-found', { alertName, link });
  //   });

  //   // Token refresh handling
  //   const unsubscribeOnTokenRefresh = messaging().onTokenRefresh(
  //     async (newToken) => {
  //       try {
  //         if (!newToken || newToken === lastSyncedFcmToken) {
  //           return;
  //         }
  //         await saveTokenToDb(newToken);
  //         setLastSyncedFcmToken(newToken);
  //         if (isAuthenticated && personalDetails) {
  //           console.log('[Push] Token refresh reconcile');
  //           // await TopicChannelManager.reconcileTopics(userProfileData);
  //         }
  //       } catch (err) {
  //         console.warn('Failed to sync refreshed FCM token:', err);
  //       }
  //     }
  //   );

  //   // Notification opened when the app is in the background
  //   const unsubscribeOnNotificationOpened = messaging().onNotificationOpenedApp(
  //     (remoteMessage) => {
  //       console.log('Notification opened from background:', remoteMessage);
  //       DeviceEventEmitter.emit('onNotificationOpened', remoteMessage.data);
  //       const link = remoteMessage.data?.link;
  //       const notificationKey = resolveNotificationKey(
  //         remoteMessage.messageId ?? remoteMessage.data?.messageId,
  //         remoteMessage.sentTime ?? remoteMessage.data?.sentTime
  //       );
  //       logPushDebug('onNotificationOpenedApp event', {
  //         link,
  //         notificationKey,
  //         messageId: remoteMessage.messageId,
  //         sentTime: remoteMessage.sentTime,
  //       });
  //       handleNotificationNavigation(link, notificationKey);
  //     }
  //   );

  //   // Notification opened when the app was quit
  //   const handleInitialNotification = async () => {
  //     const initialNotification = await messaging().getInitialNotification();
  //     if (initialNotification) {
  //       console.log(
  //         'Notification opened from quit state:',
  //         initialNotification
  //       );
  //       const notificationKey = resolveNotificationKey(
  //         initialNotification.messageId ?? initialNotification.data?.messageId,
  //         initialNotification.sentTime ?? initialNotification.data?.sentTime
  //       );
  //       DeviceEventEmitter.emit(
  //         'onNotificationOpened',
  //         initialNotification.data
  //       );
  //       const link = initialNotification.data?.link;
  //       logPushDebug('getInitialNotification event', {
  //         link,
  //         notificationKey,
  //         messageId: initialNotification.messageId,
  //         sentTime: initialNotification.sentTime,
  //       });
  //       handleNotificationNavigation(link, notificationKey);
  //     }
  //   };
  //   handleInitialNotification();

  //   return () => {
  //     unsubscribeOnMessage();
  //     unsubscribeOnTokenRefresh();
  //     unsubscribeOnNotificationOpened();
  //   };
  // };

  // useEffect(() => {
  //   const unsubscribeEvents = subscribeToNotificationEvents();

  //   return () => {
  //     unsubscribeEvents();
  //   };
  // }, []);

  // Sync FCM token when authenticated. On iOS, getFCMPushToken does not prompt — permission
  // must already be granted (e.g. permissions screen or Settings); otherwise token is null.
  useEffect(() => {
    const syncOnAuth = async () => {
      // debugger;
      if (!isAuthenticated) {
        return;
      }
      const token = await getFCMPushToken();
      consoleLogDev('Before saveTokenToDb', token);
      const isTokenChanged = token && token !== lastSyncedFcmToken;
      consoleLogDev('isTokenChanged', isTokenChanged);
      if (token) {
        consoleLogDev('After saveTokenToDb', token);
        await saveTokenToDb(token, isAuthenticated, personalDetails);
        setLastSyncedFcmToken(token);
      }
      if (isAuthenticated && personalDetails) {
        consoleLogDev('[Push] Auth change reconcile', { isAuthenticated, personalDetails });
        // await TopicChannelManager.reconcileTopics(userProfileData);
      }
    };
    syncOnAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, personalDetails]);

  // On logout transition, unsubscribe from all topics
  useEffect(() => {
    const prev: boolean = prevIsAuthenticatedRef.current;
    if (prev && !isAuthenticated) {
      consoleLogDev('[Push] Logout unsubscribeAll');
      // TopicChannelManager.unsubscribeAll();
    }
    prevIsAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  return {
    handleNotificationSetup,
  };
};
