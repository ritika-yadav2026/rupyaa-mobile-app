/**
 * Converts a SHA-256 certificate fingerprint (hex, with or without colons)
 * to the Base64 form required by freeRASP `certificateHashes`.
 *
 * @see https://docs.talsec.app/freerasp/freerasp/wiki/getting-signing-certificate-hash
 */
export function sha256FingerprintToBase64(fingerprint: string): string {
  const hex = fingerprint.replace(/:/g, '').trim().toLowerCase();

  if (!/^[0-9a-f]{64}$/.test(hex)) {
    throw new Error(
      'Expected a 64-character SHA-256 hex fingerprint (with optional colon separators).',
    );
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }

  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}
