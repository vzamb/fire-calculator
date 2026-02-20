import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useFireStore } from '@/store/fireStore';
import { cn } from '@/lib/utils';
import { Flag } from 'lucide-react';
import { useT } from '@/lib/i18n';

interface Milestone {
  key: string;
  label: string;
  target: number; // portfolio target (0 for age-only milestones)
  emoji: string;
  reached: boolean;
  age: number | null; // age when reached/expected
  desc?: string; // optional short description
}

export function MilestoneTimeline() {
  const { inputs, result } = useFireStore();
  const t = useT();

  const milestones = useMemo((): Milestone[] => {
    const projections = result.yearlyProjections;
    const currentAge = inputs.personalInfo.currentAge;
    const expenses = inputs.expenses.monthlyExpenses;
    const emergencyTarget = expenses * inputs.assets.emergencyFundMonths;
    const halfFire = result.fireNumber / 2;
    const leanFire = result.fireNumber * 0.75;

    const findAge = (target: number): { reached: boolean; age: number | null } => {
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
    const coastAge = result.coastFireAge;
    const coastReached = coastAge <= currentAge;
    const half = findAge(halfFire);
    const lean = findAge(leanFire);
    const fire = {
      reached: result.fireAge <= currentAge,
      age: result.fireAge,
    };

    const raw: Milestone[] = [
      {
        key: 'emergency',
        label: t.milestoneEmergencyFund,
        target: emergencyTarget,
        emoji: '🛟',
        reached: ef.reached,
        age: ef.age,
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
        key: 'lean',
        label: t.milestoneLeanFire,
        target: leanFire,
        emoji: '🌿',
        reached: lean.reached,
        age: lean.age,
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

    // Sort by age reached (nulls = unreachable, go last)
    return raw.sort((a, b) => {
      const ageA = a.age ?? Infinity;
      const ageB = b.age ?? Infinity;
      return ageA - ageB;
    });
  }, [inputs, result, t]);

  const currentAge = inputs.personalInfo.currentAge;
  const nextIdx = milestones.findIndex((m) => !m.reached);
  const reachedCount = milestones.filter((m) => m.reached).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Flag className="w-4 h-4 text-primary" />
            {t.milestoneTimeline}
          </CardTitle>
          <span className="text-xs font-medium text-primary">{reachedCount}/{milestones.length}</span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Horizontal timeline */}
        <div className="flex items-start">
          {milestones.map((m, i) => {
            const isPast = m.reached;
            const isNext = i === nextIdx;
            const isLast = i === milestones.length - 1;
            const yearsAway = m.age !== null ? m.age - currentAge : null;

            return (
              <div key={m.key} className="flex-1 flex flex-col items-center min-w-0">
                {/* Row 1: emoji */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0 transition-all',
                    isPast
                      ? 'bg-primary/15 shadow-[0_0_8px_hsl(var(--primary)/0.2)]'
                      : isNext
                      ? 'bg-primary/10'
                      : 'bg-secondary/80'
                  )}
                >
                  {m.emoji}
                </div>

                {/* Row 2: dot + connector line */}
                <div className="flex items-center w-full mt-2 mb-2">
                  {/* Left connector */}
                  {i > 0 ? (
                    <div className={cn(
                      'flex-1 h-0.5 transition-colors',
                      isPast ? 'bg-primary/50' : 'bg-border'
                    )} />
                  ) : <div className="flex-1" />}

                  {/* Dot */}
                  <div
                    className={cn(
                      'w-2.5 h-2.5 rounded-full border-2 shrink-0 transition-all',
                      isPast
                        ? 'bg-primary border-primary'
                        : isNext
                        ? 'bg-background border-primary animate-pulse'
                        : 'bg-background border-muted-foreground/30'
                    )}
                  />

                  {/* Right connector */}
                  {!isLast ? (
                    <div className={cn(
                      'flex-1 h-0.5 transition-colors',
                      isPast && milestones[i + 1]?.reached ? 'bg-primary/50' : 'bg-border'
                    )} />
                  ) : <div className="flex-1" />}
                </div>

                {/* Row 3: label + status */}
                <span className={cn(
                  'text-[10px] font-semibold text-center leading-tight',
                  isPast ? 'text-primary' : 'text-foreground'
                )}>
                  {m.label}
                </span>
                <span className={cn(
                  'text-[9px] mt-0.5 text-center',
                  isPast ? 'text-primary/70' : 'text-muted-foreground'
                )}>
                  {isPast
                    ? '✓'
                    : m.age !== null
                    ? yearsAway !== null && yearsAway > 0
                      ? t.milestoneYearsAway(yearsAway)
                      : t.milestoneAtAge(m.age)
                    : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
