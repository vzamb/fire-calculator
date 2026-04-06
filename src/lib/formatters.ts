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
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'ILS', symbol: '₪', name: 'Israeli Shekel' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
] as const;

const CURRENCY_SYMBOLS: Record<string, string> = Object.fromEntries(
  SUPPORTED_CURRENCIES.map((currency) => [currency.code, currency.symbol])
);

const SUPPORTED_CURRENCY_CODES = new Set<string>(SUPPORTED_CURRENCIES.map((currency) => currency.code));

export function normalizeCurrency(currency: string): string {
  const normalized = (currency ?? '').toUpperCase().trim();
  if (!normalized || normalized.length < 2) return 'EUR';
  // Accept any recognized currency or any 3-letter code (custom currencies)
  if (SUPPORTED_CURRENCY_CODES.has(normalized)) return normalized;
  if (/^[A-Z]{3}$/.test(normalized)) return normalized;
  return 'EUR';
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
  try {
    return new Intl.NumberFormat(localeMap[_activeLocale] ?? 'en-GB', {
      style: 'currency',
      currency: _activeCurrency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    // Fallback for unknown currency codes
    return `${_activeCurrency} ${new Intl.NumberFormat(localeMap[_activeLocale] ?? 'en-GB', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)}`;
  }
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


