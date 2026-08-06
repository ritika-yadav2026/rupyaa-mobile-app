import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '@/src/theme';
import { AppText } from '../AppText';

interface QuickActionButtonProps {
  /** Icon or image to display */
  icon: React.ReactNode;
  /** Label below the icon (e.g., "EMI Tips", "Loan Hacks") */
  label: string;
  /** Callback when pressed */
  onPress?: () => void;
}

export function QuickActionButton({
  icon,
  label,
  onPress,
}: QuickActionButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
      activeOpacity={0.7}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <View style={styles.iconWrapper}>{icon}</View>
      <AppText variant="caption" weight="medium" style={styles.label}>
        {label}
      </AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.text.primary,
  },
});
