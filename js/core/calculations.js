export function calculateBalances(state) {
  const balances = Object.fromEntries(state.accounts.map(a => [a.id, Number(a.openingBalance) || 0]));

  [...state.transactions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach(t => {
      const amount = Number(t.amount) || 0;
      if (t.type === "income" && t.accountId && balances[t.accountId] !== undefined) {
        balances[t.accountId] += amount;
      } else if (t.type === "expense" && t.accountId && balances[t.accountId] !== undefined) {
        balances[t.accountId] -= amount;
      } else if (t.type === "transfer") {
        if (t.fromAccountId && balances[t.fromAccountId] !== undefined) balances[t.fromAccountId] -= amount;
        if (t.toAccountId && balances[t.toAccountId] !== undefined) balances[t.toAccountId] += amount;
      }
    });

  return balances;
}

export function getTotalCash(state) {
  return Object.values(calculateBalances(state)).reduce((sum, value) => sum + value, 0);
}

export function getMonthTotals(state, date = new Date()) {
  const y = date.getFullYear();
  const m = date.getMonth();
  return state.transactions.reduce((out, t) => {
    const d = new Date(`${t.date}T00:00:00`);
    if (d.getFullYear() !== y || d.getMonth() !== m) return out;
    if (t.type === "income") out.income += Number(t.amount) || 0;
    if (t.type === "expense") out.expenses += Number(t.amount) || 0;
    return out;
  }, { income: 0, expenses: 0 });
}

export function getCategorySpend(state, date = new Date()) {
  const y = date.getFullYear(), m = date.getMonth();
  const result = {};
  state.transactions.forEach(t => {
    if (t.type !== "expense" || !t.categoryId) return;
    const d = new Date(`${t.date}T00:00:00`);
    if (d.getFullYear() !== y || d.getMonth() !== m) return;
    result[t.categoryId] = (result[t.categoryId] || 0) + (Number(t.amount) || 0);
  });
  return result;
}

export function getMonthlyCashflow(state, months = 6) {
  const result = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const totals = { income: 0, expenses: 0 };
    state.transactions.forEach(t => {
      if (!t.date?.startsWith(key)) return;
      if (t.type === "income") totals.income += Number(t.amount) || 0;
      if (t.type === "expense") totals.expenses += Number(t.amount) || 0;
    });
    result.push({ label: d.toLocaleDateString(undefined, { month: "short", year: "2-digit" }), ...totals });
  }
  return result;
}

export function getEquitySeries(state) {
  const opening = state.accounts.reduce((sum, a) => sum + (Number(a.openingBalance) || 0), 0);
  const sorted = [...state.transactions].sort((a, b) => a.date.localeCompare(b.date));
  const points = [{ label: "Opening", value: opening }];
  let value = opening;

  sorted.forEach(t => {
    if (t.type === "income") value += Number(t.amount) || 0;
    if (t.type === "expense") value -= Number(t.amount) || 0;
    points.push({
      label: new Date(`${t.date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      value
    });
  });
  return points;
}
