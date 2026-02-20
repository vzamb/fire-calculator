import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FireInputs, FireResult, Theme } from '@/types';
import type { Locale } from '@/lib/i18n';
import { DEFAULT_INPUTS } from '@/lib/constants';
import { calculateFire } from '@/lib/calculator';
import { setActiveCurrency, setActiveLocale } from '@/lib/formatters';

interface FireStore {
  // Inputs
  inputs: FireInputs;
  setInputs: (inputs: Partial<FireInputs>) => void;
  updatePersonalInfo: (data: Partial<FireInputs['personalInfo']>) => void;
  updateIncome: (data: Partial<FireInputs['income']>) => void;
  updateExpenses: (data: Partial<FireInputs['expenses']>) => void;
  updateAssets: (data: Partial<FireInputs['assets']>) => void;
  updateInvestmentStrategy: (data: Partial<FireInputs['investmentStrategy']>) => void;
  updateFireGoals: (data: Partial<FireInputs['fireGoals']>) => void;
  resetInputs: () => void;

  // Results (auto-computed)
  result: FireResult;

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

function recalculate(inputs: FireInputs): FireResult {
  return calculateFire(inputs);
}

export const useFireStore = create<FireStore>()(
  persist(
    (set, get) => ({
      inputs: DEFAULT_INPUTS,
      result: recalculate(DEFAULT_INPUTS),

      setInputs: (newInputs) => {
        const inputs = { ...get().inputs, ...newInputs };
        set({ inputs, result: recalculate(inputs) });
      },
      updatePersonalInfo: (data) => {
        const inputs = {
          ...get().inputs,
          personalInfo: { ...get().inputs.personalInfo, ...data },
        };
        set({ inputs, result: recalculate(inputs) });
      },
      updateIncome: (data) => {
        const inputs = {
          ...get().inputs,
          income: { ...get().inputs.income, ...data },
        };
        set({ inputs, result: recalculate(inputs) });
      },
      updateExpenses: (data) => {
        const inputs = {
          ...get().inputs,
          expenses: { ...get().inputs.expenses, ...data },
        };
        set({ inputs, result: recalculate(inputs) });
      },
      updateAssets: (data) => {
        const inputs = {
          ...get().inputs,
          assets: { ...get().inputs.assets, ...data },
        };
        set({ inputs, result: recalculate(inputs) });
      },
      updateInvestmentStrategy: (data) => {
        const inputs = {
          ...get().inputs,
          investmentStrategy: { ...get().inputs.investmentStrategy, ...data },
        };
        set({ inputs, result: recalculate(inputs) });
      },
      updateFireGoals: (data) => {
        const inputs = {
          ...get().inputs,
          fireGoals: { ...get().inputs.fireGoals, ...data },
        };
        set({ inputs, result: recalculate(inputs) });
      },
      resetInputs: () =>
        set({
          inputs: DEFAULT_INPUTS,
          result: recalculate(DEFAULT_INPUTS),
        }),

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
        setActiveCurrency(currency);
        set({ currency });
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
      name: 'fire-calculator-storage',
      partialize: (state) => ({
        inputs: state.inputs,
        theme: state.theme,
        locale: state.locale,
        currency: state.currency,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            // ── Migrate legacy single-pension format to pensions array ──
            const income = state.inputs.income as unknown as Record<string, unknown>;
            if (!Array.isArray(income.pensions)) {
              const monthlyAmount = (income.pensionMonthlyAmount as number) ?? 0;
              const startAge = (income.pensionStartAge as number) ?? 67;
              income.pensions = monthlyAmount > 0
                ? [{ id: 'migrated', name: '', monthlyAmount, startAge }]
                : [];
              delete income.pensionMonthlyAmount;
              delete income.pensionStartAge;
            }

            // Recalculate after rehydration from localStorage
            state.result = recalculate(state.inputs);
            // Sync currency and locale to formatter module
            setActiveCurrency(state.currency);
            setActiveLocale(state.locale);
          }
        };
      },
    }
  )
);
