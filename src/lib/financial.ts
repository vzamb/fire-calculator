/**
 * Shared financial math utilities used by both calculator.ts and monteCarlo.ts.
 */

/** Present value of an annuity: n payments at rate r */
export function annuityPV(n: number, r: number): number {
  if (n <= 0) return 0;
  if (r < 0.0001) return n;
  return (1 - Math.pow(1 + r, -n)) / r;
}

/** Pension descriptor used by portfolio/drawdown functions */
export interface PensionEntry {
  annualAmount: number;
  startAge: number;
}

export interface RecurringIncomeEntry {
  annualAmount: number;
  startAge: number;
  annualGrowthRate: number;
  includeInFire: boolean;
}

function recurringIncomeAtAge(
  incomes: RecurringIncomeEntry[],
  age: number,
  fireAge: number,
  inflation: number,
): number {
  let total = 0;
  for (const inc of incomes) {
    if (age < inc.startAge) continue;
    const yearsFromNow = age - fireAge;
    const yearsSinceStart = age - inc.startAge;
    const nominal = inc.annualAmount * Math.pow(1 + inc.annualGrowthRate, yearsSinceStart);
    total += nominal / Math.pow(1 + inflation, yearsFromNow);
  }
  return total;
}

/**
 * Compute the required portfolio at a potential FIRE age, accounting for
 * multiple pensions that may start at different ages.
 *
 * Segments are defined by pension start ages:
 *  - Before the first pension: full expense withdrawals
 *  - Between pension starts: reduced withdrawals as each pension kicks in
 *  - After all pensions active: terminal portfolio = shortfall / SWR
 *
 * All values in TODAY's real currency.
 */
export function requiredPortfolio(
  retExpensesToday: number,
  pensions: PensionEntry[],
  fireAge: number,
  swr: number,
  realReturn: number,
  lifeExpectancy?: number,
  inflation: number = 0,
  recurringIncomes: RecurringIncomeEntry[] = [],
): number {
  if (lifeExpectancy == null) {
    const active = pensions.filter(p => p.annualAmount > 0);
    const totalPension = active.reduce((s, p) => s + p.annualAmount, 0);

    if (active.length === 0) {
      return retExpensesToday / swr;
    }

    const breakpoints = [...new Set(
      active.filter(p => p.startAge > fireAge).map(p => p.startAge),
    )].sort((a, b) => a - b);

    if (breakpoints.length === 0) {
      return Math.max(0, retExpensesToday - totalPension) / swr;
    }

    const ages = [fireAge, ...breakpoints];
    const finalShortfall = Math.max(0, retExpensesToday - totalPension);
    let neededPortfolio = finalShortfall / swr;

    for (let i = ages.length - 1; i >= 1; i--) {
      const segStart = ages[i - 1]!;
      const segEnd = ages[i]!;
      const duration = segEnd - segStart;

      const activePension = active
        .filter(p => p.startAge <= segStart)
        .reduce((s, p) => s + p.annualAmount, 0);
      const withdrawal = Math.max(0, retExpensesToday - activePension);

      neededPortfolio =
        withdrawal * annuityPV(duration, realReturn) +
        neededPortfolio / Math.pow(1 + realReturn, duration);
    }

    return neededPortfolio;
  }

  if (retExpensesToday <= 0) {
    return 0;
  }

  const activePensions = pensions.filter((p) => p.annualAmount > 0);

  const survivesFrom = (startPortfolio: number): boolean => {
    let portfolio = startPortfolio;
    for (let age = fireAge; age <= lifeExpectancy; age++) {
      const pensionIncome = activePensions
        .filter((p) => age >= p.startAge)
        .reduce((sum, p) => sum + p.annualAmount, 0);
      const extraRecurring = recurringIncomeAtAge(recurringIncomes, age, fireAge, inflation);
      const withdrawal = Math.max(0, retExpensesToday - pensionIncome - extraRecurring);
      portfolio = portfolio * (1 + realReturn) - withdrawal;
      if (portfolio < 0) return false;
    }
    return true;
  };

  let low = 0;
  let high = Math.max(retExpensesToday / Math.max(0.01, swr), retExpensesToday) * 2;
  while (!survivesFrom(high) && high < 1_000_000_000) {
    high *= 2;
  }

  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    if (survivesFrom(mid)) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return high;
}

/**
 * Forward-simulate drawdown from a candidate FIRE age to life expectancy.
 * Returns true if portfolio stays ≥ 0 throughout.
 * Supports multiple pensions with different start ages.
 */
export function survivesDrawdown(
  startPortfolio: number,
  retExpenses: number,
  inflation: number,
  netReturn: number,
  pensions: PensionEntry[],
  fireAge: number,
  fireYearIdx: number,
  lifeExpectancy: number,
  debts: Array<{ monthlyPayment: number; yearsLeft: number }>,
  futureIncomes: Array<{ amount: number; yearsFromNow: number }>,
  futureExpenses: Array<{ amount: number; yearsFromNow: number }>,
  recurringIncomes: RecurringIncomeEntry[] = [],
): boolean {
  let p = startPortfolio;
  let exp = retExpenses;
  const totalYears = lifeExpectancy - fireAge;
  for (let y = 0; y <= totalYears; y++) {
    const age = fireAge + y;
    const absYear = fireYearIdx + y;

    // Sum pension income from all pensions active at this age
    let pensionIncome = 0;
    for (const pen of pensions) {
      if (age >= pen.startAge) {
        pensionIncome += (pen.annualAmount / 12) * 12 * Math.pow(1 + inflation, absYear);
      }
    }

    let recurringIncome = 0;
    for (const inc of recurringIncomes) {
      if (age >= inc.startAge) {
        recurringIncome += inc.annualAmount * Math.pow(1 + inc.annualGrowthRate, absYear);
      }
    }

    let debtPay = 0;
    for (const d of debts) {
      if (d.yearsLeft > y) debtPay += d.monthlyPayment * 12;
    }
    let oneTime = 0;
    for (const inc of futureIncomes) {
      if (inc.yearsFromNow === absYear) oneTime += inc.amount;
    }
    for (const ex of futureExpenses) {
      if (ex.yearsFromNow === absYear) oneTime -= ex.amount;
    }
    const totalSpend = exp + debtPay;
    const withdrawal = Math.max(0, totalSpend - pensionIncome - recurringIncome);
    p += p * netReturn - withdrawal + oneTime;
    if (p < 0) return false;
    exp *= 1 + inflation;
  }
  return true;
}
