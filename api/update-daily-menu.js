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
    const baseUrl = 'https://aluna-qrmenu.vercel.app';

    // 1. RESTAURAR AL 100% EL BENTO TEX-MEX ORIGINAL (SIN TOCARLO NI MODIFICARLO)
    await supabase
      .from('products')
      .update({
        name: 'Bento Tex-Mex (Bowl Mexicano)',
        description: '¿Con antojo de algo diferente, fresco y lleno de sabor? Déjate tentar por nuestro Bento Tex Mex, servido sobre una base de arroz blanco aromatizado, frijoles negros, pico de gallo fresco, pimentón asado, totopos crocantes, crema agria y aguacate fresco en abanico. 🥑✨ 🍗 Elige tu proteína (bañada en salsa chipotle): Pollo a la plancha o Cerdo salteado. 🥣 ¡Viene en combo completo! Incluye Sopita de Tomate (16 oz) o Fruta + 🥤 Jugo del Día de la Casa (5 oz).',
        price: 22000,
        cost: 7262,
        margin: 66.99,
        stock_status: 'out',
        image_url: 'https://gqjfjtzsdpslwffbqqyw.supabase.co/storage/v1/object/public/products/zwktqo800ep_1792766015049.webp',
        is_active: false,
        tags: ['Lácteos', 'Proteico', 'bento', 'tex-mex'],
        modifier_groups: [
          'b0000a01-0000-4000-a000-000000000001',
          'b0000b20-0000-4000-a000-000000000002',
          'b0000b20-0000-4000-a000-000000000001',
          'b0000c40-0000-4000-a000-000000000002'
        ],
        recipe_id: 'ba000040-0000-4000-a000-000000000002',
        sort_order: 2,
        subcategory: 'Bentos Tradicionales & Fusión'
      })
      .eq('id', 'b0000b12-0000-4000-a000-000000000002');

    // 2. CREAR BIRRIA BENTO COMO UN PRODUCTO TOTALMENTE NUEVO E INDEPENDIENTE
    const birriaId = 'b0000b19-0000-4000-a000-000000000019';
    const { data: existingBirria } = await supabase
      .from('products')
      .select('id')
      .eq('id', birriaId)
      .maybeSingle();

    const birriaData = {
      id: birriaId,
      brand_id: brandId,
      category_id: 'b0000c01-0000-4000-a000-000000000001',
      name: 'Birria Bento (Especial del Día)',
      price: 19000,
      description: 'Base de arroz blanco con jugosa carne desmechada en salsa de birria, picadillo fresco de cebolla y cilantro, pimentón en juliana y totopos crocantes.\n\n🥣 Todo almuerzo incluye: Sopita del Día (16 oz) o Fruta + 🥤 Jugo del Día (5 oz).',
      image_url: `${baseUrl}/brand/boku-birria-bento.webp`,
      is_active: true,
      stock_status: 'in',
      subcategory: 'El Bento del Día',
      sort_order: 2,
      tags: ['Proteico', 'bento', 'birria'],
      modifier_groups: [
        'b0000b20-0000-4000-a000-000000000002', // Sopita / Fruta
        'b0000b20-0000-4000-a000-000000000001', // Jugo del Día
        'b0000c40-0000-4000-a000-000000000002'  // Adiciones
      ]
    };

    if (existingBirria) {
      await supabase.from('products').update(birriaData).eq('id', birriaId);
    } else {
      await supabase.from('products').insert([birriaData]);
    }

    // 3. ASEGURAR QUE BENTO MESTIZO ESTÉ PERFECTO
    await supabase
      .from('products')
      .update({
        name: 'Bento Mestizo (Especial del Día)',
        price: 19000,
        description: 'Base de arroz blanco, champiñones al ajillo, brócoli al vapor, tomates cherry y ensalada criolla de remolacha y zanahoria.\n\n1. Tu proteína: Pollo al Curry Dorado o Cerdo Teriyaki.\n2. Tu principio: Garbanzos Caseros o Maduritos Melosos en Panela.\n\n🥣 Todo almuerzo incluye: Sopita del Día (16 oz) o Fruta + 🥤 Jugo del Día (5 oz).',
        image_url: `${baseUrl}/brand/boku-bento-mestizo.webp`,
        is_active: true,
        stock_status: 'in',
        subcategory: 'El Bento del Día',
        sort_order: 1
      })
      .eq('id', 'b0000b14-0000-4000-a000-000000000004');

    // 4. SINCRONIZAR LOCATION STATUS
    await supabase
      .from('location_product_status')
      .upsert([
        {
          location_id: locationId,
          product_id: birriaId,
          is_active: true,
          stock_status: 'in'
        },
        {
          location_id: locationId,
          product_id: 'b0000b14-0000-4000-a000-000000000004',
          is_active: true,
          stock_status: 'in'
        },
        {
          location_id: locationId,
          product_id: 'b0000b12-0000-4000-a000-000000000002',
          is_active: false,
          stock_status: 'out'
        }
      ], { onConflict: 'location_id,product_id' });

    // 5. ACTUALIZAR MODIFICADORES DE SOPA: "Sopita del Día (16 oz)"
    await supabase
      .from('modifier_options')
      .update({
        name: '🥣 Sopita del Día (16 oz)'
      })
      .eq('id', 'b0000b22-0000-4000-a000-000000000002');

    await supabase
      .from('modifier_groups')
      .update({
        description: 'Sopita del Día (16 oz) o Fruta Fresca'
      })
      .eq('id', 'b0000b20-0000-4000-a000-000000000002');

    // 6. ACTUALIZAR HOME SETTINGS (PORTADA, HERO SUBTITLE Y DESTACADOS)
    const homeUpdate = {
      hero_h1: "🔥 ¡El almuerzo de hoy está listo en BOKU BENTO! 🔥",
      hero_subtitle: "Dos platos contundentes, frescos y con toda la sazón de la casa por $19.000 c/u: Bento Mestizo (Pollo al Curry Dorado o Cerdo Teriyaki con Champiñones y Brócoli) o Birria Bento (Carne desmechada en salsa de birria con totopos y picadillo). 🥣 Todo almuerzo incluye: Sopita del Día (16 oz) o Fruta + 🥤 Jugo del Día (5 oz).",
      hero_images: [
        {
          img: `${baseUrl}/brand/boku-bento-mestizo.webp`,
          name: "Bento Mestizo (Especial del Día)",
          price: 19000
        },
        {
          img: `${baseUrl}/brand/boku-birria-bento.webp`,
          name: "Birria Bento (Especial del Día)",
          price: 19000
        }
      ],
      featured_items: [
        {
          img: `${baseUrl}/brand/boku-bento-mestizo.webp`,
          name: "Bento Mestizo (Especial del Día)",
          price: 19000,
          product_id: "b0000b14-0000-4000-a000-000000000004"
        },
        {
          img: `${baseUrl}/brand/boku-birria-bento.webp`,
          name: "Birria Bento (Especial del Día)",
          price: 19000,
          product_id: birriaId
        }
      ],
      updated_at: new Date().toISOString()
    };

    const { error: homeErr } = await supabase
      .from('home_settings')
      .update(homeUpdate)
      .eq('brand_id', brandId);

    if (homeErr) {
      console.error('Error updating home_settings:', homeErr);
      return res.status(500).json({ error: homeErr.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Menú del día actualizado con éxito: Bento Mestizo y Birria Bento configurados, modificador Sopita del Día y portada home_settings actualizados.'
    });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
