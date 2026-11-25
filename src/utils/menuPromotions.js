const specialIds = new Set(['bento_del_dia_config', 'daily_special_config']);
const conceptsOf = row => Array.isArray(row?.brand_concepts) ? row.brand_concepts.filter(Boolean) : [];

// Resolve after locations load, and on every location change. Never promote a
// location-specific concept to global just because its row is the display fallback.
export function resolveMenuSettings(rows, brand, locationId) {
  if (!brand?.id) return null;
  const ownRows = (rows || []).filter(row => row.brand_id === brand.id);
  const global = ownRows.find(row => row.location_id === null);
  const local = locationId ? ownRows.find(row => row.location_id === locationId) : null;
  const selected = local || global || ownRows.find(row => row.logo_url) || ownRows[0];
  if (!selected) return null;
  const result = { ...selected, brand_concepts: [...conceptsOf(local || global)] };

  // Preserve the existing precedence of explicitly brand-wide special/meal-plan
  // settings, including an explicit disabled special. Do not mutate cached rows.
  if (local && global) {
    const globalConcepts = conceptsOf(global);
    if (!result.brand_concepts.length) result.brand_concepts = [...globalConcepts];
    else {
      const globalSpecial = globalConcepts.find(concept => specialIds.has(concept.id));
      const globalPlans = globalConcepts.find(concept => concept.id === 'meal_plans_config');
      if (globalSpecial) result.brand_concepts = [...result.brand_concepts.filter(concept => !specialIds.has(concept.id)), globalSpecial];
      if (globalPlans) result.brand_concepts = [...result.brand_concepts.filter(concept => concept.id !== 'meal_plans_config'), globalPlans];
    }
  }
  if (!result.logo_url) {
    const withLogo = ownRows.find(row => row.logo_url);
    if (withLogo) {
      result.logo_url = withLogo.logo_url;
      if (!result.favicon_url) result.favicon_url = withLogo.favicon_url;
    }
  }
  if (brand.name && (!result.business_name || result.business_name === 'Alto Andino') && brand.slug !== 'alto-andino') {
    result.business_name = global?.business_name || brand.name;
  }
  return result;
}

export function isMenuPromotionActive(promotion, brandId, locationId, now = new Date()) {
  if (!promotion || !brandId || promotion.brand_id !== brandId || promotion.is_active !== true) return false;
  if (promotion.location_id !== null && (!locationId || promotion.location_id !== locationId)) return false;
  const time = Number(now);
  if (promotion.start_date && !(new Date(promotion.start_date).getTime() <= time)) return false;
  if (promotion.end_date && !(new Date(promotion.end_date).getTime() >= time)) return false;
  if (Number(promotion.usage_limit) > 0 && Number(promotion.usage_count || 0) >= Number(promotion.usage_limit)) return false;
  return true;
}
