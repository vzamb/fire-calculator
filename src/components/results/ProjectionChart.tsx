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

interface ProjectionChartProps {
  result: FireResult;
}

export function ProjectionChart({ result }: ProjectionChartProps) {
  const t = useT();
  const isBridgeStrategy = result.bridgeGap > 0;
  const data = result.yearlyProjections.map((p) => ({
    age: p.age,
    year: p.year,
    base: Math.round(p.portfolioValue),
    optimistic: Math.round(p.portfolioOptimistic),
    pessimistic: Math.round(p.portfolioPessimistic),
    isRetired: p.isRetired,
  }));

  const fireProjection = result.yearlyProjections.find(
    (p) => p.age === result.fireAge
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-lg">📈</span>
          {t.netWorthProjection}
        </CardTitle>
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
                y={result.fireNumber}
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

              {/* Bridge strategy: actual entry portfolio at FIRE age */}
              {isBridgeStrategy && fireProjection && (
                <ReferenceLine
                  y={fireProjection.portfolioValue}
                  stroke="hsl(160, 60%, 45%)"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                  ifOverflow="extendDomain"
                  label={{
                    value: t.bridgeEntryLevel,
                    position: 'insideTopRight',
                    style: {
                      fontSize: 10,
                      fill: 'hsl(160, 60%, 45%)',
                      fontWeight: 600,
                    },
                  }}
                />
              )}

              {/* FIRE Age reference line */}
              {fireProjection && (
                <ReferenceLine
                  x={result.fireAge}
                  stroke="hsl(24, 95%, 53%)"
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                  label={{
                    value: isBridgeStrategy ? `🔥 FIRE (${t.bridgeStrategyLabel})` : `🔥 FIRE`,
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
