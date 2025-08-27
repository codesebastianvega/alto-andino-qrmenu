import stock from "@/data/stock.json";
import { toPlain } from "./strings";

export const slugify = (s = "") =>
  toPlain(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const products = stock?.products || {};

export function getStockState(id) {
  const state = products[id];
  if (state === "low") return "low";
  if (state === false) return "out";
  return "in";
}

export function isUnavailable(itemOrId) {
  const id =
    typeof itemOrId === "string"
      ? itemOrId
      : itemOrId?.id || slugify(itemOrId?.name || "");
  return getStockState(id) === "out";
}
