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

