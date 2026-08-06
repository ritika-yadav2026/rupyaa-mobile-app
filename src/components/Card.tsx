import React from 'react';
import { View, ViewProps, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius, shadows } from '../theme';

type CardPadding = 'none' | 'small' | 'medium' | 'large';
type CardShadow = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends ViewProps {
  padding?: CardPadding;
  shadow?: CardShadow;
  bordered?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
}

export function Card({
  padding = 'medium',
  shadow = 'md',
  bordered = false,
  onPress,
  style,
  children,
  ...props
}: CardProps) {
  const paddingStyle = getPaddingStyle(padding);
  const containerStyle = [
    styles.base,
    paddingStyle,
    shadows[shadow],
    bordered && styles.bordered,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyle} {...props}>
      {children}
    </View>
  );
}

function getPaddingStyle(padding: CardPadding) {
  switch (padding) {
    case 'none':
      return styles.paddingNone;
    case 'small':
      return styles.paddingSmall;
    case 'medium':
      return styles.paddingMedium;
    case 'large':
      return styles.paddingLarge;
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.background.primary,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  paddingNone: {
    padding: 0,
  },
  paddingSmall: {
    padding: spacing.md,
  },
  paddingMedium: {
    padding: spacing.base,
  },
  paddingLarge: {
    padding: spacing.xl,
  },
  bordered: {
    borderWidth: 1,
    borderColor: colors.border.light,
  },
});
