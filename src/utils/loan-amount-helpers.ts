/**
 * Helpers for parsing and formatting payment/custom amounts in loan flows.
 */

export const MIN_CUSTOM_AMOUNT = 100;

export const FIXED_AMOUNTS = [1000, 5000, 10000, 25000, 50000] as const;

export const PERCENTAGES = [25, 50, 75] as const;

/**
 * Parse amount string allowing decimals (e.g. "14152.5" -> 14152.5). Max 2 decimal places.
 */
export function parseDecimalAmount(text: string): number {
  const trimmed = text.trim();
  if (trimmed === '') return 0;
  let cleaned = '';
  let seenDot = false;
  for (const c of trimmed) {
    if (c >= '0' && c <= '9') cleaned += c;
    else if (c === '.' && !seenDot) {
      seenDot = true;
      cleaned += c;
    }
  }
  if (cleaned === '' || cleaned === '.') return 0;
  const num = Number.parseFloat(cleaned) || 0;
  const capped = Math.min(num, 999_999_999.99);
  return Math.round(capped * 100) / 100;
}

/**
 * Format clamped amount for input display (e.g. 14152.5 -> "14152.5", 14152 -> "14152").
 */
export function formatAmountForInput(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  if (rounded % 1 === 0) return String(rounded);
  return rounded.toFixed(2).replace(/\.?0+$/, '');
}
