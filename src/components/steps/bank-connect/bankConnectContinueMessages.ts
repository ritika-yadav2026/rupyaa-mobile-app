/**
 * Single place for all Bank Connect step messages and continue button labels.
 * Change copy here; add logs via getters so we can debug which message is shown.
 */

import type { OfferLoanStatus } from '@/src/types/offer';
import type { NormalizedBankStatementStatus } from './useBankStatementStatus';
import { devLog } from '@/src/utils';

const STEP_ID = 'bank-connect';

/** State of a single checklist row for the bank-connect status checklist UI. */
export type ChecklistItemState =
  | 'waiting'
  | 'in-progress'
  | 'done'
  | 'failed';

/** One row in the bank statement status checklist (e.g. "Connecting to your bank"). */
export interface BankConnectChecklistItem {
  id: string;
  label: string;
  state: ChecklistItemState;
}

const CHECKLIST_ROW_IDS = {
  connect: 'connect',
  fetch: 'fetch',
  process: 'process',
  offer: 'offer',
} as const;

const CHECKLIST_LABELS = {
  // connect: 'Connecting to your bank',
  fetch: 'Fetching bank statement',
  process: 'Processing statement',
  // offer: 'Checking offer eligibility',
} as const;

/** Min ms to show each checklist step before advancing. Prevents instant jump to done when API returns fast. */
export const CHECKLIST_MIN_DURATION_PER_STEP_MS = 2000;

/** Min ms to delay terminal status (processed/rejected) when API returns very quickly. Ensures checklist is visible for at least this duration. */
export const MIN_TERMINAL_STATUS_DELAY_MS =
  2 * CHECKLIST_MIN_DURATION_PER_STEP_MS;

export type ResolveBankConnectChecklistParams = {
  bankStatementStatus: NormalizedBankStatementStatus | undefined;
  /** Set when status is processed and current-offer API has settled. */
  offerLoanStatus?: OfferLoanStatus;
  /** True when pending polling stopped due to max attempts (timed out). */
  isTimedOut?: boolean;
};

/**
 * Returns checklist items for the bank-statement-pending view.
 * Maps bankStatementStatus (and optionally offerLoanStatus / isTimedOut) to row states.
 * Used to show progressive status UI during polling.
 */
export function resolveBankConnectChecklist({
  bankStatementStatus,
  offerLoanStatus,
  isTimedOut = false,
}: ResolveBankConnectChecklistParams): BankConnectChecklistItem[] {
  const status = bankStatementStatus ?? 'unknown';
  if (status === 'rejected') {
    return [
      // { id: CHECKLIST_ROW_IDS.connect, label: CHECKLIST_LABELS.connect, state: 'done' },
      { id: CHECKLIST_ROW_IDS.fetch, label: CHECKLIST_LABELS.fetch, state: 'failed' },
      { id: CHECKLIST_ROW_IDS.process, label: CHECKLIST_LABELS.process, state: 'waiting' },
      // { id: CHECKLIST_ROW_IDS.offer, label: CHECKLIST_LABELS.offer, state: 'waiting' },
    ];
  }

  if (status === 'pending' || status === 'in-progress') {
    return [
      // {
      //   id: CHECKLIST_ROW_IDS.connect,
      //   label: CHECKLIST_LABELS.connect,
      //   state: isTimedOut ? 'done' : 'in-progress',
      // },
      { id: CHECKLIST_ROW_IDS.fetch, label: CHECKLIST_LABELS.fetch, state: 'waiting' },
      { id: CHECKLIST_ROW_IDS.process, label: CHECKLIST_LABELS.process, state: 'waiting' },
      // { id: CHECKLIST_ROW_IDS.offer, label: CHECKLIST_LABELS.offer, state: 'waiting' },
    ];
  }

  if (status === 'approved') {
    return [
      // { id: CHECKLIST_ROW_IDS.connect, label: CHECKLIST_LABELS.connect, state: 'done' },
      { id: CHECKLIST_ROW_IDS.fetch, label: CHECKLIST_LABELS.fetch, state: 'in-progress' },
      { id: CHECKLIST_ROW_IDS.process, label: CHECKLIST_LABELS.process, state: 'waiting' },
      // { id: CHECKLIST_ROW_IDS.offer, label: CHECKLIST_LABELS.offer, state: 'waiting' },
    ];
  }

  if (status === 'processed') {
    const offerResolved = offerLoanStatus !== undefined;
    const processState: ChecklistItemState =
      offerResolved && offerLoanStatus !== 'Pending' ? 'done' : 'in-progress';
    let offerState: ChecklistItemState = offerResolved ? 'in-progress' : 'waiting';
    if (offerResolved && offerLoanStatus === 'Verified') offerState = 'done';
    else if (offerResolved && offerLoanStatus === 'rejected') offerState = 'failed';
    else if (offerResolved && offerLoanStatus === 'Pending') offerState = 'in-progress';

    return [
      // { id: CHECKLIST_ROW_IDS.connect, label: CHECKLIST_LABELS.connect, state: 'done' },
      { id: CHECKLIST_ROW_IDS.fetch, label: CHECKLIST_LABELS.fetch, state: 'done' },
      { id: CHECKLIST_ROW_IDS.process, label: CHECKLIST_LABELS.process, state: processState },
      // { id: CHECKLIST_ROW_IDS.offer, label: CHECKLIST_LABELS.offer, state: offerState },
    ];
  }

  // unknown or any other status: show first row in progress
  return [
    // {
    //   id: CHECKLIST_ROW_IDS.connect,
    //   label: CHECKLIST_LABELS.connect,
    //   state: 'in-progress',
    // },
    { id: CHECKLIST_ROW_IDS.fetch, label: CHECKLIST_LABELS.fetch, state: 'waiting' },
    { id: CHECKLIST_ROW_IDS.process, label: CHECKLIST_LABELS.process, state: 'waiting' },
    // { id: CHECKLIST_ROW_IDS.offer, label: CHECKLIST_LABELS.offer, state: 'waiting' },
  ];
}

/** Messages shown while bank statement status is pending or resolved */
export const BANK_CONNECT_STATUS_MESSAGES = {
  fetchingBankDetails: 'We are fetching your bank statement.',
  /** Used for pending / approved phases while polling. */
  processing: 'We are fetching your bank statement.',
  /** Used when status is processed, until bank statement keys are available. */
  processingStatement: 'We are processing your bank statement.',
  timedOut:
    'We are checking you application , Will get back to you after some time',
  pollingStopped:
    'Unable to fetch your bank statement. Please try again or upload manually.',
  processed: 'Your statements are processed.',
  processedWithOffer:
    'Your statements are processed. You can continue with existing offers.',
  rejected:
    'We couldn’t fetch your bank details because the request wasn’t completed.',
  /** No active offer but retry is still possible using low-attempt fallback. */
  noOfferRetryBankStatement:
    'No offer yet. Please retry by uploading bank statement manually.',
  /** Shown when no offer; user can go to home page. */
  noOffer: "You don't have any offer. You can go to home page.",
  /** Loan under review: hide CTA. */
  processedLoanPending: 'Your application is under review.',
  /** Loan verified: show CTA. */
  processedLoanVerified: 'You got an offer!',
  /** Loan not approved: hide CTA. */
  processedLoanRejected:
    "We couldn't approve your application at this time. Please try again later.",
} as const;

/** Labels for the continue / existing-offer CTA. */
export const BANK_CONNECT_CONTINUE_LABELS = {
  /** When bankStatementStatus is approved or processed; change here to update. */
  goToUpdated: 'Go to updated',
  checkOfferNow: 'Show Latest Offer',
  continueWithExistingOffer: 'Continue with existing offer',
} as const;

export type BankConnectContinueContext = {
  shouldShowOfferReadyAction: boolean;
  cameFromOfferings: boolean;
  /** When rejected, spec requires "Continue with existing offer" for all entry points. */
  bankStatementStatus?: 'pending' | 'approved' | 'processed' | 'unknown' | 'rejected' | 'in-progress';
};

/**
 * Returns the button label for the continue action (context-based).
 * Use for mobile / upload-idle when status is not yet approved/processed.
 * When status is rejected, always returns "Continue with existing offer" per spec.
 * Logs when debug logs are enabled.
 */
export function getContinueButtonLabel(
  context: BankConnectContinueContext
): string {
  const { shouldShowOfferReadyAction, cameFromOfferings, bankStatementStatus } = context;
  if (bankStatementStatus === 'rejected') {
    const label = BANK_CONNECT_CONTINUE_LABELS.continueWithExistingOffer;
    devLog.stepMessage(STEP_ID, 'continueButtonLabel', label);
    return label;
  }
  const label =
    shouldShowOfferReadyAction && !cameFromOfferings
      ? BANK_CONNECT_CONTINUE_LABELS.checkOfferNow
      : BANK_CONNECT_CONTINUE_LABELS.continueWithExistingOffer;
  devLog.stepMessage(STEP_ID, 'continueButtonLabel', label);
  return label;
}

/**
 * Returns the CTA label when bankStatementStatus is approved or processed.
 * Call current-offer API when entering this state; use this label for the single CTA.
 * Logs when debug logs are enabled.
 */
export function getGoToUpdatedLabel(): string {
  const label = BANK_CONNECT_CONTINUE_LABELS.checkOfferNow;
  devLog.stepMessage(STEP_ID, 'goToUpdatedLabel', label);
  return label;
}

/**
 * Returns the status message shown when statement is processed.
 * Logs the chosen message when debug logs are enabled.
 */
export function getProcessedStatusMessage(cameFromOfferings: boolean): string {
  const message = cameFromOfferings
    ? BANK_CONNECT_STATUS_MESSAGES.processedWithOffer
    : BANK_CONNECT_STATUS_MESSAGES.processed;
  devLog.stepMessage(STEP_ID, 'processedStatusMessage', message);
  return message;
}

/**
 * Returns the status message for a given key (e.g. when setting pending state).
 * Logs when debug logs are enabled.
 */
export function getStatusMessage(
  key: keyof typeof BANK_CONNECT_STATUS_MESSAGES
): string {
  const message = BANK_CONNECT_STATUS_MESSAGES[key];
  devLog.stepMessage(STEP_ID, `statusMessage.${key}`, message);
  return message;
}

type ResolveProcessedMessageParams = {
  hasOffer: boolean;
  cameFromOfferings: boolean;
  /** When set, message and CTA visibility follow loan status: Pending (message, no CTA), Verified (message + CTA), rejected (message, no CTA). */
  offerLoanStatus?: OfferLoanStatus;
};

/**
 * Resolves the final status message after bank statement is processed and the
 * current-offer API has settled.
 *
 * When offerLoanStatus is set:
 * - Pending → processedLoanPending (hide CTA).
 * - Verified → processedLoanVerified (show CTA).
 * - rejected → processedLoanRejected (hide CTA).
 *
 * When offerLoanStatus is undefined: no offer → noOffer; else processedLoanVerified.
 *
 * Logs which message was chosen when debug logs are enabled.
 */
export function resolveProcessedMessage({
  hasOffer,
  cameFromOfferings,
  offerLoanStatus,
}: ResolveProcessedMessageParams): string {
  if (offerLoanStatus === 'Pending') {
    const message = BANK_CONNECT_STATUS_MESSAGES.processedLoanPending;
    devLog.stepMessage(STEP_ID, 'resolveProcessedMessage', message);
    return message;
  }
  if (offerLoanStatus === 'rejected') {
    const message = BANK_CONNECT_STATUS_MESSAGES.processedLoanRejected;
    devLog.stepMessage(STEP_ID, 'resolveProcessedMessage', message);
    return message;
  }
  if (offerLoanStatus === 'Verified') {
    const message = BANK_CONNECT_STATUS_MESSAGES.processedLoanVerified;
    devLog.stepMessage(STEP_ID, 'resolveProcessedMessage', message);
    return message;
  }
  const message =
    !cameFromOfferings && !hasOffer
      ? BANK_CONNECT_STATUS_MESSAGES.noOffer
      : BANK_CONNECT_STATUS_MESSAGES.processedLoanVerified;
  devLog.stepMessage(STEP_ID, 'resolveProcessedMessage', message);
  return message;
}

/** True when the processed-state CTA should be shown (only for Verified loan status). */
export function shouldShowProcessedCta(
  offerLoanStatus: OfferLoanStatus | undefined
): boolean {
  return offerLoanStatus === 'Verified';
}
