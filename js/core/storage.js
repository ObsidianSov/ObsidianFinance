import { STORAGE_KEYS, DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from "../data/defaults.js";

const blankState = () => ({
  version: 1,
  settings: { ...DEFAULT_SETTINGS },
  accounts: DEFAULT_ACCOUNTS.map(name => ({ id: crypto.randomUUID(), name, openingBalance: 0 })),
  categories: DEFAULT_CATEGORIES.map(name => ({ id: crypto.randomUUID(), name })),
  transactions: [],
  budgets: {}
});

function migrateLegacy() {
  const oldTransactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.legacyTransactions) || "null");
  const oldBalances = JSON.parse(localStorage.getItem(STORAGE_KEYS.legacyBalances) || "null");
  const oldBudgets = JSON.parse(localStorage.getItem(STORAGE_KEYS.legacyBudgets) || "null");

  if (!Array.isArray(oldTransactions) && !oldBalances && !oldBudgets) return null;

  const state = blankState();
  const accountNames = new Set(Object.keys(oldBalances || {}));
  oldTransactions?.forEach(t => {
    if (t.account) accountNames.add(t.account);
    if (t.fromAccount) accountNames.add(t.fromAccount);
    if (t.toAccount) accountNames.add(t.toAccount);
  });

  state.accounts = [...accountNames].map(name => ({
    id: crypto.randomUUID(),
    name,
    openingBalance: Number(oldBalances?.[name] || 0)
  }));

  const accountIdByName = Object.fromEntries(state.accounts.map(a => [a.name, a.id]));
  const categoryNames = new Set(state.categories.map(c => c.name));
  oldTransactions?.forEach(t => t.category && categoryNames.add(t.category));
  state.categories = [...categoryNames].map(name => ({ id: crypto.randomUUID(), name }));
  const categoryIdByName = Object.fromEntries(state.categories.map(c => [c.name, c.id]));

  state.transactions = (oldTransactions || []).map(t => ({
    id: t.id || crypto.randomUUID(),
    date: t.date,
    type: String(t.type || "expense").toLowerCase(),
    accountId: accountIdByName[t.account] || null,
    fromAccountId: accountIdByName[t.fromAccount] || null,
    toAccountId: accountIdByName[t.toAccount] || null,
    categoryId: categoryIdByName[t.category] || null,
    description: t.description || "",
    amount: Number(t.amount) || 0
  }));

  Object.entries(oldBudgets || {}).forEach(([categoryName, amount]) => {
    const categoryId = categoryIdByName[categoryName];
    if (categoryId) state.budgets[categoryId] = Number(amount) || 0;
  });

  return state;
}

export function loadState() {
  const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.state) || "null");
  if (current) return current;
  const migrated = migrateLegacy();
  return migrated || blankState();
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(state));
}

export function exportState(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `obsidian-finance-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
