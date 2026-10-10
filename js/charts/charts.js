import { calculateBalances, getCategorySpend, getEquitySeries, getMonthlyCashflow } from "../core/calculations.js";
import { formatMoney } from "../ui/dashboard.js";

let charts = {};

const NEON = {
  cyan: "#00e5ff", magenta: "#ff2bd6", violet: "#8b5cff", green: "#38ffb0", red: "#ff4d79", amber: "#ffc857", blue: "#3d8bff", pink: "#ff7ad9"
};
const PALETTE = [NEON.cyan, NEON.magenta, NEON.violet, NEON.green, NEON.amber, NEON.blue, NEON.red, NEON.pink];
const BG = "#04050d";
const MONO = "'Share Tech Mono', ui-monospace, Consolas, monospace";

const tooltip = {
  backgroundColor: "rgba(4, 6, 18, .94)", borderColor: "rgba(0, 229, 255, .5)", borderWidth: 1,
  titleColor: NEON.cyan, bodyColor: "#e8f6ff", padding: 10, cornerRadius: 4, displayColors: true,
  titleFont: { family: MONO }, bodyFont: { family: MONO }
};
const legend = { labels: { color: "#9db4d6", usePointStyle: true, boxWidth: 8, font: { family: MONO } } };

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend, tooltip },
  scales: {
    x: { ticks: { color: "#7d92b4", font: { family: MONO } }, grid: { color: "rgba(0, 229, 255, .07)" }, border: { color: "rgba(0, 229, 255, .25)" } },
    y: { ticks: { color: "#7d92b4", font: { family: MONO } }, grid: { color: "rgba(0, 229, 255, .07)" }, border: { color: "rgba(0, 229, 255, .25)" } }
  }
};

const doughnutOptions = { responsive: true, maintainAspectRatio: false, cutout: "68%", plugins: { legend, tooltip } };

function areaGradient(context) {
  const { chart } = context;
  const { ctx, chartArea } = chart;
  if (!chartArea) return "rgba(0, 229, 255, .15)";
  const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  g.addColorStop(0, "rgba(0, 229, 255, .38)");
  g.addColorStop(1, "rgba(0, 229, 255, 0)");
  return g;
}

function destroy(name) {
  if (charts[name]) charts[name].destroy();
}

export function renderCharts(state) {
  if (!window.Chart) return;

  destroy("equity");
  const equity = getEquitySeries(state);
  charts.equity = new Chart(document.getElementById("equityChart"), {
    type: "line",
    data: {
      labels: equity.map(x => x.label),
      datasets: [{ label: "Total Cash", data: equity.map(x => x.value), tension: .35, borderWidth: 2.5, borderColor: NEON.cyan, backgroundColor: areaGradient, fill: true, pointRadius: 3, pointHoverRadius: 6, pointBackgroundColor: NEON.cyan, pointBorderColor: BG }]
    },
    options: { ...baseOptions }
  });

  destroy("cashflow");
  const flow = getMonthlyCashflow(state);
  charts.cashflow = new Chart(document.getElementById("cashflowChart"), {
    type: "bar",
    data: {
      labels: flow.map(x => x.label),
      datasets: [
        { label: "Income", data: flow.map(x => x.income), borderWidth: 1.5, borderColor: NEON.green, backgroundColor: "rgba(56, 255, 176, .35)", borderRadius: 3 },
        { label: "Expenses", data: flow.map(x => x.expenses), borderWidth: 1.5, borderColor: NEON.red, backgroundColor: "rgba(255, 77, 121, .35)", borderRadius: 3 }
      ]
    },
    options: { ...baseOptions }
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
        datasets: [{ data: categories.map(c => spend[c.id]), backgroundColor: categories.map((_, i) => PALETTE[i % PALETTE.length]), borderColor: BG, borderWidth: 3, hoverOffset: 8 }]
      },
      options: doughnutOptions
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
        datasets: [{ data: accounts.map(a => Math.max(0, balances[a.id] || 0)), backgroundColor: accounts.map((_, i) => PALETTE[i % PALETTE.length]), borderColor: BG, borderWidth: 3, hoverOffset: 8 }]
      },
      options: doughnutOptions
    });
  }
}
