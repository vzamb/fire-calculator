const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  CHF: 'CHF ',
};

let _activeCurrency = 'EUR';

export function setActiveCurrency(currency: string) {
  _activeCurrency = currency;
}

export function getActiveCurrency(): string {
  return _activeCurrency;
}

export function getCurrencySymbol(): string {
  return CURRENCY_SYMBOLS[_activeCurrency] ?? _activeCurrency + ' ';
}

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: _activeCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatCurrencyCompact = (value: number): string => {
  const sym = CURRENCY_SYMBOLS[_activeCurrency] ?? _activeCurrency + ' ';
  if (value >= 1_000_000) {
    return `${sym}${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${sym}${(value / 1_000).toFixed(0)}k`;
  }
  return formatCurrency(value);
};

export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const formatYears = (years: number, labels?: { years: string; months: string; yearsShort: string; monthsShort: string }): string => {
  const y = Math.floor(years);
  const m = Math.round((years - y) * 12);
  const ys = labels?.yearsShort ?? 'y';
  const ms = labels?.monthsShort ?? 'm';
  if (m === 0) return `${y} ${labels?.years ?? 'years'}`;
  if (y === 0) return `${m} ${labels?.months ?? 'months'}`;
  return `${y}${ys} ${m}${ms}`;
};

export const formatDate = (date: Date, locale?: string): string => {
  return new Intl.DateTimeFormat(locale === 'it' ? 'it-IT' : 'en-GB', {
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export const parseNumber = (value: string): number => {
  const cleaned = value.replace(/[^0-9.,\-]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};
