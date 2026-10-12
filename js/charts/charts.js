import { calculateBalances, getCategorySpend, getEquitySeries, getMonthlyCashflow } from "../core/calculations.js";
import { formatMoney } from "../ui/dashboard.js";

let charts = {};

const COLORS = {
  accent: "#3dd9ff", violet: "#8b7bff", green: "#34d399", red: "#ff6b81",
  amber: "#fbbf24", blue: "#5b8cff", pink: "#f472b6", lime: "#a3e635"
};
const PALETTE = [COLORS.accent, COLORS.violet, COLORS.green, COLORS.amber, COLORS.red, COLORS.blue, COLORS.pink, COLORS.lime];
const SURFACE = "#0e1116";
const FONT = "Inter, 'Segoe UI', system-ui, sans-serif";
const MUTED = "#8f99a8";
const GRID = "rgba(255, 255, 255, .06)";

function compactMoney(value, settings) {
  const compact = new Intl.NumberFormat(settings.locale, { notation: "compact", maximumFractionDigits: 1 }).format(value);
  return `${settings.currencySymbol || ""}${compact}`;
}

function tooltip(settings, valueKey) {
  return {
    backgroundColor: "#141920", borderColor: "#2d3541", borderWidth: 1, cornerRadius: 10, padding: 12,
    titleColor: "#f4f6f9", bodyColor: "#c5ccd8", titleFont: { family: FONT, weight: "600" }, bodyFont: { family: FONT },
    boxPadding: 4,
    callbacks: { label: ctx => ` ${ctx.dataset.label ? ctx.dataset.label + ": " : ""}${formatMoney(ctx.parsed[valueKey] ?? ctx.parsed, settings)}` }
  };
}

function legend() {
  return { labels: { color: "#aab3c0", usePointStyle: true, pointStyle: "circle", boxWidth: 7, boxHeight: 7, padding: 16, font: { family: FONT, size: 12 } } };
}

function axes(settings) {
  const common = { border: { display: false }, ticks: { color: MUTED, font: { family: FONT, size: 11 } } };
  return {
    x: { ...common, grid: { display: false }, ticks: { ...common.ticks, maxTicksLimit: 7, maxRotation: 0 } },
    y: { ...common, grid: { color: GRID }, ticks: { ...common.ticks, maxTicksLimit: 6, callback: v => compactMoney(v, settings) } }
  };
}

function areaGradient(context) {
  const { chart } = context;
  const { ctx, chartArea } = chart;
  if (!chartArea) return "rgba(61, 217, 255, .12)";
  const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  g.addColorStop(0, "rgba(61, 217, 255, .26)");
  g.addColorStop(1, "rgba(61, 217, 255, 0)");
  return g;
}

function destroy(name) {
  if (charts[name]) charts[name].destroy();
}

export function renderCharts(state) {
  if (!window.Chart) return;
  const settings = state.settings;

  destroy("equity");
  const equity = getEquitySeries(state);
  charts.equity = new Chart(document.getElementById("equityChart"), {
    type: "line",
    data: {
      labels: equity.map(x => x.label),
      datasets: [{
        label: "Total Cash", data: equity.map(x => x.value), tension: .35, borderWidth: 2, borderColor: COLORS.accent,
        backgroundColor: areaGradient, fill: true, pointRadius: 0, pointHoverRadius: 5,
        pointHoverBackgroundColor: COLORS.accent, pointHoverBorderColor: SURFACE, pointHoverBorderWidth: 3
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
      plugins: { legend: { display: false }, tooltip: tooltip(settings, "y") },
      scales: axes(settings)
    }
  });

  destroy("cashflow");
  const flow = getMonthlyCashflow(state);
  charts.cashflow = new Chart(document.getElementById("cashflowChart"), {
    type: "bar",
    data: {
      labels: flow.map(x => x.label),
      datasets: [
        { label: "Income", data: flow.map(x => x.income), backgroundColor: COLORS.green, borderRadius: 6, borderSkipped: false, barPercentage: .75, categoryPercentage: .7 },
        { label: "Expenses", data: flow.map(x => x.expenses), backgroundColor: COLORS.red, borderRadius: 6, borderSkipped: false, barPercentage: .75, categoryPercentage: .7 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: legend(), tooltip: tooltip(settings, "y") },
      scales: axes(settings)
    }
  });

  const spend = getCategorySpend(state);
  const categories = state.categories.filter(c => spend[c.id] > 0);
  destroy("category");
  document.getElementById("categoryChartEmpty").classList.toggle("hidden", categories.length > 0);
  if (categories.length) {
    charts.category = new Chart(document.getElementById("categoryChart"), {
      type: "doughnut",
      data: {
        labels: categories.map(c => c.name),
        datasets: [{ data: categories.map(c => spend[c.id]), backgroundColor: categories.map((_, i) => PALETTE[i % PALETTE.length]), borderColor: SURFACE, borderWidth: 4, hoverOffset: 6 }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: "74%", plugins: { legend: legend(), tooltip: tooltip(settings, "") } }
    });
  }

  const balances = calculateBalances(state);
  const accounts = state.accounts.filter(a => Math.abs(balances[a.id] || 0) > 0);
  destroy("accounts");
  document.getElementById("accountsChartEmpty").classList.toggle("hidden", accounts.length > 0);
  if (accounts.length) {
    charts.accounts = new Chart(document.getElementById("accountsChart"), {
      type: "doughnut",
      data: {
        labels: accounts.map(a => a.name),
        datasets: [{ data: accounts.map(a => Math.max(0, balances[a.id] || 0)), backgroundColor: accounts.map((_, i) => PALETTE[i % PALETTE.length]), borderColor: SURFACE, borderWidth: 4, hoverOffset: 6 }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: "74%", plugins: { legend: legend(), tooltip: tooltip(settings, "") } }
    });
  }
}
