import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Image,
  ImageStyle,
} from 'react-native';
import { colors, spacing, radius, typography } from '@/src/theme';
import { AppText } from './AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatCurrency } from '@/src/utils/common-helper';
import { IMAGES } from '../constants/images';

export type PaymentSuccessVariant = 'foreclosure' | 'payment';

export interface PaymentSuccessModalProps {
  visible: boolean;
  amountPaid: number;
  /** When provided and > 0, shows REMAINING BALANCE section (e.g. partial payment). */
  remainingBalance?: number;
  /** Controls CTA layout: foreclosure = dual CTAs (Continue to Homepage + Foreclose Now), payment = single CTA. */
  variant: PaymentSuccessVariant;
  onContinueToHomepage: () => void;
  /** Only used when variant is 'foreclosure'. Closes modal and lets user pay remaining balance. */
  onForecloseNow?: () => void;
  onRequestClose?: () => void;
}


/**
 * Payment success modal with design per screenshot:
 * - Green checkmark, "Payment Successful", AMOUNT PAID
 * - Optional REMAINING BALANCE (when remainingBalance > 0)
 * - Conditional CTAs: foreclosure = dual buttons, payment = single "Continue to Homepage"
 */
export function PaymentSuccessModal({
  visible,
  amountPaid,
  remainingBalance = 0,
  variant,
  onContinueToHomepage,
  onForecloseNow,
  onRequestClose,
}: PaymentSuccessModalProps): React.ReactElement | null {
  const insets = useSafeAreaInsets();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, scaleAnim]);

  const showRemainingBalance = remainingBalance != null && remainingBalance > 0;
  const isForeclosure = variant === 'foreclosure';

  const content = (
    <View style={styles.overlay}>
      <Animated.View style={[styles.contentArea, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.contentContainer}>
        <Image source={IMAGES.PAYMENT_SUCCESS} resizeMode="contain" style={styles.image as ImageStyle} />

        <AppText style={styles.title} variant="h4" weight="semiBold">
          Payment Successful
        </AppText>

        <View style={styles.amountSection}>
          <AppText variant="caption" color="tertiary" style={styles.label}>
            AMOUNT PAID
          </AppText>
          <AppText variant="h4" weight="semiBold" style={styles.amount}>
            {formatCurrency(amountPaid)}
          </AppText>
        </View>

        {showRemainingBalance && (
          <View style={styles.amountSection}>
            <AppText variant="caption" color="tertiary" style={styles.label}>
              REMAINING BALANCE
            </AppText>
            <AppText variant="h4" weight="semiBold" style={styles.remainingAmount}>
              {formatCurrency(remainingBalance)}
            </AppText>
          </View>
        )}
        </View>
      <View style={[styles.ctaContainer, { paddingBottom: spacing.xl + insets.bottom }]}>
        {isForeclosure && (
          <TouchableOpacity
            style={styles.secondaryCta}
            onPress={onContinueToHomepage}
            activeOpacity={0.7}
            accessibilityLabel="Continue to Homepage"
            accessibilityRole="button"
          >
            <AppText variant="body" weight="semiBold" color="tertiary">
              Continue to Homepage
            </AppText>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.primaryCta}
          onPress={isForeclosure ? (onForecloseNow ?? onContinueToHomepage) : onContinueToHomepage}
          activeOpacity={0.7}
          accessibilityLabel={isForeclosure ? 'Foreclose Now' : 'Continue to Homepage'}
          accessibilityRole="button"
        >
          <AppText variant="body" weight="semiBold" color="inverse">
            {isForeclosure ? 'Foreclose Now' : 'Continue to Homepage'}
          </AppText>
        </TouchableOpacity>
      </View>
      </Animated.View>

    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onRequestClose ?? onContinueToHomepage}
      statusBarTranslucent
    >
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.xl,
  },
  contentArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    // marginTop: spacing['7xl'],
    // backgroundColor: 'blue',
    // marginBottom: -spacing['4xl'],
  },
  title: {
    color: colors.text.primary,
    marginBottom: spacing['2xl'],
    textAlign: 'center',
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  label: {
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amount: {
    color: colors.text.primary,
    fontSize: typography.fontSize['4xl'],
  },
  remainingAmount: {
    color: colors.primary.main,
    fontSize: typography.fontSize['3xl'],
  },
  ctaContainer: {
    width: '100%',
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  secondaryCta: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryCta: {
    backgroundColor: colors.primary.main,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 250,
    height: 250,
  },
});
