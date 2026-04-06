import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Play } from 'lucide-react';
import { useFireStore } from '@/store/fireStore';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { FireInputs } from '@/types';
import {
  DEFAULT_INVESTMENT_STRATEGY,
} from '@/lib/constants';

// ─── Example Scenarios ───
// Each scenario is a full FireInputs object that users can load with one click.

function makeScenario(overrides: Partial<{
  age: number;
  lifeExpectancy: number;
  salary: number;
  salaryGrowth: number;
  additionalIncome: number;
  annualBonus: number;
  pensions: FireInputs['income']['pensions'];
  monthlyExpenses: number;
  inflation: number;
  postRetirementPercent: number;
  investedAssets: number;
  cashSavings: number;
  monthlyInvestment: number;
  swr: number;
  fireType: FireInputs['fireGoals']['fireType'];
  depletePortfolio: boolean;
  riskProfile: FireInputs['investmentStrategy']['riskProfile'];
  annualFees: number;
  capitalGainsTax: number;
  debts: FireInputs['assets']['debts'];
  realEstate: FireInputs['assets']['realEstateAssets'];
  recurringIncomes: FireInputs['fireGoals']['recurringIncomes'];
}>): FireInputs {
  return {
    personalInfo: {
      currentAge: overrides.age ?? 30,
      lifeExpectancy: overrides.lifeExpectancy ?? 90,
    },
    income: {
      monthlyNetSalary: overrides.salary ?? 2500,
      annualSalaryGrowth: overrides.salaryGrowth ?? 2,
      additionalMonthlyIncome: overrides.additionalIncome ?? 0,
      annualBonus: overrides.annualBonus ?? 0,
      pensions: overrides.pensions ?? [
        { id: 'default', name: 'State Pension', monthlyAmount: 800, startAge: 67 },
      ],
    },
    expenses: {
      monthlyExpenses: overrides.monthlyExpenses ?? 1800,
      annualInflationRate: overrides.inflation ?? 2.5,
      postRetirementExpensePercent: overrides.postRetirementPercent ?? 100,
    },
    assets: {
      investedAssets: overrides.investedAssets ?? 20000,
      cashSavings: overrides.cashSavings ?? 10000,
      customAssets: [],
      debts: overrides.debts ?? [],
      emergencyFundMonths: 6,
      realEstateAssets: overrides.realEstate ?? [],
    },
    investmentStrategy: {
      ...DEFAULT_INVESTMENT_STRATEGY,
      annualFees: overrides.annualFees ?? 0.3,
      capitalGainsTaxRate: overrides.capitalGainsTax ?? 26,
    },
    fireGoals: {
      safeWithdrawalRate: overrides.swr ?? 4,
      fireType: overrides.fireType ?? 'regular',
      monthlyInvestment: overrides.monthlyInvestment ?? 700,
      depletePortfolio: overrides.depletePortfolio ?? true,
      futureExpenses: [],
      futureIncomes: [],
      recurringIncomes: overrides.recurringIncomes ?? [],
    },
  };
}

interface GuidedExamplesProps {
  open: boolean;
  onClose: () => void;
}

function ConceptSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors"
      >
        {title}
        <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
      </button>
      {expanded && (
        <div className="px-4 pb-3 text-xs text-muted-foreground leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

export function GuidedExamples({ open, onClose }: GuidedExamplesProps) {
  const { setInputs } = useFireStore();
  const t = useT();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!open) return null;

  const loadScenario = (scenario: FireInputs) => {
    setInputs(scenario);
    onClose();
  };

  const scenarios: Array<{ key: string; emoji: string; inputs: FireInputs }> = [
    {
      key: 'freshGraduate',
      emoji: '🎓',
      inputs: makeScenario({
        age: 24,
        salary: 1800,
        salaryGrowth: 3,
        monthlyExpenses: 1300,
        investedAssets: 2000,
        cashSavings: 3000,
        monthlyInvestment: 400,
        pensions: [{ id: 'p1', name: 'State Pension', monthlyAmount: 600, startAge: 67 }],
      }),
    },
    {
      key: 'midCareer',
      emoji: '💼',
      inputs: makeScenario({
        age: 35,
        salary: 3500,
        salaryGrowth: 2,
        annualBonus: 5000,
        monthlyExpenses: 2200,
        investedAssets: 80000,
        cashSavings: 15000,
        monthlyInvestment: 900,
        pensions: [{ id: 'p1', name: 'State Pension', monthlyAmount: 900, startAge: 67 }],
        debts: [{ id: 'd1', name: 'Mortgage', balance: 180000, interestRate: 2.5, monthlyPayment: 750, remainingYears: 22 }],
      }),
    },
    {
      key: 'aggressiveSaver',
      emoji: '🚀',
      inputs: makeScenario({
        age: 28,
        salary: 4500,
        salaryGrowth: 3,
        annualBonus: 10000,
        monthlyExpenses: 1500,
        investedAssets: 60000,
        cashSavings: 20000,
        monthlyInvestment: 2500,
        fireType: 'lean',
        swr: 3.5,
        pensions: [{ id: 'p1', name: 'State Pension', monthlyAmount: 700, startAge: 67 }],
      }),
    },
    {
      key: 'baristaFire',
      emoji: '☕',
      inputs: makeScenario({
        age: 32,
        salary: 3000,
        salaryGrowth: 2,
        monthlyExpenses: 1800,
        investedAssets: 120000,
        cashSavings: 10000,
        monthlyInvestment: 900,
        pensions: [{ id: 'p1', name: 'State Pension', monthlyAmount: 800, startAge: 67 }],
        recurringIncomes: [
          { id: 'r1', name: 'Part-time work', monthlyAmount: 800, startAge: 45, annualGrowthRate: 1, includeInFire: true },
        ],
      }),
    },
    {
      key: 'lateStarter',
      emoji: '⏰',
      inputs: makeScenario({
        age: 45,
        salary: 3200,
        salaryGrowth: 1,
        monthlyExpenses: 2500,
        investedAssets: 30000,
        cashSavings: 8000,
        monthlyInvestment: 600,
        depletePortfolio: true,
        pensions: [
          { id: 'p1', name: 'State Pension', monthlyAmount: 1000, startAge: 67 },
          { id: 'p2', name: 'Company Pension', monthlyAmount: 400, startAge: 65 },
        ],
      }),
    },
    {
      key: 'dualIncome',
      emoji: '👫',
      inputs: makeScenario({
        age: 30,
        salary: 5500,
        salaryGrowth: 2,
        annualBonus: 8000,
        monthlyExpenses: 3000,
        investedAssets: 50000,
        cashSavings: 25000,
        monthlyInvestment: 2000,
        fireType: 'fat',
        postRetirementPercent: 120,
        pensions: [
          { id: 'p1', name: 'Partner 1 Pension', monthlyAmount: 900, startAge: 67 },
          { id: 'p2', name: 'Partner 2 Pension', monthlyAmount: 800, startAge: 67 },
        ],
        realEstate: [
          { id: 're1', name: 'Rental Apartment', propertyValue: 200000, monthlyNetIncome: 600, annualAppreciation: 2 },
        ],
      }),
    },
  ];

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[5vh] sm:pt-[10vh] px-4"
    >
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-bold">{t.guidePanelTitle}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-6">

          {/* ─── How It Works ─── */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3">{t.guideHowItWorksTitle}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">{t.guideHowItWorksBody}</p>
            <div className="space-y-2">
              <ConceptSection title={t.guideConceptFireNumberTitle}>
                <p>{t.guideConceptFireNumberBody}</p>
              </ConceptSection>
              <ConceptSection title={t.guideConceptProjectionsTitle}>
                <p>{t.guideConceptProjectionsBody}</p>
              </ConceptSection>
              <ConceptSection title={t.guideConceptMonteCarloTitle}>
                <p>{t.guideConceptMonteCarloBody}</p>
              </ConceptSection>
              <ConceptSection title={t.guideConceptPensionsTitle}>
                <p>{t.guideConceptPensionsBody}</p>
              </ConceptSection>
            </div>
          </section>

          {/* ─── Key Concepts ─── */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3">{t.guideConceptsTitle}</h3>
            <div className="space-y-2">
              <ConceptSection title={t.guideConceptFireTitle}>
                <p>{t.guideConceptFireBody}</p>
              </ConceptSection>
              <ConceptSection title={t.guideConceptSwrTitle}>
                <p>{t.guideConceptSwrBody}</p>
              </ConceptSection>
              <ConceptSection title={t.guideConceptCoastTitle}>
                <p>{t.guideConceptCoastBody}</p>
              </ConceptSection>
              <ConceptSection title={t.guideConceptPortfolioStrategyTitle}>
                <p>{t.guideConceptPortfolioStrategyBody}</p>
              </ConceptSection>
            </div>
          </section>

          {/* ─── Example Scenarios ─── */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-1">{t.guideExamplesTitle}</h3>
            <p className="text-xs text-muted-foreground mb-3">{t.guideExamplesDesc}</p>
            <div className="grid gap-2">
              {scenarios.map((s) => (
                <button
                  key={s.key}
                  onClick={() => loadScenario(s.inputs)}
                  className="group flex items-start gap-3 w-full text-left px-4 py-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  <span className="text-lg mt-0.5 shrink-0">{s.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {t[`guideScenario_${s.key}` as keyof typeof t] as string}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {t[`guideScenario_${s.key}_desc` as keyof typeof t] as string}
                    </div>
                  </div>
                  <Play className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 mt-1 transition-colors" />
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
