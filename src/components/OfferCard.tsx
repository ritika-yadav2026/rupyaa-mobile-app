import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from './Card';
import { AppText } from './AppText';
import { colors, spacing } from '@/src/theme';
import type { LoanOffer } from '@/src/data/offer';
import { formatCurrency } from '@/src/utils/common-helper';

interface OfferCardProps {
  offer: LoanOffer;
}

/** Formats number as Indian Rupee with comma separators */

export function OfferCard({ offer }: OfferCardProps) {
  const detailRows = [
    { label: 'Interest Rate', value: `${offer.interestRate}% p.a.` },
    { label: 'Tenure', value: `${offer.tenure} days` },
    { label: 'Monthly EMI', value: formatCurrency(offer.emi) },
    { label: 'Processing Fee', value: formatCurrency(offer.processingFee) },
  ];

  return (
    <Card padding="large" bordered>
      <View style={styles.amountSection}>
        <AppText style={styles.amountLabel} variant="caption" weight="medium">
          Loan Amount
        </AppText>
        <AppText style={styles.amount} variant="h2" weight="bold">
          {formatCurrency(offer.amount)}
        </AppText>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsSection}>
        {detailRows.map(({ label, value }) => (
          <View key={label} style={styles.detailRow}>
            <AppText style={styles.detailLabel} variant="body">
              {label}
            </AppText>
            <AppText style={styles.detailValue} variant="body" weight="semiBold">
              {value}
            </AppText>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  amountSection: {
    marginBottom: spacing.md,
  },
  amountLabel: {
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  amount: {
    color: colors.primary.main,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.md,
  },
  detailsSection: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    color: colors.text.secondary,
  },
  detailValue: {
    color: colors.text.primary,
  },
});
