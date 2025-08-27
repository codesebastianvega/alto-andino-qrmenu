export const BOWL_BASE_PRICE = Number(import.meta.env.VITE_BOWL_BASE_PRICE || 28000);

export const SANDWICH_PRICE_BY_ITEM = {
  cerdo: { clasico: 12000, grande: 32000 },
  pollo: { clasico: 14000, grande: 35000 },
  pavo: { clasico: 19000, grande: 39000 },
  serrano: { unico: 12500 },
  cosecha: { unico: 16000 },
};

export const SURCHARGES = {
  // ejemplo: extraShot: 2000
};