import type { FireInputs } from '@/types';

/**
 * Encode FireInputs into a compact base64 URL hash.
 */
export function encodeInputsToHash(inputs: FireInputs): string {
  const json = JSON.stringify(inputs);
  const encoded = btoa(unescape(encodeURIComponent(json)));
  return encoded;
}

/**
 * Decode FireInputs from a base64 URL hash.
 * Returns null if invalid.
 */
export function decodeInputsFromHash(hash: string): FireInputs | null {
  try {
    const json = decodeURIComponent(escape(atob(hash)));
    const parsed = JSON.parse(json);
    // Basic validation: check that key sections exist
    if (
      parsed &&
      parsed.personalInfo &&
      parsed.income &&
      parsed.expenses &&
      parsed.assets &&
      parsed.investmentStrategy &&
      parsed.fireGoals
    ) {
      return parsed as FireInputs;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Generate a shareable URL with inputs encoded in hash.
 */
export function generateShareUrl(inputs: FireInputs): string {
  const hash = encodeInputsToHash(inputs);
  return `${window.location.origin}${window.location.pathname}#share=${hash}`;
}

/**
 * Check if current URL has shared inputs and extract them.
 */
export function extractSharedInputs(): FireInputs | null {
  const hash = window.location.hash;
  if (!hash.startsWith('#share=')) return null;
  const encoded = hash.slice(7); // remove '#share='
  return decodeInputsFromHash(encoded);
}
