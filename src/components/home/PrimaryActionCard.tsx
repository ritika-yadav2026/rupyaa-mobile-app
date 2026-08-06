import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CreditCard } from 'lucide-react-native';
import { colors, spacing, radius, shadows } from '@/src/theme';
import { AppText } from '../AppText';
import { Button } from '../Button';

interface PrimaryActionCardProps {
  /** Main headline (e.g., "Unlock your credit limit") */
  title: string;
  /** Supporting message (e.g., "From ₹10,000 to ₹5,00,000 in 5 mins") */
  subtitle?: string;
  /** CTA button label (e.g., "Apply Now", "Check Eligibility") */
  ctaLabel: string;
  /** Callback when CTA is pressed */
  onCtaPress: () => void;
  /** Optional icon to display */
  icon?: React.ReactNode;
}

export function PrimaryActionCard({
  title,
  subtitle,
  ctaLabel,
  onCtaPress,
  icon,
}: PrimaryActionCardProps) {
  return (
    <TouchableOpacity activeOpacity={1} style={styles.wrapper}>
      <LinearGradient
        colors={[colors.primary.main, colors.primary.dark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.textSection}>
            <AppText variant="h3" weight="bold" style={styles.title}>
              {title}
            </AppText>
            {subtitle ? (
              <AppText variant="body" style={styles.subtitle} numberOfLines={2}>
                {subtitle}
              </AppText>
            ) : null}
            <View style={styles.ctaWrapper}>
              <Button
                title={ctaLabel}
                onPress={onCtaPress}
                variant="secondary"
                size="medium"
                style={styles.cta}
              />
            </View>
          </View>
          <View style={styles.iconSection}>
            {icon ?? (
              <CreditCard
                size={64}
                color={colors.text.inverse}
                strokeWidth={1.5}
                opacity={0.9}
              />
            )}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  gradient: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textSection: {
    flex: 1,
    marginRight: spacing.lg,
  },
  title: {
    color: colors.text.inverse,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.text.inverse,
    opacity: 0.9,
    marginBottom: spacing.lg,
  },
  ctaWrapper: {
    alignSelf: 'flex-start',
  },
  cta: {
    minWidth: 140,
  },
  iconSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
