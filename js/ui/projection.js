/* =============================================================================
 * ui/projection.js — Tab 3: corpus/SIP results, charts, drawdown table.
 * ========================================================================== */
(function (RP) {
  "use strict";
  RP.tabs = RP.tabs || {};

  function accumulationSeries(inp, acc) {
    // Yearly corpus path from now to retirement (annual compounding + annual SIP).
    var years = Math.round(acc.yearsToRetire);
    var bal = inp.investmentsTotal;
    var g = inp.returnPre / 100;
    var labels = [], vals = [], target = [];
    for (var y = 0; y <= years; y++) {
      labels.push("Age " + Math.round(inp.currentAge + y));
      vals.push(bal);
      target.push(acc.corpusTarget);
      bal = bal * (1 + g) + acc.sipLevel * 12;
    }
    return { labels: labels, vals: vals, target: target };
  }

  RP.tabs.projection = function (d) {
    var inp = d.inp, acc = d.acc, region = d.region, U = RP.ui;
    var dr = d.p.sorr ? d.sorr : d.base;
    var rows = dr.rows;

    // Headline cards
    var cards = '<div class="stat-grid hero">' +
      U.stat("Corpus required", RP.moneyShort(acc.corpusTarget, region), "at retirement (age " + inp.retirementAge + ")", "accent") +
      U.stat("Monthly saving (level)", RP.moneyShort(acc.sipLevel, region), "for " + acc.yearsToRetire.toFixed(0) + " years") +
      U.stat("Monthly saving (step-up " + inp.stepUpSip + "%)", RP.moneyShort(acc.sipStepUp, region), "starts lower, rises") +
      U.stat(acc.gap > 0 ? "Funding gap" : "Surplus", RP.moneyShort(Math.abs(acc.corpusTarget - acc.fvExisting), region),
        "vs projected " + RP.moneyShort(acc.fvExisting, region), acc.gap > 0 ? "warn" : "good") +
      U.stat("Plan outcome", dr.success ? "Lasts to " + inp.lifeExpectancy + " ✓" : "Runs out at " + dr.depletedAtAge + " ✕",
        d.p.sorr ? "stress scenario" : "base case", dr.success ? "good" : "bad") +
    '</div>';

    // Two-method comparison
    var methods = U.section("Two ways to size the corpus — cross-check",
      '<div class="method-cmp">' +
        '<div class="method"><div class="m-name">Inflation-adjusted annuity</div>' +
          '<div class="m-val">' + RP.moneyShort(acc.corpusReal, region) + '</div>' +
          '<div class="muted small">PV of an inflation-growing income to age ' + inp.lifeExpectancy + ' at a real return.</div></div>' +
        '<div class="method"><div class="m-name">Withdrawal-rate (' + inp.swr + '%)</div>' +
          '<div class="m-val">' + RP.moneyShort(acc.corpusSWR, region) + '</div>' +
          '<div class="muted small">First-year spend ÷ withdrawal rate.</div></div>' +
        '<div class="method accent"><div class="m-name">Planning target (higher)</div>' +
          '<div class="m-val">' + RP.moneyShort(acc.corpusTarget, region) + '</div>' +
          '<div class="muted small">We use the more conservative figure. Divergence: ' + acc.divergencePct.toFixed(0) + '%.</div></div>' +
      '</div>', "both should be in the same ballpark");

    // Charts
    var accS = accumulationSeries(inp, acc);
    var accChart = RP.charts.line(
      [{ values: accS.vals, cls: "c-growth", name: "Projected corpus" },
       { values: accS.target, cls: "c-target", name: "Target" }],
      accS.labels, region, "Accumulation — saving toward your target");

    var ddLabels = rows.map(function (r) { return r.age; });
    var ddChart = RP.charts.line(
      [{ values: rows.map(function (r) { return r.closeCorpus; }), cls: "c-income", name: "Corpus during retirement" }],
      ddLabels, region, "Drawdown — corpus through retirement" + (d.p.sorr ? " (stress)" : ""));

    var bucketChart = RP.charts.stacked(
      [{ values: rows.map(function (r) { return r.liquidity; }), cls: "c-liq", name: "Liquidity" },
       { values: rows.map(function (r) { return r.income; }), cls: "c-inc", name: "Income" },
       { values: rows.map(function (r) { return r.growth; }), cls: "c-grw", name: "Growth" }],
      ddLabels, region, "Bucket balances over time");

    // Drawdown table
    var showCpf = region === "singapore" && d.acc.cpfMonthly > 0;
    var showOther = d.acc.otherIncomeMonthly > 0;
    var netNote = (showOther && showCpf) ? ' "Withdrawal" is net of rental/other income and CPF LIFE.'
      : showCpf ? ' "Withdrawal" is net of CPF LIFE income.'
      : showOther ? ' "Withdrawal" is net of rental/other income.' : '';
    var g = RP.BUCKETS.guardrails;
    var trs = rows.map(function (r) {
      return '<tr>' +
        '<td>' + r.age + '</td><td>' + r.year + '</td>' +
        '<td class="num">' + RP.money(r.openCorpus, region) + '</td>' +
        (showOther ? '<td class="num pos">' + (r.otherIncome > 0 ? RP.money(r.otherIncome, region) : "—") + '</td>' : "") +
        (showCpf ? '<td class="num pos">' + (r.cpfIncome > 0 ? RP.money(r.cpfIncome, region) : "—") + '</td>' : "") +
        '<td class="num">' + RP.money(r.target, region) + '</td>' +
        '<td class="num muted">' + RP.money(r.raiseLine, region) + '</td>' +
        '<td class="num muted">' + RP.money(r.cutLine, region) + '</td>' +
        '<td class="num"><b>' + RP.money(r.withdrawal, region) + '</b></td>' +
        '<td class="num warn-t">' + RP.money(r.tax, region) + '</td>' +
        '<td class="num">' + RP.money(r.netSpend, region) + '</td>' +
        '<td class="num ' + (r.ret < 0 ? "neg" : "pos") + '">' + RP.money(r.ret, region) + '</td>' +
        '<td class="num">' + RP.money(r.closeCorpus, region) + '</td>' +
        (r.guardrail !== "none" ? '<td class="gr ' + r.guardrail + '">' + r.guardrail + '</td>' : '<td></td>') +
      '</tr>';
    }).join("");

    var table = '<div class="card">' +
      '<div class="table-head"><h3 class="section-title">Year-by-year drawdown with ' + RP.pct(d.inp.swr) + ' withdrawal rate</h3>' +
        '<span class="muted small">Withdrawals come Liquidity → Income → Growth; buckets rebalance annually. Tax & returns by region assumptions.' +
        netNote + ' <b>Target</b> is the inflation-adjusted draw (net of income) before guardrails are applied (see the box above); <b>Withdrawal</b> is what is actually drawn after. <b>Return</b> is the investment return (ROI) earned on the remaining corpus.</span></div>' +
      '<div class="table-scroll"><table class="sheet compact">' +
        '<thead><tr><th>Age</th><th>Year</th><th class="num">Opening</th>' +
          (showOther ? '<th class="num">Rental/other</th>' : "") +
          (showCpf ? '<th class="num">CPF LIFE</th>' : "") +
          '<th class="num">Target</th>' +
          '<th class="num">Raise line</th><th class="num">Cut line</th>' +
          '<th class="num">Withdrawal</th>' +
          '<th class="num">Tax</th><th class="num">Net spend</th><th class="num">Return</th><th class="num">Closing</th><th>Guardrail</th></tr></thead>' +
        '<tbody>' + trs + '</tbody>' +
      '</table></div></div>';

    // Explainer box: how the raise/cut lines are derived + the spending zone.
    var swr = d.inp.swr;
    var raise1 = (swr * g.raiseThreshold).toFixed(1) + "%";
    var cut1 = (swr * g.cutThreshold).toFixed(1) + "%";
    var diagramTmpl =
      "Safe spending zone\n" +
      "       <-------------------->\n" +
      "\n" +
      "RAISE LINE                 CUT LINE\n" +
      "   2.8%                      4.2%\n" +
      "     |                         |\n" +
      "     |---- normal spending ----|\n" +
      "\n" +
      "Below 2.8%                 Above 4.2%\n" +
      "Spend 10% more             Spend 10% less";
    var diagram = diagramTmpl.split("2.8%").join(raise1).split("4.2%").join(cut1);

    var guardBox = '<div class="card guard-box">' +
      '<h3 class="section-title">How the raise &amp; cut lines work</h3>' +
      '<p class="muted small">Guardrails flex your spending to protect the corpus. Both lines are a % of your corpus, derived from your <b>' + RP.pct(swr) + '</b> withdrawal rate:</p>' +
      '<ul class="bullets small">' +
        '<li><b>Raise line</b> = withdrawal rate × ' + g.raiseThreshold + ' = ' + RP.pct(swr) + ' × ' + g.raiseThreshold + ' = <b>' + raise1 + '</b> of corpus</li>' +
        '<li><b>Cut line</b> = withdrawal rate × ' + g.cutThreshold + ' = ' + RP.pct(swr) + ' × ' + g.cutThreshold + ' = <b>' + cut1 + '</b> of corpus</li>' +
      '</ul>' +
      '<pre class="ascii-box">' + U.esc(diagram) + '</pre>' +
      '<ul class="bullets small">' +
        '<li>The <b>Return</b> column is the investment return (ROI) earned on your remaining corpus that year.</li>' +
        (showOther ? '<li>Your <b>Rental / other</b> income grows at <b>' + RP.pct(d.acc.incomeGrowth) + '</b> a year (set under <b>Inputs → Inflation &amp; returns</b>), kept separate from general inflation.</li>' : '') +
      '</ul>' +
    '</div>';

    var controls = '<div class="card controls-row">' +
      U.toggle("Sequence-of-returns stress (poor first 5 yrs)", "toggle-sorr", d.p.sorr) +
      U.toggle("Guyton-Klinger guardrails", "toggle-guardrails", d.p.useGuardrails) +
      '<button class="btn" data-action="print">Print / Save PDF</button>' +
    '</div>';

    return cards + controls + methods +
      '<div class="chart-grid">' + accChart + ddChart + '</div>' +
      bucketChart + guardBox + table;
  };

})(window.RP = window.RP || {});
