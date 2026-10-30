import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://gqjfjtzsdpslwffbqqyw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { brandSlug = 'boku-bento' } = req.body || {};

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY);

    // Obtener marca
    const { data: brand } = await supabase
      .from('brands')
      .select('id, name')
      .eq('slug', brandSlug)
      .single();

    if (!brand) {
      return res.status(404).json({ error: 'Marca no encontrada' });
    }

    // Borrar eventos de analytics anteriores a este momento
    const now = new Date().toISOString();
    const { error: deleteError, count } = await supabase
      .from('analytics_events')
      .delete({ count: 'exact' })
      .eq('brand_id', brand.id)
      .lte('created_at', now);

    if (deleteError) {
      throw deleteError;
    }

    return res.status(200).json({ 
      success: true, 
      message: `Se limpiaron los eventos de prueba de ${brand.name}`, 
      deletedCount: count 
    });
  } catch (error) {
    console.error('Error clearing test analytics:', error);
    return res.status(500).json({ error: 'Error limpiando eventos', details: error.message });
  }
}
