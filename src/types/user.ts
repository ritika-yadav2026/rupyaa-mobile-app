import type { UserStage } from '@/src/config/userStages';

export interface UserStageContext {
  offerStatus?: string;
  offerSource?: string;
  showUpdateButton?: boolean;
}

export interface GetUserStageResponse {
  stage: UserStage;
  showDashboard?: boolean;
  context?: UserStageContext;
}

export interface GetUserStageResult {
  stage?: UserStage;
  sectionsCompleted?: UserStageSectionsCompleted;
  showDashboard?: boolean;
  context?: UserStageContext;
  /** When true, backend is still resolving the stage — keep calling getUserStage until false. */
  retryStage?: boolean;
  raw?: unknown;
}

export interface UserStageSectionsCompleted {
  isContactComplete?: boolean;
  isAddressComplete?: boolean;
  /** @deprecated Backend is moving to isFamilyComplete + isReferenceComplete. */
  isFamilyReferenceComplete?: boolean;
  isBankComplete?: boolean;
  isAadhaarComplete?: boolean;
  isFaceKycComplete?: boolean;
  isFamilyComplete?: boolean;
  isReferenceComplete?: boolean;
}

export interface UserEligibilityExperianResponse {
  success?: boolean;
  status?: string;
  salary?: number;
  decile?: number;
  empType?: string;
  isReloan?: boolean;
  smsBureauLoanCreated?: boolean;
  message?: string;
  isAppRedirected?: boolean;
  /** Explicit eligibility flag returned by the backend. false = ineligible. */
  isEligible?: boolean;
}

export interface GetUserBankStatementStatusResult {
  bankStatementStatus?: 'Pending' | 'Approved' | 'Aprroved' | 'Processed' | 'Rejected';
  /**
   * Remaining account-aggregator attempts for BSA.
   * Backend may send either AAattemptsLeft or aaAttemptsLeft.
   */
  AAattemptsLeft?: number | string;
  aaAttemptsLeft?: number | string;
  /** Remaining manual upload attempts. */
  manualUploadAttemptsLeft?: number | string;
  callApplyLoan?: boolean;
  bankStatementKey?: Record<string, unknown>;
  status?: string;
  message?: string;
  [key: string]: unknown;
}

export interface ApplyLoanResponse {
  message?: string;
  status?: string;
  offerAmount?: number;
  bankingSalary?: number;
  decile?: number;
  empType?: string;
  isReloan?: boolean;
  loanCreatedSuccess?: boolean;
  loanNumber?: string;
  /** When present (e.g. "RETRY"), backend is asking user to retry BSA (AA or manual upload). */
  retryMethod?: string;
}
