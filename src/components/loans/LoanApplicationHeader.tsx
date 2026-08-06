import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { AppText } from '@/src/components';
import { colors, spacing, radius } from '@/src/theme';
import type { LoanStatus } from '@/src/types/loans';

export interface LoanApplicationHeaderProps {
  applicationDisplay: string;
  status?: LoanStatus;
  style?: ViewStyle;
}

/**
 * Displays the application number in a styled container, with a conditional
 * "LOAN OVERDUE" badge when the loan status is 'Overdue'.
 */
export function LoanApplicationHeader({
  applicationDisplay,
  status,
  style,
}: LoanApplicationHeaderProps): React.ReactElement {
  const isOverdue = status?.toLowerCase() === 'overdue';
  // const isOverdue = true;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.applicationIdWrap}>
      <AppText variant="caption" weight="semiBold" style={styles.applicationId}>
        {applicationDisplay}
      </AppText>
      {isOverdue ? (
        <View style={styles.overdueBadge}>
          <AppText variant="captionSmall" weight="semiBold" style={styles.overdueBadgeText}>
            LOAN OVERDUE
          </AppText>
        </View>
      ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  applicationId: {
    color: colors.text.primary,
    flexShrink: 1,
  },
  overdueBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.error.bg,
    borderRadius: radius.full,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    marginLeft: spacing.sm,
  },
  overdueBadgeText: {
    color: colors.error.dark,
    letterSpacing: 0.4,
  },
  applicationIdWrap: {
    backgroundColor: colors.background.secondary,
    flex: 1,
    padding: spacing.base,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
