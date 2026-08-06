import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, spacing, radius } from '@/src/theme';
import { AppText } from '../AppText';
import { Card } from '../Card';

interface PromoBannerProps {
  /** Banner title (e.g., "Refer & Earn", "Why choose us?") */
  title: string;
  /** Short description or subtitle */
  description?: string;
  /** Action label (e.g., "Know More", "Learn More") */
  actionLabel?: string;
  /** Callback when banner or action is pressed */
  onPress?: () => void;
  /** Optional icon to display on the left */
  icon?: React.ReactNode;
}

export function PromoBanner({
  title,
  description,
  actionLabel = 'Know More',
  onPress,
  icon,
}: PromoBannerProps) {
  return (
    <Card
      padding="medium"
      shadow="sm"
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.content}>
        {icon ? <View style={styles.iconWrapper}>{icon}</View> : null}
        <View style={styles.textSection}>
          <AppText variant="body" weight="semiBold" style={styles.title}>
            {title}
          </AppText>
          {description ? (
            <AppText variant="caption" color="secondary" numberOfLines={2}>
              {description}
            </AppText>
          ) : null}
        </View>
        <View style={styles.actionSection}>
          <AppText variant="caption" weight="medium" style={styles.actionText}>
            {actionLabel}
          </AppText>
          <ChevronRight size={16} color={colors.primary.main} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.base,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    marginRight: spacing.md,
  },
  textSection: {
    flex: 1,
  },
  title: {
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  actionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  actionText: {
    color: colors.primary.main,
    marginRight: spacing.xs,
  },
});
