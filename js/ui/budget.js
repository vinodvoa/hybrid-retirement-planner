/* =============================================================================
 * ui/budget.js — Tab 2: model budget sheet. India by city tier, SG by housing.
 * ========================================================================== */
(function (RP) {
  "use strict";
  RP.tabs = RP.tabs || {};
  RP.budget = {};

  // scales = the tier/profile options that scale the whole budget;
  // catGroups = the grouped, detailed line items.
  RP.budget.config = function (region) {
    return region === "india"
      ? { scales: RP.BUDGET_INDIA.tiers, catGroups: RP.BUDGET_INDIA.groups, scaleLabel: "Hometown / city tier" }
      : { scales: RP.BUDGET_SINGAPORE.profiles, catGroups: RP.BUDGET_SINGAPORE.groups, scaleLabel: "Housing & lifestyle" };
  };

  RP.budget.scaleFactor = function (region, p) {
    var cfg = RP.budget.config(region);
    var s = cfg.scales.filter(function (x) { return x.key === p.budgetKey; })[0] || cfg.scales[0];
    return s.factor;
  };

  // Compute grouped line items with per-group subtotals and the grand total.
  RP.budget.compute = function (region, p) {
    var cfg = RP.budget.config(region);
    var f = RP.budget.scaleFactor(region, p);
    var groups = cfg.catGroups.map(function (g) {
      var rows = g.items.map(function (c) {
        var prop = Math.round(c.base * f);
        var ov = p.budgetOverrides[c.key];
        var value = (ov === undefined || ov === "") ? prop : RP.parseNum(ov);
        return { key: c.key, label: c.label, proposed: prop, value: value };
      });
      var subtotal = rows.reduce(function (s, r) { return s + r.value; }, 0);
      return { key: g.key, label: g.label, rows: rows, subtotal: subtotal };
    });
    var total = groups.reduce(function (s, g) { return s + g.subtotal; }, 0);
    return { groups: groups, total: total };
  };

  RP.tabs.budget = function (d) {
    var p = d.p, region = d.region, U = RP.ui;
    var cur = RP.REGIONS[region].currency.symbol;
    var cfg = RP.budget.config(region);
    var comp = RP.budget.compute(region, p);

    var scaleOpts = cfg.scales.map(function (s) {
      return '<option value="' + s.key + '"' + (s.key === p.budgetKey ? " selected" : "") + '>' +
        RP.ui.esc(s.label) + '</option>';
    }).join("");

    var rowsHtml = comp.groups.map(function (g) {
      var head = '<tr class="budget-group-head"><td>' + U.esc(g.label) + '</td>' +
        '<td class="num muted">—</td>' +
        '<td class="num">' + RP.money(g.subtotal, region) + '</td></tr>';
      var items = g.rows.map(function (r) {
        var edited = p.budgetOverrides[r.key] !== undefined && p.budgetOverrides[r.key] !== "";
        return '<tr>' +
          '<td class="budget-item">' + U.esc(r.label) + '</td>' +
          '<td class="num muted">' + RP.money(r.proposed, region) + '</td>' +
          '<td class="num"><input class="cell-input" type="text" inputmode="decimal" data-budget="' + r.key + '" value="' +
            U.esc(RP.groupNum(r.value, region)) + '"' + (edited ? ' data-edited="1"' : "") + '></td>' +
        '</tr>';
      }).join("");
      return head + items;
    }).join("");

    // Retirement income (both regions): rental + other, reduces the net expense
    // the corpus must fund. Grows with inflation across retirement.
    var incRental = RP.parseNum(p.incomeRental);
    var incOther = RP.parseNum(p.incomeOther);
    var totalIncome = incRental + incOther;
    var netExpense = Math.max(0, comp.total - totalIncome);

    // Income-entry rows live at the TOP of the table; the derived net summary
    // stays at the bottom with the totals.
    var incomeInputs =
      '<tr class="income-head"><td colspan="3">Income in retirement (reduces what your corpus must fund)</td></tr>' +
      '<tr class="income-row"><td>Rental income ' +
        U.help("Net monthly rent you expect in retirement, in today's money. Assumed to grow with inflation. Typical net yield on residential property ≈ 2–4% (SG) / 2–3% (India).") +
        '</td><td class="num muted">income</td>' +
        '<td class="num"><input class="cell-input income" type="text" inputmode="decimal" data-money="1" data-field="incomeRental" value="' + U.esc(RP.groupNum(incRental, region)) + '"></td></tr>' +
      '<tr class="income-row"><td>Other income ' +
        U.help("Any other recurring monthly income in retirement (pension, annuity, part-time work, dividends, royalties), in today's money.") +
        '</td><td class="num muted">income</td>' +
        '<td class="num"><input class="cell-input income" type="text" inputmode="decimal" data-money="1" data-field="incomeOther" value="' + U.esc(RP.groupNum(incOther, region)) + '"></td></tr>';

    var netExpenseRow =
      '<tr class="net-row"><td><b>Net monthly expense (after income)</b></td><td class="num muted">—</td>' +
        '<td class="num"><b>' + RP.money(netExpense, region) + '</b></td></tr>';

    // CPF LIFE income row (Singapore): further offsets the corpus-funded spend from 65.
    var cpfFoot = "";
    if (region === "singapore") {
      var cpfMonthly = d.acc.cpfMonthly;
      var netCorpus = Math.max(0, netExpense - cpfMonthly);
      cpfFoot =
        '<tr class="income-row"><td>CPF LIFE payout (from age ' + RP.CPF_LIFE.payoutAge + ') ' +
          U.help("Lifelong, tax-free income from your selected CPF LIFE scheme. Edit to override the estimate. Before age 65 your corpus funds the full net amount.") +
        '</td><td class="num muted">income</td>' +
        '<td class="num"><input class="cell-input income" type="text" inputmode="decimal" data-money="1" data-field="cpfLifePayoutOverride" value="' + U.esc(RP.groupNum(cpfMonthly, region)) + '"></td></tr>' +
        '<tr class="net-row"><td><b>Net funded by corpus (from 65)</b></td><td class="num muted">—</td>' +
          '<td class="num"><b>' + RP.money(netCorpus, region) + '</b></td></tr>';
    }

    var sheet = '<div class="card">' +
      '<div class="budget-head">' +
        '<label class="field inline"><span class="field-label">' + U.esc(cfg.scaleLabel) + ' ' +
          U.help(region === "india"
            ? "Costs scale with city tier. Pick where you'll retire; figures adjust to local cost of living."
            : "Pick your housing & car situation; the budget scales accordingly.") +
        '</span><select data-action="set-budget-group">' + scaleOpts + '</select></label>' +
        U.toggle("Use this total as my monthly expense", "toggle-budget-link", p.budgetLinked) +
      '</div>' +
      '<table class="sheet">' +
        '<thead><tr><th>Line item</th><th class="num">Proposed</th><th class="num">Your figure (' + cur + '/mo)</th></tr></thead>' +
        '<tbody>' + incomeInputs + rowsHtml + '</tbody>' +
        '<tfoot><tr><td><b>Total monthly expenses</b></td><td class="num muted">—</td>' +
          '<td class="num"><b>' + RP.money(comp.total, region) + '</b></td></tr>' +
          '<tr><td>Annual expenses</td><td class="num muted">—</td><td class="num">' + RP.money(comp.total * 12, region) + '</td></tr>' +
          netExpenseRow +
          cpfFoot +
        '</tfoot>' +
      '</table>' +
      '<div class="row-actions"><button class="btn ghost" data-action="reset-budget">Reset to proposed</button></div>' +
    '</div>';

    var note = '<div class="card note">' +
      '<h3 class="section-title">How this works</h3>' +
      '<p class="muted">These are typical <b>retired two-adult household</b> figures (assuming an owned/paid-off home). ' +
      (region === "india"
        ? 'Metro values are the base; Tier-1/2/3 apply realistic discounts. Healthcare is kept high because medical inflation in India runs ~8–10%.'
        : 'HDB + car is the base; HDB-no-car and Condo profiles scale down/up. Healthcare includes Integrated Shield Plan premiums, which rise sharply with age.') +
      ' Override any cell to match your reality. When linked, this total drives the corpus calculation.</p>' +
    '</div>';

    return '<div class="two-col">' +
      '<div class="col-main">' + sheet + '</div>' +
      '<div class="col-side">' + note +
        '<div class="card summary"><h3 class="section-title">Impact</h3>' +
          '<div class="stat-grid">' +
            U.stat("Monthly expenses", RP.moneyShort(p.budgetLinked ? comp.total : RP.parseNum(p.monthlyExpense), region)) +
            U.stat("Less income", RP.moneyShort(totalIncome, region), "rental + other", totalIncome > 0 ? "good" : "") +
            U.stat("Net expense", RP.moneyShort(netExpense, region), "funded by corpus") +
            U.stat("Corpus required", RP.moneyShort(d.acc.corpusTarget, region), "", "accent") +
          '</div></div>' +
      '</div>' +
    '</div>';
  };

})(window.RP = window.RP || {});
