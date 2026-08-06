import { devConfig } from '@/src/config/dev';
import { pushAppError } from '@/src/services/logging/logPoolJourney';
import { formatLogPoolUnknownError } from '@/src/services/logging/logPoolMessages';

/**
 * Logs non-fatal errors without affecting caller flow.
 * - Dev console (no raw PII in message text)
 * - Log pool (server batch) when phone is available
 * - TODO: wire Sentry/Crashlytics here
 */
export function logNonFatalError(context: string, error: unknown): void {
  if (devConfig.enableDebugLogs) {
    console.warn(`[nonFatal] ${context}`, formatLogPoolUnknownError(error));
  }

  pushAppError(context, error);

  // TODO: Sentry.captureException(error, { extra: { context } });
}
