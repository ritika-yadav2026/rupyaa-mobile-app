import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  StyleSheet,
  Animated,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFlowStore } from '@/src/store/useFlowStore';
import { useCurrentOfferStore } from '@/src/store/useCurrentOfferStore';
import { colors, spacing, typography } from '@/src/theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { RupyaaLogo } from './RupyaaLogo';
import { IMAGES } from '@/src/constants/images';
import { consoleLogDev, formatCurrency } from '@/src/utils/common-helper';
import { isCurrentOfferSuccess } from '@/src/types/offer';
import { BadgeCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgUri } from 'react-native-svg';

const ANIMATION_DURATION = 280;
const SLIDE_OFFSET = 32;
const SPRING_TENSION = 70;
const SPRING_FRICTION = 11;
const ILLUSTRATION_SIZE = 200;
const VERIFIED_BADGE_SIZE = 120;
const VERIFIED_BADGE_IMAGE_SIZE = 120;
const VERIFIED_ICON_SIZE = 12;
const OVERLAY_Z_INDEX = 9999;

export interface OfferStatusModalProps {
  /** Controls whether the full-screen overlay is visible */
  visible: boolean;
  /** Called when user taps "Check Offers" (Verified state). Caller should close modal and navigate to approved-offer. */
  onCheckOffers: () => void;
  /** Called when user taps "Back to Home" (Pending/Rejected). Caller should close modal and go to home. */
  onBackToHome: () => void;
  /** True while the caller is still fetching user stage before it can navigate to approved-offer. */
  isCheckingOffers?: boolean;
}

/**
 * Full-screen offer status overlay (Verified / Pending / Rejected), same rendering
 * strategy as IneligibilityModal so it transitions with the screen.
 *
 * Variant is read from useFlowStore.offerStatusVariant — set atomically alongside
 * showOfferStatusModal to avoid cross-store race conditions that caused the
 * "No Offer Available" screen to flash before the correct variant rendered.
 *
 * Flow: Modal is opened from BankConnectStep (or from bureau/SoftPull). User then
 * taps "Check Offers" (Verified) or "Back to Home" (Pending/Rejected); "Check Offers"
 * navigates to ApprovedOfferStep.
 */
export function OfferStatusModal({
  visible,
  onCheckOffers,
  onBackToHome,
  isCheckingOffers = false,
}: OfferStatusModalProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const variant = useFlowStore((s) => s.offerStatusVariant) ?? 'Verified';
  const lastResponse = useCurrentOfferStore((s) => s.lastResponse);
  
  // Get offer amount from store if available
  const offerAmount = lastResponse?.success && 
    lastResponse.data != null && 
    isCurrentOfferSuccess(lastResponse.data)
    ? lastResponse.data.offer?.offerAmount
    : null;

  if (visible) {
    consoleLogDev('[OfferStatusModal] Visible, variant:', variant);
  }

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SLIDE_OFFSET)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: SPRING_TENSION,
        friction: SPRING_FRICTION,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, fadeAnim, slideAnim]);

  if (!visible) return null;

  const renderBody = (): React.JSX.Element => {
    if (variant === 'Verified') {
      const amountLabel = offerAmount != null ? formatCurrency(offerAmount) : 'Loan';
      return (
        <>
          <View style={styles.verifiedBadge}>
            <SvgUri
              uri={Image.resolveAssetSource(IMAGES.OFFER_CONGRATULATIONS).uri}
              width={VERIFIED_BADGE_IMAGE_SIZE}
              height={VERIFIED_BADGE_IMAGE_SIZE}
              accessibilityLabel="Verified loan offer"
            />
          </View>
          <AppText style={styles.verifiedTitle} variant="body" weight="medium">
            Congratulations!
          </AppText>
          <AppText style={styles.verifiedSubtitle} variant="captionSmall">
            You’re eligible for a loan offer of
          </AppText>
          <AppText style={styles.verifiedAmount} variant="h1" weight="semiBold">
            {amountLabel}
          </AppText>
          <View style={styles.verifiedProfileRow}>
            <BadgeCheck
              size={VERIFIED_ICON_SIZE}
              color={colors.text.secondary}
              strokeWidth={1.8}
            />
            <AppText style={styles.verifiedProfileText} variant="captionExtraSmall">
              Verified Credit Profile
            </AppText>
          </View>
        </>
      );
    }
    if (variant === 'Pending') {
      return (
        <>
          <Image
            source={IMAGES.OFFER_STATUS_PENDING}
            resizeMode="contain"
            style={styles.illustration}
            accessibilityLabel="Application under review illustration"
          />
          <AppText style={styles.title} variant="h4" weight="semiBold">
            Your Application is Under Review
          </AppText>
          <AppText style={styles.subtitle} variant="caption">
            We&apos;re verifying your details. This may take a few minutes — we&apos;ll notify you once it&apos;s done
          </AppText>
        </>
      );
    }
    return (
      <>
        <Image
          source={IMAGES.NO_OFFER_AVAILABLE_ILLUSTRATION}
          resizeMode="contain"
          style={styles.illustration}
          accessibilityLabel="No offer available illustration"
        />
        <AppText style={styles.title} variant="h4" weight="semiBold">
          No Offer Available Right Now
        </AppText>
        <AppText style={styles.subtitle} variant="caption">
          {t("No offer at the moment. \nBut your ZapCash journey isn't over")}
        </AppText>
        <View style={styles.badgeContainer}>
          <View style={styles.badgeDot} />
          <AppText style={styles.badgeText} variant="caption" weight="regular">
            NEXT REVIEW IN 30 DAYS
          </AppText>
        </View>
      </>
    );
  };

  const isVerified = variant === 'Verified';

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: insets.top, opacity: fadeAnim },
      ]}
    >
      {isVerified ? (
        <LinearGradient
          pointerEvents="none"
          colors={[
            colors.primary.main,
            colors.primary.lightest_3,
            colors.background.primary,
          ]}
          locations={[0, 0.16, 0.32]}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {isVerified ? (
        <View style={styles.verifiedHeader}>
          <RupyaaLogo size="sm" />
        </View>
      ) : null}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isVerified && styles.verifiedScrollContent,
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View
          style={[styles.body, { transform: [{ translateY: slideAnim }] }]}
        >
          {renderBody()}
        </Animated.View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(
              insets.bottom + spacing.base,
              spacing['2xl']
            ),
          },
        ]}
      >
        {isVerified ? (
          <>
            <AppText
              style={styles.verifiedFooterHint}
              variant="captionExtraSmall"
              onPress={onBackToHome}
              accessibilityRole="link"
              accessibilityLabel="Continue to Homepage"
            >
              Continue to Homepage
            </AppText>
            <Button
              variant="primary"
              size="large"
              fullWidth
              onPress={onCheckOffers}
              disabled={isCheckingOffers}
              loading={isCheckingOffers}
              accessibilityLabel="Continue with Application"
            >
              Continue with Application
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            size="large"
            fullWidth
            onPress={onBackToHome}
            accessibilityLabel="Back to Home"
          >
            Back to Home
          </Button>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.primary,
    zIndex: OVERLAY_Z_INDEX,
    elevation: OVERLAY_Z_INDEX,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['3xl'],
  },
  verifiedHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  verifiedScrollContent: {
    justifyContent: 'flex-start',
    paddingTop: spacing['5xl'],
  },
  offerAmountContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  body: {
    alignItems: 'center',
  },
  illustration: {
    width: ILLUSTRATION_SIZE,
    height: ILLUSTRATION_SIZE,
    marginBottom: spacing.xl,
  },
  verifiedBadge: {
    width: VERIFIED_BADGE_SIZE,
    height: VERIFIED_BADGE_SIZE,
    borderRadius: VERIFIED_BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
  },
  verifiedTitle: {
    color: colors.text.primary,
    fontSize: 24,
    lineHeight: 36,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  verifiedSubtitle: {
    color: colors.text.secondary,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  verifiedAmount: {
    color: colors.text.primary,
    fontSize: 60,
    lineHeight: 72,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  verifiedProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  verifiedProfileText: {
    color: colors.text.secondary,
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  offerAmount: {
    color: colors.text.primary,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.lg,
  },
  offerReadyAmount: {
    color: colors.text.primary,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
    fontSize: typography.fontSize['2xl'],
    marginBottom: spacing.lg,
  },
  subtitle: {
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.lightest,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: spacing.base,
    marginBottom: spacing.xl,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary.main,
    marginRight: spacing.sm,
  },
  badgeText: {
    color: colors.primary.main,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    backgroundColor: colors.background.primary,
  },
  verifiedFooterHint: {
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
