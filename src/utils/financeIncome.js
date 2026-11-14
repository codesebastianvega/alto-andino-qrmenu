import { resolveOrderItemName } from './formatters.js';

export function summarizeIncome(orders = []) {
  const products = new Map();
  let sold = 0, collected = 0, pending = 0, units = 0, itemTotal = 0;
  const rows = orders.map(order => {
    const total = Number(order.total_amount) || 0;
    const paid = order.paid_amount != null ? Number(order.paid_amount) || 0
      : order.payment_status === 'paid' ? total : 0;
    const due = Math.max(0, total - paid);
    sold += total;
    collected += paid;
    pending += due;
    for (const item of order.order_items || []) {
      const name = resolveOrderItemName(item);
      const quantity = Number(item.quantity) || 0;
      const amount = quantity * (Number(item.unit_price) || 0);
      const key = `${item.product_id || item.products?.id || ''}:${name}`;
      const product = products.get(key) || { key, name, quantity: 0, amount: 0 };
      product.quantity += quantity;
      product.amount += amount;
      products.set(key, product);
      units += quantity;
      itemTotal += amount;
    }
    return { ...order, total, paid, due };
  });
  return { rows, sold, collected, pending, units, itemTotal,
    adjustments: sold - itemTotal,
    products: [...products.values()].sort((a, b) => b.amount - a.amount) };
}
