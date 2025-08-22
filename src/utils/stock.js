export function slugify(s = "") {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

import raw from "../data/stock.json";
const data = raw?.default || raw || {};
const map = { ...(data.products || {}) };
if (data.cumbre) {
  for (const [k, v] of Object.entries(data.cumbre)) {
    map[`cumbre:${k}`] = v;
  }
}

export function getStockState(productIdOrName) {
  try {
    const id = productIdOrName || "";
    const key = map[id] !== undefined ? id : slugify(productIdOrName || "");
    const v = map[key];
    if (v === false) return "out";
    if (v === "low") return "low";
    return "ok";
  } catch {
    return "ok";
  }
}
