import type { FireInputs } from '@/types';

export interface SharePayload {
  inputs: FireInputs;
  currency?: string;
}

/**
 * Encode FireInputs + optional UI settings into a compact base64 URL hash.
 */
export function encodeInputsToHash(inputs: FireInputs, currency?: string): string {
  const payload: SharePayload = { inputs };
  if (currency) payload.currency = currency;
  const json = JSON.stringify(payload);
  const encoded = btoa(unescape(encodeURIComponent(json)));
  return encoded;
}

/**
 * Decode FireInputs from a base64 URL hash.
 * Returns null if invalid.
 */
export function decodeInputsFromHash(hash: string): SharePayload | null {
  try {
    const json = decodeURIComponent(escape(atob(hash)));
    const parsed = JSON.parse(json);
    // New format: { inputs, currency? }
    if (parsed && parsed.inputs && parsed.inputs.personalInfo) {
      return parsed as SharePayload;
    }
    // Legacy format: direct FireInputs object
    if (
      parsed &&
      parsed.personalInfo &&
      parsed.income &&
      parsed.expenses &&
      parsed.assets &&
      parsed.investmentStrategy &&
      parsed.fireGoals
    ) {
      return { inputs: parsed as FireInputs };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Generate a shareable URL with inputs encoded in hash.
 */
export function generateShareUrl(inputs: FireInputs, currency?: string): string {
  const hash = encodeInputsToHash(inputs, currency);
  return `${window.location.origin}${window.location.pathname}#share=${hash}`;
}

/**
 * Check if current URL has shared inputs and extract them.
 */
export function extractSharedInputs(): SharePayload | null {
  const hash = window.location.hash;
  if (!hash.startsWith('#share=')) return null;
  const encoded = hash.slice(7); // remove '#share='
  return decodeInputsFromHash(encoded);
}
