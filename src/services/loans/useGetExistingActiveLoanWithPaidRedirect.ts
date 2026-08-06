import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { useGetExistingActiveLoan } from './useGetExistingActiveLoan';
import { isLoanStatusPaid } from '@/src/utils/loan-helpers';

/** Route to redirect to when active loan is Paid (loan fully closed). */
const HOME_ROUTE = '/(tabs)/home';

type UseGetExistingActiveLoanOptions = {
  enabled?: boolean;
};

/**
 * Wrapper around useGetExistingActiveLoan for payment/foreclosure screens.
 * When the API returns loanStatus = Paid, redirects to home so the user is not stuck on a screen for an already-closed loan.
 * Use this on screens that assume an "active" loan (e.g. Make Payment, Foreclose Loan).
 *
 * Returns the same as useGetExistingActiveLoan plus:
 * - shouldRedirectToHome: true when loan is Paid (redirect in progress); screens can show loading to avoid flashing content.
 */
export function useGetExistingActiveLoanWithPaidRedirect(
  options?: UseGetExistingActiveLoanOptions
) {
  const query = useGetExistingActiveLoan(options);
  const hasRedirected = useRef(false);

  const data = query.data;
  const shouldRedirectToHome = Boolean(data && isLoanStatusPaid(data.loanStatus));

  useEffect(() => {
    if (hasRedirected.current) return;
    if (query.isPending || query.isError) return;
    if (!data || !isLoanStatusPaid(data.loanStatus)) return;

    hasRedirected.current = true;
    router.replace(HOME_ROUTE as never);
  }, [data, query.isPending, query.isError]);

  return {
    ...query,
    shouldRedirectToHome,
  };
}
