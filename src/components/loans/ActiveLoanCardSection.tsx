import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '@/src/components';
import { ActiveLoanContent } from './ActiveLoanContent';
import { LoanStatusCardSkeleton } from '@/src/components/skeleton';
import { spacing } from '@/src/theme';
import type { Loan } from '@/src/types/loans';

export interface ActiveLoanCardSectionProps {
  loan: Loan | null;
  isLoading: boolean;
  error: Error | null;
  onForeclosePress: () => void;
  onPaymentPress: () => void;
}

/**
 * Renders the Active Loan card section for home: skeleton, error, empty, or ActiveLoanContent.
 * Keeps home.tsx clean by encapsulating all active-loan UI states.
 */
export function ActiveLoanCardSection({
  loan,
  isLoading,
  error,
  onForeclosePress,
  onPaymentPress,
}: ActiveLoanCardSectionProps) {
  if (isLoading) {
    return <LoanStatusCardSkeleton />;
  }
  if (error) {
    return (
      <View style={styles.messageWrap}>
        <AppText variant="body" color="error" style={styles.message}>
          {error.message}
        </AppText>
      </View>
    );
  }
  if (!loan) {
    return (
      <View style={styles.messageWrap}>
        <AppText variant="body" style={styles.message}>
          No active loan found.
        </AppText>
      </View>
    );
  }
  return (
    <ActiveLoanContent
      loan={loan}
      isLoading={false}
      error={null}
      onForeclosePress={onForeclosePress}
      onPaymentPress={onPaymentPress}
    />
  );
}

const styles = StyleSheet.create({
  messageWrap: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.base,
  },
  message: {
    textAlign: 'center',
  },
});
