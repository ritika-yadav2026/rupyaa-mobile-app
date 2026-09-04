import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { IMAGES } from '@/src/constants/images';

interface OnboardingIllustrationProps {
  size?: number;
}

/**
 * Apply-steps onboarding illustration from the uploaded design asset.
 */
export function OnboardingApplyStepsIllustration({
  size = 280,
}: OnboardingIllustrationProps) {
  return (
    <Image
      source={IMAGES.ONBOARDING_APPLY_STEPS}
      style={[styles.image, { width: size, height: size }]}
      resizeMode="contain"
      accessibilityLabel="Apply in just a few steps"
    />
  );
}

const styles = StyleSheet.create({
  image: {
    alignSelf: 'center',
  },
});
