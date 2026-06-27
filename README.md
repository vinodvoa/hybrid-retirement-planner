# Retirement Planner — Hybrid 4-Bucket Framework (India NRI & Singapore)

### 🔗 [**Live demo → vinodvoa.github.io/hybrid-retirement-planner**](https://vinodvoa.github.io/hybrid-retirement-planner/)

A responsive, single-page retirement-planning app for **Indian NRIs** and **Singapore
residents**, built on a **hybrid 4-bucket framework** (Liquidity / Income / Growth /
Legacy) with a Guyton-Klinger guardrail withdrawal rule.

Runs entirely in your browser — no install, no sign-up, and your inputs stay on your own
device (saved to `localStorage` only).

> ⚠️ **Educational tool — not financial advice.** All rates are *dated defaults* and are
> editable in the UI. Verify current tax rules, scheme rates and returns against primary
> sources, and consult a licensed adviser before acting.

## How to run

It is a **zero-build static app** — no Node, no server required.

- **Simplest:** double-click `index.html` to open it in any modern browser.
- **Via a local server** (recommended, avoids any browser `file://` quirks):
  ```
  cd retirement-app
  python -m http.server 8777
  ```
  then open <http://localhost:8777/index.html>.

Run the calculation tests anytime at `tests.html` (e.g. <http://localhost:8777/tests.html>).
All math (corpus, SIP, real-rate, tax, drawdown) is asserted there against hand-computed
values.

Everything runs in your browser. Nothing is uploaded; inputs are saved only in this
device's `localStorage`. Use **Export** to save a JSON backup, and **Print / Save PDF**
(on the Projection and Plan tabs) for a shareable copy.

## The four tabs

1. **Inputs** — DOB, retirement age, life expectancy, expenses, withdrawal rate,
   cash/debt/equity, region accounts (CPF/SRS or NRE/NRO/NPS), inflation & returns,
   insurance, and debts. Every field has a **help bubble** with typical real-world values.
2. **Budget** — an editable model monthly budget. **India scales by hometown city tier**
   (Metro / Tier-1/2/3); **Singapore** by housing & car profile. The total can drive your
   expense figure. An **Income in retirement** section (both regions) lets you enter
   **rental and other income** (pension, annuity, part-time, dividends); this is treated as
   inflation-growing income from your retirement age that **reduces the net expense your
   corpus must fund — and therefore lowers the corpus required**. For Singapore it stacks
   with CPF LIFE (which kicks in at 65).
3. **Projection** — corpus required and monthly saving (level **and** step-up SIP),
   cross-checked two ways (inflation-adjusted annuity vs withdrawal-rate). Accumulation,
   drawdown and bucket-balance charts, plus a **year-by-year drawdown table** with tax,
   returns and guardrail actions. Toggle a sequence-of-returns stress test.
4. **Your Plan** — a step-by-step 4-bucket setup with **named, representative products**,
   per-instrument **tax treatment**, the guardrail rule explained, and a prioritised
   **risk review with practical fixes**.
5. **Glossary** — plain-English definitions of every term used in the app (corpus, SWR,
   sequence-of-returns risk, the 4 buckets, guardrails, CPF/CPF LIFE/SRS, NRE/NRO, LTCG,
   DTAA, REITs, annuities, and more), each with a **link to a reputable source**
   (Investopedia, Charles Schwab, CNBC, CPF Board, IRAS, MAS, ClearTax, NPS Trust). Includes
   a live **search box** to filter terms.

## Methodology (summary)

- **Corpus** = present value at retirement of an inflation-growing annuity-due over
  `lifeExpectancy − retirementAge` years, using the real rate `rr = (1+r)/(1+i) − 1`.
  Cross-checked against `annualExpense ÷ withdrawalRate`; the more conservative figure is
  the planning target.
- **Monthly SIP** = annuity-due solve over the gap between the corpus target and the
  future value of existing investments. A step-up SIP variant is also computed.
- **Drawdown** is bucket-aware: withdrawals come Liquidity → Income → Growth; buckets earn
  their own returns and rebalance annually to an age-based glide path
  (equity ≈ `110 − age`, floored at 30%). Sequence-of-returns risk is stressed by forcing
  poor equity returns in the first five years.

## Data baseline (verified June 2026; **editable in-app**)

**India — FY2025-26 (NRI):**
- Equity LTCG **12.5%** on gains over **₹1.25 lakh**/yr (held > 12 months); STCG **20%**.
- Debt funds / non-equity taxed at slab; NRI redemptions face TDS up to ~**30%**
  (refundable on filing). NRE FD interest **tax-free**; NRO interest taxable.
- Small savings (Q2 FY25-26): **PPF 7.1%**, **SCSS 8.2%**, **SSY 8.2%**. NRIs generally
  **cannot open new PPF/SCSS/SSY**; existing PPF may run to maturity.
- Long-run equity assumption ~**12%** (configurable).

**Singapore — YA2025-26:**
- **No capital gains tax**; CPF LIFE payouts untaxed.
- **SRS** cap **S$15,300** (citizen/PR) / **S$35,700** (foreigner); only **50%** of
  withdrawals taxable, ideally spread over up to 10 years.
- CPF OA ≥2.5%, SA/RA ~4%; CPF LIFE from 65; ERS 2025 ≈ **S$440,800**.

**CPF LIFE modelling (Singapore).** You pick a **retirement sum** (BRS ≈ S$930/mo, FRS ≈
S$1,730/mo, ERS ≈ S$3,300/mo — 2025 Standard-plan figures) and a **plan**: Standard
(level), Basic (≈0.95× initial, higher bequest) or Escalating (≈0.80× initial, +2%/yr).
A manual override box accepts a figure straight from CPF's own estimator. CPF LIFE is
treated as **tax-free lifelong income from age 65 that offsets your expenses**, so it
**reduces the corpus you need** (the app subtracts the present value of the payout stream).
To avoid double-counting, the **CPF Retirement Account balance is excluded from your
spendable corpus** whenever CPF LIFE is active (that money funds the annuity, it isn't a
lump sum to draw down). The Budget tab shows the payout as an income row with a "net funded
by corpus" line, and the drawdown table adds a **CPF LIFE** column (income is 0 before 65,
so the corpus fully funds any earlier-retirement years).

### Sources
- ClearTax — LTCG FY2025-26: <https://cleartax.in/s/long-term-capital-gains-ltcg-tax>
- Nippon India / HSBC Tax Reckoner FY2025-26 (NRI update).
- Small savings rates Q2 FY25-26 (Ministry of Finance announcements).
- IRAS — SRS contributions & relief: <https://www.iras.gov.sg/taxes/individual-income-tax/basics-of-individual-income-tax/special-tax-schemes/srs-contributions>
- CPFB — CPF LIFE payouts & retirement sums: <https://www.cpf.gov.sg/>
- CPFB — CPF LIFE Estimator (for the override figure): <https://www.cpf.gov.sg/member/tools-and-services/calculators>
- MOF — Supplementary Retirement Scheme: <https://www.mof.gov.sg/news-resources/supplementary-retirement-scheme/>

## Project structure

```
retirement-app/
  index.html            shell (header, region switch, tabs, disclaimer)
  tests.html            in-browser calculation test harness
  css/styles.css        design system (responsive, region-themed)
  js/
    constants.js        all tax rules, scheme rates, assumptions, budgets, products, help text
    format.js           currency (₹ lakh/crore · S$) & number formatting
    state.js            central state, per-region profiles, persistence, derive()
    calc/corpus.js      corpus, SIP, real-rate math (CPF LIFE-aware)
    calc/cpflife.js     CPF LIFE payout estimate & present value (Singapore)
    calc/tax.js         India NRI + Singapore tax estimates
    calc/buckets.js     4-bucket allocation, glide path, guardrails
    calc/drawdown.js    year-by-year projection engine
    calc/risk.js        risk checks & suggestions
    ui/helpers.js ui/charts.js ui/inputs.js ui/budget.js ui/projection.js ui/plan.js
    app.js              bootstrap, routing, event delegation
```

## Limitations

- Tax figures are **planning estimates**, not return-level computations; real liability
  depends on personal circumstances, DTAA, surcharge, residency days, etc.
- No live market data or account integrations (offline-first by design).
- Product names are **representative illustrations**, not recommendations — verify current
  costs and rates.
