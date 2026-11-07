import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://gqjfjtzsdpslwffbqqyw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY);
    const brandId = 'a63da806-a62a-49b9-a833-07e0976785ad';
    const locationId = '48be7326-6355-481b-b334-b7edc4b82e6f';
    const bowlsCatId = '6316a6dc-8a4c-4cc1-874b-4f3d362ed635'; // BOKU Bowls
    const toriKatsuId = 'b0000b25-0000-4000-a000-000000000025';
    const salmonFreshId = 'd07007ec-761b-4f40-bad5-799c1154b9ab';
    const pastaAlfredoId = 'b0000b16-0000-4000-a000-000000000006';

    // 1. Insertar / Actualizar Poke Tori Katsu como producto oficial e independiente
    const toriKatsuProduct = {
      id: toriKatsuId,
      brand_id: brandId,
      category_id: bowlsCatId,
      name: 'Poke Tori Katsu (Pechuga Crocante)',
      description: 'Pechuga apanada crocante en tiras con salsa tonkatsu, arroz, maíz sofrito, repollo morado, queso en cubos, tomates cherry, alga nori y verde de cebollín. 🥣 ¡Combo completo! Incluye: Sopita del día o Fruta + 🥤 Jugo del día (5 oz).',
      price: 22000,
      cost: 8500,
      margin: 61.36,
      stock_status: 'in',
      is_active: true,
      image_url: '/img/products/boku-tori-katsu.webp',
      subcategory: 'Bowls Poke Fresco',
      requires_kitchen: true,
      station: 'kitchen',
      is_addon: false,
      is_upsell: false,
      available_portions: 50,
      modifier_groups: [
        'b0000b20-0000-4000-a000-000000000002', // Sopita / Fruta
        'b0000b20-0000-4000-a000-000000000001'  // Jugo del día
      ],
      tags: ['Poke', 'Bowl', 'Tori Katsu', 'Pollo', 'Premium', 'Almuerzo'],
      sort_order: 1,
      updated_at: new Date().toISOString()
    };

    const { data: upsertTori, error: toriErr } = await supabase
      .from('products')
      .upsert(toriKatsuProduct, { onConflict: 'id' })
      .select();

    if (toriErr) console.error('Error upserting Tori Katsu:', toriErr);

    // 2. Estado de sede para Tori Katsu
    await supabase
      .from('location_product_status')
      .upsert({
        location_id: locationId,
        product_id: toriKatsuId,
        is_active: true,
        stock_status: 'in',
        available_portions: 50,
        updated_at: new Date().toISOString()
      }, { onConflict: 'location_id,product_id' });

    // 3. Actualizar Poke Salmón Fresh con su precio promo de $22.000 para hoy
    await supabase
      .from('products')
      .update({
        price: 22000,
        stock_status: 'in',
        is_active: true,
        available_portions: 50,
        updated_at: new Date().toISOString()
      })
      .eq('id', salmonFreshId);

    await supabase
      .from('location_product_status')
      .upsert({
        location_id: locationId,
        product_id: salmonFreshId,
        is_active: true,
        stock_status: 'in',
        available_portions: 50,
        updated_at: new Date().toISOString()
      }, { onConflict: 'location_id,product_id' });

    // 4. Asegurar que Pasta Alfredo quede rigurosamente inactiva / agotada en DB
    await supabase
      .from('products')
      .update({
        is_active: false,
        stock_status: 'out',
        available_portions: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', pastaAlfredoId);

    await supabase
      .from('location_product_status')
      .upsert({
        location_id: locationId,
        product_id: pastaAlfredoId,
        is_active: false,
        stock_status: 'out',
        available_portions: 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'location_id,product_id' });

    // 5. Configurar restaurant_settings para los Pokes del Día
    const { data: currentSettings } = await supabase
      .from('restaurant_settings')
      .select('id, brand_concepts')
      .eq('brand_id', brandId)
      .single();

    if (currentSettings) {
      let concepts = Array.isArray(currentSettings.brand_concepts) ? [...currentSettings.brand_concepts] : [];
      let bentoIdx = concepts.findIndex(c => c && (c.id === 'bento_del_dia_config' || c.id === 'daily_special_config'));
      
      const bentoConfig = {
        id: 'bento_del_dia_config',
        label: '🔥 Línea Poke Premium del Día',
        enabled: true,
        promo_price: 22000,
        standard_price: 28000,
        soup_name: '🥣 Sopita del Día casera o Fruta',
        drink_name: '🥤 Jugo del Día (5 oz)',
        manual_override_product_id: toriKatsuId,
        secondary_product_ids: [salmonFreshId],
        updated_at: new Date().toISOString()
      };

      if (bentoIdx >= 0) {
        concepts[bentoIdx] = { ...concepts[bentoIdx], ...bentoConfig };
      } else {
        concepts.push(bentoConfig);
      }

      await supabase
        .from('restaurant_settings')
        .update({
          brand_concepts: concepts,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSettings.id);
    }

    return res.status(200).json({
      success: true,
      hasServiceKey: Boolean(SUPABASE_SERVICE_KEY),
      toriKatsu: upsertTori,
      message: 'Poke Tori Katsu aprovisionado con éxito en DB (productos, sedes, Bento del Día) y Pasta Alfredo confirmada oculta.'
    });
  } catch (err) {
    console.error('Error provisioning poke:', err);
    return res.status(500).json({ error: err.message });
  }
}
