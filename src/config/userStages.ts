import type { FlowPhase } from './flowSteps';

export enum UserStagesInBackend {
  PERSONAL_DETAILS = "PERSONAL_DETAILS",
  MODE_OF_EMPLOYMENT = "MODE_OF_EMPLOYMENT",
  SOFT_PULL = "SOFT_PULL",
  BANK_STATEMENT = "BANK_STATEMENT",
  OFFERINGS = "OFFERINGS",
  CONTACT_DETAILS = "CONTACT_DETAILS",
  ADDRESS_DETAILS = "ADDRESS_DETAILS",
  FAMILY_REFERENCE = "FAMILY_REFERENCE",
  BANK_DETAILS = "BANK_DETAILS",
  AADHAAR_KYC = "AADHAAR_KYC",
  FACE_KYC = "FACE_KYC",
  APPLICATION_STATUS = "APPLICATION_STATUS",
  ACTIVE_LOAN_DASHBOARD = "ACTIVE_LOAN_DASHBOARD",
  // REJECTED_ELIGIBLE_REAPPLY = 'REJECTED_ELIGIBLE_REAPPLY',
  CBL_JOURNEY = "CBL_JOURNEY", // Similar to REJECTED
  REJECTED = "REJECTED", // Similar to CBL_JOURNEY
  ENACH = "ENACH",
  ESIGN = "ESIGN",
  WAITING_FOR_DISBURSEMENT = "WAITING_FOR_DISBURSEMENT",
}

export const USER_STAGES = [
  // Pre-Offer Steps
  UserStagesInBackend.PERSONAL_DETAILS,
  UserStagesInBackend.MODE_OF_EMPLOYMENT,
  UserStagesInBackend.SOFT_PULL,
  UserStagesInBackend.BANK_STATEMENT,

  // Offer Stage
  UserStagesInBackend.OFFERINGS,

  // Post-Offer KYC Steps
  UserStagesInBackend.CONTACT_DETAILS,
  UserStagesInBackend.ADDRESS_DETAILS,
  UserStagesInBackend.FAMILY_REFERENCE,
  UserStagesInBackend.BANK_DETAILS,
  UserStagesInBackend.AADHAAR_KYC,
  UserStagesInBackend.FACE_KYC,

  // Loan Progress
  UserStagesInBackend.APPLICATION_STATUS,
  UserStagesInBackend.ENACH,
  UserStagesInBackend.ESIGN,
  UserStagesInBackend.WAITING_FOR_DISBURSEMENT,
  UserStagesInBackend.ACTIVE_LOAN_DASHBOARD,

  // Special
  UserStagesInBackend.CBL_JOURNEY,
  UserStagesInBackend.REJECTED,
] as const;

export type UserStage = (typeof USER_STAGES)[number];

export const USER_STAGE_GROUPS: Record<FlowPhase, readonly UserStage[]> = {
  register: [UserStagesInBackend.PERSONAL_DETAILS, UserStagesInBackend.MODE_OF_EMPLOYMENT, UserStagesInBackend.SOFT_PULL, UserStagesInBackend.BANK_STATEMENT],
  offer: [UserStagesInBackend.OFFERINGS],
  kyc: [
    UserStagesInBackend.CONTACT_DETAILS,
    UserStagesInBackend.ADDRESS_DETAILS,
    UserStagesInBackend.FAMILY_REFERENCE,
    UserStagesInBackend.BANK_DETAILS,
    UserStagesInBackend.AADHAAR_KYC,
    UserStagesInBackend.FACE_KYC,
  ],
  disbursal: [
    UserStagesInBackend.APPLICATION_STATUS,
    UserStagesInBackend.ENACH,
    UserStagesInBackend.ESIGN,
    UserStagesInBackend.WAITING_FOR_DISBURSEMENT,
    UserStagesInBackend.ACTIVE_LOAN_DASHBOARD,
  ],
};

export const SPECIAL_USER_STAGES: readonly UserStage[] = [UserStagesInBackend.CBL_JOURNEY, UserStagesInBackend.REJECTED];

/**
 * Stages that should always land user on home/dashboard instead of loan journey screens.
 */
export const HOME_REDIRECT_USER_STAGES: readonly UserStage[] = [
  // UserStagesInBackend.ACTIVE_LOAN_DASHBOARD,
  UserStagesInBackend.CBL_JOURNEY,
  UserStagesInBackend.REJECTED,
];

export function isCblOrRejectedStage(stage: UserStage | undefined): boolean {
  if (!stage) return false;
  return stage === UserStagesInBackend.CBL_JOURNEY || stage === UserStagesInBackend.REJECTED;
}

export function isHomeRedirectUserStage(stage: UserStage | undefined): boolean {
  if (!stage) return false;
  return HOME_REDIRECT_USER_STAGES.includes(stage);
}

/** CTA button label for LoanStatusCard per user stage. */
const CTA_LABELS: Record<UserStagesInBackend, string> = {
  [UserStagesInBackend.PERSONAL_DETAILS]: 'Apply for Loan',
  [UserStagesInBackend.MODE_OF_EMPLOYMENT]: 'Complete Profile',
  [UserStagesInBackend.SOFT_PULL]: 'Check Eligibility',
  [UserStagesInBackend.BANK_STATEMENT]: 'Upload Bank Statement',
  [UserStagesInBackend.OFFERINGS]: 'View Loan Offer',
  [UserStagesInBackend.CONTACT_DETAILS]: 'Complete KYC',
  [UserStagesInBackend.ADDRESS_DETAILS]: 'Complete KYC',
  [UserStagesInBackend.FAMILY_REFERENCE]: 'Complete KYC',
  [UserStagesInBackend.BANK_DETAILS]: 'Complete KYC',
  [UserStagesInBackend.AADHAAR_KYC]: 'Verify Identity',
  [UserStagesInBackend.FACE_KYC]: 'Verify Identity',
  [UserStagesInBackend.APPLICATION_STATUS]: 'Under Review',
  [UserStagesInBackend.ENACH]: 'Setup AutoPay',
  [UserStagesInBackend.ESIGN]: 'Sign Agreement',
  [UserStagesInBackend.WAITING_FOR_DISBURSEMENT]: 'View Status',
  [UserStagesInBackend.ACTIVE_LOAN_DASHBOARD]: 'View Dashboard',
  [UserStagesInBackend.CBL_JOURNEY]: 'Reapply',
  [UserStagesInBackend.REJECTED]: 'Reapply',
};

const DEFAULT_CTA_LABEL = 'Continue Journey';

/**
 * Returns the CTA label for the loan status card based on the current user stage.
 */
export function getCtaLabelForStage(stage: UserStage | undefined): string {
  if (!stage) return DEFAULT_CTA_LABEL;
  return CTA_LABELS[stage as UserStagesInBackend] ?? DEFAULT_CTA_LABEL;
}
