/**
 * ProgressStepper - A simple, prop-driven progress indicator
 *
 * Usage:
 * <ProgressStepper
 *   steps={[{ id: 'register', label: 'Register' }, ...]}
 *   currentStep={1}        // Which step is active (0-indexed)
 *   progress={0.5}         // Optional: progress within current step (0 to 1)
 *   passedPhases={{ register: true, offer: false, ... }} // Which phases are passed
 * />
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing, colors, typography } from '@/src/theme';
import { getStepperVisualStates } from '@/src/utils/progressStepperUtils';
import type { StepItem } from '@/src/utils/progressStepperUtils';
import type { FlowPhase } from '@/src/config/flowSteps';
import { StepCircle } from './StepCircle';
import { Connector } from './Connector';
import { StepLabel } from './StepLabel';
import { AppText } from '../AppText';

// ============================================================================
// Types
// ============================================================================

export interface ProgressStepperProps {
  /** Array of steps to display */
  steps: readonly StepItem[];
  /** Current active step index (0-based) */
  currentStep: number;
  /** Progress within current step (0 to 1). Optional, defaults to 0 */
  progress?: number;
  /** Record of passed phases: { register: true, offer: false, ... } */
  passedPhases?: Record<FlowPhase, boolean>;
  /** Record of passed substeps: { "register:0": true, "offer:1": true, ... } */
  passedSubsteps?: Record<string, boolean>;
  /** Current active substep index within the current phase (0-based). Optional */
  currentSubstepIndex?: number;
  /** Total substeps in the current phase. When > 1, substep progress (e.g. "2 of 3") is shown. */
  totalSubstepsInCurrentPhase?: number;
  /** Label of the current substep (e.g. "Work Details"). Optional. */
  currentSubstepLabel?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export function ProgressStepper({
  steps,
  currentStep,
  progress = 0,
  passedPhases,
  passedSubsteps,
  currentSubstepIndex = 0,
  totalSubstepsInCurrentPhase,
  currentSubstepLabel,
}: ProgressStepperProps) {
  if (!steps.length) return null;

  const lastIndex = steps.length - 1;
  const stepStates = getStepperVisualStates({
    steps,
    currentStep,
    progress,
    passedPhases,
    passedSubsteps,
    currentSubstepIndex,
    logMode: 'always',
  });

  const showSubstepProgress =
    typeof totalSubstepsInCurrentPhase === 'number' &&
    totalSubstepsInCurrentPhase > 1 &&
    typeof currentSubstepIndex === 'number';
  const substepProgressText = showSubstepProgress
    ? `${currentSubstepIndex + 1} of ${totalSubstepsInCurrentPhase}`
    : null;

  return (
    <View style={styles.container} accessibilityLabel="Progress steps">
      <View style={styles.indicatorRow}>
        {steps.map((step, index) => {
          const state = stepStates[index];
          if (!state) return null;

          return (
            <React.Fragment key={step.id}>
              <StepCircle showCheck={state.showsCheck} active={state.isActive} />
              {index < lastIndex && (
                <Connector filled={state.rightFilled} partialFill={state.rightPartial} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      <View style={styles.labelRow}>
        {steps.map((step, index) => {
          const state = stepStates[index];
          if (!state) return null;
          const isActive = index === currentStep;

          return (
            <View key={step.id} style={styles.labelCell}>
              <StepLabel label={step.label} highlighted={state.highlighted} />
              {isActive && substepProgressText && (
                <AppText
                  style={styles.substepLabel}
                  variant="caption"
                  numberOfLines={1}
                >
                  {currentSubstepLabel ?? substepProgressText}
                </AppText>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    width: '100%',
  },
  labelCell: {
    flex: 1,
    alignItems: 'center',
  },
  substepLabel: {
    marginTop: 2,
    fontSize: typography.fontSize.xxs,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
