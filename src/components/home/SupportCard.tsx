import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/src/theme';
import { AppText } from '../AppText';
import { Card } from '../Card';
import { ArrowRightIcon } from '../icons';
import { IconWrapper } from '../IconWrapper';
import type { IconSvgElement } from '@hugeicons/react-native';

interface SupportCardProps {
  /** Icon to display */
  icon: IconSvgElement;
  /** Main content text */
  content: string;
  /** Action link label */
  actionLabel: string;
  /** Callback when pressed */
  onPress?: () => void;
}

export function SupportCard({
  icon,
  content,
  actionLabel,
  onPress,
}: SupportCardProps) {
  return (
    <Card padding="medium" shadow="none" bordered onPress={onPress} style={styles.card}>
      <IconWrapper
        icon={icon}
        size={20}
        color={colors.text.primary}
        backgroundColor={colors.primary.lightest}
        borderRadius="lg"
        padding="md"
      />
      <View style={styles.content}>
        <View style={styles.textSection}>
          <AppText variant="caption" color="textprimary" numberOfLines={2}>
            {content}
          </AppText>
          <View style={styles.actionRow}>
            <AppText variant="caption" color="textprimary" weight="semiBold">
              {actionLabel}
            </AppText>
            <ArrowRightIcon />
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.base,
    rowGap: spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrapper: {
    marginRight: spacing.md,
  },
  textSection: {
    flex: 1,
    rowGap: spacing.sm,
  },
  text: {
    marginBottom: spacing.sm,
    lineHeight: 22,
    fontSize: typography.fontSize.xs,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginRight: spacing.xs,
    textDecorationLine: 'underline',
    fontSize: typography.fontSize.xs,
  },
});
