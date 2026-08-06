import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { AppText } from '@/src/components';
import { colors, spacing, radius } from '@/src/theme';

const AMOUNT_BOX_BG = '#E8F4FD';

export interface LoanDetailRowProps {
  label: string;
  value: string;
  /** Optional icon or prefix (e.g. FileText, Calendar) shown before the label. */
  leftIcon?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Key-value row for loan details (label left, value right). Optional leftIcon for list/card variants.
 */
export function LoanDetailRow({
  label,
  value,
  leftIcon,
  style,
}: LoanDetailRowProps): React.ReactElement {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.labelWrap}>
        {leftIcon != null ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <AppText variant="caption" color="textprimary" style={styles.label} numberOfLines={2}>
          {label}
        </AppText>
      </View>
      <AppText variant="caption" weight="regular" color="textprimary" style={styles.value} numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

export interface AmountSummaryBoxProps {
  label: string;
  amount: string;
  style?: ViewStyle;
}

/**
 * Highlighted box for total amount payable (light blue bg, primary border).
 */
export function AmountSummaryBox({
  label,
  amount,
  style,
}: AmountSummaryBoxProps): React.ReactElement {
  return (
    <View style={[styles.amountBox, style]}>
      <AppText variant="caption" weight="semiBold" style={styles.amountBoxLabel}>
        {label}
      </AppText>
      <AppText variant="body" weight="semiBold" style={styles.amountBoxValue}>
        {amount}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    minHeight: 24,
    marginBottom: spacing.sm,
  },
  labelWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
    minWidth: 0,
  },
  leftIcon: {
    marginRight: spacing.xs,
  },
  label: {
    flex: 1,
    minWidth: 0,
  },
  value: {
    flexShrink: 0,
    minWidth: 0,
  },
  amountBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary.lightest_3,
    borderWidth: 1,
    borderColor: colors.primary.main,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    marginTop: spacing.md,
  },
  amountBoxLabel: {
    color: colors.text.primary,
  },
  amountBoxValue: {
    color: colors.text.primary,
  },
});
