import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme } from '@/types';
import type { Locale } from '@/lib/i18n';
import { normalizeCurrency, setActiveCurrency, setActiveLocale } from '@/lib/formatters';

interface UIStore {
  // UI State — which input sections are expanded
  expandedSections: Set<string>;
  toggleSection: (section: string) => void;

  // UI State — show real (inflation-adjusted) values
  showRealValues: boolean;
  toggleRealValues: () => void;

  // Currency
  currency: string;
  setCurrency: (currency: string) => void;

  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Language
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      expandedSections: new Set(['income', 'expenses']),
      toggleSection: (section) =>
        set((state) => {
          const next = new Set(state.expandedSections);
          if (next.has(section)) {
            next.delete(section);
          } else {
            next.add(section);
          }
          return { expandedSections: next };
        }),

      showRealValues: false,
      toggleRealValues: () => set((state) => ({ showRealValues: !state.showRealValues })),

      currency: 'EUR',
      setCurrency: (currency) => {
        const normalized = normalizeCurrency(currency);
        setActiveCurrency(normalized);
        set({ currency: normalized });
      },

      locale: 'en',
      setLocale: (locale) => {
        setActiveLocale(locale);
        set({ locale });
      },

      theme: 'dark',
      setTheme: (theme) => {
        set({ theme });
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        if (theme === 'system') {
          const systemDark = window.matchMedia(
            '(prefers-color-scheme: dark)'
          ).matches;
          root.classList.add(systemDark ? 'dark' : 'light');
        } else {
          root.classList.add(theme);
        }
      },
    }),
    {
      name: 'fire-calculator-ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        locale: state.locale,
        currency: state.currency,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            // Sync currency and locale to formatter module
            state.currency = normalizeCurrency(state.currency);
            setActiveCurrency(state.currency);
            setActiveLocale(state.locale);
          }
        };
      },
    }
  )
);
