/* =============================================================================
 * calc/risk.js — Risk checks producing prioritized warnings + suggestions.
 * Severity: "high" | "med" | "low" | "ok".
 * ========================================================================== */
(function (RP) {
  "use strict";
  RP.calc = RP.calc || {};

  RP.calc.assessRisks = function (ctx) {
    // ctx: { region, inp, acc, base (drawdown), sorr (drawdown) }
    var W = [];
    var inp = ctx.inp, acc = ctx.acc;

    // 1. Sequence-of-returns risk
    if (ctx.sorr && ctx.base) {
      var baseOk = ctx.base.success;
      var sorrOk = ctx.sorr.success;
      if (baseOk && !sorrOk) {
        W.push({ sev: "high", title: "Sequence-of-returns risk",
          msg: "Your plan survives on average returns but FAILS if the first few years are poor (corpus depletes by age " + ctx.sorr.depletedAtAge + ").",
          fix: "Hold a larger Liquidity bucket (3+ years), use the guardrail withdrawal rule, and avoid selling equity in down years. Consider a lower starting withdrawal in year 1." });
      } else if (baseOk && sorrOk) {
        W.push({ sev: "ok", title: "Sequence-of-returns: resilient",
          msg: "Plan survives even with poor early-retirement returns. Good buffer.",
          fix: "Keep the Liquidity bucket topped up and maintain the guardrail discipline." });
      }
    }

    // 2. Withdrawal rate sanity
    var startWR = acc.corpusTarget > 0 ? (acc.expenseAtRetirementAnnual / acc.corpusTarget) * 100 : 0;
    if (inp.swr > 4.5) {
      W.push({ sev: "high", title: "Withdrawal rate looks high",
        msg: "A " + inp.swr.toFixed(1) + "% withdrawal rate has elevated depletion risk over a long retirement.",
        fix: "Target 3.5–4%. Either grow the corpus, trim expenses, or delay retirement a few years." });
    }

    // 3. Longevity
    if (inp.lifeExpectancy < 85) {
      W.push({ sev: "med", title: "Life expectancy may be optimistic",
        msg: "Planning only to age " + inp.lifeExpectancy + " risks outliving your money.",
        fix: "Plan to 88–90+. Annuitised income (CPF LIFE / NPS annuity) hedges longevity." });
    }

    // 4. Savings feasibility
    if (acc.gap > 0 && acc.sipLevel > 0) {
      var sipShareOfExpense = acc.sipLevel / (inp.monthlyExpense || 1);
      if (sipShareOfExpense > 1.0) {
        W.push({ sev: "high", title: "Required saving exceeds current spending",
          msg: "The monthly saving needed (" + RP.moneyShort(acc.sipLevel, ctx.region) + ") is larger than your current monthly expense — likely unaffordable.",
          fix: "Delay retirement, lower the target expense, use a step-up SIP, or raise return via more equity (with risk)." });
      }
    }

    // 5. Debt before retirement
    var totalDebt = (inp.debtMortgage || 0) + (inp.debtCar || 0) + (inp.debtEdu || 0) + (inp.debtPersonal || 0);
    if (totalDebt > 0) {
      var sev = inp.debtPersonal > 0 ? "high" : "med";
      W.push({ sev: sev, title: "Outstanding debt at/near retirement",
        msg: "You carry " + RP.moneyShort(totalDebt, ctx.region) + " of debt. EMIs in retirement strain the corpus, and high-interest debt usually beats investment returns.",
        fix: "Clear personal/car loans first; aim to be mortgage-free by retirement. Don't invest at 11% while paying 14% on a loan." });
    }

    // 6. Insurance adequacy
    var annualIncome = inp.monthlyExpense * 12;
    var lifeNeed = ctx.region === "india" ? annualIncome * 10 : (inp.debtMortgage || 0) + annualIncome * 7;
    if ((inp.insuranceLife || 0) < lifeNeed && acc.yearsToRetire > 0) {
      W.push({ sev: "med", title: "Possible life-cover gap",
        msg: "Estimated need ≈ " + RP.moneyShort(lifeNeed, ctx.region) + " vs your cover " + RP.moneyShort(inp.insuranceLife || 0, ctx.region) + " (while dependants rely on you).",
        fix: "Top up with low-cost TERM insurance until financially independent. Drop cover once the corpus self-insures." });
    }
    if ((inp.insuranceHealth || 0) <= 0) {
      W.push({ sev: "high", title: "No health insurance recorded",
        msg: "Medical inflation is the single biggest retirement risk, especially for NRIs without local employer cover.",
        fix: ctx.region === "india" ? "Buy a ₹10–25L family floater + super top-up early, before age-related loadings." : "Ensure an Integrated Shield Plan over MediShield Life." });
    }

    // 7. Currency risk (India NRI)
    if (ctx.region === "india") {
      W.push({ sev: "low", title: "Currency risk (NRI)",
        msg: "If you earn/hold foreign currency but plan to spend in INR (or vice-versa), exchange-rate moves change your real corpus.",
        fix: "Match assets to your spending currency where possible; keep some global diversification; revisit on relocation." });
    }

    // 8. Concentration / equity heaviness in retirement
    var eqShare = inp.investmentsTotal > 0 ? (inp.equity || 0) / inp.investmentsTotal : 0;
    if (eqShare > 0.85 && acc.yearsToRetire < 5) {
      W.push({ sev: "med", title: "Equity-heavy near retirement",
        msg: "Over 85% in equity within 5 years of retirement amplifies sequence risk.",
        fix: "Build the Liquidity + Income buckets (a 'bond tent') in the 5 years around retirement." });
    }

    // Sort by severity.
    var order = { high: 0, med: 1, low: 2, ok: 3 };
    W.sort(function (a, b) { return order[a.sev] - order[b.sev]; });
    return W;
  };

})(window.RP = window.RP || {});
