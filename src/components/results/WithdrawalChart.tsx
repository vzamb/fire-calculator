import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrencyCompact, formatCurrency } from '@/lib/formatters';
import type { FireResult } from '@/types';
import { useFireStore } from '@/store/fireStore';
import { useT } from '@/lib/i18n';

interface WithdrawalChartProps {
  result: FireResult;
}

export function WithdrawalChart({ result }: WithdrawalChartProps) {
  const { inputs } = useFireStore();
  const t = useT();
  const retirementData = result.yearlyProjections
    .filter((p) => p.isRetired)
    .map((p) => ({
      age: p.age,
      base: Math.round(p.portfolioValue),
      optimistic: Math.round(p.portfolioOptimistic),
      pessimistic: Math.round(p.portfolioPessimistic),
    }));

  if (retirementData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">🏖️</span>
            {t.postRetirementPortfolio}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-8">
            {t.adjustInputsHint}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <span className="text-lg">🏖️</span>
            {t.postRetirementPortfolio}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {t.postRetirementPortfolioDesc}
          </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={retirementData}
              margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRetBase" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(24, 95%, 53%)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(24, 95%, 53%)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="age"
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(v) => formatCurrencyCompact(v)}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                width={65}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--popover-foreground))',
                  fontSize: '13px',
                }}
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === 'base'
                    ? t.baseCase
                    : name === 'optimistic'
                    ? t.optimistic
                    : t.pessimistic,
                ]}
                labelFormatter={(age) => `${t.ageLabel} ${age}`}
              />

              {/* Pension start */}
              {inputs.income.pensionStartAge > result.fireAge && (
                <ReferenceLine
                  x={inputs.income.pensionStartAge}
                  stroke="hsl(160, 60%, 45%)"
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                  label={{
                    value: t.pension,
                    position: 'insideTopRight',
                    style: {
                      fontSize: 10,
                      fill: 'hsl(160, 60%, 45%)',
                      fontWeight: 600,
                    },
                  }}
                />
              )}

              <ReferenceLine
                y={0}
                stroke="hsl(0, 84%, 60%)"
                strokeWidth={1}
              />

              <Area
                type="monotone"
                dataKey="pessimistic"
                stroke="hsl(0, 84%, 60%)"
                strokeWidth={1}
                fill="none"
                strokeDasharray="4 4"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="optimistic"
                stroke="hsl(160, 60%, 45%)"
                strokeWidth={1}
                fill="none"
                strokeDasharray="4 4"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="base"
                stroke="hsl(24, 95%, 53%)"
                strokeWidth={2.5}
                fill="url(#colorRetBase)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <span>
            {t.successRateLabel}:{' '}
            <span
              className={
                result.successRate >= 95
                  ? 'text-emerald-500 font-semibold'
                  : result.successRate >= 80
                  ? 'text-amber-500 font-semibold'
                  : 'text-destructive font-semibold'
              }
            >
              {result.successRate.toFixed(0)}%
            </span>
          </span>
          <span>
            {t.portfolioAtAge(inputs.personalInfo.lifeExpectancy)}:{' '}
            <span className="font-medium text-foreground">
              {formatCurrency(result.portfolioAt90)}
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
