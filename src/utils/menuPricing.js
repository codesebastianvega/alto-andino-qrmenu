// Public prices belong to the same valid location displayed by the menu.
export function resolveMenuLocation(locations, selectedId, search = '') {
  const available = (locations || []).filter(location => location.is_active !== false);
  const params = new URLSearchParams(search);
  const requested = params.get('loc') || params.get('location_id') || params.get('sede_id');
  return available.find(location => location.id === requested)
    || available.find(location => location.id === selectedId)
    || available.find(location => location.is_main)
    || available[0]
    || null;
}

export function getLocationPrice(product, priceMap) {
  const override = priceMap.get(product.id);
  return Number(override ?? product.price) || 0;
}

export function resolveCurrentMenuProduct(requested, products) {
  if (requested?.catalog_price == null) return requested;
  const current = products.find(product => product.id === (requested.productId || requested.id));
  // Keep local plan/context metadata, while catalog fields (including price) stay current.
  return current ? { ...requested, ...current } : null;
}

// Update only catalog-backed public cart lines; keep extras, quantities and notes.
export function resolveCartPrices(items, products, locationId) {
  const catalog = new Map(products.map(product => [product.id, product]));
  return items.map(item => {
    const product = catalog.get(item.productId || item.id);
    const plainCatalogItem = item._supabase?.id === product?.id && !Object.keys(item.options || {}).length && !item.milk;
    const previousBase = item.catalog_price ?? item.base_plan_price ?? (plainCatalogItem ? item.price : null);
    if (!product || !locationId || previousBase == null) return item;
    const price = Number(product.price) + (Number(item.price) - Number(previousBase));
    if (item.catalog_price === product.price && item.location_id === locationId) return item;
    return {
      ...item, price, catalog_price: product.price, location_id: locationId,
      ...(item.base_plan_price != null ? { base_plan_price: product.price } : {}),
      image: product.image, image_url: product.image_url,
    };
  });
}
