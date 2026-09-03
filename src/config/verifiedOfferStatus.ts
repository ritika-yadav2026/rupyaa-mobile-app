export interface VerifiedOfferLockedLoan {
  readonly loanNumber: number;
  readonly subtitle: string;
  readonly moreLabel: string;
  readonly amountLabel: string;
}

export const VERIFIED_OFFER_STATUS = {
  lockedLoans: [
    {
      loanNumber: 2,
      subtitle: 'Unlocks after repayment',
      moreLabel: '₹2,400',
      amountLabel: '₹2,400',
    },
    {
      loanNumber: 3,
      subtitle: 'Unlocks after repayment',
      moreLabel: '₹5,000',
      amountLabel: '₹5,000',
    },
  ],
} as const satisfies { lockedLoans: readonly VerifiedOfferLockedLoan[] };
