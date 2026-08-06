/**
 * PostOfferCard - Card for post-offer stages (approved amount, tenure, total payable, CTA).
 * Matches design: green top bar, application ID, amount, tenure/total payable pills, CTA inside card.
 */

import React from 'react';
import { View, StyleSheet, type ImageSourcePropType } from 'react-native';
import { LimitHeroCard } from './LimitHeroCard';
import { CancelLoanEntryLink } from '../loan-cancellation/CancelLoanEntryLink';
import { radius, spacing } from '@/src/theme';

export interface PostOfferCardProps {
  /** Application/loan reference id (e.g. ZC2026012456) */
  applicationNumber?: string;
  /** Optional pill badge (e.g. "Active", "Overdue") shown in top-right for ACTIVE_LOAN_DASHBOARD */
  statusPill?: string;
  /** When 'overdue', pill uses error styling; otherwise green/active styling */
  statusPillVariant?: 'active' | 'overdue';
  /** Approved loan amount to show prominently */
  amount?: number;
  /** Tenure label (e.g. "90 Days") */
  tenure?: string;
  /** Total payable amount (formatted inside card) */
  totalPayable?: number;
  /** CTA button label (e.g. "Accept & Proceed") */
  actionLabel: string;
  onActionPress?: () => void;
  /** Optional refresh action shown right of CTA */
  onRefreshPress?: () => void;
  /** Shows spinner inside refresh button while latest data is being fetched */
  isRefreshing?: boolean;
  disableAction?: boolean;
  /** When true, hide the CTA button */
  hideAction?: boolean;
  /** Optional icon/image in the top-left circle; you can add the image asset later */
  iconSource?: ImageSourcePropType;
  /** Stepper and/or action message from parent */
  children?: React.ReactNode;
  /** When 'Rejected', amount and total payable are hidden (only application ID, status pill, CTA shown). */
  loanStatus?: string;
  /** When true, card shows only the application ID and an "under review" message. */
  isUnderReview?: boolean;
  showCancelLoanEntry?: boolean;
  canCancelLoan?: boolean;
  onCancelLoanPress?: () => void;
}

export function PostOfferCard({
  amount,
  actionLabel,
  onActionPress,
  disableAction = false,
  hideAction = false,
  showCancelLoanEntry = false,
  canCancelLoan = false,
  onCancelLoanPress,
}: PostOfferCardProps) {
  return (
    <View style={styles.cardWrapper}>
      <LimitHeroCard
        amount={amount}
        actionLabel={actionLabel}
        onActionPress={onActionPress}
        disableAction={disableAction}
        hideAction={hideAction}
      >
        {showCancelLoanEntry ? (
          <CancelLoanEntryLink
            showLink={canCancelLoan}
            onLinkPress={onCancelLoanPress ?? (() => undefined)}
          />
        ) : null}
      </LimitHeroCard>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: spacing.lg,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
});
