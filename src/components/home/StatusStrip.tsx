import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type TextStyle, type ViewStyle } from 'react-native';
import { AppText } from '../AppText';
import { colors, radius, spacing, typography } from '@/src/theme';

interface StatusStripProps {
  statusLabel?: string;
  gradientColors?: readonly [string, string];
  stripContainerStyle?: ViewStyle;
  stripLineStyle?: ViewStyle;
  pillStyle?: ViewStyle;
  pillTextStyle?: TextStyle;
  pillTextWeight?: 'bold' | 'semiBold';
  uppercaseLabel?: boolean;
}

const DEFAULT_GRADIENT_COLORS: readonly [string, string] = ['#016626', '#16A34A'] as const;

export const StatusStrip = ({
  statusLabel,
  gradientColors = DEFAULT_GRADIENT_COLORS,
  stripContainerStyle,
  stripLineStyle,
  pillStyle,
  pillTextStyle,
  pillTextWeight = 'bold',
  uppercaseLabel = true,
}: StatusStripProps) => {
  const normalizedStatusLabel =
    typeof statusLabel === 'string'
      ? uppercaseLabel
        ? statusLabel.trim().toUpperCase()
        : statusLabel.trim()
      : '';
  const shouldShowLabel = normalizedStatusLabel.length > 0;

  return (
    <View style={[styles.stripRow, stripContainerStyle]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.stripLine, stripLineStyle]}
      />
      {shouldShowLabel ? (
        <View style={[styles.pill, styles.stripPillPosition, pillStyle]}>
          <AppText
            variant="captionSmall"
            weight={pillTextWeight}
            style={[styles.pillText, pillTextStyle]}
          >
            {normalizedStatusLabel}
          </AppText>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  stripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.xl,
  },
  stripLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
  },
  stripPillPosition: {
    zIndex: 1,
  },
  pill: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1.2,
    borderColor: colors.primary.main,
  },
  pillText: {
    color: colors.primary.main,
    fontSize: typography.fontSize.xxs,
    letterSpacing: 0.5,
  },
});
