export const formatCOP = (val) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(val || 0);

export const calculateRoiMetrics = ({ dailyOrders = 40, ticketBase = 22000, days = 30 }) => {
  // Situación actual
  const dailyBase = dailyOrders * ticketBase;
  const monthlyBase = dailyBase * days;

  // Palanca 1: Subida de ticket por fotos reales de bebidas/postres (+25%)
  const ticketBoostPct = 0.25;
  const ticketOptimized = Math.round(ticketBase * (1 + ticketBoostPct));
  const ticketDiff = ticketOptimized - ticketBase;

  // Palanca 2: Subida de pedidos por rotación ágil y canal directo (+15%)
  const ordersBoostPct = 0.15;
  const ordersOptimized = Math.round(dailyOrders * (1 + ordersBoostPct));
  const ordersDiff = ordersOptimized - dailyOrders;

  // Situación optimizada con Aluna + Fotos reales
  const dailyOptimized = ordersOptimized * ticketOptimized;
  const monthlyOptimized = dailyOptimized * days;

  // Ganancia adicional neta
  const extraDaily = dailyOptimized - dailyBase;
  const extraMonthly = monthlyOptimized - monthlyBase;

  return {
    dailyBase,
    monthlyBase,
    ticketOptimized,
    ticketDiff,
    ordersOptimized,
    ordersDiff,
    dailyOptimized,
    monthlyOptimized,
    extraDaily,
    extraMonthly
  };
};

export const calculatePaybackDays = (planCost, extraDaily) => {
  if (!extraDaily || extraDaily <= 0) return 30;
  return Math.max(1, Math.ceil(planCost / extraDaily));
};
