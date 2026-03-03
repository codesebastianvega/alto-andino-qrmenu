import React, { useEffect, useState, useRef, useMemo } from "react";
import { useCart, getItemUnit } from "@/context/CartContext";
import { useMenuData } from "@/context/MenuDataContext";
import Portal from "./Portal";
import { toast as toastFn } from "./Toast";
import { getProductImage } from "@/utils/images";
import { MILK_OPTIONS } from "@/config/milkOptions";
import { formatCOP } from "@/utils/money";
import AAImage from "@/components/ui/AAImage";
import { Icon } from "@iconify-icon/react";
import { supabase } from "@/config/supabase";
import { translateGroup } from "@/utils/formatters";

const toast = {
  success: (msg) => toastFn(msg, { duration: 3000 }),
  error: (msg) => toastFn(msg, { duration: 4000 })
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

export default function CartModal({ open, onClose }) {
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

  const { getAllProducts } = useMenuData();

  const [confirmingClear, setConfirmingClear] = useState(false);
  const [lastSnapshot, setLastSnapshot] = useState(null);
  const confirmBtnRef = useRef(null);
  
  // Track open state of per-item note input
  const [openNoteIndex, setOpenNoteIndex] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fulfillment states
  const initialMesa = getTable();
  const [fulfillmentType, setFulfillmentType] = useState(initialMesa ? 'dine_in' : 'takeaway');
  const [scheduledTime, setScheduledTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [showFulfillmentSelector, setShowFulfillmentSelector] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastOrderId, setLastOrderId] = useState("");

  const packagingFeeTotal = items.reduce((acc, it) => acc + ((Number(it.packaging_fee) || 0) * (Number(it.qty) || 1)), 0);

  // --- UPSELLING LOGIC ---
  const upsellProducts = useMemo(() => {
    if (!open) return [];
    
    // Todos los productos marcados como sugeridos
    const allUpsells = getAllProducts().filter(p => p.is_upsell === true);
    if (allUpsells.length === 0) return [];
    
    // IDs de productos en el carrito (para no sugerir lo que ya tienen)
    const cartIds = items.map(it => it.productId || it.id);
    
    // Filtrar los que no están en el carrito
    const availableUpsells = allUpsells.filter(p => !cartIds.includes(p.id));
    
    // Elegimos hasta 3 al azar o estáticos (por simplicidad, los primeros 3)
    // Para hacerlos aleatorios, podríamos usar sort(() => 0.5 - Math.random()) pero puede causar re-renders. 
    // Los dejaremos estáticos por ahora o ordenados aleatoriamente SOLO UNA VEZ al abrir.
    return availableUpsells.slice(0, 3);
  }, [items, open, getAllProducts]);

  const handleAddUpsell = (product) => {
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      packaging_fee: product.packaging_fee || 0,
      qty: 1,
      options: {}
    });
    toast.success(`${product.name} agregado al pedido.`);
  };
  // -------------------------

  const handleConfirmOrder = async (e) => {
    e.preventDefault();
    if (!items.length) return;
    
    setIsSubmitting(true);
    try {
      const mesa = getTable();
      
      let tableId = null;
      if (fulfillmentType === 'dine_in' && mesa) {
        const { data: tableData } = await supabase.from('restaurant_tables')
          .select('id').eq('table_number', mesa).single();
         if (tableData) tableId = tableData.id;
      }

      // 2. Insert Order
      const finalTotal = fulfillmentType === 'takeaway' || fulfillmentType === 'delivery' ? total + packagingFeeTotal : total;

      const { data: orderData, error: orderError } = await supabase.from('orders')
        .insert([{
          status: fulfillmentType === 'dine_in' ? 'new' : 'waiting_payment',
          origin: fulfillmentType === 'dine_in' ? 'table' : 'qr',
          fulfillment_type: fulfillmentType,
          table_id: tableId,
          total_amount: finalTotal,
          customer_name: customerName,
          customer_phone: customerPhone,
          scheduled_time: scheduledTime || null
        }])
        .select()
        .single();
        
      if (orderError) throw orderError;

      // 3. Insert Order Items (Including requires_kitchen logic)
      // Extraemos si el item requiere cocina (por defecto true)
      const allDBProducts = getAllProducts();
      
      const orderItemsToInsert = items.map(it => {
        // Encontrar el producto original para ver si requiere cocina
        const dbProd = allDBProducts.find(p => p.id === (it.productId || it.id));
        const requiresKitchen = dbProd ? (dbProd.requires_kitchen ?? true) : true;
        
        return {
          order_id: orderData.id,
          product_id: it.productId || it.id, 
          quantity: it.qty || 1,
          unit_price: getItemUnit(it),
          modifiers: it.options || {},
          notes: it.note || ''
        };
      });

      const { error: itemsError } = await supabase.from('order_items')
        .insert(orderItemsToInsert);

      if (itemsError) throw itemsError;
      
      // Bypass logic: Si TODO el pedido NO requiere cocina, podemos actualizar el status a ready.
      // (Bypass logic can also be handled as a database trigger or edge function, but we do it here for now)
      let needsKitchen = false;
      for (const it of items) {
        const dbProd = allDBProducts.find(p => p.id === (it.productId || it.id));
        const reqK = dbProd ? (dbProd.requires_kitchen ?? true) : true;
        if (reqK) {
          needsKitchen = true;
          break;
        }
      }
      
      if (!needsKitchen && fulfillmentType === 'dine_in') {
         await supabase.from('orders').update({ status: 'ready' }).eq('id', orderData.id);
      }

      // 4. Handle Success
      const snapshot = { items, note, total, orderId: orderData.id };
      localStorage.setItem("aa_last_order", JSON.stringify(snapshot));
      localStorage.setItem("aa_active_order", orderData.id);
      setLastOrderId(orderData.id);

      setShowSuccess(true);
      
    } catch (err) {
      console.error('Error enviando pedido:', err);
      toast.error("Hubo un error al enviar el pedido. Por favor intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden
        />

        {/* Modal Window */}
        <div
          className="relative w-full max-h-[85vh] sm:max-h-[85vh] rounded-t-[28px] sm:rounded-[32px] bg-white shadow-2xl flex flex-col sm:max-w-2xl md:max-w-4xl lg:max-w-5xl transition-all overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Handle Mobile */}
          <div className="flex-shrink-0 pt-3 flex justify-center pb-2 sm:hidden">
            <div className="h-1.5 w-12 rounded-full bg-neutral-300/80" />
          </div>

          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 pb-3 pt-3 sm:px-6 sm:pt-6 sm:pb-4 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="bg-[#2f4131]/10 p-2 rounded-full hidden sm:block">
                <Icon icon="heroicons:shopping-cart" className="h-6 w-6 text-[#2f4131]" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
                  Tu Pedido
                </h2>
                <p className="text-sm text-neutral-500 font-medium sm:mt-0.5">
                  {items.length} {items.length === 1 ? "artículo" : "artículos"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearRequest}
                  className="rounded-full p-2.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors hidden sm:flex"
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
                aria-label="Cerrar modal"
              >
                <Icon icon="heroicons:x-mark" className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>

          {/* Body Container */}
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
            {/* Left Column (Items) */}
            <div className="flex-1 overflow-y-auto bg-neutral-50/50 sm:bg-white relative flex flex-col">
            {items.length ? (
              <div className="flex flex-col">
                {items.map((it, idx) => {
                  const unit = getItemUnit(it);
                  const qty = Number(it.qty || 1);
                  const lineTotal = unit * qty;
                  return (
                    <div key={idx} className="group relative border-b border-neutral-100/80 bg-white p-4 sm:px-6 sm:py-4 transition-colors hover:bg-white/90">
                      <div className="flex items-start gap-4 sm:gap-5">
                        <AAImage
                          src={getProductImage(it)}
                          alt=""
                          aria-hidden="true"
                          className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 rounded-2xl object-cover shadow-sm bg-neutral-100 border border-neutral-200/50"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 pr-2">
                              <h3 className="text-base sm:text-lg font-bold text-neutral-900 leading-tight">{it.name}</h3>
                              {it.variant && (
                                <p className="text-sm text-neutral-500 mt-0.5">{it.variant}</p>
                              )}
                            </div>
                            <div className="flex flex-col items-end">
                              <p className="whitespace-nowrap font-extrabold text-[#2f4131] sm:text-lg">
                                {formatCOP(lineTotal)}
                              </p>
                              <button
                                type="button"
                                onClick={() => removeItem?.(it)}
                                className="mt-2 text-xs font-medium text-neutral-400 hover:text-red-500 transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>

                          {/* Opciones extras (Modifiers) */}
                          <div className="mt-2">
                            {renderOptionsPills(it.options)}
                          </div>

                          {/* Controles de cantidad y Notas */}
                          <div className="mt-4 flex items-center justify-between">
                            <div className="inline-flex items-center rounded-lg bg-neutral-100 p-0.5 border border-neutral-200">
                              <button
                                type="button"
                                onClick={() => handleDecrement(it, idx)}
                                className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md bg-white text-neutral-600 shadow-sm border border-neutral-200/50 hover:text-neutral-900 hover:bg-neutral-50 active:scale-95 transition-all focus:outline-none"
                              >-
                              </button>
                              <span className="w-10 text-center text-sm sm:text-base font-bold text-neutral-900 tabular-nums">
                                {it.qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => increment?.(idx)}
                                className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md bg-white text-neutral-600 shadow-sm border border-neutral-200/50 hover:text-neutral-900 hover:bg-neutral-50 active:scale-95 transition-all focus:outline-none"
                              >+
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
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-6">
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
              <div className="p-4 sm:px-6 sm:py-4 pb-6 sm:pb-6 mt-auto border-t border-neutral-100 bg-white">
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
          </div> {/* End Left Column */}

          {/* Right Column (Upselling + Footer) */}
          {items.length > 0 && (
            <div className="w-full md:w-[380px] lg:w-[420px] flex-shrink-0 flex flex-col bg-neutral-50 md:border-l border-neutral-200 z-10 relative">
              
              {/* Upselling Banner (Scrollable) */}
              <div className="flex-1 overflow-y-auto hidden md:block">
                {upsellProducts.length > 0 && !showFulfillmentSelector && (
                  <div className="bg-amber-50/40 py-5 px-4 sm:px-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-bold text-[#cba258] flex items-center gap-1.5 leading-tight">
                        <Icon icon="heroicons:sparkles" className="text-lg" />
                        ¿Acompañas tu pedido con esto?
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {upsellProducts.map(prod => (
                        <div key={prod.id} className="bg-white rounded-2xl p-3 shadow-sm border border-amber-100/60 flex items-center gap-3 transition-colors hover:border-amber-200">
                          <AAImage 
                            src={getProductImage(prod)} 
                            className="w-14 h-14 rounded-xl object-cover bg-neutral-100 shrink-0 border border-neutral-200/40" 
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-neutral-900 truncate" title={prod.name}>{prod.name}</p>
                            <p className="text-xs font-semibold text-[#2f4131]">{formatCOP(prod.price)}</p>
                          </div>
                          <button 
                            onClick={() => handleAddUpsell(prod)}
                            className="w-8 h-8 rounded-full bg-amber-100 text-[#cba258] flex items-center justify-center shrink-0 hover:bg-[#cba258] hover:text-white transition-colors active:scale-95"
                          >
                            <Icon icon="heroicons:plus" className="text-lg" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Upselling Banner Mobile (Only if open without sidebar) */}
              <div className="md:hidden">
                {upsellProducts.length > 0 && !showFulfillmentSelector && (
                  <div className="bg-amber-50/50 border-t border-amber-100/50 py-4 px-4 sm:px-6">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-bold text-[#cba258] flex items-center gap-1.5">
                        <Icon icon="heroicons:sparkles" className="text-lg" />
                        ¿Acompañas tu pedido con esto?
                      </h4>
                    </div>
                    
                    <div className="flex overflow-x-auto gap-3 pb-2 snap-x snap-mandatory hide-scrollbar">
                      {upsellProducts.map(prod => (
                        <div key={prod.id} className="bg-white rounded-2xl p-3 shadow-sm border border-amber-100/60 flex flex-col items-center flex-shrink-0 w-36 snap-start">
                          <AAImage 
                            src={getProductImage(prod)} 
                            className="w-full h-20 rounded-xl object-cover bg-neutral-100 shrink-0 mb-2 border border-neutral-200/40" 
                          />
                          <div className="text-center w-full mb-2">
                            <p className="text-[13px] font-bold text-neutral-900 truncate" title={prod.name}>{prod.name}</p>
                            <p className="text-[11px] font-bold text-[#2f4131]">{formatCOP(prod.price)}</p>
                          </div>
                          <button 
                            onClick={() => handleAddUpsell(prod)}
                            className="w-full h-8 rounded-xl bg-amber-100 text-[#cba258] flex items-center justify-center text-xs font-bold shrink-0 hover:bg-[#cba258] hover:text-white transition-colors active:scale-95 gap-1"
                          >
                            <Icon icon="heroicons:plus" className="text-sm" /> Agregar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer fijo (Receipt Style) */}
              <div className="flex-shrink-0 bg-white border-t border-neutral-100 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] transition-all">
              <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-neutral-100/60 border-dashed">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-neutral-500 font-medium">Subtotal</span>
                    <span className="text-sm font-semibold text-neutral-700">{formatCOP(total)}</span>
                  </div>
                  {packagingFeeTotal > 0 && (fulfillmentType === 'takeaway' || fulfillmentType === 'delivery') && (
                    <div className="flex justify-between items-center mb-1 animate-in fade-in slide-in-from-right-2">
                      <span className="text-sm text-neutral-500 font-medium">Empaque</span>
                      <span className="text-sm font-semibold text-neutral-700">{formatCOP(packagingFeeTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm text-neutral-400">
                    <span>Sin costo de servicio</span>
                    <span>-</span>
                  </div>
              </div>
              
              <div
                className="px-4 pt-3 pb-3 sm:px-6 sm:pt-4 sm:pb-4"
                style={{ paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 16px)" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-base sm:text-lg font-bold text-neutral-900">Total</span>
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#2f4131]">
                    {formatCOP(fulfillmentType === 'takeaway' || fulfillmentType === 'delivery' ? total + packagingFeeTotal : total)}
                   </span>
                </div>
                
                <div className="flex flex-col gap-2.5">
                  {!showFulfillmentSelector ? (
                    <button
                      type="button"
                      onClick={() => setShowFulfillmentSelector(true)}
                      disabled={!items.length}
                      className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl text-base font-bold shadow-lg bg-[#2f4131] hover:bg-[#202c21] text-white shadow-[#2f4131]/20 hover:-translate-y-0.5 transition-all active:scale-[0.98]"
                    >
                      Siguiente: Tipo de Pedido
                      <Icon icon="heroicons:arrow-right" className="text-xl" />
                    </button>
                  ) : (
                    <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-4 duration-300">
                      {/* Fulfillment Picker */}
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'dine_in', label: 'En Mesa', icon: 'heroicons:map-pin' },
                          { id: 'takeaway', label: 'Para Llevar', icon: 'heroicons:shopping-bag' },
                          { id: 'delivery', label: 'Domicilio', icon: 'heroicons:truck' },
                          { id: 'scheduled', label: 'Programado', icon: 'heroicons:calendar' }
                        ].map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setFulfillmentType(opt.id)}
                            className={`flex flex-col items-center justify-center py-2.5 rounded-xl border-2 transition-all gap-1 ${
                              fulfillmentType === opt.id 
                                ? "border-[#2f4131] bg-[#2f4131]/10 text-[#2f4131] shadow-sm scale-[1.02]" 
                                : "border-neutral-100 bg-neutral-50 text-neutral-500 grayscale opacity-70"
                            }`}
                          >
                            <Icon icon={opt.icon} className="text-xl" />
                            <span className="text-[10px] font-bold uppercase">{opt.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Dynamic Inputs based on selection */}
                      {fulfillmentType === 'scheduled' && (
                        <input 
                          type="datetime-local" 
                          value={scheduledTime}
                          onChange={e => setScheduledTime(e.target.value)}
                          className="w-full h-11 px-4 rounded-xl border border-neutral-200 text-sm font-medium focus:ring-2 focus:ring-[#2f4131]/20 focus:border-[#2f4131] transition-all"
                        />
                      )}

                      {(fulfillmentType === 'delivery' || fulfillmentType === 'takeaway' || fulfillmentType === 'scheduled') && (
                        <div className="flex gap-2">
                           <input 
                            type="text" 
                            placeholder="Nombre"
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            className="flex-1 h-11 px-4 rounded-xl border border-neutral-200 text-sm font-medium focus:ring-2 focus:ring-[#2f4131]/20 focus:border-[#2f4131]"
                          />
                          <input 
                            type="tel" 
                            placeholder="Teléfono"
                            value={customerPhone}
                            onChange={e => setCustomerPhone(e.target.value)}
                            className="w-1/3 h-11 px-4 rounded-xl border border-neutral-200 text-sm font-medium focus:ring-2 focus:ring-[#2f4131]/20 focus:border-[#2f4131]"
                          />
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowFulfillmentSelector(false)}
                          className="w-12 h-14 flex items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors"
                        >
                          <Icon icon="heroicons:arrow-left" className="text-xl" />
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmOrder}
                          disabled={isSubmitting}
                          className="flex-1 h-14 bg-[#2f4131] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#2f4131]/20 active:scale-95 transition-all"
                        >
                          {isSubmitting ? (
                            <Icon icon="line-md:loading-loop" className="text-xl" />
                          ) : (
                            <>
                              <Icon icon="heroicons:sparkles" className="text-xl" />
                              Confirmar Pedido
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {!showFulfillmentSelector && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex h-12 w-full items-center justify-center rounded-xl text-sm font-bold text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                    >
                      Seguir pidiendo
                    </button>
                  )}
                </div>
              </div>
             </div>
            </div>
          )}
          </div> {/* End Body Container */}
          
          {/* Full-drawer Success View */}
          {showSuccess && (
            <div className="absolute inset-0 z-[200] bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300 rounded-t-[28px] sm:rounded-[32px]">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 scale-animation">
                <Icon icon="heroicons:check-badge" className="text-5xl text-green-600" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-3">¡Pedido Recibido!</h3>
              <p className="text-gray-500 mb-8 max-w-[280px]">
                Tu pedido <span className="font-bold text-gray-900">#{lastOrderId?.slice(0, 4).toUpperCase()}</span> ha sido registrado. {fulfillmentType === 'dine_in' ? 'En breve lo pasaremos a cocina para prepararlo.' : 'Por favor completa el pago para iniciar la preparación.'}
              </p>
              
              <button
                type="button"
                onClick={() => {
                  window.location.href = `#order/${lastOrderId}`;
                  onClose();
                  setShowSuccess(false);
                  clearCart?.();
                }}
                className="w-full h-14 bg-orange-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-100 mb-4 hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
              >
                Seguir Mi Pedido <Icon icon="heroicons:arrow-right" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSuccess(false);
                  clearCart?.();
                  onClose();
                }}
                className="w-full h-14 bg-[#2f4131] text-white rounded-2xl font-bold text-lg mb-4 hover:bg-[#202c21] transition-colors"
              >
                Cerrar Menú
              </button>
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
    </Portal>
  );
}
