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

    // 2. CREAR / ACTUALIZAR GRUPOS DE MODIFICADORES PARA EL BENTO HAWAIANO (UUID VÁLIDOS)
    const hawaianoModifierGroups = [
      {
        id: 'b0000a11-0000-4000-a000-000000000001',
        brand_id: brandId,
        name: '🍚 1. Elige tu Base',
        description: 'Arroz blanco suelto, 50/50 o 100% verdes',
        is_required: true,
        min_select: 1,
        max_select: 1,
        allow_quantity: false
      },
      {
        id: 'b0000a11-0000-4000-a000-000000000002',
        brand_id: brandId,
        name: '🍗 2. Elige tu Proteína',
        description: 'Pollo salteado jugoso o Cerdo salteado en su punto',
        is_required: true,
        min_select: 1,
        max_select: 1,
        allow_quantity: false
      },
      {
        id: 'b0000a11-0000-4000-a000-000000000003',
        brand_id: brandId,
        name: '🍍 3. Tu Toque Tropical',
        description: 'Piña fresca o Mango dulce en cubos',
        is_required: true,
        min_select: 1,
        max_select: 1,
        allow_quantity: false
      },
      {
        id: 'b0000a11-0000-4000-a000-000000000004',
        brand_id: brandId,
        name: '🥑 4. El Infaltable Cremoso',
        description: 'Aguacate fresco en abanico o Guacamole casero',
        is_required: true,
        min_select: 1,
        max_select: 1,
        allow_quantity: false
      }
    ];

    for (const group of hawaianoModifierGroups) {
      const { error: gErr } = await supabase.from('modifier_groups').upsert(group, { onConflict: 'id' });
      if (gErr) console.error('Error upserting group:', group.name, gErr);
    }

    // 3. OPCIONES DE MODIFICADORES PARA EL BENTO HAWAIANO (UUID VÁLIDOS)
    const hawaianoOptions = [
      // Bases
      {
        id: 'b0000a12-0001-4000-a000-000000000001',
        group_id: 'b0000a11-0000-4000-a000-000000000001',
        name: '🍚 Arroz blanco suelto',
        price: 0,
        sort_order: 1,
        is_active: true,
        stock_status: 'in'
      },
      {
        id: 'b0000a12-0001-4000-a000-000000000002',
        group_id: 'b0000a11-0000-4000-a000-000000000001',
        name: '🥗 50/50 (Mitad arroz y mitad mix de lechugas)',
        price: 0,
        sort_order: 2,
        is_active: true,
        stock_status: 'in'
      },
      {
        id: 'b0000a12-0001-4000-a000-000000000003',
        group_id: 'b0000a11-0000-4000-a000-000000000001',
        name: '🥬 100% Base de verdes (Mix de lechugas)',
        price: 0,
        sort_order: 3,
        is_active: true,
        stock_status: 'in'
      },
      // Proteínas
      {
        id: 'b0000a12-0002-4000-a000-000000000001',
        group_id: 'b0000a11-0000-4000-a000-000000000002',
        name: '🍗 Pollo salteado jugoso',
        price: 0,
        sort_order: 1,
        is_active: true,
        stock_status: 'in'
      },
      {
        id: 'b0000a12-0002-4000-a000-000000000002',
        group_id: 'b0000a11-0000-4000-a000-000000000002',
        name: '🥩 Cerdo salteado en su punto',
        price: 0,
        sort_order: 2,
        is_active: true,
        stock_status: 'in'
      },
      // Tropical
      {
        id: 'b0000a12-0003-4000-a000-000000000001',
        group_id: 'b0000a11-0000-4000-a000-000000000003',
        name: '🍍 Piña fresca en cubos',
        price: 0,
        sort_order: 1,
        is_active: true,
        stock_status: 'in'
      },
      {
        id: 'b0000a12-0003-4000-a000-000000000002',
        group_id: 'b0000a11-0000-4000-a000-000000000003',
        name: '🥭 Mango dulce en cubos',
        price: 0,
        sort_order: 2,
        is_active: true,
        stock_status: 'in'
      },
      // Cremoso
      {
        id: 'b0000a12-0004-4000-a000-000000000001',
        group_id: 'b0000a11-0000-4000-a000-000000000004',
        name: '🥑 Aguacate fresco en abanico',
        price: 0,
        sort_order: 1,
        is_active: true,
        stock_status: 'in'
      },
      {
        id: 'b0000a12-0004-4000-a000-000000000002',
        group_id: 'b0000a11-0000-4000-a000-000000000004',
        name: '🥑 Guacamole casero',
        price: 0,
        sort_order: 2,
        is_active: true,
        stock_status: 'in'
      }
    ];

    for (const opt of hawaianoOptions) {
      const { error: oErr } = await supabase.from('modifier_options').upsert(opt, { onConflict: 'id' });
      if (oErr) console.error('Error upserting option:', opt.name, oErr);
    }

    // 4. ACTUALIZAR MODIFICADOR DE SOPA INCLUIDA: "🥣 Crema de Espinaca casera (16 oz)"
    await supabase
      .from('modifier_options')
      .update({
        name: '🥣 Crema de Espinaca casera (16 oz)'
      })
      .eq('id', 'b0000b22-0000-4000-a000-000000000002');

    await supabase
      .from('modifier_groups')
      .update({
        description: 'Crema de Espinaca casera (16 oz) o Fruta fresca'
      })
      .eq('id', 'b0000b20-0000-4000-a000-000000000002');

    // 5. CREAR / ACTUALIZAR BENTO HAWAIANO (ESPECIAL DE HOY SÁBADO)
    const hawaianoId = 'b0000b19-0000-4000-a000-000000000020';
    const hawaianoData = {
      id: hawaianoId,
      brand_id: brandId,
      category_id: 'b0000c01-0000-4000-a000-000000000001',
      name: 'Bento Hawaiano (Ármalo a tu gusto)',
      price: 19000,
      description: 'Una explosión de frescura con ingredientes en su punto:\n\n1. Elige tu base: Arroz blanco suelto, 50/50 o 100% verdes. 🥬🍚\n2. Elige tu proteína: Pollo salteado jugoso 🍗 o Cerdo salteado en su punto 🥩.\n3. Tus toppings frescos: Tomates cherry dulces, pepino fresco en rodajas, bastones de zanahoria, tu toque tropical a elección (piña o mango) y el infaltable cremoso (aguacate en abanico o guacamole). 🥑🥭\n\n🥣 ¡Viene en combo completo! Incluye Crema de Espinaca casera (16 oz) o Fruta + 🥤 Jugo del Día de la Casa (5 oz).\n\n⏰ Disponible de 11:00 AM a 5:00 PM.',
      image_url: `${baseUrl}/brand/boku-bento-hawaiano.jpg`,
      is_active: true,
      stock_status: 'in',
      subcategory: 'El Bento del Día',
      sort_order: 1,
      tags: ['Fresco', 'Proteico', 'bento', 'hawaiano'],
      modifier_groups: [
        'b0000a11-0000-4000-a000-000000000001', // Base
        'b0000a11-0000-4000-a000-000000000002', // Proteína
        'b0000a11-0000-4000-a000-000000000003', // Toque Tropical
        'b0000a11-0000-4000-a000-000000000004', // Infaltable Cremoso
        'b0000b20-0000-4000-a000-000000000002', // Entrada Incluida (Crema de Espinaca / Fruta)
        'b0000b20-0000-4000-a000-000000000001', // Bebida de la Casa Incluida
        'b0000c40-0000-4000-a000-000000000002'  // Adiciones Opcionales
      ]
    };

    const { error: pErr } = await supabase.from('products').upsert(hawaianoData, { onConflict: 'id' });
    if (pErr) console.error('Error upserting product:', pErr);

    // 6. ACTUALIZAR BIRRIA BENTO (PASARLO A SEGUNDO PLANO O INACTIVO PARA HOY)
    await supabase
      .from('products')
      .update({
        is_active: false,
        stock_status: 'out',
        sort_order: 10
      })
      .eq('id', 'b0000b19-0000-4000-a000-000000000019');

    // 7. SINCRONIZAR LOCATION PRODUCT STATUS
    await supabase
      .from('location_product_status')
      .upsert([
        {
          location_id: locationId,
          product_id: hawaianoId,
          is_active: true,
          stock_status: 'in'
        },
        {
          location_id: locationId,
          product_id: 'b0000b19-0000-4000-a000-000000000019',
          is_active: false,
          stock_status: 'out'
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

    // 8. ACTUALIZAR HOME SETTINGS (PORTADA, HERO SUBTITLE Y DESTACADOS)
    const homeUpdate = {
      hero_h1: "🍍 ¡Hoy el almuerzo en BOKU BENTO trae toda la frescura! 🍍",
      hero_subtitle: "Bento Hawaiano (Ármalo a tu gusto): Elige tu base (Arroz blanco, 50/50 o mix de verdes), tu proteína (Pollo o Cerdo salteado), tus toppings frescos con toque tropical (Piña o Mango) y cremoso (Aguacate o Guacamole) por solo $19.000. 🥣 Incluye Crema de Espinaca casera (16 oz) o Fruta + 🥤 Jugo del Día (5 oz).",
      hero_images: [
        {
          img: `${baseUrl}/brand/boku-bento-hawaiano.jpg`,
          name: "Bento Hawaiano (Ármalo a tu gusto)",
          price: 19000
        }
      ],
      featured_items: [
        {
          img: `${baseUrl}/brand/boku-bento-hawaiano.jpg`,
          name: "Bento Hawaiano (Ármalo a tu gusto)",
          price: 19000,
          product_id: hawaianoId
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

    // 9. CONFIGURAR TARIFA DE DOMICILIO EN LA SEDE ($4.000)
    const parsedFee = req.query?.delivery_fee !== undefined 
      ? Number(req.query.delivery_fee) 
      : (req.query?.fee !== undefined ? Number(req.query.fee) : 4000);

    const locationUpdate = {
      delivery_fee: parsedFee
    };
    if (req.query?.radius !== undefined) {
      locationUpdate.delivery_radius_km = Number(req.query.radius);
    }

    const { error: locErr } = await supabase
      .from('locations')
      .update(locationUpdate)
      .eq('id', locationId);

    if (locErr) {
      console.error('Error updating location delivery fee:', locErr);
    }

    // 10. CONFIGURAR MÉTODOS DE PAGO OFICIALES (NEQUI, LLAVE BRE-B 3244402642, EFECTIVO, DATÁFONO)
    const methodsToUpsert = [
      {
        brand_id: brandId,
        name: 'Nequi / Llave Bre-B',
        type: 'digital_wallet',
        icon: 'solar:wallet-bold',
        is_active: true,
        details: {
          bank_name: 'Nequi / Llave Bre-B',
          account_number: '3244402642',
          account_type: 'Billetera Digital',
          holder_name: 'Boku Bento',
          bre_b_key: '3244402642',
          instructions: 'Transfiere a Nequi o con Llave Bre-B al 3244402642 y envía tu comprobante por WhatsApp.'
        }
      },
      {
        brand_id: brandId,
        name: 'Efectivo',
        type: 'cash',
        icon: 'solar:bill-check-bold',
        is_active: true,
        details: {
          instructions: 'Pagas al recibir tu pedido en efectivo.'
        }
      },
      {
        brand_id: brandId,
        name: 'Datáfono contra entrega',
        type: 'card',
        icon: 'solar:card-2-bold',
        is_active: true,
        details: {
          instructions: 'Cobro con datáfono inalámbrico al recibir tu pedido.'
        }
      }
    ];

    const { data: currentMethods } = await supabase
      .from('payment_methods')
      .select('id, name')
      .eq('brand_id', brandId);

    let pmResult = null;
    let pmError = null;

    if (!currentMethods || currentMethods.length === 0) {
      const res = await supabase.from('payment_methods').insert(methodsToUpsert).select();
      pmResult = res.data;
      pmError = res.error;
    } else {
      const nequiMethod = currentMethods.find(m => /nequi|bre-b|transfer/i.test(m.name));
      if (nequiMethod) {
        const res = await supabase
          .from('payment_methods')
          .update(methodsToUpsert[0])
          .eq('id', nequiMethod.id)
          .select();
        pmResult = res.data;
        pmError = res.error;
      } else {
        const res = await supabase
          .from('payment_methods')
          .insert([methodsToUpsert[0]])
          .select();
        pmResult = res.data;
        pmError = res.error;
      }
    }

    return res.status(200).json({
      success: true,
      hasServiceKey: Boolean(SUPABASE_SERVICE_KEY),
      hawaianoId,
      modifierGroups: hawaianoModifierGroups.map(g => g.name),
      delivery_fee: parsedFee,
      nequi: '3244402642',
      bre_b_key: '3244402642',
      message: `¡Bento Hawaiano (Ármalo a tu gusto) activado exitosamente para hoy sábado! Portada, modificadores (Base, Proteína, Tropical, Cremoso, Crema de Espinaca / Fruta, Bebida), tarifa de domicilio ($${parsedFee}) y pagos Nequi/Bre-B (3244402642) sincronizados.`
    });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
