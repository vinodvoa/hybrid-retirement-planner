/* =============================================================================
 * format.js — Currency / number formatting and small helpers.
 * Indian style uses lakh/crore grouping; western style uses thousands commas.
 * ========================================================================== */
(function (RP) {
  "use strict";

  function indianGroup(intStr) {
    // Group the last 3 digits, then groups of 2 (e.g. 12,34,56,789).
    if (intStr.length <= 3) return intStr;
    var last3 = intStr.slice(-3);
    var rest = intStr.slice(0, -3);
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    return rest + "," + last3;
  }

  function westernGroup(intStr) {
    return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // Full formatted currency, e.g. "₹1,23,45,678" or "S$1,234,567".
  RP.money = function (value, region, opts) {
    opts = opts || {};
    var cur = RP.REGIONS[region].currency;
    var v = isFinite(value) ? Math.round(value) : 0;
    var sign = v < 0 ? "-" : "";
    var intStr = Math.abs(v).toString();
    var grouped = cur.style === "indian" ? indianGroup(intStr) : westernGroup(intStr);
    return sign + cur.symbol + grouped;
  };

  // Compact form for big headline numbers: ₹1.23 Cr / S$1.23 M.
  RP.moneyShort = function (value, region) {
    var cur = RP.REGIONS[region].currency;
    var v = value || 0;
    var sign = v < 0 ? "-" : "";
    var a = Math.abs(v);
    if (cur.style === "indian") {
      if (a >= 1e7) return sign + cur.symbol + (a / 1e7).toFixed(2) + " Cr";
      if (a >= 1e5) return sign + cur.symbol + (a / 1e5).toFixed(2) + " L";
      return RP.money(v, "india");
    } else {
      if (a >= 1e6) return sign + cur.symbol + (a / 1e6).toFixed(2) + "M";
      if (a >= 1e3) return sign + cur.symbol + (a / 1e3).toFixed(1) + "k";
      return RP.money(v, "singapore");
    }
  };

  RP.pct = function (v, dp) {
    if (dp === undefined) dp = 1;
    return (Number(v) || 0).toFixed(dp) + "%";
  };

  RP.num = function (v) {
    var n = Number(v);
    return isFinite(n) ? n : 0;
  };

  // Parse a number from a possibly-comma'd input string.
  RP.parseNum = function (s) {
    if (typeof s === "number") return s;
    if (!s) return 0;
    var n = parseFloat(String(s).replace(/[^0-9.\-]/g, ""));
    return isFinite(n) ? n : 0;
  };

  RP.clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };

})(window.RP = window.RP || {});
