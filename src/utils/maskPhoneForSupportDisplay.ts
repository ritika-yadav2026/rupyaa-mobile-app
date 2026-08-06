/**
 * Formats a stored mobile number for display on support screens (no full number in UI).
 * Expects Indian numbers; falls back to a neutral placeholder when missing or invalid.
 */
export function maskPhoneForSupportDisplay(raw?: string | null): string {
  if (raw == null || typeof raw !== 'string') {
    return '+91 —';
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return '+91 —';
  }

  const digits = trimmed.replace(/\D/g, '');
  let national = digits;
  if (digits.length > 10 && digits.startsWith('91')) {
    national = digits.slice(-10);
  }
  if (national.length < 2) {
    return '+91 —';
  }

  // const visible = national.slice(0, 2);
  // return `+91 ${visible}xxxxxxxx`;
  return `+91 ${national}`;
}
