import { calculateBalances, getTotalCash, getMonthTotals } from "../core/calculations.js";

export function formatMoney(value, settings) {
  return new Intl.NumberFormat(settings.locale, {
    style: "currency",
    currency: settings.currency,
    maximumFractionDigits: 2
  }).format(Number(value) || 0);
}

export function renderDashboard(state) {
  const balances = calculateBalances(state);
  const total = getTotalCash(state);
  const month = getMonthTotals(state);

  document.title = `Obsidian Finance`;
  document.getElementById("totalCash").textContent = formatMoney(total, state.settings);
  document.getElementById("monthlyIncome").textContent = formatMoney(month.income, state.settings);
  document.getElementById("monthlyExpenses").textContent = formatMoney(month.expenses, state.settings);
  const net = month.income - month.expenses;
  const netEl = document.getElementById("monthlyNet");
  netEl.textContent = formatMoney(net, state.settings);
  netEl.className = net < 0 ? "expense" : "income";
  document.getElementById("transactionCount").textContent = state.transactions.length;

  const runway = month.expenses > 0 ? total / month.expenses : null;
  document.getElementById("runwayLine").textContent = runway === null
    ? "Add expenses to calculate runway."
    : `${runway.toFixed(1)} months of current spending covered.`;

  const grid = document.getElementById("accountsGrid");
  grid.innerHTML = state.accounts.length
    ? state.accounts.map(account => `
      <article class="account-card card">
        <span class="eyebrow">${escapeHTML(account.name)}</span>
        <div class="balance">${formatMoney(balances[account.id] || 0, state.settings)}</div>
        <div class="actions">
          <button class="btn btn-ghost edit-balance" data-account-id="${account.id}">Opening balance</button>
        </div>
      </article>
    `).join("")
    : `<article class="card empty">No accounts yet. Add your first account.</article>`;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c]));
}
