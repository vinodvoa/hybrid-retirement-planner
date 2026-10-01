/* =============================================================================
 * state.js — Central app state, per-region profiles, persistence, derived calc.
 * ========================================================================== */
(function (RP) {
  "use strict";

  var STORAGE_KEY = "rp_state_v1";

  function defaultProfile(regionKey) {
    var a = RP.REGIONS[regionKey].assumptions;
    var defaultExpense = regionKey === "india" ? 90000 : 4000; // monthly, today
    return {
      // Personal
      dob: regionKey === "india" ? "1985-01-01" : "1985-01-01",
      retirementAge: a.retirementAge,
      lifeExpectancy: a.lifeExpectancy,
      // Income & expense
      monthlyExpense: defaultExpense,
      swr: a.swr,
      stepUpSip: a.stepUpSip,
      // Assumptions
      inflationPre: a.inflationPre,
      inflationRetire: a.inflationRetire,
      returnPre: a.returnPreBlend,
      returnRetire: a.returnRetireBlend,
      returnEquity: a.returnEquity,
      returnDebt: a.returnDebt,
      returnCash: a.returnCash,
      liquidityYears: RP.BUCKETS.liquidityYears.default,
      // Investments (today)
      cash: regionKey === "india" ? 1000000 : 50000,
      debt: regionKey === "india" ? 2000000 : 80000,
      equity: regionKey === "india" ? 4000000 : 150000,
      // Region accounts (free-form balances; summed into the relevant buckets)
      accounts: {},
      // Insurance
      insuranceLife: regionKey === "india" ? 10000000 : 500000,
      insuranceHealth: regionKey === "india" ? 1500000 : 1, // SG: IP yes/no flag-ish
      // CPF LIFE (Singapore)
      cpfLifeSum: "frs",
      cpfLifePlan: "standard",
      cpfLifePayoutOverride: "",
      // Debts
      debtMortgage: 0, debtCar: 0, debtEdu: 0, debtPersonal: 0,
      // Budget tab
      budgetKey: regionKey === "india" ? "metro" : "hdb_car",
      budgetOverrides: {},     // {categoryKey: amount}
      budgetLinked: true,      // budget total drives monthlyExpense
      // Retirement income (reduces net expense the corpus must fund), monthly today
      incomeRental: 0,
      incomeOther: 0,
      // Plan toggles
      useGuardrails: true,
      sorr: true,
    };
  }

  var state = {
    region: "india",
    profiles: { india: defaultProfile("india"), singapore: defaultProfile("singapore") },
    ui: { activeTab: "budget" },
  };

  var listeners = [];

  RP.state = {
    get: function () { return state; },
    region: function () { return state.region; },
    profile: function () { return state.profiles[state.region]; },

    setRegion: function (r) { state.region = r; this.save(); this.emit(); },
    setTab: function (t) { state.ui.activeTab = t; this.emit(); },

    update: function (patch) {
      Object.assign(state.profiles[state.region], patch);
      // keep budget→expense link
      this.save(); this.emit();
    },
    updateAccount: function (id, val) {
      state.profiles[state.region].accounts[id] = val;
      this.save(); this.emit();
    },

    resetRegion: function () {
      state.profiles[state.region] = defaultProfile(state.region);
      this.save(); this.emit();
    },

    onChange: function (fn) { listeners.push(fn); },
    emit: function () { listeners.forEach(function (f) { f(); }); },

    save: function () {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
    },
    load: function () {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        var parsed = JSON.parse(raw);
        // Merge defensively so new fields keep defaults.
        if (parsed.region) state.region = parsed.region;
        ["india", "singapore"].forEach(function (rk) {
          if (parsed.profiles && parsed.profiles[rk]) {
            state.profiles[rk] = Object.assign(defaultProfile(rk), parsed.profiles[rk]);
            state.profiles[rk].accounts = parsed.profiles[rk].accounts || {};
          }
        });
      } catch (e) {}
    },
    exportJSON: function () { return JSON.stringify(state, null, 2); },

    // ---- Derived computation (the single source of truth for the UI) -------
    derive: function () {
      var region = state.region;
      var p = this.profile();
      var age = RP.calc.ageFromDOB(p.dob);

      // Sum region account balances into the cash/debt/equity totals.
      var acctCash = 0, acctDebt = 0;
      var fields = RP.REGIONS[region].accountFields;
      fields.forEach(function (f) {
        var v = RP.parseNum(p.accounts[f.id]) || 0;
        // crude mapping: NRE/NRO/cpfOA/cash → cash-ish; nps/cpfSA/cpfRA/srs/ppf → debt-ish
        if (/cash|nre|nro|cpfOA/i.test(f.id)) acctCash += v; else acctDebt += v;
      });

      var cash = RP.parseNum(p.cash) + acctCash;
      var debt = RP.parseNum(p.debt) + acctDebt;
      var equity = RP.parseNum(p.equity);
      var investmentsTotal = cash + debt + equity;

      var inp = {
        region: region,
        currentAge: age,
        retirementAge: RP.parseNum(p.retirementAge),
        lifeExpectancy: RP.parseNum(p.lifeExpectancy),
        monthlyExpense: RP.parseNum(p.monthlyExpense),
        swr: RP.parseNum(p.swr),
        stepUpSip: RP.parseNum(p.stepUpSip),
        inflationPre: RP.parseNum(p.inflationPre),
        inflationRetire: RP.parseNum(p.inflationRetire),
        returnPre: RP.parseNum(p.returnPre),
        returnRetire: RP.parseNum(p.returnRetire),
        returnEquity: RP.parseNum(p.returnEquity),
        returnDebt: RP.parseNum(p.returnDebt),
        returnCash: RP.parseNum(p.returnCash),
        liquidityYears: RP.parseNum(p.liquidityYears),
        cash: cash, debt: debt, equity: equity, investmentsTotal: investmentsTotal,
        insuranceLife: RP.parseNum(p.insuranceLife),
        insuranceHealth: RP.parseNum(p.insuranceHealth),
        debtMortgage: RP.parseNum(p.debtMortgage),
        debtCar: RP.parseNum(p.debtCar),
        debtEdu: RP.parseNum(p.debtEdu),
        debtPersonal: RP.parseNum(p.debtPersonal),
      };

      // Retirement income (rental + other): recurring income from retirement
      // age, growing with inflation, that offsets the expenses the corpus funds.
      inp.otherIncomeMonthly = RP.parseNum(p.incomeRental) + RP.parseNum(p.incomeOther);

      // CPF LIFE (Singapore): lifelong income offsetting expenses.
      var cpfLife = RP.calc.cpfLifeMonthly(region, p);

      // Double-counting guard: CPF RA annuitised into CPF LIFE is NOT spendable
      // corpus. Exclude it from investable assets when CPF LIFE is active.
      var annuitisedRA = 0;
      if (region === "singapore" && p.cpfLifeSum && p.cpfLifeSum !== "none") {
        annuitisedRA = RP.parseNum(p.accounts.cpfRA) || 0;
      }
      inp.cpfLife = cpfLife;
      inp.investableCorpus = Math.max(0, investmentsTotal - annuitisedRA);
      inp.annuitisedRA = annuitisedRA;

      var acc = RP.calc.accumulation(inp);

      var drawOpts = {
        region: region,
        startCorpus: acc.corpusTarget,
        retirementAge: inp.retirementAge,
        lifeExpectancy: inp.lifeExpectancy,
        firstYearExpense: acc.expenseAtRetirementAnnual,
        inflationRetire: inp.inflationRetire,
        returns: { cash: inp.returnCash, debt: inp.returnDebt, equity: inp.returnEquity },
        liquidityYears: inp.liquidityYears,
        swr: inp.swr,
        useGuardrails: p.useGuardrails,
        srsPortion: region === "singapore" ? 0.25 : 0,
        cpfLife: cpfLife,
        otherIncomeAnnual: acc.otherIncomeAnnual,
      };
      var base = RP.calc.runDrawdown(Object.assign({}, drawOpts, { sorr: false }));
      var sorr = RP.calc.runDrawdown(Object.assign({}, drawOpts, { sorr: true, sorrYears: 5, sorrReturnEquity: -8 }));

      var risks = RP.calc.assessRisks({ region: region, inp: inp, acc: acc, base: base, sorr: sorr });

      return { region: region, p: p, inp: inp, acc: acc, base: base, sorr: sorr, risks: risks };
    },
  };

})(window.RP = window.RP || {});
