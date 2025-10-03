export const BOWL_BASE_PRICE = Number(import.meta.env.VITE_BOWL_BASE_PRICE || 28000);

export const SANDWICH_PRICE_BY_ITEM = {
  cerdo: { clasico: 13000, grande: 32000 },
  pollo: { clasico: 15000, grande: 35000 },
  pavo: { clasico: 22000, grande: 53000 },
  serrano: { unico: 12500 },
  cosecha: { unico: 16000 },
};

export const SURCHARGES = {
  // ejemplo: extraShot: 2000
};
