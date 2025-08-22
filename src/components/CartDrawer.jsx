import React, { useEffect } from "react";
import { useCart } from "../context/CartContext";
import SwipeRevealItem from "./SwipeRevealItem";

const toNumberCOP = (v) => {
  if (typeof v === "number") return v;
  if (!v) return 0;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return isFinite(n) ? n : 0;
};
const formatCOP = (n) =>
  Number(n || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

const renderOptions = (opts) => {
  if (!opts) return null;
  const parts = [];
  if (Array.isArray(opts)) {
    if (opts.length) parts.push(opts.join(", "));
  } else if (typeof opts === "object") {
    for (const [k, v] of Object.entries(opts)) {
      if (Array.isArray(v) && v.length) parts.push(`${k}: ${v.join(", ")}`);
      else if (v) parts.push(`${k}: ${v}`);
    }
  }
  if (!parts.length) return null;
  return <p className="text-neutral-600 text-xs mt-0.5">{parts.join(" · ")}</p>;
};

const safeNum = (raw) => {
  const n = String(raw || "").replace(/\D/g, "");
  return n.startsWith("57") ? n : (n ? `57${n}` : "");
};

const getTable = () => {
  try {
    if (typeof window === "undefined") return "";
    for (const k of ["aa_table", "aa_table_num", "aa_t", "mesa", "table"]) {
      const v = window.localStorage?.getItem?.(k);
      if (v) return v;
    }
    const sp = new URL(window.location.href).searchParams.get("t");
    return sp || "";
  } catch {
    return "";
  }
};
const buildWaText = ({ items = [], total = 0, note = "" }) => {
  const mesa = getTable();
  const lines = ["*Pedido Alto Andino*"];
  if (mesa) lines.push(`Mesa: ${mesa}`);
  items.forEach(it => {
    const name = [it.name, it.variant].filter(Boolean).join(" · ");
    const unit = toNumberCOP(it.price ?? it.unitPrice ?? it.priceEach);
    lines.push(`• ${it.qty}× ${name} — ${formatCOP(unit * it.qty)}`);
    if (it.note) lines.push(`  ▸ Nota: ${it.note}`);
  });
  if (note) lines.push(`Nota general: ${note}`);
  lines.push(`Total: ${formatCOP(total)}`);
  return encodeURIComponent(lines.join("\n"));
};

export default function CartDrawer({ open, onClose }) {
  const cart = useCart?.() || {};
  const {
    items = [],
    total = 0,
    clear: clearCart,
    increment,
    decrement,
    removeItem,
    updateItem,

    note,
    setNote,
    setItemNote: setItemNoteCtx,
    updateItemNote: updateItemNoteCtx,
  } = cart;

  const waNum = safeNum(import.meta.env.VITE_WHATSAPP || "573209009972");
  const waHref = items?.length
    ? `https://wa.me/${waNum}?text=${buildWaText({ items, total, note })}`
    : undefined;

  // setter flexible para nota por ítem (usa la disponible en el contexto)
  const setItemNote =
    setItemNoteCtx ||
    updateItemNoteCtx ||
    ((index, value) => updateItem?.(index, { note: value }));

  const handleDecrement = (item, idx) => {
    if (item.qty <= 1) removeItem?.(item);
    else decrement?.(idx);
  };


  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[96]">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />

      {/* Sheet */}
      <div
        className="absolute inset-x-0 bottom-0 z-[96] mx-auto w-full max-w-md rounded-t-2xl shadow-2xl ring-1 ring-black/10 bg-[#FAF7F2]"
        role="dialog"
        aria-modal="true"
      >
        {/* Handle */}
        <div className="pt-3">
          <div className="mx-auto h-1.5 w-10 rounded-full bg-neutral-300/70" />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 pt-2 flex items-center justify-between">
          <h2 className="text-neutral-900 font-semibold text-lg">Tu pedido</h2>
          <div className="flex items-center gap-3">
            <button type="button" onClick={clearCart} className="text-xs text-neutral-700 hover:text-neutral-900 underline underline-offset-2">Vaciar</button>
            <button type="button" onClick={onClose} className="text-xs text-neutral-700 hover:text-neutral-900 rounded px-2 py-1 ring-1 ring-neutral-300/70" aria-label="Cerrar">Cerrar</button>
          </div>
        </div>

        {/* Lista scrolleable */}
        <div className="px-4 space-y-3" style={{ maxHeight: "calc(100dvh - 280px)", overflowY: "auto" }}>
          {items.length ? items.map((it, idx) => {
            const unit = toNumberCOP(it.price ?? it.unitPrice ?? it.priceEach);
            const qty = Number(it.qty || 1);
            const lineTotal = unit * qty;
            return (
            <SwipeRevealItem key={idx} onDelete={() => removeItem?.(it)}>

              <div className="p-3 bg-white rounded-xl ring-1 ring-neutral-200">
                <div className="flex items-start gap-3">
                  {/* imagen opcional */}
                  {it.image ? (
                    <img
                      src={it.image}
                      alt={it.name}
                      loading="lazy"
                      decoding="async"
                      className="h-12 w-12 rounded-lg object-cover ring-1 ring-neutral-200"
                    />
                  ) : null}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-neutral-900 font-medium truncate">{it.name}</p>
                        {it.variant && <p className="text-neutral-600 text-xs truncate">{it.variant}</p>}
                        {renderOptions(it.options)}
                      </div>
                      <p className="text-neutral-900 font-semibold whitespace-nowrap">
                        {formatCOP(lineTotal)}
                      </p>
                    </div>

                    {/* Controles de cantidad (compactos) */}
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-neutral-100 ring-1 ring-neutral-300 px-1 py-[2px]">
                      <button
                        type="button"
                        onClick={() => handleDecrement(it, idx)}
                        className="h-6 w-6 grid place-items-center rounded-full text-neutral-900 hover:bg-neutral-200"
                        aria-label="Restar"
                      >
                        −
                      </button>
                      <span className="text-neutral-900 text-sm tabular-nums">{it.qty}</span>
                      <button
                        type="button"
                        onClick={() => increment?.(idx)}
                        className="h-6 w-6 grid place-items-center rounded-full text-neutral-900 hover:bg-neutral-200"
                        aria-label="Sumar"
                      >
                        ＋
                      </button>

                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1">Unitario: {formatCOP(unit)}</p>

                    {/* Nota por ítem */}
                    <div className="mt-2">
                      <input
                        type="text"
                        value={it.note || ""}
                        onChange={(e) => setItemNote(idx, e.target.value)}

                        placeholder="Nota para este ítem (opcional)"
                        className="w-full rounded-lg bg-white text-neutral-900 placeholder-neutral-400 ring-1 ring-neutral-300 focus:ring-2 focus:ring-[#2f4131]/30 px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </SwipeRevealItem>
            );
          }) : (
            <div className="text-center text-neutral-700 py-10">Tu carrito está vacío.</div>
          )}

          {/* Nota general */}
          <div className="bg-white rounded-xl ring-1 ring-neutral-200 p-3">
            <label className="text-neutral-700 text-xs">Notas al pedido</label>
            <textarea
              value={note ?? ""}
              onChange={(e) => setNote?.(e.target.value)}
              placeholder="Ej: sin azúcar, sin queso…"
              className="mt-1 w-full rounded-lg bg-white text-neutral-900 placeholder-neutral-400 ring-1 ring-neutral-300 focus:ring-2 focus:ring-[#2f4131]/30 p-2 text-sm"
              rows={2}
            />
          </div>
        </div>

        {/* Footer fijo */}
        <div className="px-4 pb-4 pt-3 mt-3 border-t border-neutral-200" style={{ paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 16px)" }}>
          <div className="flex items-center justify-between text-neutral-900">
            <span className="text-sm text-neutral-700">Total</span>
            <span className="font-semibold text-lg tabular-nums text-neutral-900">
              {formatCOP(total)}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={onClose} className="h-10 rounded-xl bg-white text-neutral-900 ring-1 ring-neutral-300 hover:bg-neutral-50">Seguir pidiendo</button>
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => { if (!waHref) e.preventDefault(); }}
              aria-disabled={!waHref}
              className={[
                "h-10 rounded-xl grid place-items-center",
                waHref
                  ? "bg-[#2f4131] text-white hover:bg-[#243326] focus:outline-none focus:ring-2 focus:ring-[rgba(47,65,49,0.3)]"
                  : "bg-neutral-100 text-neutral-400 ring-1 ring-neutral-200 cursor-not-allowed"
              ].join(" ")}
            >
              Enviar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
