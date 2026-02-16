import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrencyCompact, formatCurrency } from '@/lib/formatters';
import type { FireResult } from '@/types';
import { useT } from '@/lib/i18n';
import { Scale } from 'lucide-react';

interface IncomeExpenseChartProps {
  result: FireResult;
}

export function IncomeExpenseChart({ result }: IncomeExpenseChartProps) {
  const t = useT();
  // Show only accumulation years + a few post-retirement
  const data = result.yearlyProjections
    .filter((p) => !p.isRetired || p.age <= result.fireAge + 5)
    .map((p) => ({
      age: p.age,
      passiveIncome: Math.round(p.passiveIncome),
      livingExpenses: Math.round(p.annualExpenses),
      debtPayments: Math.round(p.annualDebtPayments),
      totalSpending: Math.round(p.annualExpenses + p.annualDebtPayments),
      totalIncome: Math.round(p.totalIncome),
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-primary" />
          {t.incomeVsExpenses}
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          {t.incomeVsExpensesDesc}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPassive" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(160, 60%, 45%)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(160, 60%, 45%)"
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
                  name === 'passiveIncome'
                    ? t.passiveIncome
                    : name === 'livingExpenses'
                    ? t.livingExpenses
                    : name === 'debtPayments'
                    ? t.debtPaymentsChart
                    : t.totalSpending,
                ]}
                labelFormatter={(age) => `${t.ageLabel} ${age}`}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                formatter={(value) =>
                  value === 'passiveIncome'
                    ? t.passiveIncome
                    : value === 'livingExpenses'
                    ? t.livingExpenses
                    : value === 'debtPayments'
                    ? t.debtPaymentsChart
                    : t.totalSpending
                }
              />

              <ReferenceLine
                x={result.fireAge}
                stroke="hsl(24, 95%, 53%)"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                label={{
                  value: 'FIRE',
                  position: 'insideTopRight',
                  style: {
                    fontSize: 10,
                    fill: 'hsl(24, 95%, 53%)',
                    fontWeight: 600,
                  },
                }}
              />

              <Area
                type="monotone"
                dataKey="livingExpenses"
                stackId="spending"
                stroke="hsl(0, 84%, 60%)"
                strokeWidth={2}
                fill="hsl(0, 84%, 60%)"
                fillOpacity={0.15}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="debtPayments"
                stackId="spending"
                stroke="hsl(30, 90%, 55%)"
                strokeWidth={2}
                fill="hsl(30, 90%, 55%)"
                fillOpacity={0.2}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="passiveIncome"
                stroke="hsl(160, 60%, 45%)"
                strokeWidth={2}
                fill="url(#colorPassive)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
