import { describe, it, expect } from 'vitest';
import { encodeInputsToHash, decodeInputsFromHash, generateShareUrl } from '../lib/sharing';
import { DEFAULT_INPUTS } from '../lib/constants';

describe('sharing', () => {
  describe('encodeInputsToHash / decodeInputsFromHash', () => {
    it('round-trips default inputs correctly', () => {
      const encoded = encodeInputsToHash(DEFAULT_INPUTS);
      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);

      const decoded = decodeInputsFromHash(encoded);
      expect(decoded).toEqual(DEFAULT_INPUTS);
    });

    it('handles custom inputs with debts and future events', () => {
      const inputs = {
        ...DEFAULT_INPUTS,
        assets: {
          ...DEFAULT_INPUTS.assets,
          debts: [
            { id: 'd1', name: 'Mortgage', balance: 200000, interestRate: 3, monthlyPayment: 800, remainingYears: 25 },
          ],
        },
        fireGoals: {
          ...DEFAULT_INPUTS.fireGoals,
          futureExpenses: [{ id: 'e1', name: 'House down payment', amount: 50000, yearsFromNow: 3 }],
          futureIncomes: [{ id: 'i1', name: 'Inheritance', amount: 100000, yearsFromNow: 10, includeInFire: true }],
        },
      };
      const encoded = encodeInputsToHash(inputs);
      const decoded = decodeInputsFromHash(encoded);
      expect(decoded).toEqual(inputs);
    });
  });

  describe('decodeInputsFromHash edge cases', () => {
    it('returns null for invalid base64', () => {
      expect(decodeInputsFromHash('not-valid-base64!!!')).toBeNull();
    });

    it('returns null for valid base64 but invalid JSON', () => {
      const encoded = btoa('not json');
      expect(decodeInputsFromHash(encoded)).toBeNull();
    });

    it('returns null for valid JSON missing required sections', () => {
      const encoded = btoa(JSON.stringify({ foo: 'bar' }));
      expect(decodeInputsFromHash(encoded)).toBeNull();
    });
  });

  describe('generateShareUrl', () => {
    it('generates a URL with share hash', () => {
      // In test environment, window.location may not be set normally
      // but generateShareUrl uses window.location.origin + pathname
      const url = generateShareUrl(DEFAULT_INPUTS);
      expect(url).toContain('#share=');
    });
  });
});
