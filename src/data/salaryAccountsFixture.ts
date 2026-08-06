import type { SalaryAccountsResponse } from '@/src/types/kyc';

/**
 * Default fixture — matches planned GET /user/salary-accounts shape.
 * Account numbers ending in 1234 or 4678 skip the non-salary modal.
 */
export const DEFAULT_SALARY_ACCOUNTS_FIXTURE: SalaryAccountsResponse = {
  salaryAccounts: ['1234', '4678'],
  hintText:
    'Please use your salary account ending with "1234", "4678" for faster processing.',
  validationText:
    'You have used a non salary account for the enach. This will send your application in manual review and might delay the process',
};

/** Edge case: empty salaryAccounts — no hint-driven validation or modal. */
export const EMPTY_SALARY_ACCOUNTS_FIXTURE: SalaryAccountsResponse = {
  salaryAccounts: [],
};

export type SalaryAccountsFixtureScenario = 'default' | 'empty';

export function getSalaryAccountsFixtureForScenario(
  scenario: SalaryAccountsFixtureScenario
): SalaryAccountsResponse {
  return scenario === 'empty'
    ? EMPTY_SALARY_ACCOUNTS_FIXTURE
    : DEFAULT_SALARY_ACCOUNTS_FIXTURE;
}
