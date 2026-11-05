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
    const arrozId = 'b0000b21-0000-4000-a000-000000000021';

    // 1. Insert or update Arroz con Pollo Criollo as a REAL independent product
    const arrozProduct = {
      id: arrozId,
      brand_id: brandId,
      category_id: catBentosId,
      name: 'Arroz con Pollo Criollo (Especial del Día)',
      description: 'Arroz amarillo con pollo desmechado, rodajas de salchicha, verduras de la huerta, cilantro fresco y papas a la francesa crocantes. 🥣 ¡Combo completo! Incluye Crema de espinaca casera (16 oz) o Fruta + 🥤 Jugo del Día (5 oz).',
      price: 19000,
      cost: 7200,
      margin: 62.1,
      stock_status: 'in',
      stock_quantity: 50,
      image_url: '/img/products/boku-arroz-con-pollo.jpg',
      tags: ['bento', 'almuerzo', 'pollo'],
      is_active: true,
      is_addon: false,
      requires_kitchen: true,
      station: 'kitchen',
      subcategory: 'Más Opciones del Día',
      sort_order: 9,
      updated_at: new Date().toISOString()
    };

    const { data: upsertProduct, error: prodErr } = await supabase
      .from('products')
      .upsert(arrozProduct, { onConflict: 'id' })
      .select();

    if (prodErr) throw prodErr;

    // 2. Set location product status
    const { data: locStatus, error: locErr } = await supabase
      .from('location_product_status')
      .upsert({
        location_id: locationId,
        product_id: arrozId,
        is_active: true,
        stock_status: 'in',
        available_portions: 50,
        updated_at: new Date().toISOString()
      }, { onConflict: 'location_id,product_id' })
      .select();

    return res.status(200).json({
      success: true,
      hasServiceKey: Boolean(SUPABASE_SERVICE_KEY),
      product: upsertProduct,
      locationStatus: locStatus,
      message: 'Arroz con Pollo Criollo creado e insertado exitosamente en la base de datos de Supabase.'
    });
  } catch (err) {
    console.error('Error creating arroz con pollo:', err);
    return res.status(500).json({ error: err.message });
  }
}
