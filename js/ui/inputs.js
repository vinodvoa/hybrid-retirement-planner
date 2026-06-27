/* =============================================================================
 * ui/inputs.js — Tab 1: parameter form + live summary.
 * ========================================================================== */
(function (RP) {
  "use strict";
  RP.tabs = RP.tabs || {};

  RP.tabs.inputs = function (d) {
    var p = d.p, region = d.region, U = RP.ui, H = RP.HELP;
    var cur = RP.REGIONS[region].currency.symbol;

    // Personal
    var personal = U.dateField({ label: "Date of birth", field: "dob", value: p.dob, help: H.dob }) +
      U.field({ label: "Planned retirement age", field: "retirementAge", value: p.retirementAge, help: H.retirementAge, min: 30 }) +
      U.field({ label: "Life expectancy (age)", field: "lifeExpectancy", value: p.lifeExpectancy, help: H.lifeExpectancy, min: 60 });

    // Expenses & withdrawal
    var expense = U.field({ label: "Current monthly expense", field: "monthlyExpense", value: p.monthlyExpense, help: H.monthlyExpense, suffix: cur, min: 0 }) +
      U.field({ label: "Withdrawal rate", field: "swr", value: p.swr, help: H.withdrawalRate, suffix: "%", step: 0.1 }) +
      U.field({ label: "Annual SIP step-up", field: "stepUpSip", value: p.stepUpSip, help: H.stepUpSip, suffix: "%", step: 0.5 });

    // Investments
    var invest = U.field({ label: "Cash & equivalents", field: "cash", value: p.cash, help: H.cash, suffix: cur, min: 0 }) +
      U.field({ label: "Debt / fixed income", field: "debt", value: p.debt, help: H.debt, suffix: cur, min: 0 }) +
      U.field({ label: "Equity", field: "equity", value: p.equity, help: H.equity, suffix: cur, min: 0 });

    // Region accounts
    var acctFields = RP.REGIONS[region].accountFields.map(function (f) {
      return U.field({ label: f.label, field: "acct:" + f.id, value: p.accounts[f.id] || "", help: f.help, suffix: cur, min: 0 });
    }).join("");

    // Assumptions
    var assume = U.field({ label: "Inflation (pre-retirement)", field: "inflationPre", value: p.inflationPre, help: H.inflationPre, suffix: "%", step: 0.1 }) +
      U.field({ label: "Inflation (in retirement)", field: "inflationRetire", value: p.inflationRetire, help: H.inflationRetire, suffix: "%", step: 0.1 }) +
      U.field({ label: "Return — accumulation (blended)", field: "returnPre", value: p.returnPre, help: H.returnEquity, suffix: "%", step: 0.1 }) +
      U.field({ label: "Return — equity", field: "returnEquity", value: p.returnEquity, help: H.returnEquity, suffix: "%", step: 0.1 }) +
      U.field({ label: "Return — debt", field: "returnDebt", value: p.returnDebt, help: H.returnDebt, suffix: "%", step: 0.1 }) +
      U.field({ label: "Return — cash", field: "returnCash", value: p.returnCash, help: H.returnCash, suffix: "%", step: 0.1 });

    // Insurance
    var ins = U.field({ label: "Life cover (sum assured)", field: "insuranceLife", value: p.insuranceLife, help: H.insuranceLife, suffix: cur, min: 0 }) +
      U.field({ label: "Health cover", field: "insuranceHealth", value: p.insuranceHealth, help: H.insuranceHealth, suffix: cur, min: 0 });

    // Debts
    var debts = U.field({ label: "Mortgage outstanding", field: "debtMortgage", value: p.debtMortgage, help: H.mortgage, suffix: cur, min: 0 }) +
      U.field({ label: "Car loan", field: "debtCar", value: p.debtCar, help: H.carLoan, suffix: cur, min: 0 }) +
      U.field({ label: "Education loan", field: "debtEdu", value: p.debtEdu, help: H.eduLoan, suffix: cur, min: 0 }) +
      U.field({ label: "Personal / other loans", field: "debtPersonal", value: p.debtPersonal, help: H.personalLoan, suffix: cur, min: 0 });

    // CPF LIFE (Singapore only)
    var cpfLifeSection = "";
    if (region === "singapore") {
      var sumOpts = RP.CPF_LIFE.sums.map(function (s) { return { value: s.key, label: s.label }; });
      var planOpts = RP.CPF_LIFE.plans.map(function (pl) { return { value: pl.key, label: pl.label }; });
      var cpfBody =
        U.select({ label: "Retirement sum (sets your payout)", field: "cpfLifeSum", value: p.cpfLifeSum, options: sumOpts, help: H.cpfLifeSum }) +
        U.select({ label: "CPF LIFE plan", field: "cpfLifePlan", value: p.cpfLifePlan, options: planOpts, help: H.cpfLifePlan }) +
        U.field({ label: "Override monthly payout (optional)", field: "cpfLifePayoutOverride", value: p.cpfLifePayoutOverride, help: H.cpfLifeOverride, suffix: cur, min: 0 });
      var payoutLine = '<div class="cpf-payout-line">Estimated CPF LIFE payout from age ' + RP.CPF_LIFE.payoutAge +
        ': <b>' + RP.money(d.acc.cpfMonthly, region) + '/mo</b>' +
        (d.acc.cpfMonthly > 0 ? ' <span class="muted small">(≈ ' + RP.money(d.acc.cpfMonthly * 12, region) + '/yr, tax-free — reduces the corpus you need)</span>' : '') + '</div>';
      cpfLifeSection = U.section("CPF LIFE annuity", '<div class="grid2">' + cpfBody + '</div>' + payoutLine,
        "lifelong income from 65");
    }

    var left =
      U.section("Personal", '<div class="grid2">' + personal + '</div>') +
      U.section("Income & expenses", '<div class="grid2">' + expense + '</div>') +
      U.section("Investments (today)", '<div class="grid2">' + invest + '</div>',
        RP.moneyShort(d.inp.investmentsTotal, region) + " total") +
      U.section(region === "india" ? "NRI accounts & schemes" : "CPF / SRS & cash", '<div class="grid2">' + acctFields + '</div>') +
      cpfLifeSection +
      U.section("Inflation & returns", '<div class="grid2">' + assume + '</div>') +
      U.section("Insurance", '<div class="grid2">' + ins + '</div>') +
      U.section("Debts", '<div class="grid2">' + debts + '</div>');

    // Live summary (right rail)
    var acc = d.acc;
    var summary = '<div class="card summary sticky">' +
      '<h3 class="section-title">Live snapshot</h3>' +
      '<div class="stat-grid">' +
        U.stat("Current age", acc.age.toFixed(1)) +
        U.stat("Years to retire", acc.yearsToRetire.toFixed(0)) +
        U.stat("Current corpus", RP.moneyShort(acc.investable, region), "investable today" + (d.inp.annuitisedRA > 0 ? " (ex-CPF RA)" : ""), "") +
        U.stat("Corpus required", RP.moneyShort(acc.corpusTarget, region), "at age " + d.inp.retirementAge, "accent") +
        U.stat("Corpus shortfall", RP.moneyShort(acc.gap, region), acc.gap > 0 ? "still to build" : "fully funded", acc.gap > 0 ? "warn" : "good") +
        U.stat("Monthly saving needed", RP.moneyShort(acc.sipLevel, region), "level SIP") +
        U.stat("Plan outlook", d.base.success ? "On track ✓" : "Shortfall ✕", "to age " + d.inp.lifeExpectancy, d.base.success ? "good" : "bad") +
      '</div>' +
      '<p class="muted small">Edit any field — everything updates instantly. Build a detailed expense figure in the <b>Budget</b> tab, then see the full plan in <b>Projection</b> and <b>Plan</b>.</p>' +
    '</div>';

    return '<div class="two-col">' +
      '<div class="col-main">' + left + '</div>' +
      '<div class="col-side">' + summary + '</div>' +
    '</div>';
  };

})(window.RP = window.RP || {});
