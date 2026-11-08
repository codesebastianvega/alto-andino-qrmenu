import { useState, useEffect, useRef } from "react";
import { useCart, getItemUnit } from "@/context/CartContext";
import { useMenuData } from "@/context/MenuDataContext";
import { useAuth } from "@/context/AuthContext";
import { useRestaurantSettings } from "@/hooks/useRestaurantSettings";
import { usePlan } from "@/hooks/usePlan";
import { isRestaurantOpen } from "@/utils/businessHours";
import { safeStorage as localStorage, safeSessionStorage as sessionStorage } from "@/utils/safeStorage";
import { createClientOrderId, submitOrderResilient } from "@/services/orderSync";
import { getFulfillmentModes } from "@/constants/businessTypes";
import { toast as toastFn } from "../../Toast";
import {
  toast,
  getTable,
  getLocationId,
  findTableRecord
} from "../cartDrawerHelpers";

export function useCartDrawer({ open, onClose } = {}) {
  const cart = useCart?.() || {};
  const { restaurantSettings, currentBusinessHours, activeBrandId, brand: menuBrand } = useMenuData();
  const { activeBrand } = useAuth();

  const brandId = activeBrandId || activeBrand?.id;
  const { isWithinOrderLimit } = usePlan(brandId);
  const isPOSMode = sessionStorage.getItem("aa_pos_mode") === "true";
  const brandName = restaurantSettings?.business_name || activeBrand?.name || "Aluna";

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
    updateItemNote: updateItemNoteCtx
  } = cart;

  const [confirmingClear, setConfirmingClear] = useState(false);
  const [includeTip, setIncludeTip] = useState(true);
  const { settings } = useRestaurantSettings();
  const isTipEnabled = settings?.is_service_fee_enabled === true;
  const tipPercentage = settings?.service_fee_percentage || 0;

  const [lastSnapshot, setLastSnapshot] = useState(null);
  const confirmBtnRef = useRef(null);

  // Track open state of per-item note input
  const [openNoteIndex, setOpenNoteIndex] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fulfillment modes & Business Type
  const fulfillmentModes = getFulfillmentModes(restaurantSettings || settings);
  const isDarkKitchen =
    fulfillmentModes.operations_model === "dark_kitchen" ||
    (fulfillmentModes.delivery && !fulfillmentModes.dine_in && !fulfillmentModes.takeaway);

  // Fulfillment states
  const initialMesa = getTable();
  const flowFromStorage = localStorage.getItem("aa_fulfillment_flow");
  const [fulfillmentType, setFulfillmentType] = useState(() => {
    if (flowFromStorage && (flowFromStorage === "takeaway" || flowFromStorage === "delivery")) {
      return flowFromStorage;
    }
    if (isDarkKitchen) return "delivery";
    if (initialMesa && fulfillmentModes.dine_in) return "dine_in";
    if (flowFromStorage && fulfillmentModes[flowFromStorage]) return flowFromStorage;
    if (fulfillmentModes.takeaway) return "takeaway";
    if (fulfillmentModes.delivery) return "delivery";
    return "dine_in";
  });

  // Delivery Address states
  const [deliveryAddress, setDeliveryAddress] = useState(() => {
    return localStorage.getItem("aa_delivery_address") || "";
  });
  const [deliveryNotes, setDeliveryNotes] = useState(() => {
    return localStorage.getItem("aa_delivery_notes") || "";
  });

  useEffect(() => {
    if (deliveryAddress) localStorage.setItem("aa_delivery_address", deliveryAddress);
  }, [deliveryAddress]);

  useEffect(() => {
    if (deliveryNotes) localStorage.setItem("aa_delivery_notes", deliveryNotes);
  }, [deliveryNotes]);

  // Sync fulfillmentType to storage
  useEffect(() => {
    if (fulfillmentType) {
      localStorage.setItem("aa_fulfillment_flow", fulfillmentType);
    }
  }, [fulfillmentType]);

  const [scheduledTime, setScheduledTime] = useState("");
  const [customerName, setCustomerName] = useState(() => {
    if (isPOSMode) return "Mostrador";
    return localStorage.getItem("aa_customer_name") || "";
  });
  const [customerPhone, setCustomerPhone] = useState(() => {
    if (isPOSMode) return "0000000";
    return localStorage.getItem("aa_customer_phone") || "";
  });
  const [showFulfillmentSelector, setShowFulfillmentSelector] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastOrderId, setLastOrderId] = useState("");

  const isLeadRequired =
    !isPOSMode &&
    (fulfillmentType === "takeaway" || fulfillmentType === "delivery" || fulfillmentType === "scheduled");
  const isAddressRequired = !isPOSMode && fulfillmentType === "delivery";
  const isLeadValid =
    !isLeadRequired ||
    (Boolean(customerName?.trim()) &&
      Boolean(customerPhone?.trim()) &&
      (!isAddressRequired || Boolean(deliveryAddress?.trim())));

  const packagingFeeTotal = items.reduce(
    (acc, it) => acc + (Number(it.packaging_fee) || 0) * (Number(it.qty) || 1),
    0
  );
  const serviceFeeAmount =
    isTipEnabled && includeTip ? Math.round(total * (tipPercentage / 100)) : 0;

  const finalTotal =
    fulfillmentType === "takeaway" || fulfillmentType === "delivery"
      ? total + packagingFeeTotal + serviceFeeAmount
      : total + serviceFeeAmount;

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
      }
    });
  };

  const handleConfirmOrder = async (e) => {
    e?.preventDefault();
    if (!items.length) return;

    setIsSubmitting(true);
    try {
      // 0. Check Business Hours
      const { isOpen, message } = isRestaurantOpen(currentBusinessHours, menuBrand?.config);
      if (!isOpen) {
        toast.error(message);
        setIsSubmitting(false);
        return;
      }

      // 0.1 Validate Order Limit (Skip for POS mode)
      if (!isWithinOrderLimit && !isPOSMode) {
        toast.error(
          "El restaurante ha alcanzado su límite de pedidos por este mes. Por favor, intenta de nuevo más tarde."
        );
        setIsSubmitting(false);
        return;
      }

      const mesa = getTable();

      // 1. Get exact table_id and location_id if dine_in
      let tableId = null;
      let orderLocationId = getLocationId();

      if (fulfillmentType === "dine_in" && mesa) {
        const tableData = await findTableRecord({
          mesa,
          brandId: brandId,
          locationId: orderLocationId
        });

        if (tableData) {
          tableId = tableData.id;
          if (tableData.location_id) orderLocationId = tableData.location_id;
        } else {
          console.warn("Table record not found for mesa:", mesa);
        }
      }

      // 2. Persist atomically. If offline, keep the complete order in IndexedDB.
      const formattedAddress = deliveryAddress?.trim();
      const formattedNotes = deliveryNotes?.trim();
      const fullCustomerName =
        fulfillmentType === "delivery" && formattedAddress
          ? `${customerName.trim()} [Dir: ${formattedAddress}${formattedNotes ? ` - ${formattedNotes}` : ""}]`
          : customerName.trim();

      const clientOrderId = createClientOrderId();
      const orderPayload = {
        brand_id: brandId,
        location_id: orderLocationId || null,
        status:
          fulfillmentType === "dine_in" || fulfillmentType === "takeaway"
            ? "new"
            : "waiting_payment",
        origin:
          fulfillmentType === "dine_in"
            ? "table"
            : fulfillmentType === "takeaway"
            ? "takeaway"
            : "delivery",
        fulfillment_type: fulfillmentType,
        table_id: tableId,
        total_amount: finalTotal,
        service_fee: serviceFeeAmount,
        customer_name: fullCustomerName || customerName,
        customer_phone: customerPhone,
        scheduled_time: scheduledTime || null
      };

      const orderItemsToInsert = items.map((it) => ({
        product_id: it.productId || it.id,
        brand_id: brandId,
        quantity: it.qty || 1,
        unit_price: getItemUnit(it),
        modifiers: it.options || {},
        notes: it.note || ""
      }));
      const result = await submitOrderResilient({
        clientOrderId,
        order: orderPayload,
        items: orderItemsToInsert
      });
      const persistedOrderId = result.orderId || clientOrderId;

      // 4. Handle Success
      const snapshot = { items, note, total, orderId: persistedOrderId, pendingSync: result.queued };
      localStorage.setItem("aa_last_order", JSON.stringify(snapshot));
      localStorage.setItem("aa_active_order", persistedOrderId);

      setLastOrderId(persistedOrderId);
      if (result.queued) toast.success("Pedido guardado sin internet. Se enviará al volver la conexión.");

      setShowSuccess(true);
    } catch (err) {
      console.error("Error enviando pedido:", err);
      toast.error("Hubo un error al enviar el pedido. Por favor intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
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

  return {
    // Data & Cart
    items,
    total,
    finalTotal,
    note,
    setNote,
    clearCart,
    increment,
    decrement,
    removeItem,
    setItemNote,

    // Metadata & Config
    brandId,
    brandName,
    isPOSMode,
    isWithinOrderLimit,
    currentBusinessHours,
    menuBrand,

    // Tip & Fees
    includeTip,
    setIncludeTip,
    isTipEnabled,
    tipPercentage,
    serviceFeeAmount,
    packagingFeeTotal,

    // Note input per-item
    openNoteIndex,
    setOpenNoteIndex,

    // Fulfillment
    fulfillmentModes,
    isDarkKitchen,
    fulfillmentType,
    setFulfillmentType,
    deliveryAddress,
    setDeliveryAddress,
    deliveryNotes,
    setDeliveryNotes,
    scheduledTime,
    setScheduledTime,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    showFulfillmentSelector,
    setShowFulfillmentSelector,

    // Validations & Submission
    isLeadRequired,
    isAddressRequired,
    isLeadValid,
    isSubmitting,
    showSuccess,
    setShowSuccess,
    lastOrderId,

    // Confirmation Clear
    confirmingClear,
    setConfirmingClear,
    confirmBtnRef,

    // Actions
    handleDecrement,
    handleClearRequest,
    clearCartNow,
    handleConfirmOrder
  };
}
