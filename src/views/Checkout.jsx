// src/views/Checkout.jsx
import { useState } from "react";
import { useAppState } from "@/state/appState";
import { createOrder } from "@/services/orders";
import { formatCOP } from "@/utils/money";
import { toast } from "@/components/Toast";

export default function Checkout() {
  const {
    mode,
    tableId,
    cart,
    getIncompatibleItemsForMode,
    clearCart,
    getCartTotalCop,
  } = useAppState();
  const [form, setForm] = useState({
    contact_name: "",
    contact_phone: "",
    address_line: "",
    address_notes: "",
    notes: "",
    payment_method: "cash",
  });
  const [orderId, setOrderId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const items = cart.items || [];
  const incompatible = getIncompatibleItemsForMode(mode);
  const subtotal = getCartTotalCop();
  const total = subtotal;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const isValid = () => {
    if (mode === "mesa") return true;
    if (!form.contact_name) return false;
    if (!/^\d{10}$/.test(form.contact_phone)) return false;
    if (mode === "delivery" && !form.address_line) return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (incompatible.length > 0) return;
    if (!isValid()) {
      toast("Faltan campos obligatorios");
      return;
    }
    setSubmitting(true);
    try {
      const id = await createOrder({
        mode,
        tableId,
        contact: {
          name: form.contact_name,
          phone: form.contact_phone,
        },
        address: {
          line: form.address_line,
          notes: form.address_notes,
        },
        notes: form.notes,
        payment_method: mode === "mesa" ? "cash" : form.payment_method,
        items,
        totals: {
          subtotal_cop: subtotal,
          delivery_fee_cop: 0,
          total_cop: total,
        },
      });
      clearCart();
      try {
        window.localStorage.setItem("lastOrderId", id);
      } catch {}
      setOrderId(id);
    } catch (err) {
      console.error(err);
      toast("No se pudo crear la orden");
    } finally {
      setSubmitting(false);
    }
  };

  if (orderId) {
    return (
      <div className="p-4 space-y-2">
        <h2 className="text-xl font-semibold">Orden creada</h2>
        <p className="text-sm">Modo: {mode}</p>
        <p className="text-sm">Número de orden: {orderId}</p>
        <p className="text-sm">Total: {formatCOP(total)}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      {mode !== "mesa" && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-neutral-700">Nombre</label>
            <input
              name="contact_name"
              value={form.contact_name}
              onChange={handleChange}
              className="mt-1 w-full rounded border p-2 text-sm"
              required={mode !== "mesa"}
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-700">Teléfono</label>
            <input
              name="contact_phone"
              value={form.contact_phone}
              onChange={handleChange}
              className="mt-1 w-full rounded border p-2 text-sm"
              inputMode="numeric"
              pattern="\d{10}"
              required={mode !== "mesa"}
            />
          </div>
        </div>
      )}

      {mode === "mesa" && (
        <div>
          <label className="block text-sm text-neutral-700">Nombre (opcional)</label>
          <input
            name="contact_name"
            value={form.contact_name}
            onChange={handleChange}
            className="mt-1 w-full rounded border p-2 text-sm"
          />
        </div>
      )}

      {mode === "delivery" && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-neutral-700">Dirección</label>
            <input
              name="address_line"
              value={form.address_line}
              onChange={handleChange}
              className="mt-1 w-full rounded border p-2 text-sm"
              required={mode === "delivery"}
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-700">Notas de dirección (opcional)</label>
            <input
              name="address_notes"
              value={form.address_notes}
              onChange={handleChange}
              className="mt-1 w-full rounded border p-2 text-sm"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm text-neutral-700">Notas (opcional)</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          className="mt-1 w-full rounded border p-2 text-sm"
          rows={2}
        />
      </div>

      {mode !== "mesa" && (
        <div className="space-y-2">
          <p className="text-sm text-neutral-700">Método de pago</p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="payment_method"
              value="cash"
              checked={form.payment_method === "cash"}
              onChange={handleChange}
            />
            Pagar en caja
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-400">
            <input type="radio" disabled />
            Pagar en línea (Bold)
          </label>
        </div>
      )}

      <div className="space-y-1">
        <h3 className="font-medium">Resumen</h3>
        <ul className="space-y-1">
          {items.map((it) => (
            <li key={it.id} className="text-sm">
              {it.qty}× {it.name} - {formatCOP((it.unit_price_cop || 0) * (it.qty || 1))}
            </li>
          ))}
        </ul>
        <p className="text-sm font-semibold">Total: {formatCOP(total)}</p>
      </div>

      <button
        type="submit"
        disabled={submitting || incompatible.length > 0 || !isValid()}
        className="w-full rounded bg-[#2f4131] py-2 text-white disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
      >
        Confirmar pedido
      </button>
    </form>
  );
}
