import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PermissionStatus } from '@/src/types/permissions';
import { colors, spacing, radius } from '@/src/theme';

interface PermissionStatusBadgeProps {
  status: PermissionStatus;
}

export function PermissionStatusBadge({ status }: PermissionStatusBadgeProps) {
  const isGranted = status === 'granted';

  return (
    <View
      style={styles.badgeContainer}
      accessibilityLabel={isGranted ? 'Allowed' : 'Not allowed'}
      accessibilityRole="image"
    >
      <View
        style={[
          styles.badgeDot,
          isGranted ? styles.badgeDotGranted : styles.badgeDotDenied,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  badgeDotGranted: {
    backgroundColor: colors.success.main,
  },
  badgeDotDenied: {
    backgroundColor: colors.text.tertiary,
  },
});
