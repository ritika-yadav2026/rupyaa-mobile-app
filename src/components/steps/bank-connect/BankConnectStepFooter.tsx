import React from 'react';
import { Button } from '@/src/components/Button';
import { spacing } from '@/src/theme';
import type { OfferLoanStatus } from '@/src/types/offer';
import {
  getContinueButtonLabel,
  getGoToUpdatedLabel,
  shouldShowProcessedCta,
} from './bankConnectContinueMessages';
import { ContinueWithExistingOfferButton } from './bankConnectStepHelpers';
import type { BankConnectResolvedView } from './useBankConnectStepController';
import { NormalizedBankStatementStatus } from './useBankStatementStatus';

type BankConnectStepFooterProps = {
  resolvedView: BankConnectResolvedView;
  cameFromOfferings: boolean;
  isPolling: boolean;
  shouldShowOfferReadyAction: boolean;
  shouldShowOfferingRetryAction: boolean;
  shouldShowOfferingContinueAction: boolean;
  onContinueWithExistingOffer: () => void;
  onRetryFetchBankStatement?: () => void;
  onRedoAccountAggregation?: () => void;
  bankStatementStatus: NormalizedBankStatementStatus;
  offerLoanStatus?: OfferLoanStatus;
  pollingTimedOut?: boolean;
};

type OfferCtaContext = {
  shouldShowOfferingRetryAction: boolean;
  hasExistingOfferAction: boolean;
  continueLabel: string;
  onContinueWithExistingOffer: () => void;
};

/**
 * Resolves the offer-related CTA for views that support it (mobile, upload-idle).
 * Retry always takes priority over continue.
 * Returns null when no offer action is applicable.
 */
function resolveOfferCta({
  shouldShowOfferingRetryAction,
  hasExistingOfferAction,
  continueLabel,
  onContinueWithExistingOffer,
}: OfferCtaContext): React.JSX.Element | null {
  if (shouldShowOfferingRetryAction) {
    return <ContinueWithExistingOfferButton onPress={onContinueWithExistingOffer} />;
  }
  if (hasExistingOfferAction) {
    return (
      <ContinueWithExistingOfferButton
        label={continueLabel}
        style={{ marginTop: spacing.base, marginBottom: spacing.base }}
        onPress={onContinueWithExistingOffer}
      />
    );
  }
  return null;
}

export function BankConnectStepFooter({
  resolvedView,
  cameFromOfferings,
  isPolling,
  shouldShowOfferReadyAction,
  shouldShowOfferingRetryAction,
  shouldShowOfferingContinueAction,
  onContinueWithExistingOffer,
  onRetryFetchBankStatement,
  onRedoAccountAggregation,
  bankStatementStatus,
  offerLoanStatus,
  pollingTimedOut = false,
}: BankConnectStepFooterProps): React.JSX.Element | null {
  const continueLabel = getContinueButtonLabel({
    shouldShowOfferReadyAction,
    cameFromOfferings,
    bankStatementStatus,
  });

  // Whether the user has an existing offer they can act on (continue or check).
  const hasExistingOfferAction =
    shouldShowOfferingContinueAction ||
    shouldShowOfferReadyAction ||
    (bankStatementStatus === 'processed' && cameFromOfferings);

  // When bank statement is approved/processed, CTA is shown only when offer.loanId.status === Verified.
  const showProcessedCta = shouldShowProcessedCta(offerLoanStatus);
  const isStatementResolved =
    bankStatementStatus === 'approved' || bankStatementStatus === 'processed';
  const pendingViewCtaLabel = isStatementResolved
    ? getGoToUpdatedLabel()
    : continueLabel;

  // In the pending view, CTA only when polling settled and loan status is Verified (hide for Pending/rejected).
  const canContinueFromPendingView =
    !isPolling && hasExistingOfferAction && showProcessedCta;

  const offerCtaContext: OfferCtaContext = {
    shouldShowOfferingRetryAction,
    hasExistingOfferAction,
    continueLabel,
    onContinueWithExistingOffer,
  };

  if (resolvedView === 'mobile') {
    if (shouldShowOfferingRetryAction) {
      return resolveOfferCta(offerCtaContext);
    }
    return null;
  }

  if (resolvedView === 'upload-idle') {
    return resolveOfferCta(offerCtaContext);
  }

  if (resolvedView === 'bank-statement-pending') {
    // Show retry buttons when polling timed out
    if (pollingTimedOut && onRetryFetchBankStatement && onRedoAccountAggregation) {
      return (
        <>
          <Button
            variant="primary"
            size="large"
            fullWidth
            onPress={onRetryFetchBankStatement}
            style={{ marginBottom: spacing.sm }}
          >
            Retry Fetching Bank Statement
          </Button>
          <Button
            variant="outline"
            size="large"
            fullWidth
            onPress={onRedoAccountAggregation}
          >
            Redo Account Aggregation
          </Button>
        </>
      );
    }

    // Show continue button when offer is ready
    if (!canContinueFromPendingView) return null;

    return (
      <ContinueWithExistingOfferButton
        label={pendingViewCtaLabel}
        onPress={onContinueWithExistingOffer}
      />
    );
  }

  return null;
}
