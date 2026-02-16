import { createContext, useContext } from 'react';
import { en } from './en';
import { it } from './it';
import type { Locale, Translations } from './types';

export type { Locale, Translations };

const translations: Record<Locale, Translations> = { en, it };

export function getTranslations(locale: Locale): Translations {
  return translations[locale];
}

export const I18nContext = createContext<Translations>(en);

export function useT(): Translations {
  return useContext(I18nContext);
}
