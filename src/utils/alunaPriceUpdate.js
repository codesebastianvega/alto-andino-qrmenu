// Only explicit price amounts from the current message belong to a price proposal.
// Do not reuse catalog creation drafts, which can refer to a different product.
export function getRequestedPrice(message) {
  if (!/\bprecio\b|\busar\b|→/i.test(String(message || ''))) return null;
  const amount = String(message || '').match(/(?:\ba\s+|\busar\s+|\bprecio(?:\s+(?:nuevo|de|a))?\s*[:=]?\s*|→\s*)\$?\s*(-?\d+(?:[.,]\d+)*)\s*(?:COP|pesos)?\b/gi);
  if (!amount?.length) return null;
  const raw = amount.at(-1).match(/-?\d+(?:[.,]\d+)*/)?.[0];
  const normalized = /^\d{1,3}(?:[.,]\d{3})+$/.test(raw) ? raw.replace(/[.,]/g, '') : raw;
  const price = Number(normalized);
  return Number.isFinite(price) && price > 0 && price <= 1_000_000_000 ? price : null;
}

export function buildPriceUpdateProposal(message, product, idempotencyKey) {
  const price = getRequestedPrice(message);
  if (!product?.id || price === null || !/\b(?:cambia|cambiar|actualiza|actualizar|ajusta|ajustar|sube|baja|modifica|modificar|usar)\b/i.test(message)) return null;
  return {
    type: 'proposal',
    title: `Actualizar precio de ${product.name}`,
    summary: 'Aluna preparó la actualización de precio para este producto.',
    beforeAfter: [{ label: 'Precio', before: `$ ${Number(product.price || 0).toLocaleString('es-CO')}`, after: `$ ${price.toLocaleString('es-CO')}` }],
    riskLevel: 'low', action: 'edit_product_price', product,
    priceUpdate: { price, idempotencyKey },
  };
}

export function buildPriceUpdateBody({ brandId, productId, price, idempotencyKey }) {
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0 || price > 1_000_000_000) {
    throw new Error('El nuevo precio debe ser un número válido mayor que cero.');
  }
  return {
    brand_id: brandId,
    action: 'update_product',
    approved: true,
    idempotency_key: idempotencyKey,
    proposal: { entity_id: productId, changes: { price } },
  };
}
