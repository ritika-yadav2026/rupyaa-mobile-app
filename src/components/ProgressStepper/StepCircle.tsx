/**
 * StepCircle - Circle indicator for a single step in the progress stepper.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors } from '@/src/theme';

const CIRCLE_SIZE = 20;

export interface StepCircleProps {
  showCheck: boolean;
  active: boolean;
}

export function StepCircle({ showCheck, active }: StepCircleProps) {
  const isCompleted = showCheck;

  return (
    <View
      style={[
        styles.circle,
        active && !isCompleted && styles.circleActive,
        isCompleted && styles.circleCompleted,
      ]}
    >
      {isCompleted && (
        <Check size={14} color={colors.text.inverse} strokeWidth={3} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.border.main,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleActive: {
    borderColor: colors.primary.main,
  },
  circleCompleted: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
});
