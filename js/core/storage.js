import { STORAGE_KEYS, DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from "../data/defaults.js";
import { normalizeState } from "./validators.js";

const blankState = () => ({
  version: 1,
  settings: { ...DEFAULT_SETTINGS },
  accounts: DEFAULT_ACCOUNTS.map(name => ({ id: crypto.randomUUID(), name, openingBalance: 0 })),
  categories: DEFAULT_CATEGORIES.map(name => ({ id: crypto.randomUUID(), name })),
  transactions: [],
  budgets: {}
});

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns { state, notice }. Never throws and never discards stored data:
 * if the stored state is unreadable, the raw text is copied to a backup key
 * and the app starts blank with a visible notice.
 */
export function loadState() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEYS.state);
  } catch {
    return { state: blankState(), notice: "Browser storage is unavailable. Changes will not be saved. Use Export to keep your data." };
  }
  if (raw === null) return { state: blankState(), notice: null };

  try {
    const { state, dropped } = normalizeState(JSON.parse(raw));
    const notice = dropped > 0
      ? `${dropped} damaged transaction${dropped === 1 ? " was" : "s were"} removed while loading.`
      : null;
    return { state, notice };
  } catch {
    safeSet(STORAGE_KEYS.corruptBackup, raw);
    return {
      state: blankState(),
      notice: "Saved data could not be read, so the app started empty. A copy of the unreadable data was kept in this browser."
    };
  }
}

export function saveState(state) {
  return safeSet(STORAGE_KEYS.state, JSON.stringify(state));
}

export function backupBeforeImport(state) {
  return safeSet(STORAGE_KEYS.preImportBackup, JSON.stringify(state));
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
