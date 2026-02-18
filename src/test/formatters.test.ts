import { describe, it, expect, beforeEach } from 'vitest';
import {
  setActiveCurrency,
  getCurrencySymbol,
  formatCurrency,
  formatCurrencyCompact,
  formatPercent,
  formatYears,
  formatDate,
  setActiveLocale,
} from '../lib/formatters';

describe('formatters', () => {
  beforeEach(() => {
    setActiveCurrency('EUR');
    setActiveLocale('en');
  });

  describe('getCurrencySymbol', () => {
    it('returns € for EUR', () => {
      expect(getCurrencySymbol()).toBe('€');
    });

    it('returns $ for USD', () => {
      setActiveCurrency('USD');
      expect(getCurrencySymbol()).toBe('$');
    });

    it('returns £ for GBP', () => {
      setActiveCurrency('GBP');
      expect(getCurrencySymbol()).toBe('£');
    });

    it('returns code + space for unknown currencies', () => {
      setActiveCurrency('JPY');
      expect(getCurrencySymbol()).toBe('JPY ');
    });
  });

  describe('formatCurrency', () => {
    it('formats a positive number with currency symbol', () => {
      const result = formatCurrency(1234);
      expect(result).toContain('1,234');
      expect(result).toContain('€');
    });

    it('formats zero', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
    });

    it('uses locale when set', () => {
      setActiveLocale('it');
      const result = formatCurrency(1234);
      // In Italian locale the result should contain the euro symbol
      expect(result).toContain('€');
      // The exact formatting depends on ICU data availability
    });
  });

  describe('formatCurrencyCompact', () => {
    it('formats millions with M suffix', () => {
      const result = formatCurrencyCompact(2_500_000);
      expect(result).toBe('€2.5M');
    });

    it('formats thousands with k suffix', () => {
      const result = formatCurrencyCompact(150_000);
      expect(result).toBe('€150k');
    });

    it('falls back to formatCurrency for small values', () => {
      const result = formatCurrencyCompact(500);
      expect(result).toContain('€');
      expect(result).toContain('500');
    });
  });

  describe('formatPercent', () => {
    it('formats with one decimal', () => {
      expect(formatPercent(7.5)).toBe('7.5%');
      expect(formatPercent(0)).toBe('0.0%');
      expect(formatPercent(100)).toBe('100.0%');
    });
  });

  describe('formatYears', () => {
    it('formats whole years', () => {
      expect(formatYears(5)).toBe('5 years');
    });

    it('formats months only', () => {
      expect(formatYears(0.5)).toBe('6 months');
    });

    it('formats years and months', () => {
      expect(formatYears(3.25)).toBe('3y 3m');
    });

    it('uses custom labels', () => {
      const labels = { years: 'anni', months: 'mesi', yearsShort: 'a', monthsShort: 'me' };
      expect(formatYears(5, labels)).toBe('5 anni');
      expect(formatYears(0.5, labels)).toBe('6 mesi');
      expect(formatYears(3.25, labels)).toBe('3a 3me');
    });
  });

  describe('formatDate', () => {
    it('formats a date in English by default', () => {
      const date = new Date(2030, 5, 15); // June 2030
      const result = formatDate(date);
      expect(result).toContain('June');
      expect(result).toContain('2030');
    });

    it('formats a date in Italian', () => {
      const date = new Date(2030, 5, 15);
      const result = formatDate(date, 'it');
      expect(result).toContain('giugno');
      expect(result).toContain('2030');
    });
  });
});
