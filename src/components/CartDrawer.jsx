import React, { useEffect, useState, useRef } from "react";
import { useCart, getItemUnit } from "@/context/CartContext";
import SwipeRevealItem from "./SwipeRevealItem";
import Portal from "./Portal";
import { toast as toastFn } from "./Toast";
import { getProductImage } from "@/utils/images";
import { MILK_OPTIONS } from "@/config/milkOptions";
import { formatCOP } from "@/utils/money";
import AAImage from "@/components/ui/AAImage";
import { Icon } from "@iconify-icon/react";
import { supabase } from "@/config/supabase";

const toast = {
  success: (msg) => toastFn(msg, { duration: 3000 }),
  error: (msg) => toastFn(msg, { duration: 4000 })
};

const safeNum = (raw) => {
  const n = String(raw || "").replace(/\D/g, "");
  return n.startsWith("57") ? n : n ? `57${n}` : "";
};
const getTable = () => {
  try {
    const sp = new URL(location.href).searchParams;
    const fromUrl = sp.get("mesa") || sp.get("t");
    if (fromUrl) return fromUrl;

    const sess = sessionStorage.getItem("aa_current_mesa");
    if (sess) return sess;

    for (const k of ["aa_table", "aa_table_num", "aa_t", "mesa", "table"]) {
      const v = localStorage.getItem(k);
      if (v) return v;
    }
    return "";
  } catch {
    return "";
  }
};

const translateGroup = (k) => {
  const map = {
    "bowl-base": "Base",
    "bowl-protein": "Proteína",
    "bowl-mixins": "Mix-ins",
    "bowl-sauce": "Salsa",
    "bowl-topping": "Toppings",
    "bowl-extras": "Extras",
    "sandwich-bread": "Pan",
    "sandwich-cheese": "Queso",
    "sandwich-protein": "Proteína",
    "sandwich-veggies": "Vegetales",
    "sandwich-sauce": "Salsa",
    "sandwich-extras": "Extras",
  };
  return map[k] || k.replace(/^.*?-/, '').replace(/^[a-z]/, c => c.toUpperCase());
};

const buildWaText = ({ items = [], total = 0, note = "" }) => {
  const mesa = getTable();
  const lines = ["*Pedido Alto Andino*"];
  if (mesa) lines.push(`Mesa: ${mesa}`);
  items.forEach((it, idx) => {
    const unit = getItemUnit(it);
    const qty = Number(it.qty || 1);
    const name = [it.name, it.variant].filter(Boolean).join(" · ");
    const itemTotal = unit * qty;
    lines.push(`• ${qty}× ${name} — ${formatCOP(itemTotal)}`);
    // Opciones por líneas
    const opts = it.options || {};
    if (Array.isArray(opts)) {
      if (opts.length) lines.push("  *Opciones:* " + opts.join(", "));
    } else {
      for (const [k, v] of Object.entries(opts)) {
        if (!v || (Array.isArray(v) && v.length === 0)) continue;
        const val = Array.isArray(v) ? v.join(", ") : v;
        lines.push(`  *${translateGroup(k)}:* ${val}`);
      }
    }
    if (it.milk) lines.push("  *Leche:* " + (MILK_OPTIONS.find((m) => m.id === it.milk)?.label || it.milk));
    if (it.note) lines.push("  _Nota:_ " + it.note);
    if (idx !== items.length - 1) lines.push("");
  });
  if (note) lines.push("_Nota general:_ " + note);
  lines.push("*Total:* " + formatCOP(total));
  return encodeURIComponent(lines.join("\n"));
};

const renderOptionsPills = (opts) => {
  if (!opts) return null;
  const parts = [];
  if (Array.isArray(opts)) {
    parts.push(...opts);
  } else if (typeof opts === "object") {
    for (const [k, v] of Object.entries(opts)) {
      if (Array.isArray(v)) {
        if (v.length > 0) {
          parts.push(`${translateGroup(k)}: ${v.join(", ")}`);
        }
      } else if (v) {
        parts.push(`${translateGroup(k)}: ${v}`);
      }
    }
  }
  
  if (!parts.length) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {parts.map((p, i) => (
        <span
          key={i}
          className="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-[11px] lg:text-xs font-semibold text-stone-600 ring-1 ring-inset ring-stone-200/80 shadow-sm"
        >
          {p}
        </span>
      ))}
    </div>
  );
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
  
  // Track open state of per-item note input
  const [openNoteIndex, setOpenNoteIndex] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const waNum = safeNum(import.meta.env.VITE_WHATSAPP || "573209009972");
  const waHref = items?.length
    ? `https://wa.me/${waNum}?text=${buildWaText({ items, total, note })}`
    : undefined;

  const handleConfirmOrder = async (e) => {
    e.preventDefault();
    if (!items.length) return;
    
    setIsSubmitting(true);
    try {
      const mesa = getTable();
      const origin = mesa ? 'table' : 'whatsapp';

      // 1. Get exact table_id if mesa string matches table_number
      let tableId = null;
      if (mesa) {
        const { data: tableData } = await supabase.from('restaurant_tables')
          .select('id').eq('table_number', mesa).single();
         if (tableData) tableId = tableData.id;
      }

      // 2. Insert Order
      const { data: orderData, error: orderError } = await supabase.from('orders')
        .insert([{
          status: 'new',
          origin: origin,
          table_id: tableId,
          total_amount: total,
          customer_name: '',
          customer_phone: ''
        }])
        .select()
        .single();
        
      if (orderError) throw orderError;

      // 3. Insert Order Items
      const orderItemsToInsert = items.map(it => ({
        order_id: orderData.id,
        product_id: it.id, 
        quantity: it.qty,
        unit_price: getItemUnit(it),
        modifiers: it.options || {},
        notes: it.note || ''
      }));

      const { error: itemsError } = await supabase.from('order_items')
        .insert(orderItemsToInsert);

      if (itemsError) throw itemsError;

      // 4. Handle Success
      try {
        const snapshot = { items, note, total };
        sessionStorage.setItem("aa_last_order", JSON.stringify(snapshot));
      } catch {}

      clearCart?.();
      onClose();

      if (origin === 'table') {
        toast.success("¡Pedido enviado a cocina exitosamente!");
      } else {
        toast.success("Pedido registrado. Abriendo WhatsApp...");
        if (waHref) window.open(waHref, '_blank');
      }

    } catch (err) {
      console.error('Error enviando pedido:', err);
      toast.error("Hubo un error al enviar el pedido. Por favor intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // setter flexible para nota por ítem
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
    toastFn("Carrito vaciado", {
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

  const getMilkLabel = (milkId) => {
    return MILK_OPTIONS.find((m) => m.id === milkId)?.label || milkId;
  };

  return (
    <>
      <div className="fixed inset-0 z-[100]">
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden
        />

        {/* Sheet / Drawer */}
        <div
          className="absolute inset-x-0 bottom-0 z-[100] mx-auto w-full max-w-md max-h-[calc(100dvh-40px)] rounded-t-[28px] bg-white shadow-[0_-8px_30px_-5px_rgba(0,0,0,0.1)] ring-1 ring-black/5 flex flex-col md:inset-x-auto md:inset-y-0 md:right-0 md:h-full md:max-h-none md:max-w-[560px] lg:max-w-[600px] md:rounded-none md:rounded-l-[32px] md:shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.15)] transition-all"
          role="dialog"
          aria-modal="true"
        >
          {/* Handle Mobile */}
          <div className="flex-shrink-0 pt-3 flex justify-center pb-2 md:hidden">
            <div className="h-1.5 w-12 rounded-full bg-neutral-300/80" />
          </div>

          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 pb-3 pt-3 md:px-6 md:pt-6 md:pb-4 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="bg-[#2f4131]/10 p-2 rounded-full hidden md:block">
                <Icon icon="heroicons:shopping-cart" className="h-6 w-6 text-[#2f4131]" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
                  Tu Pedido
                </h2>
                <p className="text-sm text-neutral-500 font-medium md:mt-0.5">
                  {items.length} {items.length === 1 ? "artículo" : "artículos"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearRequest}
                  className="rounded-full p-2.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors hidden md:flex"
                  aria-label="Vaciar carrito"
                  title="Vaciar carrito"
                >
                  <Icon icon="heroicons:trash" className="h-5 w-5" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-neutral-100 p-2 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 transition-colors"
                aria-label="Cerrar panel"
              >
                <Icon icon="heroicons:x-mark" className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </div>
          </div>

          {/* Lista scrolleable */}
          <div className="flex-1 overflow-y-auto bg-neutral-50/50 md:bg-white">
            {items.length ? (
              <div className="flex flex-col">
                {items.map((it, idx) => {
                  const unit = getItemUnit(it);
                  const qty = Number(it.qty || 1);
                  const lineTotal = unit * qty;
                  return (
                    <div key={idx} className="group relative border-b border-neutral-100/80 bg-white p-4 md:px-6 md:py-4 transition-colors hover:bg-neutral-50/50">
                      <div className="flex items-start gap-4 md:gap-5">
                        <AAImage
                          src={getProductImage(it)}
                          alt=""
                          aria-hidden="true"
                          className="h-16 w-16 md:h-20 md:w-20 flex-shrink-0 rounded-2xl object-cover shadow-sm bg-neutral-100 border border-neutral-200/50"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 pr-2">
                              <h3 className="text-base md:text-lg font-bold text-neutral-900 leading-tight">{it.name}</h3>
                              {it.variant && (
                                <p className="text-sm text-neutral-500 mt-0.5">{it.variant}</p>
                              )}
                            </div>
                            <div className="flex flex-col items-end">
                              <p className="whitespace-nowrap font-extrabold text-[#2f4131] md:text-lg">
                                {formatCOP(lineTotal)}
                              </p>
                              <button
                                type="button"
                                onClick={() => removeItem?.(it)}
                                className="mt-2 text-xs font-medium text-neutral-400 hover:text-red-500 transition-colors md:opacity-0 md:group-hover:opacity-100"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>

                          {/* Opciones extras (Modifiers) */}
                          <div className="mt-2">
                            {renderOptionsPills(it.options)}
                          </div>

                          {/* Leche */}
                          {it.milk && (
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span className="inline-flex items-center rounded-md bg-[#2f4131]/5 px-2 py-1 text-xs font-medium text-[#2f4131] border border-[#2f4131]/10">
                                🥛 Leche: {getMilkLabel(it.milk)}
                              </span>
                            </div>
                          )}

                          {/* Controles de cantidad y Notas */}
                          <div className="mt-4 flex items-center justify-between">
                            <div className="inline-flex items-center rounded-lg bg-neutral-100 p-0.5 border border-neutral-200">
                              <button
                                type="button"
                                onClick={() => handleDecrement(it, idx)}
                                className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-md bg-white text-neutral-600 shadow-sm border border-neutral-200/50 hover:text-neutral-900 hover:bg-neutral-50 active:scale-95 transition-all focus:outline-none"
                                aria-label="Restar"
                              >
                                -
                              </button>
                              <span className="w-10 text-center text-sm md:text-base font-bold text-neutral-900 tabular-nums">
                                {it.qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => increment?.(idx)}
                                className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-md bg-white text-neutral-600 shadow-sm border border-neutral-200/50 hover:text-neutral-900 hover:bg-neutral-50 active:scale-95 transition-all focus:outline-none"
                                aria-label="Sumar"
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => setOpenNoteIndex(openNoteIndex === idx ? null : idx)}
                              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                                it.note || openNoteIndex === idx
                                  ? "text-[#cba258] bg-[#cba258]/10"
                                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                              }`}
                            >
                              <Icon icon="heroicons:pencil" className="h-3.5 w-3.5" />
                              {it.note ? "Editar nota" : "Añadir nota"}
                            </button>
                          </div>

                          {/* Nota Toggleable */}
                          {(openNoteIndex === idx || it.note) && (
                            <div className="mt-3 overflow-hidden rounded-xl bg-amber-50/80 p-2.5 ring-1 ring-amber-200/50">
                              <input
                                type="text"
                                value={it.note || ""}
                                onChange={(e) => setItemNote(idx, e.target.value)}
                                placeholder="Ejem: sin cebolla, sin pitillo..."
                                className="w-full bg-transparent p-1 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none font-medium"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="rounded-full bg-neutral-50 p-6 mb-5 ring-1 ring-neutral-200/50">
                  <Icon icon="heroicons:shopping-bag" className="h-12 w-12 text-neutral-300" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">Tu carrito está vacío</h3>
                <p className="text-neutral-500 max-w-[260px] leading-relaxed">
                  ¿Aún no decides? Explora nuestro menú y encuentra algo delicioso.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-8 rounded-full bg-[#2f4131] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-[#2f4131]/20 hover:bg-[#202c21] hover:-translate-y-0.5 transition-all"
                >
                  Ver el menú
                </button>
              </div>
            )}

            {/* Nota general */}
            {items.length > 0 && (
              <div className="p-4 md:px-6 md:py-4 pb-6 md:pb-6">
                <div className="rounded-2xl bg-neutral-50 p-4 ring-1 ring-neutral-200/60 focus-within:ring-[#2f4131]/30 focus-within:bg-white transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="heroicons:document-text" className="h-4 w-4 text-neutral-400" />
                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Instrucciones Especiales</label>
                  </div>
                  <textarea
                    value={note ?? ""}
                    onChange={(e) => setNote?.(e.target.value)}
                    placeholder="Ej: Tráiganlo cuando lleguemos todos, pago en efectivo..."
                    className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none font-medium min-h-[50px] resize-none"
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer fijo (Receipt Style) */}
          {items.length > 0 && (
            <div className="flex-shrink-0 bg-white border-t border-neutral-100 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-10 relative">
              <div className="px-4 py-3 md:px-6 md:py-4 border-b border-neutral-100/60 border-dashed">
                 <div className="flex justify-between items-center mb-1">
                   <span className="text-sm text-neutral-500 font-medium">Subtotal</span>
                   <span className="text-sm font-semibold text-neutral-700">{formatCOP(total)}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm text-neutral-400">
                   <span>Sin costo de servicio</span>
                   <span>-</span>
                 </div>
              </div>
              
              <div
                className="px-4 pt-3 pb-3 md:px-6 md:pt-4 md:pb-4"
                style={{ paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 16px)" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-base md:text-lg font-bold text-neutral-900">Total</span>
                  <span className="text-2xl md:text-3xl font-black tracking-tight text-[#2f4131]">
                    {formatCOP(total)}
                   </span>
                </div>
                
                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={handleConfirmOrder}
                    disabled={isSubmitting || !items.length}
                    className={`flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl text-base font-bold shadow-lg transition-all active:scale-[0.98] ${
                      !isSubmitting && items.length
                        ? "bg-[#2f4131] hover:bg-[#202c21] text-white shadow-[#2f4131]/20 hover:-translate-y-0.5"
                        : "bg-neutral-100 text-neutral-400 shadow-none pointer-events-none"
                    }`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Icon icon="line-md:loading-loop" className="text-xl" />
                        Procesando...
                      </span>
                    ) : getTable() ? (
                      <>
                        <Icon icon="heroicons:bell-alert" className="text-xl" />
                        Enviar Pedido a Cocina
                      </>
                    ) : (
                      <>
                        <Icon icon="logos:whatsapp-icon" className="text-xl" />
                        Pedir por WhatsApp
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-12 w-full items-center justify-center rounded-xl text-sm font-bold text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                  >
                    Seguir pidiendo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Diálogo de Confirmación */}
      {confirmingClear && (
        <Portal>
          <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
            <div
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
              onClick={() => setConfirmingClear(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              className="relative z-10 w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 mb-4">
                <Icon icon="heroicons:trash" className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-center text-lg font-bold text-neutral-900 mb-2">
                ¿Vaciar todo el carrito?
              </h3>
              <p className="text-center text-sm text-neutral-500 mb-6">
                Esta acción eliminará todos los productos de tu pedido actual.
              </p>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmingClear(false)}
                  className="flex-1 rounded-xl bg-neutral-100 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  ref={confirmBtnRef}
                  onClick={clearCartNow}
                  className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-600 transition-colors"
                >
                  Vaciar carrito
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
