# FIRE Calculator

A comprehensive **Financial Independence, Retire Early (FIRE)** calculator built as a single-page web application. Input your financial data and get detailed projections for when you can achieve financial independence, complete with interactive charts, Monte Carlo simulations, and what-if scenario analysis.

![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![Vite](https://img.shields.io/badge/Vite-6-purple)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

### Core Calculator
- **FIRE Number Calculation** — Computes your target portfolio using the safe withdrawal rate (SWR) method with gap-and-residual modeling for pension integration
- **Year-by-Year Projections** — Full accumulation and drawdown simulation from current age to life expectancy
- **Three FIRE Types** — Lean, Regular, and Fat FIRE with configurable post-retirement spending percentages
- **Coast FIRE & Barista FIRE** — Additional FIRE milestone calculations
- **Bridge Strategy** — Models future income events (inheritance, severance) that can bring your FIRE date forward

### Financial Modeling
- **Pension Integration** — Gap-year model accounts for pre-pension and post-pension phases separately
- **Flexible Asset Modeling** — Invested assets, cash savings, custom assets (per-asset return/contribution), and real estate cash-flow/appreciation
- **Debt Tracking** — Multiple debts with monthly payments and remaining years, factored into projections
- **Life Events** — Planned future expenses (house purchase, wedding) and income (inheritance) with timeline
- **Capital Gains Tax** — Applied to investment returns
- **Annual Fees (TER)** — Investment fund fees subtracted from gross returns
- **Inflation Adjustment** — Toggle between nominal and real (inflation-adjusted) values
- **Salary Growth** — Annual salary growth rate modeling

### Monte Carlo Simulation
- **500 Randomized Scenarios** — Uses a seeded PRNG (Mulberry32) for deterministic, reproducible results
- **Percentile Bands** — P10, P25, P50 (median), P75, P90 portfolio projections
- **Success Rate** — Percentage of simulations where portfolio lasts through retirement
- **FIRE Age Distribution** — Histogram of when FIRE is achieved across simulations
- **Target Age Mode** — Force a specific retirement age and see survival probability

### Visualizations
- **Net Worth Projection Chart** — Portfolio growth with optimistic/pessimistic bands and FIRE target line
- **Monte Carlo Chart** — Percentile fan chart across all simulations
- **Income vs Expenses Chart** — Stacked area showing income sources vs spending over time
- **Post-Retirement Withdrawal Chart** — Drawdown phase with pension overlay
- **Wealth Breakdown Chart** — Contributions vs investment growth at FIRE
- **Milestone Timeline** — Visual progress toward Emergency Fund, 100k, Coast FIRE, Half FIRE, and FIRE

### What-If Scenarios
- **Side-by-Side Comparison** — Adjust investment amount, return rate, expenses, or SWR and see impact
- **Difference Indicators** — Shows how many years sooner/later each scenario reaches FIRE

### User Experience
- **Multi-Currency** — 15 supported currencies (EUR, USD, GBP, CHF, JPY, CAD, AUD, NZD, CNY, HKD, SGD, INR, SEK, NOK, DKK) with locale-aware formatting
- **Internationalization** — Full English and Italian translations
- **Dark/Light Theme** — System preference detection with manual override
- **Shareable URLs** — Encode all inputs in a URL hash for sharing
- **Profile Manager** — Save and load multiple financial profiles to localStorage
- **Responsive Design** — Works on desktop and mobile with sticky input panel
- **Expense Breakdown** — Detailed category-level expense tracking (housing, food, transport, etc.)

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | [React 19](https://react.dev/) + [TypeScript 5.6](https://www.typescriptlang.org/) |
| Build | [Vite 6](https://vitejs.dev/) |
| Styling | [Tailwind CSS 3.4](https://tailwindcss.com/) with CSS custom properties |
| State | [Zustand 5](https://zustand.docs.pmnd.rs/) with `persist` middleware |
| Charts | [Recharts 2](https://recharts.org/) |
| Animations | [Framer Motion 11](https://www.framer.com/motion/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Testing | [Vitest 4](https://vitest.dev/) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ 
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/fire-calculator.git
cd fire-calculator

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |

## Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx          # App header with theme/language/currency controls
│   │   ├── InputPanel.tsx      # All financial input forms
│   │   └── ProfileManager.tsx  # Save/load profile management
│   ├── results/
│   │   ├── BreakdownChart.tsx      # Contributions vs growth pie chart
│   │   ├── IncomeExpenseChart.tsx   # Income vs expenses over time
│   │   ├── MilestoneTimeline.tsx    # Visual milestone progress
│   │   ├── MonteCarloChart.tsx      # Monte Carlo percentile fan chart
│   │   ├── ProjectionChart.tsx      # Net worth projection chart
│   │   ├── ResultsDashboard.tsx     # Main results layout
│   │   ├── ScenarioComparison.tsx   # What-if scenario table
│   │   ├── SummaryCards.tsx         # Key metric summary cards
│   │   └── WithdrawalChart.tsx      # Post-retirement drawdown chart
│   ├── shared/
│   │   └── FormFields.tsx      # Reusable currency/percent/number inputs
│   └── ui/                     # Base UI primitives (Button, Card, Input, etc.)
├── lib/
│   ├── calculator.ts           # Core FIRE calculation engine
│   ├── constants.ts            # Default values and configuration
│   ├── financial.ts            # Shared financial math (annuity PV, drawdown)
│   ├── formatters.ts           # Currency, percent, date formatting
│   ├── monteCarlo.ts           # Monte Carlo simulation engine
│   ├── sharing.ts              # URL hash encoding/decoding
│   ├── utils.ts                # Tailwind class merging utility
│   └── i18n/                   # Internationalization
│       ├── en.ts               # English translations
│       ├── it.ts               # Italian translations
│       ├── index.ts            # i18n context and hooks
│       └── types.ts            # Translation type definitions
├── store/
│   ├── fireStore.ts            # Zustand store for financial inputs + computed results
│   └── uiStore.ts              # Zustand store for theme/locale/currency + UI preferences
├── test/
│   ├── setup.ts                # Test setup (jest-dom matchers)
│   ├── calculator.test.ts      # Calculator engine tests
│   ├── financial.test.ts       # Financial math unit tests
│   ├── formatters.test.ts      # Formatter utility tests
│   ├── monteCarlo.test.ts      # Monte Carlo simulation tests
│   └── sharing.test.ts         # URL sharing round-trip tests
└── types/
    └── index.ts                # TypeScript type definitions
```

## How It Works

### FIRE Number Calculation

The calculator uses the **Safe Withdrawal Rate (SWR)** method as its foundation:

$$\text{FIRE Number (base)} = \frac{\text{Annual Expenses} \times \text{Post-Retirement Factor}}{\text{SWR}}$$

This is then adjusted for:

1. **Pension Credit** — If you have a state/private pension, the portfolio only needs to cover the shortfall between expenses and pension income. Pre-pension "gap years" are modeled as an annuity.

2. **Debt Cost** — Present value of remaining debt payments at the projected FIRE age is added to the target.

3. **Inflation** — The final FIRE number is inflated to nominal terms at the projected FIRE age.

### Portfolio Projection

Each year in the simulation:
- **Accumulation Phase**: `Portfolio += Growth + Monthly Investment × 12 + Net One-Time Events`
- **Drawdown Phase**: `Portfolio += Growth − Withdrawals + Pension + Net One-Time Events`

Net return accounts for both capital gains tax and fund fees (TER):

$$\text{Net Return} = (\text{Gross Return} - \text{Annual Fees}) \times (1 - \text{Capital Gains Tax Rate})$$

### Monte Carlo Method

The simulation runs 500 paths with randomized annual returns drawn from a normal distribution:

$$R_{\text{year}} = \mu + \sigma \cdot Z$$

Where $\mu$ is the expected net return, $\sigma = 0.12$ (diversified portfolio volatility), and $Z$ is a standard normal variate. A seeded PRNG ensures identical inputs always produce identical results.

## Adding a New Language

1. Create a new file in `src/lib/i18n/` (e.g., `de.ts`) implementing the `Translations` interface
2. Add the locale to the `Locale` type in `src/lib/i18n/types.ts`
3. Register the translations in `src/lib/i18n/index.ts`
4. Add the locale option to the language selector in `src/components/layout/Header.tsx`

TypeScript will enforce that all translation keys are provided — the project won't compile with missing translations.

## Disclaimer

This calculator is for **educational and planning purposes only**. It does not constitute financial advice. The projections are based on simplified models and assumptions (constant real returns, fixed inflation, etc.) that may not reflect actual market conditions. Always consult a qualified financial advisor for personal financial decisions.

## Contributors

Thanks to everyone who contributed to this project.

- [vzamb](https://github.com/vzamb) — Project maintainer
- [brandonp20](https://github.com/brandonp20) — Custom assets support 


## License

This project is licensed under the [MIT License](LICENSE).
