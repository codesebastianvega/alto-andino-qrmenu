// src/views/Checkout.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
    products,
    removeItemsByIds,
  } = useAppState();
  const [form, setForm] = useState({
    contact_name: "",
    contact_phone: "",
    address_line: "",
    address_notes: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const items = cart.items || [];
  const incompatible = getIncompatibleItemsForMode(mode);
  const subtotal = getCartTotalCop();
  const total = subtotal;

  const filterUnavailableItems = () => {
    const current = cart.items || [];
    const unavailable = current.filter((it) => {
      const p = products.find((pr) => pr.id === it.productId);
      return p && (!p.is_available || (typeof p.stock === "number" && p.stock <= 0));
    });
    if (unavailable.length > 0) {
      removeItemsByIds(unavailable.map((u) => u.id));
      toast("Quitamos productos sin stock del carrito");
    }
    const ids = new Set(unavailable.map((u) => u.id));
    return current.filter((it) => !ids.has(it.id));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const isValid = () => {
    if (items.length === 0) return false;
    if (mode === "mesa") return true;
    if (!form.contact_name) return false;
    if (!/^\d{10}$/.test(form.contact_phone)) return false;
    if (mode === "delivery" && !form.address_line) return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (incompatible.length > 0) return;
    const validItems = filterUnavailableItems();
    if (!isValid() || validItems.length === 0) {
      toast("Faltan campos obligatorios");
      return;
    }
    setSubmitting(true);
    try {
      const sub = validItems.reduce(
        (sum, it) => sum + (it.unit_price_cop || 0) * (it.qty || 1),
        0,
      );
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
        payment_method: "cash",
        items: validItems,
        totals: {
          subtotal_cop: sub,
          delivery_fee_cop: 0,
          total_cop: sub,
        },
      });
      if (!id) throw new Error("Orden inválida");
      clearCart();
      try {
        window.sessionStorage.setItem("lastOrderId", id);
      } catch {}
      navigate(`/checkout/success?orderId=${id}`);
    } catch (err) {
      console.error(err);
      if (!err.__toastShown) toast(err.message || "No se pudo crear la orden");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBoldPay = async () => {
    if (incompatible.length > 0) return;
    const validItems = filterUnavailableItems();
    if (!isValid() || validItems.length === 0) {
      toast("Faltan campos obligatorios");
      return;
    }
    setSubmitting(true);
    try {
      const sub = validItems.reduce(
        (sum, it) => sum + (it.unit_price_cop || 0) * (it.qty || 1),
        0,
      );
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
        payment_method: "online",
        items: validItems,
        totals: {
          subtotal_cop: sub,
          delivery_fee_cop: 0,
          total_cop: sub,
        },
      });
      if (!id) throw new Error("Orden inválida");
      clearCart();
      try {
        window.sessionStorage.setItem("lastOrderId", id);
      } catch {}
      const resp = await fetch("/api/payments/bold/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.checkout_url) throw new Error("Bold error");
      window.location.href = data.checkout_url;
    } catch (err) {
      console.error(err);
      if (!err.__toastShown)
        toast(err.message || "No se pudo iniciar pago en línea");
    } finally {
      setSubmitting(false);
    }
  };

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
      {mode !== "mesa" && total > 0 && (
        <button
          type="button"
          onClick={handleBoldPay}
          disabled={submitting || incompatible.length > 0 || !isValid()}
          className="w-full rounded border border-[#2f4131] py-2 text-[#2f4131] disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-500"
        >
          Pagar con Bold
        </button>
      )}
    </form>
  );
}
