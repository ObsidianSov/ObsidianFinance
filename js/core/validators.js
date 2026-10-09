import { DEFAULT_SETTINGS } from "../data/defaults.js";

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TYPES = ["income", "expense", "transfer"];

export function cleanName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

export function uniqueName(value, existingNames) {
  const name = cleanName(value);
  if (!name) return { ok: false, message: "Name cannot be empty." };
  if (existingNames.some(existing => existing.toLowerCase() === name.toLowerCase())) {
    return { ok: false, message: "That name already exists." };
  }
  return { ok: true, name };
}

export function validAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
}

export function isValidDate(value) {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

function cleanSettings(raw) {
  const base = { ...DEFAULT_SETTINGS };
  if (!raw || typeof raw !== "object") return base;
  const candidate = {
    currency: typeof raw.currency === "string" ? raw.currency : base.currency,
    currencySymbol: typeof raw.currencySymbol === "string" ? raw.currencySymbol : base.currencySymbol,
    locale: typeof raw.locale === "string" ? raw.locale : base.locale
  };
  try {
    new Intl.NumberFormat(candidate.locale, { style: "currency", currency: candidate.currency }).format(1);
    return candidate;
  } catch {
    return base;
  }
}

function cleanNamedList(list) {
  const seenIds = new Set();
  const seenNames = new Set();
  const out = [];
  list.forEach(item => {
    if (!item || typeof item !== "object") return;
    const id = item.id;
    const name = cleanName(item.name);
    if (typeof id !== "string" || !ID_PATTERN.test(id) || seenIds.has(id)) return;
    if (!name || seenNames.has(name.toLowerCase())) return;
    seenIds.add(id);
    seenNames.add(name.toLowerCase());
    out.push({ ...item, id, name });
  });
  return out;
}

/**
 * Turns untrusted data (imported file or stored JSON) into a safe state object.
 * Throws an Error with a readable message when the data is not a usable backup.
 * Invalid individual records are dropped and counted, never silently kept.
 */
export function normalizeState(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("This is not an Obsidian Finance backup.");
  }
  if (raw.version !== 1) throw new Error("Unsupported backup version.");
  if (!Array.isArray(raw.accounts) || !Array.isArray(raw.categories) || !Array.isArray(raw.transactions)) {
    throw new Error("Backup is missing accounts, categories or transactions.");
  }

  const accounts = cleanNamedList(raw.accounts).map(a => ({
    id: a.id,
    name: a.name,
    openingBalance: Number.isFinite(Number(a.openingBalance)) ? Number(a.openingBalance) : 0
  }));
  const categories = cleanNamedList(raw.categories).map(c => ({ id: c.id, name: c.name }));

  const accountIds = new Set(accounts.map(a => a.id));
  const categoryIds = new Set(categories.map(c => c.id));
  const seenTx = new Set();
  const transactions = [];
  let dropped = 0;

  raw.transactions.forEach(t => {
    const ok = t && typeof t === "object"
      && typeof t.id === "string" && ID_PATTERN.test(t.id) && !seenTx.has(t.id)
      && isValidDate(t.date)
      && TYPES.includes(t.type)
      && validAmount(t.amount)
      && (t.type === "transfer"
        ? accountIds.has(t.fromAccountId) && accountIds.has(t.toAccountId) && t.fromAccountId !== t.toAccountId
        : accountIds.has(t.accountId) && categoryIds.has(t.categoryId));
    if (!ok) { dropped++; return; }
    seenTx.add(t.id);
    const description = typeof t.description === "string" ? t.description : "";
    transactions.push(t.type === "transfer"
      ? { id: t.id, date: t.date, type: t.type, accountId: null, categoryId: null,
          fromAccountId: t.fromAccountId, toAccountId: t.toAccountId, description, amount: Number(t.amount) }
      : { id: t.id, date: t.date, type: t.type, accountId: t.accountId, categoryId: t.categoryId,
          fromAccountId: null, toAccountId: null, description, amount: Number(t.amount) });
  });

  const budgets = {};
  if (raw.budgets && typeof raw.budgets === "object" && !Array.isArray(raw.budgets)) {
    Object.entries(raw.budgets).forEach(([id, value]) => {
      const amount = Number(value);
      if (categoryIds.has(id) && Number.isFinite(amount) && amount > 0) budgets[id] = amount;
    });
  }

  return {
    state: { version: 1, settings: cleanSettings(raw.settings), accounts, categories, transactions, budgets },
    dropped
  };
}
