import analytics from '@react-native-firebase/analytics';

import { devConfig } from '@/src/config/dev';
import type { AnalyticsEventName } from './events';
import { consoleLogDev } from '../../utils/common-helper';

type FirebaseAnalyticsEventParams = Record<string, string | number>;

export async function logEventToFirebaseAnalytics(
  eventName: AnalyticsEventName,
  params?: FirebaseAnalyticsEventParams
): Promise<void> {
  // Keep analytics debug logs dev-only to avoid noisy production logs.
  if (devConfig.enableDebugLogs) {
    consoleLogDev('[analytics][firebase] logEvent:start', {
      eventName,
      hasParams: Boolean(params && Object.keys(params).length > 0),
      params,
    });
  }

  try {
    if (!params || Object.keys(params).length === 0) {
      await analytics().logEvent(eventName);
    } else {
      await analytics().logEvent(eventName, params);
    }

    if (devConfig.enableDebugLogs) {
      consoleLogDev('[analytics][firebase] logEvent:success', {
        eventName,
        ...(params && Object.keys(params).length > 0 ? { params } : {}),
      });
    }
  } catch (error) {
    if (devConfig.enableDebugLogs) {
      consoleLogDev('[analytics][firebase] logEvent:error', { eventName, error });
    }
    throw error;
  }
}

export async function logScreenViewToFirebaseAnalytics(params: {
  screenName: string;
  screenClass?: string;
}): Promise<void> {
  if (devConfig.enableDebugLogs) {
    consoleLogDev('[analytics][firebase] logScreenView:start', {
      screenName: params.screenName,
      screenClass: params.screenClass,
    });
  }

  try {
    await analytics().logScreenView({
      screen_name: params.screenName,
      screen_class: params.screenClass,
    });

    if (devConfig.enableDebugLogs) {
      consoleLogDev('[analytics][firebase] logScreenView:success', {
        screenName: params.screenName,
      });
    }
  } catch (error) {
    if (devConfig.enableDebugLogs) {
      consoleLogDev('[analytics][firebase] logScreenView:error', {
        screenName: params.screenName,
        error,
      });
    }
    throw error;
  }
}

