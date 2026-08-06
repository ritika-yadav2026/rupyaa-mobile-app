import React from 'react';
import { View, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { colors, spacing, typography } from '@/src/theme';
import { FullScreenModal } from './FullScreenModal';
import { AppText } from './AppText';
import { Button } from './Button';
import { IMAGES } from '@/src/constants/images';

export type OfferResultVariant = 'success' | 'error';

export interface OfferResultModalProps {
  visible: boolean;
  variant: OfferResultVariant;
  onClose: () => void;
  /** Called when user taps "Try again"; only used for error variant */
  onRetry?: () => void;
}

const SUCCESS_TITLE = 'Offer locked in';
const SUCCESS_SUBTITLE = "Let's get your KYC done";
const CONTINUE_LABEL = 'Continue';
const ERROR_TITLE = 'Something went wrong';
const RETRY_LABEL = 'Try again';

export function OfferResultModal({
  visible,
  variant,
  onClose,
  onRetry,
}: OfferResultModalProps) {
  const isSuccess = variant === 'success';
  const imageSource: ImageSourcePropType = isSuccess
    ? IMAGES.OFFER_ACCEPTANCE
    : IMAGES.OFFER_REJECTION;
  const title = isSuccess ? SUCCESS_TITLE : ERROR_TITLE;
  const subtitle = isSuccess ? SUCCESS_SUBTITLE : undefined;
  const titleColor = isSuccess ? colors.success.main : colors.error.main;

  return (
    <FullScreenModal
      visible={visible}
      onClose={onClose}
      showCloseButton={!isSuccess}
    >
      <View style={styles.modalLayout}>
        <View style={styles.content}>
          <Image
            source={imageSource}
            resizeMode="contain"
            style={styles.image}
            accessibilityRole="image"
            accessibilityLabel={isSuccess ? 'Offer accepted' : 'Something went wrong'}
          />
          <AppText
            variant="h3"
            weight="bold"
            style={[styles.title, { color: titleColor }]}
          >
            {title}
          </AppText>
          {subtitle && (
            <AppText variant="body" style={styles.subtitle}>
              {subtitle}
            </AppText>
          )}
          {!isSuccess && onRetry && (
            <Button
              variant="primary"
              size="large"
              fullWidth
              onPress={onRetry}
              style={styles.retryButton}
            >
              {RETRY_LABEL}
            </Button>
          )}
        </View>
        {isSuccess && (
          <View style={styles.footer}>
            <Button
              variant="primary"
              size="large"
              fullWidth
              onPress={onClose}
            >
              {CONTINUE_LABEL}
            </Button>
          </View>
        )}
      </View>
    </FullScreenModal>
  );
}

const styles = StyleSheet.create({
  modalLayout: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: spacing.xl,
  },
  title: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  retryButton: {
    marginTop: spacing['2xl'],
  },
  footer: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
  },
});
