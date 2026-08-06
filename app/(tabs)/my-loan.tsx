import React from 'react';
import { Screen } from '@/src/components';
import AllLoansScreen from '@/src/components/screens/all-loans';

/**
 * My Loan tab: shows all user loans (list + CTAs to Foreclosure and Payment screens).
 * Foreclosure and Payment flows live on separate routes for easier enhancement.
 */
export default function MyLoanTab() {
  return (
    <Screen scroll={false} edges={[]}>
      <AllLoansScreen />
    </Screen>
  );
}
