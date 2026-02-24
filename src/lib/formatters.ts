export const SUPPORTED_CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CHF', symbol: 'CHF ', name: 'Swiss Franc' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
] as const;

const CURRENCY_SYMBOLS: Record<string, string> = Object.fromEntries(
  SUPPORTED_CURRENCIES.map((currency) => [currency.code, currency.symbol])
);

const SUPPORTED_CURRENCY_CODES = new Set<string>(SUPPORTED_CURRENCIES.map((currency) => currency.code));

export function normalizeCurrency(currency: string): string {
  const normalized = (currency ?? '').toUpperCase();
  return SUPPORTED_CURRENCY_CODES.has(normalized) ? normalized : 'EUR';
}

let _activeCurrency = 'EUR';

export function setActiveCurrency(currency: string) {
  _activeCurrency = (currency ?? '').toUpperCase() || 'EUR';
}

export function getCurrencySymbol(): string {
  return CURRENCY_SYMBOLS[_activeCurrency] ?? _activeCurrency + ' ';
}

let _activeLocale = 'en';

export function setActiveLocale(locale: string) {
  _activeLocale = locale;
}

export const formatCurrency = (value: number): string => {
  const localeMap: Record<string, string> = { en: 'en-GB', it: 'it-IT' };
  return new Intl.NumberFormat(localeMap[_activeLocale] ?? 'en-GB', {
    style: 'currency',
    currency: _activeCurrency,
    currencyDisplay: 'narrowSymbol',
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


