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
    const pastaId = 'b0000b16-0000-4000-a000-000000000006';
    const catPastasId = 'b0000c03-0000-4000-a000-000000000003'; // BOKU Pastas & Ramen
    const locationId = '48be7326-6355-481b-b334-b7edc4b82e6f';

    // 1. Move Pasta Alfredo to its REAL category and set its REAL uploaded photo
    const { data: updatedPasta, error: pastaErr } = await supabase
      .from('products')
      .update({
        category_id: catPastasId,
        image_url: '/img/products/boku-pasta-alfredo.jpg',
        price: 26000,
        cost: 5800,
        margin: 77.69,
        stock_status: 'in',
        is_active: true,
        subcategory: 'Pastas Artesanales',
        description: 'Tornillos al dente en salsa cremosa Alfredo con pechuga salteada, champiñones frescos, queso parmesano y un toque de cilantro.',
        tags: ['Pasta', 'Alfredo', 'Pollo', 'Champiñones'],
        updated_at: new Date().toISOString()
      })
      .eq('id', pastaId)
      .select();

    if (pastaErr) throw pastaErr;

    // 2. Ensure location status is in stock
    const { data: locStatus, error: locErr } = await supabase
      .from('location_product_status')
      .upsert({
        location_id: locationId,
        product_id: pastaId,
        is_active: true,
        stock_status: 'in',
        available_portions: 50,
        updated_at: new Date().toISOString()
      }, { onConflict: 'location_id,product_id' })
      .select();

    return res.status(200).json({
      success: true,
      hasServiceKey: Boolean(SUPABASE_SERVICE_KEY),
      pasta: updatedPasta,
      locationStatus: locStatus,
      message: 'Pasta Alfredo trasladada correctamente a BOKU Pastas & Ramen con su foto real y precio regular.'
    });
  } catch (err) {
    console.error('Error fixing catalog:', err);
    return res.status(500).json({ error: err.message });
  }
}
