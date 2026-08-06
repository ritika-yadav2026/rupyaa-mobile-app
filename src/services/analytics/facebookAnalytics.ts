import { AppEventsLogger } from 'react-native-fbsdk-next';

import { devConfig } from '@/src/config/dev';
import type { AnalyticsEventName } from './events';
import { consoleLogDev } from '../../utils/common-helper';

type FacebookAnalyticsEventParams = Record<string, string | number>;

export async function logEventToFacebookAnalytics(
  eventName: AnalyticsEventName,
  params?: FacebookAnalyticsEventParams
): Promise<void> {
  if (devConfig.enableDebugLogs) {
    consoleLogDev('[analytics][facebook] logEvent:start', {
      eventName,
      hasParams: Boolean(params && Object.keys(params).length > 0),
      params,
    });
  }

  try {
    if (!params || Object.keys(params).length === 0) {
      AppEventsLogger.logEvent(eventName);
    } else {
      AppEventsLogger.logEvent(eventName, params);
    }

    // Facebook SDK buffers events and flushes every ~15s by default.
    // Force an immediate flush so events appear in Events Manager without delay.
    AppEventsLogger.flush();

    if (devConfig.enableDebugLogs) {
      consoleLogDev('[analytics][facebook] logEvent:success', {
        eventName,
        ...(params && Object.keys(params).length > 0 ? { params } : {}),
      });
    }
  } catch (error) {
    if (devConfig.enableDebugLogs) {
      consoleLogDev('[analytics][facebook] logEvent:error', {
        eventName,
        error,
      });
    }
  }
}
