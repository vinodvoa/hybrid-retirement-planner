/* =============================================================================
 * ui/helpers.js — Small HTML-building helpers + reusable components.
 * ========================================================================== */
(function (RP) {
  "use strict";
  RP.ui = RP.ui || {};

  RP.ui.esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  // A labelled help bubble (?) with tooltip text.
  RP.ui.help = function (text) {
    return '<span class="help" tabindex="0" data-tip="' + RP.ui.esc(text) + '">?' +
           '<span class="help-pop">' + RP.ui.esc(text) + '</span></span>';
  };

  // A number input row with label + help bubble.
  RP.ui.field = function (o) {
    // o: {label, field, value, help, suffix, step, min, type}
    var type = o.type || "number";
    var suffix = o.suffix ? '<span class="suffix">' + RP.ui.esc(o.suffix) + '</span>' : "";
    return '' +
      '<label class="field">' +
        '<span class="field-label">' + RP.ui.esc(o.label) +
          (o.help ? " " + RP.ui.help(o.help) : "") + '</span>' +
        '<span class="field-input">' +
          '<input type="' + type + '" data-field="' + o.field + '" value="' +
            RP.ui.esc(o.value) + '"' +
            (o.step ? ' step="' + o.step + '"' : "") +
            (o.min !== undefined ? ' min="' + o.min + '"' : "") +
            (o.placeholder ? ' placeholder="' + RP.ui.esc(o.placeholder) + '"' : "") +
          '>' + suffix +
        '</span>' +
      '</label>';
  };

  // A <select> bound to a state field. options: [{value,label}].
  RP.ui.select = function (o) {
    var opts = o.options.map(function (op) {
      return '<option value="' + RP.ui.esc(op.value) + '"' +
        (String(op.value) === String(o.value) ? " selected" : "") + '>' + RP.ui.esc(op.label) + '</option>';
    }).join("");
    return '' +
      '<label class="field">' +
        '<span class="field-label">' + RP.ui.esc(o.label) +
          (o.help ? " " + RP.ui.help(o.help) : "") + '</span>' +
        '<span class="field-input">' +
          '<select data-field="' + o.field + '">' + opts + '</select>' +
        '</span>' +
      '</label>';
  };

  RP.ui.dateField = function (o) {
    return '' +
      '<label class="field">' +
        '<span class="field-label">' + RP.ui.esc(o.label) +
          (o.help ? " " + RP.ui.help(o.help) : "") + '</span>' +
        '<span class="field-input">' +
          '<input type="date" data-field="' + o.field + '" value="' + RP.ui.esc(o.value) + '">' +
        '</span>' +
      '</label>';
  };

  // Section wrapper with title.
  RP.ui.section = function (title, bodyHtml, sub) {
    return '<section class="card section">' +
      '<h3 class="section-title">' + RP.ui.esc(title) +
        (sub ? ' <span class="section-sub">' + RP.ui.esc(sub) + '</span>' : "") + '</h3>' +
      '<div class="section-body">' + bodyHtml + '</div></section>';
  };

  RP.ui.stat = function (label, value, sub, tone) {
    return '<div class="stat ' + (tone || "") + '">' +
      '<div class="stat-label">' + RP.ui.esc(label) + '</div>' +
      '<div class="stat-value">' + value + '</div>' +
      (sub ? '<div class="stat-sub">' + sub + '</div>' : "") + '</div>';
  };

  RP.ui.toggle = function (label, action, on) {
    return '<button class="toggle ' + (on ? "on" : "") + '" data-action="' + action + '">' +
      '<span class="toggle-knob"></span><span>' + RP.ui.esc(label) + '</span></button>';
  };

})(window.RP = window.RP || {});
