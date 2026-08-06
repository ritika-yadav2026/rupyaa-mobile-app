import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Button } from '@/src/components/Button';
import type { GetUserBankStatementStatusResult } from '@/src/types/user';
import {
  BANK_CONNECT_CONTINUE_LABELS,
  getProcessedStatusMessage,
} from './bankConnectContinueMessages';

export type BankConnectFlowScenario = 'aa-flow' | 'manual-upload';

/** Derived from API attempt counts (getUserBankStatementStatus): which BSA step options to show. */
export type BankConnectAttemptState =
  | 'aa-only'        // AA available, manual upload unavailable or not returned
  | 'aa-with-manual' // AA and manual upload are both available
  | 'manual-only'    // aaAttemptsLeft = 0, manual still available; redirect to upload-idle
  | 'exhausted'      // both = 0; call fetchUserStage
  | 'normal';        // legacy; resolver no longer returns this

type AttemptsLeft = number | null;

export type BankConnectAttemptsLeft = {
  aaAttemptsLeft: AttemptsLeft;
  manualUploadAttemptsLeft: AttemptsLeft;
};

/** Parses attempts-left value from backend payload into a safe number. */
function parseAttemptsLeft(value: unknown): AttemptsLeft {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

/** AA attempts are sent as AAattemptsLeft (or aaAttemptsLeft). */
export function resolveAaAttemptsLeft(
  response: GetUserBankStatementStatusResult | undefined
): AttemptsLeft {
  return parseAttemptsLeft(response?.AAattemptsLeft ?? response?.aaAttemptsLeft);
}

/** Manual upload retry attempts from backend. */
export function resolveManualUploadAttemptsLeft(
  response: GetUserBankStatementStatusResult | undefined
): AttemptsLeft {
  return parseAttemptsLeft(response?.manualUploadAttemptsLeft);
}

/**
 * Derives which BSA options to show based on attempt counts from getUserBankStatementStatus.
 * Missing attempt counts are treated as unavailable, except a fully missing response
 * defaults to AA-only while the initial status request is unresolved.
 */
export function resolveBankConnectAttemptState(
  attempts: BankConnectAttemptsLeft
): BankConnectAttemptState {
  const aaLeft = attempts.aaAttemptsLeft;
  const manualLeft = attempts.manualUploadAttemptsLeft;

  const aaAvailable = aaLeft != null && aaLeft > 0;
  const manualAvailable = manualLeft != null && manualLeft > 0;

  if (aaAvailable && manualAvailable) return 'aa-with-manual';
  if (aaAvailable) return 'aa-only';
  if (manualAvailable) return 'manual-only';
  if (aaLeft == null && manualLeft == null) return 'aa-only';
  return 'exhausted';
}

/**
 * Returns polling config for the given flow scenario.
 * intervalMs: used for approved-status polling (unlimited until status changes).
 * maxAttempts / maxAttemptsWithoutStatusChange retained for type compatibility but not used (approved = unlimited).
 */
export function getBankConnectPollingConfig(scenario: BankConnectFlowScenario) {
  if (scenario === 'manual-upload') {
    return {
      intervalMs: 5000,
      maxAttempts: 10,
      maxAttemptsWithoutStatusChange: 4,
    } as const;
  }
  return {
    intervalMs: 5000,
    maxAttempts: 6,
    maxAttemptsWithoutStatusChange: 2,
  } as const;
}

/** @deprecated Use getBankConnectPollingConfig('aa-flow') for backward compatibility. */
export const BANK_STATEMENT_PENDING_POLLING = getBankConnectPollingConfig('aa-flow');

/** Resolves processed message and logs when debug logs are enabled. */
export function getProcessedPendingMessage(cameFromOfferings: boolean): string {
  return getProcessedStatusMessage(cameFromOfferings);
}

type ContinueWithExistingOfferButtonProps = {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  buttonVariant?: 'outline' | 'primary';
  label?: string;
  loading?: boolean;
};

export function ContinueWithExistingOfferButton({
  onPress,
  style,
  buttonVariant = 'outline',
  label = BANK_CONNECT_CONTINUE_LABELS.continueWithExistingOffer,
  loading = false,
}: ContinueWithExistingOfferButtonProps): React.JSX.Element {
  return (
    <>
    <Button
      variant={buttonVariant}
      size="large"
      fullWidth
      style={[style, {
        borderWidth: 0,
      }]}
      textStyle={{
        textDecorationLine: 'underline',
      }}
      loading={loading}
      onPress={onPress}
      >
      {label}
    </Button>
      </>
  );
}
