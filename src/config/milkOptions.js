export const MILK_OPTIONS = [
  { id: "entera", label: "Leche entera", priceDelta: 0, default: true },
  { id: "deslactosada", label: "Deslactosada", priceDelta: 1000 },
  { id: "avena", label: "Avena", priceDelta: 2000 },
  { id: "almendras", label: "Almendras", priceDelta: 2500 },
];

export const isMilkEligible = (product = {}) => {
  if (product.allowMilk) return true;
  const hay = `${(product.name || "").toLowerCase()} ${(product.category || product.categoryName || "").toLowerCase()}`;
  return [
    "latte",
    "capuccino",
    "cappuccino",
    "flat white",
    "mocaccino",
    "moka",
    "moca",
    "matcha",
    "chai",
    "chocolate",
    "café",
    "frapp",
    "frappe",
    "malteada",
    "smoothie",
  ].some((k) => hay.includes(k));
};