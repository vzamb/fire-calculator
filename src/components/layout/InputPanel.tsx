import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, User, Wallet, Receipt, Landmark, TrendingUp, Target, PiggyBank, CalendarClock, Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFireStore } from '@/store/fireStore';
import { useUIStore } from '@/store/uiStore';
import { Slider } from '@/components/ui/Slider';
import { CurrencyInput, PercentInput, NumberInput } from '@/components/shared/FormFields';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';
import { RISK_PROFILES, FIRE_TYPES, ASSET_CLASSES, computePortfolioStats, geometricReturn, DEFAULT_ASSET_RETURNS } from '@/lib/constants';
import type { RiskProfile, FireType, AssetClassKey, AssetReturns, Debt, FutureExpense, FutureIncome, Pension, RecurringIncome, RealEstateAsset } from '@/types';
import { formatCurrency } from '@/lib/formatters';
import { useT, tKey } from '@/lib/i18n';
import { ProfileManager } from './ProfileManager';

// ─── Collapsible Section Shell ───
function Section({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  summary,
  children,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  summary?: string;
  children: React.ReactNode;
}) {
  const { expandedSections, toggleSection } = useUIStore();

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card transition-shadow hover:shadow-sm">
      <button
        onClick={() => toggleSection(title)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/30 transition-colors"
      >
        <div className={cn('flex items-center justify-center w-8 h-8 rounded-lg shrink-0', iconBg)}>
          <Icon className={cn('w-4 h-4', iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          {summary && !expandedSections.has(title) && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{summary}</p>
          )}
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground transition-transform shrink-0',
            expandedSections.has(title) && 'rotate-180'
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {expandedSections.has(title) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-5 border-t border-border">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Portfolio allocation sliders with lock + editable returns ───
import type { PortfolioAllocation } from '@/types';

function PortfolioSliders({
  alloc,
  assetReturns,
  onAllocChange,
}: {
  alloc: PortfolioAllocation;
  assetReturns: AssetReturns;
  onAllocChange: (a: PortfolioAllocation, r: AssetReturns) => void;
}) {
  const t = useT();
  const [locked, setLocked] = useState<Partial<Record<AssetClassKey, boolean>>>({});

  const toggleLock = useCallback((key: AssetClassKey) => {
    setLocked((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleChange = useCallback(
    (key: AssetClassKey, newVal: number) => {
      const oldVal = alloc[key] ?? 0;
      if (newVal === oldVal) return;

      const adjustableKeys = (Object.keys(ASSET_CLASSES) as AssetClassKey[]).filter(
        (k) => k !== key && !locked[k]
      );
      const lockedOtherSum = (Object.keys(ASSET_CLASSES) as AssetClassKey[])
        .filter((k) => k !== key && locked[k])
        .reduce((s, k) => s + (alloc[k] ?? 0), 0);

      const clampedVal = Math.min(newVal, 100 - lockedOtherSum);
      const remainder = 100 - clampedVal - lockedOtherSum;
      const newAlloc = { ...alloc, [key]: clampedVal };
      const adjustableTotal = adjustableKeys.reduce((s, k) => s + (alloc[k] ?? 0), 0);

      if (adjustableKeys.length === 0) return;

      if (adjustableTotal > 0) {
        let distributed = 0;
        adjustableKeys.forEach((k, idx) => {
          if (idx === adjustableKeys.length - 1) {
            newAlloc[k] = Math.max(0, remainder - distributed);
          } else {
            const share = (alloc[k] ?? 0) / adjustableTotal;
            const adjusted = Math.max(0, Math.round((share * remainder) / 5) * 5);
            newAlloc[k] = adjusted;
            distributed += adjusted;
          }
        });
      } else {
        const each = Math.floor(remainder / adjustableKeys.length / 5) * 5;
        let distributed = 0;
        adjustableKeys.forEach((k, idx) => {
          if (idx === adjustableKeys.length - 1) {
            newAlloc[k] = Math.max(0, remainder - distributed);
          } else {
            newAlloc[k] = each;
            distributed += each;
          }
        });
      }

      onAllocChange(newAlloc, assetReturns);
    },
    [alloc, assetReturns, locked, onAllocChange]
  );

  const handleReturnChange = useCallback(
    (key: AssetClassKey, val: number) => {
      const newReturns = { ...assetReturns, [key]: val };
      onAllocChange(alloc, newReturns);
    },
    [alloc, assetReturns, onAllocChange]
  );

  // Colors per asset class
  const barColors: Record<AssetClassKey, string> = {
    equity: 'bg-violet-500',
    bonds: 'bg-blue-400',
    cash: 'bg-emerald-400',
  };

  return (
    <div className="space-y-3 mt-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-foreground">{t.portfolioAllocation}</p>
      </div>

      {/* Stacked bar visualization */}
      <div className="flex h-2.5 rounded-full overflow-hidden bg-secondary">
        {(Object.keys(ASSET_CLASSES) as AssetClassKey[]).map((key) => {
          const pct = alloc[key] ?? 0;
          if (pct === 0) return null;
          return (
            <div
              key={key}
              className={cn('transition-all duration-200', barColors[key])}
              style={{ width: `${pct}%` }}
            />
          );
        })}
      </div>

      {/* Asset class rows */}
      {(Object.keys(ASSET_CLASSES) as AssetClassKey[]).map((key) => {
        const cls = ASSET_CLASSES[key];
        const isLocked = !!locked[key];
        const pct = alloc[key] ?? 0;
        return (
          <div key={key} className="rounded-lg border border-border p-2.5 space-y-2">
            {/* Header: emoji + name + lock + percentage badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">{cls.emoji}</span>
                <span className="text-xs font-semibold text-foreground">{tKey(t, key)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-xs font-bold tabular-nums px-1.5 py-0.5 rounded',
                  barColors[key], 'text-white'
                )}>{pct}%</span>
                <button
                  type="button"
                  onClick={() => toggleLock(key)}
                  title={isLocked ? t.unlockSlider : t.lockSlider}
                  className={cn(
                    'p-1 rounded-md transition-colors',
                    isLocked
                      ? 'bg-primary/10 text-primary hover:bg-primary/20'
                      : 'text-muted-foreground/30 hover:text-muted-foreground hover:bg-secondary'
                  )}
                >
                  {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={pct}
              disabled={isLocked}
              onChange={(e) => handleChange(key, Number(e.target.value))}
              className={cn(
                'w-full h-1.5 bg-secondary rounded-full appearance-none cursor-pointer accent-primary',
                isLocked && 'opacity-40 cursor-not-allowed'
              )}
            />

            {/* Expected return input */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{t.assetReturn}</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={30}
                  step={0.5}
                  value={assetReturns[key] ?? cls.defaultReturn}
                  onChange={(e) => handleReturnChange(key, Number(e.target.value))}
                  className="w-14 h-6 text-xs text-center bg-secondary border border-border rounded-md tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-[10px] text-muted-foreground">%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Input Panel ───
export function InputPanel() {
  const {
    inputs,
    updatePersonalInfo,
    updateIncome,
    updateInvestmentStrategy,
    updateFireGoals,
  } = useFireStore();
  const t = useT();

  const { personalInfo, income, expenses, assets, investmentStrategy, fireGoals } = inputs;
  const totalMonthlyIncome = income.monthlyNetSalary + income.additionalMonthlyIncome;
  const totalDebtPayments = assets.debts.reduce((s, d) => s + d.monthlyPayment, 0);
  const availableToInvest = Math.max(0, totalMonthlyIncome - expenses.monthlyExpenses - totalDebtPayments);

  return (
    <div className="space-y-3">
      {/* ─── Monthly Budget Summary ─── */}
      <div className="border border-primary/30 bg-primary/5 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-primary flex items-center gap-2">
          <PiggyBank className="w-4 h-4" />
          {t.monthlyBudget}
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <span className="text-muted-foreground">{t.income}</span>
          <span className="text-right font-medium text-emerald-500">
            +{formatCurrency(totalMonthlyIncome)}
          </span>
          <span className="text-muted-foreground">{t.livingExpenses}</span>
          <span className="text-right font-medium text-red-400">
            −{formatCurrency(expenses.monthlyExpenses)}
          </span>
          {totalDebtPayments > 0 && (
            <>
              <span className="text-muted-foreground">{t.debtPayments}</span>
              <span className="text-right font-medium text-red-400">
                −{formatCurrency(totalDebtPayments)}
              </span>
            </>
          )}
          <span className="text-muted-foreground">{t.investing}</span>
          <span className="text-right font-medium text-primary">
            −{formatCurrency(fireGoals.monthlyInvestment)}
          </span>
          <div className="col-span-2 border-t border-border my-1" />
          <span className="text-muted-foreground font-medium">{t.remaining}</span>
          <span className={cn(
            'text-right font-bold',
            (totalMonthlyIncome - expenses.monthlyExpenses - totalDebtPayments - fireGoals.monthlyInvestment) >= 0
              ? 'text-emerald-500'
              : 'text-destructive'
          )}>
            {formatCurrency(totalMonthlyIncome - expenses.monthlyExpenses - totalDebtPayments - fireGoals.monthlyInvestment)}
          </span>
        </div>

        {/* Monthly Investment Slider */}
        <div className="pt-2">
          <Slider
            label={t.monthlyInvestment}
            min={0}
            max={Math.max(availableToInvest, fireGoals.monthlyInvestment, 100)}
            step={50}
            value={fireGoals.monthlyInvestment}
            onChange={(v) => updateFireGoals({ monthlyInvestment: v })}
            formatValue={(v) => formatCurrency(v)}
          />
          {fireGoals.monthlyInvestment > availableToInvest && (
            <p className="text-xs text-amber-500 mt-1">
              {t.investingMoreThanBudget}
            </p>
          )}
        </div>
      </div>

      {/* ─── About You ─── */}
      <Section
        icon={User}
        iconColor="text-primary"
        iconBg="bg-primary/10"
        title={t.aboutYou}
        summary={t.ageSummary(personalInfo.currentAge, personalInfo.lifeExpectancy)}
      >
        <Slider
          label={t.currentAge}
          min={18}
          max={70}
          value={personalInfo.currentAge}
          onChange={(v) => updatePersonalInfo({ currentAge: v })}
          suffix=" years"
        />
        <Slider
          label={t.lifeExpectancy}
          min={70}
          max={100}
          value={personalInfo.lifeExpectancy}
          onChange={(v) => updatePersonalInfo({ lifeExpectancy: v })}
          suffix=" years"
        />
        <p className="text-[10px] text-muted-foreground">
          {t.aboutYouHint}
        </p>
      </Section>

      {/* ─── Income ─── */}
      <Section
        icon={Wallet}
        iconColor="text-emerald-500"
        iconBg="bg-emerald-500/10"
        title={t.incomeSection}
        summary={`${formatCurrency(totalMonthlyIncome)}/${t.mo} ${t.net}`}
      >
        <CurrencyInput
          label={t.monthlyNetSalary}
          tooltip={t.monthlyNetSalaryTooltip}
          value={income.monthlyNetSalary}
          onChange={(v) => updateIncome({ monthlyNetSalary: v })}
        />
        <PercentInput
          label={t.annualSalaryGrowth}
          tooltip={t.annualSalaryGrowthTooltip}
          value={income.annualSalaryGrowth}
          onChange={(v) => updateIncome({ annualSalaryGrowth: v })}
          step={0.5}
          max={15}
        />
        <CurrencyInput
          label={t.additionalMonthlyIncome}
          tooltip={t.additionalMonthlyIncomeTooltip}
          value={income.additionalMonthlyIncome}
          onChange={(v) => updateIncome({ additionalMonthlyIncome: v })}
        />
        <div className="pt-3 border-t border-border space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">{t.futurePension}</p>
            <Button variant="outline" size="sm" onClick={() => {
              const pension: Pension = {
                id: crypto.randomUUID(),
                name: '',
                monthlyAmount: 0,
                startAge: 67,
              };
              updateIncome({ pensions: [...income.pensions, pension] });
            }} className="h-7 text-xs">
              <Plus className="w-3 h-3 mr-1" /> {t.add}
            </Button>
          </div>

          {income.pensions.length === 0 && (
            <p className="text-xs text-muted-foreground/60 text-center py-2">{t.noPensions}</p>
          )}

          {income.pensions.map((pension, i) => (
            <div key={pension.id} className="border border-border rounded-lg p-3 space-y-3 animate-slide-up">
              <div className="flex items-center justify-between">
                <Input
                  type="text"
                  value={pension.name}
                  onChange={(e) => updateIncome({
                    pensions: income.pensions.map(p => p.id === pension.id ? { ...p, name: e.target.value } : p),
                  })}
                  placeholder={t.pensionPlaceholder(i + 1)}
                  className="border-0 bg-transparent p-0 h-auto text-sm font-medium focus-visible:ring-0"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => updateIncome({ pensions: income.pensions.filter(p => p.id !== pension.id) })}
                  className="text-destructive hover:text-destructive h-7 w-7"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <CurrencyInput
                  label={t.monthlyPension}
                  tooltip={t.monthlyPensionTooltip}
                  value={pension.monthlyAmount}
                  onChange={(v) => updateIncome({
                    pensions: income.pensions.map(p => p.id === pension.id ? { ...p, monthlyAmount: v } : p),
                  })}
                />
                <NumberInput
                  label={t.pensionStartAge}
                  value={pension.startAge}
                  onChange={(v) => updateIncome({
                    pensions: income.pensions.map(p => p.id === pension.id ? { ...p, startAge: v } : p),
                  })}
                  suffix=" yrs"
                  min={50}
                  max={75}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── Expenses ─── */}
      <ExpensesSection />

      {/* ─── Assets & Debts ─── */}
      <AssetsSection />

      {/* ─── Investment Strategy ─── */}
      <Section
        icon={TrendingUp}
        iconColor="text-violet-500"
        iconBg="bg-violet-500/10"
        title={t.investmentStrategy}
        summary={`${investmentStrategy.expectedAnnualReturn}% · σ ${investmentStrategy.annualVolatility}%`}
      >
        {/* Risk profile presets */}
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(RISK_PROFILES).map(([key, profile]) => {
            const stats = computePortfolioStats(profile.allocation, profile.returns);
            const isActive = investmentStrategy.riskProfile === key;
            return (
              <button
                key={key}
                onClick={() => {
                  if (key === 'custom') {
                    updateInvestmentStrategy({ riskProfile: key as RiskProfile });
                  } else {
                    updateInvestmentStrategy({
                      riskProfile: key as RiskProfile,
                      portfolioAllocation: { ...profile.allocation },
                      assetReturns: { ...profile.returns },
                      expectedAnnualReturn: stats.arithmeticReturn,
                      annualVolatility: stats.volatility,
                    });
                  }
                }}
                className={cn(
                  'flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all',
                  isActive
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border hover:border-primary/30'
                )}
              >
                <span className="text-xl leading-none shrink-0">{profile.emoji}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-tight">{tKey(t, key)}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">~{stats.arithmeticReturn}% · σ {stats.volatility}%</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Portfolio allocation sliders */}
        <PortfolioSliders
          alloc={investmentStrategy.portfolioAllocation ?? { equity: 60, bonds: 30, cash: 10 }}
          assetReturns={investmentStrategy.assetReturns ?? DEFAULT_ASSET_RETURNS}
          onAllocChange={(newAlloc, newReturns) => {
            const stats = computePortfolioStats(newAlloc, newReturns);
            updateInvestmentStrategy({
              riskProfile: 'custom',
              portfolioAllocation: newAlloc,
              assetReturns: newReturns,
              expectedAnnualReturn: stats.arithmeticReturn,
              annualVolatility: stats.volatility,
            });
          }}
        />

        {/* Computed stats display */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/30 rounded-lg text-center">
          <div>
            <p className="text-[10px] text-muted-foreground">{t.expectedAnnualReturn}</p>
            <p className="text-sm font-bold text-foreground">{investmentStrategy.expectedAnnualReturn}%</p>
            <p className="text-[9px] text-muted-foreground">
              {t.afterVolDrag}: {geometricReturn(
                (investmentStrategy.expectedAnnualReturn / 100 - investmentStrategy.annualFees / 100) * (1 - investmentStrategy.capitalGainsTaxRate / 100) * 100,
                investmentStrategy.annualVolatility,
              ).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">{t.annualVolatility}</p>
            <p className="text-sm font-bold text-foreground">{investmentStrategy.annualVolatility}%</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <PercentInput
            label={t.annualFees}
            tooltip={t.annualFeesTooltip}
            value={investmentStrategy.annualFees}
            onChange={(v) => updateInvestmentStrategy({ annualFees: v })}
            step={0.05}
            max={3}
          />
          <PercentInput
            label={t.capitalGainsTax}
            tooltip={t.capitalGainsTaxTooltip}
            value={investmentStrategy.capitalGainsTaxRate}
            onChange={(v) => updateInvestmentStrategy({ capitalGainsTaxRate: v })}
            step={1}
            max={50}
          />
        </div>
      </Section>

      {/* ─── Life Events ─── */}
      <LifeEventsSection />

      {/* ─── FIRE Goals ─── */}
      <GoalsSection />

      {/* ─── Profiles ─── */}
      <ProfileManager />
    </div>
  );
}

// ─── Expenses Section ───
function ExpensesSection() {
  const { inputs, updateExpenses } = useFireStore();
  const { expenses } = inputs;
  const t = useT();

  return (
    <Section
      icon={Receipt}
      iconColor="text-rose-500"
      iconBg="bg-rose-500/10"
      title={t.expensesSection}
      summary={`${formatCurrency(expenses.monthlyExpenses)}/${t.mo}`}
    >
      <CurrencyInput
        label={t.monthlyLivingExpenses}
        tooltip={t.monthlyLivingExpensesTooltip}
        value={expenses.monthlyExpenses}
        onChange={(v) => updateExpenses({ monthlyExpenses: v })}
      />

      <PercentInput
        label={t.annualInflation}
        tooltip={t.annualInflationTooltip}
        value={expenses.annualInflationRate}
        onChange={(v) => updateExpenses({ annualInflationRate: v })}
        step={0.1}
        min={0}
        max={10}
      />
    </Section>
  );
}

// ─── Assets & Debts Section ───
function AssetsSection() {
  const { inputs, updateAssets } = useFireStore();
  const { assets } = inputs;
  const t = useT();

  const addDebt = () => {
    const newDebt: Debt = {
      id: crypto.randomUUID(),
      name: '',
      balance: 0,
      interestRate: 3,
      monthlyPayment: 0,
      remainingYears: 10,
    };
    updateAssets({ debts: [...assets.debts, newDebt] });
  };

  const updateDebt = (id: string, data: Partial<Debt>) => {
    updateAssets({
      debts: assets.debts.map((d) => (d.id === id ? { ...d, ...data } : d)),
    });
  };

  const removeDebt = (id: string) => {
    updateAssets({ debts: assets.debts.filter((d) => d.id !== id) });
  };

  const totalAssets = assets.investedAssets + assets.cashSavings + assets.otherAssets
    + (assets.realEstateAssets ?? []).reduce((s, r) => s + r.propertyValue, 0);
  const totalDebt = assets.debts.reduce((s, d) => s + d.monthlyPayment * d.remainingYears * 12, 0);

  return (
    <Section
      icon={Landmark}
      iconColor="text-blue-500"
      iconBg="bg-blue-500/10"
      title={t.assetsDebts}
      summary={`${t.net}: ${formatCurrency(totalAssets - totalDebt)}`}
    >
      <div className="grid grid-cols-2 gap-4">
        <CurrencyInput
          label={t.investedAssets}
          tooltip={t.investedAssetsTooltip}
          value={assets.investedAssets}
          onChange={(v) => updateAssets({ investedAssets: v })}
        />
        <CurrencyInput
          label={t.cashSavings}
          tooltip={t.cashSavingsTooltip}
          value={assets.cashSavings}
          onChange={(v) => updateAssets({ cashSavings: v })}
        />
      </div>
      <CurrencyInput
        label={t.otherAssets}
        tooltip={t.otherAssetsTooltip}
        value={assets.otherAssets}
        onChange={(v) => updateAssets({ otherAssets: v })}
      />

      {/* Debts */}
      <div className="pt-3 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-medium text-muted-foreground">{t.debtsLoans}</h4>
          <Button variant="outline" size="sm" onClick={addDebt} className="h-7 text-xs">
            <Plus className="w-3 h-3 mr-1" /> {t.add}
          </Button>
        </div>

        {assets.debts.length === 0 && (
          <p className="text-xs text-muted-foreground/60 text-center py-2">{t.noDebts}</p>
        )}

        {assets.debts.map((debt, i) => (
          <div key={debt.id} className="border border-border rounded-lg p-3 mb-2 space-y-3 animate-slide-up">
            <div className="flex items-center justify-between">
              <Input
                type="text"
                value={debt.name}
                onChange={(e) => updateDebt(debt.id, { name: e.target.value })}
                placeholder={t.debtPlaceholder(i + 1)}
                className="border-0 bg-transparent p-0 h-auto text-sm font-medium focus-visible:ring-0"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeDebt(debt.id)}
                className="text-destructive hover:text-destructive h-7 w-7"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <CurrencyInput
                label={t.monthlyPayment}
                value={debt.monthlyPayment}
                onChange={(v) => updateDebt(debt.id, { monthlyPayment: v })}
              />
              <NumberInput
                label={t.remainingYears}
                value={debt.remainingYears}
                onChange={(v) => updateDebt(debt.id, { remainingYears: v })}
                suffix=" yrs"
                min={1}
                max={40}
              />
            </div>
            {debt.monthlyPayment > 0 && debt.remainingYears > 0 && (
              <p className="text-xs text-muted-foreground">
                {t.totalRemaining}: <span className="font-medium text-foreground">
                  {formatCurrency(debt.monthlyPayment * debt.remainingYears * 12)}
                </span>
                {' · '}{t.endsIn} <span className="font-medium text-emerald-500">
                  {new Date().getFullYear() + debt.remainingYears}
                </span>
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Real Estate */}
      <div className="pt-3 border-t border-border">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-xs font-medium text-muted-foreground">🏠 {t.realEstateAssets}</h4>
          <Button variant="outline" size="sm" onClick={() => {
            const prop: RealEstateAsset = {
              id: crypto.randomUUID(),
              name: '',
              propertyValue: 0,
              monthlyNetIncome: 0,
              annualAppreciation: 2,
            };
            updateAssets({ realEstateAssets: [...(assets.realEstateAssets ?? []), prop] });
          }} className="h-7 text-xs">
            <Plus className="w-3 h-3 mr-1" /> {t.add}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mb-3">{t.realEstateHint}</p>

        {(assets.realEstateAssets ?? []).length === 0 && (
          <p className="text-xs text-muted-foreground/60 text-center py-2">{t.noRealEstate}</p>
        )}

        {(assets.realEstateAssets ?? []).map((prop, i) => (
          <div key={prop.id} className="border border-border rounded-lg p-3 mb-2 space-y-3 animate-slide-up">
            <div className="flex items-center justify-between">
              <Input
                type="text"
                value={prop.name}
                onChange={(e) => updateAssets({
                  realEstateAssets: (assets.realEstateAssets ?? []).map(p =>
                    p.id === prop.id ? { ...p, name: e.target.value } : p
                  ),
                })}
                placeholder={t.realEstatePlaceholder(i + 1)}
                className="border-0 bg-transparent p-0 h-auto text-sm font-medium focus-visible:ring-0"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => updateAssets({
                  realEstateAssets: (assets.realEstateAssets ?? []).filter(p => p.id !== prop.id),
                })}
                className="text-destructive hover:text-destructive h-7 w-7"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <CurrencyInput
                label={t.propertyValue}
                value={prop.propertyValue}
                onChange={(v) => updateAssets({
                  realEstateAssets: (assets.realEstateAssets ?? []).map(p =>
                    p.id === prop.id ? { ...p, propertyValue: v } : p
                  ),
                })}
              />
              <CurrencyInput
                label={t.monthlyRentalIncome}
                value={prop.monthlyNetIncome}
                onChange={(v) => updateAssets({
                  realEstateAssets: (assets.realEstateAssets ?? []).map(p =>
                    p.id === prop.id ? { ...p, monthlyNetIncome: v } : p
                  ),
                })}
              />
            </div>
            <PercentInput
              label={t.annualAppreciation}
              value={prop.annualAppreciation}
              onChange={(v) => updateAssets({
                realEstateAssets: (assets.realEstateAssets ?? []).map(p =>
                  p.id === prop.id ? { ...p, annualAppreciation: v } : p
                ),
              })}
              step={0.5}
              min={-5}
              max={15}
            />
            {prop.propertyValue > 0 && prop.monthlyNetIncome > 0 && (
              <p className="text-xs text-muted-foreground">
                {t.rentalYield}: <span className="font-medium text-emerald-500">
                  {((prop.monthlyNetIncome * 12 / prop.propertyValue) * 100).toFixed(1)}%
                </span>
                {' · '}{formatCurrency(prop.monthlyNetIncome * 12)}/{t.yearsShort}
              </p>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─── Life Events Section (big expenses & incomes) ───
function LifeEventsSection() {
  const { inputs, updateFireGoals } = useFireStore();
  const { fireGoals } = inputs;
  const { currentAge } = inputs.personalInfo;
  const t = useT();

  // ── Future Expenses ──
  const addFutureExpense = () => {
    const expense: FutureExpense = {
      id: crypto.randomUUID(),
      name: '',
      amount: 0,
      yearsFromNow: 5,
    };
    updateFireGoals({ futureExpenses: [...fireGoals.futureExpenses, expense] });
  };

  const updateFutureExpense = (id: string, data: Partial<FutureExpense>) => {
    updateFireGoals({
      futureExpenses: fireGoals.futureExpenses.map((e) => (e.id === id ? { ...e, ...data } : e)),
    });
  };

  const removeFutureExpense = (id: string) => {
    updateFireGoals({ futureExpenses: fireGoals.futureExpenses.filter((e) => e.id !== id) });
  };

  // ── Future Incomes ──
  const addFutureIncome = () => {
    const inc: FutureIncome = {
      id: crypto.randomUUID(),
      name: '',
      amount: 0,
      yearsFromNow: 10,
      includeInFire: false,
    };
    updateFireGoals({ futureIncomes: [...(fireGoals.futureIncomes ?? []), inc] });
  };

  const updateFutureIncome = (id: string, data: Partial<FutureIncome>) => {
    updateFireGoals({
      futureIncomes: (fireGoals.futureIncomes ?? []).map((e) => (e.id === id ? { ...e, ...data } : e)),
    });
  };

  const removeFutureIncome = (id: string) => {
    updateFireGoals({ futureIncomes: (fireGoals.futureIncomes ?? []).filter((e) => e.id !== id) });
  };

  // ── Recurring Incomes (e.g., second-home rent) ──
  const addRecurringIncome = () => {
    const inc: RecurringIncome = {
      id: crypto.randomUUID(),
      name: '',
      monthlyAmount: 0,
      startAge: currentAge,
      annualGrowthRate: 2,
      includeInFire: true,
    };
    updateFireGoals({ recurringIncomes: [...(fireGoals.recurringIncomes ?? []), inc] });
  };

  const updateRecurringIncome = (id: string, data: Partial<RecurringIncome>) => {
    updateFireGoals({
      recurringIncomes: (fireGoals.recurringIncomes ?? []).map((e) => (e.id === id ? { ...e, ...data } : e)),
    });
  };

  const removeRecurringIncome = (id: string) => {
    updateFireGoals({ recurringIncomes: (fireGoals.recurringIncomes ?? []).filter((e) => e.id !== id) });
  };

  const futureIncomes = fireGoals.futureIncomes ?? [];
  const recurringIncomes = fireGoals.recurringIncomes ?? [];
  const totalExpenses = fireGoals.futureExpenses.reduce((s, e) => s + e.amount, 0);
  const totalIncomes = futureIncomes.reduce((s, e) => s + e.amount, 0)
    + recurringIncomes.reduce((s, e) => s + e.monthlyAmount * 12, 0);
  const netEvents = totalIncomes - totalExpenses;
  const summaryParts: string[] = [];
  if (fireGoals.futureExpenses.length > 0) summaryParts.push(t.expenseCount(fireGoals.futureExpenses.length));
  if (futureIncomes.length > 0) summaryParts.push(t.incomeCount(futureIncomes.length));
  const summary = summaryParts.length > 0
    ? `${summaryParts.join(', ')} · ${t.net} ${netEvents >= 0 ? '+' : ''}${formatCurrency(netEvents)}`
    : t.noEventsPlanned;

  return (
    <Section
      icon={CalendarClock}
      iconColor="text-cyan-500"
      iconBg="bg-cyan-500/10"
      title={t.lifeEvents}
      summary={summary}
    >
      <p className="text-[10px] text-muted-foreground">
        {t.lifeEventsHint}
      </p>

      {/* ── Big Expenses ── */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-medium text-muted-foreground">{t.plannedBigExpenses}</h4>
          <Button variant="outline" size="sm" onClick={addFutureExpense} className="h-7 text-xs">
            <Plus className="w-3 h-3 mr-1" /> {t.add}
          </Button>
        </div>
        {fireGoals.futureExpenses.length === 0 && (
          <p className="text-xs text-muted-foreground/60 text-center py-2">
            {t.noPlannedExpenses}
          </p>
        )}
        {fireGoals.futureExpenses.map((expense, i) => (
          <div key={expense.id} className="border border-border rounded-lg p-3 mb-2 space-y-2 animate-slide-up">
            <div className="flex items-center justify-between">
              <Input
                type="text"
                value={expense.name}
                onChange={(e) => updateFutureExpense(expense.id, { name: e.target.value })}
                placeholder={t.expensePlaceholder(i + 1)}
                className="border-0 bg-transparent p-0 h-auto text-sm font-medium focus-visible:ring-0"
              />
              <Button variant="ghost" size="icon" onClick={() => removeFutureExpense(expense.id)}
                className="text-destructive h-7 w-7">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <CurrencyInput label={t.amount} value={expense.amount}
                onChange={(v) => updateFutureExpense(expense.id, { amount: v })} />
              <NumberInput label={t.inYears} value={expense.yearsFromNow}
                onChange={(v) => updateFutureExpense(expense.id, { yearsFromNow: v })}
                suffix=" yrs" min={1} max={40} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Expected Future Income ── */}
      <div className="pt-3 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-medium text-muted-foreground">{t.expectedFutureIncome}</h4>
          <Button variant="outline" size="sm" onClick={addFutureIncome} className="h-7 text-xs">
            <Plus className="w-3 h-3 mr-1" /> {t.add}
          </Button>
        </div>
        {futureIncomes.length === 0 && (
          <p className="text-xs text-muted-foreground/60 text-center py-2">
            {t.noFutureIncome}
          </p>
        )}
        {futureIncomes.map((inc, i) => (
          <div key={inc.id} className="border border-border rounded-lg p-3 mb-2 space-y-2 animate-slide-up">
            <div className="flex items-center justify-between">
              <Input
                type="text"
                value={inc.name}
                onChange={(e) => updateFutureIncome(inc.id, { name: e.target.value })}
                placeholder={t.incomePlaceholder(i + 1)}
                className="border-0 bg-transparent p-0 h-auto text-sm font-medium focus-visible:ring-0"
              />
              <Button variant="ghost" size="icon" onClick={() => removeFutureIncome(inc.id)}
                className="text-destructive h-7 w-7">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <CurrencyInput label={t.amount} value={inc.amount}
                onChange={(v) => updateFutureIncome(inc.id, { amount: v })} />
              <NumberInput label={t.inYears} value={inc.yearsFromNow}
                onChange={(v) => updateFutureIncome(inc.id, { yearsFromNow: v })}
                suffix=" yrs" min={1} max={50} />
            </div>
            <div className="flex items-center gap-2.5 mt-1">
              <button
                onClick={() => updateFutureIncome(inc.id, { includeInFire: !inc.includeInFire })}
                className={cn(
                  'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                  inc.includeInFire
                    ? 'bg-orange-500'
                    : 'bg-muted'
                )}
                role="switch"
                aria-checked={inc.includeInFire}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-sm transition-transform',
                    inc.includeInFire ? 'translate-x-4' : 'translate-x-0'
                  )}
                />
              </button>
              <div className="flex flex-col">
                <span className={cn(
                  'text-[11px] font-medium leading-tight',
                  inc.includeInFire ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'
                )}>
                  {t.bridgeStrategyLabel}
                </span>
                <span className="text-[9px] text-muted-foreground leading-tight mt-0.5">
                  {t.bridgeStrategyHint}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Recurring Income Streams ── */}
      <div className="pt-3 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-medium text-muted-foreground">{t.recurringIncomeStreams}</h4>
          <Button variant="outline" size="sm" onClick={addRecurringIncome} className="h-7 text-xs">
            <Plus className="w-3 h-3 mr-1" /> {t.add}
          </Button>
        </div>
        {recurringIncomes.length === 0 && (
          <p className="text-xs text-muted-foreground/60 text-center py-2">
            {t.noRecurringIncome}
          </p>
        )}
        {recurringIncomes.map((inc, i) => (
          <div key={inc.id} className="border border-border rounded-lg p-3 mb-2 space-y-2 animate-slide-up">
            <div className="flex items-center justify-between">
              <Input
                type="text"
                value={inc.name}
                onChange={(e) => updateRecurringIncome(inc.id, { name: e.target.value })}
                placeholder={t.recurringIncomePlaceholder(i + 1)}
                className="border-0 bg-transparent p-0 h-auto text-sm font-medium focus-visible:ring-0"
              />
              <Button variant="ghost" size="icon" onClick={() => removeRecurringIncome(inc.id)}
                className="text-destructive h-7 w-7">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <CurrencyInput label={t.recurringMonthlyIncome} value={inc.monthlyAmount}
                onChange={(v) => updateRecurringIncome(inc.id, { monthlyAmount: v })} />
              <NumberInput label={t.recurringIncomeStartAge} value={inc.startAge}
                onChange={(v) => updateRecurringIncome(inc.id, { startAge: v })}
                suffix=" yrs" min={currentAge} max={90} />
            </div>
            <PercentInput
              label={t.recurringIncomeGrowth}
              value={inc.annualGrowthRate}
              onChange={(v) => updateRecurringIncome(inc.id, { annualGrowthRate: v })}
              step={0.25}
              min={-5}
              max={15}
            />
            <div className="flex items-center gap-2.5 mt-1">
              <button
                onClick={() => updateRecurringIncome(inc.id, { includeInFire: !inc.includeInFire })}
                className={cn(
                  'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                  inc.includeInFire
                    ? 'bg-orange-500'
                    : 'bg-muted'
                )}
                role="switch"
                aria-checked={inc.includeInFire}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-sm transition-transform',
                    inc.includeInFire ? 'translate-x-4' : 'translate-x-0'
                  )}
                />
              </button>
              <div className="flex flex-col">
                <span className={cn(
                  'text-[11px] font-medium leading-tight',
                  inc.includeInFire ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'
                )}>
                  {t.recurringIncludeInFireLabel}
                </span>
                <span className="text-[9px] text-muted-foreground leading-tight mt-0.5">
                  {t.bridgeStrategyHint}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─── FIRE Goals Section ───
function GoalsSection() {
  const { inputs, updateFireGoals, updateExpenses } = useFireStore();
  const { fireGoals, expenses } = inputs;
  const t = useT();

  return (
    <Section
      icon={Target}
      iconColor="text-amber-500"
      iconBg="bg-amber-500/10"
      title={t.fireGoals}
      summary={t.fireGoalsSummary(
        { lean: t.leanFire, regular: t.regularFire, fat: t.fatFire }[fireGoals.fireType] ?? FIRE_TYPES[fireGoals.fireType]?.label ?? '',
        fireGoals.safeWithdrawalRate
      )}
    >
      {/* FIRE Type */}
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(FIRE_TYPES).map(([key, type]) => {
          const labelMap: Record<string, string> = { lean: t.leanFire, regular: t.regularFire, fat: t.fatFire };
          const descMap: Record<string, string> = { lean: t.leanFireDesc, regular: t.regularFireDesc, fat: t.fatFireDesc };
          return (
            <button
              key={key}
              onClick={() => {
                updateFireGoals({ fireType: key as FireType });
                updateExpenses({ postRetirementExpensePercent: Math.round(type.multiplier * 100) });
              }}
              className={cn(
                'flex flex-col items-center p-3 rounded-lg border text-center transition-all',
                fireGoals.fireType === key
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border hover:border-primary/30'
              )}
            >
              <span className="text-xl">{type.emoji}</span>
              <span className="text-xs font-semibold mt-1">{labelMap[key] ?? type.label}</span>
              <span className="text-[10px] text-muted-foreground">{descMap[key] ?? type.description}</span>
            </button>
          );
        })}
      </div>

      <Slider
        label={t.postRetirementSpending}
        min={50}
        max={150}
        step={5}
        value={expenses.postRetirementExpensePercent}
        onChange={(v) => updateExpenses({ postRetirementExpensePercent: v })}
        suffix="%"
        formatValue={(v) => `${v}% (${formatCurrency(Math.round((expenses.monthlyExpenses * v) / 100))}/mo)`}
      />

      <Slider
        label={t.safeWithdrawalRate}
        min={2.5}
        max={5}
        step={0.25}
        value={fireGoals.safeWithdrawalRate}
        onChange={(v) => updateFireGoals({ safeWithdrawalRate: v })}
        suffix="%"
      />
      <p className="text-[10px] text-muted-foreground -mt-3">
        {t.swrHint}
      </p>
    </Section>
  );
}
