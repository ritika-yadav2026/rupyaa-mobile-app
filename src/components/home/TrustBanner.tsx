import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, typography } from '@/src/theme';
import { AppText } from '../AppText';
import { IMAGES } from '@/src/constants/images';

interface TrustBannerProps {
  /** Main headline (e.g., "Trusted by over 1,00,000 Indians") */
  headline: string;
  /** Subtitle about security */
  subtitle: string;
}

export function TrustBanner({ headline, subtitle }: TrustBannerProps) {
  return (
    <View style={styles.wrapper}>
      {/* White card */}
      <View style={styles.card}>
        <View style={styles.content}>
          <View style={styles.iconWrapper}>
            <Image
              source={IMAGES.TRUST_BANNER}
              style={styles.trustBannerImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.textSection}>
            <AppText variant="body" weight="medium" style={styles.headline}>
              {headline}
            </AppText>
            <AppText variant="caption" color="secondary" style={styles.subtitle}>
              {subtitle}
            </AppText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: spacing.base
  },
  gradientBorder: {
    borderRadius: radius.lg,
    padding: 1.5, // Creates the border effect
  },
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: radius.lg - 1.5,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  content: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  textSection: {
    alignItems: 'center',
    rowGap: spacing.sm,
  },
  headline: {
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
    // fontSize: typography.fontSize.xl,
    // lineHeight: typography.fontSize['2xl'] * typography.lineHeight.tight,
  },
  subtitle: {
    textAlign: 'center',
    // fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
    color: colors.text.secondary,
  },
  trustBannerImage: {
    width: 200,
    height: 80,
    aspectRatio: 5 / 3,
  },
});
