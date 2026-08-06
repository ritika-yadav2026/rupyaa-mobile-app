/**
 * Fetches city and state for a 6-digit Indian pincode.
 * Uses the public API at api.postalpincode.in (no auth required).
 */

import { pushLoanJourneyUnknownError } from '@/src/services/logging/logPoolJourney';

export type PincodeLookupResult =
  | { ok: true; city: string; state: string }
  | { ok: false; reason: 'invalid' | 'not_found' | 'network_error' | 'timeout' };

const PINCODE_API_BASE = 'https://api.postalpincode.in/pincode';
const PINCODE_LOOKUP_TIMEOUT_MS = 8_000;

/**
 * Fetch city and state for the given pincode.
 * Never throws. Returns a structured failure reason for better UI handling.
 */
export async function getCityStateFromPincode(
  pincode: string,
  signal?: AbortSignal
): Promise<PincodeLookupResult> {
  const trimmed = pincode?.trim() ?? '';
  if (trimmed.length !== 6 || !/^\d{6}$/.test(trimmed)) {
    return { ok: false, reason: 'invalid' };
  }
  // Ensure we don't block the UI forever on flaky networks / API hangs.
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  const timeoutId = setTimeout(() => controller.abort(), PINCODE_LOOKUP_TIMEOUT_MS);

  // React Native/Hermes may not support AbortSignal.any(), so manually link signals.
  if (signal?.aborted) {
    controller.abort();
  }
  signal?.addEventListener?.('abort', onAbort);

  try {
    const response = await fetch(`${PINCODE_API_BASE}/${trimmed}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      pushLoanJourneyUnknownError(
        'address pincode lookup',
        new Error(`Pincode API returned HTTP ${response.status}`)
      );
      return { ok: false, reason: 'network_error' };
    }

    const data = (await response.json()) as Array<{
      Status?: string;
      Message?: string;
      PostOffice?: Array<{ District?: string; State?: string }> | null;
    }>;

    const first = data?.[0];
    const status = first?.Status?.trim().toLowerCase();
    const message = first?.Message?.trim().toLowerCase();
    if (status === 'error' || message === 'no records found') {
      return { ok: false, reason: 'not_found' };
    }

    const offices = first?.PostOffice;
    if (!Array.isArray(offices) || offices.length === 0) {
      return { ok: false, reason: 'not_found' };
    }
    const office = offices[0];
    const city = office?.District?.trim() ?? '';
    const state = office?.State?.trim() ?? '';
    if (!city || !state) {
      pushLoanJourneyUnknownError(
        'address pincode lookup',
        new Error('Pincode API response is missing city or state')
      );
      return { ok: false, reason: 'not_found' };
    }
    return { ok: true, city, state };
  } catch (e: unknown) {
    const maybeAbortError = e as { name?: unknown };
    if (maybeAbortError?.name === 'AbortError') {
      if (!signal?.aborted) {
        pushLoanJourneyUnknownError(
          'address pincode lookup',
          new Error('Pincode lookup timed out')
        );
      }
      return { ok: false, reason: 'timeout' };
    }
    pushLoanJourneyUnknownError('address pincode lookup', e);
    return { ok: false, reason: 'network_error' };
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener?.('abort', onAbort);
  }
}
