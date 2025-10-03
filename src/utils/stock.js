import stock from "@/data/stock.json";
import { toPlain } from "./strings";

export const slugify = (s = "") =>
  toPlain(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const products = stock?.products || {};

export function getStockFlags(id) {
  const raw = products[id];
  let state;
  if (raw === "soon") state = "soon";
  else if (raw === "low") state = "low";
  else if (raw === false || raw === "out") state = "out";
  else state = "in";

  return {
    state,
    isSoon: state === "soon",
    isLow: state === "low",
    isOut: state === "out",
    isIn: state === "in",
  };
}

export function getStockState(id) {
  return getStockFlags(id).state;
}

export function isUnavailable(itemOrId) {
  const id =
    typeof itemOrId === "string"
      ? itemOrId
      : itemOrId?.id || slugify(itemOrId?.name || "");
  return getStockState(id) === "out";
}
