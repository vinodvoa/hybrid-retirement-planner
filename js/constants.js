/* =============================================================================
 * constants.js — All region data, assumptions, tax rules, budgets, products.
 *
 * IMPORTANT: Everything here is a DATED DEFAULT. Rates change. The UI exposes
 * the key assumptions for the user to override. Verify against primary sources
 * before acting. This is an educational tool, not financial advice.
 *
 * Verified during build (June 2026), baseline India FY2025-26 / Singapore YA2025-26.
 * Sources noted in README.md.
 * ========================================================================== */
(function (RP) {
  "use strict";

  // ---- Global, region-independent defaults ---------------------------------
  RP.GLOBAL = {
    asOf: "FY2025-26 (India) / YA2025-26 (Singapore) — verify current rates",
    // Real-rate floor below which we treat the annuity as effectively flat.
    EPS_REAL_RATE: 1e-6,
  };

  // ---- Region catalog ------------------------------------------------------
  // Each region carries: currency, formatting, assumptions, tax engine config,
  // budget templates, account fields, and a 4-bucket product catalog.
  RP.REGIONS = {
    india: {
      key: "india",
      label: "India (NRI)",
      currency: { code: "INR", symbol: "₹", style: "indian" },
      flag: "🇮🇳",

      // Long-run assumptions (editable in UI). Nominal, annual.
      assumptions: {
        inflationPre: 6.0,        // accumulation-phase inflation
        inflationRetire: 6.0,     // in-retirement inflation
        returnEquity: 12.0,       // diversified Indian equity, long-run
        returnDebt: 7.0,          // debt funds / NRE FD / bonds blended
        returnCash: 4.0,          // liquid / savings
        returnPreBlend: 11.0,     // default accumulation blended (mostly equity)
        returnRetireBlend: 8.0,   // default in-retirement blended (post-tax-ish)
        swr: 3.5,                 // safe withdrawal rate (%) — conservative for India inflation
        lifeExpectancy: 85,
        retirementAge: 60,
        stepUpSip: 7.0,           // typical annual income/SIP step-up
      },

      // Government / small-savings scheme reference rates (Q2 FY25-26).
      schemes: [
        { name: "PPF (Public Provident Fund)", rate: 7.1, note: "EEE tax-free. NRIs CANNOT open new PPF; existing accounts may run to maturity, no extension.", nriEligible: "existing-only" },
        { name: "SCSS (Senior Citizens' Savings)", rate: 8.2, note: "Age 60+. NRIs NOT eligible to open.", nriEligible: false },
        { name: "SSY (Sukanya Samriddhi)", rate: 8.2, note: "For a girl child. NRIs NOT eligible.", nriEligible: false },
        { name: "NPS Tier-1", rate: 9.5, note: "NRIs CAN invest (NRE/NRO). Partly market-linked; annuity at exit.", nriEligible: true },
        { name: "NRE Fixed Deposit", rate: 7.0, note: "Interest TAX-FREE in India. Repatriable. Currency risk on INR.", nriEligible: true },
        { name: "NRO Fixed Deposit", rate: 7.0, note: "Interest TAXABLE; TDS ~30% (+cess). DTAA may reduce.", nriEligible: true },
        { name: "RBI Floating Rate Bonds", rate: 8.05, note: "Govt-backed. Generally for residents; verify NRI eligibility.", nriEligible: "verify" },
      ],

      // Account/balance fields shown on the Inputs tab for this region.
      accountFields: [
        { id: "nre", label: "NRE account / FD balance", help: "Repatriable, INR. Interest tax-free in India." },
        { id: "nro", label: "NRO account / FD balance", help: "For India-sourced income. Interest taxable." },
        { id: "nps", label: "NPS corpus", help: "National Pension System. 60% lump-sum tax-free at 60; 40% buys an annuity." },
        { id: "ppfExisting", label: "Existing PPF balance", help: "Only if opened while resident. NRIs cannot open new PPF." },
        { id: "epf", label: "EPF / gratuity (India job)", help: "From prior Indian employment, if any." },
      ],
    },

    singapore: {
      key: "singapore",
      label: "Singapore",
      currency: { code: "SGD", symbol: "S$", style: "western" },
      flag: "🇸🇬",

      assumptions: {
        inflationPre: 2.5,
        inflationRetire: 2.5,
        returnEquity: 7.0,        // global/US/STI equity, long-run nominal
        returnDebt: 3.5,          // SGS / bond funds / FD
        returnCash: 3.0,          // T-bills / SSB / HYSA (recent elevated short rates)
        returnPreBlend: 6.0,
        returnRetireBlend: 4.5,
        swr: 4.0,                 // classic 4% rule; lower SG inflation supports it
        lifeExpectancy: 88,       // SG longevity is high
        retirementAge: 65,        // statutory; CPF payout eligibility age
        stepUpSip: 4.0,
      },

      schemes: [
        { name: "CPF Ordinary Account (OA)", rate: 2.5, note: "Floor 2.5%. Housing/education/investment." },
        { name: "CPF Special Account (SA)", rate: 4.0, note: "~4%+. SA closed at 55; merges into RA." },
        { name: "CPF Retirement Account (RA)", rate: 4.0, note: "Formed at 55; funds CPF LIFE payouts." },
        { name: "CPF LIFE annuity", rate: null, note: "Lifelong monthly payout from 65. ERS 2025 ≈ S$440,800." },
        { name: "SRS (Supplementary Retirement)", rate: null, note: "Tax-deferred wrapper. Invest inside it. 50% of withdrawals taxable at retirement." },
        { name: "Singapore Savings Bonds (SSB)", rate: 3.0, note: "Govt-backed, capital-guaranteed, step-up to 10y." },
        { name: "6-month T-bills", rate: 3.0, note: "Govt-backed; rate set at auction." },
      ],

      accountFields: [
        { id: "cpfOA", label: "CPF Ordinary Account", help: "Earns ≥2.5%. Usable for housing/investments." },
        { id: "cpfSA", label: "CPF Special Account", help: "Earns ~4%. Retirement-focused (closes at 55 → RA)." },
        { id: "cpfRA", label: "CPF Retirement Account", help: "Funds CPF LIFE. Top up toward FRS/ERS for higher payouts." },
        { id: "srs", label: "SRS balance", help: "Tax-deferred. Cap S$15,300 (citizen/PR) or S$35,700 (foreigner)/yr." },
        { id: "cash", label: "Cash savings / FD", help: "Outside CPF/SRS." },
      ],
    },
  };

  // ---- CPF LIFE (Singapore) ------------------------------------------------
  // Lifelong annuity from age 65. Payout depends on the Retirement Account
  // balance at 65, which is anchored to the retirement sum set aside at 55.
  // standardPayout = published 2025 Standard-plan monthly payout for that sum.
  RP.CPF_LIFE = {
    payoutAge: 65,
    sums: [
      { key: "none", label: "Not a CPF member / no CPF LIFE", sum: 0, standardPayout: 0 },
      { key: "brs", label: "Basic Retirement Sum (BRS) — S$106,500", sum: 106500, standardPayout: 930 },
      { key: "frs", label: "Full Retirement Sum (FRS) — S$213,000", sum: 213000, standardPayout: 1730 },
      { key: "ers", label: "Enhanced Retirement Sum (ERS) — S$440,800", sum: 440800, standardPayout: 3300 },
    ],
    // factor scales the Standard payout; escalation is annual % growth of the payout.
    plans: [
      { key: "standard", label: "Standard — level payout, lower bequest", factor: 1.00, escalation: 0 },
      { key: "basic", label: "Basic — lower payout, higher bequest", factor: 0.95, escalation: 0 },
      { key: "escalating", label: "Escalating — starts lower, +2%/yr", factor: 0.80, escalation: 2 },
    ],
    note: "Payouts begin at age 65 and are not taxable. 2025 figures; verify with the CPF LIFE Estimator.",
  };

  // ---- Tax engines (config consumed by calc/tax.js) ------------------------
  RP.TAX = {
    india: {
      // FY2025-26 (post 23-Jul-2024 regime).
      equityLTCG: { rate: 12.5, exemption: 125000, holdingMonths: 12 }, // > ₹1.25L/yr
      equitySTCG: { rate: 20.0 },
      debtSlabRate: 30.0,        // worst-case slab + NRI TDS basis (refundable on filing)
      nreFdInterestTaxable: false,
      nroFdInterestTaxRate: 30.0,
      cess: 4.0,                 // health & education cess on tax
      note: "NRI: capital gains TDS deducted at source (equity ~12.5%, debt up to ~30%); refundable via ITR. DTAA may reduce. Surcharge applies at high incomes.",
    },
    singapore: {
      capitalGainsTax: 0,        // none
      // Resident progressive brackets (YA2024 onward), annual chargeable income S$.
      incomeBrackets: [
        { upTo: 20000, rate: 0 },
        { upTo: 30000, rate: 2 },
        { upTo: 40000, rate: 3.5 },
        { upTo: 80000, rate: 7 },
        { upTo: 120000, rate: 11.5 },
        { upTo: 160000, rate: 15 },
        { upTo: 200000, rate: 18 },
        { upTo: 240000, rate: 19 },
        { upTo: 280000, rate: 19.5 },
        { upTo: 320000, rate: 20 },
        { upTo: 500000, rate: 22 },
        { upTo: 1000000, rate: 23 },
        { upTo: Infinity, rate: 24 },
      ],
      srsTaxablePortion: 0.5,    // only 50% of SRS withdrawals taxable at/after retirement
      srsCapCitizen: 15300,
      srsCapForeigner: 35700,
      personalReliefCap: 80000,
      note: "No capital gains tax. CPF LIFE payouts not taxed. Only 50% of SRS withdrawals are taxable, ideally spread over up to 10 years.",
    },
  };

  // ---- 4-bucket framework defaults -----------------------------------------
  RP.BUCKETS = {
    definitions: [
      { key: "liquidity", name: "Liquidity", tagline: "1–3 years of expenses, instantly accessible",
        purpose: "Covers near-term spending so you never sell growth assets in a downturn." },
      { key: "income", name: "Income", tagline: "Years 4–10, stable yield",
        purpose: "Bridges the medium term with bonds/FDs/annuity income; refills the Liquidity bucket." },
      { key: "growth", name: "Growth", tagline: "10+ years, equity engine",
        purpose: "Beats inflation over decades; the source of long-term sustainability." },
      { key: "legacy", name: "Legacy & Protection", tagline: "Insurance, estate, aspirations",
        purpose: "Protects the plan (life/health cover) and earmarks money for heirs/goals." },
    ],
    // Liquidity bucket sizing (years of expenses) by age band.
    liquidityYears: { default: 2, conservative: 3, aggressive: 1 },
    // Guyton-Klinger guardrails.
    guardrails: { initialWR: null /* from inputs */, cutThreshold: 1.2, cutPct: 0.10, raiseThreshold: 0.8, raisePct: 0.10 },
  };

  // Per-region product catalog by bucket (named, illustrative — verify costs/rates).
  RP.PRODUCTS = {
    india: {
      liquidity: [
        { name: "Liquid / overnight mutual funds", ret: 6.5, note: "T+1 liquidity; low risk. Gains taxed at slab (debt)." },
        { name: "NRE savings + auto-sweep FD", ret: 7.0, note: "Interest tax-free in India; repatriable." },
        { name: "Arbitrage funds (parking)", ret: 6.5, note: "Taxed as equity — efficient for 1yr+ parking." },
      ],
      income: [
        { name: "NRE fixed deposits (laddered)", ret: 7.0, note: "Tax-free interest in India; ladder 1–5y." },
        { name: "Short-duration / corporate bond funds", ret: 7.5, note: "Debt taxation at slab; pick high-credit-quality." },
        { name: "NPS Tier-1 (C+G tilt near retirement)", ret: 8.0, note: "NRI-eligible; annuitise 40% at exit." },
        { name: "Target-maturity gilt index funds", ret: 7.2, note: "Predictable, govt-backed, low credit risk." },
      ],
      growth: [
        { name: "Nifty 50 index fund/ETF", ret: 12.0, note: "Core large-cap. Low cost (~0.1–0.3% TER)." },
        { name: "Nifty Next 50 index fund", ret: 12.5, note: "Higher growth/vol satellite." },
        { name: "Flexicap / index-of-indices", ret: 12.0, note: "Diversified across caps." },
        { name: "US/Global equity FoF (where allowed)", ret: 11.0, note: "Currency diversification; check RBI/LRS rules for NRIs." },
      ],
      legacy: [
        { name: "Term life insurance", ret: null, note: "Cover ≈ 10–15× annual income minus existing assets." },
        { name: "Family floater health (₹10–25L + super top-up)", ret: null, note: "Critical for NRIs without India employer cover." },
        { name: "Will + nominations across NRE/NRO/demat", ret: null, note: "Essential for cross-border estates." },
      ],
    },
    singapore: {
      liquidity: [
        { name: "6-month T-bills (laddered)", ret: 3.2, note: "Govt-backed; roll every 6 months." },
        { name: "Singapore Savings Bonds (SSB)", ret: 3.0, note: "Capital-guaranteed, redeem any month." },
        { name: "High-yield savings / MMF", ret: 2.8, note: "Instant access for the first year of spend." },
      ],
      income: [
        { name: "CPF LIFE (annuitised RA)", ret: null, note: "Lifelong inflation-imperfect income from 65; longevity hedge." },
        { name: "SGS bonds / bond ETFs", ret: 3.3, note: "Government & high-grade; ladder durations." },
        { name: "Fixed deposits (promo rates)", ret: 3.2, note: "Shop around; capital-stable." },
        { name: "Short-duration bond funds (in SRS)", ret: 3.5, note: "Tax-deferred growth inside SRS." },
      ],
      growth: [
        { name: "Irish-domiciled S&P 500 / World ETF (acc)", ret: 7.0, note: "15% US dividend WHT vs 30%; accumulating = tax-efficient. Hold in SRS/cash." },
        { name: "STI ETF", ret: 6.0, note: "Local large-cap; decent yield." },
        { name: "Global all-world ETF (VWRA-type)", ret: 7.0, note: "One-fund diversification." },
        { name: "REIT ETF (income tilt)", ret: 6.0, note: "Singapore is REIT-rich; adds yield + diversification." },
      ],
      legacy: [
        { name: "Term life insurance", ret: null, note: "Cover ≈ outstanding mortgage + dependants' needs." },
        { name: "Integrated Shield Plan (health)", ret: null, note: "Tops up MediShield Life for private/A-ward care." },
        { name: "CPF nomination + will", ret: null, note: "CPF is NOT covered by a will — make a CPF nomination." },
      ],
    },
  };

  // ---- Model budgets -------------------------------------------------------
  // India: by city tier (monthly INR, two-adult retired household, owned home).
  RP.BUDGET_INDIA = {
    tiers: [
      { key: "metro", label: "Metro (Mumbai, Delhi, Bengaluru)", factor: 1.0 },
      { key: "tier1", label: "Tier-1 (Pune, Hyderabad, Chennai, Kolkata)", factor: 0.80 },
      { key: "tier2", label: "Tier-2 (Jaipur, Kochi, Coimbatore, Indore)", factor: 0.62 },
      { key: "tier3", label: "Tier-3 / town", factor: 0.48 },
    ],
    // Base = Metro monthly INR.
    categories: [
      { key: "food", label: "Food & groceries", base: 25000 },
      { key: "utilities", label: "Utilities (power, water, gas, internet)", base: 7000 },
      { key: "household", label: "Household help & maintenance", base: 10000 },
      { key: "healthcare", label: "Healthcare (out-of-pocket + premiums)", base: 12000 },
      { key: "transport", label: "Transport / car running", base: 8000 },
      { key: "lifestyle", label: "Lifestyle, dining & subscriptions", base: 10000 },
      { key: "travel", label: "Travel & holidays (amortised)", base: 12000 },
      { key: "misc", label: "Miscellaneous & gifts", base: 6000 },
    ],
  };

  // Singapore: by housing/car profile (monthly SGD, two-adult retired household).
  RP.BUDGET_SINGAPORE = {
    profiles: [
      { key: "hdb_nocar", label: "HDB flat, no car", factor: 0.85 },
      { key: "hdb_car", label: "HDB flat, with car", factor: 1.0 },
      { key: "condo_car", label: "Condo, with car", factor: 1.35 },
    ],
    // Base = HDB + car monthly SGD.
    categories: [
      { key: "food", label: "Food & groceries", base: 900 },
      { key: "utilities", label: "Utilities & conservancy", base: 350 },
      { key: "healthcare", label: "Healthcare (incl. IP premiums)", base: 450 },
      { key: "transport", label: "Transport (car / public)", base: 700 },
      { key: "lifestyle", label: "Lifestyle, dining & subscriptions", base: 700 },
      { key: "travel", label: "Travel & holidays (amortised)", base: 800 },
      { key: "insurance", label: "Other insurance", base: 200 },
      { key: "misc", label: "Miscellaneous & gifts", base: 300 },
    ],
  };

  // ---- Help-bubble copy (typical real-world values) ------------------------
  RP.HELP = {
    dob: "Used to compute your current age. Plan from today to your life expectancy.",
    retirementAge: "India NRIs often target 55–60; Singapore CPF payouts start at 65. Typical: 60.",
    lifeExpectancy: "Plan to ~age 85–90 to avoid outliving money. SG longevity ≈ 84–88; India rising. Default conservative.",
    monthlyExpense: "Your CURRENT monthly household spend in today's money. Tab 2 helps you build this up.",
    withdrawalRate: "Annual % of corpus withdrawn. Rule of thumb 3.5–4%. Lower = safer. India's higher inflation argues for ~3.5%.",
    inflationPre: "Long-run CPI. India ≈ 5–6%; Singapore ≈ 2–3%.",
    inflationRetire: "Inflation during retirement; medical inflation often runs higher (8–10% India).",
    returnEquity: "Long-run nominal equity return. India ≈ 11–13%; global/SG ≈ 6–8%. Past ≠ future.",
    returnDebt: "Bonds/FDs/debt funds. India ≈ 6.5–7.5%; SG ≈ 3–3.5%.",
    returnCash: "Liquid funds/T-bills/savings. India ≈ 4–6.5%; SG ≈ 2.8–3.5%.",
    cash: "Bucket 1 candidate. Keep ~1–3 years of expenses liquid.",
    debt: "Bonds, FDs, debt funds, CPF, NRE FDs — your Income bucket.",
    equity: "Stocks, index funds, ETFs — your Growth engine.",
    insuranceLife: "Term cover ≈ 10–15× annual income (India) or mortgage + dependants' needs (SG).",
    insuranceHealth: "India: ₹10–25L floater + super top-up. SG: Integrated Shield Plan over MediShield Life.",
    mortgage: "Outstanding home loan. Aim to be debt-free by retirement.",
    carLoan: "Outstanding vehicle loan + EMI.",
    eduLoan: "Outstanding education loan (yours or dependants').",
    personalLoan: "High-interest unsecured debt — clear this first.",
    cpf: "Singapore: OA ≥2.5%, SA/RA ~4%. RA funds CPF LIFE from 65.",
    srs: "Tax-deferred wrapper. Contributions cut taxable income; only 50% of withdrawals taxed at retirement.",
    stepUpSip: "Raise your monthly investment each year as income grows. 5–10% typical.",
    cpfLifeSum: "The retirement sum you'll set aside at 55 sets your RA at 65 and thus your payout. 2025: BRS≈$930/mo, FRS≈$1,730/mo, ERS≈$3,300/mo. Pick 'none' if not a CPF member.",
    cpfLifePlan: "Standard: level payout. Basic: lower payout, larger bequest. Escalating: starts ~20% lower but rises 2%/yr to fight inflation.",
    cpfLifeOverride: "Override the estimate with your own figure from the official CPF LIFE Estimator (cpf.gov.sg). Leave blank to use the table estimate.",
    currentCorpus: "Your investable assets today (cash + debt + equity). For Singapore, CPF RA committed to CPF LIFE is excluded — it pays income, not lump-sum.",
    shortfall: "Extra corpus still needed at retirement = target − future value of today's investments. Your monthly saving closes this gap.",
  };

})(window.RP = window.RP || {});
