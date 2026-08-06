import type { DropdownOption } from '@/src/components/DropdownSelect';
import type { Loan } from '@/src/types/loans';

/**
 * Collects unique, non-empty application numbers from user loans (first occurrence order).
 */
export function getValidApplicationNumbers(loans: Loan[] | undefined): string[] {
  if (!loans?.length) {
    return [];
  }

  const seen = new Set<string>();
  const result: string[] = [];

  for (const loan of loans) {
    const trimmed = loan.applicationNumber?.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
}

/** Maps application numbers to dropdown options (label = value = application number). */
export function toApplicationDropdownOptions(
  numbers: string[]
): DropdownOption<string>[] {
  return numbers.map((value) => ({ label: value, value }));
}
