export const toPlain = (s = "") =>
  s
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

export const matchesQuery = (product, q) => {
  if (!q) return true;
  const needle = toPlain(q);
  const hay = [
    product?.title,
    product?.description,
    ...(product?.tags || []),
    ...(product?.ingredients || []),
  ]
    .filter(Boolean)
    .map(toPlain)
    .join(" ");
  return hay.includes(needle);
};

