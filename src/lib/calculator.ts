import type { FireInputs, FireResult, YearlyProjection } from '@/types';

/** Present value of an annuity: n payments at rate r */
function annuityPV(n: number, r: number): number {
  if (n <= 0) return 0;
  if (r < 0.0001) return n;
  return (1 - Math.pow(1 + r, -n)) / r;
}

/**
 * Compute the required portfolio at a potential FIRE age, accounting for:
 *  1. Gap years (FIRE → pension start): full expense withdrawals
 *  2. Post-pension years: only (expenses − pension) withdrawals
 *  3. Uses SWR-based perpetuity for post-pension phase
 *
 * All values in TODAY's real euros.
 */
function requiredPortfolio(
  retExpensesToday: number,
  pensionAnnualToday: number,
  gapYears: number,
  swr: number,
  realReturn: number,
): number {
  if (pensionAnnualToday <= 0) {
    // No pension: standard SWR target
    return retExpensesToday / swr;
  }
  // Post-pension: portfolio only covers the shortfall
  const shortfall = Math.max(0, retExpensesToday - pensionAnnualToday);
  const postPensionPortfolio = shortfall / swr;

  if (gapYears <= 0) {
    // Already past pension age
    return postPensionPortfolio;
  }
  // Gap years: full expenses from portfolio (annuity)
  // Plus: need postPensionPortfolio left at end of gap (PV)
  const gapCost = retExpensesToday * annuityPV(gapYears, realReturn);
  const residualPV = postPensionPortfolio / Math.pow(1 + realReturn, gapYears);
  return gapCost + residualPV;
}

/**
 * Forward-simulate drawdown from a candidate FIRE age to life expectancy.
 * Returns true if portfolio stays ≥ 0 throughout.
 * This is used to validate bridge strategy: can the portfolio survive
 * until the bridge income (inheritance, etc.) actually arrives?
 */
function survivesDrawdown(
  startPortfolio: number,
  retExpenses: number,        // nominal annual expenses at retirement
  inflation: number,
  netReturn: number,
  pensionMonthly: number,
  pensionStartAge: number,
  fireAge: number,
  fireYearIdx: number,        // year index from simulation start
  lifeExpectancy: number,
  debts: Array<{ monthlyPayment: number; yearsLeft: number }>,
  futureIncomes: Array<{ amount: number; yearsFromNow: number }>,
  futureExpenses: Array<{ amount: number; yearsFromNow: number }>,
): boolean {
  let p = startPortfolio;
  let exp = retExpenses;
  const totalYears = lifeExpectancy - fireAge;
  for (let y = 0; y <= totalYears; y++) {
    const age = fireAge + y;
    const absYear = fireYearIdx + y;
    // Pension
    const pensionIncome = age >= pensionStartAge
      ? pensionMonthly * 12 * Math.pow(1 + inflation, absYear)
      : 0;
    // Debts
    let debtPay = 0;
    for (const d of debts) {
      if (d.yearsLeft > y) debtPay += d.monthlyPayment * 12;
    }
    // One-time events at this absolute year
    let oneTime = 0;
    for (const inc of futureIncomes) {
      if (inc.yearsFromNow === absYear) oneTime += inc.amount;
    }
    for (const ex of futureExpenses) {
      if (ex.yearsFromNow === absYear) oneTime -= ex.amount;
    }
    const totalSpend = exp + debtPay;
    const withdrawal = Math.max(0, totalSpend - pensionIncome);
    p += p * netReturn - withdrawal + oneTime;
    if (p < 0) return false;
    exp *= 1 + inflation;
  }
  return true;
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
  const capitalGainsTax = investmentStrategy.capitalGainsTaxRate / 100;
  // Capital gains tax applies only to growth, so net return = gross × (1 − tax)
  const netReturn = grossReturn * (1 - capitalGainsTax);
  const inflation = expenses.annualInflationRate / 100;
  const realReturn = Math.max(0.001, (1 + netReturn) / (1 + inflation) - 1);

  // ─── FIRE Number in TODAY's euros ───
  // This is the baseline: Annual retirement spending / SWR
  const baseAnnualExpenses = expenses.monthlyExpenses * 12;
  const fireNumberBaseToday = (baseAnnualExpenses * postRetirementFactor) / swr;

  const totalMonthlyIncome = income.monthlyNetSalary + income.additionalMonthlyIncome;
  const monthlyInvestment = fireGoals.monthlyInvestment;

  const currentSavingsRate =
    totalMonthlyIncome > 0
      ? (monthlyInvestment / totalMonthlyIncome) * 100
      : 0;

  // ─── Year-by-year projection ───
  const maxYears = personalInfo.lifeExpectancy - personalInfo.currentAge + 1;
  const yearlyProjections: YearlyProjection[] = [];

  let portfolio = assets.investedAssets + assets.cashSavings;
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
    const pensionIncome =
      age >= income.pensionStartAge
        ? income.pensionMonthlyAmount * 12 * Math.pow(1 + inflation, i)
        : 0;

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
      const pensionAnnualBase = income.pensionMonthlyAmount * 12;
      const gapYears = Math.max(0, income.pensionStartAge - age);

      // Required portfolio in today's euros (gap + residual model)
      const reqToday = requiredPortfolio(
        retExpensesToday, pensionAnnualBase, gapYears, swr, realReturn,
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
            income.pensionMonthlyAmount,
            income.pensionStartAge,
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
  const pensAnnTdy = income.pensionMonthlyAmount * 12;
  const fireGap = Math.max(0, income.pensionStartAge - fireAge);
  const adjustedFireNumberToday = requiredPortfolio(retExpTdy, pensAnnTdy, fireGap, swr, realReturn) + debtCostAtFire;
  const fireNumber = adjustedFireNumberToday * Math.pow(1 + inflation, yearsToFire);

  const fireDate = new Date();
  fireDate.setFullYear(fireDate.getFullYear() + yearsToFire);

  // ─── Coast FIRE calculation ───
  const coastTargetAge = 65;
  let coastFireAge = personalInfo.currentAge;
  // Use same gap+residual model for coast target
  const coastGapYears = Math.max(0, income.pensionStartAge - coastTargetAge);
  const coastReqToday = requiredPortfolio(
    baseAnnualExpenses * postRetirementFactor,
    income.pensionMonthlyAmount * 12,
    coastGapYears,
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
