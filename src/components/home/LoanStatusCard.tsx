import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, StyleSheet, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import { colors, spacing, radius, typography } from '@/src/theme';
import { AppText } from '../AppText';
import { formatCurrency } from '@/src/utils/common-helper';
import { ProgressStepperV2 } from '../ProgressStepper';
import type { FlowJourneySummary } from '@/src/utils/flowProgress';
import { getMainStepLabels, type FlowPhase } from '@/src/config/flowSteps';
import { SoftImageAura } from './SoftImageAura';

type LoanJourneyStatus = 'in_progress' | 'completed';

interface LoanStatusCardProps {
  /** Current loan journey status */
  status: LoanJourneyStatus;
  /** Description text */
  description: string;
  /** Current journey position summary */
  journey?: FlowJourneySummary;
  /** Passed phase state from flow store */
  passedPhases?: Record<FlowPhase, boolean>;
  /** Passed substep state from flow store */
  passedSubsteps?: Record<string, boolean>;
  /** Primary action label (e.g., "Continue Journey") */
  actionLabel: string;
  /** Callback when card is pressed */
  onActionPress?: () => void;
  /** Optional helper/error message shown above the primary action */
  actionMessage?: string;
  /** Explicitly disable primary action */
  disableAction?: boolean;
  /** Optional title (defaults to "Check loan offers") */
  title?: string;
  /** Optional heading (defaults to loan amount) */
  heading?: string;
  /** Optional application number from loan payload */
  applicationNumber?: string;
  /**
   * Optional image source for illustration in top right.
   *
   * To add your image:
   * 1. Place image file in assets/images/ folder (e.g., loan-offers-illustration.png)
   * 2. Use: illustrationSource={require('@/assets/images/loan-offers-illustration.png')}
   *
   * Recommended size: 100x100 to 120x120 pixels
   */
  illustrationSource?: ImageSourcePropType;
  /**
   * When 'warning', title is shown as amber under-review badge.
   */
  titleBadgeVariant?: 'warning';
  /**
   * When true, hides CTA and progress stepper (e.g. CBL, under-review stages).
   */
  hideAction?: boolean;
  /**
   * When true, hides only the progress stepper; CTA remains visible and enabled.
   * Use for stages like WAITING_FOR_DISBURSEMENT where user waits but can still take action.
   */
  hideProgressStepper?: boolean;
  /**
   * Optional pill badge (e.g. "Active Loan") shown in the top section.
   * When provided, renders a green pill; used for ACTIVE_LOAN_DASHBOARD stage.
   */
  statusPill?: string;
  /**
   * Optional loan/offered amount to display in the card (e.g. from offer or active loan).
   * Shown prominently when provided; used for OFFERINGS and ACTIVE_LOAN_DASHBOARD.
   */
  amount?: number;
}

export function LoanStatusCard({
  status,
  description,
  journey,
  passedPhases,
  passedSubsteps,
  actionLabel,
  onActionPress,
  actionMessage,
  disableAction = false,
  title = 'Check loan offers',
  heading = 'Get Loan Offers Up to ₹5,00,000',
  applicationNumber,
  illustrationSource,
  titleBadgeVariant,
  hideAction = false,
  hideProgressStepper = false,
  statusPill,
  amount,
}: LoanStatusCardProps) {
  const { t } = useTranslation();
  const isCompleted = status === 'completed';
  const effectiveHideProgressStepper = hideProgressStepper || Boolean(statusPill);
  const hideProgressAndAction = hideAction;
  const showProgressStepper = !hideProgressAndAction && !effectiveHideProgressStepper;
  const showUnderReviewBadge = titleBadgeVariant === 'warning';
  const isInteractive =
    typeof onActionPress === 'function' && !isCompleted && !disableAction;
  const currentStep = journey?.phaseIndex ?? 0;
  const progressInStep = journey
    ? (journey.totalSubsteps > 1
      ? journey.substepIndex / (journey.totalSubsteps - 1)
      : 1)
    : 0;
  const currentSubstepIndex = journey?.substepIndex ?? 0;
  const actionMessageMarginTop =
    hideProgressAndAction || effectiveHideProgressStepper ? spacing.lg : undefined;
  const actionButtonMarginTop = effectiveHideProgressStepper ? spacing.lg : undefined;
  const trimmedApplicationNumber =
    typeof applicationNumber === 'string' ? applicationNumber.trim() : '';

  const renderTitleBlock = () => {
    if (showUnderReviewBadge) {
      return (
        <View style={styles.underReviewBadge}>
          <AppText variant="captionSmall" weight="semiBold" style={styles.underReviewBadgeText}>
            {title}
          </AppText>
        </View>
      );
    }
    return (
      <AppText variant="captionSmall" color="primary" weight="medium" style={styles.subtitle}>
        {title}
      </AppText>
    );
  };

  return (
    <View style={styles.cardWrapper}>
      <View style={styles.card}>
        {illustrationSource ? <SoftImageAura style={styles.illustrationAura} /> : null}

        <View style={styles.topSection}>
          <View style={styles.titleRow}>
            {renderTitleBlock()}
            {statusPill != null && statusPill.length > 0 && (
              <View style={styles.statusPill}>
                <AppText variant="captionSmall" weight="semiBold" style={styles.statusPillText}>
                  {statusPill}
                </AppText>
              </View>
            )}
          </View>
          {illustrationSource != null && (
            <Image
              source={illustrationSource}
              style={styles.illustration}
              resizeMode="contain"
            />
          )}
        </View>

        {heading && <AppText variant="h3" weight="semiBold" style={styles.heading}>
          {heading}
        </AppText>}
        {amount != null && typeof amount === 'number' && (
          <AppText variant="body" weight="semiBold" style={styles.amountText}>
            {formatCurrency(amount)}
          </AppText>
        )}
        {description && (
          <AppText variant="caption" color="textprimary" style={styles.description}>
            {description}
          </AppText>
        )}
        {trimmedApplicationNumber.length > 0 && (
          <AppText variant="caption" style={styles.applicationNumber}>
            {t('Application No. {{number}}', { number: trimmedApplicationNumber })}
          </AppText>
        )}

        {showProgressStepper && (
          <View style={styles.stepperWrap}>
            <ProgressStepperV2
              steps={getMainStepLabels()}
              currentStep={currentStep}
              progress={progressInStep}
              passedPhases={passedPhases}
              passedSubsteps={passedSubsteps}
              currentSubstepIndex={currentSubstepIndex}
              numberOfLines={2}
            />
          </View>
        )}

        {actionMessage != null && actionMessage.length > 0 && (
          <AppText
            variant="caption"
            style={[styles.actionMessage, actionMessageMarginTop != null && { marginTop: actionMessageMarginTop }]}
          >
            {actionMessage}
          </AppText>
        )}

        {!hideProgressAndAction && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              !isInteractive && styles.actionButtonDisabled,
              actionButtonMarginTop != null && { marginTop: actionButtonMarginTop },
            ]}
            onPress={onActionPress}
            disabled={!isInteractive}
            activeOpacity={0.8}
          >
            <AppText variant="body" weight="medium" style={styles.actionButtonText}>
              {actionLabel}
            </AppText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'visible',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  card: {
    padding: spacing.lg,
    backgroundColor: colors.background.primary,
    borderRadius: radius.lg,
    position: 'relative',
  },
  illustrationAura: {
    position: 'absolute',
    right: -180,
    top: -120,
    width: 560,
    height: 420,
    borderRadius: 280,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  /** Title on the left, optional status pill (e.g. "Active Loan", "Closed") on the right */
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    minWidth: 0,
  },
  statusPill: {
    backgroundColor: colors.primary.lightest,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusPillText: {
    color: colors.primary.dark,
    fontSize: typography.fontSize.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.primary.main,
  },
  illustration: {
    width: 100,
    height: 100,
    position: 'absolute',
    right: 0,
    top: spacing['2xl'],
  },
  heading: {
    color: colors.primary.main,
    fontSize: typography.fontSize.xl,
    marginBottom: spacing.sm,
    lineHeight: 28,
    maxWidth: '75%',
  },
  amountText: {
    color: colors.primary.main,
    fontSize: typography.fontSize.lg,
    marginBottom: spacing.sm,
  },
  description: {
    lineHeight: 20,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    width: '75%',
  },
  applicationNumber: {
    marginTop: spacing.xs,
    color: colors.text.secondary,
    width: '75%',
  },
  stepperWrap: {
    // margin: spacing.sm,
  },
  actionMessage: {
    marginTop: spacing.sm,
    marginBottom: spacing.base,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  underReviewBadge: {
    backgroundColor: colors.warning.bg,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  underReviewBadgeText: {
    color: colors.warning.dark,
    fontSize: typography.fontSize.xs,
  },
  // Action button styles
  actionButton: {
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonDisabled: {
    backgroundColor: colors.border.main,
  },
  actionButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.base,
  },
});
