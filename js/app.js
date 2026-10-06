import { loadState, saveState, exportState } from "./core/storage.js";
import { uniqueName, validAmount } from "./core/validators.js";
import { renderDashboard } from "./ui/dashboard.js";
import { renderTransactions } from "./ui/transactions.js";
import { renderBudgets } from "./ui/budgets.js";
import { renderCharts } from "./charts/charts.js";

let state = loadState();
let itemMode = null;
let editingTransactionId = null;

const $ = id => document.getElementById(id);

function persistAndRender() {
  saveState(state);
  renderAll();
}

function renderAll() {
  renderDashboard(state);
  renderTransactions(state);
  renderBudgets(state);
  renderCharts(state);
  populateSelects();
  renderBalanceFields();
  renderBudgetFields();
  $("currentDate").textContent = new Date().toLocaleDateString(state.settings.locale, {
    weekday: "short", year: "numeric", month: "short", day: "numeric"
  });
}

function populateSelect(select, items, placeholder, allowAdd = true) {
  const current = select.value;
  select.innerHTML = "";
  if (placeholder) select.add(new Option(placeholder, ""));
  items.forEach(item => select.add(new Option(item.name, item.id)));
  if (allowAdd) select.add(new Option("+ Add new...", "__ADD_NEW__"));
  if ([...select.options].some(o => o.value === current)) select.value = current;
}

function populateSelects() {
  const accounts = state.accounts;
  populateSelect($("transactionAccount"), accounts, "Select account");
  populateSelect($("transferFromAccount"), accounts, "Select source");
  populateSelect($("transferToAccount"), accounts, "Select destination");
  populateSelect($("transactionCategory"), state.categories, "Select category");
}

function openModal(id) { $(id).classList.remove("hidden"); }
function closeModal(id) { $(id).classList.add("hidden"); }

function resetTransactionForm() {
  editingTransactionId = null;
  $("transactionModalTitle").textContent = "Add Transaction";
  $("transactionForm").reset();
  $("transactionDate").value = new Date().toISOString().slice(0, 10);
  $("transactionType").value = "expense";
  updateTransactionMode();
}

function updateTransactionMode() {
  const transfer = $("transactionType").value === "transfer";
  $("normalAccountGroup").classList.toggle("hidden", transfer);
  $("transferGroups").classList.toggle("hidden", !transfer);
  $("categoryGroup").classList.toggle("hidden", transfer);
  $("transactionAccount").required = !transfer;
  $("transferFromAccount").required = transfer;
  $("transferToAccount").required = transfer;
  $("transactionCategory").required = !transfer;
}

function openTransaction(id = null) {
  resetTransactionForm();
  if (id) {
    const t = state.transactions.find(x => x.id === id);
    if (!t) return;
    editingTransactionId = id;
    $("transactionModalTitle").textContent = "Edit Transaction";
    $("transactionDate").value = t.date;
    $("transactionType").value = t.type;
    $("transactionAccount").value = t.accountId || "";
    $("transferFromAccount").value = t.fromAccountId || "";
    $("transferToAccount").value = t.toAccountId || "";
    $("transactionCategory").value = t.categoryId || "";
    $("transactionDescription").value = t.description || "";
    $("transactionAmount").value = t.amount;
    updateTransactionMode();
  }
  openModal("transactionModal");
}

function handleAddNewSelect(select, type) {
  if (select.value !== "__ADD_NEW__") return false;
  itemMode = type;
  $("itemModalTitle").textContent = type === "account" ? "Add Account" : "Add Category";
  $("itemName").value = "";
  $("itemName").placeholder = type === "account" ? "Account name" : "Category name";
  openModal("itemModal");
  return true;
}

$("addTransactionBtn").addEventListener("click", () => openTransaction());
$("transactionType").addEventListener("change", updateTransactionMode);
$("transactionSearch").addEventListener("input", () => renderTransactions(state));
$("transactionFilter").addEventListener("change", () => renderTransactions(state));

["transactionAccount", "transferFromAccount", "transferToAccount"].forEach(id => {
  $(id).addEventListener("change", () => handleAddNewSelect($(id), "account"));
});
$("transactionCategory").addEventListener("change", () => handleAddNewSelect($("transactionCategory"), "category"));

$("transactionForm").addEventListener("submit", e => {
  e.preventDefault();
  const type = $("transactionType").value;
  const amount = Number($("transactionAmount").value);
  if (!validAmount(amount)) return alert("Enter a valid amount.");

  let transaction;
  if (type === "transfer") {
    const from = $("transferFromAccount").value;
    const to = $("transferToAccount").value;
    if (!from || !to || from === to) return alert("Choose two different accounts for a transfer.");
    transaction = {
      id: editingTransactionId || crypto.randomUUID(),
      date: $("transactionDate").value,
      type,
      fromAccountId: from,
      toAccountId: to,
      categoryId: null,
      accountId: null,
      description: $("transactionDescription").value.trim(),
      amount
    };
  } else {
    const accountId = $("transactionAccount").value;
    const categoryId = $("transactionCategory").value;
    if (!accountId || !categoryId) return alert("Select an account and category.");
    transaction = {
      id: editingTransactionId || crypto.randomUUID(),
      date: $("transactionDate").value,
      type,
      accountId,
      categoryId,
      fromAccountId: null,
      toAccountId: null,
      description: $("transactionDescription").value.trim(),
      amount
    };
  }

  if (editingTransactionId) {
    const index = state.transactions.findIndex(t => t.id === editingTransactionId);
    state.transactions[index] = transaction;
  } else {
    state.transactions.push(transaction);
  }

  persistAndRender();
  closeModal("transactionModal");
});

$("addAccountBtn").addEventListener("click", () => {
  $("accountForm").reset();
  openModal("accountModal");
});

$("accountForm").addEventListener("submit", e => {
  e.preventDefault();
  const check = uniqueName($("accountName").value, state.accounts.map(a => a.name));
  if (!check.ok) return alert(check.message);
  const balance = Number($("accountOpeningBalance").value);
  if (!Number.isFinite(balance) || balance < 0) return alert("Enter a valid opening balance.");

  state.accounts.push({ id: crypto.randomUUID(), name: check.name, openingBalance: balance });
  persistAndRender();
  closeModal("accountModal");
});

$("balanceForm").addEventListener("submit", e => {
  e.preventDefault();
  state.accounts.forEach(account => {
    const input = document.querySelector(`[data-balance-id="${account.id}"]`);
    if (input) account.openingBalance = Math.max(0, Number(input.value) || 0);
  });
  persistAndRender();
  closeModal("balanceModal");
});

function renderBalanceFields() {
  $("balanceFields").innerHTML = state.accounts.length
    ? state.accounts.map(a => `
      <div class="balance-field">
        <label>${escapeHTML(a.name)}</label>
        <input class="input" data-balance-id="${a.id}" type="number" min="0" step="0.01" value="${Number(a.openingBalance) || 0}">
      </div>
    `).join("")
    : `<p class="empty">No accounts available.</p>`;
}

$("editBudgetsBtn").addEventListener("click", () => {
  renderBudgetFields();
  openModal("budgetModal");
});

function renderBudgetFields() {
  $("budgetFormFields").innerHTML = state.categories.map(c => `
    <div class="balance-field">
      <label>${escapeHTML(c.name)}</label>
      <input class="input" data-budget-id="${c.id}" type="number" min="0" step="0.01" value="${Number(state.budgets[c.id] || 0)}" placeholder="0 = no budget">
    </div>
  `).join("");
}

$("budgetForm").addEventListener("submit", e => {
  e.preventDefault();
  const budgets = {};
  document.querySelectorAll("[data-budget-id]").forEach(input => {
    const value = Number(input.value);
    if (value > 0) budgets[input.dataset.budgetId] = value;
  });
  state.budgets = budgets;
  persistAndRender();
  closeModal("budgetModal");
});

$("itemForm").addEventListener("submit", e => {
  e.preventDefault();
  const collection = itemMode === "account" ? state.accounts : state.categories;
  const check = uniqueName($("itemName").value, collection.map(x => x.name));
  if (!check.ok) return alert(check.message);

  if (itemMode === "account") {
    state.accounts.push({ id: crypto.randomUUID(), name: check.name, openingBalance: 0 });
  } else {
    state.categories.push({ id: crypto.randomUUID(), name: check.name });
  }

  persistAndRender();
  closeModal("itemModal");
});

document.addEventListener("click", e => {
  const close = e.target.closest("[data-close-modal]");
  if (close) closeModal(close.dataset.closeModal);

  const edit = e.target.closest(".edit-transaction");
  if (edit) openTransaction(edit.dataset.id);

  const del = e.target.closest(".delete-transaction");
  if (del) {
    if (!confirm("Delete this transaction?")) return;
    state.transactions = state.transactions.filter(t => t.id !== del.dataset.id);
    persistAndRender();
  }

  const balance = e.target.closest(".edit-balance");
  if (balance) {
    renderBalanceFields();
    openModal("balanceModal");
  }
});

$("exportDataBtn").addEventListener("click", () => exportState(state));
$("importDataBtn").addEventListener("click", () => $("importFileInput").click());

$("importFileInput").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!imported || imported.version !== 1 || !Array.isArray(imported.accounts) || !Array.isArray(imported.transactions)) {
      throw new Error("Invalid Obsidian Finance backup.");
    }
    state = imported;
    saveState(state);
    renderAll();
    alert("Backup imported successfully.");
  } catch (error) {
    alert(`Import failed: ${error.message}`);
  } finally {
    e.target.value = "";
  }
});

document.querySelectorAll(".modal").forEach(modal => {
  modal.addEventListener("click", e => {
    if (e.target === modal) closeModal(modal.id);
  });
});

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c]));
}

renderAll();
