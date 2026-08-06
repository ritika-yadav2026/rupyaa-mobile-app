import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, radius, shadows } from '@/src/theme';
import { AppText } from '../AppText';
import { Card } from '../Card';

interface FeatureCardProps {
  /** Icon or graphic for the feature */
  icon: React.ReactNode;
  /** Bold title (e.g., "Zero collateral", "Quick disbursal") */
  title: string;
  /** Short description */
  description?: string;
  /** Optional press handler to make card tappable */
  onPress?: () => void;
  /** Optional style override */
  style?: ViewStyle;
}

export function FeatureCard({
  icon,
  title,
  description,
  onPress,
  style,
}: FeatureCardProps) {
  return (
    <Card
      padding="medium"
      shadow="md"
      onPress={onPress}
      style={[styles.card, style]}
    >
      <View style={styles.iconWrapper}>{icon}</View>
      <AppText variant="body" weight="semiBold" style={styles.title}>
        {title}
      </AppText>
      {description ? (
        <AppText variant="caption" color="secondary" style={styles.description}>
          {description}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 140,
    maxWidth: 160,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary.main + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  description: {
    lineHeight: 18,
  },
});
