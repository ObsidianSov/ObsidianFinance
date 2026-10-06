import { formatMoney } from "./dashboard.js";

export function renderTransactions(state) {
  const tbody = document.getElementById("transactionTable");
  const empty = document.getElementById("transactionEmpty");
  const query = document.getElementById("transactionSearch").value.trim().toLowerCase();
  const filter = document.getElementById("transactionFilter").value;

  const accountMap = Object.fromEntries(state.accounts.map(a => [a.id, a.name]));
  const categoryMap = Object.fromEntries(state.categories.map(c => [c.id, c.name]));

  const rows = [...state.transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter(t => filter === "all" || t.type === filter)
    .filter(t => {
      if (!query) return true;
      const text = [t.description, t.type, accountMap[t.accountId], accountMap[t.fromAccountId], accountMap[t.toAccountId], categoryMap[t.categoryId]].join(" ").toLowerCase();
      return text.includes(query);
    });

  tbody.innerHTML = rows.map(t => {
    const account = t.type === "transfer"
      ? `${accountMap[t.fromAccountId] || "Unknown"} → ${accountMap[t.toAccountId] || "Unknown"}`
      : accountMap[t.accountId] || "Unknown";
    const sign = t.type === "income" ? "+" : t.type === "expense" ? "-" : "";
    return `<tr>
      <td>${escapeHTML(t.date)}</td>
      <td><span class="${t.type}">${escapeHTML(t.type)}</span></td>
      <td>${escapeHTML(t.description || "—")}</td>
      <td>${escapeHTML(account)}</td>
      <td>${escapeHTML(t.type === "transfer" ? "Transfer" : (categoryMap[t.categoryId] || "—"))}</td>
      <td class="amount ${t.type}">${sign}${formatMoney(t.amount, state.settings)}</td>
      <td>
        <div class="table-actions">
          <button class="icon-btn edit-transaction" data-id="${t.id}" title="Edit">✎</button>
          <button class="icon-btn delete-transaction" data-id="${t.id}" title="Delete">×</button>
        </div>
      </td>
    </tr>`;
  }).join("");

  empty.classList.toggle("hidden", rows.length !== 0);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c]));
}
