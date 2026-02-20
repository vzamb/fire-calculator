export type Locale = 'en' | 'it';

export interface Translations {
  // ─── App ───
  appTitle: string;
  reset: string;

  // ─── Budget Summary ───
  monthlyBudget: string;
  income: string;
  livingExpenses: string;
  debtPayments: string;
  investing: string;
  remaining: string;
  monthlyInvestment: string;
  investingMoreThanBudget: string;

  // ─── About You ───
  aboutYou: string;
  currentAge: string;
  lifeExpectancy: string;
  aboutYouHint: string;
  ageSummary: (age: number, life: number) => string;

  // ─── Income ───
  incomeSection: string;
  monthlyNetSalary: string;
  monthlyNetSalaryTooltip: string;
  annualSalaryGrowth: string;
  annualSalaryGrowthTooltip: string;
  additionalMonthlyIncome: string;
  additionalMonthlyIncomeTooltip: string;
  futurePension: string;
  monthlyPension: string;
  monthlyPensionTooltip: string;
  pensionStartAge: string;
  noPensions: string;
  pensionPlaceholder: (i: number) => string;

  // ─── Expenses ───
  expensesSection: string;
  monthlyLivingExpenses: string;
  monthlyLivingExpensesTooltip: string;
  hideBreakdown: string;
  detailedBreakdown: string;
  housing: string;
  food: string;
  transport: string;
  insurance: string;
  leisure: string;
  other: string;
  breakdownLabel: string;
  useThisTotal: string;
  annualInflation: string;
  annualInflationTooltip: string;
  postRetirementSpending: string;

  // ─── Assets ───
  assetsDebts: string;
  investedAssets: string;
  investedAssetsTooltip: string;
  cashSavings: string;
  cashSavingsTooltip: string;
  otherAssets: string;
  otherAssetsTooltip: string;
  debtsLoans: string;
  add: string;
  noDebts: string;
  debtPlaceholder: (i: number) => string;
  monthlyPayment: string;
  remainingYears: string;
  totalRemaining: string;
  endsIn: string;

  // ─── Investment Strategy ───
  investmentStrategy: string;
  conservative: string;
  conservativeDesc: string;
  moderate: string;
  moderateDesc: string;
  aggressive: string;
  aggressiveDesc: string;
  custom: string;
  customDesc: string;
  expectedAnnualReturn: string;
  capitalGainsTax: string;
  capitalGainsTaxTooltip: string;

  // ─── Life Events ───
  lifeEvents: string;
  lifeEventsHint: string;
  plannedBigExpenses: string;
  noPlannedExpenses: string;
  expensePlaceholder: (i: number) => string;
  amount: string;
  inYears: string;
  expectedFutureIncome: string;
  noFutureIncome: string;
  incomePlaceholder: (i: number) => string;
  includeInFireLabel: string;
  postFireBonusLabel: string;
  bridgeStrategyLabel: string;
  bridgeStrategyHint: string;
  expenseCount: (n: number) => string;
  incomeCount: (n: number) => string;
  noEventsPlanned: string;

  // ─── FIRE Goals ───
  fireGoals: string;
  fireGoalsSummary: (type: string, swr: number) => string;
  leanFire: string;
  leanFireDesc: string;
  regularFire: string;
  regularFireDesc: string;
  fatFire: string;
  fatFireDesc: string;
  safeWithdrawalRate: string;
  swrHint: string;

  // ─── Results — Summary Cards ───
  fireAge: string;
  fireAgeTooltip: string;
  fireNumber: string;
  fireNumberTooltip: string;
  timeToFire: string;
  timeToFireTooltip: string;
  savingsRate: string;
  savingsRateTooltip: string;
  coastFire: string;
  coastFireTooltip: string;
  coastFireSubtext: (age: number) => string;
  savingsExcellent: string;
  savingsGreat: string;
  savingsGood: string;
  savingsGrow: string;
  investingPerMonth: (amount: string) => string;
  atAge: (age: number, todayValue: string) => string;

  // ─── Results — Dashboard ───
  yourFireNumber: (val: string) => string;
  fireNumberExplainer: (age: number) => string;
  explainerBase: string;
  explainerPensionCredit: string;
  explainerDebtCost: string;
  explainerAdjustedBase: string;
  explainerInflation: (years: number) => string;
  explainerFinalTarget: string;
  pensionCreditDetail: (totalAmount: string, count: number) => string;
  debtCostDetail: string;
  fireNumberHint: string;
  bridgeStrategyActive: string;
  bridgeStrategyExplainer: (gap: string, portfolio: string, income: string, age: number) => string;

  // ─── Charts ───
  netWorthProjection: string;
  netWorthProjectionDesc: string;
  netWorthProjectionDescBridge: string;
  standardFireTarget: string;
  baseCase: string;
  optimistic: string;
  pessimistic: string;
  optimisticLabel: string;
  pessimisticLabel: string;
  ageLabel: string;
  ageAxis: string;

  incomeVsExpenses: string;
  incomeVsExpensesDesc: string;
  passiveIncome: string;
  debtPaymentsChart: string;
  totalSpending: string;

  postRetirementPortfolio: string;
  postRetirementPortfolioDesc: string;
  adjustInputsHint: string;
  pension: string;
  successRateLabel: string;
  portfolioAtAge: (age: number) => string;

  wealthBreakdown: string;
  wealthBreakdownDesc: string;
  yourContributions: string;
  investmentGrowth: string;
  totalAtFire: string;
  growthPercent: (pct: string) => string;

  // ─── Scenarios ───
  whatIfScenarios: string;
  whatIfScenariosDesc: string;
  scenarioExtraInvestment: string;
  scenarioReturnRate: string;
  scenarioExpenseChange: string;
  scenarioSWR: string;
  scenario: string;
  difference: string;
  currentPlan: string;
  yourBaseline: string;
  sooner: (y: string) => string;
  later: (y: string) => string;
  same: string;

  // ─── Monte Carlo ───
  monteCarloTitle: string;
  monteCarloDesc: string;
  monteCarloSuccess: string;
  monteCarloMedianAge: string;
  monteCarloSimulations: string;
  monteCarloP5: string;
  monteCarloP25: string;
  monteCarloMedian: string;
  monteCarloP75: string;
  monteCarloP95: string;
  monteCarloFootnote: string;
  monteCarloTargetAge: string;

  // ─── Milestone Timeline ───
  milestoneTimeline: string;
  milestoneTimelineDesc: string;
  milestoneEmergencyFund: string;
  milestone100k: string;
  milestoneCoastFire: string;
  milestoneHalfFire: string;
  milestoneFire: string;
  milestoneReached: string;
  milestoneYearsAway: (y: number) => string;
  milestoneAtAge: (age: number) => string;

  // ─── Inflation Toggle ───
  nominalValues: string;
  realValues: string;

  // ─── Share / Export ───
  shareResults: string;
  copyLink: string;
  linkCopied: string;

  // ─── Currency ───
  currency: string;

  // ─── Profiles ───
  profiles: string;
  saveProfile: string;
  loadProfile: string;
  deleteProfile: string;
  profileName: string;
  defaultProfileName: string;
  noSavedProfiles: string;
  profileSaved: string;

  // ─── Formatters ───
  years: string;
  months: string;
  yearsShort: string;
  monthsShort: string;
  net: string;
  mo: string;
}
