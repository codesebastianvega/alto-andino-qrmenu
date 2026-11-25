// Public H09 dependency only: no conversation, proposal or write operations.
export function isOrderableVisibility(product, status) {
  return Boolean(product && product.is_active === true && product.stock_status !== 'out' && status?.is_active !== false && status?.stock_status !== 'out');
}

export function getVisibilityLocationId(activeLocationId, currentLocationId, isAdmin) {
  return activeLocationId && activeLocationId !== 'all' ? activeLocationId : isAdmin ? null : currentLocationId || null;
}
