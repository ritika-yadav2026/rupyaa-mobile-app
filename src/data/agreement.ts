/**
 * Loan agreement data types and mock data for the Agreement step.
 * In production, this data would come from the backend after offer acceptance.
 */

/** Key Fact Statement (KFS) line item displayed in the agreement summary. */
export interface KfsItem {
  label: string;
  value: string;
  /** Highlight this row (e.g. net disbursement) */
  highlight?: boolean;
}

/** Full agreement details returned by the backend. */
export interface AgreementDetails {
  loanAmount: number;
  annualInterestRate: number;
  tenureDays: number;
  monthlyEmi: number;
  processingFee: number;
  gstOnProcessingFee: number;
  totalInterest: number;
  totalRepayment: number;
  netDisbursement: number;
  /** ISO date string for agreement generation */
  agreementDate: string;
  /** Lender / NBFC name */
  lenderName: string;
}

/**
 * Mock agreement details for the disbursal flow.
 * Matches the approved offer values (Rs. 1,00,000 / 365 days / 12% p.a.).
 */
export const MOCK_AGREEMENT_DETAILS: AgreementDetails = {
  loanAmount: 100000,
  annualInterestRate: 12,
  tenureDays: 365,
  monthlyEmi: 8900,
  processingFee: 1500,
  gstOnProcessingFee: 270,
  totalInterest: 6800,
  totalRepayment: 106800,
  netDisbursement: 98230,
  agreementDate: new Date().toISOString(),
  lenderName: 'FataFat Finance Ltd.',
};
