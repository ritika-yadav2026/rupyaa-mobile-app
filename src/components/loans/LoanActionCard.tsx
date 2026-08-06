import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
  ActivityIndicator,
} from 'react-native';
import { AppText } from '@/src/components';
import { ArrowRightIcon } from '@/src/components/icons';
import { colors, spacing, radius, typography, shadows } from '@/src/theme';

export type LoanActionCardVariant = 'default' | 'highlight';

export interface LoanActionCardProps {
  /** Small tag label (e.g. "Foreclose Loan", "Make Payment") */
  tag: string;
  /** Main content text */
  content: string;
  /** Action link label */
  actionLabel: string;
  /** Callback when card or CTA is pressed */
  onPress?: () => void;
  /** Illustration image source (e.g. money bags) */
  illustrationSource: ImageSourcePropType;
  /** Visual variant: default (beige) or highlight (green accent) */
  variant?: LoanActionCardVariant;
  /** Show loading spinner on CTA and disable press */
  ctaLoading?: boolean;
  /** Error message to show below CTA */
  ctaError?: string | null;
}

const FORECLOSURE_BG = '#FDF5EC';
const FORECLOSURE_TAG_BG = '#FFE4CC';
const HIGHLIGHT_BG = '#E8F5E9';
const HIGHLIGHT_TAG_BG = colors.primary.lightest;
const HIGHLIGHT_BORDER = colors.primary.main;

/**
 * Shared promo-style loan card: pill tag, content, CTA with arrow, illustration.
 * Used by ForeclosureCard (default) and PaymentCard (highlight).
 */
export function LoanActionCard({
  tag,
  content,
  actionLabel,
  onPress,
  illustrationSource,
  variant = 'default',
  ctaLoading = false,
  ctaError = null,
}: LoanActionCardProps) {
  const isHighlight = variant === 'highlight';
  const cardStyle = [
    styles.card,
    isHighlight ? styles.cardHighlight : styles.cardDefault,
  ];
  const tagStyle = [
    styles.tag,
    isHighlight ? styles.tagHighlight : styles.tagDefault,
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={cardStyle}
      disabled={ctaLoading}
      accessibilityLabel={`${tag}: ${content}`}
      accessibilityRole="button"
    >
      <View style={styles.tagWrapper}>
        <View style={tagStyle}>
          <AppText variant="captionSmall" weight="semiBold" style={styles.tagText}>
            {tag}
          </AppText>
        </View>
      </View>
      <AppText variant="body" style={styles.content} numberOfLines={3}>
        {content}
      </AppText>
      <View style={styles.actionRow}>
        <View style={styles.actionLeft}>
          {ctaLoading ? (
            <ActivityIndicator size="small" color={colors.primary.main} />
          ) : (
            <>
              <AppText variant="caption" weight="semiBold" style={styles.actionText}>
                {actionLabel}
              </AppText>
              <ArrowRightIcon />
            </>
          )}
        </View>
        <View style={styles.imageContainer}>
          <Image
            source={illustrationSource}
            resizeMode="contain"
            style={styles.image}
          />
        </View>
      </View>
      {ctaError ? (
        <AppText variant="caption" color="error" style={styles.ctaError}>
          {ctaError}
        </AppText>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  cardDefault: {
    backgroundColor: FORECLOSURE_BG,
    borderColor: colors.border.light,
  },
  cardHighlight: {
    backgroundColor: HIGHLIGHT_BG,
    borderColor: HIGHLIGHT_BORDER,
    borderWidth: 1.5,
    ...shadows.sm,
  },
  tagWrapper: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  tagDefault: {
    backgroundColor: FORECLOSURE_TAG_BG,
  },
  tagHighlight: {
    backgroundColor: HIGHLIGHT_TAG_BG,
  },
  tagText: {
    color: colors.text.primary,
  },
  content: {
    color: colors.text.primary,
    marginBottom: spacing.md,
    lineHeight: 22,
    fontSize: typography.fontSize.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 24,
  },
  actionText: {
    color: colors.text.primary,
    marginRight: spacing.xs,
    fontSize: typography.fontSize.xs,
  },
  imageContainer: {
    width: 120,
    height: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  ctaError: {
    marginTop: spacing.sm,
  },
});
