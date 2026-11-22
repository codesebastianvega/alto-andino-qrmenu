export function customerOrderBalance(order, brandId, discardedIds = new Set()) {
  if (!brandId || order.brand_id !== brandId || discardedIds.has(order.id)) return 0;
  if (order.status === 'cancelled' || order.payment_status === 'cancelled' || order.payment_status === 'paid') return 0;
  const pending = order.payment_status === 'pending' || String(order.payment_method || '').toLowerCase().includes('fiado');
  if (!pending) return 0;
  return Math.max(0, Number(order.total_amount || 0) - Number(order.paid_amount || 0));
}

export function customerOrderPaymentLabel(order, discardedIds = new Set()) {
  if (discardedIds.has(order.id)) return 'Prueba descartada';
  if (order.status === 'cancelled' || order.payment_status === 'cancelled') return 'Sin cobro';
  return order.payment_status === 'paid' ? 'Pagado' : 'Pendiente';
}
