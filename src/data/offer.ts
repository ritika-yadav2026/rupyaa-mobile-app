/**
 * Loan offer type for approved offer flow.
 * Used when displaying pre-approved loan details to the user.
 * tenure is in days (e.g. 365 for 1 year).
 */
export interface LoanOffer {
  id: string;
  amount: number;
  interestRate: number;
  tenure: number;
  emi: number;
  processingFee: number;
}

/**
 * Mock loan offer for approved-offer screen.
 * Matches screenshot: Rs. 1,00,000, 365 days, 12% p.a., Rs. 8,900/month EMI.
 */
export const MOCK_LOAN_OFFER: LoanOffer = {
  id: 'offer-001',
  amount: 100000,
  interestRate: 12,
  tenure: 365,
  emi: 8900,
  processingFee: 1500,
};
