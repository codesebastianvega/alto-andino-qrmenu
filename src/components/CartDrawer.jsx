import React, { useEffect, useState, useRef } from "react";
import { useCart, getItemUnit } from "@/context/CartContext";
 import SwipeRevealItem from "./SwipeRevealItem";
 import Portal from "./Portal";
 import { toast } from "./Toast";
import { getProductImage } from "@/utils/images";
import { MILK_OPTIONS } from "@/config/milkOptions";
import { formatCOP } from "@/utils/money";
 
 const safeNum = (raw) => {
   const n = String(raw || "").replace(/\D/g, "");
  return n.startsWith("57") ? n : n ? `57${n}` : "";
 };
 const getTable = () => {
   try {
     for (const k of ["aa_table", "aa_table_num", "aa_t", "mesa", "table"]) {
       const v = localStorage.getItem(k);
       if (v) return v;
     }
     const sp = new URL(location.href).searchParams.get("t");
     return sp || "";
  } catch {
    return "";
  }
 };
 const renderOptionsText = (opts) => {
   if (!opts) return "";
   const parts = [];
   if (Array.isArray(opts)) {
     if (opts.length) parts.push(opts.join(", "));
   } else if (typeof opts === "object") {
     for (const [k, v] of Object.entries(opts)) {
       if (Array.isArray(v) && v.length) parts.push(`${k}: ${v.join(", ")}`);
       else if (v) parts.push(`${k}: ${v}`);
     }
   }
   return parts.join(" · ");
 };
 const buildWaText = ({ items = [], total = 0, note = "" }) => {
   const mesa = getTable();
   const lines = ["*Pedido Alto Andino*"];
   if (mesa) lines.push(`Mesa: ${mesa}`);
  items.forEach((it) => {
    const unit = getItemUnit(it);
     const qty = Number(it.qty || 1);
     const name = [it.name, it.variant].filter(Boolean).join(" · ");
     const opts = renderOptionsText(it.options);
     lines.push(`• ${qty}× ${name} — ${formatCOP(unit * qty)}`);
     if (opts) lines.push(`  ▸ ${opts}`);
     if (it.note) lines.push(`  ▸ Nota: ${it.note}`);
   });
   if (note) lines.push(`Nota general: ${note}`);
   lines.push(`Total: ${formatCOP(total)}`);
   return encodeURIComponent(lines.join("\n"));
 };
 
 const renderOptions = (opts) => {
   const text = renderOptionsText(opts);
  return text ? <p className="mt-0.5 text-xs text-neutral-600">{text}</p> : null;
 };
 
 export default function CartDrawer({ open, onClose }) {
   const cart = useCart?.() || {};
   const {
     items = [],
     total = 0,
     clearCart,
     increment,
     decrement,
     removeItem,
     updateItem,
     addItem,
 
     note,
     setNote,
     setItemNote: setItemNoteCtx,
     updateItemNote: updateItemNoteCtx,
   } = cart;
 
   const [confirmingClear, setConfirmingClear] = useState(false);
   const [lastSnapshot, setLastSnapshot] = useState(null);
   const confirmBtnRef = useRef(null);
 
   const waNum = safeNum(import.meta.env.VITE_WHATSAPP || "573209009972");
   const waHref = items?.length
     ? `https://wa.me/${waNum}?text=${buildWaText({ items, total, note })}`
     : undefined;
 
   const onWhatsAppClick = (e) => {
     if (!waHref) {
       e.preventDefault();
       return;
     }
    try {
      const snapshot = { items, note, total };
      sessionStorage.setItem("aa_last_order", JSON.stringify(snapshot));
    } catch {}

    setTimeout(() => {
      try {
        clearCart?.();
        document.dispatchEvent(
          new CustomEvent("aa:toast", {
            detail: { message: "Pedido abierto en WhatsApp — Deshacer" },
          })
        );
      } catch {}
    }, 300);
  };
 
   // setter flexible para nota por ítem (usa la disponible en el contexto)
   const setItemNote =
    setItemNoteCtx || updateItemNoteCtx || ((index, value) => updateItem?.(index, { note: value }));
 
   const handleDecrement = (item, idx) => {
     if (item.qty <= 1) removeItem?.(item);
     else decrement?.(idx);
   };
 
   const handleClearRequest = () => {
     try {
       setLastSnapshot(JSON.parse(JSON.stringify(items)));
     } catch {
       setLastSnapshot(items);
     }
     setConfirmingClear(true);
   };
 
   const clearCartNow = () => {
     clearCart?.();
     setConfirmingClear(false);
     toast("Carrito vaciado", {
       actionLabel: "Deshacer",
       duration: 5000,
       onAction: () => {
         if (lastSnapshot) {
           if (typeof cart.replaceWith === "function") {
             cart.replaceWith(lastSnapshot);
           } else {
             cart.clear?.();
             lastSnapshot.forEach((it) => addItem?.(it));
           }
         }
       },
     });
   };
 
   useEffect(() => {
     if (!open) return;
     const prev = document.body.style.overflow;
     document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
   }, [open]);
 
   useEffect(() => {
     if (confirmingClear) confirmBtnRef.current?.focus();
   }, [confirmingClear]);
 
   useEffect(() => {
     const onKey = (e) => {
       if (e.key === "Escape") {
         if (confirmingClear) setConfirmingClear(false);
         else onClose?.();
       }
     };
     window.addEventListener("keydown", onKey);
     return () => window.removeEventListener("keydown", onKey);
   }, [onClose, confirmingClear]);
 
   if (!open) return null;
 
   return (
     <>
       <div className="fixed inset-0 z-[96]">
         {/* Overlay */}
         <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
 
         {/* Sheet */}
         <div
          className="absolute inset-x-0 bottom-0 z-[96] mx-auto w-full max-w-md rounded-t-2xl bg-[#FAF7F2] shadow-2xl ring-1 ring-black/10"
           role="dialog"
           aria-modal="true"
         >
          {/* Handle */}
          <div className="pt-3">
            <div className="mx-auto h-1.5 w-10 rounded-full bg-neutral-300/70" />
          </div>
 
         {/* Header */}
          <div className="flex items-center justify-between px-4 pb-3 pt-2">
            <h2 className="text-lg font-semibold text-neutral-900">Tu pedido</h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClearRequest}
                className="text-xs text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
              >
                Vaciar
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded px-2 py-1 text-xs text-neutral-700 ring-1 ring-neutral-300/70 hover:text-neutral-900"
                aria-label="Cerrar"
              >
                Cerrar
              </button>
            </div>
           </div>

          {/* Lista scrolleable */}
          <div
            className="space-y-3 px-4"
            style={{ maxHeight: "calc(100dvh - 280px)", overflowY: "auto" }}
          >
            {items.length ? (
              items.map((it, idx) => {
                const unit = getItemUnit(it);
                const qty = Number(it.qty || 1);
                const lineTotal = unit * qty;
                return (
                  <SwipeRevealItem key={idx} onDelete={() => removeItem?.(it)}>
                    <div className="rounded-xl bg-white p-3 ring-1 ring-neutral-200">
                      <div className="flex items-start gap-3">
                        <img
                          src={getProductImage(it)}
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                          decoding="async"
                          className="h-12 w-12 rounded-md object-cover"
                        />
 
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate font-medium text-neutral-900">{it.name}</p>
                              {it.variant && (
                                <p className="truncate text-xs text-neutral-600">{it.variant}</p>
                              )}
                              {it.milk && (
                                <div className="mt-0.5 text-xs text-neutral-500">
                                  Leche:{" "}
                                  {MILK_OPTIONS.find((m) => m.id === it.milk)?.label || it.milk}
                                </div>
                              )}
                              {renderOptions(it.options)}
                              {it.milk && (
                                <div className="mt-0.5 text-xs text-neutral-500">
                                  Leche:{" "}
                                  {MILK_OPTIONS.find((m) => m.id === it.milk)?.label || it.milk}
                                </div>
                              )}
                            </div>
                            <p className="whitespace-nowrap font-semibold text-neutral-900">
                              {formatCOP(lineTotal)}
                            </p>
                          </div>
 
                          {/* Controles de cantidad (compactos) */}
                          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-neutral-100 px-1 py-[2px] ring-1 ring-neutral-300">
                            <button
                              type="button"
                              onClick={() => handleDecrement(it, idx)}
                              className="grid h-6 w-6 place-items-center rounded-full text-neutral-900 hover:bg-neutral-200"
                              aria-label="Restar"
                            >
                              −
                            </button>
                            <span className="text-sm tabular-nums text-neutral-900">{it.qty}</span>
                            <button
                              type="button"
                              onClick={() => increment?.(idx)}
                              className="grid h-6 w-6 place-items-center rounded-full text-neutral-900 hover:bg-neutral-200"
                              aria-label="Sumar"
                            >
                              ＋
                            </button>
                           </div>

                          <p className="mt-1 text-[11px] text-neutral-500">
                            Unitario: {formatCOP(unit)}
                          </p>

                          {/* Nota por ítem */}
                          <div className="mt-2">
                            <input
                              type="text"
                              value={it.note || ""}
                              onChange={(e) => setItemNote(idx, e.target.value)}
                              placeholder="Nota para este ítem (opcional)"
                              className="w-full rounded-lg bg-white px-2 py-1 text-xs text-neutral-900 placeholder-neutral-400 ring-1 ring-neutral-300 focus:ring-2 focus:ring-[#2f4131]/30"
                            />
                           </div>
                        </div>
                       </div>

                     </div>
                  </SwipeRevealItem>
                );
              })
            ) : (
              <div className="py-10 text-center text-neutral-700">Tu carrito está vacío.</div>
            )}
 
            {/* Nota general */}
            <div className="rounded-xl bg-white p-3 ring-1 ring-neutral-200">
              <label className="text-xs text-neutral-700">Notas al pedido</label>
              <textarea
                value={note ?? ""}
                onChange={(e) => setNote?.(e.target.value)}
                placeholder="Ej: sin azúcar, sin queso…"
                className="mt-1 w-full rounded-lg bg-white p-2 text-sm text-neutral-900 placeholder-neutral-400 ring-1 ring-neutral-300 focus:ring-2 focus:ring-[#2f4131]/30"
                rows={2}
              />
            </div>
           </div>

          {/* Footer fijo */}
          <div
            className="mt-3 border-t border-neutral-200 px-4 pb-4 pt-3"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 16px)" }}
          >
            <div className="flex items-center justify-between text-neutral-900">
              <span className="text-sm text-neutral-700">Total</span>
              <span className="text-lg font-semibold tabular-nums text-neutral-900">
                {formatCOP(total)}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-10 rounded-xl bg-white text-neutral-900 ring-1 ring-neutral-300 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2"
              >
                Seguir pidiendo
              </button>
              <a
                href={waHref}
                target="_blank"
                rel="noreferrer"
                onClick={onWhatsAppClick}
                aria-disabled={!waHref}
                className={[
                  "grid h-10 place-items-center rounded-xl",
                  waHref
                    ? "bg-[#2f4131] text-white hover:bg-[#243326] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4131] focus-visible:ring-offset-2"
                    : "cursor-not-allowed bg-neutral-100 text-neutral-400 ring-1 ring-neutral-200",
                ].join(" ")}
              >
                Enviar por WhatsApp
              </a>
            </div>
           </div>
         </div>
       </div>
       {confirmingClear && (
         <Portal>
           <div className="fixed inset-0 z-[120] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setConfirmingClear(false)}
            />
             <div
               role="dialog"
               aria-modal="true"
              className="relative z-10 w-[calc(100%-1.5rem)] max-w-md rounded-2xl bg-white p-5 shadow-xl"
             >
               <p className="text-center text-neutral-800">¿Vaciar todo el carrito?</p>
               <div className="mt-4 flex justify-end gap-3">
                 <button
                   type="button"
                   onClick={() => setConfirmingClear(false)}
                  className="rounded px-3 py-1 text-sm text-neutral-700 hover:text-neutral-900"
                 >
                   Cancelar
                 </button>
                 <button
                   type="button"
                   ref={confirmBtnRef}
                   onClick={clearCartNow}
                  className="rounded bg-[#2f4131] px-3 py-1 text-sm text-white hover:bg-[#243326]"
                 >
                   Vaciar ahora
                 </button>
               </div>
             </div>
           </div>
         </Portal>
       )}
     </>
   );
 }
 