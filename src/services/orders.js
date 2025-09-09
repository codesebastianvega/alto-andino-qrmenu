// src/services/orders.js
import supabase from "@/lib/supabaseClient";

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

  const status = payment_method === "cash" ? "awaiting_cash" : "pending";

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
    throw orderError || new Error("No se pudo crear la orden");
  }

  const orderId = orderData.id;

  const itemsPayload = items.map((it) => ({
    order_id: orderId,
    product_id: it.productId,
    name: it.name,
    unit_price_cop: it.unit_price_cop,
    qty: it.qty,
    subtotal_cop: (it.unit_price_cop || 0) * (it.qty || 1),
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(itemsPayload);

  if (itemsError) {
    await supabase.from("orders").delete().eq("id", orderId);
    throw itemsError;
  }

  return orderId;
}
