// src/services/orders.js
import supabase from "@/lib/supabaseClient";
import { toast } from "@/components/Toast";

/**
 * Crea una orden y sus items asociados.
 * @param {Object} payload
 * @param {string} payload.mode - mesa | pickup | delivery
 * @param {string|null} payload.tableId
 * @param {Object} payload.contact - {name, phone}
 * @param {Object} payload.address - {line, notes}
 * @param {string} payload.notes - notas generales
 * @param {string} payload.payment_method - cash | online
 * @param {Array} payload.items - items del carrito
 * @param {Object} payload.totals - {subtotal_cop, delivery_fee_cop, total_cop}
 * @returns {Promise<string>} id de la orden creada
 */
export async function createOrder({
  mode,
  tableId,
  contact = {},
  address = {},
  notes,
  payment_method,
  items = [],
  totals = {},
}) {
  if (!supabase) throw new Error("Supabase no configurado");

  // Estado inicial según modo: mesa -> awaiting_cash, pickup/delivery -> pending_payment
  let status = "pending_payment";
  if (mode === "mesa") {
    status = "awaiting_cash";
  }

  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .insert({
      mode,
      table_id: tableId || null,
      contact_name: contact.name || null,
      contact_phone: contact.phone || null,
      address_line: address.line || null,
      address_notes: address.notes || null,
      notes: notes || null,
      payment_method,
      status,
      subtotal_cop: totals.subtotal_cop || 0,
      delivery_fee_cop: totals.delivery_fee_cop || 0,
      total_cop: totals.total_cop || 0,
    })
    .select("id")
    .single();

  if (orderError || !orderData) {
    const err = orderError || new Error("No se pudo crear la orden");
    toast(err.message);
    err.__toastShown = true;
    throw err;
  }

  const orderId = orderData.id;

  const itemsPayload = items.map((it) => {
    const unitPrice = it.unit_price_cop ?? it.price_cop ?? 0;
    return {
      order_id: orderId,
      product_id: it.productId ?? it.id,
      qty: it.qty,
      unit_price_cop: unitPrice,
      total_cop: unitPrice * (it.qty || 0),
    };
  });

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(itemsPayload);

  if (itemsError) {
    await supabase.from("orders").delete().eq("id", orderId);
    toast(itemsError.message);
    itemsError.__toastShown = true;
    throw itemsError;
  }

  return orderId;
}
