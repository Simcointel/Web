(function () {
  "use strict";

  var BASE = window.SIMCO_WIDGET_BASE || ("https://" + window.location.host + "/Web");

  function createStyle() {
    var s = document.createElement("style");
    s.textContent = [
      ".simco-widget { font-family: system-ui, -apple-system, sans-serif; line-height: 1.4; }",
      ".simco-widget * { box-sizing: border-box; }",
      ".simco-widget-loading { color: #9ca3af; font-size: 11px; padding: 8px; text-align: center; }",
      ".simco-widget-error { color: #ef4444; font-size: 10px; padding: 8px; }",
    ].join(" ");
    document.head.appendChild(s);
  }

  function loadWidget(el) {
    var type = el.getAttribute("data-widget") || "health";
    var realm = el.getAttribute("data-realm") || "0";
    var refresh = parseInt(el.getAttribute("data-refresh") || "30");

    var container = document.createElement("div");
    container.className = "simco-widget";
    container.innerHTML = '<div class="simco-widget-loading">Loading...</div>';
    el.parentNode.insertBefore(container, el.nextSibling);
    if (el.parentNode) el.parentNode.removeChild(el);

    function fetchData() {
      var url = BASE + "/api/public/widget/" + type + "?realm=" + realm + "&compact=1";
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.onload = function () {
        if (xhr.status === 200) {
          try {
            var data = JSON.parse(xhr.responseText);
            renderWidget(container, type, data);
          } catch (e) { container.innerHTML = '<div class="simco-widget-error">Parse error</div>'; }
        } else {
          container.innerHTML = '<div class="simco-widget-error">HTTP ' + xhr.status + '</div>';
        }
      };
      xhr.onerror = function () { container.innerHTML = '<div class="simco-widget-error">Network error</div>'; };
      xhr.send();
    }

    fetchData();
    if (refresh > 0) setInterval(fetchData, refresh * 1000);
  }

  function renderWidget(container, type, data) {
    var html = "";
    if (type === "health" || type === "scores") {
      var s = data.s || {};
      html = '<div style="padding:4px">';
      html += '<div style="display:flex;flex-direction:column;gap:2px;font-size:10px">';
      html += renderBar("EH", s.eh, "#3b82f6");
      html += renderBar("MS", s.ms, "#7c3aed");
      html += renderBar("ST", s.st, "#059669");
      html += renderBar("IP", s.ip, "#d97706");
      html += renderBar("SR", s.sr, "#dc2626");
      html += '</div></div>';
    } else if (type === "regime") {
      var reg = data.reg || {};
      html = '<div style="text-align:center;padding:8px;font-size:12px">';
      html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;margin-bottom:4px">Economic Regime</div>';
      html += '<span style="display:inline-block;padding:2px 6px;font-size:10px;font-weight:bold;border-radius:4px;background:#059669;color:#fff">' + (reg.na || "Unknown") + '</span>';
      html += '<div style="font-size:9px;color:#9ca3af;margin-top:2px">Confidence: ' + (reg.sc || 0) + '</div>';
      html += '</div>';
    } else if (type === "forecast") {
      var fc = data.fc || {};
      html = '<div style="padding:4px;font-size:10px">';
      html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;margin-bottom:4px">Forecast Projections</div>';
      var keys = Object.keys(fc).slice(0, 5);
      if (keys.length === 0) { html += '<div style="color:#9ca3af">No forecasts</div>'; }
      else { keys.forEach(function (k) {
        var v = fc[k];
        html += '<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid #f3f4f6;font-size:10px">';
        html += '<span style="color:#6b7280">' + k + '</span>';
        html += '<span style="font-weight:600;font-family:monospace">' + (v.v != null ? v.v.toFixed(2) : "-") + '</span></div>';
      }); }
      html += '</div>';
    } else if (type === "signals") {
      var sg = data.sg || [];
      html = '<div style="padding:4px;font-size:10px">';
      html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;margin-bottom:4px">Signals</div>';
      if (sg.length === 0) { html += '<div style="color:#9ca3af">No active signals</div>'; }
      else { sg.slice(0, 4).forEach(function (s) {
        var dot = s.se === "critical" ? "#ef4444" : s.se === "high" ? "#d97706" : s.se === "medium" ? "#3b82f6" : "#9ca3af";
        html += '<div style="display:flex;gap:4px;padding:2px 0;align-items:center">';
        html += '<span style="width:6px;height:6px;border-radius:50%;background:' + dot + ';flex-shrink:0"></span>';
        html += '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;color:#374151">' + (s.l || "") + '</span>';
        html += '<span style="font-size:9px;color:#9ca3af">' + (s.c != null ? (s.c * 100).toFixed(0) + "%" : "") + '</span></div>';
      }); }
      html += '</div>';
    } else if (type === "cycles") {
      html = '<div style="text-align:center;padding:8px;font-size:12px">';
      html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;margin-bottom:4px">Cycle Phase</div>';
      html += '<span style="display:inline-block;padding:2px 8px;font-size:11px;font-weight:bold;border-radius:4px;background:#3b82f6;color:#fff">' + (data.ph || "Unknown") + '</span>';
      html += '<div style="font-size:9px;color:#9ca3af;margin-top:2px">Confidence: ' + (data.co != null ? (data.co * 100).toFixed(0) + "%" : "-") + ' | Stability: ' + (data.st != null ? (data.st * 100).toFixed(0) + "%" : "-") + '</div>';
      html += '</div>';
    } else if (type === "dependencies") {
      var bc = data.bc || [];
      html = '<div style="padding:4px;font-size:10px">';
      html += '<div style="font-size:9px;color:#6b7280;text-transform:uppercase;margin-bottom:4px">Supply Chain Risk</div>';
      html += '<div style="color:#374151;margin-bottom:4px">Critical resources: <strong>' + (data.cr || 0) + '</strong></div>';
      if (bc.length > 0) { bc.slice(0, 3).forEach(function (c) {
        var pct = Math.min(100, Math.max(0, (c.pr || 0) * 100));
        var bg = pct >= 70 ? "#ef4444" : pct >= 40 ? "#d97706" : "#3b82f6";
        html += '<div style="padding:2px 0"><span style="color:#6b7280">' + (c.ch || "") + '</span>';
        html += '<div style="height:3px;background:#e5e7eb;border-radius:2px;margin-top:1px;overflow:hidden">';
        html += '<div style="height:100%;border-radius:2px;background:' + bg + ';width:' + pct + '%"></div></div></div>';
      }); }
      html += '</div>';
    } else if (type === "alerts") {
      var alerts = data.a || [];
      html = '<div style="padding:4px;font-size:10px">';
      if (alerts.length === 0) {
        html += '<div style="color:#9ca3af">No recent alerts</div>';
      } else {
        alerts.slice(0, 5).forEach(function (a) {
          var dotColor = a.s === "critical" ? "#ef4444" : a.s === "warning" ? "#d97706" : "#3b82f6";
          html += '<div style="display:flex;gap:4px;padding:2px 0;align-items:center">';
          html += '<span style="width:6px;height:6px;border-radius:50%;background:' + dotColor + ';flex-shrink:0"></span>';
          html += '<span style="color:#6b7280;flex-shrink:0">' + (a.t ? new Date(a.t).toLocaleTimeString() : "") + '</span>';
          html += '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#374151">' + (a.i || "") + '</span>';
          html += '</div>';
        });
      }
      html += '</div>';
    }
    container.innerHTML = html;
  }

  function renderBar(label, value, color) {
    var pct = Math.min(100, Math.max(0, value || 0));
    var bg = pct >= 70 ? "#059669" : pct >= 40 ? "#d97706" : "#dc2626";
    return '<div style="display:flex;align-items:center;gap:4px">' +
      '<span style="width:16px;font-weight:bold;color:' + color + '">' + label + '</span>' +
      '<div style="flex:1;height:4px;background:#e5e7eb;border-radius:2px;overflow:hidden">' +
      '<div style="height:100%;border-radius:2px;background:' + bg + ';width:' + pct + '%"></div></div>' +
      '<span style="width:16px;text-align:right;font-weight:bold;font-size:9px">' + pct + '</span></div>';
  }

  createStyle();
  var els = document.querySelectorAll("script[data-widget]");
  for (var i = 0; i < els.length; i++) loadWidget(els[i]);
})();
