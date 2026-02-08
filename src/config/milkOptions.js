export const MILK_OPTIONS = [
  { id: "entera", label: "Leche entera", priceDelta: 0, default: true },
  { id: "deslactosada", label: "Deslactosada", priceDelta: 1000 },
  { id: "avena", label: "Avena", priceDelta: 2000 },
  { id: "almendras", label: "Almendras", priceDelta: 2500 },
];

export const isMilkEligible = (product = {}) => {
  // Check explicit config first (handle both camelCase from app and snake_case from DB)
  const config = product.configOptions || product.config_options || {};
  
  if (config.milk_policy === 'none') return false;
  if (config.milk_policy === 'required' || config.milk_policy === 'optional') return true;
  if (config.allowMilk === true) return true;

  // Fallback to name matching if no explicit config prevents it
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
    "cafe",
    "frapp",
    "frappe",
    "malteada",
    "smoothie",
  ].some((k) => hay.includes(k));
};