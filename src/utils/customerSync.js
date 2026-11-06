import { supabase } from '../config/supabase';

export const DEFAULT_DISCARDED_TEST_IDS = [
  '022afa44-0294-4396-af36-dfe47e53e409', // Sebas test $37.400
  '3f3a1096-9b2a-4267-8533-484f1a765584', // Juan Vefa test $24.200
  '91bd48a0-6baf-467b-8dd3-e170f63e4b11', // Empty test $44.000
];

const ANONYMOUS_NAMES = new Set([
  '',
  'sin nombre',
  'cliente sin nombre',
  'cliente',
  'cliente whatsapp',
  'cliente mostrador',
  'cliente mostrador / whatsapp',
  'cliente invitado',
  'cliente invitado / anónimo',
  'anonimo',
  'anónimo',
  'mostrador',
]);

/**
 * Returns true if the provided name is generic/anonymous or a test placeholder
 */
export function isAnonymousCustomerName(rawName = '') {
  const norm = String(rawName || '').trim().toLowerCase();
  if (!norm || ANONYMOUS_NAMES.has(norm)) return true;
  if (norm.startsWith('test_') || norm.startsWith('prueba')) return true;
  return false;
}

/**
 * Normalizes a Colombian phone number to 10 digits when possible
 */
export function normalizePhone(rawPhone = '') {
  const str = String(rawPhone || '').trim();
  if (!str || str.startsWith('sintel:')) return '';
  const digits = str.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('573')) {
    return digits.slice(2);
  }
  return digits;
}

/**
 * Formats phone for UI display (hides synthetic 'sintel:' keys)
 */
export function displayCustomerPhone(rawPhone = '') {
  const str = String(rawPhone || '').trim();
  if (!str || str.startsWith('sintel:')) return '';
  return str;
}

/**
 * Parses customer name, address, and notes from raw order strings
 */
export function parseCustomerInfo(rawName = '', deliveryAddress = '', deliveryNotes = '') {
  let cleanName = String(rawName || '').trim();
  let address = String(deliveryAddress || '').trim();
  let notes = String(deliveryNotes || '').trim();

  // Extract name from FIADO tag if cleanName is generic
  if (isAnonymousCustomerName(cleanName) && notes.toLowerCase().includes('cuenta por cobrar:')) {
    const match = notes.match(/cuenta por cobrar:\s*([^\[\]\n\r]+)/i);
    if (match && match[1]) {
      cleanName = match[1].trim();
    }
  }

  // Strip fiado tags from name, address, and notes
  cleanName = cleanName.replace(/\[\s*🤝?\s*FIADO[^\]]*\]/gi, '').trim();
  notes = notes.replace(/\[\s*🤝?\s*FIADO[^\]]*\]/gi, '').trim();
  address = address.replace(/\[\s*🤝?\s*FIADO[^\]]*\]/gi, '').trim();

  // Match [Dir: ...] inside cleanName or notes
  const dirMatch = cleanName.match(/\[(?:Dir|Direcci[oó]n):\s*([^\]]+)\]/i)
                || notes.match(/\[(?:Dir|Direcci[oó]n):\s*([^\]]+)\]/i);
  if (dirMatch) {
    if (!address) {
      address = dirMatch[1].trim();
    }
    cleanName = cleanName.replace(/\[(?:Dir|Direcci[oó]n):\s*[^\]]+\]/gi, '').trim();
    notes = notes.replace(/\[(?:Dir|Direcci[oó]n):\s*[^\]]+\]/gi, '').trim();
  }

  // Remove dangling parentheses or brackets
  cleanName = cleanName.replace(/^[\(\[\s]+|[\)\]\s]+$/g, '').trim();
  notes = notes.replace(/^[\(\[\s]+|[\)\]\s]+$/g, '').trim();
  address = address.replace(/^[\(\[\s]+|[\)\]\s]+$/g, '').trim();

  // Split address from common apartment/house notes if notes is empty
  if (address && !notes && address.includes(' - ')) {
    const parts = address.split(' - ');
    if (parts.length > 1) {
      address = parts[0].trim();
      notes = parts.slice(1).join(' - ').trim();
    }
  }

  return {
    cleanName: cleanName || 'Sin nombre',
    address: address || '',
    notes: notes || ''
  };
}

/**
 * Returns a Set of discarded test order IDs for a given brand
 */
export function getDiscardedOrderIdsSet(brand = null, brandIdOverride = null) {
  const bId = brandIdOverride || brand?.id;
  const fromBrand = brand?.config?.financials?.discarded_order_ids;
  let fromLocal = [];
  if (bId && typeof window !== 'undefined') {
    try {
      const cached = JSON.parse(localStorage.getItem(`aa_financials_${bId}`) || '{}');
      if (Array.isArray(cached.discarded_order_ids)) {
        fromLocal = cached.discarded_order_ids;
      }
    } catch {
      // ignore
    }
  }
  return new Set([
    ...DEFAULT_DISCARDED_TEST_IDS,
    ...(Array.isArray(fromBrand) ? fromBrand : []),
    ...fromLocal,
  ]);
}

/**
 * Resolves an existing customer in public.customers or creates a new one,
 * returning the customer UUID (`customer_id`) to link strictly on `public.orders`.
 */
export async function resolveOrCreateCustomer({
  brandId,
  phone = '',
  name = '',
  address = '',
  notes = ''
}) {
  if (!brandId) return null;

  try {
    const { cleanName, address: parsedAddr, notes: parsedNotes } = parseCustomerInfo(name, address, notes);
    const cleanPhone = normalizePhone(phone);
    const hasValidPhone = cleanPhone.length >= 7;
    const hasRealName = !isAnonymousCustomerName(cleanName);

    // Do not create customer records for anonymous counter/walk-in orders without phone
    if (!hasValidPhone && !hasRealName) {
      return null;
    }

    let existingCustomer = null;

    // 1. Try lookup by phone first
    if (hasValidPhone) {
      const { data: byPhone } = await supabase
        .from('customers')
        .select('id, name, phone, notes')
        .eq('brand_id', brandId)
        .or(`phone.eq.${cleanPhone},phone.ilike.%${cleanPhone}%`)
        .limit(1);

      if (byPhone && byPhone.length > 0) {
        existingCustomer = byPhone[0];
      }
    }

    // 2. Try lookup by exact cleanName if not found by phone
    if (!existingCustomer && hasRealName) {
      const { data: byName } = await supabase
        .from('customers')
        .select('id, name, phone, notes')
        .eq('brand_id', brandId)
        .ilike('name', cleanName)
        .limit(1);

      if (byName && byName.length > 0) {
        existingCustomer = byName[0];
      }
    }

    const combinedNotes = [
      parsedAddr ? `[Dir: ${parsedAddr}]` : '',
      parsedNotes
    ].filter(Boolean).join(' - ');

    // 3. If found, enrich missing fields if we now have better info
    if (existingCustomer) {
      const updates = {};
      if (hasRealName && isAnonymousCustomerName(existingCustomer.name)) {
        updates.name = cleanName;
      }
      if (hasValidPhone && (!existingCustomer.phone || existingCustomer.phone.startsWith('sintel:'))) {
        updates.phone = cleanPhone;
      }
      if (combinedNotes && !existingCustomer.notes) {
        updates.notes = combinedNotes;
      }

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('customers')
          .update(updates)
          .eq('id', existingCustomer.id);
      }

      return existingCustomer.id;
    }

    // 4. Create new customer record in public.customers
    const syntheticPhone = `sintel:${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const insertPayload = {
      brand_id: brandId,
      name: hasRealName ? cleanName : 'Cliente',
      phone: hasValidPhone ? cleanPhone : syntheticPhone,
      notes: combinedNotes || null
    };

    const { data: created, error: insertErr } = await supabase
      .from('customers')
      .insert([insertPayload])
      .select('id')
      .single();

    if (insertErr) {
      // Handle race condition or unique constraint gracefully
      if (insertErr.code === '23505') {
        const { data: retry } = await supabase
          .from('customers')
          .select('id')
          .eq('brand_id', brandId)
          .eq('phone', insertPayload.phone)
          .maybeSingle();
        return retry?.id || null;
      }
      return null;
    }

    return created?.id || null;
  } catch (err) {
    console.warn('[customerSync] resolveOrCreateCustomer non-fatal warning:', err);
    return null;
  }
}

/**
 * Background backfill: links historical orders where customer_id is NULL
 * to their corresponding record in public.customers.
 */
export async function backfillUnlinkedOrders(brandId, orders = [], discardedSet = new Set()) {
  if (!brandId || !Array.isArray(orders) || orders.length === 0) return;

  const syncFlagKey = `aa_cust_backfill_v1_${brandId}`;
  if (typeof window !== 'undefined' && sessionStorage.getItem(syncFlagKey)) {
    return;
  }

  try {
    const unlinkedOrders = orders.filter(
      o => !o.customer_id && !discardedSet.has(o.id)
    );

    if (unlinkedOrders.length === 0) {
      if (typeof window !== 'undefined') sessionStorage.setItem(syncFlagKey, 'done');
      return;
    }

    // Mark as running so we don't run concurrently
    if (typeof window !== 'undefined') sessionStorage.setItem(syncFlagKey, 'running');

    // Group unlinked orders by customer key so we resolve each unique customer only once
    const groups = new Map();
    for (const ord of unlinkedOrders) {
      const { cleanName, address, notes } = parseCustomerInfo(
        ord.customer_name,
        ord.delivery_address,
        ord.delivery_notes
      );
      const cleanPhone = normalizePhone(ord.customer_phone);
      if (cleanPhone.length < 7 && isAnonymousCustomerName(cleanName)) continue;

      const key = cleanPhone.length >= 7 ? `tel:${cleanPhone}` : `name:${cleanName.toLowerCase()}`;
      if (!groups.has(key)) {
        groups.set(key, {
          phone: cleanPhone,
          name: cleanName,
          address,
          notes,
          orderIds: []
        });
      }
      groups.get(key).orderIds.push(ord.id);
    }

    for (const [, group] of groups.entries()) {
      const customerId = await resolveOrCreateCustomer({
        brandId,
        phone: group.phone,
        name: group.name,
        address: group.address,
        notes: group.notes
      });

      if (customerId && group.orderIds.length > 0) {
        await supabase
          .from('orders')
          .update({ customer_id: customerId })
          .in('id', group.orderIds);
      }
    }

    if (typeof window !== 'undefined') sessionStorage.setItem(syncFlagKey, 'done');
  } catch (err) {
    console.warn('[customerSync] backfillUnlinkedOrders warning:', err);
  }
}

/**
 * Synchronizes a receivable collection (from Turno & Caja or CRM) into
 * brands.config.financials (accounts balance + immutable ledger entry).
 */
export async function syncCollectionToFinancials({
  brandId,
  customerName = 'Cliente',
  amount = 0,
  paymentMethod = 'efectivo',
  isHistorical = false,
  notes = ''
}) {
  if (!brandId || isHistorical || Number(amount) <= 0) return;

  try {
    const payAmount = Number(amount);
    const { data: brandData, error: fetchErr } = await supabase
      .from('brands')
      .select('config')
      .eq('id', brandId)
      .single();

    if (fetchErr || !brandData) return;

    const currentConfig = brandData.config || {};
    const existingFin = currentConfig.financials || {
      is_initialized: false,
      accounts: [
        { id: 'acc_cash_main', name: 'Gaveta Física (Efectivo)', type: 'cash', balance: 0, is_default: true },
        { id: 'acc_nequi_main', name: 'Nequi / Bre-B', type: 'digital_wallet', balance: 0, is_default: false },
      ],
      expenses: [],
      ledger: [],
      custom_receivables: [],
      payables: [],
      discarded_order_ids: DEFAULT_DISCARDED_TEST_IDS
    };

    const accounts = Array.isArray(existingFin.accounts) && existingFin.accounts.length > 0
      ? existingFin.accounts
      : [
          { id: 'acc_cash_main', name: 'Gaveta Física (Efectivo)', type: 'cash', balance: 0, is_default: true },
          { id: 'acc_nequi_main', name: 'Nequi / Bre-B', type: 'digital_wallet', balance: 0, is_default: false },
        ];

    const methodNorm = String(paymentMethod || '').toLowerCase().trim();

    // Find matching pocket by ID, exact name, or keyword
    let targetAccount = accounts.find(a =>
      a.id === paymentMethod ||
      String(a.name || '').toLowerCase() === methodNorm
    );

    if (!targetAccount) {
      if (methodNorm.includes('efectivo') || methodNorm.includes('cash') || methodNorm.includes('gaveta')) {
        targetAccount = accounts.find(a => a.type === 'cash' || String(a.name).toLowerCase().includes('efectivo'));
      } else if (methodNorm.includes('nequi') || methodNorm.includes('bre-b') || methodNorm.includes('breb')) {
        targetAccount = accounts.find(a => String(a.name).toLowerCase().includes('nequi') || String(a.name).toLowerCase().includes('bre'));
      } else {
        targetAccount = accounts.find(a => String(a.name).toLowerCase().includes(methodNorm));
      }
    }

    if (!targetAccount) {
      targetAccount = accounts[0];
    }

    const newBalance = Number(targetAccount.balance || 0) + payAmount;
    const updatedAccounts = accounts.map(a =>
      a.id === targetAccount.id ? { ...a, balance: newBalance } : a
    );

    const ledgerEntry = {
      id: `leg_rec_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'credit',
      amount: payAmount,
      accountId: targetAccount.id,
      accountName: targetAccount.name,
      category: 'Cobro de Cartera',
      concept: `Recaudo fiado de ${customerName}${notes ? ` (${notes})` : ''}`,
      balanceAfter: newBalance
    };

    const updatedFin = {
      ...existingFin,
      accounts: updatedAccounts,
      ledger: [ledgerEntry, ...(existingFin.ledger || [])]
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(`aa_financials_${brandId}`, JSON.stringify(updatedFin));
    }

    await supabase
      .from('brands')
      .update({
        config: {
          ...currentConfig,
          financials: updatedFin
        }
      })
      .eq('id', brandId);
  } catch (err) {
    console.warn('[customerSync] syncCollectionToFinancials warning:', err);
  }
}
