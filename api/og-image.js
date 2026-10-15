import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

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
    if (chosenMode === 'banner') {
      targetImageUrl = homeSettings?.menu_banner_img || homeSettings?.welcome_bg_img || settings?.logo_url || brand.logo_url;
    } else {
      // Prioritize the actual restaurant LOGO for WhatsApp / social preview
      targetImageUrl = settings?.logo_url || brand.logo_url || brand.config?.og_image_url || homeSettings?.menu_banner_img || homeSettings?.welcome_bg_img;
    }

    if (!targetImageUrl) {
      return res.redirect(302, '/favicon.png');
    }

    // Descargar imagen desde Supabase Storage
    const imgResponse = await fetch(targetImageUrl);
    if (!imgResponse.ok) {
      return res.redirect(302, targetImageUrl);
    }

    const arrayBuffer = await imgResponse.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Convertir de forma confiable a PNG 600x600 con fondo transparente/blanco para WhatsApp
    try {
      const pngBuffer = await sharp(inputBuffer)
        .resize(600, 600, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png({ quality: 90, compressionLevel: 8 })
        .toBuffer();

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800');
      return res.status(200).send(pngBuffer);
    } catch (sharpError) {
      console.error('Sharp conversion fallback:', sharpError);
      // Fallback directo a servir el buffer original
      res.setHeader('Content-Type', 'image/png');
      return res.status(200).send(inputBuffer);
    }
  } catch (err) {
    console.error('OG Image proxy error:', err);
    return res.redirect(302, '/favicon.png');
  }
}
