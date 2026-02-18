// ─── Personal Info ───
export interface PersonalInfo {
  currentAge: number;
  lifeExpectancy: number;
}

// ─── Income ───
export interface IncomeInfo {
  monthlyNetSalary: number;
  annualSalaryGrowth: number; // percentage
  additionalMonthlyIncome: number;
  pensionMonthlyAmount: number;
  pensionStartAge: number;
}

// ─── Expenses ───
export interface ExpensesInfo {
  monthlyExpenses: number;
  expenseBreakdown: ExpenseBreakdown;
  annualInflationRate: number; // percentage
  postRetirementExpensePercent: number; // percentage of current expenses
}

export interface ExpenseBreakdown {
  housing: number;
  food: number;
  transport: number;
  insurance: number;
  leisure: number;
  other: number;
}

// ─── Assets ───
export interface AssetsInfo {
  investedAssets: number;
  cashSavings: number;
  otherAssets: number;
  debts: Debt[];
  emergencyFundMonths: number;
}

export interface Debt {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  monthlyPayment: number;
  remainingYears: number;
}

// ─── Investment Strategy ───
export type RiskProfile = 'conservative' | 'moderate' | 'aggressive' | 'custom';

export interface InvestmentStrategy {
  riskProfile: RiskProfile;
  expectedAnnualReturn: number; // percentage
  annualFees: number; // percentage (TER)
  capitalGainsTaxRate: number; // percentage
  stockAllocation: number; // percentage (rest is bonds)
}

// ─── FIRE Goals ───
export type FireType = 'lean' | 'regular' | 'fat';

export interface FireGoals {
  safeWithdrawalRate: number; // percentage
  fireType: FireType;
  monthlyInvestment: number; // how much user invests per month
  futureExpenses: FutureExpense[];
  futureIncomes: FutureIncome[];
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
