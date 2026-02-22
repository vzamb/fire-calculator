import { useState } from 'react';
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
import { cn } from '@/lib/utils';
import { useFireStore } from '@/store/fireStore';
import { useMonteCarloWorker } from '@/lib/useMonteCarloWorker';
import { Dice5, Loader2 } from 'lucide-react';
import { useT } from '@/lib/i18n';

export function MonteCarloChart() {
  const { inputs, result } = useFireStore();
  const t = useT();
  const volatilityLabel = inputs.investmentStrategy.annualVolatility.toFixed(1);

  // Target FIRE age slider — null means "use computed FIRE age"
  const [targetAge, setTargetAge] = useState<number | null>(null);
  const effectiveTarget = targetAge ?? result.fireAge;
  const isCustomTarget = targetAge !== null && targetAge !== result.fireAge;

  // Off-thread computation — never blocks the main thread.
  // Always pass effectiveTarget so the simulation is consistent whether
  // the user has touched the slider or not (forced-retirement mode).
  const { mc, isComputing } = useMonteCarloWorker(inputs, 500, effectiveTarget);

  // While the worker hasn't returned yet, show nothing on the chart but
  // keep all controls interactive.
  const data = mc
    ? mc.ages.map((age, i) => ({
        age,
        p10: Math.round(mc.percentiles.p10[i] ?? 0),
        p25: Math.round(mc.percentiles.p25[i] ?? 0),
        p50: Math.round(mc.percentiles.p50[i] ?? 0),
        p75: Math.round(mc.percentiles.p75[i] ?? 0),
        p90: Math.round(mc.percentiles.p90[i] ?? 0),
      }))
    : [];

  const successRate = mc?.successRate ?? 0;
  const numSimulations = mc?.numSimulations ?? 500;
  const successColor = successRate >= 90
    ? 'text-emerald-500'
    : successRate >= 70
    ? 'text-amber-500'
    : 'text-destructive';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dice5 className="w-4 h-4 text-primary" />
          {t.monteCarloTitle}
          {isComputing && <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />}
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          {t.monteCarloDesc(volatilityLabel)}
        </p>
      </CardHeader>
      <CardContent>
        {/* Target FIRE age slider */}
        <div className="mb-4 px-1">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-foreground">
              {t.monteCarloTargetAge}
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-primary tabular-nums">
                {effectiveTarget}
              </span>
              {isCustomTarget && (
                <button
                  onClick={() => setTargetAge(null)}
                  className="text-[10px] text-muted-foreground hover:text-foreground underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          <input
            type="range"
            min={inputs.personalInfo.currentAge + 1}
            max={inputs.personalInfo.lifeExpectancy}
            value={effectiveTarget}
            onChange={(e) => setTargetAge(Number(e.target.value))}
            className="w-full h-1.5 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[9px] text-muted-foreground/60 mt-0.5">
            <span>{inputs.personalInfo.currentAge + 1}</span>
            <span>{inputs.personalInfo.lifeExpectancy}</span>
          </div>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className={`text-2xl font-bold ${successColor}`}>
              {mc ? successRate.toFixed(0) : '—'}%
            </p>
            <p className="text-[10px] text-muted-foreground">{t.monteCarloSuccess}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {effectiveTarget}
            </p>
            <p className="text-[10px] text-muted-foreground">{t.fireAge}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-muted-foreground">
              {numSimulations}
            </p>
            <p className="text-[10px] text-muted-foreground">{t.monteCarloSimulations}</p>
          </div>
        </div>

        <div className={cn('h-[350px] w-full transition-opacity duration-300', isComputing && 'opacity-40')}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="mc-outer" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="mc-inner" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.06} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.5}
              />
              <XAxis
                dataKey="age"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                label={{
                  value: t.ageAxis,
                  position: 'insideBottom',
                  offset: -2,
                  style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' },
                }}
              />
              <YAxis
                tickFormatter={formatCurrencyCompact}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                width={65}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name,
                ]}
                labelFormatter={(age) => `${t.ageLabel} ${age}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />

              {/* 10th-90th percentile band (outer) */}
              <Area
                type="monotone"
                dataKey="p90"
                stroke="none"
                fill="url(#mc-outer)"
                name={t.monteCarloP90}
              />
              <Area
                type="monotone"
                dataKey="p10"
                stroke="none"
                fill="hsl(var(--background))"
                name={t.monteCarloP10}
              />

              {/* 25th-75th percentile band (inner) */}
              <Area
                type="monotone"
                dataKey="p75"
                stroke="none"
                fill="url(#mc-inner)"
                name={t.monteCarloP75}
              />
              <Area
                type="monotone"
                dataKey="p25"
                stroke="none"
                fill="hsl(var(--background))"
                name={t.monteCarloP25}
              />

              {/* Median line */}
              <Area
                type="monotone"
                dataKey="p50"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="none"
                name={t.monteCarloP50}
                dot={false}
              />

              {/* FIRE age reference */}
              <ReferenceLine
                x={effectiveTarget}
                stroke="hsl(var(--primary))"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
                label={{
                  value: `FIRE ${effectiveTarget}`,
                  position: 'top',
                  style: {
                    fontSize: 10,
                    fill: 'hsl(var(--primary))',
                    fontWeight: 600,
                  },
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          {t.monteCarloFootnote(volatilityLabel)}
        </p>
      </CardContent>
    </Card>
  );
}
