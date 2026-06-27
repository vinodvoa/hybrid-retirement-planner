/* =============================================================================
 * calc/buckets.js — Hybrid 4-bucket allocation, glide path, guardrail rule.
 * ========================================================================== */
(function (RP) {
  "use strict";
  RP.calc = RP.calc || {};

  /*
   * Target allocation across the three INVESTED buckets (Liquidity / Income /
   * Growth) at a given age. Bucket 4 (Legacy/Protection) is handled separately
   * (insurance & earmarks), not part of the drawdown corpus split.
   *
   * Sizing logic:
   *  - Liquidity = `liquidityYears` of expenses (a cash floor).
   *  - Remaining corpus splits Income vs Growth on an age glide path:
   *      equity weight ≈ clamp(110 - age, 30%, 75%)  ("110 minus age" rule,
   *      floored so retirees keep an inflation-fighting equity sleeve).
   */
  RP.calc.targetAllocation = function (age, corpus, annualExpense, liquidityYears) {
    var liquidity = Math.min(corpus, annualExpense * liquidityYears);
    var rest = Math.max(0, corpus - liquidity);
    var equityW = RP.clamp((110 - age) / 100, 0.30, 0.75);
    var growth = rest * equityW;
    var income = rest * (1 - equityW);
    return { liquidity: liquidity, income: income, growth: growth, equityWeight: equityW };
  };

  // Fractional source mix of a withdrawal given current bucket balances
  // (used by the tax engine). Drawn Liquidity → Income → Growth.
  RP.calc.withdrawalMix = function (buckets, amount) {
    var remaining = amount, mix = { liquidity: 0, income: 0, growth: 0 };
    var order = ["liquidity", "income", "growth"];
    for (var i = 0; i < order.length; i++) {
      var k = order[i];
      var take = Math.min(remaining, Math.max(0, buckets[k]));
      mix[k] = amount > 0 ? take / amount : 0;
      remaining -= take;
      if (remaining <= 0) break;
    }
    return mix;
  };

  /*
   * Guyton-Klinger guardrail adjustment to a withdrawal.
   * currentWR = thisYearWithdrawal / currentCorpus.
   *  - if currentWR > initialWR * cutThreshold → cut withdrawal by cutPct
   *  - if currentWR < initialWR * raiseThreshold → raise withdrawal by raisePct
   */
  RP.calc.guardrail = function (plannedWithdrawal, corpus, initialWR, g) {
    if (corpus <= 0) return { amount: plannedWithdrawal, action: "none" };
    var wr = plannedWithdrawal / corpus;
    if (wr > initialWR * g.cutThreshold) {
      return { amount: plannedWithdrawal * (1 - g.cutPct), action: "cut" };
    }
    if (wr < initialWR * g.raiseThreshold) {
      return { amount: plannedWithdrawal * (1 + g.raisePct), action: "raise" };
    }
    return { amount: plannedWithdrawal, action: "none" };
  };

})(window.RP = window.RP || {});
