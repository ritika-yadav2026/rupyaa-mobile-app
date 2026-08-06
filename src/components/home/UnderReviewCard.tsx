import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { AppText } from '../AppText';
import { RefreshIconButton } from '../RefreshIconButton';
import { colors, radius, spacing, typography } from '@/src/theme';

export interface UnderReviewCardProps {
  applicationNumber?: string;
  heading?: string;
  message?: string;
  badgeLabel?: string;
  onRefreshPress?: () => void;
  isRefreshing?: boolean;
}

const DEFAULT_HEADING = 'Your Application is Under Review';
const DEFAULT_MESSAGE =
  "We're carefully reviewing your application details. This process can take up to 3 days.";
const DEFAULT_BADGE_LABEL = 'UNDER REVIEW';

/** Splits heading so the trailing segment can use accent styling (matches default + legacy copy). */
function splitHeadingForAccent(heading: string): { leading: string; trailing: string } {
  const manualReviewParts = heading.split(/(?=detailed manual review\.?\s*$)/i);
  if (manualReviewParts.length === 2) {
    return {
      leading: manualReviewParts[0].trimEnd(),
      trailing: manualReviewParts[1].trim(),
    };
  }
  const underReviewParts = heading.split(/(?= Under Review$)/i);
  if (underReviewParts.length === 2) {
    return {
      leading: underReviewParts[0].trimEnd(),
      trailing: underReviewParts[1].trim(),
    };
  }
  return { leading: heading.trim(), trailing: '' };
}

/** Bolds the phrase "3 days" when present (any casing, single space). */
function renderMessageWithBoldDuration(message: string): React.ReactNode {
  const segments = message.split(/(6\s+days)/i);
  if (segments.length === 1) {
    return message;
  }
  return segments.map((segment, index) =>
    /^6\s+days$/i.test(segment) ? (
      <Text key={index} style={styles.messageBold}>
        {segment}
      </Text>
    ) : (
      segment
    )
  );
}

export function UnderReviewCard({
  applicationNumber,
  heading = DEFAULT_HEADING,
  message = DEFAULT_MESSAGE,
  badgeLabel = DEFAULT_BADGE_LABEL,
  onRefreshPress,
  isRefreshing = false,
}: UnderReviewCardProps) {
  const { t } = useTranslation();
  const trimmedApplicationNumber =
    typeof applicationNumber === 'string' ? applicationNumber.trim() : '';
  // Accent-split and bold-duration regexes match English phrasing only, so a translated
  // heading/message renders without that styling rather than breaking — an acceptable
  // trade-off for the Hindi/regional case.
  const { leading: leadingHeading, trailing: trailingHeading } = splitHeadingForAccent(t(heading));
  const translatedMessage = t(message);
  const translatedBadgeLabel = t(badgeLabel);

  return (
    <View style={styles.cardWrapper}>
      <View style={styles.badge}>
        <AppText variant="captionSmall" weight="semiBold" style={styles.badgeText}>
          {translatedBadgeLabel}
        </AppText>
      </View>

      <AppText variant="captionSmall" weight="medium" style={styles.headingLabel}>
        {leadingHeading}
      </AppText>
      <AppText variant="h2" weight="bold" style={styles.heading}>
        {trailingHeading || leadingHeading}
      </AppText>
      <AppText variant="captionSmall" style={styles.subtitle}>
        {t("We're working on better loan options for you.")}
      </AppText>

      <View style={styles.metaRow}>
        <View style={styles.applicationPill}>
          <AppText variant="caption" weight="medium" style={styles.applicationText}>
            {t('Application ID : {{id}}', { id: trimmedApplicationNumber || '--' })}
          </AppText>
        </View>
        <RefreshIconButton
          onPress={onRefreshPress}
          isLoading={isRefreshing}
          accessibilityLabel="Refresh application status"
          size={42}
          iconColor={colors.primary.main}
          style={styles.refreshButton}
        />
      </View>

      <AppText variant="captionSmall" style={styles.message} align="center">
        {renderMessageWithBoldDuration(translatedMessage)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: spacing.lg,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.primary.main,
    position: 'relative',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing['3xl'],
    paddingBottom: spacing.lg,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: spacing.xl,
    minWidth: 108,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomLeftRadius: radius.sm,
    borderBottomRightRadius: radius.sm,
    backgroundColor: colors.text.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.primary.main,
    letterSpacing: 0.8,
    fontSize: typography.fontSize.xxs,
  },
  headingLabel: { color: colors.text.black, marginTop: spacing.sm },
  heading: { color: colors.text.black, marginTop: spacing.xs },
  subtitle: { color: colors.text.black, marginTop: spacing.sm, textAlign: 'center' },
  metaRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  applicationPill: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.full,
    backgroundColor: colors.text.black,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applicationText: {
    color: colors.primary.main,
    textAlign: 'center',
  },
  refreshButton: {
    borderColor: colors.text.black,
    backgroundColor: colors.text.black,
  },
  message: {
    color: colors.text.black,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  messageBold: {
    fontFamily: typography.fontFamily.bold,
    lineHeight: 22,
  },
});
