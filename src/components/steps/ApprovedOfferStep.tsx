import React, { useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { AppText } from '../AppText';
import { ActionCard } from '../ActionCard';
import { Button } from '../Button';
import { FormLayout } from '../FormLayout';
import { ZapcashLoading } from '../ZapcashLoading';
import type { StepProps } from '@/src/types/flow';
import type { CurrentOfferOffer } from '@/src/types/offer';
import type { LoanType } from '@/src/types/loans';
import { colors, spacing, radius } from '@/src/theme';
import { consoleLogDev, formatCurrency } from '@/src/utils/common-helper';
import { useApprovedOfferStep } from './useApprovedOfferStep';
import { useStepSimulation } from '@/src/hooks/useStepSimulation';
import { ANALYTICS_EVENT, logAnalyticsEvent } from '@/src/services/analytics';

/** Dev simulation: mock offer for success state. */
const SIM_OFFER: CurrentOfferOffer = {
  _id: 'sim',
  offerAmount: 50000,
  loanTenure: 90,
  interestRate: 24,
  payableAmount: 53000,
  status: 'active',
};
const SIM_LOAN_TYPE: LoanType = 'PAY_DAY';

interface OfferDetailRowProps {
  label: string;
  value: string;
  isLast?: boolean;
}

function OfferDetailRow({ label, value, isLast = false }: OfferDetailRowProps) {
  return (
    <>
      <View style={detailStyles.row}>
        <AppText style={detailStyles.label} variant="caption">
          {label}
        </AppText>
        <AppText style={detailStyles.value} variant="caption" color='textprimary' weight="semiBold">
          {value}
        </AppText>
      </View>
      {!isLast && <View style={detailStyles.divider} />}
    </>
  );
}

function OfferAmountHeader({ amount }: { amount: number }) {
  return (
    <View style={detailStyles.amountHeader}>
      <AppText style={detailStyles.amountLabel} variant="caption" color='textprimary' weight="medium">
        Your Loan Amount
      </AppText>
      <AppText style={detailStyles.amountValue} variant="h1" weight="semiBold">
        {formatCurrency(amount, true)}
      </AppText>
    </View>
  );
}

function OfferDetailsCard({ offer, loanType }: { offer: CurrentOfferOffer; loanType?: LoanType }) {
  const rateSuffix = loanType === 'PAY_DAY' ? 'P.D' : 'P.A';

  return (
    <View style={detailStyles.card}>
      <AppText style={detailStyles.cardTitle} variant="caption" color='textprimary' weight="semiBold">
        Loan Details
      </AppText>
      <View style={detailStyles.titleDivider} />
      <OfferDetailRow label="Loan Amount" value={formatCurrency(offer?.offerAmount ?? 0, true)} />
      <OfferDetailRow label="Repayment Period" value={`${offer.loanId?.tenure ?? 0} days`} />
      <OfferDetailRow label="Interest Rate" value={`${offer.interestRate}% ${rateSuffix}`} />
      <OfferDetailRow label="Total Amount to Repay" value={formatCurrency(offer.payableAmount, true)} isLast />
    </View>
  );
}

const GET_HIGHER_LOAN_TITLE = 'Get a Higher Loan Amount';
const GET_HIGHER_LOAN_SUBTEXT =
  'Connect your bank securely to check if you qualify for a better offer. Your current offer remains safe';

export function ApprovedOfferStep({ onNext, onPrev }: StepProps) {
  const { isSimulating, simulatedState } = useStepSimulation();

  // Defined before the hook so they can be passed as stable callbacks.
  const handleAcceptSuccess = useCallback(() => {
    void logAnalyticsEvent(ANALYTICS_EVENT.REVIEW_OFFER_PAGE_CLICK);
    onNext();
  }, [onNext]);

  const {
    offer,
    loanType,
    isApproved,
    isOfferResolved,
    showImproveOfferAction,
    improveOfferByUsingBsa,
    acceptOffer,
    isAccepting,
    acceptError,
    clearAcceptError,
    refreshOffer,
    isRefreshing,
    refreshError,
    clearRefreshError,
  } = useApprovedOfferStep({
    onAcceptSuccess: handleAcceptSuccess,
    onAcceptError: () => undefined,
  });

  const handleRefreshClick = useCallback(() => {
    clearRefreshError();
    refreshOffer();
  }, [clearRefreshError, refreshOffer]);

  const handleAcceptPress = useCallback(() => {
    clearAcceptError();
    acceptOffer();
  }, [clearAcceptError, acceptOffer]);

  const buttonLabel = isApproved ? 'Accept & Continue' : 'Refresh to Check';
  const buttonAction = isApproved ? handleAcceptPress : handleRefreshClick;
  const buttonDisabled = isRefreshing || isAccepting;
  const showRefreshError = refreshError != null && !isRefreshing;

  const renderContent = (): React.ReactNode => {
    consoleLogDev('[ApprovedOfferStep]  isApproved', isApproved);
    consoleLogDev('offer', offer);
    if (isApproved && offer) {
      return (
        <>
          <OfferAmountHeader amount={offer?.offerAmount ?? 0} />
          <OfferDetailsCard offer={offer} loanType={loanType} />
          {/* Visibility comes only from the latest /offer/current snapshot stored by
              fetchCurrentOfferForBankStatement; user-stage context is not consulted. */}
          {showImproveOfferAction && (
            <ActionCard
              title={GET_HIGHER_LOAN_TITLE}
              subtext={GET_HIGHER_LOAN_SUBTEXT}
              onPress={improveOfferByUsingBsa}
            />
          )}
          {acceptError != null && (
            <AppText style={styles.errorText} variant="caption">
              {acceptError}
            </AppText>
          )}
        </>
      );
    }
    return (
      <>
        <AppText style={styles.title} variant="h3" weight="bold">
          No offer found
        </AppText>
        <AppText style={styles.subtitle} variant="body">
          Please try again later.
        </AppText>
        {showRefreshError && (
          <AppText style={styles.errorText} variant="body">
            {refreshError}
          </AppText>
        )}
        {isRefreshing && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary.main} />
          </View>
        )}
      </>
    );
  };

  const showLoadingOverlay = !isOfferResolved;
  // const showLoadingOverlay = true;

  // Dev simulation: show loading, success (offer card), or error (no offer) without API
  if (isSimulating) {
    if (simulatedState === 'loading') {
      return (
        <ZapcashLoading
          visible
          title="Loading your offer"
          message="Please wait..."
          source="ApprovedOfferStep"
        />
      );
    }
    if (simulatedState === 'success') {
      return (
        <FormLayout
          safeAreaEdges={['bottom']}
          onBack={onPrev}
          footer={
            <Button variant="primary" size="large" fullWidth onPress={() => {}}>
              Accept & Continue
            </Button>
          }
        >
          <View style={styles.content}>
            <OfferAmountHeader amount={SIM_OFFER?.offerAmount ?? 0} />
            <OfferDetailsCard offer={SIM_OFFER} loanType={SIM_LOAN_TYPE} />
          </View>
        </FormLayout>
      );
    }
    if (simulatedState === 'error') {
      return (
        <FormLayout
          safeAreaEdges={['bottom']}
          onBack={onPrev}
          footer={
            <Button variant="primary" size="large" fullWidth onPress={() => {}}>
              Refresh to Check
            </Button>
          }
        >
          <View style={styles.content}>
            <AppText style={styles.title} variant="h3" weight="bold">
              No offer found
            </AppText>
            <AppText style={styles.subtitle} variant="body">
              Please try again later.
            </AppText>
            <AppText style={styles.errorText} variant="body">
              Simulated error: Unable to load offer.
            </AppText>
          </View>
        </FormLayout>
      );
    }
  }

  if (showLoadingOverlay) {
    return (
      <ZapcashLoading
        visible={showLoadingOverlay}
      />
    );
  }
  return (
    <FormLayout
      safeAreaEdges={['bottom']}
      onBack={onPrev}
      footer={
        <>
          <Button
            variant="primary"
            size="large"
            fullWidth
            onPress={buttonAction}
            disabled={buttonDisabled}
            loading={isAccepting}
          >
            {isRefreshing ? 'Checking...' : buttonLabel}
          </Button>
          {/* <DevSkipButton onSkip={onNext} /> */}
        </>
      }
    >
      <View style={styles.content}>{renderContent()}</View>

      <ZapcashLoading
        visible={showLoadingOverlay}
        title="Loading your offer"
        message="Please wait..."
        source="ApprovedOfferStep"
      />
    </FormLayout>
  );
}

const detailStyles = StyleSheet.create({
  amountHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  amountLabel: {
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    color: colors.text.primary,
  },
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cardTitle: {
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  titleDivider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
  },
  label: {
    color: colors.text.secondary,
    flex: 1,
  },
  value: {
    color: colors.text.primary,
    textAlign: 'right',
  },
});

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.sm,
  },
  title: {
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.error.main,
    marginBottom: spacing.sm,
  },
  loaderContainer: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
});
