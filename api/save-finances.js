import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://gqjfjtzsdpslwffbqqyw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

async function parseBody(req) {
  if (req.body) {
    if (typeof req.body === 'string') {
      try { return JSON.parse(req.body); } catch (_) { return {}; }
    }
    return req.body;
  }
  return new Promise(resolve => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch (_) { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY);
    const reqBody = await parseBody(req);
    const parsedUrl = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
    const urlAction = parsedUrl.searchParams.get('action');
    const urlBrandId = parsedUrl.searchParams.get('brandId');

    const brandId = reqBody?.brandId || urlBrandId || req.query?.brandId || 'a63da806-a62a-49b9-a833-07e0976785ad';
    const action = reqBody?.action || urlAction || req.query?.action || null;
    const financials = reqBody?.financials || null;

    // ── ACCIÓN ESPECIAL: ACTUALIZAR ORDEN / CLIENTE FIADO ──
    if (req.method === 'POST' && action === 'update_order') {
      const { orderId, updates } = reqBody;
      if (!orderId || !updates) {
        return res.status(400).json({ error: 'Missing orderId or updates' });
      }
      const { data: updatedOrder, error: updErr } = await supabase
        .from('orders')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select();

      if (updErr) return res.status(500).json({ error: updErr.message });
      return res.status(200).json({ success: true, updatedOrder });
    }

    // ── ACCIÓN ESPECIAL: CREAR ORDEN FIADO DIRECTAMENTE ──
    if (req.method === 'POST' && action === 'create_receivable') {
      const { orderData } = reqBody;
      if (!orderData) return res.status(400).json({ error: 'Missing orderData' });
      const { data: newOrder, error: insErr } = await supabase
        .from('orders')
        .insert([{
          brand_id: brandId,
          ...orderData,
          created_at: new Date().toISOString()
        }])
        .select();

      if (insErr) return res.status(500).json({ error: insErr.message });
      return res.status(200).json({ success: true, newOrder });
    }

    // ── ACCIÓN ESPECIAL: SINCRONIZAR CONFIGURACIÓN MAESTRA DE PLATOS Y MEDIOS DE PAGO ──
    if (action === 'sync_brand_setup') {
      const targetBrandId = brandId || 'a63da806-a62a-49b9-a833-07e0976785ad';

      // 1. Sincronizar restaurant_settings para los platos del día de hoy
      const { data: setRows } = await supabase
        .from('restaurant_settings')
        .select('id, location_id, brand_concepts')
        .eq('brand_id', targetBrandId);

      const updatedSetRows = [];
      if (Array.isArray(setRows) && setRows.length > 0) {
        for (const row of setRows) {
          let concepts = Array.isArray(row.brand_concepts) ? [...row.brand_concepts] : [];
          const bentoIdx = concepts.findIndex(c => c && (c.id === 'bento_del_dia_config' || c.id === 'daily_special_config'));
          const bentoConcept = {
            id: 'bento_del_dia_config',
            label: 'El Bento del Día',
            updated_at: new Date().toISOString(),
            manual_override_product_id: 'b0000b25-0000-4000-a000-000000000025', // Poke Tori Katsu (Pechuga Crocante - $22.000)
            secondary_product_ids: ['d07007ec-761b-4f40-bad5-799c1154b9ab'], // Poke Salmón Fresh ($22.000)
            soup_name: '🥣 Crema de plátano colicero (16 oz)',
            drink_name: '🥤 Jugo del Día (5 oz)',
            promo_price: 22000,
            standard_price: 28000
          };

          if (bentoIdx >= 0) {
            concepts[bentoIdx] = { ...concepts[bentoIdx], ...bentoConcept };
          } else {
            concepts.push(bentoConcept);
          }

          const { data: updRow } = await supabase
            .from('restaurant_settings')
            .update({
              brand_concepts: concepts,
              updated_at: new Date().toISOString()
            })
            .eq('id', row.id)
            .select();
          if (updRow) updatedSetRows.push(updRow);
        }
      }

      // 2. Sincronizar catálogo de productos en Supabase (desactivar Arroz con Pollo, activar Poke Tori Katsu y Poke Salmón Fresh)
      await supabase
        .from('products')
        .update({
          is_active: false
        })
        .eq('id', 'b0000b21-0000-4000-a000-000000000021');

      await supabase
        .from('products')
        .update({
          is_active: true,
          price: 22000
        })
        .eq('id', 'b0000b25-0000-4000-a000-000000000025');

      await supabase
        .from('products')
        .update({
          is_active: true,
          price: 22000,
          subcategory: 'Bowls Poke Fresco'
        })
        .eq('id', 'd07007ec-761b-4f40-bad5-799c1154b9ab');

      // 3. Sincronizar Daviplata en payment_methods de Postgres
      const { data: existingMethods } = await supabase
        .from('payment_methods')
        .select('id, name, type')
        .eq('brand_id', targetBrandId);

      const hasDavi = (existingMethods || []).some(m => /daviplata/i.test(m.name || ''));
      let daviCreated = null;
      if (!hasDavi) {
        const { data: newDavi } = await supabase
          .from('payment_methods')
          .insert([{
            brand_id: targetBrandId,
            name: 'Daviplata',
            type: 'digital_wallet',
            icon: 'solar:wallet-bold',
            is_active: true,
            details: {
              bank_name: 'Daviplata',
              account_number: '3244402642',
              account_type: 'Billetera Digital',
              holder_name: 'Boku Bento',
              bre_b_key: '3244402642',
              instructions: 'Transfiere a Daviplata al número 3244402642 y envía el comprobante.'
            }
          }])
          .select();
        daviCreated = newDavi;
      }

      return res.status(200).json({
        success: true,
        message: 'Master setup synced: daily dishes & Daviplata payment method verified',
        daviCreated,
        updatedSetRows
      });
    }

    if (!financials && req.method === 'POST') {
      return res.status(400).json({ error: 'Missing financials payload' });
    }

    // 1. GET: Retornar configuración financiera persistida
    if (req.method === 'GET' && !financials) {
      // Buscar primero en restaurant_settings (soporta multi-registro / location_id)
      const { data: setRows } = await supabase
        .from('restaurant_settings')
        .select('id, location_id, brand_concepts')
        .eq('brand_id', brandId);

      const primaryRow = (setRows || []).find(r => !r.location_id) || (setRows || [])[0] || null;
      const concepts = Array.isArray(primaryRow?.brand_concepts) ? primaryRow.brand_concepts : [];
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
    // A) En restaurant_settings.brand_concepts (todas las filas de la marca)
    const { data: setRows } = await supabase
      .from('restaurant_settings')
      .select('id, brand_concepts')
      .eq('brand_id', brandId);

    if (Array.isArray(setRows) && setRows.length > 0) {
      await Promise.all(
        setRows.map(row => {
          let concepts = Array.isArray(row.brand_concepts) ? [...row.brand_concepts] : [];
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

          return supabase
            .from('restaurant_settings')
            .update({
              brand_concepts: concepts,
              updated_at: new Date().toISOString()
            })
            .eq('id', row.id);
        })
      );
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
        .eq('id', brandId);
    }

    // C) Auto-sincronizar cuentas financieras con payment_methods en PostgreSQL
    if (Array.isArray(financials?.accounts)) {
      try {
        const { data: existingMethods } = await supabase
          .from('payment_methods')
          .select('id, name')
          .eq('brand_id', brandId);

        for (const acc of financials.accounts) {
          const accName = acc.name || '';
          const alreadyExists = (existingMethods || []).some(m =>
            m.name.toLowerCase().trim() === accName.toLowerCase().trim()
          );

          if (!alreadyExists && accName) {
            const isCash = acc.type === 'cash' || /efectivo|gaveta/i.test(accName);
            await supabase
              .from('payment_methods')
              .insert([{
                brand_id: brandId,
                name: accName,
                type: isCash ? 'cash' : 'digital_wallet',
                icon: isCash ? 'solar:money-bag-bold' : 'solar:wallet-bold',
                is_active: true,
                details: {
                  bank_name: accName,
                  instructions: `Pago vía ${accName}`
                }
              }]);
          }
        }
      } catch (pmSyncErr) {
        console.warn('Silent pm auto-sync warning:', pmSyncErr);
      }
    }

    return res.status(200).json({
      success: true,
      hasServiceKey: Boolean(SUPABASE_SERVICE_KEY),
      message: 'Finanzas persistidas con éxito en Postgres (restaurant_settings y brands.config)'
    });

  } catch (err) {
    console.error('Error in save-finances API:', err);
    return res.status(500).json({ error: err.message });
  }
}
