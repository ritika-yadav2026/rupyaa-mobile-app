/**
 * Loan routing and date helpers for active loan dashboard flow.
 */

import type { BureauPolicyAnalyticsPayload, Loan } from '@/src/types/loans';
import type { ApiResponse } from '@/src/types/api';
import type { CurrentOfferResponse, OfferLoanStatus } from '@/src/types/offer';
import type { UserEligibilityExperianResponse } from '@/src/types/user';
import { consoleLogDev, formatCurrency, getTotalPayable } from '@/src/utils/common-helper';
import { getLoanTypeDisplayName } from '@/src/utils/loan-formatters';

/** Loan status value when loan is fully paid (get-existing-active-loan response). */
export const LOAN_STATUS_PAID = 'Paid';

/**
 * Returns true if the loan status indicates the loan is fully paid (case-insensitive).
 * Use for get-existing-active-loan response; when true, payment/foreclosure screens should redirect to home.
 */
export function isLoanStatusPaid(loanStatus: string | null | undefined): boolean {
  if (loanStatus == null || typeof loanStatus !== 'string') return false;
  return loanStatus.trim().toLowerCase() === LOAN_STATUS_PAID.toLowerCase();
}

/** Show NOC CTA on history cards when loan.status is fully paid. */
export function shouldShowNocCta(loan: Loan | null | undefined): boolean {
  return isLoanStatusPaid(loan?.status);
}

/**
 * True when get-existing-active-loan top-level `loanStatus` is pending (application under review).
 */
export function isLoanStatusPending(loanStatus: string | null | undefined): boolean {
  if (loanStatus == null || typeof loanStatus !== 'string') return false;
  return loanStatus.trim().toLowerCase() === 'pending';
}

export type OfferStatusModalVariant = 'Verified' | 'Pending' | 'Rejected';

/** Safely extracts eligibility error details only from failed API responses. */
export function getEligibilityErrorDetails(
  response: ApiResponse<UserEligibilityExperianResponse>
): Partial<UserEligibilityExperianResponse> | undefined {
  if (response.success) return undefined;
  const details = response.error?.details;
  return typeof details === 'object' && details !== null
    ? (details as Partial<UserEligibilityExperianResponse>)
    : undefined;
}

/** Maps loan status to the offer modal variant; missing status still means Verified when an offer exists. */
export function resolveOfferStatusModalVariant(
  offerLoanStatus: OfferLoanStatus | undefined
): OfferStatusModalVariant {
  if (offerLoanStatus === 'Pending') return 'Pending';
  if (offerLoanStatus === 'rejected') return 'Rejected';
  return 'Verified';
}

/** Uses the API no-offer message when present, otherwise falls back to bank statement guidance. */
export function resolveNoOfferMessage(
  offerResponse: ApiResponse<CurrentOfferResponse>
): string {
  if (!offerResponse.success || offerResponse.data == null) {
    return 'No offer available. Please complete bank statement verification.';
  }

  const message = offerResponse.data.message;
  return typeof message === 'string' && message.trim().length > 0
    ? message
    : 'No offer available. Please complete bank statement verification.';
}

/** Builds the rejection analytics payload from eligibility error details. */
export function getPayloadForBureauPolicyResponse(eligibilityDataError: Partial<UserEligibilityExperianResponse>): BureauPolicyAnalyticsPayload {
  return {
    status: eligibilityDataError?.status,
    decile: eligibilityDataError?.decile,
    empType: eligibilityDataError?.empType,
    declaredSalary: eligibilityDataError?.salary ?? 0,
    offerAmount: 0,
  }
}

export type LoanCategory = 'ongoing' | 'history';

export interface ClassifiedLoans {
  ongoing: Loan[];
  history: Loan[];
}

function normalizeLoanStatus(loan: Loan | null | undefined): string {
  if (!loan?.status || typeof loan.status !== 'string') return '';
  return loan.status.trim().toLowerCase();
}

// add or remove statuses here (value decided by Sumit Sir)
const HISTORY_LOAN_STATUSES = ['paid'];  // suggestion by suit
const ONGOING_LOAN_STATUSES = ['disbursed', 'overdue'];

export function isHistoryLoan(loan: Loan): boolean {
  const status = normalizeLoanStatus(loan);
  if (!status) return false;
  return HISTORY_LOAN_STATUSES.includes(status);
}

export function isOngoingLoan(loan: Loan): boolean {
  const status = normalizeLoanStatus(loan);
  if (!status) return false;
  if (ONGOING_LOAN_STATUSES.includes(status)) return true;
  return false;
}

/**
 * Classify loans into ongoing vs history buckets.
 * - History: status in [NPA, Paid, Waivered, Expired] OR isForeclosed === true
 * - Ongoing: status in [Disbursed, Overdue] or anything else not matched above
 */
export function classifyLoans(loans: Loan[]): ClassifiedLoans {
  const ongoing: Loan[] = [];
  const history: Loan[] = [];

  for (const loan of loans) {
    if (isHistoryLoan(loan)) {
      history.push(loan);
    } else if (isOngoingLoan(loan)) {
      ongoing.push(loan);
    }
  }

  consoleLogDev('ongoing', ongoing);
  consoleLogDev('history', history);

  return { ongoing, history };
}

/**
 * Derive a human-friendly loan title for cards.
 * Prefer `reason` (e.g. "personal loan") and title-case it; fallback to loan type display name.
 */
export function getLoanDisplayTitle(loan: Loan): string {
  const reason = typeof loan.reason === 'string' ? loan.reason.trim() : '';
  if (reason.length > 0) {
    return reason.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const typeName = loan.type ? getLoanTypeDisplayName(loan.type) : '';
  return typeName || 'Personal Loan';
}

/**
 * Returns true if loan status is Disbursed (case-insensitive).
 * Backend may return "DISBURSED" or "Disbursed".
 */
export function isDisbursedLoan(loan: Loan | null): boolean {
  if (!loan?.status || typeof loan.status !== 'string') return false;
  return loan.status.toLowerCase() === 'disbursed';
  // return true;
}

/**
 * Returns true if dueDate is strictly after today (start of day, local timezone).
 * Used to decide foreclosure vs payment: future due date → foreclosure.
 */
export function isDueDateInFuture(dueDate: string): boolean {
  if (!dueDate || typeof dueDate !== 'string') return false;
  const date = new Date(dueDate);
  if (isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date.getTime() > today.getTime();
}

export type ActiveLoanScreenType = 'foreclosure' | 'payment';

/**
 * Resolves which screen to show for an active DISBURSED loan.
 * - dueDate in future → foreclosure
 * - dueDate today or past → payment
 * - not disbursed or no loan → null
 */
export function resolveActiveLoanScreenType(
  loan: Loan | null
): ActiveLoanScreenType | null {
  if (!loan) return null;
  return isDueDateInFuture(loan.dueDate) ? 'foreclosure' : 'payment';
}

/**
 * Returns status pill label for ACTIVE_LOAN_DASHBOARD card (top-right badge).
 * Uses dueDate: future → 'Active', today or past → 'Overdue'.
 * Isolated from other flows; fallback to 'Active' when loan/dueDate missing.
 */
export function getActiveLoanStatusPill(loan: Loan | null): 'Active' | 'Overdue' {
  if (!loan?.dueDate) return 'Active';
  return isDueDateInFuture(loan.dueDate) ? 'Active' : 'Overdue';
}

/** Resolves status pill for Active Loan card. Dev override takes precedence. */
export function resolveActiveLoanStatusPill(
  loan: Loan | null,
  devOverride: 'active' | 'overdue' | null
): 'Active' | 'Overdue' {
  if (devOverride) return devOverride === 'active' ? 'Active' : 'Overdue';
  return getActiveLoanStatusPill(loan);
}

/** Maps status pill label to variant for styling. */
export function statusPillToVariant(pill: 'Active' | 'Overdue'): 'active' | 'overdue' {
  return pill === 'Overdue' ? 'overdue' : 'active';
}

/**
 * Resolves display amount for loan status card.
 * Priority: loan amount → offer amount → dev mock (when useDevMockForActiveLoan).
 */
export function resolveCardDisplayAmount(
  loanAmount: number | undefined,
  offerAmount: number | undefined,
  options: { useDevMockForActiveLoan?: boolean }
): number | undefined {
  if (typeof loanAmount === 'number' && Number.isFinite(loanAmount)) return loanAmount;
  if (typeof offerAmount === 'number' && Number.isFinite(offerAmount)) return offerAmount;
  return options.useDevMockForActiveLoan ? 50000 : undefined;
}

/**
 * Amount due for display in Active Loan card.
 * Priority: amountDue (API field, live soon) → emiAmount → totalPayable.
 */
export function getAmountDue(loan: Loan | null): number {
  if (!loan) return 0;
  if (typeof loan.amountDue === 'number' && Number.isFinite(loan.amountDue) && loan.amountDue > 0) {
    return loan.amountDue;
  }
  const emi = loan.emiAmount;
  const total = loan.totalPayable ?? getTotalPayable(loan);
  return typeof emi === 'number' && Number.isFinite(emi) ? emi : total;
}

/**
 * Resolves the total payable amount shown on the Payment (Make Payment) screen.
 *
 * Current rule: always use `loan.amountDue` — the authoritative outstanding balance from the API.
 *
 * Future: partial-payment logic, penalty caps, or post-tenure rules may apply here.
 * Update only this function when that logic changes — callers stay untouched.
 */
export function resolvePaymentTotalPayable(loan: Loan | null): number {
  if (!loan) return 0;
  if (typeof loan.amountDue === 'number' && Number.isFinite(loan.amountDue) && loan.amountDue > 0) {
    return loan.amountDue;
  }
  // Fallback until amountDue is live in the API
  // return getTotalPayable(loan);
  return 0
}

/**
 * Resolves the total payable amount shown on the Foreclosure screen.
 *
 * Current rule: always use `loan.amountDue` — the authoritative "pay to close" figure from the API.
 *
 * Future: when tenure ends, a different penalty/post-due amount may apply.
 * Update only this function when that logic changes — callers stay untouched.
 */
export function resolveForeclosureTotalPayable(loan: Loan | null): number {
  if (!loan) return 0;
  if (typeof loan.amountDue === 'number' && Number.isFinite(loan.amountDue) && loan.amountDue > 0) {
    return loan.amountDue;
  }
  // Fallback until amountDue is live in the API
  return 0;
}

/** Format a date string to "12 Feb 2026" style for display. */
export function formatLoanDueDate(dateStr: string): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Build heading and description for ACTIVE_LOAN_DASHBOARD card from loan state (foreclosure vs overdue). */
export function buildActiveLoanCardContent(loan: Loan | null): {
  heading: string;
  description: string;
} {
  if (!loan || !isDisbursedLoan(loan)) {
    return {
      heading: 'Your loan is active',
      description:
        'Your loan is active. Close on time to avoid late fees and save on interest.',
    };
  }
  const screenType = resolveActiveLoanScreenType(loan);
  if (screenType === 'foreclosure') {
    const disbursedAt = loan.disbursedAt ?? loan.actualDisbursedAt ?? '';
    const disbursedLabel =
      disbursedAt ? formatLoanDueDate(disbursedAt) : 'disbursement';
    const amountStr = formatCurrency(loan.amount ?? 0);
    const dueDateStr = loan.dueDate ? formatLoanDueDate(loan.dueDate) : '';
    const description = dueDateStr
      ? `Next repayment due on ${dueDateStr}.`
      : 'Please repay on time to avoid late fees.';
    return {
      heading: `${amountStr} Credited Successfully on ${disbursedLabel}`,
      description,
    };
  }
  const totalPayable = getTotalPayable(loan);
  return {
    heading: 'Immediate Payment Required',
    description: `Your repayment of ${formatCurrency(totalPayable)} is significantly overdue. Please pay immediately to avoid further charges and impact on your credit profile.`,
  };
}
