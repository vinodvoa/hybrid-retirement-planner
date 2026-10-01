/* =============================================================================
 * calc/drawdown.js — Year-by-year retirement drawdown projection engine.
 *
 * Bucket-aware: withdrawals come Liquidity → Income → Growth. Each bucket earns
 * its own return; buckets are rebalanced annually back to the age-based target
 * (this is the "refill the cash bucket from growth in good years" mechanic).
 * Taxes computed per year. Optional sequence-of-returns (SoRR) stress applies a
 * poor return to the first N years.
 * ========================================================================== */
(function (RP) {
  "use strict";
  RP.calc = RP.calc || {};

  /*
   * opts:
   *   region, startCorpus, retirementAge, lifeExpectancy,
   *   firstYearExpense (nominal annual), inflationRetire,
   *   returns: {cash, debt, equity}, liquidityYears, swr,
   *   useGuardrails (bool), sorr (bool), sorrYears, sorrReturnEquity,
   *   srsPortion (SG), taxMix override (optional)
   */
  RP.calc.runDrawdown = function (opts) {
    var n = Math.max(0, Math.round(opts.lifeExpectancy - opts.retirementAge));
    var corpus = opts.startCorpus;
    var rCash = opts.returns.cash / 100;
    var rDebt = opts.returns.debt / 100;
    var rEq = opts.returns.equity / 100;
    var infl = opts.inflationRetire / 100;
    // Rental/other income grows at its own rate (default: general inflation).
    var incG = ((opts.incomeGrowth != null) ? opts.incomeGrowth : opts.inflationRetire) / 100;
    var cpf0 = opts.cpfLife || { monthly0: 0, escalation: 0, payoutAge: 65 };
    var otherIncome0 = opts.otherIncomeAnnual || 0; // rental/other, at retirement
    var firstYearNet = Math.max(0, opts.firstYearExpense - otherIncome0 -
      RP.calc.cpfLifeIncomeAtAge(cpf0, Math.round(opts.retirementAge)));
    // Guardrails are anchored to the user-selected withdrawal rate (swr), so the
    // cut/raise lines, the table header and the flags all agree.
    var guardAnchor = (opts.swr || 4) / 100;
    var g = RP.BUCKETS.guardrails;

    // Initial bucket split (sized to the net corpus withdrawal).
    var alloc = RP.calc.targetAllocation(opts.retirementAge, corpus, Math.max(1, firstYearNet), opts.liquidityYears);
    var b = { liquidity: alloc.liquidity, income: alloc.income, growth: alloc.growth };

    var rows = [];
    var thisYearWithdrawal = opts.firstYearExpense;
    var thisYearOtherIncome = otherIncome0;
    var depletedAtAge = null;
    var year0 = new Date().getFullYear();

    var cpf = opts.cpfLife || { monthly0: 0, escalation: 0, payoutAge: 65 };

    for (var y = 0; y < n; y++) {
      var age = Math.round(opts.retirementAge + y);
      var openCorpus = b.liquidity + b.income + b.growth;

      // Recurring incomes for the year offset the gross expense; only the
      // REMAINDER is funded from the corpus. Rental/other runs the whole
      // horizon; CPF LIFE starts at its payout age.
      var grossExpense = thisYearWithdrawal;
      var otherIncome = thisYearOtherIncome;
      var cpfIncome = RP.calc.cpfLifeIncomeAtAge(cpf, age);
      var plannedWithdrawal = Math.max(0, grossExpense - otherIncome - cpfIncome);

      // Guardrail lines (currency): trim spending if the planned withdrawal
      // would exceed the cut line; spend more if it falls below the raise line.
      var cutLine = guardAnchor * g.cutThreshold * openCorpus;
      var raiseLine = guardAnchor * g.raiseThreshold * openCorpus;

      // Guardrail adjustment to the planned corpus withdrawal.
      var grAction = "none";
      var withdrawal = plannedWithdrawal;
      if (opts.useGuardrails && plannedWithdrawal > 0) {
        var gr = RP.calc.guardrail(plannedWithdrawal, openCorpus, guardAnchor, g);
        withdrawal = gr.amount;
        grAction = gr.action;
      }
      withdrawal = Math.min(withdrawal, openCorpus); // can't draw more than exists

      // Determine source mix BEFORE depleting (for tax).
      var mix = RP.calc.withdrawalMix(b, withdrawal);
      var tax = RP.calc.withdrawalTax(opts.region, withdrawal, {
        mix: opts.taxMix || mix,
        srsPortion: opts.srsPortion,
      });

      // Draw down buckets in order.
      var toDraw = withdrawal;
      ["liquidity", "income", "growth"].forEach(function (k) {
        var take = Math.min(toDraw, b[k]);
        b[k] -= take; toDraw -= take;
      });

      // Apply returns to remaining balances (SoRR stress on early equity).
      var eqRet = rEq;
      if (opts.sorr && y < (opts.sorrYears || 5)) {
        eqRet = (opts.sorrReturnEquity !== undefined ? opts.sorrReturnEquity : -8) / 100;
      }
      var growthReturn = b.growth * eqRet;
      var incomeReturn = b.income * rDebt;
      var cashReturn = b.liquidity * rCash;
      var totalReturn = growthReturn + incomeReturn + cashReturn;
      b.growth += growthReturn;
      b.income += incomeReturn;
      b.liquidity += cashReturn;

      var closeCorpus = b.liquidity + b.income + b.growth;

      rows.push({
        age: age,
        year: year0 + y,
        openCorpus: openCorpus,
        grossExpense: grossExpense,
        otherIncome: otherIncome,
        cpfIncome: cpfIncome,
        target: plannedWithdrawal,
        withdrawal: withdrawal,
        raiseLine: raiseLine,
        cutLine: cutLine,
        tax: tax,
        netSpend: withdrawal - tax,
        ret: totalReturn,
        closeCorpus: closeCorpus,
        liquidity: b.liquidity,
        income: b.income,
        growth: b.growth,
        guardrail: grAction,
      });

      if (closeCorpus <= 0 && depletedAtAge === null) {
        depletedAtAge = age;
      }

      // Rebalance to target for next year (annual refill of cash bucket).
      var alloc2 = RP.calc.targetAllocation(age + 1, closeCorpus, withdrawal * (1 + infl), opts.liquidityYears);
      b = { liquidity: alloc2.liquidity, income: alloc2.income, growth: alloc2.growth };

      // Next year: expense grows with inflation, rental/other at its own rate.
      thisYearWithdrawal = thisYearWithdrawal * (1 + infl);
      thisYearOtherIncome = thisYearOtherIncome * (1 + incG);
    }

    var terminal = rows.length ? rows[rows.length - 1].closeCorpus : opts.startCorpus;
    return {
      rows: rows,
      terminalCorpus: terminal,
      depletedAtAge: depletedAtAge,
      success: depletedAtAge === null && terminal > 0,
      totalTax: rows.reduce(function (s, r) { return s + r.tax; }, 0),
    };
  };

})(window.RP = window.RP || {});
