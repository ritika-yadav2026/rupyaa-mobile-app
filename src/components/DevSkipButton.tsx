import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors, spacing } from '@/src/theme';

interface DevSkipButtonProps {
  onSkip: () => void;
  label?: string;
}

/**
 * Dev-only skip button component.
 * Renders nothing in production builds (when __DEV__ is false).
 * Used for development/testing to quickly skip through flow steps.
 */
export function DevSkipButton({ onSkip, label = 'DEV SKIP' }: DevSkipButtonProps) {
  if (!__DEV__) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onSkip} activeOpacity={0.7}>
        <AppText style={styles.badge} variant="captionSmall" weight="bold">
          DEV ONLY
        </AppText>
        <AppText style={styles.label} variant="caption" weight="semiBold">
          {label}
        </AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  button: {
    borderWidth: 1.5,
    borderColor: colors.warning.main,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.warning.bg,
    alignItems: 'center',
    width: '100%',
  },
  badge: {
    color: colors.warning.dark,
    marginBottom: spacing.xs / 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  label: {
    color: colors.warning.dark,
  },
});
