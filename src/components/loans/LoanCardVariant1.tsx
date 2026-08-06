import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar, Clock, Check, FileText } from 'lucide-react-native';
import { Card, Chip, AppText } from '@/src/components';
import { colors, spacing } from '@/src/theme';
import { formatCurrency } from '@/src/utils/common-helper';
import { formatLoanDate, getPaymentStatusVariant } from '@/src/utils/loan-formatters';
import type { Loan } from '@/src/types/loans';
import { APP_ICON } from '@/src/constants/data';
import { LoanDetailRow } from './LoanDetailSection';

export interface LoanCardVariant1Props {
  loan: Loan;
  index: number;
}

const ICON_SIZE = APP_ICON.SIZE - 2;

function getStatusLabel(status: string): string {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'In Progress';
    case 'paid':
      return 'Paid';
    case 'overdue':
      return 'Overdue';
    default:
      return status || '';
  }
}

/**
 * Loan Card Variant 1: Status badge at top with horizontal details layout.
 * Uses shared LoanDetailRow with optional icons.
 */
export function LoanCardVariant1({ loan }: LoanCardVariant1Props): React.ReactElement {
  const appliedOn = formatLoanDate(loan.createdAt ?? '');
  const amount = formatCurrency(loan.amount);
  const tenure = loan.tenure ? `${loan.tenure} Days` : 'N/A';
  const statusLabel = getStatusLabel(loan.paymentStatus ?? '');
  const statusVariant = getPaymentStatusVariant(loan.paymentStatus ?? '');
  const isPaid = loan.paymentStatus?.toLowerCase() === 'paid';

  return (
    <Card padding="medium" shadow="sm" bordered style={styles.loanCard}>
      <View style={styles.statusContainer}>
        <Chip
          label={statusLabel}
          variant={statusVariant}
          size="medium"
          style={styles.statusChip}
        />
        {isPaid ? (
          <Check size={16} color={colors.success.main} style={styles.checkIcon} />
        ) : null}
      </View>
      <View style={styles.loanDetails}>
        <LoanDetailRow
          label="Application No."
          value={loan.applicationNumber || 'N/A'}
          leftIcon={<FileText size={ICON_SIZE} color={colors.primary.main} />}
        />
        <LoanDetailRow
          label="Applied On"
          value={appliedOn}
          leftIcon={<Calendar size={ICON_SIZE} color={colors.primary.main} />}
        />
        <LoanDetailRow
          label="Amount"
          value={amount}
          leftIcon={
            <View style={styles.rupeeIconContainer}>
              <AppText variant="body" weight="bold" color="primary" style={styles.rupeeIcon}>
                ₹
              </AppText>
            </View>
          }
        />
        <LoanDetailRow
          label="Tenure"
          value={tenure}
          leftIcon={<Clock size={ICON_SIZE} color={colors.primary.main} />}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  loanCard: {
    marginBottom: spacing.md,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  statusChip: {
    marginRight: spacing.xs,
  },
  checkIcon: {
    marginLeft: spacing.xs,
  },
  loanDetails: {
    gap: spacing.md,
  },
  rupeeIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rupeeIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
});
