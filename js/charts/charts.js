import { calculateBalances, getCategorySpend, getEquitySeries, getMonthlyCashflow } from "../core/calculations.js";
import { formatMoney } from "../ui/dashboard.js";

let charts = {};

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: "#b5b5b5" } } },
  scales: {
    x: { ticks: { color: "#858585" }, grid: { color: "#202020" } },
    y: { ticks: { color: "#858585" }, grid: { color: "#202020" } }
  }
};

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
      datasets: [{ label: "Total Cash", data: equity.map(x => x.value), tension: .3, borderWidth: 2, pointRadius: 2 }]
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
        { label: "Income", data: flow.map(x => x.income), borderWidth: 1 },
        { label: "Expenses", data: flow.map(x => x.expenses), borderWidth: 1 }
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
        datasets: [{ data: categories.map(c => spend[c.id]) }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: "#b5b5b5" } } } }
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
        datasets: [{ data: accounts.map(a => Math.max(0, balances[a.id] || 0)) }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: "#b5b5b5" } } } }
    });
  }
}
