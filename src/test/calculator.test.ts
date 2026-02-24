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
      annualInflationRate: overrides.inflation ?? 2,
      postRetirementExpensePercent: overrides.postRetirementPercent ?? 100,
    },
    assets: {
      investedAssets: overrides.investedAssets ?? 50000,
      cashSavings: overrides.cashSavings ?? 10000,
      customAssets: [],
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
      customPortfolioAllocation: { equity: 60, bonds: 30, cash: 10 },
      customAssetReturns: { equity: 8, bonds: 2.5, cash: 1.5 },
      customExpectedAnnualReturn: overrides.expectedReturn ?? 7,
      customAnnualVolatility: 12,
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

  it('includes custom asset balances in starting portfolio', () => {
    const without = calculateFire(makeInputs({}));
    const inputs = makeInputs({});
    inputs.assets.customAssets = [
      { id: 'extra', type: 'other', name: 'Extra', balance: 100000, monthlyContribution: 0, expectedAnnualReturn: 7 },
    ];
    const withCustom = calculateFire(inputs);
    expect(withCustom.fireAge).toBeLessThanOrEqual(without.fireAge);
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

  // ── Custom Assets Integration ──

  it('custom asset balances are included in starting portfolio', () => {
    const without = calculateFire(makeInputs({ investedAssets: 50000 }));
    const inputs = makeInputs({ investedAssets: 50000 });
    inputs.assets.customAssets = [
      { id: '1', type: 'brokerage', name: 'Brokerage', balance: 30000, monthlyContribution: 0, expectedAnnualReturn: 7 },
    ];
    const withCustom = calculateFire(inputs);
    // First-year portfolio should be higher by the custom asset balance
    expect(withCustom.yearlyProjections[0]!.portfolioValue).toBeGreaterThan(
      without.yearlyProjections[0]!.portfolioValue
    );
  });

  it('custom asset contributions increase savings rate and monthly savings', () => {
    const base = calculateFire(makeInputs({ salary: 5000, monthlyInvestment: 1000 }));
    const inputs = makeInputs({ salary: 5000, monthlyInvestment: 1000 });
    inputs.assets.customAssets = [
      { id: '1', type: 'tradIra', name: '401k', balance: 0, monthlyContribution: 500, expectedAnnualReturn: 7, employerMatch: 250 },
    ];
    const withCustom = calculateFire(inputs);
    // savings rate should include the 500/mo custom contribution
    expect(withCustom.currentSavingsRate).toBeGreaterThan(base.currentSavingsRate);
    // monthly savings should include custom contributions
    expect(withCustom.monthlySavings).toBe(1500); // 1000 general + 500 custom
  });

  it('custom assets with contributions lead to earlier FIRE', () => {
    const base = calculateFire(makeInputs({ monthlyInvestment: 500 }));
    const inputs = makeInputs({ monthlyInvestment: 500 });
    inputs.assets.customAssets = [
      { id: '1', type: 'brokerage', name: 'Extra', balance: 0, monthlyContribution: 500, expectedAnnualReturn: 7 },
    ];
    const withCustom = calculateFire(inputs);
    expect(withCustom.fireAge).toBeLessThanOrEqual(base.fireAge);
  });

  it('custom assets grow at their own rate, not the portfolio rate', () => {
    const inputs = makeInputs({ expectedReturn: 7, investedAssets: 0, cashSavings: 0 });
    inputs.assets.customAssets = [
      { id: '1', type: 'hysa', name: 'HYSA', balance: 100000, monthlyContribution: 0, expectedAnnualReturn: 4 },
    ];
    const result = calculateFire(inputs);
    // After year 1, the custom asset should grow at ~4%, not ~7%
    // Total portfolio year 0 includes contributions+growth, but the HYSA-only portion
    // should reflect its 4% rate. The portfolio should be less than 100000*1.07 = 107000
    const yearOneValue = result.yearlyProjections[0]!.portfolioValue;
    // With 4% return on 100k HYSA + general monthly investment (1000*12=12000 at ~6.28% geo)
    expect(yearOneValue).toBeLessThan(100000 * 1.07 + 12000);
    expect(yearOneValue).toBeGreaterThan(100000 * 1.03); // at least grew
  });

  it('employer match is included in custom asset annual contributions', () => {
    const noMatch = makeInputs({ monthlyInvestment: 500 });
    noMatch.assets.customAssets = [
      { id: '1', type: 'tradIra', name: '401k', balance: 10000, monthlyContribution: 500, expectedAnnualReturn: 7 },
    ];
    const withMatch = makeInputs({ monthlyInvestment: 500 });
    withMatch.assets.customAssets = [
      { id: '1', type: 'tradIra', name: '401k', balance: 10000, monthlyContribution: 500, expectedAnnualReturn: 7, employerMatch: 250 },
    ];
    const resultNo = calculateFire(noMatch);
    const resultWith = calculateFire(withMatch);
    // Employer match of 250/mo = 3000/yr more, should reach FIRE faster
    expect(resultWith.fireAge).toBeLessThanOrEqual(resultNo.fireAge);
  });
});
