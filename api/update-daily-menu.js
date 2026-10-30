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
    const now = new Date().toISOString();

    const baseUrl = 'https://aluna-qrmenu.vercel.app';

    // 1. MODIFIER GROUP: Tu Proteína (Curry Dorado o Cerdo Teriyaki)
    await supabase
      .from('modifier_groups')
      .update({
        name: '🍗 Tu Proteína',
        description: 'Elige tu proteína: Pollo al Curry Dorado o Cerdo Teriyaki',
        is_required: true,
        min_select: 1,
        max_select: 1
      })
      .eq('id', 'b0000a01-0000-4000-a000-000000000001');

    await supabase
      .from('modifier_options')
      .update({
        name: '🍗 Pollo al Curry Dorado',
        price: 0,
        is_active: true,
        sort_order: 1
      })
      .eq('id', 'b0000a01-0001-4000-a000-000000000001');

    await supabase
      .from('modifier_options')
      .update({
        name: '🥩 Cerdo Teriyaki',
        price: 0,
        is_active: true,
        sort_order: 2
      })
      .eq('id', 'b0000a01-0001-4000-a000-000000000002');

    // 2. MODIFIER GROUP: Tu Principio (Garbanzos o Maduritos Melosos)
    await supabase
      .from('modifier_groups')
      .update({
        name: '🥘 Tu Principio',
        description: 'Garbanzos Caseros o Maduritos Melosos en Panela',
        is_required: true,
        min_select: 1,
        max_select: 1
      })
      .eq('id', 'b0000a02-0000-4000-a000-000000000002');

    await supabase
      .from('modifier_options')
      .update({
        name: '🍲 Garbanzos Caseros',
        price: 0,
        is_active: true,
        sort_order: 1
      })
      .eq('id', 'b0000a02-0001-4000-a000-000000000001');

    await supabase
      .from('modifier_options')
      .update({
        name: '🍌 Maduritos Melosos en Panela',
        price: 0,
        is_active: true,
        sort_order: 2
      })
      .eq('id', 'b0000a02-0001-4000-a000-000000000002');

    // 3. MODIFIER GROUP: Sopita de Colicero (16 oz) o Fruta
    await supabase
      .from('modifier_groups')
      .update({
        name: '🥣 Entrada Incluida',
        description: 'Sopita de Colicero (16 oz) o Fruta Fresca',
        is_required: true,
        min_select: 1,
        max_select: 1
      })
      .eq('id', 'b0000b20-0000-4000-a000-000000000002');

    await supabase
      .from('modifier_options')
      .update({
        name: '🥣 Sopita de Colicero (16 oz)',
        price: 0,
        is_active: true,
        sort_order: 1
      })
      .eq('id', 'b0000b22-0000-4000-a000-000000000002');

    await supabase
      .from('modifier_options')
      .update({
        name: '🍉 Cambiar por Fruta Fresca',
        price: 0,
        is_active: true,
        sort_order: 2
      })
      .eq('id', 'b0000b22-0000-4000-a000-000000000004');

    // 4. MODIFIER GROUP: Bebida de la casa (Jugo del Día 5 oz)
    await supabase
      .from('modifier_options')
      .update({
        name: '🥤 Jugo del Día (5 oz)',
        price: 0,
        is_active: true,
        sort_order: 1
      })
      .eq('id', 'b0000b21-0000-4000-a000-000000000001');

    // 5. PRODUCTO 1: Bento Mestizo (Especial del Día)
    const mestizoDesc = 'Base de arroz blanco, champiñones al ajillo, brócoli al vapor, tomates cherry y ensalada criolla de remolacha y zanahoria.\n\n1. Tu proteína: Pollo al Curry Dorado o Cerdo Teriyaki.\n2. Tu principio: Garbanzos Caseros o Maduritos Melosos en Panela.\n\n🥣 Todo almuerzo incluye: Sopita de Colicero (16 oz) o Fruta + 🥤 Jugo del Día (5 oz).';

    await supabase
      .from('products')
      .update({
        name: 'Bento Mestizo (Especial del Día)',
        price: 19000,
        description: mestizoDesc,
        image_url: `${baseUrl}/brand/boku-bento-mestizo.webp`,
        is_active: true,
        stock_status: 'in',
        subcategory: 'El Bento del Día',
        sort_order: 1,
        modifier_groups: [
          'b0000a01-0000-4000-a000-000000000001', // Proteína
          'b0000a02-0000-4000-a000-000000000002', // Principio
          'b0000b20-0000-4000-a000-000000000002', // Sopita / Fruta
          'b0000b20-0000-4000-a000-000000000001', // Bebida
          'b0000c40-0000-4000-a000-000000000004'  // Adiciones Mestizo
        ],
        updated_at: now
      })
      .eq('id', 'b0000b14-0000-4000-a000-000000000004');

    // 6. PRODUCTO 2: Birria Bento (Especial del Día)
    const birriaDesc = 'Base de arroz blanco con jugosa carne desmechada en salsa de birria, picadillo fresco de cebolla y cilantro, pimentón en juliana y totopos crocantes.\n\n🥣 Todo almuerzo incluye: Sopita de Colicero (16 oz) o Fruta + 🥤 Jugo del Día (5 oz).';

    await supabase
      .from('products')
      .update({
        name: 'Birria Bento (Especial del Día)',
        price: 19000,
        description: birriaDesc,
        image_url: `${baseUrl}/brand/boku-birria-bento.webp`,
        is_active: true,
        stock_status: 'in',
        subcategory: 'El Bento del Día',
        sort_order: 2,
        modifier_groups: [
          'b0000b20-0000-4000-a000-000000000002', // Sopita / Fruta
          'b0000b20-0000-4000-a000-000000000001', // Bebida
          'b0000c40-0000-4000-a000-000000000002'  // Adiciones Texmex/Birria
        ],
        updated_at: now
      })
      .eq('id', 'b0000b12-0000-4000-a000-000000000002');

    // 7. DESACTIVAR OTROS BENTOS ANTERIORES PARA DEJAR SOLO ESTOS DOS ESPECIALES DEL DÍA
    const otherBentoIds = [
      'b0000b11-0000-4000-a000-000000000001', // Paisa
      'b0000b13-0000-4000-a000-000000000003', // Bogotano
      'b0000b15-0000-4000-a000-000000000005', // Urodaki
      'b0000b16-0000-4000-a000-000000000006'  // Tornillos Alfredo
    ];

    await supabase
      .from('products')
      .update({ is_active: false, updated_at: now })
      .in('id', otherBentoIds);

    // 8. SINCRONIZAR LOCATION_PRODUCT_STATUS
    await supabase
      .from('location_product_status')
      .update({ is_active: true, stock_status: 'in', updated_at: now })
      .eq('location_id', locationId)
      .in('product_id', [
        'b0000b14-0000-4000-a000-000000000004',
        'b0000b12-0000-4000-a000-000000000002'
      ]);

    await supabase
      .from('location_product_status')
      .update({ is_active: false, updated_at: now })
      .eq('location_id', locationId)
      .in('product_id', otherBentoIds);

    return res.status(200).json({
      success: true,
      message: 'Menú del día actualizado con éxito en Boku Bento',
      dishes: [
        { name: 'Bento Mestizo (Especial del Día)', price: 19000, active: true },
        { name: 'Birria Bento (Especial del Día)', price: 19000, active: true }
      ]
    });
  } catch (err) {
    console.error('Error updating daily menu:', err);
    return res.status(500).json({ error: err.message });
  }
}
