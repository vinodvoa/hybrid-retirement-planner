/* =============================================================================
 * app.js — Bootstrap, shell render, tab routing, global event delegation.
 * ========================================================================== */
(function (RP) {
  "use strict";
  RP.app = {};

  var TABS = [
    { key: "inputs", label: "1 · Inputs" },
    { key: "budget", label: "2 · Budget" },
    { key: "projection", label: "3 · Projection" },
    { key: "plan", label: "4 · Your Plan" },
    { key: "glossary", label: "5 · Glossary" },
  ];

  // Keep monthlyExpense in sync with the budget total when linked.
  RP.app.syncBudget = function () {
    var p = RP.state.profile();
    if (p.budgetLinked) {
      var comp = RP.budget.compute(RP.state.region(), p);
      if (Math.round(comp.total) !== Math.round(RP.parseNum(p.monthlyExpense))) {
        p.monthlyExpense = comp.total;
      }
    }
  };

  RP.app.render = function () {
    RP.app.syncBudget();
    var d = RP.state.derive();
    var region = d.region;

    // Header region toggle + tabs active states
    document.querySelectorAll("[data-region-btn]").forEach(function (el) {
      el.classList.toggle("active", el.getAttribute("data-region-btn") === region);
    });
    document.querySelectorAll("[data-tab-btn]").forEach(function (el) {
      el.classList.toggle("active", el.getAttribute("data-tab-btn") === RP.state.get().ui.activeTab);
    });
    document.getElementById("asof").textContent = RP.GLOBAL.asOf;
    document.body.setAttribute("data-region", region);

    // Active tab content
    var tab = RP.state.get().ui.activeTab;
    var html = RP.tabs[tab](d);
    document.getElementById("tab-content").innerHTML = html;
    document.getElementById("print-title").textContent =
      "Retirement Plan · " + RP.REGIONS[region].label + " · " + TABS.filter(function (t) { return t.key === tab; })[0].label;
  };

  function downloadJSON() {
    var blob = new Blob([RP.state.exportJSON()], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = "retirement-plan.json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function handleAction(action, el) {
    if (action.indexOf("tab:") === 0) { RP.state.setTab(action.slice(4)); return RP.app.render(); }
    if (action.indexOf("region:") === 0) { RP.state.setRegion(action.slice(7)); return RP.app.render(); }
    switch (action) {
      case "reset": if (confirm("Reset all inputs for this region to defaults?")) { RP.state.resetRegion(); RP.app.render(); } break;
      case "export": downloadJSON(); break;
      case "print": window.print(); break;
      case "toggle-sorr": RP.state.update({ sorr: !RP.state.profile().sorr }); RP.app.render(); break;
      case "toggle-guardrails": RP.state.update({ useGuardrails: !RP.state.profile().useGuardrails }); RP.app.render(); break;
      case "toggle-budget-link": RP.state.update({ budgetLinked: !RP.state.profile().budgetLinked }); RP.app.render(); break;
      case "reset-budget": RP.state.update({ budgetOverrides: {} }); RP.app.render(); break;
    }
  }

  function init() {
    RP.state.load();
    RP.state.onChange(function () { /* persisted; explicit render calls drive UI */ });

    // Event delegation
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-action]");
      if (t) { e.preventDefault(); handleAction(t.getAttribute("data-action"), t); return; }
      var rb = e.target.closest("[data-region-btn]");
      if (rb) { RP.state.setRegion(rb.getAttribute("data-region-btn")); RP.app.render(); return; }
      var tb = e.target.closest("[data-tab-btn]");
      if (tb) { RP.state.setTab(tb.getAttribute("data-tab-btn")); RP.app.render(); return; }
    });

    document.addEventListener("change", function (e) {
      var el = e.target;
      if (el.hasAttribute("data-field")) {
        var field = el.getAttribute("data-field");
        var val = (el.type === "number" || el.hasAttribute("data-money")) ? RP.parseNum(el.value) : el.value;
        if (field.indexOf("acct:") === 0) {
          RP.state.updateAccount(field.slice(5), val);
        } else {
          var patch = {}; patch[field] = val; RP.state.update(patch);
        }
        RP.app.render();
        return;
      }
      if (el.hasAttribute("data-budget")) {
        var key = el.getAttribute("data-budget");
        var p = RP.state.profile();
        var ov = Object.assign({}, p.budgetOverrides);
        ov[key] = RP.parseNum(el.value);
        RP.state.update({ budgetOverrides: ov });
        RP.app.render();
        return;
      }
      if (el.getAttribute("data-action") === "set-budget-group") {
        RP.state.update({ budgetKey: el.value });
        RP.app.render();
        return;
      }
    });

    // Glossary search — filter in place without re-rendering (keeps focus).
    document.addEventListener("input", function (e) {
      if (e.target.id !== "gl-search") return;
      var q = e.target.value.trim().toLowerCase();
      document.querySelectorAll("#tab-content .gl-term").forEach(function (el) {
        var hit = !q || el.getAttribute("data-text").indexOf(q) >= 0;
        el.style.display = hit ? "" : "none";
      });
      document.querySelectorAll("#tab-content .gl-group").forEach(function (g) {
        var any = Array.prototype.some.call(g.querySelectorAll(".gl-term"), function (el) {
          return el.style.display !== "none";
        });
        g.style.display = any ? "" : "none";
      });
    });

    RP.app.render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

})(window.RP = window.RP || {});
