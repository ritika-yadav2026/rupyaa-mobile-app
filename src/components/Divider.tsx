import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { colors, spacing } from '../theme';

interface DividerProps extends ViewProps {
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'small' | 'medium' | 'large';
}

export function Divider({
  orientation = 'horizontal',
  spacing: spacingProp = 'medium',
  style,
  ...props
}: DividerProps) {
  const spacingStyle = getSpacingStyle(spacingProp);

  return (
    <View
      style={[
        styles.base,
        orientation === 'horizontal' ? styles.horizontal : styles.vertical,
        spacingStyle,
        style,
      ]}
      {...props}
    />
  );
}

function getSpacingStyle(spacingProp: 'none' | 'small' | 'medium' | 'large') {
  switch (spacingProp) {
    case 'none':
      return styles.spacingNone;
    case 'small':
      return styles.spacingSmall;
    case 'medium':
      return styles.spacingMedium;
    case 'large':
      return styles.spacingLarge;
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.border.light,
  },
  horizontal: {
    height: 1,
    width: '100%',
  },
  vertical: {
    width: 1,
    height: '100%',
  },
  spacingNone: {
    marginVertical: 0,
  },
  spacingSmall: {
    // marginVertical: spacing.sm,
  },
  spacingMedium: {
    // marginVertical: spacing.base,
  },
  spacingLarge: {
    // marginVertical: spacing.xl,
  },
});
