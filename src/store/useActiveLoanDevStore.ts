import { create } from 'zustand';

/**
 * Dev-only: override Active Loan card to test Active vs Overdue UI.
 * When set, home screen passes mock data to force the chosen variant.
 * Only used when __DEV__.
 */
export type ActiveLoanTestVariant = 'active' | 'overdue' | null;

export interface ActiveLoanDevState {
  testVariant: ActiveLoanTestVariant;
  setTestVariant: (variant: ActiveLoanTestVariant) => void;
  clearTestVariant: () => void;
}

export const useActiveLoanDevStore = create<ActiveLoanDevState>((set) => ({
  testVariant: null,
  setTestVariant: (variant) => set({ testVariant: variant }),
  clearTestVariant: () => set({ testVariant: null }),
}));
