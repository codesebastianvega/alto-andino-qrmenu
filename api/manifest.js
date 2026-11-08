import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://gqjfjtzsdpslwffbqqyw.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxamZqdHpzZHBzbHdmZmJxcXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NDUzMDcsImV4cCI6MjA5MzUyMTMwN30.1N7h5p7zulwpjOF4kCtWHaI_f19sf1RQO2A2ao_28po';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  try {
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'aluna-qrmenu.vercel.app';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${host}`;

    const slugParam = req.query.slug || req.query.brand || '';
    const brandSlug = typeof slugParam === 'string' ? slugParam.trim().toLowerCase() : '';

    let brandName = 'Aluna';
    let brandShortName = 'Aluna';
    let brandDescription = 'Menús digitales interactivos para restaurantes y comercios gastronómicos';
    let themeColor = '#0A0A0A';
    let startUrl = '/';
    let brandLogo = null;

    if (brandSlug && brandSlug !== 'aluna') {
      const { data: brand } = await supabase
        .from('brands')
        .select('id, name, slug, logo_url, description')
        .eq('slug', brandSlug)
        .maybeSingle();

      if (brand) {
        brandName = brand.name || 'Aluna';
        brandShortName = brand.name || 'Aluna';
        brandLogo = brand.logo_url || null;
        startUrl = `/${brand.slug}/`;

        const { data: settingsRows } = await supabase
          .from('restaurant_settings')
          .select('business_name, logo_url, primary_color')
          .eq('brand_id', brand.id);

        const settings = settingsRows?.find(s => s.logo_url) || settingsRows?.[0] || null;
        if (settings) {
          if (settings.business_name && settings.business_name !== 'Alto Andino') {
            brandName = settings.business_name;
            brandShortName = settings.business_name;
          }
          if (settings.logo_url) brandLogo = settings.logo_url;
          if (settings.primary_color) themeColor = settings.primary_color;
        }

        brandDescription = brand.description || `Menú digital y pedidos para ${brandName}`;
      }
    }

    const icons = [
      {
        src: `${baseUrl}/icon-192.png`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: `${baseUrl}/icon-512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: `${baseUrl}/icon-maskable-512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ];

    if (brandLogo && /^https?:\/\//i.test(brandLogo)) {
      icons.unshift({
        src: brandLogo,
        sizes: '192x192 512x512',
        type: 'image/png',
        purpose: 'any'
      });
    }

    const manifest = {
      name: brandName,
      short_name: brandShortName,
      description: brandDescription,
      start_url: startUrl,
      scope: '/',
      display: 'standalone',
      orientation: 'any',
      background_color: themeColor,
      theme_color: themeColor,
      icons
    };

    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(manifest);
  } catch (err) {
    console.error('Error generating dynamic manifest:', err);
    // Fallback básico
    return res.status(200).json({
      name: 'Aluna | Menús Digitales',
      short_name: 'Aluna',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#0A0A0A',
      theme_color: '#0A0A0A',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    });
  }
}
