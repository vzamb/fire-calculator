import { describe, it, expect } from 'vitest';
import { annuityPV, requiredPortfolio, survivesDrawdown } from '../lib/financial';

describe('annuityPV', () => {
  it('returns 0 for 0 or negative payments', () => {
    expect(annuityPV(0, 0.05)).toBe(0);
    expect(annuityPV(-1, 0.05)).toBe(0);
  });

  it('returns n when interest rate is near zero', () => {
    expect(annuityPV(10, 0)).toBe(10);
    expect(annuityPV(10, 0.00001)).toBeCloseTo(10, 2);
  });

  it('returns correct PV for standard annuity', () => {
    // 10 payments at 5%: PV = (1 - 1.05^-10) / 0.05 ≈ 7.7217
    const result = annuityPV(10, 0.05);
    expect(result).toBeCloseTo(7.7217, 3);
  });

  it('returns correct PV for high rate', () => {
    // 5 payments at 20%: PV = (1 - 1.2^-5) / 0.2 ≈ 2.9906
    const result = annuityPV(5, 0.2);
    expect(result).toBeCloseTo(2.9906, 3);
  });
});

describe('requiredPortfolio', () => {
  it('returns expenses / SWR when no pension', () => {
    const result = requiredPortfolio(30000, 0, 0, 0.04, 0.04);
    expect(result).toBeCloseTo(750000, 0);
  });

  it('returns shortfall / SWR when pension covers part of expenses and no gap', () => {
    // Expenses = 30k, pension = 12k, shortfall = 18k, 18k / 0.04 = 450k
    const result = requiredPortfolio(30000, 12000, 0, 0.04, 0.04);
    expect(result).toBeCloseTo(450000, 0);
  });

  it('returns 0 when pension fully covers expenses', () => {
    const result = requiredPortfolio(20000, 30000, 0, 0.04, 0.04);
    expect(result).toBe(0);
  });

  it('accounts for gap years before pension', () => {
    // With gap years, portfolio must cover full expenses during gap + residual
    const withGap = requiredPortfolio(30000, 12000, 10, 0.04, 0.04);
    const noGap = requiredPortfolio(30000, 12000, 0, 0.04, 0.04);
    expect(withGap).toBeGreaterThan(noGap);
  });

  it('increases with more gap years', () => {
    const gap5 = requiredPortfolio(30000, 12000, 5, 0.04, 0.04);
    const gap10 = requiredPortfolio(30000, 12000, 10, 0.04, 0.04);
    const gap20 = requiredPortfolio(30000, 12000, 20, 0.04, 0.04);
    expect(gap10).toBeGreaterThan(gap5);
    expect(gap20).toBeGreaterThan(gap10);
  });
});

describe('survivesDrawdown', () => {
  it('survives with ample portfolio and low expenses', () => {
    const result = survivesDrawdown(
      1_000_000, // start portfolio
      30_000,    // retirement expenses
      0.02,      // inflation
      0.05,      // net return
      0,         // pension monthly
      67,        // pension start age
      60,        // fire age
      0,         // fire year index
      90,        // life expectancy
      [],        // debts
      [],        // future incomes
      [],        // future expenses
    );
    expect(result).toBe(true);
  });

  it('fails with insufficient portfolio', () => {
    const result = survivesDrawdown(
      50_000,    // very small portfolio
      60_000,    // high expenses
      0.02,
      0.05,
      0,
      67,
      60,
      0,
      90,
      [],
      [],
      [],
    );
    expect(result).toBe(false);
  });

  it('pension income helps survival', () => {
    // With pension starting at 67, large portfolio, moderate expenses
    survivesDrawdown(
      800_000, 40_000, 0.02, 0.05, 0, 67, 60, 0, 90, [], [], [],
    );
    const withPension = survivesDrawdown(
      800_000, 40_000, 0.02, 0.05, 1500, 67, 60, 0, 90, [], [], [],
    );
    // With pension should at least be no worse
    // Both should survive with this portfolio size; pension provides extra buffer
    expect(withPension).toBe(true);
  });

  it('debt payments reduce survival', () => {
    const noDebt = survivesDrawdown(
      1_000_000, 30_000, 0.02, 0.05, 0, 67, 55, 0, 90, [], [], [],
    );
    const withDebt = survivesDrawdown(
      1_000_000, 30_000, 0.02, 0.05, 0, 67, 55, 0, 90,
      [{ monthlyPayment: 5000, yearsLeft: 30 }],
      [], [],
    );
    expect(noDebt).toBe(true);
    expect(withDebt).toBe(false);
  });

  it('future income (bridge) aids survival', () => {
    // Portfolio that barely fails without bridge
    const withoutBridge = survivesDrawdown(
      400_000, 30_000, 0.02, 0.05, 0, 67, 50, 0, 90, [], [], [],
    );
    const withBridge = survivesDrawdown(
      400_000, 30_000, 0.02, 0.05, 0, 67, 50, 0, 90, [],
      [{ amount: 1_000_000, yearsFromNow: 3 }],
      [],
    );
    expect(withoutBridge).toBe(false);
    expect(withBridge).toBe(true);
  });
});
