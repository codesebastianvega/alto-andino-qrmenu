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
    const mestizoId = 'b0000b14-0000-4000-a000-000000000004';
    const mazorcadaId = 'b0000b22-0000-4000-a000-000000000022';

    // 1. Bento Mestizo -> El Bento del Día ($19.000)
    const { data: updatedMestizo, error: mestizoErr } = await supabase
      .from('products')
      .update({
        name: 'Bento Mestizo (Especial del Día)',
        description: 'Arroz blanco, champiñones al ajillo, brócoli al vapor, tomates cherry y ensalada cremosa de remolacha y zanahoria en cubitos con mayonesa. Principio a elección (garbanzos caseros o maduritos melosos) y proteína a elección (pollo al curry dorado o cerdo teriyaki). 🥣 ¡Combo completo! Incluye Crema de plátano colicero (16 oz) o Fruta + 🥤 Jugo del Día (5 oz).',
        price: 19000,
        cost: 7583,
        margin: 60.09,
        stock_status: 'in',
        is_active: true,
        subcategory: 'El Bento del Día',
        updated_at: new Date().toISOString()
      })
      .eq('id', mestizoId)
      .select();

    if (mestizoErr) console.error('Error updating mestizo:', mestizoErr);

    // 2. Mazorcada de la Casa -> Más Opciones del Día ($19.000)
    const mazorcadaProduct = {
      id: mazorcadaId,
      brand_id: brandId,
      category_id: catBentosId,
      name: 'Mazorcada de la Casa (Especial del Día)',
      description: 'Maíz tierno dulce con jamón, salchicha, queso fundido y papita cabello de ángel crocante. Proteína a elección (pollo o cerdo al wok), salsa a elección (BBQ o tártara) y pimentón salteado opcional. 🥣 ¡Combo completo! Incluye Crema de plátano colicero (16 oz) o Fruta + 🥤 Jugo del Día (5 oz).',
      price: 19000,
      cost: 6900,
      margin: 63.68,
      stock_status: 'in',
      stock_quantity: 50,
      image_url: '/img/products/boku-mazorcada.jpg',
      tags: ['bento', 'almuerzo', 'mazorcada', 'maiz'],
      is_active: true,
      is_addon: false,
      requires_kitchen: true,
      station: 'kitchen',
      subcategory: 'Más Opciones del Día',
      sort_order: 10,
      updated_at: new Date().toISOString()
    };

    const { data: upsertMazorcada, error: mazErr } = await supabase
      .from('products')
      .upsert(mazorcadaProduct, { onConflict: 'id' })
      .select();

    if (mazErr) throw mazErr;

    // 3. Location statuses
    await supabase.from('location_product_status').upsert([
      {
        location_id: locationId,
        product_id: mestizoId,
        is_active: true,
        stock_status: 'in',
        available_portions: 50,
        updated_at: new Date().toISOString()
      },
      {
        location_id: locationId,
        product_id: mazorcadaId,
        is_active: true,
        stock_status: 'in',
        available_portions: 50,
        updated_at: new Date().toISOString()
      }
    ], { onConflict: 'location_id,product_id' });

    // 4. Update home settings hero
    await supabase
      .from('home_settings')
      .update({
        hero_h1: '🍱 Bento del Día: Bento Mestizo ($19.000)',
        hero_subtitle: 'Arroz blanco, champiñones al ajillo, brócoli, tomates cherry, ensalada cremosa de remolacha y zanahoria. 🥣 Incluye Crema de plátano colicero (16 oz) o Fruta + 🥤 Jugo.',
        bento_del_dia_id: mestizoId,
        bento_del_dia_enabled: true,
        bento_del_dia_price: 19000
      })
      .eq('brand_id', brandId);

    // 5. Update soup option if exists
    await supabase
      .from('modifier_options')
      .update({ name: '🥣 Crema de plátano colicero (16 oz)' })
      .ilike('name', '%crema%');

    return res.status(200).json({
      success: true,
      hasServiceKey: Boolean(SUPABASE_SERVICE_KEY),
      mestizo: updatedMestizo,
      mazorcada: upsertMazorcada,
      message: 'Bento Mestizo y Mazorcada de la Casa configurados con éxito en la base de datos de Supabase.'
    });
  } catch (err) {
    console.error('Error setting today lunch:', err);
    return res.status(500).json({ error: err.message });
  }
}
