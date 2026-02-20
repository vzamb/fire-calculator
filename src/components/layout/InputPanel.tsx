import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, User, Wallet, Receipt, Landmark, TrendingUp, Target, PiggyBank, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFireStore } from '@/store/fireStore';
import { Slider } from '@/components/ui/Slider';
import { CurrencyInput, PercentInput, NumberInput } from '@/components/shared/FormFields';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';
import { RISK_PROFILES, FIRE_TYPES } from '@/lib/constants';
import type { RiskProfile, FireType, Debt, FutureExpense, FutureIncome, Pension, RecurringIncome } from '@/types';
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
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card transition-shadow hover:shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/30 transition-colors"
      >
        <div className={cn('flex items-center justify-center w-8 h-8 rounded-lg shrink-0', iconBg)}>
          <Icon className={cn('w-4 h-4', iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          {summary && !open && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{summary}</p>
          )}
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground transition-transform shrink-0',
            open && 'rotate-180'
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
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
        summary={`~${investmentStrategy.expectedAnnualReturn}%`}
      >
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(RISK_PROFILES).map(([key, profile]) => (
            <button
              key={key}
              onClick={() => {
                if (key === 'custom') {
                  updateInvestmentStrategy({ riskProfile: key as RiskProfile });
                } else {
                  updateInvestmentStrategy({
                    riskProfile: key as RiskProfile,
                    expectedAnnualReturn: profile.return,
                    annualVolatility: profile.volatility,
                    stockAllocation: profile.stocks,
                  });
                }
              }}
              className={cn(
                'flex flex-col items-center p-2.5 rounded-lg border text-center transition-all',
                investmentStrategy.riskProfile === key
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border hover:border-primary/30'
              )}
            >
              <span className="text-[11px] font-semibold leading-tight truncate w-full">{tKey(t, key)}</span>
              <span className="text-[10px] text-muted-foreground">~{profile.return}%</span>
            </button>
          ))}
        </div>
        <Slider
          label={t.expectedAnnualReturn}
          min={1}
          max={15}
          step={0.5}
          value={investmentStrategy.expectedAnnualReturn}
          onChange={(v) => updateInvestmentStrategy({ expectedAnnualReturn: v, riskProfile: 'custom' })}
          suffix="%"
        />
        <PercentInput
          label={t.capitalGainsTax}
          tooltip={t.capitalGainsTaxTooltip}
          value={investmentStrategy.capitalGainsTaxRate}
          onChange={(v) => updateInvestmentStrategy({ capitalGainsTaxRate: v })}
          step={1}
          max={50}
        />
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

// ─── Expenses Section (with breakdown toggle) ───
function ExpensesSection() {
  const { inputs, updateExpenses } = useFireStore();
  const { expenses } = inputs;
  const [showBreakdown, setShowBreakdown] = useState(false);
  const t = useT();

  const breakdownTotal = Object.values(expenses.expenseBreakdown).reduce((s, v) => s + v, 0);

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

      <button
        onClick={() => setShowBreakdown(!showBreakdown)}
        className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
      >
        {showBreakdown ? t.hideBreakdown : t.detailedBreakdown}
      </button>

      {showBreakdown && (
        <div className="grid grid-cols-2 gap-3 animate-slide-up">
          <CurrencyInput label={t.housing} value={expenses.expenseBreakdown.housing}
            onChange={(v) => updateExpenses({ expenseBreakdown: { ...expenses.expenseBreakdown, housing: v } })} />
          <CurrencyInput label={t.food} value={expenses.expenseBreakdown.food}
            onChange={(v) => updateExpenses({ expenseBreakdown: { ...expenses.expenseBreakdown, food: v } })} />
          <CurrencyInput label={t.transport} value={expenses.expenseBreakdown.transport}
            onChange={(v) => updateExpenses({ expenseBreakdown: { ...expenses.expenseBreakdown, transport: v } })} />
          <CurrencyInput label={t.insurance} value={expenses.expenseBreakdown.insurance}
            onChange={(v) => updateExpenses({ expenseBreakdown: { ...expenses.expenseBreakdown, insurance: v } })} />
          <CurrencyInput label={t.leisure} value={expenses.expenseBreakdown.leisure}
            onChange={(v) => updateExpenses({ expenseBreakdown: { ...expenses.expenseBreakdown, leisure: v } })} />
          <CurrencyInput label={t.other} value={expenses.expenseBreakdown.other}
            onChange={(v) => updateExpenses({ expenseBreakdown: { ...expenses.expenseBreakdown, other: v } })} />
          {breakdownTotal !== expenses.monthlyExpenses && (
            <div className="col-span-2 flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg p-2.5">
              <p className="text-xs text-muted-foreground">
                {t.breakdownLabel}: <span className="font-semibold text-foreground">{formatCurrency(breakdownTotal)}</span>
              </p>
              <button
                onClick={() => updateExpenses({ monthlyExpenses: breakdownTotal })}
                className="text-xs text-primary font-medium hover:underline"
              >
                {t.useThisTotal}
              </button>
            </div>
          )}
        </div>
      )}

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

  const totalAssets = assets.investedAssets + assets.cashSavings + assets.otherAssets;
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
