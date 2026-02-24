import type { FireInputs, PersonalInfo, IncomeInfo, ExpensesInfo, AssetsInfo, InvestmentStrategy, FireGoals, AssetClassKey, PortfolioAllocation, AssetReturns } from '@/types';

export const DEFAULT_PERSONAL_INFO: PersonalInfo = {
  currentAge: 30,
  lifeExpectancy: 90,
};

export const DEFAULT_INCOME: IncomeInfo = {
  monthlyNetSalary: 2500,
  annualSalaryGrowth: 2,
  additionalMonthlyIncome: 0,
  pensions: [
    { id: 'default', name: 'State Pension', monthlyAmount: 800, startAge: 67 },
  ],
};

export const DEFAULT_EXPENSES: ExpensesInfo = {
  monthlyExpenses: 1800,
  annualInflationRate: 2.5,
  postRetirementExpensePercent: 100,
};

export const DEFAULT_ASSETS: AssetsInfo = {
  investedAssets: 20000,
  cashSavings: 10000,
  customAssets: [],
  debts: [],
  emergencyFundMonths: 6,
  realEstateAssets: [],
};

// ─── Asset Class Data ───
// Historical annualised return & volatility (nominal, pre-fee, long-run estimates)
export interface AssetClassInfo {
  labelKey: AssetClassKey;
  defaultReturn: number;  // default arithmetic mean annual return (%)
  volatility: number;     // annual standard deviation (%)
  emoji: string;
}

export const ASSET_CLASSES: Record<AssetClassKey, AssetClassInfo> = {
  equity: { labelKey: 'equity', defaultReturn: 8.0, volatility: 16.0, emoji: '📈' },
  bonds: { labelKey: 'bonds', defaultReturn: 2.5, volatility: 4.5, emoji: '🏦' },
  cash: { labelKey: 'cash', defaultReturn: 1.5, volatility: 1.0, emoji: '💵' },
};

export const DEFAULT_ASSET_RETURNS: AssetReturns = {
  equity: 8.0,
  bonds: 2.5,
  cash: 1.5,
};

// Simplified correlation matrix (symmetric, col/row order: equity, bonds, cash)
const ASSET_KEYS: AssetClassKey[] = ['equity', 'bonds', 'cash'];
const CORR_MATRIX: number[][] = [
  // eq    bonds  cash
  [1.00, 0.10, 0.00], // equity
  [0.10, 1.00, 0.30], // bonds
  [0.00, 0.30, 1.00], // cash
];

/**
 * Compute portfolio arithmetic mean return and volatility from allocation.
 * Accepts optional custom returns per asset class (overrides defaults).
 * Uses the full variance-covariance approach:
 *   σ_p² = Σ_i Σ_j w_i w_j σ_i σ_j ρ_ij
 */
export function computePortfolioStats(
  alloc: PortfolioAllocation,
  customReturns?: AssetReturns,
): { arithmeticReturn: number; volatility: number } {
  let weightedReturn = 0;
  let variance = 0;

  const weights = ASSET_KEYS.map(k => (alloc[k] ?? 0) / 100);
  const vols = ASSET_KEYS.map(k => ASSET_CLASSES[k].volatility / 100);
  const rets = ASSET_KEYS.map(k => customReturns?.[k] ?? ASSET_CLASSES[k].defaultReturn);

  for (let i = 0; i < ASSET_KEYS.length; i++) {
    weightedReturn += weights[i]! * rets[i]!;
    for (let j = 0; j < ASSET_KEYS.length; j++) {
      variance += weights[i]! * weights[j]! * vols[i]! * vols[j]! * (CORR_MATRIX[i]?.[j] ?? 0);
    }
  }

  return {
    arithmeticReturn: Math.round(weightedReturn * 10) / 10,    // e.g. 6.8
    volatility: Math.round(Math.sqrt(variance) * 1000) / 10,   // e.g. 11.2
  };
}

/** Apply volatility drag: geometric return ≈ arithmetic - σ²/2 */
export function geometricReturn(arithmeticReturn: number, volatility: number): number {
  const r = arithmeticReturn / 100;
  const v = volatility / 100;
  return Math.max(0, (r - (v * v) / 2)) * 100;
}

const DEFAULT_ALLOCATION: PortfolioAllocation = {
  equity: 60,
  bonds: 30,
  cash: 10,
};

const defaultStats = computePortfolioStats(DEFAULT_ALLOCATION, DEFAULT_ASSET_RETURNS);

export const DEFAULT_INVESTMENT_STRATEGY: InvestmentStrategy = {
  riskProfile: 'moderate',
  expectedAnnualReturn: defaultStats.arithmeticReturn,
  annualVolatility: defaultStats.volatility,
  annualFees: 0.3,
  capitalGainsTaxRate: 26,
  portfolioAllocation: DEFAULT_ALLOCATION,
  assetReturns: { ...DEFAULT_ASSET_RETURNS },
};

export const DEFAULT_FIRE_GOALS: FireGoals = {
  safeWithdrawalRate: 4,
  fireType: 'regular',
  monthlyInvestment: 700,
  futureExpenses: [],
  futureIncomes: [],
  recurringIncomes: [],
};

export const COAST_TARGET_AGE = 65;

export const DEFAULT_INPUTS: FireInputs = {
  personalInfo: DEFAULT_PERSONAL_INFO,
  income: DEFAULT_INCOME,
  expenses: DEFAULT_EXPENSES,
  assets: DEFAULT_ASSETS,
  investmentStrategy: DEFAULT_INVESTMENT_STRATEGY,
  fireGoals: DEFAULT_FIRE_GOALS,
};

export const RISK_PROFILES: Record<string, { label: string; emoji: string; allocation: PortfolioAllocation; returns: AssetReturns; description: string }> = {
  conservative: {
    label: 'Conservative',
    emoji: '🛡️',
    allocation: { equity: 25, bonds: 55, cash: 20 },
    returns: { ...DEFAULT_ASSET_RETURNS },
    description: 'Capital preservation — low risk, steady growth',
  },
  moderate: {
    label: 'Moderate',
    emoji: '⚖️',
    allocation: { equity: 60, bonds: 30, cash: 10 },
    returns: { ...DEFAULT_ASSET_RETURNS },
    description: 'Balanced growth — diversified risk/reward',
  },
  aggressive: {
    label: 'Aggressive',
    emoji: '🚀',
    allocation: { equity: 85, bonds: 10, cash: 5 },
    returns: { ...DEFAULT_ASSET_RETURNS },
    description: 'Maximum growth — high volatility, high potential',
  },
  custom: {
    label: 'Custom',
    emoji: '⚙️',
    allocation: { equity: 60, bonds: 30, cash: 10 },
    returns: { ...DEFAULT_ASSET_RETURNS },
    description: 'Your own allocation & returns',
  },
};

export const FIRE_TYPES: Record<string, { label: string; multiplier: number; description: string; emoji: string }> = {
  lean: { label: 'Lean FIRE', multiplier: 0.7, description: 'Frugal lifestyle — minimal expenses', emoji: '🥬' },
  regular: { label: 'Regular FIRE', multiplier: 1.0, description: 'Maintain current lifestyle', emoji: '🔥' },
  fat: { label: 'Fat FIRE', multiplier: 1.3, description: 'Comfortable upgrade — more spending freedom', emoji: '🏖️' },
};
