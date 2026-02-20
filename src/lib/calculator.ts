import type { FireInputs, FireResult, YearlyProjection } from '@/types';
import type { PensionEntry } from './financial';
import { requiredPortfolio, survivesDrawdown } from './financial';

/** Build PensionEntry list from user input pensions */
function toPensionEntries(inputs: FireInputs): PensionEntry[] {
  return inputs.income.pensions
    .filter(p => p.monthlyAmount > 0)
    .map(p => ({ annualAmount: p.monthlyAmount * 12, startAge: p.startAge }));
}

export function calculateFire(inputs: FireInputs): FireResult {
  const {
    personalInfo,
    income,
    expenses,
    assets,
    investmentStrategy,
    fireGoals,
  } = inputs;

  // ─── Core rates ───
  const swr = fireGoals.safeWithdrawalRate / 100;
  const postRetirementFactor = expenses.postRetirementExpensePercent / 100;
  const grossReturn = investmentStrategy.expectedAnnualReturn / 100;
  const annualFees = investmentStrategy.annualFees / 100;
  const capitalGainsTax = investmentStrategy.capitalGainsTaxRate / 100;
  // Net return = (gross - fees) × (1 − capital gains tax)
  const netReturn = (grossReturn - annualFees) * (1 - capitalGainsTax);
  const inflation = expenses.annualInflationRate / 100;
  const realReturn = Math.max(0.001, (1 + netReturn) / (1 + inflation) - 1);

  // ─── FIRE Number in TODAY's euros ───
  // This is the baseline: Annual retirement spending / SWR
  const baseAnnualExpenses = expenses.monthlyExpenses * 12;
  const fireNumberBaseToday = (baseAnnualExpenses * postRetirementFactor) / swr;

  // Build pension entries once
  const pensionEntries = toPensionEntries(inputs);

  const totalMonthlyIncome = income.monthlyNetSalary + income.additionalMonthlyIncome;
  const monthlyInvestment = fireGoals.monthlyInvestment;

  const currentSavingsRate =
    totalMonthlyIncome > 0
      ? (monthlyInvestment / totalMonthlyIncome) * 100
      : 0;

  // ─── Year-by-year projection ───
  const maxYears = personalInfo.lifeExpectancy - personalInfo.currentAge + 1;
  const yearlyProjections: YearlyProjection[] = [];

  let portfolio = assets.investedAssets + assets.cashSavings + assets.otherAssets;
  let portfolioOpt = portfolio;
  let portfolioPess = portfolio;
  let cumulativeContributions = portfolio;
  let cumulativeGrowth = 0;
  let salary = income.monthlyNetSalary;
  let additionalIncome = income.additionalMonthlyIncome;
  // livingExpenses is the annual living cost, inflated each year
  let livingExpenses = baseAnnualExpenses;
  // retirementExpenses is captured at the point of FIRE, then inflated onward
  let retirementExpenses = 0;
  let fireAge: number | null = null;
  let isRetired = false;
  let bridgeGapAtFire = 0;      // shortfall vs standard target (nominal)
  let bridgeIncomeTotalAtFire = 0; // total bridge income expected
  let pensionCreditAtFire = 0;
  let debtCostAtFire = 0;

  // Track remaining debts with years left
  let remainingDebts = assets.debts.map((d) => ({
    ...d,
    yearsLeft: d.remainingYears,
  }));

  for (let i = 0; i < maxYears; i++) {
    const age = personalInfo.currentAge + i;
    const year = new Date().getFullYear() + i;

    // ── Debt payments ── debts expire when remaining years run out
    let annualDebtPayments = 0;
    remainingDebts = remainingDebts
      .filter((d) => d.yearsLeft > 0)
      .map((d) => {
        annualDebtPayments += d.monthlyPayment * 12;
        return { ...d, yearsLeft: d.yearsLeft - 1 };
      });

    // ── Income ──
    const totalAnnualIncome = (salary + additionalIncome) * 12;

    // ── Pension (inflation-adjusted — state pensions like INPS grow with CPI) ──
    let pensionIncome = 0;
    for (const pen of pensionEntries) {
      if (age >= pen.startAge) {
        pensionIncome += pen.annualAmount * Math.pow(1 + inflation, i);
      }
    }

    // ── One-time expenses (deducted from portfolio) ──
    const oneTimeExpenses = fireGoals.futureExpenses
      .filter((e) => e.yearsFromNow === i)
      .reduce((sum, e) => sum + e.amount, 0);

    // ── One-time incomes (added to portfolio: inheritance, severance, etc.) ──
    const oneTimeIncomes = fireGoals.futureIncomes
      .filter((e) => e.yearsFromNow === i)
      .reduce((sum, e) => sum + e.amount, 0);

    // Net one-time cash flow
    const netOneTime = oneTimeIncomes - oneTimeExpenses;

    if (!isRetired) {
      // ══ ACCUMULATION PHASE ══
      const annualContribution = monthlyInvestment * 12;
      const growth = portfolio * netReturn;
      const growthOpt = portfolioOpt * (netReturn + 0.02);
      const growthPess = portfolioPess * Math.max(0, netReturn - 0.02);

      portfolio += growth + annualContribution + netOneTime;
      portfolioOpt += growthOpt + annualContribution + netOneTime;
      portfolioPess += growthPess + annualContribution + netOneTime;

      cumulativeContributions += annualContribution;
      cumulativeGrowth += growth;

      // Passive income = what portfolio could generate via SWR
      const passiveIncome = portfolio * swr;

      yearlyProjections.push({
        year,
        age,
        portfolioValue: Math.max(0, portfolio),
        portfolioOptimistic: Math.max(0, portfolioOpt),
        portfolioPessimistic: Math.max(0, portfolioPess),
        annualContributions: annualContribution,
        annualInvestmentGrowth: growth,
        annualExpenses: livingExpenses + Math.max(0, -netOneTime),
        annualDebtPayments,
        passiveIncome,
        totalIncome: totalAnnualIncome + pensionIncome,
        cumulativeContributions,
        cumulativeGrowth,
        savingsRate:
          totalAnnualIncome > 0
            ? (annualContribution / totalAnnualIncome) * 100
            : 0,
        isRetired: false,
      });

      // ── Check if FIRE achieved ──
      const inflationMultiplier = Math.pow(1 + inflation, i);
      const retExpensesToday = baseAnnualExpenses * postRetirementFactor;

      // Required portfolio in today's euros (multi-pension gap + residual model)
      const reqToday = requiredPortfolio(
        retExpensesToday, pensionEntries, age, swr, realReturn,
      );

      // Debt cost — PV of remaining fixed nominal payments
      let debtPV = 0;
      for (const d of remainingDebts) {
        if (d.yearsLeft > 0) {
          const ap = d.monthlyPayment * 12;
          debtPV += netReturn > 0.001
            ? ap * (1 - Math.pow(1 + netReturn, -d.yearsLeft)) / netReturn
            : ap * d.yearsLeft;
        }
      }

      // Nominal target = (real target × inflation) + nominal debt PV
      const adjustedRequired = Math.max(0, reqToday * inflationMultiplier + debtPV);

      // ── Standard FIRE check (without bridge) ──
      if (portfolio >= adjustedRequired && fireAge === null) {
        fireAge = age;
        isRetired = true;
        pensionCreditAtFire = Math.max(0, fireNumberBaseToday - reqToday);
        debtCostAtFire = debtPV / inflationMultiplier;
        retirementExpenses = livingExpenses * postRetirementFactor;
      }

      // ── Bridge strategy: simulate-to-verify ──
      // If standard check didn't pass, try with bridge incomes.
      // Instead of PV heuristics, run a full drawdown simulation to verify
      // the portfolio actually survives until the bridge income arrives.
      if (!isRetired && fireAge === null) {
        const bridgeIncomes = fireGoals.futureIncomes
          .filter((e) => !!e.includeInFire && e.yearsFromNow > i);

        if (bridgeIncomes.length > 0) {
          const candidateRetExpenses = livingExpenses * postRetirementFactor;
          const survives = survivesDrawdown(
            portfolio,
            candidateRetExpenses,
            inflation,
            netReturn,
            pensionEntries,
            age,
            i,
            personalInfo.lifeExpectancy,
            remainingDebts.filter((d) => d.yearsLeft > 0),
            // ALL future incomes go into simulation (bridge + non-bridge)
            fireGoals.futureIncomes.filter((e) => e.yearsFromNow > i),
            fireGoals.futureExpenses.filter((e) => e.yearsFromNow > i),
          );
          if (survives) {
            fireAge = age;
            isRetired = true;
            bridgeGapAtFire = adjustedRequired - portfolio;
            bridgeIncomeTotalAtFire = bridgeIncomes.reduce((s, e) => s + e.amount, 0);
            pensionCreditAtFire = Math.max(0, fireNumberBaseToday - reqToday);
            debtCostAtFire = debtPV / inflationMultiplier;
            retirementExpenses = candidateRetExpenses;
          }
        }
      }
    } else {
      // ══ DRAWDOWN PHASE ══
      // retirementExpenses was set at retirement from actual inflated living
      // expenses, and continues to grow with inflation each iteration.
      const totalRetirementSpend = retirementExpenses + annualDebtPayments;
      const withdrawal = Math.max(0, totalRetirementSpend - pensionIncome);
      const growth = portfolio * netReturn;
      const growthOpt = portfolioOpt * (netReturn + 0.02);
      const growthPess = portfolioPess * Math.max(0, netReturn - 0.02);

      portfolio += growth - withdrawal + netOneTime;
      portfolioOpt += growthOpt - withdrawal + netOneTime;
      portfolioPess += growthPess - withdrawal + netOneTime;
      cumulativeGrowth += growth;

      yearlyProjections.push({
        year,
        age,
        portfolioValue: Math.max(0, portfolio),
        portfolioOptimistic: Math.max(0, portfolioOpt),
        portfolioPessimistic: Math.max(0, portfolioPess),
        annualContributions: 0,
        annualInvestmentGrowth: growth,
        annualExpenses: retirementExpenses + Math.max(0, -netOneTime),
        annualDebtPayments,
        passiveIncome: portfolio * swr,
        totalIncome: pensionIncome,
        cumulativeContributions,
        cumulativeGrowth,
        savingsRate: 0,
        isRetired: true,
      });

      // Retirement expenses continue to grow with inflation
      retirementExpenses *= 1 + inflation;
    }

    // ── Grow income & expenses for next year (accumulation only) ──
    if (!isRetired) {
      salary *= 1 + income.annualSalaryGrowth / 100;
      additionalIncome *= 1 + inflation;
      livingExpenses *= 1 + inflation;
    }
  }

  // If never achieved FIRE, set to life expectancy
  if (fireAge === null) {
    fireAge = personalInfo.lifeExpectancy;
  }

  const yearsToFire = fireAge - personalInfo.currentAge;

  // The FIRE number shown to the user is the adjusted target at the projected FIRE age.
  const retExpTdy = baseAnnualExpenses * postRetirementFactor;
  const adjustedFireNumberToday = requiredPortfolio(retExpTdy, pensionEntries, fireAge, swr, realReturn) + debtCostAtFire;
  const fireNumber = adjustedFireNumberToday * Math.pow(1 + inflation, yearsToFire);

  const fireDate = new Date();
  fireDate.setFullYear(fireDate.getFullYear() + yearsToFire);

  // ─── Coast FIRE calculation ───
  const coastTargetAge = 65;
  let coastFireAge = personalInfo.currentAge;
  // Use same multi-pension model for coast target
  const coastReqToday = requiredPortfolio(
    baseAnnualExpenses * postRetirementFactor,
    pensionEntries,
    coastTargetAge,
    swr,
    realReturn,
  );
  const coastTarget = coastReqToday *
    Math.pow(1 + inflation, coastTargetAge - personalInfo.currentAge);
  for (let age = personalInfo.currentAge; age <= coastTargetAge; age++) {
    const yearsToGrow = coastTargetAge - age;
    const currentPortfolio =
      yearlyProjections[age - personalInfo.currentAge]?.portfolioValue ?? 0;
    const futureValue =
      currentPortfolio * Math.pow(1 + netReturn, yearsToGrow);
    if (futureValue >= coastTarget) {
      coastFireAge = age;
      break;
    }
  }

  // ─── Barista FIRE calculation ───
  const postRetirementMonthly =
    expenses.monthlyExpenses * postRetirementFactor;
  const currentPassiveIncome = portfolio * swr / 12;
  const baristaFireIncome = Math.max(0, postRetirementMonthly - currentPassiveIncome);

  // Portfolio values at key ages
  const retirementProjection = yearlyProjections.find(
    (p) => p.age === fireAge
  );
  const at90 = yearlyProjections.find(
    (p) => p.age === personalInfo.lifeExpectancy
  );

  // Success rate — what % of retirement years have positive portfolio
  const retirementYears = personalInfo.lifeExpectancy - fireAge;
  const retirementProjections = yearlyProjections.filter((p) => p.isRetired);
  const yearsWithPositivePortfolio = retirementProjections.filter(
    (p) => p.portfolioValue > 0
  ).length;
  const successRate =
    retirementProjections.length > 0
      ? (yearsWithPositivePortfolio / retirementProjections.length) * 100
      : 100;

  return {
    fireNumber,
    fireNumberToday: adjustedFireNumberToday,
    fireNumberBaseToday,
    fireAge,
    fireDate,
    yearsToFire,
    currentSavingsRate,
    monthlySavings: monthlyInvestment,
    coastFireAge,
    baristaFireIncome,
    yearlyProjections,
    totalContributions: cumulativeContributions,
    totalGrowth: cumulativeGrowth,
    portfolioAtRetirement: retirementProjection?.portfolioValue ?? 0,
    portfolioAt90: at90?.portfolioValue ?? 0,
    retirementYears,
    successRate,
    bridgeGap: bridgeGapAtFire,
    bridgeIncomeTotal: bridgeIncomeTotalAtFire,
    pensionCreditToday: pensionCreditAtFire,
    debtCostToday: debtCostAtFire,
  };
}
