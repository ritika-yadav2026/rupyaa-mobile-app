import React from 'react';
import { View, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { colors, spacing, radius, shadows, typography } from '@/src/theme';
import { AppText } from '../AppText';
import { Button } from '../Button';
import { Card } from '../Card';
import { ArrowRightIcon } from '../icons';

interface ProductEligibilityCardProps {
  /** Card title displayed in badge */
  title: string;
  /** Description text below illustration */
  description: string;
  /** Button label */
  buttonLabel: string;
  /** Illustration image */
  illustration?: ImageSourcePropType;
  /** Callback when button is pressed */
  onPress: () => void;
}

export function ProductEligibilityCard({
  title,
  description,
  buttonLabel,
  illustration,
  onPress,
}: ProductEligibilityCardProps) {
  return (
    <View style={styles.wrapper}>
      {/* Title Badge */}
      <View style={styles.badgeContainer}>
        <View style={styles.badge}>
          <AppText variant="body" weight="bold" style={styles.badgeText}>
            {title}
          </AppText>
        </View>
      </View>

      <Card padding="medium" shadow="sm" style={styles.card}>
        {/* Illustration */}
        {illustration && (
          <View style={styles.illustrationContainer}>
            <Image source={illustration} resizeMode="contain" style={styles.illustration} />
          </View>
        )}

        {/* Description */}
        <AppText variant="body" color="textprimary" style={styles.description}>
          {description}
        </AppText>

        {/* Action Button */}
        <Button
          title={buttonLabel}
          onPress={onPress}
          variant="primary"
          size="small"
          rightIcon={<ArrowRightIcon color={colors.text.inverse} />}
          style={styles.button}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
  },
  card: {
    alignItems: 'flex-start',
  },
  badgeContainer: {
    position: 'absolute',
    top: -spacing.md,
    left: spacing.md,
    zIndex: 1,
  },
  badge: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  badgeText: {
    color: colors.text.primary,
  },
  illustrationContainer: {
    width: 150,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  illustration: {
    width: "100%",
    height: "100%",
  },
  description: {
    marginBottom: spacing.lg,
    lineHeight: 20,
    textAlign: 'left',
    fontSize: typography.fontSize.xs,
  },
  button: {
    borderRadius: radius.md,
  },
});
