/**
 * Loan types based on API response structure.
 */

import { logBureauPolicyResponseApp } from "../services/analytics/analyticsService";
import { ApiResponse } from "./api";
import { CurrentOfferOffer } from "./offer";
import { UserEligibilityExperianResponse } from "./user";

export type LoanStatus = 'Sanctioned' | 'Disbursed' | 'Completed' | 'Foreclosed' | 'Overdue' | string;
export type PaymentStatus = 'Pending' | 'Paid' | 'Overdue' | string;
export type LoanType = 'PAY_DAY' | 'CREDIT_BUILDER' | string;

export interface LoanFollowUp {
  lastAddedBy: string | null;
  status: boolean;
}

export interface Loan {
  _id: string;
  amount: number;
  tenure: string;
  dueDate: string;
  totalPayable: number;
  applicationNumber: string;
  createdAt: string;
  updatedAt: string;
  fee?: number;
  feePercentage?: number;
  reason?: string;
  status?: LoanStatus;
  interestRate?: number;
  interestRateAfterDueDate?: number;
  paymentStatus?: PaymentStatus;
  type?: LoanType;
  emiAmount?: number;
  /** Total amount currently due for repayment. API field — will be populated once live. */
  amountDue?: number;
  bounceAmount?: number;
  totalPenaltyAmount?: number;
  totalAmountPaid?: number;
  paid?: boolean;
  isForeclosed?: boolean;
  userName?: string;
  phoneNumber?: string;
  lendingNbfc?: string;
  disbursedAt?: string;
  actualDisbursedAt?: string;
  followUp?: LoanFollowUp;
  user?: string;
  isRiskyCustomer?: boolean;
  NPATransferredTo?: string;
  assignedTo?: string;
  isEdited?: boolean;
  logs?: unknown[];
  paymentRemindersSentOn?: unknown[];
  appliedVia?: string;
  afterDisbursalStatus?: string;
  isInLMS?: boolean;
  transactions?: string[];
  emiDates?: unknown[];
  isSettlement?: boolean;
  isAuditDone?: boolean;
  nbfc?: unknown[];
  verdictGivenByAnalyzer?: string;
  bureauResult?: string;
  bsaResult?: string;
  userAgent?: string;
  ipAddress?: string;
  isSentInMIS?: boolean;
  waiverAmount?: number;
  isWaivered?: boolean;
  isReviewDone?: boolean;
  isBSAManual?: boolean;
  refundAmount?: number;
  subStatus?: string;
  category?: string;
  callCount?: number;
  autoDisbursalChecksPassed?: boolean;
  lastCallStatus?: string;
  lastCallDate?: string;
  platform?: string;
  policy?: string;
  source?: string;
  sanctionedPdfKey?: string;
  finalSignedContract?: string;
  assignedToPreCollection?: string;
  overdueSubstatus?: string;
  assignedNbfcCode?: string;
  editedLoanDetails?: unknown[];
  partialTransactions?: unknown[];
  emails?: unknown[];
  [key: string]: unknown;
}

export interface GetAllUserLoansResponse {
  message: string;
  loans: Loan[];
}

export interface GetExistingActiveLoanResponse {
  message: string;
  canCancel?: boolean;
  hasActiveLoan: boolean;
  loan: Loan | null;
  loanStatus: string;
}

/** Success payload from POST /user/noc-request */
export interface LoanNocResponse {
  message?: string;
  url?: string;
  pdfKey?: string;
  status?: boolean;
}

/** Normalized NOC result for UI (open URL and/or show message). */
export interface ParsedLoanNocResult {
  openUrl: string | null;
  message: string | null;
}


export type SoftPullFlowNextAction = 'offer' | 'bank-statement';
export type SoftPullFlowErrorType =
  | 'ELIGIBILITY_REJECTED'
  | 'ELIGIBILITY_CHECK_FAILED'
  | 'UNEXPECTED';

export type SoftPullFlowError = {
  type: SoftPullFlowErrorType;
  message: string;
  canRetry: boolean;
  /** true when the API explicitly returns isEligible: false — triggers IneligibilityModal. */
  isIneligible?: boolean;
}

/**
 * Result of the soft pull eligibility check flow.
 * Determines the next navigation action based on eligibility and offer availability.
 */
export type SoftPullFlowSuccess = { success: true; nextAction: SoftPullFlowNextAction };
type SoftPullFlowFailure = { success: false; error: SoftPullFlowError };
export type SoftPullFlowResult = SoftPullFlowSuccess | SoftPullFlowFailure;

export type EligibilityErrorResolver = {
  type: Exclude<SoftPullFlowErrorType, 'UNEXPECTED'>;
  canRetry: boolean;
  matches: (response: ApiResponse<UserEligibilityExperianResponse>) => boolean;
  resolveMessage: (response: ApiResponse<UserEligibilityExperianResponse>) => string | undefined;
  fallbackMessage: string;
};

export type BureauPolicyAnalyticsPayload = Parameters<typeof logBureauPolicyResponseApp>[0];

export type BuildBureauPolicyAnalyticsPayloadParams = {
  eligibilityData?: UserEligibilityExperianResponse;
  offerPayload: CurrentOfferOffer;
  isReloan: boolean;
};
