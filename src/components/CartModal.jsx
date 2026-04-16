import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useCart, getItemUnit } from "@/context/CartContext";
import { useMenuData } from "@/context/MenuDataContext";
import Portal from "./Portal";
import { toast as toastFn } from "./Toast";
import { getProductImage } from "@/utils/images";
import { MILK_OPTIONS } from "@/config/milkOptions";
import { formatCOP } from "@/utils/money";
import AAImage from "@/components/ui/AAImage";
import { Icon } from "@iconify-icon/react";
import QRCode from "react-qr-code";
import { supabase } from "@/config/supabase";
import { translateGroup } from "@/utils/formatters";
import { useRestaurantSettings } from "@/hooks/useRestaurantSettings";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";

// --- ANALYTICS HELPER ---
const trackEvent = async (eventName, metadata = {}) => {
  try {
    const sessionId = localStorage.getItem('aluna_session_id');
    const { error } = await supabase.from('analytics_events').insert([{
      event_name: eventName,
      session_id: sessionId,
      user_agent: navigator.userAgent,
      metadata: metadata,
      table_id: metadata.tableId || null
    }]);
    if (error) console.error('Error tracking event:', error);
  } catch (e) {
    console.warn('Tracking failed:', e);
  }
};


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

  const { brandSlug } = useParams();
  const { getAllProducts, hasFeature, activeBrandId } = useMenuData();
  const { paymentMethods, loading: loadingPayments } = usePaymentMethods(activeBrandId);
  const activeMethods = useMemo(() => paymentMethods.filter(m => m.is_active), [paymentMethods]);
  
  const allDBProducts = useMemo(() => getAllProducts(), [getAllProducts]);

  const [includeTip, setIncludeTip] = useState(true);
  const { settings } = useRestaurantSettings();
  const isTipEnabled = settings?.is_service_fee_enabled === true;
  const tipPercentage = settings?.service_fee_percentage || 0;

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
  const isPOSMode = sessionStorage.getItem("aa_pos_mode") === "true";
  const manualType = sessionStorage.getItem("aa_manual_type");

  const [paymentMethod, setPaymentMethod] = useState("");
  const [customerName, setCustomerName] = useState(isPOSMode ? "Mostrador" : "");
  const [customerPhone, setCustomerPhone] = useState(isPOSMode ? "0000000" : "");
  const [customerId, setCustomerId] = useState(null);
  const [showFulfillmentSelector, setShowFulfillmentSelector] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastOrderId, setLastOrderId] = useState("");
  const [isPaid, setIsPaid] = useState(false);

  const isLeadRequired = !isPOSMode && (fulfillmentType === 'takeaway' || fulfillmentType === 'delivery' || fulfillmentType === 'scheduled');
  const isLeadValid = !isLeadRequired || (customerName?.trim() && customerPhone?.trim());

  // Si estamos en POS y es manual (Takeaway/Delivery), forzamos el tipo
  useEffect(() => {
    if (isPOSMode && manualType) {
      setFulfillmentType(manualType);
    } else if (initialMesa) {
      setFulfillmentType('dine_in');
    }

    // Load customer from session if set by Admin (Waiter)
    const storedCustomer = sessionStorage.getItem("aa_current_customer");
    if (storedCustomer) {
      try {
        const c = JSON.parse(storedCustomer);
        setCustomerName(c.name || "");
        setCustomerPhone(c.phone || "");
        setCustomerId(c.id || null);
      } catch (e) {
        console.error("Error parsing stored customer:", e);
      }
    }
  }, [isPOSMode, manualType, initialMesa, open]);

  useEffect(() => {
    if (activeMethods.length > 0 && !paymentMethod) {
      setPaymentMethod(activeMethods[0].id);
    }
  }, [activeMethods, paymentMethod]);

  const packagingFeeTotal = items.reduce((acc, it) => acc + ((Number(it.packaging_fee) || 0) * (Number(it.qty) || 1)), 0);
  const serviceFeeAmount = (isTipEnabled && includeTip) ? Math.round(total * (tipPercentage / 100)) : 0;

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
      image_url: product.image_url || product.image,
      packaging_fee: product.packaging_fee || 0,
      qty: 1,
      options: {}
    });
    toast.success(`${product.name} agregado al pedido.`);
  };
  // -------------------------

  const handleConfirmOrder = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Validate lead info for POS (Defaults are handled in state initialization)
      // Removed manual validation that required name/phone for POS takeaway/delivery

      const mesa = getTable();
      let tableId = null;

      // Prioritize direct table ID from sessionStorage (set by AdminWaiter)
      const sessionTableId = sessionStorage.getItem("aa_current_table_id");
      
      if (sessionTableId && sessionTableId !== "null") {
        tableId = sessionTableId;
      } else if (fulfillmentType === 'dine_in' && mesa) {
        // Fallback to table_number lookup
        const { data: tableData } = await supabase.from('restaurant_tables')
          .select('id')
          .eq('table_number', mesa)
          .eq('brand_id', activeBrandId)
          .limit(1)
          .maybeSingle();
         if (tableData) tableId = tableData.id;
      }

      // 2. Insert or Update Order
      const finalTotal = fulfillmentType === 'takeaway' || fulfillmentType === 'delivery' ? total + packagingFeeTotal + serviceFeeAmount : total + serviceFeeAmount;

      // Status logic: Dine-in and Takeaway go straight to kitchen ('new').
      // Only Delivery needs to wait for payment confirmation ('waiting_payment') unless already paid.
      let orderStatus = 'new';
      if (fulfillmentType === 'delivery' && !isPaid) {
        orderStatus = 'waiting_payment';
      } else {
        orderStatus = 'new';
      }

      let orderData = null;

      // Try to find an existing active order for this table to merge items
      if (tableId) {
        const { data: existingOrder } = await supabase.from('orders')
          .select('*')
          .eq('table_id', tableId)
          .eq('brand_id', activeBrandId)
          .in('status', ['waiting_payment', 'new', 'preparing', 'ready'])
          .limit(1)
          .maybeSingle();
        
        if (existingOrder) {
          // If we found an existing order, update its total and use its data
          // Always reset status to 'new' when adding items to an existing order
          // to ensure kitchen notification triggers correctly for the new items.
          const updatePayload = {
            total_amount: Number(existingOrder.total_amount) + Number(finalTotal),
            service_fee: Number(existingOrder.service_fee || 0) + Number(serviceFeeAmount),
            status: 'new'
          };

          const { data: updatedOrder, error: updateError } = await supabase.from('orders')
            .update(updatePayload)
            .eq('id', existingOrder.id)
            .select()
            .single();
          
          if (updateError) throw updateError;
          orderData = updatedOrder;
          console.log("✅ Pedido fusionado con orden existente:", orderData.id);
        }
      }

      // If no existing order was found (or not applicable), create a new one
      if (!orderData) {
        const { data: newOrder, error: orderError } = await supabase.from('orders')
          .insert([{
            status: orderStatus,
            origin: fulfillmentType === 'dine_in' ? 'table' : 'takeaway',
            fulfillment_type: fulfillmentType,
            table_id: tableId,
            brand_id: activeBrandId,
            total_amount: finalTotal,
            service_fee: serviceFeeAmount,
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_id: customerId,
            scheduled_time: scheduledTime || null,
            payment_status: isPaid ? 'paid' : 'pending',
            payment_method: isPaid ? paymentMethod : null
          }])
          .select()
          .single();
          
        if (orderError) throw orderError;
        orderData = newOrder;
        console.log("✅ Nueva orden creada:", orderData.id);
      }

      // 3. Insert Order Items (Including requires_kitchen logic)
      // Extraemos si el item requiere cocina (por defecto true)
      const allDBProducts = getAllProducts();
      
      const orderItemsToInsert = items.map(it => {
        // Encontrar el producto original para ver si requiere cocina
        const pid = it.productId || it.id;
        
        // UUID Validation & Recovery
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        let validatedPid = pid;

        if (!uuidRegex.test(pid)) {
          console.warn(`Invalid UUID detected for item: ${it.name}. Attempting recovery...`);
          // Try to find the correct UUID by name from database items
          const dbMatch = allDBProducts.find(p => 
            p.name.toLowerCase() === it.name.toLowerCase() || 
            (it.name.includes("Cumbre") && p.name.includes("Cumbre"))
          );
          
          if (dbMatch && uuidRegex.test(dbMatch.id)) {
            validatedPid = dbMatch.id;
            console.log(`Recovered UUID for ${it.name}: ${validatedPid}`);
          } else {
            console.error(`Could not recover valid UUID for ${it.name}. Database submission may fail.`);
          }
        }

        const dbProd = allDBProducts.find(p => p.id === validatedPid);
        const requiresKitchen = dbProd ? (dbProd.requires_kitchen ?? true) : true;
        
        return {
          order_id: orderData.id,
          product_id: validatedPid, 
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

      // --- WHATSAPP REDIRECTION (Emprendedor Plan) ---
      // SKIP in POS mode to avoid interrupting staff workflow
      /* REDIRECTION DISABLED AS REQUESTED
      if (hasFeature('whatsapp_orders') && !isPOSMode) {
        // ... (existing WhatsApp logic)
      }
      */
      // -----------------------------------------------

      if (typeof clearCart === 'function') {
        clearCart();
      }
      setShowSuccess(true);
      
      // Track Conversion
      trackEvent('order_completed', { 
        orderId: orderData.id, 
        brandId: activeBrandId,
        total: finalTotal,
        fulfillmentType: fulfillmentType,
        paymentMethod: paymentMethod || 'unspecified'
      });
      
    } catch (err) {
      console.error('Error enviando pedido:', err);
      toast.error("Hubo un error al enviar el pedido. Por favor intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const setItemNote =
    setItemNoteCtx || updateItemNoteCtx || ((index, value) => updateItem?.(index, { note: value }));

  const resetStates = () => {
    setCustomerName(isPOSMode ? "Mostrador" : "");
    setCustomerPhone(isPOSMode ? "0000000" : "");
    setCustomerId(null);
    setScheduledTime("");
    setIsPaid(false);
    setPaymentMethod("cash");
    setShowFulfillmentSelector(false);
    sessionStorage.removeItem("aa_current_customer");
  };

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
      <>
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden
        />

        {/* Modal Window */}
        <div
          className={`relative w-full h-[100dvh] sm:h-auto ${showSuccess ? 'sm:min-h-[750px]' : 'sm:max-h-[85vh]'} rounded-none sm:rounded-[32px] bg-white shadow-2xl flex flex-col sm:max-w-2xl md:max-w-4xl lg:max-w-5xl transition-all overflow-hidden`}
          role="dialog"
          aria-modal="true"
        >

          {/* Header */}
          <div 
            className="flex-shrink-0 flex items-center justify-between px-4 pb-3 pt-4 sm:px-6 sm:pt-6 sm:pb-4 border-b border-neutral-100"
            style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
          >
            <div className="flex items-center gap-3">
              <div className="bg-[#2f4131]/10 p-2 rounded-full hidden sm:flex items-center justify-center">
                <Icon icon="heroicons:shopping-cart" className="text-[24px] text-[#2f4131]" />
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
                  <Icon icon="heroicons:trash" className="text-[20px]" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-neutral-100 p-2 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 transition-colors"
                aria-label="Cerrar modal"
              >
                <Icon icon="heroicons:x-mark" className="text-[20px] sm:text-[24px]" />
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
                  // Resolve image: try item first, then look up from DB products
                  const dbProduct = allDBProducts.find(p => p.id === (it.productId || it.id));
                  const itemForImage = { ...it, image_url: it.image_url || it.image || dbProduct?.image_url };
                  const imageSrc = getProductImage(itemForImage);
                  return (
                    <div key={idx} className="group relative border-b border-neutral-100/80 bg-white p-4 sm:px-6 sm:py-4 transition-colors hover:bg-white/90">
                      <div className="flex items-start gap-4 sm:gap-5">
                        {imageSrc ? (
                          <AAImage
                            src={imageSrc}
                            alt=""
                            aria-hidden="true"
                            className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 rounded-2xl object-cover shadow-sm bg-neutral-100 border border-neutral-200/50"
                          />
                        ) : (
                          <div className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 rounded-2xl bg-neutral-100 border border-neutral-200/50 flex items-center justify-center">
                            <Icon icon="heroicons:photo" className="w-6 h-6 text-neutral-300" />
                          </div>
                        )}

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

            {/* Upselling Banner Mobile (Inside scrollable left column) */}
            <div className="md:hidden mt-auto">
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
          </div>
          
          {/* Right Column (Upselling + Footer) - Visible only on Desktop */}
          {items.length > 0 && (
            <div className="hidden md:flex w-full md:w-[380px] lg:w-[420px] flex-shrink-0 flex flex-col bg-neutral-50 md:border-l border-neutral-200 z-10 relative">
              
              {/* Upselling Banner (Scrollable) */}
              <div className="flex-1 overflow-y-auto">
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
                  {isTipEnabled && (
                    <div className="flex justify-between items-center mb-1">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input 
                            type="checkbox" 
                            checked={includeTip} 
                            onChange={(e) => setIncludeTip(e.target.checked)}
                            className="w-4 h-4 text-[#2f4131] bg-gray-100 border-gray-300 rounded focus:ring-[#2f4131] cursor-pointer"
                          />
                        </div>
                        <span className="text-sm text-neutral-500 font-medium group-hover:text-neutral-700 transition-colors">
                          Incluir servicio voluntario ({tipPercentage}%)
                        </span>
                      </label>
                      <span className="text-sm font-semibold text-neutral-700">
                        {includeTip ? formatCOP(serviceFeeAmount) : '-'}
                      </span>
                    </div>
                  )}
                  {!isTipEnabled && (
                    <div className="flex justify-between items-center text-sm text-neutral-400">
                      <span>Sin costo de servicio</span>
                      <span>-</span>
                    </div>
                  )}
                </div>
                
                <div
                  className="px-4 pt-3 pb-3 sm:px-6 sm:pt-4 sm:pb-4"
                  style={{ paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 16px)" }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-base sm:text-lg font-bold text-neutral-900">Total</span>
                    <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#2f4131]">
                      {formatCOP(fulfillmentType === 'takeaway' || fulfillmentType === 'delivery' ? total + packagingFeeTotal + serviceFeeAmount : total + serviceFeeAmount)}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-2.5">
                    {!showFulfillmentSelector && !initialMesa && !isPOSMode ? (
                      <button
                        type="button"
                        onClick={() => setShowFulfillmentSelector(true)}
                        disabled={!items.length}
                        className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl text-base font-bold shadow-lg bg-[#2f4131] hover:bg-[#202c21] text-white shadow-[#2f4131]/20 hover:-translate-y-0.5 transition-all active:scale-[0.98]"
                      >
                        Siguiente: Tipo de Pedido
                        <Icon icon="heroicons:arrow-right" className="text-xl" />
                      </button>
                    ) : !showFulfillmentSelector && (initialMesa || isPOSMode) ? (
                      <button
                        type="button"
                        onClick={handleConfirmOrder}
                        disabled={isSubmitting || !items.length || !isLeadValid}
                        className={`flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl text-base font-bold shadow-lg transition-all active:scale-[0.98] ${
                          !isLeadValid || isSubmitting
                          ? "bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none"
                          : "bg-[#2f4131] hover:bg-[#202c21] text-white shadow-[#2f4131]/20 hover:-translate-y-0.5"
                        }`}
                      >
                        {isSubmitting ? (
                          <Icon icon="line-md:loading-loop" className="text-xl" />
                        ) : (
                          <>
                            <Icon icon="heroicons:sparkles" className="text-xl" />
                            {isPOSMode ? "Confirmar y Comandar" : "Confirmar Pedido"}
                          </>
                        )}
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

                        {fulfillmentType === 'scheduled' && (
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1">Fecha y Hora</label>
                            <input 
                              type="datetime-local" 
                              value={scheduledTime}
                              onChange={e => setScheduledTime(e.target.value)}
                              className="w-full h-11 px-4 rounded-xl border border-neutral-200 text-sm font-medium focus:ring-2 focus:ring-[#2f4131]/20 focus:border-[#2f4131] transition-all bg-white"
                            />
                          </div>
                        )}

                        {/* Unified Customer Leads Section */}
                        {isLeadRequired && (
                          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 shadow-sm animate-in slide-in-from-top-2 space-y-3">
                            <div className="flex items-center justify-between px-1">
                              <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Datos de Contacto</label>
                              <span className="text-[10px] font-bold text-amber-500 bg-white px-2 py-0.5 rounded-full border border-amber-100">REQUERIDO</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                               <div className="flex items-center gap-2 bg-white px-3 h-11 rounded-xl border border-amber-200 focus-within:ring-2 focus-within:ring-amber-200/50 transition-all">
                                  <Icon icon="heroicons:user" className="text-amber-400" />
                                  <input 
                                    type="text" 
                                    placeholder="Nombre Completo"
                                    value={customerName || ""}
                                    onChange={e => setCustomerName(e.target.value)}
                                    className="flex-1 h-full text-sm font-semibold text-neutral-800 placeholder:text-neutral-300 outline-none bg-transparent"
                                  />
                               </div>
                               <div className="flex items-center gap-2 bg-white px-3 h-11 rounded-xl border border-amber-200 focus-within:ring-2 focus-within:ring-amber-200/50 transition-all">
                                  <Icon icon="heroicons:phone" className="text-amber-400" />
                                  <input 
                                    type="tel" 
                                    placeholder="Celular / WhatsApp"
                                    value={customerPhone || ""}
                                    onChange={e => setCustomerPhone(e.target.value)}
                                    className="flex-1 h-full text-sm font-semibold text-neutral-800 placeholder:text-neutral-300 outline-none bg-transparent"
                                  />
                               </div>
                            </div>
                          </div>
                        )}
                        
                        {isPOSMode && (
                          <div className="flex flex-col gap-3 p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                            <div className="flex items-center justify-between">
                              <label htmlFor="paid-toggle" className={`text-xs font-black cursor-pointer transition-colors uppercase tracking-widest ${isPaid ? 'text-emerald-600' : 'text-neutral-500'}`}>
                                {isPaid ? "PAGO RECIBIDO" : "PENDIENTE DE PAGO"}
                              </label>
                              <div className="relative inline-flex items-center cursor-pointer">
                                <input 
                                  id="paid-toggle"
                                  type="checkbox"
                                  checked={isPaid}
                                  onChange={(e) => setIsPaid(e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                              </div>
                            </div>

                            {isPaid && (
                              <div className="pt-3 border-t border-neutral-200 animate-in fade-in slide-in-from-top-2">
                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Método de Pago</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {activeMethods.length > 0 ? (
                                    activeMethods.map(method => (
                                      <button
                                        key={method.id}
                                        type="button"
                                        onClick={() => setPaymentMethod(method.id)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                                          paymentMethod === method.id 
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' 
                                            : 'bg-white border-neutral-200 text-neutral-500 hover:border-neutral-300'
                                        }`}
                                      >
                                        <Icon icon={method.icon || 'heroicons:banknotes'} className="text-sm" />
                                        {method.name}
                                      </button>
                                    ))
                                  ) : (
                                    <div className="col-span-2 py-2 text-center text-[10px] text-neutral-400 bg-neutral-50 rounded-lg border border-dashed border-neutral-200 uppercase font-black">
                                      Sin métodos de pago
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
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
                            disabled={isSubmitting || !isLeadValid}
                            className={`flex-1 h-14 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                              !isLeadValid || isSubmitting
                              ? "bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none"
                              : "bg-[#2f4131] text-white shadow-[#2f4131]/20"
                            }`}
                          >
                            {isSubmitting ? (
                              <Icon icon="line-md:loading-loop" className="text-xl" />
                            ) : (
                              <>
                                <Icon icon="heroicons:sparkles" className="text-xl" />
                                {isPOSMode ? "Confirmar y Comandar" : "Confirmar Pedido"}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
          
          {/* Full-drawer Success View */}
          {showSuccess && (
            <div className="absolute inset-0 z-[200] bg-white flex flex-col items-center justify-start sm:justify-center p-8 text-center animate-in fade-in zoom-in duration-300 rounded-t-[28px] sm:rounded-[32px] overflow-y-auto overflow-x-hidden min-h-[500px]">
                <div className="flex flex-col items-center justify-center py-6 sm:py-10 px-6 text-center space-y-6 sm:space-y-8 animate-in fade-in zoom-in duration-300 w-full max-w-md mx-auto">
                    <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 shadow-sm shadow-emerald-100/50">
                      <Icon icon="solar:check-circle-bold" className="text-6xl" />
                    </div>
                    
                    <div className="space-y-2">
                      <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
                        {isPOSMode ? "¡Pedido Comandado!" : "¡Pedido Recibido!"}
                      </h2>
                      <p className="text-gray-500 font-medium text-lg">
                        Tu pedido <span className="text-gray-900 font-black text-xl">#{lastOrderId ? lastOrderId.slice(-4).toUpperCase() : ""}</span> ha sido registrado.
                      </p>
                    </div>
                      
                    {/* Mesa o Cliente info */}
                    {(fulfillmentType === 'dine_in' && getTable()) && (
                      <div className="mt-4 inline-flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mesa</span>
                        <span className="text-lg font-black text-brand-primary">{getTable()}</span>
                      </div>
                    )}
                    {isPOSMode && (
                      <div className="mt-8 p-6 sm:p-10 bg-white border border-gray-100 rounded-[3rem] shadow-2xl shadow-black/5 flex flex-col items-center gap-6 animate-in slide-in-from-bottom-6 delay-150 duration-700 w-full">
                        <div className="flex flex-col items-center gap-1.5">
                          <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em]">QR Seguimiento Cliente</p>
                          <p className="text-sm font-medium text-gray-400">Escanea para seguir el estado en tiempo real</p>
                        </div>
                        <div className="p-8 bg-white rounded-[2.5rem] ring-[12px] ring-gray-50/50 flex items-center justify-center shadow-inner">
                          <div className="relative">
                            <QRCode 
                              value={`${window.location.origin}/${brandSlug}/#order/${lastOrderId}`}
                              size={220}
                              level="H"
                              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {!isPOSMode && fulfillmentType !== 'dine_in' && (
                      <p className="text-sm text-gray-400 mt-4 leading-relaxed">
                        Por favor completa el pago para <br/> iniciar la preparación.
                      </p>
                    )}
                </div>

                <div className="w-full space-y-3">
                  {isPOSMode ? (
                    <>
                      <button
                        onClick={() => {
                          clearCart();
                          resetStates();
                          sessionStorage.removeItem("aa_current_mesa");
                          sessionStorage.removeItem("aa_pos_mode");
                          sessionStorage.removeItem("aa_manual_type");
                          const targetUrl = `/${brandSlug}/?admin_page=waiter#admin`;
                          window.location.href = targetUrl;
                        }}
                        className="w-full bg-gray-900 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-black/10 hover:bg-black"
                      >
                        <Icon icon="solar:hamburger-menu-bold" className="text-xl" />
                        Ir al Mapa de Mesas
                      </button>
                      
                      <button
                        onClick={() => {
                          clearCart();
                          resetStates();
                          setShowSuccess(false);
                          onClose();
                        }}
                        className="w-full bg-white text-gray-900 border-2 border-gray-100 py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 hover:bg-gray-50 hover:border-gray-200"
                      >
                        <Icon icon="solar:camera-add-bold" className="text-xl" />
                        Tomar Nuevo Pedido
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          window.location.href = `#order/${lastOrderId}`;
                          setShowSuccess(false);
                        }}
                        className="w-full bg-brand-primary text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-brand-primary/20"
                      >
                        Seguir Mi Pedido
                        <Icon icon="solar:arrow-right-line-duotone" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowSuccess(false);
                          onClose();
                        }}
                        className="w-full py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors"
                      >
                        Cerrar Menú
                      </button>
                    </>
                  )}
                </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Diálogo de Confirmación */}
      {confirmingClear && (
        <Portal>
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
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
    </Portal>
  );
}
