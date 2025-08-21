import React, { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import SwipeRevealItem from "./SwipeRevealItem";
import { getTableId } from "../utils/table";
import { COP } from "../utils/money";

const BG = "#1f2621";      // fondo sheet
const SURFACE = "bg-white/5 border-white/10"; // tarjetas
const PHONE = import.meta.env.VITE_WHATSAPP || "573222285900";
const NOTE_KEY = "aa_order_note";

function buildWhatsAppUrl(items, total, orderNote) {
  const table = getTableId();
  const lines = [];
  lines.push("*Pedido Alto Andino*");
  if (table) lines.push(`Mesa: ${table}`);
  lines.push("");
  (items || []).forEach((it, idx) => {
    const qty = it?.qty ?? 1;
    const unit = it?.price ?? 0;
    const subtotal = unit * qty;
    lines.push(`${idx + 1}. ${it?.name || "Producto"} x${qty} — $${COP(subtotal)}`);
    if (it?.options) {
      const opts = Object.entries(it.options)
        .map(([k, v]) => (Array.isArray(v) ? `${k}: ${v.join(", ")}` : `${k}: ${v}`))
        .join(" · ");
      if (opts) lines.push(`   ${opts}`);
    }
    if (it?.note) lines.push(`   Nota: ${it.note}`);
  });
  lines.push("");
  lines.push(`Total: $${COP(total || 0)}`);
  if ((orderNote || "").trim()) {
    lines.push("", `Nota general: ${(orderNote || "").trim()}`);
  }
  const message = lines.join("\n");
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;
}

export default function CartDrawer({ open, onClose, onSendWhatsApp }) {
  const { items, total, removeItem, increment, decrement, clear } = useCart();
  const [note, setNote] = useState(() => localStorage.getItem(NOTE_KEY) || "");

  // persist note
  useEffect(() => {
    localStorage.setItem(NOTE_KEY, note || "");
  }, [note]);

  // bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, [open]);

  if (!open) return null;

  const handleSendWhatsApp = () => {
    const url = buildWhatsAppUrl(items, total, note);
    if (onSendWhatsApp) onSendWhatsApp(url);
    else window.open(url, "_blank");
  };

  return (
    <div className="fixed inset-0 z-[95]">
      {/* Overlay por encima de todo */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet */}
      <div
        className="absolute inset-x-0 bottom-0 z-[96] mx-auto w-full max-w-md rounded-t-2xl shadow-2xl ring-1 ring-black/20"
        style={{ backgroundColor: BG }}
        role="dialog"
        aria-modal="true"
      >
        {/* Handle */}
        <div className="pt-3">
          <div className="mx-auto h-1.5 w-10 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 pt-2 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">Tu pedido</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={clear}
              className="text-xs text-white/80 hover:text-white underline underline-offset-2"
            >
              Vaciar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-white/80 hover:text-white rounded px-2 py-1 ring-1 ring-white/15"
              aria-label="Cerrar"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Lista scrolleable */}
        <div
          className="px-4 space-y-3"
          style={{ maxHeight: "calc(100dvh - 280px)", overflowY: "auto" }}
        >
          {items && items.length ? items.map((it, idx) => (
            <SwipeRevealItem key={idx} onDelete={() => removeItem(it)}>
              <div className={`rounded-xl ${SURFACE} p-3 flex items-center gap-3`}>
                {/* Imagen si existe */}
                {it.image && (
                  <img
                    src={it.image}
                    alt={it.name}
                    className="h-12 w-12 rounded-lg object-cover ring-1 ring-white/10"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{it.name}</p>
                      {it.variant && (
                        <p className="text-white/60 text-xs truncate">{it.variant}</p>
                      )}
                    </div>
                    <p className="text-white font-semibold whitespace-nowrap">
                      {it.priceFormatted || it.priceFmt || COP(it.price)}
                    </p>
                  </div>

                  {/* Controles cantidad */}
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 ring-1 ring-white/15 px-2 py-1">
                    <button
                      type="button"
                      onClick={() => decrement(idx)}
                      className="h-7 w-7 grid place-items-center rounded-full text-white hover:bg-white/10"
                      aria-label="Restar"
                    >−</button>
                    <span className="text-white text-sm tabular-nums">{it.qty}</span>
                    <button
                      type="button"
                      onClick={() => increment(idx)}
                      className="h-7 w-7 grid place-items-center rounded-full text-white hover:bg-white/10"
                      aria-label="Sumar"
                    >＋</button>
                  </div>
                </div>
              </div>
            </SwipeRevealItem>
          )) : (
            <div className="text-center text-white/70 py-10">
              Tu carrito está vacío.
            </div>
          )}

          {/* Nota general */}
          <div className={`rounded-xl ${SURFACE} p-3`}>
            <label className="text-white/80 text-xs">Notas al pedido</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: sin azúcar, sin queso…"
              className="mt-1 w-full rounded-lg bg-white/5 text-white placeholder-white/40
                         ring-1 ring-white/15 focus:ring-2 focus:ring-white/30 p-2 text-sm"
              rows={2}
            />
          </div>
        </div>

        {/* Footer fijo dentro del sheet */}
        <div
          className="px-4 pb-4 pt-3 mt-3 border-t border-white/10"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 16px)" }}
        >
          <div className="flex items-center justify-between text-white">
            <span className="text-sm">Total</span>
            <span className="font-semibold text-lg">{COP(total)}</span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl bg-white/10 text-white hover:bg-white/15 ring-1 ring-white/15"
            >
              Seguir pidiendo
            </button>
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="h-10 rounded-xl bg-[#2f4131] text-white hover:bg-[#243326]"
            >
              Enviar por WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
