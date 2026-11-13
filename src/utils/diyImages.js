import library from '../data/diyImageLibrary.json' with { type: 'json' };

// Bundled catalog assets are scoped to a brand and option ID. An explicit
// administrator image always wins; no ingredient keywords are inferred.
export function resolveDIYImage(option, brandId) {
  return option.image_url || library[brandId]?.[option.id]?.image_url || option.ingredients?.image_url || null;
}
