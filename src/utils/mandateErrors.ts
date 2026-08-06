/**
 * Strips server stack traces and noisy suffixes from API error strings.
 * Backend may return: "User message. | \nStack: Error: ... at ..."
 */
export function sanitizeBackendErrorStringForDisplay(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  const t = raw.trim();
  const stackSplit = t.split(/\s*\|\s*[\r\n]*\s*Stack\s*:/i);
  if (stackSplit.length > 1) {
    return stackSplit[0]?.trim() ?? t;
  }
  // Fallback: first segment before a lone pipe that often prefixes stack dumps
  const pipeSplit = t.split('|');
  return pipeSplit[0]?.trim() ?? t;
}

/**
 * Builds a single user-facing line from mandate create failure payloads, including
 * `{ success: false, error: string, retryAfterSeconds?: number }`.
 */
export function buildCreateMandateFailureMessage(payload: Record<string, unknown>): string {
  const errField = payload.error;
  if (typeof errField === 'string' && errField.trim()) {
    return sanitizeBackendErrorStringForDisplay(errField);
  }
  if (typeof payload.message === 'string' && payload.message.trim()) {
    return sanitizeBackendErrorStringForDisplay(payload.message);
  }
  return 'Something went wrong. Please try again.';
}
