/**
 * IFSC lookup via Razorpay public API (https://ifsc.razorpay.com).
 * No auth required. Used to prefill bank name and branch in Bank Details step.
 */

import { pushLoanJourneyUnknownError } from '@/src/services/logging/logPoolJourney';

const IFSC_API_BASE = 'https://ifsc.razorpay.com';
const LOOKUP_TIMEOUT_MS = 10_000;

/** Valid IFSC: 4 letters + 0 + 6 alphanumeric (uppercase). */
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export type IfscLookupStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'invalid'
  | 'unavailable'
  | 'stale';

export interface IfscLookupResult {
  ifscCode: string;
  bankName: string;
  branchName: string;
  city: string;
  state: string;
}

export type IfscLookupOutcome =
  | { status: 'success'; data: IfscLookupResult }
  | { status: 'invalid' }
  | { status: 'unavailable' };

/** Raw response shape from Razorpay IFSC API. */
interface RazorpayIfscResponse {
  BANK?: string;
  IFSC?: string;
  BRANCH?: string;
  CITY?: string;
  DISTRICT?: string;
  STATE?: string;
}

/** Exported for use in BankDetailsStep to gate lookup trigger (blur/search). */
export function isValidIfscFormat(ifsc: string): boolean {
  const trimmed = ifsc?.trim().toUpperCase() ?? '';
  return trimmed.length === 11 && IFSC_REGEX.test(trimmed);
}

function normalizeString(value: unknown): string {
  if (value == null) return '';
  const s = String(value).trim();
  return s;
}

/**
 * Look up bank details by IFSC code.
 * Returns success with normalized data, or invalid (404) / unavailable (network/timeout).
 * Non-blocking: caller can still let user manually fill bank/branch on failure.
 */
export async function lookupIfsc(ifsc: string): Promise<IfscLookupOutcome> {
  const normalized = ifsc?.trim().toUpperCase() ?? '';
  if (!isValidIfscFormat(normalized)) {
    return { status: 'invalid' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);

  try {
    const response = await fetch(`${IFSC_API_BASE}/${normalized}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.status === 404) {
      return { status: 'invalid' };
    }

    if (!response.ok) {
      pushLoanJourneyUnknownError(
        'bank details ifsc lookup',
        new Error(`IFSC API returned HTTP ${response.status}`)
      );
      return { status: 'unavailable' };
    }

    const raw = (await response.json()) as RazorpayIfscResponse;
    const bankName = normalizeString(raw.BANK) || normalizeString(raw.IFSC);
    const branchName = normalizeString(raw.BRANCH);
    const city = normalizeString(raw.CITY) || normalizeString(raw.DISTRICT);
    const state = normalizeString(raw.STATE);

    if (!bankName || !branchName) {
      pushLoanJourneyUnknownError(
        'bank details ifsc lookup',
        new Error('IFSC API response is missing bank or branch')
      );
      return { status: 'unavailable' };
    }

    return {
      status: 'success',
      data: {
        ifscCode: normalized,
        bankName,
        branchName,
        city,
        state,
      },
    };
  } catch (error) {
    clearTimeout(timeoutId);
    pushLoanJourneyUnknownError('bank details ifsc lookup', error);
    return { status: 'unavailable' };
  }
}
