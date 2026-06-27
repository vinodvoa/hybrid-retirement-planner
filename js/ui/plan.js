/* =============================================================================
 * ui/plan.js — Tab 4: hybrid 4-bucket setup guide, products, tax, risks.
 * ========================================================================== */
(function (RP) {
  "use strict";
  RP.tabs = RP.tabs || {};

  var SEV_LABEL = { high: "High", med: "Medium", low: "Low", ok: "Good" };

  RP.tabs.plan = function (d) {
    var inp = d.inp, acc = d.acc, region = d.region, U = RP.ui;
    var defs = RP.BUCKETS.definitions;
    var products = RP.PRODUCTS[region];

    // Target allocation AT RETIREMENT (invested buckets) + a Legacy earmark.
    var allocR = RP.calc.targetAllocation(inp.retirementAge, acc.corpusTarget, acc.expenseAtRetirementAnnual, inp.liquidityYears);
    var allocNow = RP.calc.targetAllocation(inp.currentAge, inp.investmentsTotal, inp.monthlyExpense * 12, inp.liquidityYears);

    // Bucket intro cards
    var introCards = '<div class="bucket-cards">' + defs.map(function (b, i) {
      return '<div class="bucket-card b' + (i + 1) + '">' +
        '<div class="bk-num">' + (i + 1) + '</div>' +
        '<div class="bk-name">' + U.esc(b.name) + '</div>' +
        '<div class="bk-tag">' + U.esc(b.tagline) + '</div>' +
        '<div class="bk-purpose muted">' + U.esc(b.purpose) + '</div>' +
      '</div>';
    }).join("") + '</div>';

    var allocBar = RP.charts.allocBar([
      { name: "Liquidity", value: allocR.liquidity, cls: "c-liq" },
      { name: "Income", value: allocR.income, cls: "c-inc" },
      { name: "Growth", value: allocR.growth, cls: "c-grw" },
    ], region);

    // Per-bucket product tables (invested buckets)
    function prodTable(key, targetAmt) {
      var list = products[key] || [];
      var rows = list.map(function (pr) {
        return '<tr><td>' + U.esc(pr.name) + '</td>' +
          '<td class="num">' + (pr.ret == null ? "—" : RP.pct(pr.ret)) + '</td>' +
          '<td class="muted small">' + U.esc(pr.note) + '</td></tr>';
      }).join("");
      return '<div class="card bucket-detail">' +
        '<div class="bd-head"><h3 class="section-title">' + U.esc(bucketName(key)) + '</h3>' +
          (targetAmt != null ? '<span class="bd-target">Target at retirement: <b>' + RP.moneyShort(targetAmt, region) + '</b></span>' : "") + '</div>' +
        '<table class="sheet"><thead><tr><th>Suggested instrument</th><th class="num">Typical return</th><th>Notes</th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div>';
    }
    function bucketName(k) {
      return ({ liquidity: "Bucket 1 · Liquidity", income: "Bucket 2 · Income", growth: "Bucket 3 · Growth", legacy: "Bucket 4 · Legacy & Protection" })[k];
    }

    // CPF LIFE callout (Singapore) — sits with the Income bucket.
    var cpfLifeBanner = "";
    if (region === "singapore" && acc.cpfMonthly > 0) {
      var planObj = RP.CPF_LIFE.plans.filter(function (x) { return x.key === d.p.cpfLifePlan; })[0] || RP.CPF_LIFE.plans[0];
      var sumObj = RP.CPF_LIFE.sums.filter(function (x) { return x.key === d.p.cpfLifeSum; })[0] || RP.CPF_LIFE.sums[0];
      cpfLifeBanner = '<div class="card cpf-banner">' +
        '<h3 class="section-title">CPF LIFE — your annuity backbone</h3>' +
        '<div class="protect-grid">' +
          U.stat("Selected scheme", planObj.label.split(" — ")[0], U.esc(sumObj.label)) +
          U.stat("Estimated payout", RP.money(acc.cpfMonthly, region) + "/mo", "tax-free, from age " + RP.CPF_LIFE.payoutAge, "accent") +
          U.stat("Lifetime value (PV today's terms)", RP.moneyShort(acc.cpfPV, region), "cuts the corpus you must build", "good") +
        '</div>' +
        '<p class="muted small">CPF LIFE is a lifelong, government-backed annuity — your strongest longevity hedge. ' +
        (planObj.key === "escalating"
          ? 'Your <b>Escalating</b> plan rises 2%/yr, partly tracking inflation.'
          : 'Your <b>' + U.esc(planObj.label.split(" — ")[0]) + '</b> plan pays a level amount, so its real value erodes with inflation — consider the Escalating plan, or keep more in the Growth bucket to compensate.') +
        ' This income reduces what your invested buckets must cover.</p></div>';
    }

    // Legacy bucket (protection check)
    var lifeNeed = region === "india" ? inp.monthlyExpense * 12 * 10 : (inp.debtMortgage + inp.monthlyExpense * 12 * 7);
    var legacyRows = products.legacy.map(function (pr) {
      return '<tr><td>' + U.esc(pr.name) + '</td><td class="muted small">' + U.esc(pr.note) + '</td></tr>';
    }).join("");
    var legacy = '<div class="card bucket-detail">' +
      '<div class="bd-head"><h3 class="section-title">' + bucketName("legacy") + '</h3></div>' +
      '<div class="protect-grid">' +
        U.stat("Life cover — you have", RP.moneyShort(inp.insuranceLife, region), "suggested ≈ " + RP.moneyShort(lifeNeed, region),
          inp.insuranceLife >= lifeNeed ? "good" : "warn") +
        U.stat("Health cover — you have", RP.moneyShort(inp.insuranceHealth, region), region === "india" ? "suggest ₹10–25L floater" : "Integrated Shield Plan",
          inp.insuranceHealth > 0 ? "good" : "bad") +
      '</div>' +
      '<table class="sheet"><thead><tr><th>Protection step</th><th>Notes</th></tr></thead><tbody>' + legacyRows + '</tbody></table></div>';

    // Tax treatment
    var taxCfg = RP.TAX[region];
    var taxBody;
    if (region === "india") {
      taxBody = '<ul class="bullets">' +
        '<li><b>Equity LTCG:</b> ' + RP.pct(taxCfg.equityLTCG.rate) + ' on gains over ' + RP.money(taxCfg.equityLTCG.exemption, region) + '/yr (held > 12 months). STCG ' + RP.pct(taxCfg.equitySTCG.rate) + '.</li>' +
        '<li><b>Debt funds / non-equity:</b> taxed at your slab; NRI redemptions face TDS up to ~' + RP.pct(taxCfg.debtSlabRate) + ' — refundable when you file an ITR.</li>' +
        '<li><b>NRE FD interest:</b> tax-free in India and repatriable. <b>NRO interest:</b> taxable, TDS ~' + RP.pct(taxCfg.nroFdInterestTaxRate) + '.</li>' +
        '<li><b>DTAA:</b> your country of residence treaty may reduce Indian TDS — keep a TRC and file Form 10F.</li>' +
        '<li class="muted">' + U.esc(taxCfg.note) + '</li></ul>';
    } else {
      taxBody = '<ul class="bullets">' +
        '<li><b>Capital gains:</b> Singapore has <b>no capital gains tax</b> — equity/bond gains are generally untaxed.</li>' +
        '<li><b>CPF LIFE payouts:</b> not taxable.</li>' +
        '<li><b>SRS:</b> contributions reduce taxable income (cap S$' + RP.money(taxCfg.srsCapCitizen, region).replace("S$", "") + ' citizen/PR, S$' + RP.money(taxCfg.srsCapForeigner, region).replace("S$", "") + ' foreigner). Only <b>50%</b> of withdrawals are taxable — spread over up to 10 years from the statutory retirement age to minimise tax.</li>' +
        '<li><b>Foreign ETFs:</b> prefer Irish-domiciled accumulating funds (15% US dividend withholding vs 30% for US-domiciled).</li>' +
        '<li class="muted">' + U.esc(taxCfg.note) + '</li></ul>';
    }
    var taxCard = U.section("Tax treatment — " + RP.REGIONS[region].label, taxBody);

    // Guardrail rule
    var g = RP.BUCKETS.guardrails;
    var guardCard = U.section("The 'hybrid' withdrawal rule (Guyton-Klinger guardrails)",
      '<p class="muted">Each year you take an inflation-adjusted withdrawal — but with guardrails that protect the corpus in bad markets:</p>' +
      '<ul class="bullets">' +
        '<li>If a year\'s withdrawal rises above <b>' + (g.cutThreshold * 100 - 100).toFixed(0) + '%</b> over your starting rate (markets fell), <b>cut spending by ' + (g.cutPct * 100).toFixed(0) + '%</b>.</li>' +
        '<li>If it falls more than <b>' + (100 - g.raiseThreshold * 100).toFixed(0) + '%</b> below (markets did well), you can <b>raise spending by ' + (g.raisePct * 100).toFixed(0) + '%</b>.</li>' +
        '<li>Always spend from <b>Liquidity</b> first; refill it from <b>Growth</b> only in good years. This is what tames sequence-of-returns risk.</li>' +
      '</ul>');

    // Risk warnings
    var riskCard = '<div class="card"><h3 class="section-title">Risk review & practical suggestions</h3>' +
      '<div class="risks">' + d.risks.map(function (r) {
        return '<div class="risk ' + r.sev + '">' +
          '<div class="risk-top"><span class="risk-badge">' + SEV_LABEL[r.sev] + '</span><b>' + U.esc(r.title) + '</b></div>' +
          '<div class="risk-msg">' + U.esc(r.msg) + '</div>' +
          '<div class="risk-fix"><span>Do this →</span> ' + U.esc(r.fix) + '</div>' +
        '</div>';
      }).join("") + '</div></div>';

    // Action checklist
    var steps = [
      "Park " + inp.liquidityYears + " years of expenses (" + RP.moneyShort(allocR.liquidity, region) + " at retirement) in Bucket 1 before you stop working.",
      "Build Bucket 2 (Income) with " + (region === "india" ? "NRE FD ladders, target-maturity gilt funds and NPS" : "CPF LIFE top-ups, SGS/SSB ladders and SRS bond funds") + ".",
      "Keep Bucket 3 (Growth) in low-cost index funds; let it compound and only refill cash in good years.",
      "Close personal/car loans now; be mortgage-free by retirement.",
      "Lock in term life + health cover early, before age loadings.",
      region === "india" ? "Use NRE accounts for tax-free, repatriable income; keep a TRC for DTAA." : "Maximise SRS each year for tax relief; plan a 10-year SRS withdrawal runway from 62/65.",
    ];
    var checklist = U.section("Your step-by-step plan", '<ol class="checklist">' +
      steps.map(function (s) { return '<li>' + U.esc(s) + '</li>'; }).join("") + '</ol>');

    return '<div class="plan-intro card"><h2>Your hybrid 4-bucket plan — ' + RP.REGIONS[region].label + '</h2>' +
        '<p class="muted">A practical structure that separates money by <b>when you\'ll spend it</b>, so short-term needs never force you to sell long-term growth assets at the wrong time.</p>' +
        introCards +
        '<div class="alloc-block"><div class="alloc-title">Suggested allocation of your corpus at retirement — ' + RP.money(acc.corpusTarget, region) + '</div>' + allocBar + '</div>' +
      '</div>' +
      '<div class="print-btn-row"><button class="btn" data-action="print">Print / Save this plan as PDF</button></div>' +
      prodTable("liquidity", allocR.liquidity) +
      prodTable("income", allocR.income) +
      cpfLifeBanner +
      prodTable("growth", allocR.growth) +
      legacy +
      guardCard +
      taxCard +
      riskCard +
      checklist;
  };

})(window.RP = window.RP || {});
