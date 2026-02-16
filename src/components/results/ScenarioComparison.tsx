import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useFireStore } from '@/store/fireStore';
import { calculateFire } from '@/lib/calculator';
import { formatCurrency, formatYears } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Sparkles, Minus, Plus } from 'lucide-react';
import { useT } from '@/lib/i18n';
import type { FireInputs } from '@/types';

interface ScenarioConfig {
  id: string;
  emoji: string;
  labelKey: string;
  defaultValue: number;
  step: number;
  min: number;
  max: number;
  unit: string;
  format: (v: number) => string;
  apply: (inputs: FireInputs, value: number) => void;
}

const SCENARIOS: ScenarioConfig[] = [
  {
    id: 'extra-investment',
    emoji: '💰',
    labelKey: 'scenarioExtraInvestment',
    defaultValue: 200,
    step: 50,
    min: -1000,
    max: 2000,
    unit: '€/mo',
    format: (v) => `${v >= 0 ? '+' : ''}${v}`,
    apply: (inputs, value) => {
      inputs.fireGoals.monthlyInvestment += value;
    },
  },
  {
    id: 'return-rate',
    emoji: '📈',
    labelKey: 'scenarioReturnRate',
    defaultValue: 5,
    step: 0.5,
    min: 1,
    max: 15,
    unit: '%',
    format: (v) => `${v}`,
    apply: (inputs, value) => {
      inputs.investmentStrategy.expectedAnnualReturn = value;
    },
  },
  {
    id: 'expense-change',
    emoji: '✂️',
    labelKey: 'scenarioExpenseChange',
    defaultValue: -10,
    step: 5,
    min: -50,
    max: 50,
    unit: '%',
    format: (v) => `${v >= 0 ? '+' : ''}${v}`,
    apply: (inputs, value) => {
      inputs.expenses.monthlyExpenses *= 1 + value / 100;
    },
  },
  {
    id: 'swr',
    emoji: '🛡️',
    labelKey: 'scenarioSWR',
    defaultValue: 3.5,
    step: 0.25,
    min: 2,
    max: 6,
    unit: '%',
    format: (v) => `${v}`,
    apply: (inputs, value) => {
      inputs.fireGoals.safeWithdrawalRate = value;
    },
  },
];

export function ScenarioComparison() {
  const { inputs, result } = useFireStore();
  const t = useT();

  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(SCENARIOS.map((s) => [s.id, s.defaultValue]))
  );

  const updateValue = (id: string, delta: number, scenario: ScenarioConfig) => {
    setValues((prev) => ({
      ...prev,
      [id]: Math.min(
        scenario.max,
        Math.max(scenario.min, +((prev[id] ?? scenario.defaultValue) + delta).toFixed(2))
      ),
    }));
  };

  const scenarioResults = useMemo(() => {
    return SCENARIOS.map((scenario) => {
      const modifiedInputs: FireInputs = JSON.parse(JSON.stringify(inputs));
      const value = values[scenario.id] ?? scenario.defaultValue;
      scenario.apply(modifiedInputs, value);
      const scenarioResult = calculateFire(modifiedInputs);
      return {
        ...scenario,
        value,
        result: scenarioResult,
        diff: result ? scenarioResult.yearsToFire - result.yearsToFire : 0,
      };
    });
  }, [inputs, result, values]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          {t.whatIfScenarios}
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          {t.whatIfScenariosDesc}
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground py-3 pr-4">
                  {t.scenario}
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground py-3 px-4">
                  {t.fireAge}
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground py-3 px-4">
                  {t.timeToFire}
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground py-3 px-4">
                  {t.fireNumber}
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground py-3 pl-4">
                  {t.difference}
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Current baseline */}
              <tr className="border-b border-border bg-secondary/30">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <span>🎯</span>
                    <div>
                      <p className="text-sm font-semibold">{t.currentPlan}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.yourBaseline}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="text-right py-3 px-4 text-sm font-semibold">
                  {result.fireAge}
                </td>
                <td className="text-right py-3 px-4 text-sm">
                  {formatYears(result.yearsToFire)}
                </td>
                <td className="text-right py-3 px-4 text-sm">
                  {formatCurrency(result.fireNumber)}
                </td>
                <td className="text-right py-3 pl-4 text-sm text-muted-foreground">
                  —
                </td>
              </tr>

              {/* Scenario rows with inline controls */}
              {scenarioResults.map((scenario) => (
                <tr
                  key={scenario.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors"
                >
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{scenario.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {(t as any)[scenario.labelKey]}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <button
                            onClick={() =>
                              updateValue(scenario.id, -scenario.step, scenario)
                            }
                            disabled={scenario.value <= scenario.min}
                            className="w-5 h-5 rounded flex items-center justify-center bg-secondary hover:bg-secondary/80 disabled:opacity-30 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono font-semibold text-primary min-w-[4.5rem] text-center tabular-nums">
                            {scenario.format(scenario.value)} {scenario.unit}
                          </span>
                          <button
                            onClick={() =>
                              updateValue(scenario.id, scenario.step, scenario)
                            }
                            disabled={scenario.value >= scenario.max}
                            className="w-5 h-5 rounded flex items-center justify-center bg-secondary hover:bg-secondary/80 disabled:opacity-30 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4 text-sm font-semibold">
                    {scenario.result.fireAge}
                  </td>
                  <td className="text-right py-3 px-4 text-sm">
                    {formatYears(scenario.result.yearsToFire)}
                  </td>
                  <td className="text-right py-3 px-4 text-sm">
                    {formatCurrency(scenario.result.fireNumber)}
                  </td>
                  <td className="text-right py-3 pl-4">
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        scenario.diff < 0
                          ? 'text-emerald-500'
                          : scenario.diff > 0
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                      )}
                    >
                      {scenario.diff < 0
                        ? t.sooner(Math.abs(scenario.diff).toFixed(1))
                        : scenario.diff > 0
                        ? t.later(scenario.diff.toFixed(1))
                        : t.same}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
