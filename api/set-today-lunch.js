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
    const catBentosId = 'b0000c01-0000-4000-a000-000000000001';

    // ID nuevo e independiente para el Bento Frijolada (creado desde cero sin tocar ni reemplazar ningún otro plato)
    const frijoladaId = 'b0000b26-0000-4000-a000-000000000026';
    // ID existente de Espagueti a la Boloñesa de la Casa
    const bolonesaId = 'b0000f02-0000-4000-a000-000000000002';

    // 1. Crear Bento Frijolada de la Casa desde cero
    const frijoladaProduct = {
      id: frijoladaId,
      brand_id: brandId,
      category_id: catBentosId,
      name: 'Bento Frijolada de la Casa (Especial del Día)',
      description: 'Arroz blanco suelto, proteína a elección salteada al wok con ajonjolí y cebollín fresco (cerdo o pollo), huevo frito en su punto, tajadas de plátano maduro dorado y aguacate fresco en abanico. 🍲 ¡En combo completo! Incluye Frijolada casera (16 oz) o Fruta + 🥤 Jugo del Día de la Casa (5 oz).',
      price: 22000,
      cost: 7600,
      margin: 65.45,
      stock_status: 'in',
      stock_quantity: 50,
      available_portions: 50,
      image_url: '/img/products/boku-frijolada.jpg',
      tags: ['Huevo', 'Proteico', 'bento', 'frijolada', 'almuerzo'],
      is_active: true,
      is_addon: false,
      requires_kitchen: true,
      station: 'kitchen',
      subcategory: 'El Bento del Día',
      sort_order: 1,
      modifier_groups: [
        'dfa73774-57c7-4a2b-8797-c11d416aa5e4', // Proteína (Pollo al wok o Cerdo al wok)
        'b0000b20-0000-4000-a000-000000000002', // Entrada Incluida (Sopita / Frijoles 16 oz o Fruta)
        'b0000b20-0000-4000-a000-000000000001', // Bebida de la Casa Incluida (Jugo del Día 5 oz)
        'b0000c40-0000-4000-a000-000000000001'  // Adiciones Criollas Paisas
      ],
      updated_at: new Date().toISOString()
    };

    const { data: upsertedFrijolada, error: frijoladaErr } = await supabase
      .from('products')
      .upsert(frijoladaProduct, { onConflict: 'id' })
      .select();

    if (frijoladaErr) throw frijoladaErr;

    // 2. Activar Espagueti a la Boloñesa de la Casa para que acompañe hoy como opción de Bento del Día
    // Nos aseguramos de que tenga los modificadores de Entrada Incluida, Bebida Incluida y Queso & Adiciones para Pasta
    const { data: updatedBolonesa, error: bolonesaErr } = await supabase
      .from('products')
      .update({
        is_active: true,
        stock_status: 'in',
        available_portions: 50,
        modifier_groups: [
          'b0000b20-0000-4000-a000-000000000002', // Entrada Incluida
          'b0000b20-0000-4000-a000-000000000001', // Bebida de la Casa Incluida
          'b0000c20-0000-4000-a000-000000000002'  // Queso & Adiciones para tu Pasta
        ],
        updated_at: new Date().toISOString()
      })
      .eq('id', bolonesaId)
      .select();

    if (bolonesaErr) throw bolonesaErr;

    // 3. Sincronizar location_product_status para la sede principal
    await supabase
      .from('location_product_status')
      .upsert([
        {
          location_id: locationId,
          product_id: frijoladaId,
          is_active: true,
          stock_status: 'in',
          available_portions: 50,
          updated_at: new Date().toISOString()
        },
        {
          location_id: locationId,
          product_id: bolonesaId,
          is_active: true,
          stock_status: 'in',
          available_portions: 50,
          updated_at: new Date().toISOString()
        }
      ], { onConflict: 'location_id,product_id' });

    // 4. Actualizar bento_del_dia_config en restaurant_settings
    // Frijolada como Bento Principal del Día ($19.000 promo / $22.000 normal)
    // Espagueti a la Boloñesa como 2do Bento del Día ($19.000 promo / $26.000 normal)
    const { data: rsRows, error: rsErr } = await supabase
      .from('restaurant_settings')
      .select('id, brand_id, location_id, brand_concepts')
      .eq('brand_id', brandId);

    if (rsErr) throw rsErr;

    const primaryRow = (rsRows || []).find(r => !r.location_id) || (rsRows || [])[0] || null;
    const existingConcepts = Array.isArray(primaryRow?.brand_concepts) ? primaryRow.brand_concepts : [];
    const currentDaily = existingConcepts.find(c => c && (c.id === 'bento_del_dia_config' || c.id === 'daily_special_config')) || {};

    const updatedCustomPrices = {
      ...(currentDaily.custom_prices || {}),
      [frijoladaId]: {
        promo_price: 19000,
        standard_price: 22000
      },
      [bolonesaId]: {
        promo_price: 19000,
        standard_price: 26000
      }
    };

    const nextDailyConcept = {
      ...currentDaily,
      id: 'bento_del_dia_config',
      label: 'El Bento del Día',
      enabled: true,
      promo_price: 19000,
      standard_price: 22000,
      manual_override_product_id: frijoladaId,
      secondary_product_ids: [bolonesaId],
      custom_prices: updatedCustomPrices,
      schedule: {
        ...(currentDaily.schedule || {}),
        '1': frijoladaId
      },
      secondary_schedule: {
        ...(currentDaily.secondary_schedule || {}),
        '1': [bolonesaId]
      },
      soup_name: 'Sopita del Día (16 oz)',
      drink_name: 'Jugo del Día (5 oz)',
      updated_at: new Date().toISOString()
    };

    if (rsRows && rsRows.length > 0) {
      await Promise.all(
        rsRows.map(row => {
          const rowConcepts = Array.isArray(row.brand_concepts) ? row.brand_concepts : [];
          const filtered = rowConcepts.filter(c => c && c.id !== 'bento_del_dia_config' && c.id !== 'daily_special_config');
          return supabase
            .from('restaurant_settings')
            .update({
              brand_concepts: [...filtered, nextDailyConcept],
              updated_at: new Date().toISOString()
            })
            .eq('id', row.id);
        })
      );
    }

    // 5. Actualizar home_settings para que la portada muestre el Bento Frijolada de hoy
    await supabase
      .from('home_settings')
      .update({
        hero_h1: '🍱 Bento del Día: Bento Frijolada de la Casa ($19.000)',
        hero_subtitle: 'Arroz blanco, proteína al wok con ajonjolí, huevo frito, maduritos dorados y aguacate. 🍲 Incluye Frijolada casera (16 oz) o Fruta + 🥤 Jugo del Día.',
        featured_items: [
          {
            img: 'https://aluna-qrmenu.vercel.app/img/products/boku-frijolada.jpg',
            name: 'Bento Frijolada de la Casa',
            price: 19000,
            product_id: frijoladaId
          }
        ],
        updated_at: new Date().toISOString()
      })
      .eq('brand_id', brandId);

    // 6. Actualizar el producto destacado de la categoría BOKU Bentos Caseros
    const { data: catRow } = await supabase
      .from('categories')
      .select('visibility_config')
      .eq('id', catBentosId)
      .single();

    if (catRow) {
      await supabase
        .from('categories')
        .update({
          visibility_config: {
            ...(catRow.visibility_config || {}),
            hero_featured_product_id: frijoladaId
          }
        })
        .eq('id', catBentosId);
    }

    return res.status(200).json({
      success: true,
      hasServiceKey: Boolean(SUPABASE_SERVICE_KEY),
      frijolada: upsertedFrijolada,
      bolonesa: updatedBolonesa,
      dailySpecialConfig: nextDailyConcept,
      message: 'Bento Frijolada de la Casa creado desde cero y configurado junto con Espagueti a la Boloñesa como Bentos del Día.'
    });
  } catch (err) {
    console.error('Error setting today lunch:', err);
    return res.status(500).json({ error: err.message });
  }
}
