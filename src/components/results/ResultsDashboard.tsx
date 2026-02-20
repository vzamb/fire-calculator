import { useFireStore } from '@/store/fireStore';
import { SummaryCards } from './SummaryCards';
import { ProjectionChart } from './ProjectionChart';
import { IncomeExpenseChart } from './IncomeExpenseChart';
import { WithdrawalChart } from './WithdrawalChart';
import { BreakdownChart } from './BreakdownChart';
import { ScenarioComparison } from './ScenarioComparison';
import { MonteCarloChart } from './MonteCarloChart';
import { MilestoneTimeline } from './MilestoneTimeline';
import { formatCurrency } from '@/lib/formatters';
import { Info } from 'lucide-react';
import { useT } from '@/lib/i18n';

export function ResultsDashboard() {
  const { result, inputs } = useFireStore();
  const t = useT();

  const hasAdjustments = result.pensionCreditToday > 0 || result.debtCostToday > 0;
  const adjustedBase = result.fireNumberToday;

  return (
    <div className="space-y-6 pb-12">
      {/* FIRE Number Explainer */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 sm:p-5">
        <div className="flex items-start gap-3 mb-3">
          <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-sm text-foreground">
              {t.yourFireNumber(formatCurrency(result.fireNumber))}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t.fireNumberExplainer(result.fireAge)}
            </p>
          </div>
        </div>

        {/* Breakdown table */}
        <div className="ml-7 space-y-1.5 text-xs font-mono">
          {/* Base */}
          <div className="flex justify-between items-center gap-4">
            <span className="text-muted-foreground truncate">{t.explainerBase}</span>
            <span className="text-foreground font-medium tabular-nums">{formatCurrency(result.fireNumberBaseToday)}</span>
          </div>

          {/* Pension credit */}
          {result.pensionCreditToday > 0 && (
            <div className="flex justify-between items-center gap-4">
              <span className="text-emerald-600 dark:text-emerald-400 truncate">
                {t.explainerPensionCredit}
                <span className="text-[10px] text-muted-foreground ml-1 font-sans">
                  ({t.pensionCreditDetail(
                    formatCurrency(inputs.income.pensions.reduce((s, p) => s + p.monthlyAmount, 0)),
                    inputs.income.pensions.length,
                  )})
                </span>
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium tabular-nums whitespace-nowrap">
                −{formatCurrency(result.pensionCreditToday)}
              </span>
            </div>
          )}

          {/* Debt cost */}
          {result.debtCostToday > 0 && (
            <div className="flex justify-between items-center gap-4">
              <span className="text-orange-600 dark:text-orange-400 truncate">
                {t.explainerDebtCost}
                <span className="text-[10px] text-muted-foreground ml-1 font-sans">
                  ({t.debtCostDetail})
                </span>
              </span>
              <span className="text-orange-600 dark:text-orange-400 font-medium tabular-nums whitespace-nowrap">
                +{formatCurrency(result.debtCostToday)}
              </span>
            </div>
          )}

          {/* Adjusted base (only if there were adjustments) */}
          {hasAdjustments && (
            <>
              <div className="border-t border-border/60 my-1" />
              <div className="flex justify-between items-center gap-4">
                <span className="text-muted-foreground truncate">{t.explainerAdjustedBase}</span>
                <span className="text-foreground font-semibold tabular-nums">{formatCurrency(adjustedBase)}</span>
              </div>
            </>
          )}

          {/* Inflation multiplier */}
          <div className="flex justify-between items-center gap-4 text-muted-foreground">
            <span className="truncate">{t.explainerInflation(result.yearsToFire)}</span>
            <span className="tabular-nums">×{(Math.pow(1 + inputs.expenses.annualInflationRate / 100, result.yearsToFire)).toFixed(3)}</span>
          </div>

          {/* Final target */}
          <div className="border-t border-border/60 my-1" />
          <div className="flex justify-between items-center gap-4">
            <span className="text-foreground font-semibold font-sans">{t.explainerFinalTarget}</span>
            <span className="text-foreground font-bold tabular-nums text-sm">{formatCurrency(result.fireNumber)}</span>
          </div>
        </div>

        {/* Hint + bridge warning */}
        <div className="ml-7 mt-3 space-y-1.5">
          <p className="text-[10px] text-muted-foreground leading-relaxed">{t.fireNumberHint}</p>
          {result.bridgeGap > 0 && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              {t.bridgeStrategyActive}{' '}
              {t.bridgeStrategyExplainer(
                formatCurrency(result.bridgeGap),
                formatCurrency(result.portfolioAtRetirement),
                formatCurrency(result.bridgeIncomeTotal),
                result.fireAge,
              )}
            </p>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards result={result} />

      {/* Milestone Timeline */}
      <MilestoneTimeline />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="xl:col-span-2">
          <ProjectionChart result={result} />
        </div>
        <div className="xl:col-span-2">
          <MonteCarloChart />
        </div>
        <IncomeExpenseChart result={result} />
        <WithdrawalChart result={result} />
        <div className="xl:col-span-2">
          <BreakdownChart result={result} />
        </div>
      </div>

      {/* Scenario Comparison */}
      <ScenarioComparison />
    </div>
  );
}
