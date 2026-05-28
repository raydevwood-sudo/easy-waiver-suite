/**
 * Crockford Base32 ID generation.
 * Used to produce human-readable, URL-safe unique IDs for waiver documents.
 * See: https://www.crockford.com/base32.html
 */

const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function generateCrockfordBase32(length: number): string {
  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (const byte of array) {
    result += CROCKFORD_ALPHABET[byte % 32];
  }
  return result;
}

export type WaiverIdPrefix = 'PAS' | 'REP' | 'VOL-REC' | 'VOL-DOC';

export function generateWaiverId(prefix: WaiverIdPrefix = 'PAS'): string {
  return `${prefix}-${generateCrockfordBase32(10)}`;
}
