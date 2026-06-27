/* =============================================================================
 * ui/glossary.js — Tab 5: plain-English glossary of every term used in the app,
 * each with a link to a reputable, easy-to-read source.
 *
 * Links verified June 2026. Sources: Investopedia (general finance), Charles
 * Schwab & CNBC Select (retirement strategy), CPF Board / IRAS / MAS
 * (Singapore), ClearTax & NPS Trust (India). Educational — not advice.
 * ========================================================================== */
(function (RP) {
  "use strict";
  RP.tabs = RP.tabs || {};

  // term, definition, url (optional), source label (optional)
  function I(t, d, url, src) { return { t: t, d: d, url: url, src: src }; }

  var GROUPS = [
    { group: "Core retirement concepts", items: [
      I("Retirement corpus", "The total pot of savings and investments you aim to have at retirement to fund the rest of your life. The app shows this as your “corpus required.”",
        "https://www.investopedia.com/terms/n/nestegg.asp", "Investopedia"),
      I("Accumulation phase", "Your working years, when you are saving and investing to build the corpus.",
        "https://www.investopedia.com/terms/a/accumulationphase.asp", "Investopedia"),
      I("Drawdown (decumulation) phase", "Your retirement years, when you spend down the corpus instead of adding to it.",
        "https://www.schwab.com/learn/story/phasing-retirement-with-bucket-drawdown-strategy", "Schwab"),
      I("Life expectancy / longevity", "The age you plan your money to last to. Setting it too low risks outliving your savings.",
        "https://www.investopedia.com/terms/l/longevityrisk.asp", "Investopedia"),
      I("Terminal corpus", "What is left at your planned end-age. A positive figure means the plan didn’t run out — a buffer or legacy.", null, null),
    ] },

    { group: "Returns & inflation", items: [
      I("Inflation", "The gradual rise in prices that erodes purchasing power — your money buys less over time.",
        "https://www.investopedia.com/terms/i/inflation.asp", "Investopedia"),
      I("Nominal vs real return", "Nominal is the headline return; real is what’s left after subtracting inflation — your true growth in spending power.",
        "https://www.investopedia.com/terms/r/realrateofreturn.asp", "Investopedia"),
      I("CAGR", "Compound Annual Growth Rate — the smoothed average yearly growth of an investment over several years.",
        "https://www.investopedia.com/terms/c/cagr.asp", "Investopedia"),
      I("Blended return", "A weighted-average return across your mix of cash, debt and equity.", null, null),
    ] },

    { group: "Saving & withdrawal", items: [
      I("SIP (Systematic Investment Plan)", "Investing a fixed amount every month regardless of market level — the Indian term for dollar-cost averaging.",
        "https://www.investopedia.com/terms/d/dollarcostaveraging.asp", "Investopedia"),
      I("Step-up SIP", "Raising your monthly SIP by a set percentage each year as your income grows.", null, null),
      I("Withdrawal rate", "The percentage of your corpus you take out each year in retirement.",
        "https://www.investopedia.com/terms/s/safe-withdrawal-rate-swr-method.asp", "Investopedia"),
      I("Safe Withdrawal Rate / 4% rule", "A rule of thumb that withdrawing ~3.5–4% of your starting corpus (rising with inflation) is likely to last ~30 years.",
        "https://www.investopedia.com/terms/f/four-percent-rule.asp", "Investopedia"),
    ] },

    { group: "The 4-bucket framework & guardrails", items: [
      I("Bucket strategy", "Splitting money by when you’ll spend it, so short-term needs never force you to sell long-term investments at a bad time.",
        "https://www.schwab.com/learn/story/phasing-retirement-with-bucket-drawdown-strategy", "Schwab"),
      I("Liquidity / Income / Growth / Legacy buckets", "This app’s four buckets: cash for the near term, bonds/FDs for the mid term, equity for the long term, plus insurance and estate planning.",
        "https://www.britannica.com/money/retirement-bucket-strategy", "Britannica Money"),
      I("Glide path", "Gradually shifting your mix from equity toward safer assets as you age.",
        "https://www.investopedia.com/terms/g/glide-path.asp", "Investopedia"),
      I("Rebalancing", "Periodically resetting your mix back to its target weights by trimming what grew and topping up what lagged.",
        "https://www.investopedia.com/terms/r/rebalancing.asp", "Investopedia"),
      I("Guyton-Klinger guardrails", "A flexible withdrawal rule: trim spending ~10% after bad markets and raise it after good ones, to make money last longer.",
        "https://www.cnbc.com/select/guardrails-approach-retirement-withdrawal-strategy-how-it-works/", "CNBC Select"),
      I("Target (drawdown table)", "Your inflation-adjusted withdrawal need for the year, net of income, before any guardrail adjustment.", null, null),
      I("Cut line / Raise line", "The guardrail thresholds — your withdrawal rate × 1.2 (cut) and × 0.8 (raise). Crossing them triggers a spending cut or raise.", null, null),
    ] },

    { group: "Risks", items: [
      I("Sequence-of-returns risk", "The danger of poor returns in the first retirement years, which can permanently damage a portfolio you’re drawing down.",
        "https://www.investopedia.com/terms/s/sequence-risk.asp", "Investopedia"),
      I("Longevity risk", "The risk of outliving your money. Annuities like CPF LIFE help hedge it.",
        "https://www.investopedia.com/terms/l/longevityrisk.asp", "Investopedia"),
      I("Inflation risk", "The risk that rising prices erode the real value of your income and savings.",
        "https://www.investopedia.com/terms/i/inflationrisk.asp", "Investopedia"),
      I("Currency risk", "For NRIs, the risk that exchange-rate moves change your real wealth when you earn and spend in different currencies.",
        "https://www.investopedia.com/terms/c/currencyrisk.asp", "Investopedia"),
      I("Concentration risk", "Having too much of your money in a single asset or holding.",
        "https://www.investopedia.com/terms/c/concentrationrisk.asp", "Investopedia"),
    ] },

    { group: "Asset classes & products", items: [
      I("Equity", "Ownership in companies (stocks) — higher long-run return, but more ups and downs.",
        "https://www.investopedia.com/terms/e/equity.asp", "Investopedia"),
      I("Debt / fixed income", "Loans to governments or companies (bonds, FDs) that pay interest — steadier and lower-return than equity.",
        "https://www.investopedia.com/terms/f/fixedincome.asp", "Investopedia"),
      I("Cash & equivalents", "Money and near-money (savings, liquid funds, T-bills) you can access almost instantly.",
        "https://www.investopedia.com/terms/c/cashequivalents.asp", "Investopedia"),
      I("Index fund", "A low-cost fund that simply tracks a market index such as the Nifty 50 or S&P 500.",
        "https://www.investopedia.com/terms/i/indexfund.asp", "Investopedia"),
      I("ETF", "An Exchange-Traded Fund — an index fund that trades like a stock through the day.",
        "https://www.investopedia.com/terms/e/etf.asp", "Investopedia"),
      I("REIT", "A Real Estate Investment Trust — a company owning income-producing property, letting you invest in real estate via the market.",
        "https://www.investopedia.com/terms/r/reit.asp", "Investopedia"),
      I("Annuity", "A product that pays you a guaranteed income for life or a set period — e.g., CPF LIFE or an NPS annuity.",
        "https://www.investopedia.com/terms/a/annuity.asp", "Investopedia"),
      I("Treasury bills (T-bills)", "Short-term government debt — very safe, sold at a discount and maturing within a year.",
        "https://www.investopedia.com/terms/t/treasurybill.asp", "Investopedia"),
      I("Nifty 50", "India’s benchmark stock index, made up of 50 large companies.",
        "https://www.niftyindices.com/indices/equity/broad-based-indices/nifty-50", "NSE Indices"),
    ] },

    { group: "India & NRI terms", items: [
      I("NRI (Non-Resident Indian)", "An Indian citizen living abroad beyond set day-count thresholds, taxed differently in India.",
        "https://cleartax.in/s/income-tax-for-nri", "ClearTax"),
      I("NRE account", "For parking foreign income in India — interest is tax-free in India and fully repatriable.",
        "https://cleartax.in/s/nre-nro-accounts", "ClearTax"),
      I("NRO account", "For India-sourced income such as rent — interest is taxable, with TDS deducted.",
        "https://cleartax.in/s/nre-nro-accounts", "ClearTax"),
      I("PPF (Public Provident Fund)", "A 15-year government savings scheme with tax-free returns (EEE). NRIs can’t open new ones but may keep an existing one to maturity.",
        "https://cleartax.in/s/ppf", "ClearTax"),
      I("SCSS (Senior Citizens’ Savings Scheme)", "A government-backed scheme for those 60+. Not open to NRIs.",
        "https://cleartax.in/s/income-tax-for-nri", "ClearTax"),
      I("SSY (Sukanya Samriddhi Yojana)", "A government savings scheme for a girl child. Not available to NRIs.",
        "https://cleartax.in/s/sukanya-samriddhi-yojana", "ClearTax"),
      I("NPS (National Pension System)", "A low-cost, market-linked retirement account; part is taken as a lump sum and part buys an annuity at exit. NRIs can invest.",
        "https://www.npstrust.org.in/", "NPS Trust"),
    ] },

    { group: "India tax terms", items: [
      I("LTCG / STCG", "Long-/Short-Term Capital Gains tax on profits from selling assets; the rate depends on the asset and how long you held it.",
        "https://cleartax.in/s/long-term-capital-gains-ltcg-tax", "ClearTax"),
      I("TDS (Tax Deducted at Source)", "Tax withheld upfront — e.g., on an NRI’s fund redemptions — which you reclaim by filing a return.",
        "https://cleartax.in/s/section-195", "ClearTax"),
      I("DTAA", "Double Taxation Avoidance Agreement — treaties that stop NRIs being taxed twice on the same income, often at a reduced rate.",
        "https://cleartax.in/s/dtaa-income-tax", "ClearTax"),
      I("Cess", "A small extra levy (currently 4% health & education cess) added on top of your income tax.", null, null),
    ] },

    { group: "Singapore terms", items: [
      I("CPF", "Singapore’s mandatory savings system, split across Ordinary, Special, MediSave and Retirement accounts.",
        "https://www.cpf.gov.sg/member", "CPF Board"),
      I("CPF OA / SA / RA", "Ordinary (housing, ≥2.5%), Special (retirement, ~4%), and Retirement Account (formed at 55, funds CPF LIFE).",
        "https://www.cpf.gov.sg/member", "CPF Board"),
      I("CPF LIFE", "A national annuity that pays you a monthly income for life from age 65.",
        "https://www.cpf.gov.sg/member/retirement-income/monthly-payouts/cpf-life", "CPF Board"),
      I("Standard / Basic / Escalating plans", "CPF LIFE options: a level payout, a lower payout with a bigger bequest, or a payout that rises 2% a year.",
        "https://www.cpf.gov.sg/member/retirement-income/monthly-payouts/cpf-life", "CPF Board"),
      I("BRS / FRS / ERS", "Basic / Full / Enhanced Retirement Sums — the amount set aside at 55 that sets your CPF LIFE payout.",
        "https://www.cpf.gov.sg/service/article/what-are-the-retirement-sums-basic-retirement-sum-brs-full-retirement-sum-frs-and-enhanced-retirement-sum-ers", "CPF Board"),
      I("SRS (Supplementary Retirement Scheme)", "A voluntary, tax-deferred account; contributions cut taxable income and only 50% of withdrawals are taxed at retirement.",
        "https://www.iras.gov.sg/taxes/individual-income-tax/basics-of-individual-income-tax/special-tax-schemes/srs-contributions", "IRAS"),
      I("SGS / Singapore Savings Bonds (SSB)", "Government bonds. SSB is capital-guaranteed and can be redeemed in any month with no loss.",
        "https://www.mas.gov.sg/bonds-and-bills/singapore-savings-bonds", "MAS"),
      I("MediShield Life / Integrated Shield Plan", "National health insurance, optionally topped up by a private Integrated Shield Plan for private or higher-ward care.",
        "https://www.cpf.gov.sg/member/healthcare-financing/medishield-life", "CPF Board"),
    ] },

    { group: "Insurance & debt", items: [
      I("Term life insurance", "Pure life cover for a fixed period — pays out if you die during the term. Cheap, with no investment element.",
        "https://www.investopedia.com/terms/t/termlife.asp", "Investopedia"),
      I("Health floater / super top-up", "A family health policy sharing one sum insured, plus a cheap “top-up” that pays once costs cross a set threshold.", null, null),
      I("Mortgage", "A loan to buy property, repaid with interest over many years.",
        "https://www.investopedia.com/terms/m/mortgage.asp", "Investopedia"),
      I("EMI", "Equated Monthly Instalment — the fixed monthly repayment on a loan.", null, null),
    ] },
  ];

  RP.tabs.glossary = function (d) {
    var U = RP.ui;
    var groupsHtml = GROUPS.map(function (grp) {
      var items = grp.items.map(function (it) {
        var link = it.url
          ? '<a class="gl-link" href="' + it.url + '" target="_blank" rel="noopener noreferrer">Learn more ↗' +
              (it.src ? ' <span class="gl-src">' + U.esc(it.src) + '</span>' : '') + '</a>'
          : '';
        return '<div class="gl-term" data-text="' + U.esc((it.t + " " + it.d + " " + (it.src || "")).toLowerCase()) + '">' +
          '<div class="gl-term-name">' + U.esc(it.t) + '</div>' +
          '<div class="gl-term-def">' + U.esc(it.d) + '</div>' +
          link +
        '</div>';
      }).join("");
      return '<section class="card gl-group">' +
        '<h3 class="section-title">' + U.esc(grp.group) + '</h3>' +
        '<div class="gl-grid">' + items + '</div></section>';
    }).join("");

    return '<div class="gl-intro card">' +
        '<h2>Glossary</h2>' +
        '<p class="muted">Plain-English explanations of every term used in this app, with links to reputable sources for more detail. ' +
        'This is educational information, not financial advice.</p>' +
        '<input id="gl-search" class="gl-search" type="search" placeholder="Search terms… (e.g. CPF LIFE, sequence risk, LTCG)" autocomplete="off">' +
      '</div>' +
      groupsHtml +
      '<p class="muted small gl-foot">Links open in a new tab. Definitions are simplified for clarity; always check the linked source and current rules before acting.</p>';
  };

})(window.RP = window.RP || {});
