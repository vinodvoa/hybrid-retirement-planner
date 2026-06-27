/* =============================================================================
 * ui/charts.js — Dependency-free responsive SVG charts.
 * ========================================================================== */
(function (RP) {
  "use strict";
  RP.ui = RP.ui || {};
  RP.charts = {};

  var W = 720, H = 320, PAD = { l: 64, r: 16, t: 16, b: 36 };

  function scaleX(i, n) {
    if (n <= 1) return PAD.l;
    return PAD.l + (i / (n - 1)) * (W - PAD.l - PAD.r);
  }
  function scaleY(v, max) {
    if (max <= 0) return H - PAD.b;
    return PAD.t + (1 - v / max) * (H - PAD.t - PAD.b);
  }

  function axes(maxY, labelsX, region, everyX) {
    var g = '<g class="axis">';
    // y gridlines (4)
    for (var i = 0; i <= 4; i++) {
      var v = (maxY / 4) * i;
      var y = scaleY(v, maxY);
      g += '<line x1="' + PAD.l + '" y1="' + y + '" x2="' + (W - PAD.r) + '" y2="' + y + '" class="grid"/>';
      g += '<text x="' + (PAD.l - 8) + '" y="' + (y + 4) + '" text-anchor="end" class="axis-label">' +
           RP.moneyAxis(v, region) + '</text>';
    }
    // x labels
    everyX = everyX || Math.ceil(labelsX.length / 8);
    for (var j = 0; j < labelsX.length; j += everyX) {
      var x = scaleX(j, labelsX.length);
      g += '<text x="' + x + '" y="' + (H - PAD.b + 20) + '" text-anchor="middle" class="axis-label">' +
           RP.ui.esc(labelsX[j]) + '</text>';
    }
    return g + '</g>';
  }

  function polyline(points, cls) {
    return '<polyline class="' + cls + '" points="' + points.join(" ") + '"/>';
  }

  // Single/multi line chart. series: [{values:[], cls, name}]
  RP.charts.line = function (series, labelsX, region, title) {
    var maxY = 0;
    series.forEach(function (s) { s.values.forEach(function (v) { if (v > maxY) maxY = v; }); });
    maxY = maxY * 1.08 || 1;
    var n = labelsX.length;
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + RP.ui.esc(title || "chart") + '">';
    svg += axes(maxY, labelsX, region);
    series.forEach(function (s) {
      var pts = s.values.map(function (v, i) { return scaleX(i, n) + "," + scaleY(v, maxY); });
      svg += polyline(pts, "line " + (s.cls || ""));
    });
    svg += '</svg>';
    // legend
    var legend = '<div class="legend">' + series.map(function (s) {
      return '<span class="leg ' + (s.cls || "") + '"><i></i>' + RP.ui.esc(s.name) + '</span>';
    }).join("") + '</div>';
    return '<div class="chart-wrap">' + (title ? '<div class="chart-title">' + RP.ui.esc(title) + '</div>' : "") + svg + legend + '</div>';
  };

  // Stacked area for bucket balances. series order = bottom→top.
  RP.charts.stacked = function (series, labelsX, region, title) {
    var n = labelsX.length;
    var totals = [];
    for (var i = 0; i < n; i++) {
      var t = 0; series.forEach(function (s) { t += s.values[i] || 0; });
      totals.push(t);
    }
    var maxY = Math.max.apply(null, totals) * 1.08 || 1;
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" preserveAspectRatio="xMidYMid meet">';
    svg += axes(maxY, labelsX, region);
    var cum = new Array(n).fill(0);
    series.forEach(function (s) {
      var top = [], bot = [];
      for (var i = 0; i < n; i++) {
        var x = scaleX(i, n);
        var yBot = scaleY(cum[i], maxY);
        cum[i] += s.values[i] || 0;
        var yTop = scaleY(cum[i], maxY);
        top.push(x + "," + yTop); bot.push(x + "," + yBot);
      }
      bot.reverse();
      svg += '<polygon class="area ' + (s.cls || "") + '" points="' + top.concat(bot).join(" ") + '"/>';
    });
    svg += '</svg>';
    var legend = '<div class="legend">' + series.map(function (s) {
      return '<span class="leg ' + (s.cls || "") + '"><i></i>' + RP.ui.esc(s.name) + '</span>';
    }).join("") + '</div>';
    return '<div class="chart-wrap">' + (title ? '<div class="chart-title">' + RP.ui.esc(title) + '</div>' : "") + svg + legend + '</div>';
  };

  // Horizontal allocation bar for the 4 buckets.
  RP.charts.allocBar = function (parts, region) {
    var total = parts.reduce(function (s, p) { return s + p.value; }, 0) || 1;
    var bar = '<div class="alloc-bar">';
    parts.forEach(function (p) {
      var w = (p.value / total) * 100;
      bar += '<div class="alloc-seg ' + p.cls + '" style="width:' + w.toFixed(2) + '%" title="' +
        RP.ui.esc(p.name) + '"></div>';
    });
    bar += '</div><div class="alloc-legend">' + parts.map(function (p) {
      return '<span class="leg ' + p.cls + '"><i></i>' + RP.ui.esc(p.name) + ' · ' +
        RP.moneyShort(p.value, region) + ' (' + ((p.value / total) * 100).toFixed(0) + '%)</span>';
    }).join("") + '</div>';
    return bar;
  };

})(window.RP = window.RP || {});
