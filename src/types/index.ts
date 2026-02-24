// ─── Personal Info ───
export interface PersonalInfo {
  currentAge: number;
  lifeExpectancy: number;
}

// ─── Income ───
export interface Pension {
  id: string;
  name: string;
  monthlyAmount: number;
  startAge: number;
}

export interface IncomeInfo {
  monthlyNetSalary: number;
  annualSalaryGrowth: number; // percentage
  additionalMonthlyIncome: number;
  pensions: Pension[];
}

// ─── Expenses ───
export interface ExpensesInfo {
  monthlyExpenses: number;
  annualInflationRate: number; // percentage
  postRetirementExpensePercent: number; // percentage of current expenses
}

// ─── Assets ───
export type AssetType = 'tradIra' | 'rothIra' | 'brokerage' | 'hysa' | 'other';

export interface CustomAsset {
  id: string;
  type: AssetType;
  name: string;
  balance: number;
  monthlyContribution: number;
  expectedAnnualReturn: number;
  employerMatch?: number; // mostly relevant for 401(k)/TradIRA
}

export interface AssetsInfo {
  investedAssets: number;
  cashSavings: number;
  customAssets: CustomAsset[];
  // Debts and Real Estate
  debts: Debt[];
  emergencyFundMonths: number;
  realEstateAssets: RealEstateAsset[];
}

export interface Debt {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  monthlyPayment: number;
  remainingYears: number;
}

export interface RealEstateAsset {
  id: string;
  name: string;
  propertyValue: number;       // total value of property (display only, not compounding)
  monthlyNetIncome: number;    // net rental income after costs/taxes
  annualAppreciation: number;  // % yearly property value growth (not portfolio return)
  rentalGrowthRate?: number;   // % yearly rental income growth (defaults to inflation if undefined)
}

// ─── Investment Strategy ───
export type RiskProfile = 'conservative' | 'moderate' | 'aggressive' | 'custom';

export type AssetClassKey = 'equity' | 'bonds' | 'cash';

/** Percentage allocation per asset class (must sum to 100) */
export type PortfolioAllocation = Record<AssetClassKey, number>;

/** User-configurable expected return per asset class */
export type AssetReturns = Record<AssetClassKey, number>;

export interface InvestmentStrategy {
  riskProfile: RiskProfile;
  expectedAnnualReturn: number; // percentage — auto-computed from allocation
  annualVolatility: number; // percentage — auto-computed from allocation
  annualFees: number; // percentage (TER)
  capitalGainsTaxRate: number; // percentage
  portfolioAllocation: PortfolioAllocation;
  assetReturns: AssetReturns; // user-configurable returns per asset class
  customPortfolioAllocation: PortfolioAllocation;
  customAssetReturns: AssetReturns;
  customExpectedAnnualReturn: number;
  customAnnualVolatility: number;
}

// ─── FIRE Goals ───
export type FireType = 'lean' | 'regular' | 'fat';

export interface FireGoals {
  safeWithdrawalRate: number; // percentage
  fireType: FireType;
  monthlyInvestment: number; // how much user invests per month
  futureExpenses: FutureExpense[];
  futureIncomes: FutureIncome[];
  recurringIncomes: RecurringIncome[];
}

export interface RecurringIncome {
  id: string;
  name: string;
  monthlyAmount: number;
  startAge: number;
  annualGrowthRate: number; // percentage
  includeInFire: boolean;
}

export interface FutureExpense {
  id: string;
  name: string;
  amount: number;
  yearsFromNow: number;
}

export interface FutureIncome {
  id: string;
  name: string;
  amount: number;
  yearsFromNow: number;
  includeInFire: boolean;
}

// ─── All User Inputs Combined ───
export interface FireInputs {
  personalInfo: PersonalInfo;
  income: IncomeInfo;
  expenses: ExpensesInfo;
  assets: AssetsInfo;
  investmentStrategy: InvestmentStrategy;
  fireGoals: FireGoals;
}

// ─── Calculation Results ───
export interface YearlyProjection {
  year: number;
  age: number;
  portfolioValue: number;
  portfolioOptimistic: number;
  portfolioPessimistic: number;
  annualContributions: number;
  annualInvestmentGrowth: number;
  annualExpenses: number; // living expenses (no debt payments)
  annualDebtPayments: number; // debt payments for this year
  passiveIncome: number; // from investments (withdrawal rate applied)
  totalIncome: number;
  cumulativeContributions: number;
  cumulativeGrowth: number;
  savingsRate: number;
  isRetired: boolean;
}

export interface FireResult {
  fireNumber: number; // inflation-adjusted FIRE number at projected FIRE age
  fireNumberToday: number; // adjusted FIRE number in today's euros (after pension/debt adjustments)
  fireNumberBaseToday: number; // raw FIRE number in today's euros (expenses ÷ SWR)
  fireAge: number;
  fireDate: Date;
  yearsToFire: number;
  currentSavingsRate: number;
  monthlySavings: number;
  coastFireAge: number;
  baristaFireIncome: number; // minimum monthly part-time income needed
  yearlyProjections: YearlyProjection[];
  totalContributions: number;
  totalGrowth: number;
  // Post-retirement
  portfolioAtRetirement: number;
  portfolioAt90: number;
  retirementYears: number;
  successRate: number; // % chance portfolio lasts through retirement
  bridgeGap: number;          // how much portfolio is short of standard target (nominal, 0 = no bridge)
  bridgeIncomeTotal: number;   // total bridge income expected (nominal)
  pensionCreditToday: number; // pension reduces FIRE number by this much (today's euros)
  debtCostToday: number; // remaining debts at FIRE add this much (today's euros)
}

// ─── Theme ───
export type Theme = 'light' | 'dark' | 'system';
