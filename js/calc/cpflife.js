/* =============================================================================
 * calc/cpflife.js — CPF LIFE (Singapore) payout estimate & present value.
 *
 * CPF LIFE is a lifelong annuity from age 65. It is INCOME that offsets
 * retirement expenses, so it reduces the required corpus. Payouts are not taxed.
 * ========================================================================== */
(function (RP) {
  "use strict";
  RP.calc = RP.calc || {};

  // Resolve the initial monthly payout, escalation and payout age for a profile.
  // India (or non-member) → zero.
  RP.calc.cpfLifeMonthly = function (region, p) {
    if (region !== "singapore") return { monthly0: 0, escalation: 0, payoutAge: RP.CPF_LIFE.payoutAge };
    var cfg = RP.CPF_LIFE;
    var plan = cfg.plans.filter(function (x) { return x.key === p.cpfLifePlan; })[0] || cfg.plans[0];

    // Manual override (from CPF's own estimator) wins if provided.
    var override = RP.parseNum(p.cpfLifePayoutOverride);
    if (override > 0) {
      return { monthly0: override, escalation: plan.escalation, payoutAge: cfg.payoutAge };
    }
    var sum = cfg.sums.filter(function (x) { return x.key === p.cpfLifeSum; })[0] || cfg.sums[0];
    return { monthly0: sum.standardPayout * plan.factor, escalation: plan.escalation, payoutAge: cfg.payoutAge };
  };

  /*
   * Present value AT RETIREMENT of the CPF LIFE income stream.
   * Payments start at payoutAge (k0 = max(0, payoutAge - R) years from retirement)
   * and run to life expectancy. Escalating plans grow the payment by `escalation`%
   * per year. Discounted at the in-retirement nominal return (same nominal basis
   * the expense annuity is valued at), start-of-year convention.
   */
  RP.calc.cpfLifePV = function (monthly0, escalationPct, payoutAge, retirementAge, lifeExpectancy, nominalReturnPct) {
    var n = Math.max(0, Math.round(lifeExpectancy - retirementAge));
    if (monthly0 <= 0 || n === 0) return 0;
    var k0 = Math.max(0, Math.round(payoutAge - retirementAge));
    var annual0 = monthly0 * 12;
    var esc = escalationPct / 100;
    var r = nominalReturnPct / 100;
    var pv = 0;
    for (var k = k0; k < n; k++) {
      var pay = annual0 * Math.pow(1 + esc, k - k0);
      pv += pay / Math.pow(1 + r, k);
    }
    return pv;
  };

  // Annual CPF LIFE income at a given age (0 before payout age).
  RP.calc.cpfLifeIncomeAtAge = function (cpf, age) {
    if (cpf.monthly0 <= 0 || age < cpf.payoutAge) return 0;
    return cpf.monthly0 * 12 * Math.pow(1 + cpf.escalation / 100, age - cpf.payoutAge);
  };

})(window.RP = window.RP || {});
