import { getCategorySpend } from "../core/calculations.js";
import { formatMoney } from "./dashboard.js";

export function renderBudgets(state) {
  const spend = getCategorySpend(state);
  const list = document.getElementById("budgetList");
  const entries = state.categories
    .map(c => ({ category: c, budget: Number(state.budgets[c.id] || 0), spent: Number(spend[c.id] || 0) }))
    .filter(x => x.budget > 0);

  list.innerHTML = entries.length
    ? entries.map(({ category, budget, spent }) => {
        const percent = Math.min(100, (spent / budget) * 100);
        const over = spent > budget;
        return `<div class="budget-row">
          <div class="budget-meta">
            <span>${escapeHTML(category.name)}</span>
            <span>${formatMoney(spent, state.settings)} / ${formatMoney(budget, state.settings)}</span>
          </div>
          <div class="progress ${over ? "over" : ""}"><span style="width:${percent}%"></span></div>
        </div>`;
      }).join("")
    : `<p class="empty">No budgets configured. Add limits when you are ready.</p>`;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c]));
}
