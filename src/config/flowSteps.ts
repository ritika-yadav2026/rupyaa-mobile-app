/**
 * Single source of truth for the loan application flow.
 * Add/remove/reorder substeps here — no routing or store changes needed.
 * 
 * SOFT_PULL FLOW (register phase, substep 3):
 * ============================================
 * The SoftPullStep performs eligibility check and conditional navigation:
 * 1. Calls GET /user/get-user-eligibility-experian (retries until approved or rejected)
 * 2. Calls GET /user/get-user-stage to sync backend stage
 * 3. If rejected: shows error, user cannot proceed
 * 4. Resolves offer data (from synced stage or GET /offer/current-offer fallback)
 * 5. If offer exists: navigates to ApprovedOfferStep
 * 6. If no offer: navigates to BankConnectStep (offer phase, substep 0) for bank statement upload
 * 
 * All logic centralized in: src/services/registration/softPullFlow.ts
 */

export const FLOW_CONFIG = {
  register: {
    id: 'register',
    label: 'Details',
    substeps: [
      { id: 'personal-details', label: 'Personal Details', component: 'PersonalDetailsStep' },
      // { id: 'email-otp', label: 'Verify Email', component: 'EmailOtpStep' },
      { id: 'employment-type', label: 'Employment Type', component: 'EmploymentTypeStep' },
      { id: 'employment-details', label: 'Work Details', component: 'EmploymentDetailsStep' },
      { id: 'soft-pull', label: 'Eligibility Check', component: 'SoftPullStep' },
      // { id: 'work-email-otp', label: 'Verify Work Email', component: 'WorkEmailOtpStep' },
    ],
  },
  offer: {
    id: 'offer',
    label: 'Offer',
    substeps: [
      // Bank statement upload when no immediate offer is available after SOFT_PULL
      { id: 'bank-connect', label: 'Bank Connect', component: 'BankConnectStep' },
      // Final offer presentation (offer status shown as full-screen modal, then navigate here on Check Offers)
      { id: 'approved-offer', label: 'View Offer', component: 'ApprovedOfferStep' },
    ],
  },
  kyc: {
    id: 'kyc',
    label: 'Verify',
    substeps: [
      { id: 'contact-details', label: 'Contact Details', component: 'ContactDetailsStep' },
      { id: 'address-details', label: 'Address Details', component: 'AddressDetailsStep' },
      { id: 'family-details', label: 'Family Details', component: 'FamilyDetailsStep' },
      { id: 'reference-details', label: 'References', component: 'ReferenceDetailsStep' },
      { id: 'bank-details', label: 'Bank Details', component: 'BankDetailsStep' },
      { id: 'digilocker', label: 'DigiLocker', component: 'DigilockerStep' },
      { id: 'face-kyc', label: 'Face Verification', component: 'FaceKycStep' },
      // { id: 'email-verify', label: 'Email Verify', component: 'EmailVerifyStep' },
    ],
  },
  disbursal: {
    id: 'disbursal',
    label: 'Get Funds',
    substeps: [
      // { id: 'agreement', label: 'Agreement', component: 'AgreementStep' },
      // Add Enach Step
      { id: 'enach', label: 'Enach', component: 'EnachStep' },
      { id: 'esign', label: 'E-Sign', component: 'EsignStep' },
      // g outh
      { id: 'sanctioned', label: 'Sanctioned', component: 'SanctionedStep' },
    ],
  },
} as const;

export const FLOW_PHASES = ['register', 'offer', 'kyc', 'disbursal'] as const;

export type FlowPhase = (typeof FLOW_PHASES)[number];

export type FlowSubstepId = (typeof FLOW_CONFIG)[FlowPhase]['substeps'][number]['id'];

export type StepComponentId = (typeof FLOW_CONFIG)[FlowPhase]['substeps'][number]['component'];

/** Get phase config by index (0-3) */
export function getPhaseByIndex(index: number): FlowPhase {
  const clamped = Math.max(0, Math.min(index, FLOW_PHASES.length - 1));
  return FLOW_PHASES[clamped];
}

/** Get substep count for a phase */
export function getSubstepCount(phase: FlowPhase): number {
  return FLOW_CONFIG[phase].substeps.length;
}

export interface FlowStepPosition {
  phase: FlowPhase;
  substepIndex: number;
}

/**
 * Returns 0-based substep index by substep id within a phase, or -1 when not found.
 */
export function getSubstepIndexById(phase: FlowPhase, substepId: string): number {
  return FLOW_CONFIG[phase].substeps.findIndex((s) => s.id === substepId);
}

/**
 * Finds phase + index for a given substep id across all phases.
 * Keep all id->index lookup logic centralized for easier debugging.
 */
export function findFlowPositionBySubstepId(substepId: string): FlowStepPosition | null {
  for (const phase of FLOW_PHASES) {
    const substepIndex = getSubstepIndexById(phase, substepId);
    if (substepIndex !== -1) {
      return { phase, substepIndex };
    }
  }
  return null;
}

/** Get main step labels for ProgressStepper (4 circles) */
export function getMainStepLabels(): readonly { id: string; label: string }[] {
  return FLOW_PHASES.map((phase) => ({
    id: FLOW_CONFIG[phase].id,
    label: FLOW_CONFIG[phase].label,
  }));
}

/**
 * Real-time progress within a phase (0–100) based on current substep.
 * Use for step/substep progress so the UI reflects current position, not just passed state.
 */
export function getPhaseProgressPercent(phase: FlowPhase, substepId: string): number {
  const substeps = FLOW_CONFIG[phase].substeps;
  const idx = Math.max(0, substeps.findIndex((s) => s.id === substepId));
  const total = substeps.length;
  return total <= 1 ? 100 : Math.round(((idx + 1) / total) * 100);
}

/** One item in the flattened flow (one substep) */
export interface FlatFlowItem {
  phase: FlowPhase;
  substepId: string;
  label: string;
}

/**
 * Flatten the flow into one linear list of substeps for smooth step-indicator progress.
 * Register → personal-details → employment-type → employment-details → Offer → ...
 */
export function flattenFlow(): FlatFlowItem[] {
  const items: FlatFlowItem[] = [];
  for (const phase of FLOW_PHASES) {
    for (const s of FLOW_CONFIG[phase].substeps) {
      items.push({ phase, substepId: s.id, label: s.label });
    }
  }
  return items;
}

/**
 * Current position (0-based index) in the flattened flow for the given phase and substep.
 * Use as currentPosition so the indicator moves smoothly as the user completes substeps.
 */
export function getFlatIndex(phase: FlowPhase, substepId: string): number {
  const flat = flattenFlow();
  const idx = flat.findIndex((x) => x.phase === phase && x.substepId === substepId);
  return Math.max(0, idx);
}
