import type React from 'react';
import type { StepComponentId } from '@/src/config/flowSteps';

/** A single substep within a phase */
export interface FlowSubstep {
  id: string;
  label: string;
  component: StepComponentId;
}

/** Configuration for a flow phase (e.g., Register, Offer, KYC, Disbursal) */
export interface FlowPhaseConfig {
  id: string;
  label: string;
  substeps: readonly FlowSubstep[];
}

/** Props passed to every step component */
export interface StepProps {
  onNext: () => void;
  onPrev: () => void;
  /**
   * @deprecated The wizard header is now rendered at the LoanWizard level and no
   * longer passed down. This field is kept optional so existing step destructuring
   * does not break during the migration, but it will always be undefined.
   */
  header?: React.ReactNode;
}
