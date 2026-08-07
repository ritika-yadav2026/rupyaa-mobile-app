import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { IMAGES } from '@/src/constants/images';

interface OnboardingIllustrationProps {
  size?: number;
}

/**
 * Approval-to-bank onboarding illustration from the uploaded design asset.
 */
export function OnboardingApprovalBankIllustration({
  size = 280,
}: OnboardingIllustrationProps) {
  return (
    <Image
      source={IMAGES.ONBOARDING_APPROVAL_BANK}
      style={[styles.image, { width: size, height: size }]}
      resizeMode="contain"
      accessibilityLabel="From approval to your bank"
    />
  );
}

const styles = StyleSheet.create({
  image: {
    alignSelf: 'center',
  },
});
