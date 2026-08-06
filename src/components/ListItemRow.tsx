import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, spacing, typography, radius } from '@/src/theme';
import { AppText } from './AppText';

interface ListItemRowProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
}

export function ListItemRow({
  title,
  subtitle,
  icon,
  onPress,
  showChevron = true,
  rightElement,
}: ListItemRowProps) {
  const content = (
    <View style={styles.container}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <View style={styles.textContainer}>
        <AppText style={styles.title} variant="caption" weight='semiBold'>{title}</AppText>
        {subtitle && <AppText style={styles.subtitle} variant="captionSmall" weight='regular'>{subtitle}</AppText>}
      </View>
      {rightElement ? (
        <View style={styles.rightElement}>{rightElement}</View>
      ) : showChevron ? (
        <ChevronRight size={20} color={colors.text.tertiary} />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background.primary,
    minHeight: 60,
  },
  iconContainer: {
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    // fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
  },
  subtitle: {
    // fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  rightElement: {
    marginLeft: spacing.md,
  },
});
