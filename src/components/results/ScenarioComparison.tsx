import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useFireStore } from '@/store/fireStore';
import { calculateFire } from '@/lib/calculator';
import { formatCurrency, formatYears } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';
import { useT } from '@/lib/i18n';

interface ScenarioConfig {
  id: string;
  label: string;
  description: string;
  emoji: string;
}

const SCENARIOS: ScenarioConfig[] = [
  {
    id: 'invest-200-more',
    label: 'scenarioInvest200',
    description: 'scenarioInvest200Desc',
    emoji: '💰',
  },
  {
    id: 'invest-500-more',
    label: 'scenarioInvest500',
    description: 'scenarioInvest500Desc',
    emoji: '🚀',
  },
  {
    id: 'lower-returns',
    label: 'scenarioLowerReturns',
    description: 'scenarioLowerReturnsDesc',
    emoji: '📉',
  },
  {
    id: 'higher-returns',
    label: 'scenarioHigherReturns',
    description: 'scenarioHigherReturnsDesc',
    emoji: '📈',
  },
  {
    id: 'cut-expenses-10',
    label: 'scenarioCutExpenses',
    description: 'scenarioCutExpensesDesc',
    emoji: '✂️',
  },
  {
    id: 'higher-swr',
    label: 'scenarioSaferSWR',
    description: 'scenarioSaferSWRDesc',
    emoji: '🛡️',
  },
];

export function ScenarioComparison() {
  const { inputs, result } = useFireStore();
  const t = useT();
  const [enabledScenarios, setEnabledScenarios] = useState<Set<string>>(
    new Set(['invest-200-more', 'cut-expenses-10'])
  );

  const toggleScenario = (id: string) => {
    setEnabledScenarios((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const scenarioResults = useMemo(() => {
    return SCENARIOS.filter((s) => enabledScenarios.has(s.id)).map(
      (scenario) => {
        const modifiedInputs = JSON.parse(JSON.stringify(inputs));

        switch (scenario.id) {
          case 'invest-200-more':
            modifiedInputs.fireGoals.monthlyInvestment += 200;
            break;
          case 'invest-500-more':
            modifiedInputs.fireGoals.monthlyInvestment += 500;
            break;
          case 'lower-returns':
            modifiedInputs.investmentStrategy.expectedAnnualReturn = 5;
            modifiedInputs.investmentStrategy.riskProfile = 'conservative';
            break;
          case 'higher-returns':
            modifiedInputs.investmentStrategy.expectedAnnualReturn = 9;
            modifiedInputs.investmentStrategy.riskProfile = 'aggressive';
            break;
          case 'cut-expenses-10':
            modifiedInputs.expenses.monthlyExpenses *= 0.9;
            break;
          case 'higher-swr':
            modifiedInputs.fireGoals.safeWithdrawalRate = 3.5;
            break;
        }

        const scenarioResult = calculateFire(modifiedInputs);
        return {
          ...scenario,
          result: scenarioResult,
          diff: result ? scenarioResult.yearsToFire - result.yearsToFire : 0,
        };
      }
    );
  }, [inputs, result, enabledScenarios]);

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
        {/* Scenario toggles */}
        <div className="flex flex-wrap gap-2 mb-6">
          {SCENARIOS.map((scenario) => (
            <Button
              key={scenario.id}
              variant={enabledScenarios.has(scenario.id) ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleScenario(scenario.id)}
              className="text-xs"
            >
              {scenario.emoji} {(t as any)[scenario.label]}
            </Button>
          ))}
        </div>

        {/* Results table */}
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

              {/* Scenario rows */}
              {scenarioResults.map((scenario) => (
                <tr
                  key={scenario.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors"
                >
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <span>{scenario.emoji}</span>
                      <div>
                        <p className="text-sm font-medium">{(t as any)[scenario.label]}</p>
                        <p className="text-xs text-muted-foreground">
                          {(t as any)[scenario.description]}
                        </p>
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
