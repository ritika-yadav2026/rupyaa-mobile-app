import type { SalaryAccountsResponse } from '@/src/types/kyc';

const EMPTY_SALARY_ACCOUNTS: SalaryAccountsResponse = {
  salaryAccounts: [],
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const trimOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const collectNestedRecords = (record: Record<string, unknown>): Record<string, unknown>[] => {
  const keys = ['data', 'result', 'payload'];
  const nested: Record<string, unknown>[] = [];
  for (const key of keys) {
    const value = record[key];
    if (isRecord(value)) nested.push(value);
  }
  return nested;
};

/** Normalizes API suffix to 4-digit string (e.g. 183 → "0183"). */
export function normalizeSalaryAccountSuffix(item: unknown): string | null {
  if (typeof item === 'number' && Number.isFinite(item)) {
    const digits = String(Math.trunc(item)).replace(/\D/g, '');
    if (digits.length === 0) return null;
    return digits.slice(-4).padStart(4, '0');
  }
  if (typeof item === 'string') {
    const digits = item.replace(/\D/g, '');
    if (digits.length === 0) return null;
    return digits.slice(-4).padStart(4, '0');
  }
  return null;
}

function parseSalaryAccounts(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const suffixes = raw
    .map(normalizeSalaryAccountSuffix)
    .filter((item): item is string => item !== null);
  return [...new Set(suffixes)];
}

/**
 * Normalizes GET /user/salary-accounts payload (supports nested `data` wrappers).
 * Returns empty salaryAccounts on invalid/missing data so the bank step stays usable.
 */
export function mapSalaryAccountsResponse(data: unknown): SalaryAccountsResponse {
  if (!isRecord(data)) return EMPTY_SALARY_ACCOUNTS;

  const records = [data, ...collectNestedRecords(data)];

  for (const record of records) {
    const salaryAccounts = parseSalaryAccounts(record.salaryAccounts);
    const hintText = trimOptionalString(record.hintText);
    const validationText = trimOptionalString(record.validationText);

    if (salaryAccounts.length > 0 || hintText || validationText) {
      return {
        salaryAccounts,
        hintText,
        validationText,
      };
    }
  }

  return EMPTY_SALARY_ACCOUNTS;
}
