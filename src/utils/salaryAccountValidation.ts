import { normalizeSalaryAccountSuffix } from '@/src/utils/mapSalaryAccountsResponse';

/**
 * Extracts last 4 digits from an account number (non-digits stripped).
 */
export function getAccountLastFourDigits(accountNumber: string): string {
  const digitsOnly = accountNumber.replace(/\D/g, '');
  if (digitsOnly.length === 0) return '';
  return digitsOnly.slice(-4).padStart(4, '0');
}

/**
 * True when validation is skipped (no salary list) or entered account matches
 * at least one backend salary suffix.
 */
export function isEnteredAccountSalaryMatch(
  accountNumber: string,
  salaryAccounts: string[]
): boolean {
  if (salaryAccounts.length === 0) return true;

  const enteredLastFour = getAccountLastFourDigits(accountNumber);
  if (enteredLastFour.length < 4) return false;

  const normalizedSuffixes = salaryAccounts
    .map(normalizeSalaryAccountSuffix)
    .filter((item): item is string => item !== null);

  return normalizedSuffixes.some((suffix) => suffix === enteredLastFour);
}
