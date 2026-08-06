import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PermissionStatus } from '@/src/types/permissions';
import { colors, spacing, typography, radius } from '@/src/theme';
import { PermissionStatusBadge } from './PermissionStatusBadge';
import { AppText } from './AppText';

interface PermissionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  status?: PermissionStatus;
}

export function PermissionCard({ icon, title, description, status }: PermissionCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>{icon}</View>
          <AppText style={styles.title} variant="caption" weight='semiBold' color='textprimary'>{title}</AppText>
        </View>
        {status ? <PermissionStatusBadge status={status} /> : null}
      </View>
      <AppText style={styles.description} variant="caption" weight='regular' color='tertiary'>{description}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary.lightest_3,
    borderRadius: radius['2xl'],
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.primary.main,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    backgroundColor: colors.primary.lightest,
    borderRadius: radius.full,
    padding: spacing.sm,
    marginRight: spacing.md,
  },
  title: {
    // fontSize: typography.fontSize.base,
    // fontFamily: typography.fontFamily.semiBold,
    // color: colors.text.primary,
    flexShrink: 1,
  },
  description: {
    // fontSize: typography.fontSize.sm,
    // color: colors.text.secondary,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
    // fontFamily: typography.fontFamily.regular,
  },
});
