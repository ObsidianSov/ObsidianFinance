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
