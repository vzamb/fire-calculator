import { describe, it, expect } from 'vitest';
import { runMonteCarlo } from '../lib/monteCarlo';
import { DEFAULT_INPUTS } from '../lib/constants';
import type { FireInputs } from '../types';

describe('runMonteCarlo', () => {
  it('returns correct structure from default inputs', () => {
    const result = runMonteCarlo(DEFAULT_INPUTS, 100);
    expect(result.numSimulations).toBe(100);
    expect(result.ages.length).toBeGreaterThan(0);
    expect(result.percentiles.p10.length).toBe(result.ages.length);
    expect(result.percentiles.p25.length).toBe(result.ages.length);
    expect(result.percentiles.p50.length).toBe(result.ages.length);
    expect(result.percentiles.p75.length).toBe(result.ages.length);
    expect(result.percentiles.p90.length).toBe(result.ages.length);
    expect(result.successRate).toBeGreaterThanOrEqual(0);
    expect(result.successRate).toBeLessThanOrEqual(100);
    expect(result.medianFireAge).toBeGreaterThan(0);
    expect(result.fireAgeDistribution.length).toBeGreaterThan(0);
  });

  it('is deterministic — same inputs produce same results', () => {
    const r1 = runMonteCarlo(DEFAULT_INPUTS, 50);
    const r2 = runMonteCarlo(DEFAULT_INPUTS, 50);
    expect(r1.successRate).toBe(r2.successRate);
    expect(r1.medianFireAge).toBe(r2.medianFireAge);
    expect(r1.percentiles.p50).toEqual(r2.percentiles.p50);
  });

  it('different inputs produce different results', () => {
    const modified: FireInputs = {
      ...DEFAULT_INPUTS,
      fireGoals: { ...DEFAULT_INPUTS.fireGoals, monthlyInvestment: 2000 },
    };
    const r1 = runMonteCarlo(DEFAULT_INPUTS, 50);
    const r2 = runMonteCarlo(modified, 50);
    expect(r1.medianFireAge).not.toBe(r2.medianFireAge);
  });

  it('percentiles are ordered correctly at each age', () => {
    const result = runMonteCarlo(DEFAULT_INPUTS, 200);
    for (let i = 0; i < result.ages.length; i++) {
      expect(result.percentiles.p10[i]!).toBeLessThanOrEqual(result.percentiles.p25[i]!);
      expect(result.percentiles.p25[i]!).toBeLessThanOrEqual(result.percentiles.p50[i]!);
      expect(result.percentiles.p50[i]!).toBeLessThanOrEqual(result.percentiles.p75[i]!);
      expect(result.percentiles.p75[i]!).toBeLessThanOrEqual(result.percentiles.p90[i]!);
    }
  });

  it('higher investment leads to earlier median FIRE age', () => {
    const low: FireInputs = {
      ...DEFAULT_INPUTS,
      fireGoals: { ...DEFAULT_INPUTS.fireGoals, monthlyInvestment: 200 },
    };
    const high: FireInputs = {
      ...DEFAULT_INPUTS,
      fireGoals: { ...DEFAULT_INPUTS.fireGoals, monthlyInvestment: 2000 },
    };
    const rLow = runMonteCarlo(low, 200);
    const rHigh = runMonteCarlo(high, 200);
    expect(rHigh.medianFireAge).toBeLessThanOrEqual(rLow.medianFireAge);
  });

  it('targetFireAge forces retirement at specified age', () => {
    const targetAge = 45;
    const result = runMonteCarlo(DEFAULT_INPUTS, 100, targetAge);
    // All fire ages in the distribution should be == targetAge (or life expectancy if never reached)
    for (const entry of result.fireAgeDistribution) {
      expect(entry.age).toBeGreaterThanOrEqual(targetAge);
    }
  });

  it('ages span from current age to life expectancy', () => {
    const result = runMonteCarlo(DEFAULT_INPUTS, 50);
    expect(result.ages[0]).toBe(DEFAULT_INPUTS.personalInfo.currentAge);
    expect(result.ages[result.ages.length - 1]).toBe(DEFAULT_INPUTS.personalInfo.lifeExpectancy);
  });

  it('custom assets improve Monte Carlo median FIRE age', () => {
    const base = runMonteCarlo(DEFAULT_INPUTS, 200);
    const withCustom: FireInputs = {
      ...DEFAULT_INPUTS,
      assets: {
        ...DEFAULT_INPUTS.assets,
        customAssets: [
          { id: '1', type: 'brokerage', name: 'Brokerage', balance: 50000, monthlyContribution: 500, expectedAnnualReturn: 7 },
        ],
      },
    };
    const enhanced = runMonteCarlo(withCustom, 200);
    // More assets + contributions → reach FIRE sooner
    expect(enhanced.medianFireAge).toBeLessThanOrEqual(base.medianFireAge);
  });
});
