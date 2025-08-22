export const COP = (n) => {
  const num = Number(String(n).replace(/[^\d.-]/g, ""));
  if (!isFinite(num)) return "0";
  return num.toLocaleString("es-CO", { maximumFractionDigits: 0 });
};

export const formatCOP = (v) => {
  const num = Number(String(v).replace(/[^\d.-]/g, ""));
  if (!isFinite(num)) return String(v);
  return num.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
};
