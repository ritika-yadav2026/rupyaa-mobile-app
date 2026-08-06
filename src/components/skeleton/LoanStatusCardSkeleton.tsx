import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/src/theme';

interface LoanStatusCardSkeletonProps {
  showIllustration?: boolean;
}

export function LoanStatusCardSkeleton({
  showIllustration = true,
}: LoanStatusCardSkeletonProps) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    return () => {
      pulse.stop();
    };
  }, [opacity]);

  return (
    <View style={styles.cardWrapper}>
      <View style={styles.card}>
        <View style={styles.topSection}>
          <Animated.View
            style={[styles.skeletonBlock, styles.skeletonTitlePill, { opacity }]}
          />
          {showIllustration ? (
            <Animated.View
              style={[styles.skeletonBlock, styles.skeletonIllustration, { opacity }]}
            />
          ) : null}
        </View>

        <Animated.View
          style={[styles.skeletonBlock, styles.skeletonHeading, { opacity }]}
        />
        <Animated.View
          style={[styles.skeletonBlock, styles.skeletonDescriptionLine, { opacity }]}
        />
        <Animated.View
          style={[styles.skeletonBlock, styles.skeletonDescriptionLineShort, { opacity }]}
        />

        <View style={styles.skeletonStepperWrap}>
          <Animated.View
            style={[styles.skeletonBlock, styles.skeletonStepperLine, { opacity }]}
          />
          <Animated.View
            style={[styles.skeletonBlock, styles.skeletonStepperLabelLine, { opacity }]}
          />
        </View>

        <Animated.View
          style={[styles.skeletonBlock, styles.skeletonButton, { opacity }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  card: {
    padding: spacing.lg,
    backgroundColor: colors.background.primary,
    borderRadius: radius.lg,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  skeletonBlock: {
    backgroundColor: colors.border.light,
    borderRadius: radius.sm,
  },
  skeletonTitlePill: {
    width: '34%',
    height: 14,
  },
  skeletonIllustration: {
    width: 96,
    height: 78,
    borderRadius: radius.md,
  },
  skeletonHeading: {
    width: '62%',
    height: 26,
    marginBottom: spacing.sm,
  },
  skeletonDescriptionLine: {
    width: '66%',
    height: 14,
    marginBottom: spacing.xs,
  },
  skeletonDescriptionLineShort: {
    width: '48%',
    height: 14,
    marginBottom: spacing.md,
  },
  skeletonStepperWrap: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  skeletonStepperLine: {
    width: '100%',
    height: 18,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  skeletonStepperLabelLine: {
    width: '86%',
    height: 14,
    alignSelf: 'center',
  },
  skeletonButton: {
    width: '100%',
    height: 48,
    borderRadius: radius.md,
  },
});
