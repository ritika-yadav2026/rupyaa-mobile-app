import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { IMAGES } from '@/src/constants/images';

interface OnboardingIllustrationProps {
  size?: number;
}

/**
 * Loan-offer onboarding illustration from the uploaded design asset.
 */
export function OnboardingLoanOfferIllustration({
  size = 280,
}: OnboardingIllustrationProps) {
  return (
    <Image
      source={IMAGES.ONBOARDING_LOAN_OFFER}
      style={[styles.image, { width: size, height: size }]}
      resizeMode="contain"
      accessibilityLabel="Discover loan offer made for you"
    />
  );
}

const styles = StyleSheet.create({
  image: {
    alignSelf: 'center',
  },
});
