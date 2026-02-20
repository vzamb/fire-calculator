import type { FireInputs } from '@/types';
import type { PensionEntry } from './financial';
import { requiredPortfolio, survivesDrawdown } from './financial';

export interface MonteCarloResult {
  /** Percentile curves: age → portfolio value */
  percentiles: {
    p5: number[];
    p25: number[];
    p50: number[];
    p75: number[];
    p95: number[];
  };
  /** Ages corresponding to the percentile arrays */
  ages: number[];
  /** What % of simulations had portfolio > 0 at life expectancy */
  successRate: number;
  /** Distribution of FIRE ages across simulations */
  fireAgeDistribution: { age: number; count: number }[];
  /** Median FIRE age */
  medianFireAge: number;
  /** Number of simulations run */
  numSimulations: number;
}

// ────────────────────────────────────────────────────────────
// Seeded PRNG (mulberry32) — deterministic results for same inputs
// ────────────────────────────────────────────────────────────
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash a string into a 32-bit integer seed */
function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

/** Create a seeded normal-distribution generator (Box-Muller) */
function createRandn(rng: () => number): () => number {
  return () => {
    let u = 0, v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };
}

/**
 * Run Monte Carlo simulation with randomized annual returns.
 * Uses a seeded PRNG so identical inputs always produce identical results.
 * Volatility ~12% (diversified portfolio). Bridge strategy included.
 *
 * @param targetFireAge — if set, force retirement at this age instead of
 *   computing it dynamically. The survival rate then answers "if I retire
 *   at age X, what % of simulations keep the portfolio positive?"
 */
export function runMonteCarlo(
  inputs: FireInputs,
  numSimulations: number = 500,
  targetFireAge?: number,
): MonteCarloResult {
  const {
    personalInfo,
    income,
    expenses,
    assets,
    investmentStrategy,
    fireGoals,
  } = inputs;

  const grossReturn = investmentStrategy.expectedAnnualReturn / 100;
  const annualFees = investmentStrategy.annualFees / 100;
  const capitalGainsTax = investmentStrategy.capitalGainsTaxRate / 100;
  const meanReturn = (grossReturn - annualFees) * (1 - capitalGainsTax);
  // Diversified portfolio volatility (~12%); pure equity would be ~16%
  const volatility = 0.12;

  const inflation = expenses.annualInflationRate / 100;
  const swr = fireGoals.safeWithdrawalRate / 100;
  const realReturn = Math.max(0.001, (1 + meanReturn) / (1 + inflation) - 1);
  const postRetirementFactor = expenses.postRetirementExpensePercent / 100;
  const baseAnnualExpenses = expenses.monthlyExpenses * 12;
  const monthlyInvestment = fireGoals.monthlyInvestment;

  const maxYears = personalInfo.lifeExpectancy - personalInfo.currentAge + 1;
  const startPortfolio = assets.investedAssets + assets.cashSavings + assets.otherAssets;

  // Build pension entries once
  const pensionEntries: PensionEntry[] = income.pensions
    .filter(p => p.monthlyAmount > 0)
    .map(p => ({ annualAmount: p.monthlyAmount * 12, startAge: p.startAge }));

  // Deterministic seed from inputs + targetFireAge — same params ⇒ same results
  const seedStr = JSON.stringify(inputs) + (targetFireAge ?? '');
  const seed = hashSeed(seedStr);
  const rng = mulberry32(seed);
  const randn = createRandn(rng);

  // Storage for all simulation paths
  const allPaths: number[][] = [];
  const fireAges: number[] = [];

  for (let sim = 0; sim < numSimulations; sim++) {
    const path: number[] = [];
    let portfolio = startPortfolio;
    let livingExpenses = baseAnnualExpenses;
    let retirementExpenses = 0;
    let isRetired = false;
    let fireAge: number | null = null;

    // Clone debts
    let remainingDebts = assets.debts.map((d) => ({
      monthlyPayment: d.monthlyPayment,
      yearsLeft: d.remainingYears,
    }));

    for (let i = 0; i < maxYears; i++) {
      const age = personalInfo.currentAge + i;

      // Random return for this year
      const randomReturn = meanReturn + volatility * randn();

      // Debt payments
      let annualDebtPayments = 0;
      remainingDebts = remainingDebts
        .filter((d) => d.yearsLeft > 0)
        .map((d) => {
          annualDebtPayments += d.monthlyPayment * 12;
          return { ...d, yearsLeft: d.yearsLeft - 1 };
        });

      // Pension — sum all active pensions at this age
      let pensionIncome = 0;
      for (const pen of pensionEntries) {
        if (age >= pen.startAge) {
          pensionIncome += pen.annualAmount * Math.pow(1 + inflation, i);
        }
      }

      // One-time events
      const oneTimeExpenses = fireGoals.futureExpenses
        .filter((e) => e.yearsFromNow === i)
        .reduce((sum, e) => sum + e.amount, 0);
      const oneTimeIncomes = fireGoals.futureIncomes
        .filter((e) => e.yearsFromNow === i)
        .reduce((sum, e) => sum + e.amount, 0);
      const netOneTime = oneTimeIncomes - oneTimeExpenses;

      if (!isRetired) {
        // Accumulation
        const annualContribution = monthlyInvestment * 12;
        const growth = portfolio * randomReturn;
        portfolio += growth + annualContribution + netOneTime;
        portfolio = Math.max(0, portfolio);

        // ── FIRE check (mirrors main calculator) ──
        const inflationMultiplier = Math.pow(1 + inflation, i);
        const retExpensesToday = baseAnnualExpenses * postRetirementFactor;

        // Required portfolio using multi-pension model
        const reqToday = requiredPortfolio(
          retExpensesToday, pensionEntries, age, swr, realReturn,
        );

        // Debt cost — PV of remaining fixed nominal payments
        let debtPV = 0;
        for (const d of remainingDebts) {
          if (d.yearsLeft > 0) {
            const ap = d.monthlyPayment * 12;
            debtPV += meanReturn > 0.001
              ? ap * (1 - Math.pow(1 + meanReturn, -d.yearsLeft)) / meanReturn
              : ap * d.yearsLeft;
          }
        }

        const adjustedRequired = Math.max(0, reqToday * inflationMultiplier + debtPV);

        // When targetFireAge is set, force retirement at that exact age
        if (targetFireAge != null) {
          if (age >= targetFireAge && fireAge === null) {
            fireAge = age;
            isRetired = true;
            retirementExpenses = livingExpenses * postRetirementFactor;
          }
        } else {
          // Standard FIRE check
          if (portfolio >= adjustedRequired && fireAge === null) {
            fireAge = age;
            isRetired = true;
            retirementExpenses = livingExpenses * postRetirementFactor;
          }

          // Bridge strategy: deterministic drawdown check (same as main calculator)
          if (!isRetired && fireAge === null) {
            const bridgeIncomes = fireGoals.futureIncomes
              .filter((e) => !!e.includeInFire && e.yearsFromNow > i);

            if (bridgeIncomes.length > 0) {
              const candidateRetExpenses = livingExpenses * postRetirementFactor;
              const survives = survivesDrawdown(
                portfolio,
                candidateRetExpenses,
                inflation,
                meanReturn,
                pensionEntries,
                age,
                i,
                personalInfo.lifeExpectancy,
                remainingDebts.filter((d) => d.yearsLeft > 0),
                fireGoals.futureIncomes.filter((e) => e.yearsFromNow > i),
                fireGoals.futureExpenses.filter((e) => e.yearsFromNow > i),
              );
              if (survives) {
                fireAge = age;
                isRetired = true;
                retirementExpenses = candidateRetExpenses;
              }
            }
          }
        }
      } else {
        // Drawdown
        const totalSpend = retirementExpenses + annualDebtPayments;
        const withdrawal = Math.max(0, totalSpend - pensionIncome);
        const growth = portfolio * randomReturn;
        portfolio += growth - withdrawal + netOneTime;
        portfolio = Math.max(0, portfolio);
        retirementExpenses *= 1 + inflation;
      }

      if (!isRetired) {
        livingExpenses *= 1 + inflation;
      }

      path.push(portfolio);
    }

    allPaths.push(path);
    fireAges.push(fireAge ?? personalInfo.lifeExpectancy);
  }

  // Compute percentiles at each year
  const ages: number[] = [];
  const p5: number[] = [];
  const p25: number[] = [];
  const p50: number[] = [];
  const p75: number[] = [];
  const p95: number[] = [];

  for (let i = 0; i < maxYears; i++) {
    ages.push(personalInfo.currentAge + i);
    const values = allPaths.map((path) => path[i] ?? 0).sort((a, b) => a - b);
    p5.push(values[Math.floor(numSimulations * 0.05)] ?? 0);
    p25.push(values[Math.floor(numSimulations * 0.25)] ?? 0);
    p50.push(values[Math.floor(numSimulations * 0.50)] ?? 0);
    p75.push(values[Math.floor(numSimulations * 0.75)] ?? 0);
    p95.push(values[Math.floor(numSimulations * 0.95)] ?? 0);
  }

  // Success rate: % of simulations with portfolio > 0 at life expectancy
  const finalValues = allPaths.map((path) => path[maxYears - 1] ?? 0);
  const successRate = (finalValues.filter((v) => v > 0).length / numSimulations) * 100;

  // FIRE age distribution
  const fireAgeCounts = new Map<number, number>();
  for (const age of fireAges) {
    fireAgeCounts.set(age, (fireAgeCounts.get(age) ?? 0) + 1);
  }
  const fireAgeDistribution = Array.from(fireAgeCounts.entries())
    .map(([age, count]) => ({ age, count }))
    .sort((a, b) => a.age - b.age);

  // Median FIRE age
  const sortedFireAges = [...fireAges].sort((a, b) => a - b);
  const medianFireAge = sortedFireAges[Math.floor(numSimulations / 2)] ?? personalInfo.currentAge;

  return {
    percentiles: { p5, p25, p50, p75, p95 },
    ages,
    successRate,
    fireAgeDistribution,
    medianFireAge,
    numSimulations,
  };
}
