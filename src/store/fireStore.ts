import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FireInputs, FireResult } from '@/types';
import { DEFAULT_INPUTS, DEFAULT_ASSET_RETURNS, computePortfolioStats } from '@/lib/constants';
import { calculateFire } from '@/lib/calculator';

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
        const current = get().inputs;
        const inputs = {
          ...current,
          ...newInputs,
          personalInfo: { ...current.personalInfo, ...newInputs.personalInfo },
          income: { ...current.income, ...newInputs.income },
          expenses: { ...current.expenses, ...newInputs.expenses },
          assets: { ...current.assets, ...newInputs.assets },
          investmentStrategy: { ...current.investmentStrategy, ...newInputs.investmentStrategy },
          fireGoals: { ...current.fireGoals, ...newInputs.fireGoals },
        };
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
    }),
    {
      name: 'fire-calculator-storage',
      partialize: (state) => ({
        inputs: state.inputs,
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

            if (typeof state.inputs.investmentStrategy.annualVolatility !== 'number') {
              state.inputs.investmentStrategy.annualVolatility = DEFAULT_INPUTS.investmentStrategy.annualVolatility;
            }

            // Migrate legacy stockAllocation to portfolioAllocation
            const strategy = state.inputs.investmentStrategy as unknown as Record<string, unknown>;

            // Migrate old 5-class allocation → new 3-class (equity, bonds, cash)
            const oldAlloc = strategy.portfolioAllocation as Record<string, number> | undefined;
            if (oldAlloc && ('globalEquity' in oldAlloc || 'euBonds' in oldAlloc || 'govBonds' in oldAlloc || 'reits' in oldAlloc)) {
              const equity = (oldAlloc.globalEquity ?? 0) + (oldAlloc.reits ?? 0);
              const bonds = (oldAlloc.euBonds ?? 0) + (oldAlloc.govBonds ?? 0);
              const cash = oldAlloc.cash ?? 0;
              const total = equity + bonds + cash;
              const alloc = {
                equity: total > 0 ? Math.round(equity / total * 100) : 60,
                bonds: total > 0 ? Math.round(bonds / total * 100) : 30,
                cash: 0,
              };
              alloc.cash = 100 - alloc.equity - alloc.bonds;
              state.inputs.investmentStrategy.portfolioAllocation = alloc;
            } else if (!oldAlloc || typeof oldAlloc !== 'object') {
              const stocks = (strategy.stockAllocation as number) ?? 70;
              const bonds = Math.max(0, 100 - stocks);
              const alloc = {
                equity: Math.round(stocks),
                bonds: Math.round(bonds * 0.8),
                cash: Math.max(0, 100 - Math.round(stocks) - Math.round(bonds * 0.8)),
              };
              state.inputs.investmentStrategy.portfolioAllocation = alloc;
            }
            delete (strategy as Record<string, unknown>).stockAllocation;

            // Ensure assetReturns exists
            if (!strategy.assetReturns || typeof strategy.assetReturns !== 'object') {
              state.inputs.investmentStrategy.assetReturns = { ...DEFAULT_ASSET_RETURNS };
            }

            // Recompute stats from the (migrated) allocation
            const finalAlloc = state.inputs.investmentStrategy.portfolioAllocation;
            const finalReturns = state.inputs.investmentStrategy.assetReturns;
            const stats = computePortfolioStats(finalAlloc, finalReturns);
            state.inputs.investmentStrategy.expectedAnnualReturn = stats.arithmeticReturn;
            state.inputs.investmentStrategy.annualVolatility = stats.volatility;

            if (!Array.isArray(state.inputs.fireGoals.recurringIncomes)) {
              state.inputs.fireGoals.recurringIncomes = DEFAULT_INPUTS.fireGoals.recurringIncomes;
            }

            // Migrate legacy singular fields to dynamic customAssets
            if (!Array.isArray(state.inputs.assets.customAssets)) {
              state.inputs.assets.customAssets = [];
            }
            const oldAssets = state.inputs.assets as unknown as Record<string, unknown>;

            // Migrate legacy otherAssets bucket into investedAssets (field removed)
            const legacyOtherAssets = (oldAssets.otherAssets as number) ?? 0;
            if (legacyOtherAssets > 0) {
              state.inputs.assets.investedAssets = (state.inputs.assets.investedAssets ?? 0) + legacyOtherAssets;
            }
            delete oldAssets.otherAssets;

            const pushAsset = (type: string, name: string, balance: number, contrib: number, ret: number, match?: number) => {
              if (balance > 0 || contrib > 0 || (match && match > 0)) {
                state.inputs.assets.customAssets.push({
                  id: crypto.randomUUID(),
                  type: type as any,
                  name,
                  balance,
                  monthlyContribution: contrib,
                  expectedAnnualReturn: ret,
                  employerMatch: match
                });
              }
            };

            pushAsset('tradIra', '401(k) / Trad IRA', (oldAssets.tradIraAmount as number) ?? 0, (oldAssets.tradIraMonthlyContribution as number) ?? 0, 7.0, (oldAssets.employerMatch as number) ?? 0);
            pushAsset('rothIra', 'Roth IRA', (oldAssets.rothIraAmount as number) ?? 0, (oldAssets.rothIraMonthlyContribution as number) ?? 0, 7.0);
            pushAsset('brokerage', 'Brokerage', (oldAssets.brokerageAmount as number) ?? 0, (oldAssets.brokerageMonthlyContribution as number) ?? 0, 7.0);
            pushAsset('hysa', 'High-Yield Savings', (oldAssets.hysaAmount as number) ?? 0, 0, (oldAssets.hysaInterestRate as number) ?? 4.0);

            delete oldAssets.tradIraAmount;
            delete oldAssets.tradIraMonthlyContribution;
            delete oldAssets.employerMatch;
            delete oldAssets.rothIraAmount;
            delete oldAssets.rothIraMonthlyContribution;
            delete oldAssets.brokerageAmount;
            delete oldAssets.brokerageMonthlyContribution;
            delete oldAssets.hysaAmount;
            delete oldAssets.hysaInterestRate;

            // Ensure realEstateAssets array exists
            if (!Array.isArray(state.inputs.assets.realEstateAssets)) {
              state.inputs.assets.realEstateAssets = [];
            }

            // Recalculate after rehydration from localStorage
            state.result = recalculate(state.inputs);
          }
        };
      },
    }
  )
);
