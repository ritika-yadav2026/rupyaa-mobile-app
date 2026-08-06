import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography } from '@/src/theme';
import { AppText } from '../AppText';

const LEFT_GRADIENT: [string, string] = [colors.background.primary, colors.border.main];
const RIGHT_GRADIENT: [string, string] = [colors.border.main, colors.background.primary];

interface SectionHeaderProps {
  /** Section title */
  title: string;
  /** Optional "View more" link label */
  viewMoreLabel?: string;
  /** Callback when "View more" is pressed */
  onViewMorePress?: () => void;
}

/** Small vertical tick at the end of a divider line. */
const Tail = () => <View style={styles.tail} />;

/** Gradient divider line: fades from white to dark (left) or dark to white (right). */
const GradientLine = ({ direction }: { direction: 'left' | 'right' }) => (
  <LinearGradient
    colors={direction === 'left' ? LEFT_GRADIENT : RIGHT_GRADIENT}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={styles.line}
  />
);

export function SectionHeader({
  title,
  viewMoreLabel,
  onViewMorePress,
}: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Left divider: tail ── gradient (white→dark) ── tail */}
      <Tail />
      <GradientLine direction="left" />
      <Tail />

      <AppText variant="caption" weight="medium" style={styles.title} numberOfLines={1}>
        {title}
      </AppText>
      {viewMoreLabel && onViewMorePress ? (
        <TouchableOpacity onPress={onViewMorePress} activeOpacity={0.7}>
          <AppText variant="caption" style={styles.viewMore}>
            {viewMoreLabel}
          </AppText>
        </TouchableOpacity>
      ) : null}

      {/* Right divider: tail ── gradient (dark→white) ── tail */}
      <Tail />
      <GradientLine direction="right" />
      <Tail />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.base,
    marginTop: spacing.base,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  tail: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.main,
  },
  title: {
    color: colors.text.secondary,
    paddingHorizontal: spacing.md,
    flexShrink: 0,
  },
  viewMore: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xs,
    textDecorationLine: 'underline',
    paddingHorizontal: spacing.md,
  },
});
