import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, StyleSheet } from 'react-native';
import { Info, BadgeCheck } from 'lucide-react-native';
import { Card, AppText, Button, Chip, IconWrapper } from '@/src/components';
import { colors, spacing, radius } from '@/src/theme';
import { formatCurrency } from '@/src/utils/common-helper';
import {
  formatLoanDueDate,
  getLoanDisplayTitle,
  isDueDateInFuture,
  shouldShowNocCta,
} from '@/src/utils/loan-helpers';
import type { Loan } from '@/src/types/loans';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { MoneyBag01Icon } from '@hugeicons/core-free-icons';

export type MyLoanCardVariant = 'ongoing' | 'history';

export interface MyLoanCardProps {
  loan: Loan;
  variant: MyLoanCardVariant;
  onPayNow?: (loan: Loan) => void;
  onRequestNoc?: (loan: Loan) => void;
  isNocLoading?: boolean;
}

function formatStatusLabel(raw: string | undefined | null): string {
  if (!raw || typeof raw !== 'string') return '';
  const cleaned = raw.trim();
  if (!cleaned) return '';
  return cleaned
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function translateStatusLabel(
  t: (key: string) => string,
  raw: string | undefined | null
): string {
  const label = formatStatusLabel(raw);
  if (!label) return '';
  return t(label);
}

function getPaymentStatusText(
  t: (key: string) => string,
  status: string | undefined
): string {
  if (!status || typeof status !== 'string') return t('Pending');
  const trimmed = status.trim();
  if (!trimmed) return t('Pending');
  const label = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  return t(label);
}

function shouldShowPayNow(loan: Loan | null | undefined): boolean {
  if (!loan?.status || typeof loan.status !== 'string') return false;
  return loan.status.trim().toLowerCase() === 'sanctioned';
}

function getPaymentStatusColor(status: string | undefined): 'textprimary' | 'success' | 'error' | 'warning' {
  const value = status?.trim().toLowerCase();
  if (value === 'paid') return 'success';
  if (value === 'overdue') return 'error';
  if (value === 'pending') return 'warning';
  return 'textprimary';
}

function getLoanStatusText(
  loan: Loan,
  t: (key: string) => string
): string {
  const primary = translateStatusLabel(t, loan.status);
  const after = translateStatusLabel(t, loan.afterDisbursalStatus);
  if (primary && after) {
    return `${primary} • ${after}`;
  }
  if (primary) return primary;
  if (after) return after;
  return t('N/A');
}

function getLoanStatusColor(loan: Loan): 'textprimary' | 'success' | 'error' | 'warning' {
  const statusValue = (loan.status ?? '').toString().trim().toLowerCase();
  if (statusValue === 'npa' || statusValue === 'expired' || statusValue === 'overdue') {
    return 'error';
  }
  if (statusValue === 'paid' || statusValue === 'waivered' || statusValue === 'foreclosed') {
    return 'success';
  }
  if (statusValue === 'sanctioned' || statusValue === 'disbursed') {
    return 'warning';
  }
  return 'textprimary';
}

function getHistoryHelperText(
  t: (key: string) => string,
  rawPaymentStatus: string | undefined
): string {
  const value = rawPaymentStatus?.trim().toLowerCase() ?? '';
  if (value === 'paid') {
    return t('You repaid on time. Eligible to reapply.');
  }
  if (value === 'overdue') {
    return t('Your loan is closed after being overdue. Please maintain good repayment habits for future credit.');
  }
  return t('Your loan is closed. For more details, check your loan statement.');
}

function renderOngoingContent(
  loan: Loan,
  principalAmount: string,
  disbursedOnLabel: string,
  nextDueAmount: string,
  upcomingDueDate: string,
  hasUpcomingDue: boolean,
  loanStatusText: string,
  loanStatusColor: 'textprimary' | 'success' | 'error' | 'warning',
  paymentStatusText: string,
  paymentStatusColor: 'textprimary' | 'success' | 'error' | 'warning',
  onPayNow: ((loan: Loan) => void) | undefined,
  t: (key: string, options?: Record<string, unknown>) => string
): React.ReactElement {
  return (
    <>
      <View style={styles.row}>
        <AppText variant="caption" color="textprimary">
          {t('Principal Amount')}
        </AppText>
        <AppText variant="caption" weight="semiBold" color="textprimary">
          {principalAmount}
        </AppText>
      </View>
      <View style={styles.row}>
        <AppText variant="caption" color="textprimary">
          {t('Disbursed on')}
        </AppText>
        <AppText variant="caption" weight="semiBold" color="textprimary">
          {disbursedOnLabel}
        </AppText>
      </View>
      <View style={styles.row}>
        <AppText variant="caption" color="textprimary">
          {t('Remaining Balance')}
        </AppText>
        <AppText variant="caption" weight="semiBold" color="textprimary">
          {nextDueAmount}
        </AppText>
      </View>
      <View style={styles.row}>
        <AppText variant="caption" color="textprimary">
          {t('Loan Status')}
        </AppText>
        <AppText variant="caption" weight="semiBold" color={loanStatusColor}>
          {loanStatusText}
        </AppText>
      </View>
      <View style={styles.row}>
        <AppText variant="caption" color="textprimary">
          {t('Payment Status')}
        </AppText>
        <AppText variant="caption" weight="semiBold" color={paymentStatusColor}>
          {paymentStatusText}
        </AppText>
      </View>

      {hasUpcomingDue ? (
        <View style={styles.upcomingBox}>
          <BadgeCheck size={16} color={colors.primary.main} />
          <AppText
            variant="caption"
            color="textprimary"
            style={styles.upcomingText}
            numberOfLines={2}
          >
            {t('Upcoming Repayment Due on {{date}}', { date: upcomingDueDate })}
          </AppText>
        </View>
      ) : null}

      {onPayNow && shouldShowPayNow(loan) ? (
        <View style={styles.ctaContainer}>
          <Button
            title={t('Pay Now')}
            fullWidth
            onPress={() => onPayNow(loan)}
            accessibilityLabel={t('Pay Now')}
          />
        </View>
      ) : null}
    </>
  );
}

function renderHistoryContent(
  loan: Loan,
  principalAmount: string,
  paymentStatusText: string,
  paymentStatusColor: 'textprimary' | 'success' | 'error' | 'warning',
  onRequestNoc?: (loan: Loan) => void,
  isNocLoading?: boolean,
  t: (key: string, options?: Record<string, unknown>) => string = (key) => key
): React.ReactElement {
  const showNocCta = shouldShowNocCta(loan);

  return (
    <>
      <View style={styles.row}>
        <AppText variant="caption" color="textprimary">
          {t('Principal Amount')}
        </AppText>
        <AppText variant="caption" weight="semiBold" color="textprimary">
          {principalAmount}
        </AppText>
      </View>
      <View style={styles.row}>
        <AppText variant="caption" color="textprimary">
          {t('Payment Status')}
        </AppText>
        <AppText variant="caption" weight="semiBold" color={paymentStatusColor}>
          {paymentStatusText}
        </AppText>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.dot} />
        <AppText
          variant="caption"
          color="success"
          style={styles.infoText}
          numberOfLines={2}
        >
          {getHistoryHelperText(t, loan.paymentStatus as string | undefined)}
        </AppText>
      </View>

      {showNocCta && onRequestNoc ? (
        <View style={styles.ctaContainer}>
          <Button
            title={t('Get NOC')}
            fullWidth
            loading={isNocLoading}
            onPress={() => onRequestNoc(loan)}
            accessibilityLabel={t('Get NOC')}
          />
        </View>
      ) : null}
    </>
  );
}

export function MyLoanCard({
  loan,
  variant,
  onPayNow,
  onRequestNoc,
  isNocLoading,
}: MyLoanCardProps): React.ReactElement {
  const { t } = useTranslation();
  const title = getLoanDisplayTitle(loan);
  const principalAmount = formatCurrency(loan.amount ?? 0);
  const disbursedOn = loan.disbursedAt ?? loan.actualDisbursedAt ?? loan.createdAt ?? '';
  const disbursedOnLabel = disbursedOn ? formatLoanDueDate(disbursedOn) : t('N/A');
  const nextDueAmount = formatCurrency(
    typeof loan.amountDue === 'number' && Number.isFinite(loan.amountDue) ? loan.amountDue : 0
  );
  const rawDueDate = typeof loan.dueDate === 'string' ? loan.dueDate : '';
  const upcomingDueDate = rawDueDate ? formatLoanDueDate(rawDueDate) : '';
  const hasUpcomingDue = !!rawDueDate && isDueDateInFuture(rawDueDate);
  const paymentStatusText = getPaymentStatusText(t, loan.paymentStatus as string | undefined);
  const paymentStatusColor = getPaymentStatusColor(loan.paymentStatus as string | undefined);
  const loanStatusText = getLoanStatusText(loan, t);
  const loanStatusColor = getLoanStatusColor(loan);

  const isOngoing = variant === 'ongoing';

  return (
    <Card shadow="md" bordered style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <IconWrapper icon={MoneyBag01Icon} size={20} color={colors.primary.main} />
          <AppText variant="body" weight="semiBold" style={styles.titleText} numberOfLines={1}>
            {title}
          </AppText>
        </View>

        {isOngoing ? (
          <View style={styles.statusPillOngoing}>
            <Info size={14} color={colors.primary.main} />
          </View>
        ) : (
          <Chip label={t('Closed')} variant="success" size="small" />
        )}
      </View>

      <View style={styles.separator} />

      {isOngoing
        ? renderOngoingContent(
            loan,
            principalAmount,
            disbursedOnLabel,
            nextDueAmount,
            upcomingDueDate,
            hasUpcomingDue,
            loanStatusText,
            loanStatusColor,
            paymentStatusText,
            paymentStatusColor,
            onPayNow,
            t
          )
        : renderHistoryContent(
            loan,
            principalAmount,
            paymentStatusText,
            paymentStatusColor,
            onRequestNoc,
            isNocLoading,
            t
          )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primary.lightest_3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  titleText: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
  },
  statusPillOngoing: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.primary.lightest_3,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.light,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.success.main,
    marginRight: spacing.sm,
  },
  infoText: {
    flex: 1,
  },
  upcomingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary.lightest_3,
    marginTop: spacing.md,
  },
  upcomingText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  ctaContainer: {
    marginTop: spacing.lg,
  },
  closedOnTimeText: {
    color: colors.success.main,
  },
});

