import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/Card';
import { formatCurrency, formatYears, formatDate, formatPercent } from '@/lib/formatters';
import type { FireResult } from '@/types';
import { Target, Calendar, TrendingUp, Percent, Anchor, HelpCircle, type LucideIcon } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { useT } from '@/lib/i18n';

interface SummaryCardsProps {
  result: FireResult;
}

interface CardDef {
  key: string;
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  getValue: (r: FireResult) => string;
  getSubtext: (r: FireResult) => string;
  tooltip: string;
}

export function SummaryCards({ result }: SummaryCardsProps) {
  const t = useT();

  const cards: CardDef[] = [
    {
      key: 'fireAge',
      label: t.fireAge,
      icon: Calendar,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      getValue: (r) => `${t.ageLabel} ${r.fireAge}`,
      getSubtext: (r) => formatDate(r.fireDate),
      tooltip: t.fireAgeTooltip,
    },
    {
      key: 'fireNumber',
      label: t.fireNumber,
      icon: Target,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      getValue: (r) => formatCurrency(r.fireNumber),
      getSubtext: (r) => t.atAge(r.fireAge, formatCurrency(r.fireNumberToday)),
      tooltip: t.fireNumberTooltip,
    },
    {
      key: 'yearsToFire',
      label: t.timeToFire,
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      getValue: (r) => formatYears(r.yearsToFire),
      getSubtext: (r) => t.investingPerMonth(Math.round(r.monthlySavings).toLocaleString('de-DE')),
      tooltip: t.timeToFireTooltip,
    },
    {
      key: 'savingsRate',
      label: t.savingsRate,
      icon: Percent,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
      getValue: (r) => formatPercent(r.currentSavingsRate),
      getSubtext: (r) =>
        r.currentSavingsRate >= 50
          ? t.savingsExcellent
          : r.currentSavingsRate >= 30
          ? t.savingsGreat
          : r.currentSavingsRate >= 15
          ? t.savingsGood
          : t.savingsGrow,
      tooltip: t.savingsRateTooltip,
    },
    {
      key: 'coastFire',
      label: t.coastFire,
      icon: Anchor,
      color: 'text-teal-500',
      bgColor: 'bg-teal-500/10',
      getValue: (r) => `${t.ageLabel} ${r.coastFireAge}`,
      getSubtext: () => t.coastFireSubtext(65),
      tooltip: t.coastFireTooltip,
    },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4 }}
        >
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded-lg ${card.bgColor}`}
                >
                  <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground flex-1">
                  {card.label}
                </span>
                <Tooltip content={card.tooltip}>
                  <HelpCircle className="w-3 h-3" />
                </Tooltip>
              </div>
              <p className="text-lg sm:text-xl font-bold tracking-tight animate-count-up">
                {card.getValue(result)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {card.getSubtext(result)}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
