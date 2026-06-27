/* =============================================================================
 * calc/corpus.js — Corpus required & monthly savings math.
 * All formulas documented inline. Cross-checked in tests.html.
 * ========================================================================== */
(function (RP) {
  "use strict";
  RP.calc = RP.calc || {};

  var EPS = RP.GLOBAL.EPS_REAL_RATE;

  // Current age (in whole + fractional years) from an ISO date string.
  RP.calc.ageFromDOB = function (dobStr, asOf) {
    if (!dobStr) return 0;
    var dob = new Date(dobStr);
    var now = asOf ? new Date(asOf) : new Date();
    var years = (now - dob) / (365.2425 * 24 * 3600 * 1000);
    return years > 0 ? years : 0;
  };

  // Real (inflation-adjusted) rate: (1+r)/(1+i) - 1, inputs in %.
  RP.calc.realRate = function (nominalPct, inflationPct) {
    var r = nominalPct / 100, i = inflationPct / 100;
    return (1 + r) / (1 + i) - 1;
  };

  /*
   * Corpus required at retirement, as the present value (at retirement) of an
   * inflation-growing stream of annual withdrawals taken at the START of each
   * year (annuity-due) for n years.
   *
   * Withdrawals grow with in-retirement inflation; the corpus earns the
   * in-retirement nominal return. Working in the REAL rate rr collapses this to
   * a standard annuity-due on the first-year (retirement-date) expense E_R.
   *
   *   rr = (1+r)/(1+i_r) - 1
   *   if rr ≈ 0:  Corpus = E_R * n
   *   else:       Corpus = E_R * (1 - (1+rr)^-n)/rr * (1+rr)   [annuity-due]
   */
  RP.calc.corpusRequired = function (p) {
    var n = Math.max(0, Math.round(p.lifeExpectancy - p.retirementAge));
    var E_R = p.annualExpenseAtRetirement; // first retirement-year spend (nominal)
    var rr = RP.calc.realRate(p.returnRetire, p.inflationRetire);
    if (n === 0) return 0;
    if (Math.abs(rr) < EPS) return E_R * n;
    var ordinary = E_R * (1 - Math.pow(1 + rr, -n)) / rr;
    return ordinary * (1 + rr); // annuity-due (withdraw at start of year)
  };

  // Withdrawal-rate (SWR) cross-check: Corpus = first-year annual expense / SWR.
  RP.calc.corpusBySWR = function (annualExpenseAtRetirement, swrPct) {
    if (swrPct <= 0) return Infinity;
    return annualExpenseAtRetirement / (swrPct / 100);
  };

  // Expense at retirement (nominal) = today's annual expense grown by pre-inflation.
  RP.calc.expenseAtRetirement = function (monthlyExpenseToday, inflationPrePct, yearsToRetire) {
    return monthlyExpenseToday * 12 * Math.pow(1 + inflationPrePct / 100, yearsToRetire);
  };

  // Future value of an existing lump sum.
  RP.calc.fvLumpSum = function (pv, annualReturnPct, years) {
    return pv * Math.pow(1 + annualReturnPct / 100, years);
  };

  /*
   * Required level monthly SIP (annuity-due, contributions at start of month)
   * to grow `gap` over N months at monthly rate m = g/12:
   *   FV = SIP * [((1+m)^N - 1)/m] * (1+m)
   *   => SIP = gap / ( ((1+m)^N - 1)/m * (1+m) )
   */
  RP.calc.requiredSIP = function (gap, annualReturnPct, monthsToRetire) {
    if (gap <= 0) return 0;
    if (monthsToRetire <= 0) return Infinity;
    var m = (annualReturnPct / 100) / 12;
    if (Math.abs(m) < EPS) return gap / monthsToRetire;
    var factor = ((Math.pow(1 + m, monthsToRetire) - 1) / m) * (1 + m);
    return gap / factor;
  };

  /*
   * Required FIRST-year monthly SIP when contributions step up by stepUpPct each
   * YEAR. We grow each year's 12 monthly contributions to retirement and solve
   * for the base monthly amount that makes total FV == gap.
   * Returns the first-year monthly figure (subsequent years scale up).
   */
  RP.calc.requiredStepUpSIP = function (gap, annualReturnPct, yearsToRetire, stepUpPct) {
    if (gap <= 0) return 0;
    var years = Math.floor(yearsToRetire);
    if (years <= 0) return Infinity;
    var m = (annualReturnPct / 100) / 12;
    var step = stepUpPct / 100;
    // FV contributed by 1 unit of base monthly amount, with annual step-ups.
    var fvPerUnit = 0;
    for (var y = 0; y < years; y++) {
      var contribMonthly = Math.pow(1 + step, y); // relative to base
      for (var mo = 0; mo < 12; mo++) {
        var monthsRemaining = (years - y) * 12 - mo; // grows to retirement (start-of-month)
        fvPerUnit += contribMonthly * Math.pow(1 + m, monthsRemaining);
      }
    }
    return fvPerUnit > 0 ? gap / fvPerUnit : Infinity;
  };

  // Bundle the headline accumulation numbers.
  RP.calc.accumulation = function (inp) {
    var age = inp.currentAge;
    var yearsToRetire = Math.max(0, inp.retirementAge - age);
    var monthsToRetire = Math.round(yearsToRetire * 12);

    var E_R = RP.calc.expenseAtRetirement(inp.monthlyExpense, inp.inflationPre, yearsToRetire);

    // Rental / other recurring income from retirement age, grown to retirement
    // (it grows with inflation thereafter, just like expenses). It reduces the
    // NET expense the corpus must fund across the whole horizon.
    var otherIncomeMonthly = inp.otherIncomeMonthly || 0;
    var otherIncomeAnnual = otherIncomeMonthly * 12 * Math.pow(1 + inp.inflationPre / 100, yearsToRetire);
    var netE_R = Math.max(0, E_R - otherIncomeAnnual);

    // Corpus funding the NET expense (before any age-65 annuity income).
    var grossReal = RP.calc.corpusRequired({
      lifeExpectancy: inp.lifeExpectancy,
      retirementAge: inp.retirementAge,
      annualExpenseAtRetirement: netE_R,
      returnRetire: inp.returnRetire,
      inflationRetire: inp.inflationRetire,
    });
    var grossSWR = RP.calc.corpusBySWR(netE_R, inp.swr);

    // CPF LIFE (or any annuity income) offsets expenses → reduces required corpus.
    // Subtract its present value from BOTH methods so they stay comparable.
    var cpf = inp.cpfLife || { monthly0: 0, escalation: 0, payoutAge: 65 };
    var cpfPV = RP.calc.cpfLifePV(cpf.monthly0, cpf.escalation, cpf.payoutAge,
      inp.retirementAge, inp.lifeExpectancy, inp.returnRetire);

    var corpusReal = Math.max(0, grossReal - cpfPV);
    var corpusSWR = Math.max(0, grossSWR - cpfPV);

    // Use the larger (more conservative) of the two as the planning target.
    var corpusTarget = Math.max(corpusReal, corpusSWR);

    // Spendable assets today (CPF RA annuitised into CPF LIFE is excluded upstream).
    var investable = (inp.investableCorpus !== undefined) ? inp.investableCorpus : inp.investmentsTotal;
    var fvExisting = RP.calc.fvLumpSum(investable, inp.returnPre, yearsToRetire);
    var gap = Math.max(0, corpusTarget - fvExisting);

    var sipLevel = RP.calc.requiredSIP(gap, inp.returnPre, monthsToRetire);
    var sipStepUp = RP.calc.requiredStepUpSIP(gap, inp.returnPre, yearsToRetire, inp.stepUpSip);

    return {
      age: age,
      yearsToRetire: yearsToRetire,
      monthsToRetire: monthsToRetire,
      expenseAtRetirementAnnual: E_R,
      netExpenseAtRetirementAnnual: netE_R,
      otherIncomeAnnual: otherIncomeAnnual,
      otherIncomeMonthly: otherIncomeMonthly,
      grossReal: grossReal,
      grossSWR: grossSWR,
      corpusReal: corpusReal,
      corpusSWR: corpusSWR,
      corpusTarget: corpusTarget,
      divergencePct: corpusSWR > 0 ? Math.abs(corpusReal - corpusSWR) / corpusSWR * 100 : 0,
      cpfMonthly: cpf.monthly0,
      cpfAnnual: cpf.monthly0 * 12,
      cpfPV: cpfPV,
      investable: investable,
      fvExisting: fvExisting,
      gap: gap,
      sipLevel: sipLevel,
      sipStepUp: sipStepUp,
      currentMonthlyInvestNeeded: sipLevel,
    };
  };

})(window.RP = window.RP || {});
