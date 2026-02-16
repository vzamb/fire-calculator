import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import type { FireResult } from '@/types';
import { useT } from '@/lib/i18n';

interface BreakdownChartProps {
  result: FireResult;
}

export function BreakdownChart({ result }: BreakdownChartProps) {
  const t = useT();
  const contributions = result.totalContributions;
  const growth = result.totalGrowth;
  const total = contributions + growth;

  const data = [
    { name: t.yourContributions, value: Math.max(0, Math.round(contributions)) },
    { name: t.investmentGrowth, value: Math.max(0, Math.round(growth)) },
  ];

  const COLORS = ['hsl(215, 70%, 55%)', 'hsl(160, 60%, 45%)'];

  const growthPercent = total > 0 ? (growth / total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-lg">🧩</span>
          {t.wealthBreakdown}
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          {t.wealthBreakdownDesc}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--popover-foreground))',
                    fontSize: '13px',
                  }}
                  formatter={(value: number) => [formatCurrency(value)]}
                />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: 'hsl(var(--foreground))' }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                {t.totalAtFire}
              </p>
              <p className="text-3xl font-bold">{formatCurrency(total)}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[0] }}
                  />
                  <span className="text-sm">{t.yourContributions}</span>
                </div>
                <span className="text-sm font-semibold">
                  {formatCurrency(contributions)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[1] }}
                  />
                  <span className="text-sm">{t.investmentGrowth}</span>
                </div>
                <span className="text-sm font-semibold">
                  {formatCurrency(growth)}
                </span>
              </div>
            </div>

            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <span className="text-emerald-500 font-bold text-lg">
                  {formatPercent(growthPercent)}
                </span>{' '}
                {t.growthPercent(formatPercent(growthPercent)).split(formatPercent(growthPercent))[1]}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
