import { supabase } from '../../../config/supabase';
import { withTimeout } from '../../../utils/withTimeout';

export function enrichModifierGroups(rawGroups = []) {
  return rawGroups.map((group) => {
    const opts = Array.isArray(group.modifier_options) ? [...group.modifier_options] : [];
    if (group.id === 'b0000d14-0000-4000-a000-000000000004') {
      if (!opts.some((o) => /ma[ií]z/i.test(o.name || ''))) {
        opts.push({
          id: 'boku-opt-maiz-tierno',
          group_id: group.id,
          name: 'Maíz Tierno Dulce',
          emoji: '🌽',
          price: 0,
          extra_price: 1500,
          is_active: true,
          stock_status: 'in',
          sort_order: 2,
        });
      }
      if (!opts.some((o) => /zanahoria/i.test(o.name || ''))) {
        opts.push({
          id: 'boku-opt-zanahoria-fresca',
          group_id: group.id,
          name: 'Zanahoria Fresca Rallada',
          emoji: '🥕',
          price: 0,
          extra_price: 1500,
          is_active: true,
          stock_status: 'in',
          sort_order: 3,
        });
      }
    }
    if (group.id === 'b0000d14-0000-4000-a000-000000000006') {
      if (!opts.some((o) => /ch[ií]a/i.test(o.name || ''))) {
        opts.push({
          id: 'boku-opt-semillas-chia',
          group_id: group.id,
          name: 'Semillas de Chía',
          emoji: '🌱',
          price: 0,
          extra_price: 500,
          is_active: true,
          stock_status: 'in',
          sort_order: 1,
        });
      }
    }
    return { ...group, modifier_options: opts };
  });
}

export function resolveBestRestaurantSettings(allRS = [], locs = [], activeLocationId, brandData) {
  const brandLevelRS = allRS.find((s) => !s.location_id) || null;
  const mainLoc = locs.find((l) => l.is_main);
  const bestRS =
    allRS.find((s) => activeLocationId && s.location_id === activeLocationId) ||
    allRS.find((s) => mainLoc && s.location_id === mainLoc.id) ||
    brandLevelRS ||
    allRS.find((s) => s.logo_url) ||
    allRS[0] ||
    null;

  if (bestRS) {
    if (brandLevelRS && brandLevelRS.brand_concepts?.length > 0) {
      if (!bestRS.brand_concepts || bestRS.brand_concepts.length === 0) {
        bestRS.brand_concepts = brandLevelRS.brand_concepts;
      } else {
        const brandSpecial = brandLevelRS.brand_concepts.find(
          (c) => c && (c.id === 'bento_del_dia_config' || c.id === 'daily_special_config')
        );
        const brandMealPlans = brandLevelRS.brand_concepts.find(
          (c) => c && c.id === 'meal_plans_config'
        );
        if (brandSpecial) {
          bestRS.brand_concepts = [
            ...bestRS.brand_concepts.filter(
              (c) => c && c.id !== 'bento_del_dia_config' && c.id !== 'daily_special_config'
            ),
            brandSpecial,
          ];
        }
        if (brandMealPlans) {
          bestRS.brand_concepts = [
            ...bestRS.brand_concepts.filter((c) => c && c.id !== 'meal_plans_config'),
            brandMealPlans,
          ];
        }
      }
    }
    if (!bestRS.logo_url) {
      const rowWithLogo = allRS.find((s) => s.logo_url);
      if (rowWithLogo) {
        bestRS.logo_url = rowWithLogo.logo_url;
        if (!bestRS.favicon_url) bestRS.favicon_url = rowWithLogo.favicon_url;
      }
    }
    if (
      brandData?.name &&
      (bestRS.business_name === 'Alto Andino' || !bestRS.business_name) &&
      brandData.slug !== 'alto-andino'
    ) {
      bestRS.business_name = brandLevelRS?.business_name || brandData.name;
    }
  }

  return bestRS;
}

export async function fetchBrandMenuData(brandId) {
  const brandFilter = (query) => query.eq('brand_id', brandId);

  return withTimeout(
    Promise.all([
      brandFilter(
        supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
      ),
      brandFilter(
        supabase
          .from('modifier_groups')
          .select(
            '*, modifier_options!modifier_options_group_id_fkey(id, group_id, name, price, extra_price, sort_order, created_at, nested_group_id, image_url, emoji, ingredient_id, is_active, stock_status, available_portions, ingredients!modifier_options_ingredient_id_fkey(image_url))'
          )
      ),
      brandFilter(
        supabase
          .from('experiences')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
      ),
      brandFilter(supabase.from('allergens').select('*').order('name')),
      brandFilter(
        supabase
          .from('locations')
          .select('*')
          .eq('is_active', true)
          .order('is_main', { ascending: false })
      ),
      brandFilter(
        supabase
          .from('promo_banners')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
      ),
      brandFilter(supabase.from('home_settings').select('*').limit(1)),
      brandFilter(supabase.from('restaurant_settings').select('*')),
      supabase
        .from('brands')
        .select('*, plans(*, plan_features(*))')
        .eq('id', brandId)
        .single(),
      brandFilter(
        supabase
          .from('products')
          .select('*, categories:category_id (slug)')
          .order('sort_order', { ascending: true })
      ),
      brandFilter(
        supabase.from('business_hours').select('*').order('day_of_week', { ascending: true })
      ),
      brandFilter(
        supabase
          .from('promotions')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
      ),
    ]),
    15000,
    'La carga inicial del menú'
  );
}

export async function fetchLocationOverrides(locationIds = []) {
  if (!locationIds || locationIds.length === 0) {
    return [[], [], [], []];
  }
  const results = await withTimeout(
    Promise.all([
      supabase.from('location_product_prices').select('*').in('location_id', locationIds),
      supabase.from('location_product_status').select('*').in('location_id', locationIds),
      supabase.from('location_categories').select('*').in('location_id', locationIds),
      supabase.from('location_modifier_groups').select('*').in('location_id', locationIds),
    ]),
    10000,
    'La carga de configuración por sede'
  );

  return [
    results[0].data || [],
    results[1].data || [],
    results[2].data || [],
    results[3].data || [],
  ];
}
