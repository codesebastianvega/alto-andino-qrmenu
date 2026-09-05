import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://gqjfjtzsdpslwffbqqyw.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxamZqdHpzZHBzbHdmZmJxcXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NDUzMDcsImV4cCI6MjA5MzUyMTMwN30.1N7h5p7zulwpjOF4kCtWHaI_f19sf1RQO2A2ao_28po';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default async function handler(req, res) {
  try {
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'aluna-qrmenu.vercel.app';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${host}`;

    // Extraer slug seguro tanto si viene como array (Vercel) como string
    const slugParam = Array.isArray(req.query.slug) ? req.query.slug.join('/') : (req.query.slug || '');
    const rawSlug = slugParam || (req.url ? req.url.split('?')[0].replace(/^\//, '') : '');
    const parts = rawSlug.split('/').filter(Boolean);
    const brandSlug = parts[0] && !['api', 'admin', 'login', 'register', 'assets', 'favicon.ico', 'favicon.png'].includes(parts[0]) ? parts[0] : null;

    let title = 'Aluna | Menús Digitales Premium';
    let siteName = 'Aluna';
    let description = 'Diseñando espacios digitales gastronómicos que inspiran. Menús interactivos, pedidos fluidos y experiencias únicas.';
    let logo = `${baseUrl}/favicon.png`;
    let pageUrl = baseUrl;

    if (brandSlug) {
      const { data: brand } = await supabase
        .from('brands')
        .select('id, name, description, logo_url')
        .eq('slug', brandSlug)
        .maybeSingle();

      if (brand) {
        // Consultar configuraciones del restaurante (soporta múltiples sedes sin romper maybeSingle)
        const { data: settingsRows } = await supabase
          .from('restaurant_settings')
          .select('business_name, logo_url')
          .eq('brand_id', brand.id);

        const settings = settingsRows?.find(s => s.logo_url) || settingsRows?.[0] || null;

        const { data: homeRows } = await supabase
          .from('home_settings')
          .select('hero_subtitle, menu_banner_img, welcome_bg_img')
          .eq('brand_id', brand.id);

        const homeSettings = homeRows?.[0] || null;

        const rawName = (settings?.business_name && settings.business_name !== 'Alto Andino' ? settings.business_name : null) || brand.name;
        siteName = rawName || 'Aluna';
        title = `${siteName} | Menú Digital`;
        description = homeSettings?.hero_subtitle || brand.description || 'Explora nuestra carta digital, opciones saludables y realiza tu pedido.';
        
        const rawLogo = settings?.logo_url || brand.logo_url || homeSettings?.menu_banner_img;
        if (rawLogo) {
          logo = rawLogo.startsWith('http') ? rawLogo : `${baseUrl}/${rawLogo.replace(/^\//, '')}`;
        }
        pageUrl = `${baseUrl}/${brandSlug}`;
      }
    }

    const html = `<!doctype html>
<html lang="es-CO" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />

  <!-- Open Graph / WhatsApp / Facebook -->
  <meta property="og:site_name" content="${escapeHtml(siteName)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(pageUrl)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(logo)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(logo)}" />
  <meta property="og:image:width" content="600" />
  <meta property="og:image:height" content="600" />
  <meta property="og:image:alt" content="${escapeHtml(title)}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(logo)}" />
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(description)}</p>
  <img src="${escapeHtml(logo)}" alt="${escapeHtml(title)}" style="max-width:300px;" />
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(html);
  } catch (err) {
    console.error('OG Handler Error:', err);
    return res.status(500).send('Error loading preview');
  }
}
