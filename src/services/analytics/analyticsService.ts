import { devConfig } from '@/src/config/dev';

import { ANALYTICS_EVENT, type AnalyticsEventName } from './events';
import { logEventToFacebookAnalytics } from './facebookAnalytics';
import { logEventToFirebaseAnalytics } from './firebaseAnalytics';
import { consoleLogDev } from '../../utils/common-helper';

type AnalyticsEventParams = Record<string, string | number>;

/**
 * Logs a standard event to Firebase and Facebook. Do not pass PII (phone, PAN, Aadhaar, etc.).
 */
export async function logAnalyticsEvent(
  name: AnalyticsEventName,
  params?: AnalyticsEventParams
): Promise<void> {
  await Promise.all([
    logEventToFirebaseAnalytics(name, params),
    logEventToFacebookAnalytics(name, params),
  ]);
}

type BureauPolicyResponseAppEventParams = {
  status?: string;
  decile?: number;
  declaredSalary?: number | null;
  offerAmount?: number | null;
  empType?: string;
  applicationType?: 'reloan' | 'fresh';
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const toNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

/**
 * Logs bureau policy response details to Firebase Analytics.
 * Keep parameters small and strictly typed; omit undefined values.
 *
 * GTM: parameter keys (`status`, `decile`, `declaredSalary`, `offerAmount`, `empType`) must match
 * Event Parameter variables in Tag Manager. See docs/gtm-bureau-policy-response-app.md.
 */
export async function logBureauPolicyResponseApp(
  params: BureauPolicyResponseAppEventParams
): Promise<void> {
  const payload: Record<string, string | number> = {};

  const status = toNonEmptyString(params.status);
  if (status) payload.status = status;

  if (isFiniteNumber(params.decile)) payload.decile = params.decile;
  payload['declaredSalary'] = params.declaredSalary ?? 0;
  payload['offerAmount'] = params.offerAmount ?? 0;
  payload['applicationType'] = params.applicationType ?? 'fresh';
  consoleLogDev('[analytics] bureau_policy_response_app payload', payload);

  const empType = toNonEmptyString(params.empType);
  if (empType) payload.empType = empType;

  // Avoid logging empty events (Firebase accepts them, but it adds noise).
  if (Object.keys(payload).length === 0) return;

  if (devConfig.enableDebugLogs) {
    // Dev-only: full payload for bureau_policy_response_app (no PII keys in this event).
    consoleLogDev('[analytics] bureau_policy_response_app payload', payload);
  }

  await Promise.all([
    logEventToFirebaseAnalytics(ANALYTICS_EVENT.BUREAU_POLICY_RESPONSE_APP, payload),
    logEventToFacebookAnalytics(ANALYTICS_EVENT.BUREAU_POLICY_RESPONSE_APP, payload),
  ]);
}