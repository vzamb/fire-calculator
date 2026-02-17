import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useFireStore } from '@/store/fireStore';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Flag } from 'lucide-react';
import { useT } from '@/lib/i18n';

interface Milestone {
  key: string;
  label: string;
  target: number; // portfolio target
  emoji: string;
  reached: boolean;
  age: number | null; // age when reached/expected
}

export function MilestoneTimeline() {
  const { inputs, result } = useFireStore();
  const t = useT();

  const milestones = useMemo((): Milestone[] => {
    const projections = result.yearlyProjections;
    const currentAge = inputs.personalInfo.currentAge;
    const expenses = inputs.expenses.monthlyExpenses;
    const emergencyTarget = expenses * 6; // 6 months emergency fund
    const halfFire = result.fireNumber / 2;

    const findAge = (target: number): { reached: boolean; age: number | null } => {
      // Check if already reached at start
      const startPortfolio = projections[0]?.portfolioValue ?? 0;
      if (startPortfolio >= target) {
        return { reached: true, age: currentAge };
      }
      for (const p of projections) {
        if (p.portfolioValue >= target) {
          return { reached: p.age <= currentAge, age: p.age };
        }
      }
      return { reached: false, age: null };
    };

    const ef = findAge(emergencyTarget);
    const first100k = findAge(100_000);
    const coastAge = result.coastFireAge;
    const coastReached = coastAge <= currentAge;
    const half = findAge(halfFire);
    const fire = {
      reached: result.fireAge <= currentAge,
      age: result.fireAge,
    };

    return [
      {
        key: 'emergency',
        label: t.milestoneEmergencyFund,
        target: emergencyTarget,
        emoji: '🛟',
        reached: ef.reached,
        age: ef.age,
      },
      {
        key: '100k',
        label: t.milestone100k,
        target: 100_000,
        emoji: '💎',
        reached: first100k.reached,
        age: first100k.age,
      },
      {
        key: 'coast',
        label: t.milestoneCoastFire,
        target: 0,
        emoji: '⛵',
        reached: coastReached,
        age: coastAge,
      },
      {
        key: 'half',
        label: t.milestoneHalfFire,
        target: halfFire,
        emoji: '🏔️',
        reached: half.reached,
        age: half.age,
      },
      {
        key: 'fire',
        label: t.milestoneFire,
        target: result.fireNumber,
        emoji: '🎯',
        reached: fire.reached,
        age: fire.age,
      },
    ];
  }, [inputs, result, t]);

  const currentAge = inputs.personalInfo.currentAge;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flag className="w-4 h-4 text-primary" />
          {t.milestoneTimeline}
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t.milestoneTimelineDesc}
        </p>
      </CardHeader>
      <CardContent>
        {/* Progress bar */}
        {(() => {
          const reachedCount = milestones.filter((m) => m.reached).length;
          const pct = (reachedCount / milestones.length) * 100;
          return (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-medium text-muted-foreground">
                  {reachedCount}/{milestones.length}
                </span>
                <span className="text-[10px] font-medium text-primary">
                  {Math.round(pct)}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })()}

        {/* Milestone cards */}
        <div className="grid grid-cols-5 gap-2">
          {milestones.map((m, i) => {
            const isPast = m.reached;
            const yearsAway = m.age !== null ? m.age - currentAge : null;
            const prev = milestones[i - 1];
            const isNext = !isPast && (i === 0 || (prev != null && (prev.reached || (prev.age !== null && prev.age! <= currentAge))));

            return (
              <div
                key={m.key}
                className={cn(
                  'relative flex flex-col items-center rounded-xl p-2.5 pt-3 transition-all border',
                  isPast
                    ? 'bg-primary/5 border-primary/25'
                    : isNext
                    ? 'bg-primary/[0.03] border-primary/15'
                    : 'bg-secondary/40 border-transparent'
                )}
              >
                {/* Emoji badge */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-xl mb-2 transition-all',
                    isPast
                      ? 'bg-primary/15 shadow-[0_0_12px_hsl(var(--primary)/0.15)]'
                      : isNext
                      ? 'bg-primary/10 animate-pulse'
                      : 'bg-secondary/80'
                  )}
                >
                  {m.emoji}
                </div>

                {/* Label */}
                <span className={cn(
                  'text-[11px] font-semibold text-center leading-tight',
                  isPast ? 'text-primary' : 'text-foreground'
                )}>
                  {m.label}
                </span>

                {/* Status */}
                <span className={cn(
                  'text-[10px] mt-1',
                  isPast ? 'text-primary/80 font-medium' : 'text-muted-foreground'
                )}>
                  {isPast
                    ? t.milestoneReached
                    : m.age !== null
                    ? yearsAway !== null && yearsAway > 0
                      ? t.milestoneYearsAway(yearsAway)
                      : t.milestoneAtAge(m.age)
                    : '—'}
                </span>

                {/* Target amount */}
                {m.target > 0 && (
                  <span className="text-[9px] text-muted-foreground/60 mt-0.5">
                    {formatCurrency(m.target)}
                  </span>
                )}

                {/* Reached checkmark */}
                {isPast && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
