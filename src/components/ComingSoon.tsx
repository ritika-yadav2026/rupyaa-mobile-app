import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { colors, spacing, typography } from '@/src/theme';
import { AuthHeader } from './AuthHeader';
import { AppLogo } from './AppLogo';

interface ComingSoonProps {
  /** Optional custom message */
  message?: string;
  /** Optional style override */
  style?: View['props']['style'];
}

/**
 * ComingSoon - A reusable component to display "coming soon" placeholder content
 * Can be used in screens or sections that are not yet implemented
 */
export function ComingSoon({ message = 'Coming Soon', style }: ComingSoonProps) {
  return (
    <View style={[styles.container, style]}>
      <AppLogo size="lg" />
      <AppText style={styles.text}>{message}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  text: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.secondary,
  },
});
