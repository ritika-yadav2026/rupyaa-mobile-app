/**
 * StepLabel - Text label for a step in the progress stepper.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/src/theme';
import { AppText } from '../AppText';

export interface StepLabelProps {
  label: string;
  highlighted: boolean;
}

export function StepLabel({ label, highlighted }: StepLabelProps) {
  return (
    <AppText
      style={[styles.label, highlighted && styles.labelHighlighted]}
      variant="caption"
      weight={highlighted ? 'semiBold' : 'regular'}
      numberOfLines={1}
    >
      {label}
    </AppText>
  );
}

const styles = StyleSheet.create({
  label: {
    marginTop: spacing.xs,
    color: colors.text.primary,
    textAlign: 'center',
    fontSize: typography.fontSize.xs,
    paddingHorizontal: 2,
  },
  labelHighlighted: {
    color: colors.text.black,
  },
});
