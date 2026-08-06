import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { colors, spacing, radius } from '../theme';
import { AppText } from './AppText';

type ChipVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
type ChipSize = 'small' | 'medium';

interface ChipProps extends ViewProps {
  label: string;
  variant?: ChipVariant;
  size?: ChipSize;
  icon?: React.ReactNode;
}

export function Chip({
  label,
  variant = 'default',
  size = 'medium',
  icon,
  style,
  ...props
}: ChipProps) {
  const { backgroundColor, textColor } = getVariantColors(variant);
  const sizeStyle = getSizeStyle(size);

  return (
    <View
      style={[
        styles.base,
        { backgroundColor },
        sizeStyle,
        style,
      ]}
      {...props}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <AppText
        variant={size === 'small' ? 'captionSmall' : 'caption'}
        weight="medium"
        style={{ color: textColor }}
      >
        {label}
      </AppText>
    </View>
  );
}

function getSizeStyle(size: ChipSize) {
  return size === 'small' ? styles.sizeSmall : styles.sizeMedium;
}

function getVariantColors(variant: ChipVariant): {
  backgroundColor: string;
  textColor: string;
} {
  switch (variant) {
    case 'success':
      return {
        backgroundColor: colors.success.bg,
        textColor: colors.success.dark,
      };
    case 'warning':
      return {
        backgroundColor: colors.warning.bg,
        textColor: colors.warning.dark,
      };
    case 'error':
      return {
        backgroundColor: colors.error.bg,
        textColor: colors.error.dark,
      };
    case 'info':
      return {
        backgroundColor: colors.info.bg,
        textColor: colors.info.dark,
      };
    default:
      return {
        backgroundColor: colors.background.tertiary,
        textColor: colors.text.secondary,
      };
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.full,
  },
  sizeSmall: {
    paddingVertical: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
  },
  sizeMedium: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  icon: {
    marginRight: spacing.xs,
  },
});
