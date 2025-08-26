export const slugify = (s = "") =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

import stockdata from "../data/stock.json";
const PRODUCTS = (stockdata?.products ?? {}) || {};

export function getStockState(idOrName = "") {
  const key = idOrName || slugify(idOrName);
  const v = PRODUCTS[key];
  if (v === false) return "out";
  if (v === "low") return "low";
  return "ok";
}


export function isUnavailable(p) {
  if (!p) return true;
  if (p.available === false) return true;
  if (typeof p.stock === "number" && p.stock <= 0) return true;
  if (p.status && /unavailable|soldout/i.test(p.status)) return true;
  if (Array.isArray(p.badges) && p.badges.some(b => /no disponible/i.test(b))) return true;
  return false;
}

