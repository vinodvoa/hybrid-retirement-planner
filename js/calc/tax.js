/* =============================================================================
 * calc/tax.js — Region tax estimates for retirement withdrawals.
 *
 * These are SIMPLIFIED planning estimates, not return-level computations.
 * They model the dominant effect: the tax drag on money pulled from the corpus
 * each year. Real liability depends on personal circumstances, DTAA, surcharge,
 * residency days, etc. Always verify.
 * ========================================================================== */
(function (RP) {
  "use strict";
  RP.calc = RP.calc || {};

  // India: approximate blended tax on a year's withdrawal, assuming the
  // withdrawal is realised proportionally from the bucket mix. Equity portions
  // get LTCG treatment (12.5% over the annual exemption); debt portions get the
  // slab rate. Cash drawdown of principal is untaxed (only the gain is).
  function indiaWithdrawalTax(withdrawal, mix, cfg) {
    // mix: {liquidity, income, growth} fractions of the withdrawal source.
    // Assume an embedded-gain fraction within each rupee withdrawn.
    var gainFracEquity = 0.5;  // half of an equity rupee withdrawn is gain (conservative mid-life)
    var gainFracDebt = 0.35;
    var cessMult = 1 + cfg.cess / 100;

    var equityAmt = withdrawal * (mix.growth || 0);
    var debtAmt = withdrawal * (mix.income || 0);
    // liquidity treated as principal-heavy → negligible tax.

    var equityGain = equityAmt * gainFracEquity;
    var taxableEquityGain = Math.max(0, equityGain - cfg.equityLTCG.exemption);
    var equityTax = taxableEquityGain * (cfg.equityLTCG.rate / 100) * cessMult;

    var debtGain = debtAmt * gainFracDebt;
    var debtTax = debtGain * (cfg.debtSlabRate / 100) * cessMult;

    return equityTax + debtTax;
  }

  // Singapore: no capital gains tax. The only recurring tax drag is on the
  // taxable 50% of SRS withdrawals run through resident income brackets.
  // For a typical retiree spreading SRS over 10 years the effective rate is low.
  function singaporeWithdrawalTax(withdrawal, srsPortionOfWithdrawal, cfg) {
    var srsAmt = withdrawal * (srsPortionOfWithdrawal || 0);
    var taxable = srsAmt * cfg.srsTaxablePortion;
    return RP.calc.progressiveTax(taxable, cfg.incomeBrackets);
  }

  RP.calc.progressiveTax = function (income, brackets) {
    if (income <= 0) return 0;
    var tax = 0, prev = 0;
    for (var i = 0; i < brackets.length; i++) {
      var b = brackets[i];
      var span = Math.min(income, b.upTo) - prev;
      if (span > 0) tax += span * (b.rate / 100);
      prev = b.upTo;
      if (income <= b.upTo) break;
    }
    return tax;
  };

  // Public: tax on one year's withdrawal for a region.
  RP.calc.withdrawalTax = function (region, withdrawal, ctx) {
    if (withdrawal <= 0) return 0;
    if (region === "india") {
      return indiaWithdrawalTax(withdrawal, ctx.mix || { growth: 0.5, income: 0.3, liquidity: 0.2 }, RP.TAX.india);
    }
    // singapore
    return singaporeWithdrawalTax(withdrawal, ctx.srsPortion || 0.2, RP.TAX.singapore);
  };

  // Effective average tax rate on withdrawals over the plan (for display).
  RP.calc.effectiveWithdrawalRate = function (region, sampleWithdrawal, ctx) {
    var t = RP.calc.withdrawalTax(region, sampleWithdrawal, ctx);
    return sampleWithdrawal > 0 ? (t / sampleWithdrawal) * 100 : 0;
  };

})(window.RP = window.RP || {});
