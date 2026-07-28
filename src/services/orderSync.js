import { supabase } from '@/config/supabase';
import { pendingOrders } from '@/utils/offlineDb';

export function createClientOrderId() {
  return globalThis.crypto?.randomUUID?.() || `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function sendOrder(payload) {
  const { data, error } = await supabase.rpc('create_order_idempotent', {
    p_client_order_id: payload.clientOrderId,
    p_order: payload.order,
    p_items: payload.items,
  });
  if (error) throw error;
  return data;
}

export async function submitOrderResilient(payload) {
  const queued = { ...payload, queuedAt: new Date().toISOString(), attempts: 0 };
  await pendingOrders.put(queued);
  if (!navigator.onLine) return { queued: true, clientOrderId: payload.clientOrderId };
  try {
    const orderId = await sendOrder(payload);
    await pendingOrders.remove(payload.clientOrderId);
    window.dispatchEvent(new CustomEvent('aluna:orders-synced'));
    return { queued: false, orderId };
  } catch (error) {
    await pendingOrders.put({ ...queued, attempts: 1, lastError: error.message });
    throw error;
  }
}

export async function syncPendingOrders() {
  const queue = await pendingOrders.list();
  if (!navigator.onLine) return { synced: 0, pending: queue.length };
  let synced = 0;
  for (const entry of queue) {
    try {
      await sendOrder(entry);
      await pendingOrders.remove(entry.clientOrderId);
      synced += 1;
    } catch (error) {
      await pendingOrders.put({ ...entry, attempts: (entry.attempts || 0) + 1, lastError: error.message });
    }
  }
  if (synced) window.dispatchEvent(new CustomEvent('aluna:orders-synced'));
  return { synced, pending: queue.length - synced };
}

