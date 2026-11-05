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
    const deadRowId = '295ef671-1fa8-4b15-9691-cf19f2311649';
    const mestizoId = 'b0000b14-0000-4000-a000-000000000004';
    const mazorcadaId = 'b0000b22-0000-4000-a000-000000000022';

    // 1. Delete dead orphan row if exists
    const { error: delErr } = await supabase
      .from('restaurant_settings')
      .delete()
      .eq('id', deadRowId);
    if (delErr) console.warn('Could not delete dead row:', delErr);

    // 2. Fetch remaining settings rows for Boku Bento
    const { data: rsRows, error: fetchErr } = await supabase
      .from('restaurant_settings')
      .select('id, location_id, brand_concepts')
      .eq('brand_id', brandId);

    if (fetchErr) throw fetchErr;

    const bentoConcept = {
      id: 'bento_del_dia_config',
      label: 'El Bento del Día',
      enabled: true,
      promo_price: 19000,
      standard_price: 22000,
      manual_override_product_id: mestizoId,
      secondary_product_ids: [mazorcadaId],
      schedule: {
        "0": null,
        "1": "b0000b11-0000-4000-a000-000000000001",
        "2": "b0000b12-0000-4000-a000-000000000002",
        "3": "b0000b14-0000-4000-a000-000000000004",
        "4": "b0000b14-0000-4000-a000-000000000004",
        "5": null,
        "6": null
      },
      secondary_schedule: {
        "4": [mazorcadaId]
      },
      soup_name: '🥣 Crema de plátano colicero (16 oz)',
      drink_name: '🥤 Jugo del Día (5 oz)',
      updated_at: new Date().toISOString()
    };

    // Update each remaining row
    const updateResults = [];
    for (const row of (rsRows || [])) {
      const existing = Array.isArray(row.brand_concepts) ? row.brand_concepts : [];
      const clean = existing.filter(c => c && c.id !== 'bento_del_dia_config' && c.id !== 'daily_special_config');
      clean.push(bentoConcept);

      const { data: updData, error: updErr } = await supabase
        .from('restaurant_settings')
        .update({
          brand_concepts: clean,
          updated_at: new Date().toISOString()
        })
        .eq('id', row.id)
        .select();

      if (updErr) console.error('Error updating row', row.id, updErr);
      else updateResults.push(updData);
    }

    // 3. Update home_settings hero
    const { data: homeData, error: homeErr } = await supabase
      .from('home_settings')
      .update({
        hero_h1: '🍱 Bento del Día: Bento Mestizo ($19.000)',
        hero_subtitle: 'Arroz blanco, champiñones al ajillo, brócoli al vapor, tomates cherry y ensalada cremosa. Más Opciones: Mazorcada de la Casa. 🥣 Incluye Crema de plátano colicero (16 oz) o Fruta + 🥤 Jugo del Día (5 oz).',
        updated_at: new Date().toISOString()
      })
      .eq('brand_id', brandId)
      .select();

    return res.status(200).json({
      success: true,
      hasServiceKey: Boolean(SUPABASE_SERVICE_KEY),
      deletedDeadRow: deadRowId,
      updatedSettingsRows: updateResults,
      updatedHome: homeData,
      homeError: homeErr ? homeErr.message : null,
      message: 'Configuraciones de restaurante y Menú del Día consolidados con éxito sin duplicados.'
    });
  } catch (err) {
    console.error('Error consolidating settings:', err);
    return res.status(500).json({ error: err.message });
  }
}
