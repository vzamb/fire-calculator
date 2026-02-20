import { describe, it, expect } from 'vitest';
import { calculateFire } from '../lib/calculator';
import { DEFAULT_INPUTS } from '../lib/constants';
import type { FireInputs } from '../types';

/** Helper to create inputs with overrides */
function makeInputs(overrides: Partial<{
  age: number;
  lifeExpectancy: number;
  salary: number;
  expenses: number;
  investedAssets: number;
  cashSavings: number;
  otherAssets: number;
  monthlyInvestment: number;
  expectedReturn: number;
  annualFees: number;
  capitalGainsTax: number;
  inflation: number;
  swr: number;
  pensionMonthly: number;
  pensionStartAge: number;
  postRetirementPercent: number;
}>): FireInputs {
  const pensionMonthly = overrides.pensionMonthly ?? 0;
  const pensionStartAge = overrides.pensionStartAge ?? 67;
  return {
    personalInfo: {
      currentAge: overrides.age ?? 30,
      lifeExpectancy: overrides.lifeExpectancy ?? 90,
    },
    income: {
      monthlyNetSalary: overrides.salary ?? 3000,
      annualSalaryGrowth: 0,
      additionalMonthlyIncome: 0,
      pensions: pensionMonthly > 0
        ? [{ id: 'test', name: 'Test Pension', monthlyAmount: pensionMonthly, startAge: pensionStartAge }]
        : [],
    },
    expenses: {
      monthlyExpenses: overrides.expenses ?? 2000,
      expenseBreakdown: { housing: 700, food: 300, transport: 200, insurance: 100, leisure: 200, other: 500 },
      annualInflationRate: overrides.inflation ?? 2,
      postRetirementExpensePercent: overrides.postRetirementPercent ?? 100,
    },
    assets: {
      investedAssets: overrides.investedAssets ?? 50000,
      cashSavings: overrides.cashSavings ?? 10000,
      otherAssets: overrides.otherAssets ?? 0,
      debts: [],
      emergencyFundMonths: 6,
      realEstateAssets: [],
    },
    investmentStrategy: {
      riskProfile: 'moderate',
      expectedAnnualReturn: overrides.expectedReturn ?? 7,
      annualVolatility: 12,
      annualFees: overrides.annualFees ?? 0,
      capitalGainsTaxRate: overrides.capitalGainsTax ?? 0,
      portfolioAllocation: { equity: 60, bonds: 30, cash: 10 },
      assetReturns: { equity: 8, bonds: 2.5, cash: 1.5 },
    },
    fireGoals: {
      safeWithdrawalRate: overrides.swr ?? 4,
      fireType: 'regular',
      monthlyInvestment: overrides.monthlyInvestment ?? 1000,
      futureExpenses: [],
      futureIncomes: [],
      recurringIncomes: [],
    },
  };
}

describe('calculateFire', () => {
  it('returns a valid FireResult with default inputs', () => {
    const result = calculateFire(DEFAULT_INPUTS);
    expect(result).toBeDefined();
    expect(result.fireAge).toBeGreaterThan(0);
    expect(result.fireNumber).toBeGreaterThan(0);
    expect(result.yearsToFire).toBeGreaterThanOrEqual(0);
    expect(result.yearlyProjections.length).toBeGreaterThan(0);
    expect(result.successRate).toBeGreaterThanOrEqual(0);
    expect(result.successRate).toBeLessThanOrEqual(100);
  });

  it('FIRE number scales with expenses', () => {
    const low = calculateFire(makeInputs({ expenses: 1500 }));
    const high = calculateFire(makeInputs({ expenses: 3000 }));
    expect(high.fireNumberBaseToday).toBeGreaterThan(low.fireNumberBaseToday);
    // fireNumberBaseToday = annualExpenses * postRetirementFactor / SWR
    expect(low.fireNumberBaseToday).toBeCloseTo((1500 * 12) / 0.04, -2);
    expect(high.fireNumberBaseToday).toBeCloseTo((3000 * 12) / 0.04, -2);
  });

  it('higher investments lead to earlier FIRE', () => {
    const low = calculateFire(makeInputs({ monthlyInvestment: 500 }));
    const high = calculateFire(makeInputs({ monthlyInvestment: 2000 }));
    expect(high.fireAge).toBeLessThan(low.fireAge);
    expect(high.yearsToFire).toBeLessThan(low.yearsToFire);
  });

  it('projections span from current age to life expectancy', () => {
    const inputs = makeInputs({ age: 25, lifeExpectancy: 85 });
    const result = calculateFire(inputs);
    expect(result.yearlyProjections.length).toBe(85 - 25 + 1);
    expect(result.yearlyProjections[0]!.age).toBe(25);
    expect(result.yearlyProjections[result.yearlyProjections.length - 1]!.age).toBe(85);
  });

  it('includes otherAssets in starting portfolio', () => {
    const without = calculateFire(makeInputs({ otherAssets: 0 }));
    const withOther = calculateFire(makeInputs({ otherAssets: 100000 }));
    expect(withOther.fireAge).toBeLessThanOrEqual(without.fireAge);
  });

  it('applies annual fees to reduce net return', () => {
    const noFees = calculateFire(makeInputs({ annualFees: 0 }));
    const withFees = calculateFire(makeInputs({ annualFees: 1.5 }));
    // Fees reduce growth, so FIRE takes longer
    expect(withFees.fireAge).toBeGreaterThanOrEqual(noFees.fireAge);
  });

  it('post-retirement expense factor affects FIRE number', () => {
    const full = calculateFire(makeInputs({ postRetirementPercent: 100 }));
    const reduced = calculateFire(makeInputs({ postRetirementPercent: 70 }));
    expect(reduced.fireNumberBaseToday).toBeLessThan(full.fireNumberBaseToday);
  });

  it('pension reduces FIRE requirements', () => {
    const noPension = calculateFire(makeInputs({ pensionMonthly: 0 }));
    const withPension = calculateFire(makeInputs({ pensionMonthly: 1200 }));
    expect(withPension.fireNumberToday).toBeLessThan(noPension.fireNumberToday);
  });

  it('savings rate is computed correctly', () => {
    const result = calculateFire(makeInputs({ salary: 4000, monthlyInvestment: 1000 }));
    // Savings rate = monthlyInvestment / totalMonthlyIncome * 100
    expect(result.currentSavingsRate).toBeCloseTo(25, 1);
  });

  it('never returns negative portfolio values', () => {
    const result = calculateFire(DEFAULT_INPUTS);
    for (const p of result.yearlyProjections) {
      expect(p.portfolioValue).toBeGreaterThanOrEqual(0);
    }
  });

  it('debts accelerate debt payments in projections', () => {
    const inputs = makeInputs({});
    inputs.assets.debts = [
      { id: '1', name: 'Mortgage', balance: 100000, interestRate: 3, monthlyPayment: 500, remainingYears: 20 },
    ];
    const result = calculateFire(inputs);
    // First year should have debt payments
    expect(result.yearlyProjections[0]!.annualDebtPayments).toBe(6000);
    // After 20 years, debt should be paid off
    expect(result.yearlyProjections[20]!.annualDebtPayments).toBe(0);
  });

  it('fire age does not exceed life expectancy', () => {
    const result = calculateFire(makeInputs({
      salary: 2000,
      expenses: 1900,
      monthlyInvestment: 100,
      investedAssets: 0,
      cashSavings: 0,
    }));
    expect(result.fireAge).toBeLessThanOrEqual(90);
  });
});
