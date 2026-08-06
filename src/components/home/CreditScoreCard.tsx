import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, typography } from '@/src/theme';
import { AppText } from '../AppText';
import { Card } from '../Card';
import { ArrowRightIcon } from '../icons';

interface CreditScoreCardProps {
  /** Main title */
  title: string;
  /** Description text */
  description: string;
  /** Action link label (e.g., "Check Now") */
  actionLabel: string;
  /** Callback when pressed */
  onPress?: () => void;
}

export function CreditScoreCard({
  title,
  description,
  actionLabel,
  onPress,
}: CreditScoreCardProps) {
  return (
    <Card padding="none" shadow="none" bordered onPress={onPress} style={styles.card}>
      <LinearGradient
        colors={['#EF4444', '#F59E0B', '#10B981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.scoreBar}
      />
      <View style={styles.content}>
        <AppText variant="body" weight="semiBold" style={styles.title}>
          {title}
        </AppText>
        <AppText variant="caption" color="textprimary" style={styles.description}>
          {description}
        </AppText>
        <View style={styles.actionRow}>
          <AppText variant="caption" weight="semiBold" style={styles.actionText}>
            {actionLabel}
          </AppText>
          <ArrowRightIcon />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.base,
    overflow: 'hidden',
    borderTopLeftRadius: radius.none,
    borderTopRightRadius: radius.none,
  },
  scoreBar: {
    height: 4,
    borderTopLeftRadius: radius.none,
    borderTopRightRadius: radius.none,
  },
  content: {
    padding: spacing.base,
  },
  title: {
    color: colors.text.primary,
    marginBottom: spacing.sm,
    fontSize: typography.fontSize.base,
  },
  description: {
    marginBottom: spacing['2xl'],
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    color: colors.text.primary,
    marginRight: spacing.xs,
  },
});
