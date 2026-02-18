/**
 * Shared financial math utilities used by both calculator.ts and monteCarlo.ts.
 */

/** Present value of an annuity: n payments at rate r */
export function annuityPV(n: number, r: number): number {
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
 * All values in TODAY's real currency.
 */
export function requiredPortfolio(
  retExpensesToday: number,
  pensionAnnualToday: number,
  gapYears: number,
  swr: number,
  realReturn: number,
): number {
  if (pensionAnnualToday <= 0) {
    return retExpensesToday / swr;
  }
  const shortfall = Math.max(0, retExpensesToday - pensionAnnualToday);
  const postPensionPortfolio = shortfall / swr;

  if (gapYears <= 0) {
    return postPensionPortfolio;
  }
  const gapCost = retExpensesToday * annuityPV(gapYears, realReturn);
  const residualPV = postPensionPortfolio / Math.pow(1 + realReturn, gapYears);
  return gapCost + residualPV;
}

/**
 * Forward-simulate drawdown from a candidate FIRE age to life expectancy.
 * Returns true if portfolio stays ≥ 0 throughout.
 * Used to validate bridge strategy: can the portfolio survive
 * until the bridge income (inheritance, etc.) actually arrives?
 */
export function survivesDrawdown(
  startPortfolio: number,
  retExpenses: number,
  inflation: number,
  netReturn: number,
  pensionMonthly: number,
  pensionStartAge: number,
  fireAge: number,
  fireYearIdx: number,
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
    const pensionIncome = age >= pensionStartAge
      ? pensionMonthly * 12 * Math.pow(1 + inflation, absYear)
      : 0;
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
    const withdrawal = Math.max(0, totalSpend - pensionIncome);
    p += p * netReturn - withdrawal + oneTime;
    if (p < 0) return false;
    exp *= 1 + inflation;
  }
  return true;
}
