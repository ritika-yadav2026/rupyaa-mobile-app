import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, radius, typography } from '@/src/theme';
import { AppText } from '../AppText';
import { Card } from '../Card';
import { IconWrapper } from '../IconWrapper';
import type { IconSvgElement } from '@hugeicons/react-native';

interface ProductCardProps {
  /** Icon for the product */
  icon: IconSvgElement;
  /** Product name (e.g., "Personal Loan") */
  title: string;
  /** Callback when pressed */
  onPress?: () => void;
  /** Optional style override (e.g. for full-width list layout) */
  style?: ViewStyle;
}

export function ProductCard({ icon, title, onPress, style }: ProductCardProps) {
  return (
    <Card
      padding="medium"
      shadow="none"
      bordered
      onPress={onPress}
      style={[styles.card, style]}
    >
      <IconWrapper
        icon={icon}
        size={24}
        color={colors.text.primary}
        backgroundColor={colors.primary.lightest}
        borderRadius="lg"
        padding="md"
      />
      <AppText variant="caption" weight="semiBold" style={styles.title}>
        {title}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary.lightest,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xxs,
  },
});
