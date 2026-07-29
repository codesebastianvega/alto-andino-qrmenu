import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://gqjfjtzsdpslwffbqqyw.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxamZqdHpzZHBzbHdmZmJxcXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxOTgwMTksImV4cCI6MjA1Mzc3NDAxOX0.8NqP6U8eE-Y1ZlJ2G7qRzZ_V7b2a9J';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  try {
    const rawSlug = req.query.slug || req.url.split('?')[0].replace(/^\//, '');
    const parts = rawSlug.split('/').filter(Boolean);
    const brandSlug = parts[0] && !['api', 'admin', 'login', 'register', 'assets'].includes(parts[0]) ? parts[0] : null;

    let title = 'Menú Digital Interactivo';
    let description = 'Explora la carta digital, realiza tus pedidos y vive experiencias únicas.';
    let logo = 'https://aluna-qrmenu.vercel.app/favicon.png';
    let pageUrl = `https://aluna-qrmenu.vercel.app/${brandSlug || ''}`;

    if (brandSlug) {
      const { data: brand } = await supabase
        .from('brands')
        .select('id, name, description, logo_url')
        .eq('slug', brandSlug)
        .maybeSingle();

      if (brand) {
        const { data: settings } = await supabase
          .from('restaurant_settings')
          .select('business_name, logo_url')
          .eq('brand_id', brand.id)
          .maybeSingle();

        const { data: homeSettings } = await supabase
          .from('home_settings')
          .select('hero_subtitle')
          .eq('brand_id', brand.id)
          .maybeSingle();

        title = `${settings?.business_name || brand.name} | Menú Digital`;
        description = homeSettings?.hero_subtitle || brand.description || 'Menú Digital Interactivo. Revisa nuestra carta, opciones saludables y realiza tu pedido.';
        logo = settings?.logo_url || brand.logo_url || 'https://aluna-qrmenu.vercel.app/favicon.png';
      }
    }

    const html = `<!doctype html>
<html lang="es-CO">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${logo}" />
  <meta property="og:image:secure_url" content="${logo}" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${logo}" />
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(html);
  } catch (err) {
    console.error('OG Handler Error:', err);
    return res.status(500).send('Error loading preview');
  }
}
