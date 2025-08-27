export const formatCOP = (value = 0) =>
  (Number(value) || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });