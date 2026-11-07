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
    const brandId = req.body?.brandId || req.query?.brandId || 'a63da806-a62a-49b9-a833-07e0976785ad';
    const financials = req.body?.financials || null;

    if (!financials && req.method === 'POST') {
      return res.status(400).json({ error: 'Missing financials payload' });
    }

    // 1. GET: Retornar configuración financiera persistida
    if (req.method === 'GET' && !financials) {
      // Buscar primero en restaurant_settings
      const { data: settings } = await supabase
        .from('restaurant_settings')
        .select('brand_concepts')
        .eq('brand_id', brandId)
        .single();

      const concepts = Array.isArray(settings?.brand_concepts) ? settings.brand_concepts : [];
      const finConcept = concepts.find(c => c && c.id === 'financials_config');
      if (finConcept?.data) {
        return res.status(200).json({ success: true, source: 'restaurant_settings', financials: finConcept.data });
      }

      // Buscar en brands.config
      const { data: brand } = await supabase
        .from('brands')
        .select('config')
        .eq('id', brandId)
        .single();

      return res.status(200).json({
        success: true,
        source: 'brands_config',
        financials: brand?.config?.financials || null
      });
    }

    // 2. POST: Persistir con SERVICE ROLE en ambas tablas
    // A) En restaurant_settings.brand_concepts
    const { data: settings } = await supabase
      .from('restaurant_settings')
      .select('id, brand_concepts')
      .eq('brand_id', brandId)
      .single();

    if (settings) {
      let concepts = Array.isArray(settings.brand_concepts) ? [...settings.brand_concepts] : [];
      const idx = concepts.findIndex(c => c && c.id === 'financials_config');
      const finConcept = {
        id: 'financials_config',
        updated_at: new Date().toISOString(),
        data: financials
      };

      if (idx >= 0) {
        concepts[idx] = finConcept;
      } else {
        concepts.push(finConcept);
      }

      await supabase
        .from('restaurant_settings')
        .update({
          brand_concepts: concepts,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);
    }

    // B) En brands.config.financials
    const { data: brand } = await supabase
      .from('brands')
      .select('id, config')
      .eq('id', brandId)
      .single();

    if (brand) {
      await supabase
        .from('brands')
        .update({
          config: {
            ...(brand.config || {}),
            financials
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', brand.id);
    }

    return res.status(200).json({
      success: true,
      hasServiceKey: Boolean(SUPABASE_SERVICE_KEY),
      message: 'Finanzas persistidas con éxito en Postgres (restaurant_settings y brands.config)'
    });
  } catch (err) {
    console.error('Error saving financials:', err);
    return res.status(500).json({ error: err.message });
  }
}
