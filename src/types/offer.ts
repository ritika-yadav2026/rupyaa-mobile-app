/**
 * Types for /offer/current-offer API.
 * Success: message + offer object. No-offer: 200 with message only. 404: not found.
 */

import type { LoanType } from './loans';

export const RELOAN_SUB_STATUS = 'ReLoan';  // Same as Backend constant RELOAN

export interface CurrentOfferLoanId {
  _id: string;
  applicationNumber?: string;
  amount: number;
  tenure: string;
  status?: string;
  totalPayable?: number;
  interestRate?: number;
  [key: string]: unknown;
}

export interface CurrentOfferOffer {
  _id: string;
  userId?: string;
  loanId?: CurrentOfferLoanId;
  phoneNumber?: string;
  offerAmount?: number | null;
  loanTenure: number;
  interestRate: number;
  payableAmount: number;
  status: string;
  isActive?: boolean;
  rawOffer?: number;
  penalizedOffer?: number;
  policy?: string;
  history?: unknown[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

/** Success response when an offer exists */
export interface CurrentOfferSuccessResponse {
  message: string;
  offer: CurrentOfferOffer;
  loanType?: LoanType;
  isRiskyCustomer?: boolean;
  riskyReloanCount?: number;
  showUpdateButton?: boolean;
}

/** 200 response when no offer/loan exists for the user */
export interface CurrentOfferNoOfferResponse {
  message: string;
}

/** Combined success body: offer is present when loan exists */
export type CurrentOfferResponse = CurrentOfferSuccessResponse | CurrentOfferNoOfferResponse;

export function isCurrentOfferSuccess(
  data: CurrentOfferResponse
): data is CurrentOfferSuccessResponse {
  return 'offer' in data && data.offer != null;
}

/** Extracts offer amount from current-offer response. Returns undefined if no valid offer. */
export function getOfferAmount(
  response: { success?: boolean; data?: CurrentOfferResponse } | null | undefined
): number | undefined {
  if (!response?.success || !response.data || !isCurrentOfferSuccess(response.data)) {
    return undefined;
  }
  const amount = response.data.offer.offerAmount;
  return typeof amount === 'number' && Number.isFinite(amount) ? amount : undefined;
}

/**
 * Extracts application/loan identifier from current-offer response for display (e.g. LoanStatusCard).
 * current-offer uses offer.loanId (object with _id) or string; get-existing-active-loan uses loan.applicationNumber.
 * Use this when home is shown after BSA/bureau and get-existing-active-loan has not been refetched yet.
 */
export function getApplicationNumberFromCurrentOffer(
  response: { success?: boolean; data?: CurrentOfferResponse } | null | undefined
): string | undefined {
  if (!response?.success || !response.data || !isCurrentOfferSuccess(response.data)) {
    return undefined;
  }
  const offer = response.data.offer;
  const loanId = (offer?.loanId as CurrentOfferLoanId)?.applicationNumber;
  if (loanId == null) return undefined;
  if (typeof loanId === 'string' && loanId.trim().length > 0) return loanId.trim();
  if (typeof loanId === 'object' && loanId !== null && '_id' in loanId) {
    const id = (loanId as { _id?: unknown })._id;
    return typeof id === 'string' && id.trim().length > 0 ? id.trim() : undefined;
  }
  const appNum = (offer as { applicationNumber?: unknown }).applicationNumber;
  return typeof appNum === 'string' && appNum.trim().length > 0 ? appNum.trim() : undefined;
}

/** Status value when offer is available for user to view and accept */
export const OFFER_STATUS_OFFERED = 'OFFERED';
export const OFFER_STATUS_ACTIVE = 'ACTIVE';

/** Whether the offer is in a state that can be displayed and accepted */
export function isOfferAcceptable(offer: CurrentOfferOffer): boolean {
  // Only show offer when loanId.status is Verified. Pending/rejected must not display offer card.
  const loanStatus = getOfferLoanStatusFromOffer(offer);
  if (loanStatus === 'Pending' || loanStatus === 'rejected') return false;
  return true;
}

/** Extracts normalized loan status from a single offer. Internal helper for isOfferAcceptable. */
function getOfferLoanStatusFromOffer(offer: CurrentOfferOffer): OfferLoanStatus | undefined {
  const loanId = offer?.loanId;
  if (loanId == null || typeof loanId === 'string') return undefined;
  const raw = loanId.status;
  if (typeof raw !== 'string' || raw.trim().length === 0) return undefined;
  const normalized = raw.trim().toUpperCase();
  if (normalized === 'PENDING') return 'Pending';
  if (normalized === 'VERIFIED') return 'Verified';
  return 'rejected';
}

/** Normalized loan status from offer.loanId for BankConnect step CTA and message */
export type OfferLoanStatus = 'Pending' | 'Verified' | 'rejected';

/**
 * Derives normalized loan status from current-offer response for CTA/message logic.
 * When offer.loanId is an object with status, returns Pending | Verified | rejected; else undefined.
 */
export function getOfferLoanStatus(
  data: CurrentOfferResponse | null | undefined
): OfferLoanStatus | undefined {
  if (!data || !isCurrentOfferSuccess(data)) return undefined;
  const loanId = data.offer?.loanId;
  if (loanId == null || typeof loanId === 'string') return undefined;
  const raw = loanId.status;
  if (typeof raw !== 'string' || raw.trim().length === 0) return undefined;
  const normalized = raw.trim().toUpperCase();
  if (normalized === 'PENDING') return 'Pending';
  if (normalized === 'VERIFIED') return 'Verified';
  return 'rejected';
}

export function getOfferLoanSubStatus(data: CurrentOfferResponse 
  | null 
  | undefined
): boolean {
  if (!data || !isCurrentOfferSuccess(data)) return false;
  const loanId = data.offer?.loanId;
  if (loanId == null || typeof loanId === 'string') return false;
  const raw = loanId.subStatus;
  if (typeof raw !== 'string' || raw.trim().length === 0) return false;
  const normalized = raw.trim().toUpperCase();
  if (normalized === RELOAN_SUB_STATUS.toUpperCase()) return true;
  return false;
}