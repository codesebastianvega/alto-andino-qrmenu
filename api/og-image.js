import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://gqjfjtzsdpslwffbqqyw.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxamZqdHpzZHBzbHdmZmJxcXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NDUzMDcsImV4cCI6MjA5MzUyMTMwN30.1N7h5p7zulwpjOF4kCtWHaI_f19sf1RQO2A2ao_28po';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  try {
    const slug = (req.query.slug || 'boku-bento').replace(/\.png$/i, '').replace(/\.jpg$/i, '');
    const mode = req.query.mode || '';

    const { data: brand } = await supabase
      .from('brands')
      .select('id, name, logo_url, config')
      .eq('slug', slug)
      .maybeSingle();

    if (!brand) {
      return res.redirect(302, '/favicon.png');
    }

    const { data: settingsRows } = await supabase
      .from('restaurant_settings')
      .select('logo_url')
      .eq('brand_id', brand.id);
    const settings = settingsRows?.find(s => s.logo_url) || settingsRows?.[0] || null;

    const { data: homeRows } = await supabase
      .from('home_settings')
      .select('menu_banner_img, welcome_bg_img')
      .eq('brand_id', brand.id);
    const homeSettings = homeRows?.[0] || null;

    const chosenMode = mode || brand.config?.og_image_mode || 'auto';

    let targetImageUrl = null;
    if (chosenMode === 'logo') {
      targetImageUrl = settings?.logo_url || brand.logo_url;
    } else if (chosenMode === 'banner') {
      targetImageUrl = homeSettings?.menu_banner_img || homeSettings?.welcome_bg_img;
    }

    if (!targetImageUrl) {
      targetImageUrl = brand.config?.og_image_url || settings?.logo_url || brand.logo_url || homeSettings?.menu_banner_img || homeSettings?.welcome_bg_img;
    }

    if (!targetImageUrl) {
      return res.redirect(302, '/favicon.png');
    }

    // Descargar imagen desde Supabase Storage para servir con Content-Type canónico
    const imgResponse = await fetch(targetImageUrl);
    if (!imgResponse.ok) {
      return res.redirect(302, targetImageUrl);
    }

    const arrayBuffer = await imgResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Detectar si es PNG o JPEG real a nivel de cabecera de bytes
    let contentType = 'image/png';
    if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
      contentType = 'image/jpeg';
    } else if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      contentType = 'image/png';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).send(buffer);
  } catch (err) {
    console.error('OG Image proxy error:', err);
    return res.redirect(302, '/favicon.png');
  }
}
