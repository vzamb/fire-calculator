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
import { TrendingUp } from 'lucide-react';
import { useFireStore } from '@/store/fireStore';
import { cn } from '@/lib/utils';

interface ProjectionChartProps {
  result: FireResult;
}

export function ProjectionChart({ result }: ProjectionChartProps) {
  const t = useT();
  const { showRealValues, toggleRealValues, inputs } = useFireStore();
  const inflation = inputs.expenses.annualInflationRate / 100;
  const isBridgeStrategy = result.bridgeGap > 0;

  const deflate = (value: number, yearIdx: number) =>
    showRealValues ? value / Math.pow(1 + inflation, yearIdx) : value;

  const data = result.yearlyProjections.map((p, idx) => ({
    age: p.age,
    year: p.year,
    base: Math.round(deflate(p.portfolioValue, idx)),
    optimistic: Math.round(deflate(p.portfolioOptimistic, idx)),
    pessimistic: Math.round(deflate(p.portfolioPessimistic, idx)),
    isRetired: p.isRetired,
  }));

  const fireYearIdx = result.yearlyProjections.findIndex((p) => p.age === result.fireAge);
  const fireTarget = Math.round(deflate(result.fireNumber, fireYearIdx >= 0 ? fireYearIdx : 0));

  const fireProjection = result.yearlyProjections.find(
    (p) => p.age === result.fireAge
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            {t.netWorthProjection}
          </CardTitle>
          <button
            onClick={toggleRealValues}
            className={cn(
              'text-[11px] font-medium px-2.5 py-1 rounded-md border transition-colors',
              showRealValues
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {showRealValues ? t.realValues : t.nominalValues}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {isBridgeStrategy ? t.netWorthProjectionDescBridge : t.netWorthProjectionDesc}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOpt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
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
                label={{
                  value: t.ageAxis,
                  position: 'insideBottom',
                  offset: -5,
                  style: {
                    fontSize: 12,
                    fill: 'hsl(var(--muted-foreground))',
                  },
                }}
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
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                formatter={(value) =>
                  value === 'base'
                    ? t.baseCase
                    : value === 'optimistic'
                    ? t.optimisticLabel
                    : t.pessimisticLabel
                }
              />

              {/* FIRE Number reference line */}
              <ReferenceLine
                y={fireTarget}
                stroke="hsl(24, 95%, 53%)"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                ifOverflow="extendDomain"
                label={isBridgeStrategy ? {
                  value: t.standardFireTarget,
                  position: 'insideTopLeft',
                  style: {
                    fontSize: 10,
                    fill: 'hsl(24, 95%, 53%)',
                    fontWeight: 600,
                  },
                } : undefined}
              />

              {/* FIRE Age reference line */}
              {fireProjection && (
                <ReferenceLine
                  x={result.fireAge}
                  stroke="hsl(24, 95%, 53%)"
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                  label={{
                    value: isBridgeStrategy ? `FIRE (${t.bridgeStrategyLabel})` : 'FIRE',
                    position: 'insideTopRight',
                    style: {
                      fontSize: 10,
                      fill: 'hsl(24, 95%, 53%)',
                      fontWeight: 600,
                    },
                  }}
                />
              )}

              <Area
                type="monotone"
                dataKey="pessimistic"
                stroke="hsl(0, 84%, 60%)"
                strokeWidth={1}
                fill="url(#colorPess)"
                strokeDasharray="4 4"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="optimistic"
                stroke="hsl(160, 60%, 45%)"
                strokeWidth={1}
                fill="url(#colorOpt)"
                strokeDasharray="4 4"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="base"
                stroke="hsl(24, 95%, 53%)"
                strokeWidth={2.5}
                fill="url(#colorBase)"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
