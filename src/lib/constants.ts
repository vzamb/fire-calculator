import type { FireInputs, PersonalInfo, IncomeInfo, ExpensesInfo, AssetsInfo, InvestmentStrategy, FireGoals } from '@/types';

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
  expenseBreakdown: {
    housing: 700,
    food: 350,
    transport: 200,
    insurance: 150,
    leisure: 200,
    other: 200,
  },
  annualInflationRate: 2.5,
  postRetirementExpensePercent: 80,
};

export const DEFAULT_ASSETS: AssetsInfo = {
  investedAssets: 20000,
  cashSavings: 10000,
  otherAssets: 0,
  debts: [],
  emergencyFundMonths: 6,
};

export const DEFAULT_INVESTMENT_STRATEGY: InvestmentStrategy = {
  riskProfile: 'moderate',
  expectedAnnualReturn: 7,
  annualFees: 0.3,
  capitalGainsTaxRate: 26,
  stockAllocation: 80,
};

export const DEFAULT_FIRE_GOALS: FireGoals = {
  safeWithdrawalRate: 4,
  fireType: 'regular',
  monthlyInvestment: 700,
  futureExpenses: [],
  futureIncomes: [],
};

export const DEFAULT_INPUTS: FireInputs = {
  personalInfo: DEFAULT_PERSONAL_INFO,
  income: DEFAULT_INCOME,
  expenses: DEFAULT_EXPENSES,
  assets: DEFAULT_ASSETS,
  investmentStrategy: DEFAULT_INVESTMENT_STRATEGY,
  fireGoals: DEFAULT_FIRE_GOALS,
};

export const RISK_PROFILES: Record<string, { label: string; return: number; stocks: number; description: string }> = {
  conservative: { label: 'Conservative', return: 5, stocks: 40, description: 'Lower risk, stable growth — mostly bonds & cash' },
  moderate: { label: 'Moderate', return: 7, stocks: 70, description: 'Balanced risk/reward — diversified mix' },
  aggressive: { label: 'Aggressive', return: 9, stocks: 90, description: 'Higher risk, higher potential — equity-heavy' },
  custom: { label: 'Custom', return: 7, stocks: 70, description: 'Set your own parameters' },
};

export const FIRE_TYPES: Record<string, { label: string; multiplier: number; description: string; emoji: string }> = {
  lean: { label: 'Lean FIRE', multiplier: 0.7, description: 'Frugal lifestyle — minimal expenses', emoji: '🥬' },
  regular: { label: 'Regular FIRE', multiplier: 1.0, description: 'Maintain current lifestyle', emoji: '🔥' },
  fat: { label: 'Fat FIRE', multiplier: 1.3, description: 'Comfortable upgrade — more spending freedom', emoji: '🏖️' },
};
