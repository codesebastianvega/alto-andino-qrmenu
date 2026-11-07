import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useCart, getItemUnit } from "@/context/CartContext";
import { useMenuData } from "@/context/MenuDataContext";
import { formatCOP } from "@/utils/money";
import { supabase } from "@/config/supabase";
import { normalizeWhatsAppNumber } from "@/utils/formatters";
import { resolveOrCreateCustomer } from "@/utils/customerSync";
import { useRestaurantSettings } from "@/hooks/useRestaurantSettings";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useLocationPayments } from "@/hooks/useLocationPayments";
import { usePlan } from "@/hooks/usePlan";
import { trackAnalyticsEvent } from "@/utils/analytics";
import { isRestaurantOpen } from "@/utils/businessHours";
import { 
  hasValidPauseClaim, 
  getPendingPauseCoupon, 
  hasCrmRecoveryStamp, 
  hasDeviceUsedCoupon, 
  markCouponUsedOnDevice 
} from "@/utils/couponSecurity";
import {
  getConfiguredMealPlans,
  findSubscriberPlan,
  getActiveMemberSession,
  fetchPlanUsage,
  buildPlanPromoObject
} from "@/utils/mealPlans";
import { safeStorage as localStorage, safeSessionStorage as sessionStorage } from "@/utils/safeStorage";
import { createClientOrderId, submitOrderResilient } from "@/services/orderSync";
import { getFulfillmentModes } from "@/constants/businessTypes";
import { sendTelegramOrderNotification } from "@/utils/telegramNotify";
import { getTable, getLocationId, findTableRecord, cartToast as toast } from "../helpers/cartHelpers";
import { toast as toastFn } from "@/components/Toast";

export function useCartCheckout({ open, onClose }) {
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
  const { 
    getAllProducts, 
    hasFeature, 
    activeBrandId, 
    currentLocation: contextLocation, 
    locations, 
    businessHours, 
    currentBusinessHours, 
    storeStatusInfo, 
    restaurantSettings: menuRestaurantSettings, 
    freeDeliveryPromo, 
    activePromotions, 
    brand: menuBrand 
  } = useMenuData() || {};

  const { paymentMethods = [], loading: loadingPayments } = usePaymentMethods(activeBrandId);
  const { isWithinOrderLimit } = usePlan(activeBrandId);
  
  // Localized Settings & Payments
  const [currentLocationId, setCurrentLocationId] = useState(null);
  const [localLocation, setLocalLocation] = useState(null);
  const { locationPayments = [], loading: loadingLocPayments } = useLocationPayments(currentLocationId);

  const currentLocation = localLocation || contextLocation;
  const mesa = getTable();

  // Resolve Location from Table
  useEffect(() => {
    const resolveLocation = async () => {
      if (!mesa || !activeBrandId) return;
      try {
        const tableData = await findTableRecord({
          mesa,
          brandId: activeBrandId,
          locationId: null
        });

        if (tableData?.location_id) {
          setCurrentLocationId(tableData.location_id);
          const loc = locations?.find(l => l.id === tableData.location_id);
          if (loc) setLocalLocation(loc);
        }
      } catch (err) {
        console.error("Error resolving location:", err);
      }
    };
    resolveLocation();
  }, [mesa, activeBrandId, locations]);

  const activeMethods = useMemo(() => {
    if (currentLocation?.independent_payments && locationPayments.length > 0) {
      return locationPayments
        .filter(lp => lp.is_active)
        .map(lp => ({
          ...lp.payment_method,
          config: lp.config || lp.payment_method?.config
        }));
    }
    return (paymentMethods || []).filter(m => m.is_active);
  }, [paymentMethods, locationPayments, currentLocation]);

  const transferMethods = useMemo(() => {
    const list = activeMethods.filter(m => (m.type === 'transfer' || m.type === 'digital_wallet') && m.details?.account_number);
    if (list.length > 0) return list;

    const rawNumber = currentLocation?.whatsapp || currentLocation?.phone || menuBrand?.whatsapp_number || menuBrand?.phone || '3244402642';
    const cleanNumber = String(rawNumber).replace(/[^0-9]/g, '').replace(/^57/, '') || '3244402642';

    return [
      {
        id: 'default-nequi-breb',
        name: 'Nequi / Llave Bre-B',
        type: 'digital_wallet',
        details: {
          bank_name: 'Nequi / Llave Bre-B',
          account_number: cleanNumber,
          account_type: 'Billetera Digital',
          holder_name: currentLocation?.business_name || menuBrand?.name || 'Boku Bento',
          bre_b_key: cleanNumber,
          instructions: `Transfiere a Nequi o con Llave Bre-B al ${cleanNumber} y envía tu comprobante por WhatsApp.`
        }
      }
    ];
  }, [activeMethods, currentLocation, menuBrand]);

  const availablePaymentTypes = useMemo(() => {
    if (!activeMethods || activeMethods.length === 0) {
      return [
        { id: 'cash', label: 'Efectivo', sub: 'Al recibir', icon: 'heroicons:banknotes', color: 'emerald' },
        { id: 'transfer', label: 'Nequi / Bre-B', sub: 'Transferencia', icon: 'heroicons:device-phone-mobile', color: 'blue' },
        { id: 'card', label: 'Datáfono', sub: 'Tarjeta física', icon: 'heroicons:credit-card', color: 'indigo' }
      ];
    }

    const types = [];
    const hasCash = activeMethods.some(m => m.type === 'cash' || /efectivo/i.test(m.name || ''));
    const hasTransfer = activeMethods.some(m => m.type === 'transfer' || m.type === 'qr' || /nequi|bre-b|bancolombia|daviplata|transferencia/i.test(m.name || ''));
    const hasCard = activeMethods.some(m => m.type === 'card' || /dat[aá]fono|tarjeta|pos/i.test(m.name || ''));

    if (hasCash) {
      types.push({ id: 'cash', label: 'Efectivo', sub: 'Al recibir', icon: 'heroicons:banknotes', color: 'emerald' });
    }
    if (hasTransfer) {
      types.push({ id: 'transfer', label: 'Nequi / Bre-B', sub: 'Transferencia', icon: 'heroicons:device-phone-mobile', color: 'blue' });
    }
    if (hasCard) {
      types.push({ id: 'card', label: 'Datáfono', sub: 'Tarjeta física', icon: 'heroicons:credit-card', color: 'indigo' });
    }

    return types.length > 0 ? types : [
      { id: 'cash', label: 'Efectivo', sub: 'Al recibir', icon: 'heroicons:banknotes', color: 'emerald' }
    ];
  }, [activeMethods]);
  
  const allDBProducts = useMemo(() => (typeof getAllProducts === 'function' ? getAllProducts() : []), [getAllProducts]);

  const [includeTip, setIncludeTip] = useState(() => {
    const flow = localStorage.getItem("aa_fulfillment_flow");
    return flow !== "delivery" && flow !== "takeaway";
  });

  const { settings: hookSettings } = useRestaurantSettings(activeBrandId);
  const settings = menuRestaurantSettings || hookSettings;
  const isTipEnabled = settings?.is_service_fee_enabled === true;
  const tipPercentage = settings?.service_fee_percentage || 0;

  const [confirmingClear, setConfirmingClear] = useState(false);
  const [lastSnapshot, setLastSnapshot] = useState(null);
  const confirmBtnRef = useRef(null);
  
  const [openNoteIndex, setOpenNoteIndex] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fulfillment modes & Business Type
  const fulfillmentModes = useMemo(() => {
    return getFulfillmentModes(settings);
  }, [settings]);

  const isDarkKitchen = fulfillmentModes.operations_model === 'dark_kitchen' || 
    (fulfillmentModes.delivery && !fulfillmentModes.dine_in && !fulfillmentModes.takeaway);

  // Fulfillment states
  const initialMesa = getTable();
  const flowFromStorage = localStorage.getItem("aa_fulfillment_flow");
  const [fulfillmentType, setFulfillmentType] = useState(() => {
    if (isDarkKitchen) return 'delivery';
    if (initialMesa && fulfillmentModes.dine_in) return 'dine_in';
    if (flowFromStorage && fulfillmentModes[flowFromStorage]) return flowFromStorage;
    if (fulfillmentModes.takeaway) return 'takeaway';
    if (fulfillmentModes.delivery) return 'delivery';
    return 'dine_in';
  });

  // Auto-disable voluntary tip for delivery / takeaway
  useEffect(() => {
    if (fulfillmentType === 'delivery' || fulfillmentType === 'takeaway') {
      setIncludeTip(false);
    } else if (fulfillmentType === 'dine_in') {
      setIncludeTip(true);
    }
  }, [fulfillmentType]);

  // Delivery Address states
  const [deliveryAddress, setDeliveryAddress] = useState(() => {
    return localStorage.getItem("aa_delivery_address") || "";
  });
  const [deliveryLocationInfo, setDeliveryLocationInfo] = useState(null);
  const [deliveryNotes, setDeliveryNotes] = useState(() => {
    return localStorage.getItem("aa_delivery_notes") || "";
  });

  useEffect(() => {
    if (deliveryAddress) localStorage.setItem("aa_delivery_address", deliveryAddress);
  }, [deliveryAddress]);

  useEffect(() => {
    if (deliveryNotes) localStorage.setItem("aa_delivery_notes", deliveryNotes);
  }, [deliveryNotes]);

  useEffect(() => {
    if (fulfillmentType) {
      localStorage.setItem("aa_fulfillment_flow", fulfillmentType);
    }
  }, [fulfillmentType]);

  const [scheduledTime, setScheduledTime] = useState("");
  const isPOSMode = sessionStorage.getItem("aa_pos_mode") === "true";
  const manualType = sessionStorage.getItem("aa_manual_type");

  const [paymentMethod, setPaymentMethod] = useState("");
  const [customerName, setCustomerName] = useState(() => {
    if (isPOSMode) return "Mostrador";
    return localStorage.getItem("aa_customer_name") || "";
  });
  const [customerPhone, setCustomerPhone] = useState(() => {
    if (isPOSMode) return "0000000";
    return localStorage.getItem("aa_customer_phone") || "";
  });
  const [customerId, setCustomerId] = useState(null);
  const [showFulfillmentSelector, setShowFulfillmentSelector] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastOrderId, setLastOrderId] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState("");
  const [confirmedOrderSnapshot, setConfirmedOrderSnapshot] = useState(null);

  const isLeadRequired = !isPOSMode && (fulfillmentType === 'takeaway' || fulfillmentType === 'delivery' || fulfillmentType === 'scheduled');
  const isAddressRequired = !isPOSMode && (fulfillmentType === 'delivery' || (isDarkKitchen && fulfillmentType === 'scheduled'));

  // Coupon / Promo States
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const saved = localStorage.getItem("aa_applied_coupon");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [couponInput, setCouponInput] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isCouponAccordionOpen, setIsCouponAccordionOpen] = useState(false);
  const [skipPlanCreditForOrder, setSkipPlanCreditForOrder] = useState(false);

  useEffect(() => {
    const handlePromoEvent = (e) => {
      if (e?.detail) {
        setSkipPlanCreditForOrder(false);
        setAppliedCoupon(prev => {
          if (prev?.id === e.detail.id && prev?.code === e.detail.code && prev?.discount_amount === e.detail.discount_amount) {
            return prev;
          }
          return e.detail;
        });
      } else {
        setAppliedCoupon(prev => prev ? null : prev);
      }
    };
    window.addEventListener('aa_coupon_applied', handlePromoEvent);
    return () => window.removeEventListener('aa_coupon_applied', handlePromoEvent);
  }, []);

  const calculateDiscountForPromo = useCallback((promo, cartItems, cartTotal) => {
    if (!promo) return 0;

    if (promo.is_meal_plan) {
      const qualifyingItem = (cartItems || []).find(it => {
        const pid = String(it.productId || it.id || '');
        return (
          Boolean(it.is_plan_bowl) ||
          Boolean(it.is_bento_del_dia) ||
          Boolean(it.is_daily_special) ||
          pid === 'b0000d14-0000-4000-a000-000000000000' ||
          pid === 'b0000b12-0000-4000-a000-000000000002' ||
          /bowl|bento/i.test(String(it.name || ''))
        );
      });

      if (!qualifyingItem) return 0;

      const fullUnitPrice = Number(qualifyingItem.unitPrice) || Number(qualifyingItem.price) || 0;
      const extraModsPrice = Number(qualifyingItem.extra_modifiers_price) || 0;
      const baseUnitPrice = Number(qualifyingItem.base_plan_price) || Math.max(0, fullUnitPrice - extraModsPrice);
      const maxCoveredUnit = Number(promo.max_covered_unit_value) || Math.max(Number(promo.value) || 17000, 19000);

      return Math.max(0, Math.min(baseUnitPrice, maxCoveredUnit));
    }
    
    if (promo.min_order_amount && cartTotal < Number(promo.min_order_amount)) {
      return 0;
    }

    const promoType = promo.type;
    const promoValue = Number(promo.value) || 0;
    const promoTarget = promo.target || 'all';
    const targetIds = Array.isArray(promo.target_ids) ? promo.target_ids : [];

    let applicableBase = cartTotal;

    if (promoTarget === 'category' && targetIds.length > 0) {
      applicableBase = cartItems.reduce((acc, it) => {
        if (targetIds.includes(it.categoryId)) {
          return acc + ((Number(it.unitPrice) || Number(it.price) || 0) * (Number(it.qty) || 1));
        }
        return acc;
      }, 0);
    } else if (promoTarget === 'product' && targetIds.length > 0) {
      applicableBase = cartItems.reduce((acc, it) => {
        const pid = it.productId || it.id;
        if (targetIds.includes(pid)) {
          return acc + ((Number(it.unitPrice) || Number(it.price) || 0) * (Number(it.qty) || 1));
        }
        return acc;
      }, 0);
    }

    if (applicableBase <= 0) return 0;

    if (promoType === 'percentage_discount') {
      return Math.round(applicableBase * (promoValue / 100));
    } else if (promoType === 'fixed_discount') {
      return Math.min(applicableBase, promoValue);
    }
    return 0;
  }, []);

  const automaticDiscountPromo = useMemo(() => {
    return (activePromotions || []).find(p => 
      !p.code && 
      (p.type === 'percentage_discount' || p.type === 'fixed_discount') &&
      (!p.min_order_amount || total >= Number(p.min_order_amount))
    ) || null;
  }, [activePromotions, total]);

  const effectivePromo = appliedCoupon || automaticDiscountPromo;

  const discountAmount = useMemo(() => {
    return calculateDiscountForPromo(effectivePromo, items, total);
  }, [effectivePromo, calculateDiscountForPromo, items, total]);

  const availableCouponPromos = useMemo(() => {
    const pendingPauseCode = getPendingPauseCoupon(activeBrandId);
    return (activePromotions || []).filter(p => {
      if (!p.code || !p.is_active) return false;
      const codeUpper = p.code.trim().toUpperCase();
      if (hasDeviceUsedCoupon(codeUpper, activeBrandId)) return false;
      return Boolean(p.show_banner) || (pendingPauseCode && codeUpper === pendingPauseCode);
    });
  }, [activePromotions, activeBrandId]);

  const activeMemberPlanSession = useMemo(() => {
    if (!activeBrandId) return null;
    const configuredPlans = getConfiguredMealPlans(settings);
    return getActiveMemberSession(activeBrandId, configuredPlans);
  }, [activeBrandId, settings, open]);

  useEffect(() => {
    if (!open || !activeBrandId) return;

    if (activeMemberPlanSession) {
      if (!customerName && activeMemberPlanSession.customer_name) setCustomerName(activeMemberPlanSession.customer_name);
      if (!customerPhone && activeMemberPlanSession.customer_phone) setCustomerPhone(activeMemberPlanSession.customer_phone);
      if (!deliveryAddress && activeMemberPlanSession.default_address) setDeliveryAddress(activeMemberPlanSession.default_address);
      if (!deliveryNotes && (activeMemberPlanSession.default_time || activeMemberPlanSession.dietary_notes)) {
        const parts = [];
        if (activeMemberPlanSession.default_time) parts.push(`Hora programada: ${activeMemberPlanSession.default_time}`);
        if (activeMemberPlanSession.dietary_notes) parts.push(activeMemberPlanSession.dietary_notes);
        setDeliveryNotes(parts.join(' • '));
      }
      if (!appliedCoupon && !skipPlanCreditForOrder) {
        const planPromo = buildPlanPromoObject(activeMemberPlanSession);
        if (planPromo) {
          setAppliedCoupon(planPromo);
          localStorage.setItem("aa_applied_coupon", JSON.stringify(planPromo));
        }
      }
      return;
    }

    if (appliedCoupon) return;
    const pendingCode = getPendingPauseCoupon(activeBrandId);
    if (pendingCode && !hasDeviceUsedCoupon(pendingCode, activeBrandId)) {
      const matched = (activePromotions || []).find(p => p.code && p.code.trim().toUpperCase() === pendingCode);
      if (matched && (!matched.min_order_amount || total >= Number(matched.min_order_amount))) {
        setAppliedCoupon(matched);
        localStorage.setItem("aa_applied_coupon", JSON.stringify(matched));
      }
    }
  }, [open, activeBrandId, activeMemberPlanSession, skipPlanCreditForOrder, appliedCoupon, activePromotions, total]);

  // Order Totals
  const packagingFeeTotal = items.reduce((acc, it) => acc + ((Number(it.packaging_fee) || 0) * (Number(it.qty) || 1)), 0);
  const serviceFeeAmount = (isTipEnabled && includeTip) ? Math.round(Math.max(0, total - discountAmount) * (tipPercentage / 100)) : 0;
  const isMealPlanDeliveryCovered = Boolean(
    effectivePromo?.is_meal_plan && effectivePromo?.includes_delivery && discountAmount > 0
  );
  
  const isFreeDeliveryPromoActive = useMemo(() => {
    if (isMealPlanDeliveryCovered) return true;
    if (freeDeliveryPromo && (!freeDeliveryPromo.min_order_amount || total >= Number(freeDeliveryPromo.min_order_amount))) {
      return true;
    }
    if (effectivePromo && !effectivePromo.is_meal_plan && (effectivePromo.type === 'free_delivery' || effectivePromo.target === 'delivery')) {
      if (!effectivePromo.min_order_amount || total >= Number(effectivePromo.min_order_amount)) {
        return true;
      }
    }
    if (currentLocation?.free_delivery_threshold > 0 && total >= Number(currentLocation.free_delivery_threshold)) {
      return true;
    }
    return false;
  }, [isMealPlanDeliveryCovered, freeDeliveryPromo, effectivePromo, currentLocation, total]);

  const deliveryFee = useMemo(() => {
    if (fulfillmentType !== 'delivery') return 0;
    if (effectivePromo?.is_meal_plan && discountAmount > 0) {
      if (effectivePromo.includes_delivery) return 0;
      if (effectivePromo.delivery_fee_override !== undefined && effectivePromo.delivery_fee_override !== null) {
        return Number(effectivePromo.delivery_fee_override);
      }
    }
    if (freeDeliveryPromo && (!freeDeliveryPromo.min_order_amount || total >= Number(freeDeliveryPromo.min_order_amount))) {
      return 0;
    }
    if (effectivePromo && (effectivePromo.type === 'free_delivery' || effectivePromo.target === 'delivery')) {
      if (!effectivePromo.min_order_amount || total >= Number(effectivePromo.min_order_amount)) {
        return 0;
      }
    }
    if (deliveryLocationInfo && typeof deliveryLocationInfo.fee === 'number') {
      return deliveryLocationInfo.fee;
    }
    return Number(currentLocation?.delivery_fee) || 0;
  }, [fulfillmentType, deliveryLocationInfo, currentLocation, freeDeliveryPromo, effectivePromo, total]);

  const finalTotal = useMemo(() => {
    const delivery = fulfillmentType === 'delivery' ? deliveryFee : 0;
    const packaging = (fulfillmentType === 'takeaway' || fulfillmentType === 'delivery') ? packagingFeeTotal : 0;
    const subtotalAfterDiscount = Math.max(0, total - discountAmount);
    return subtotalAfterDiscount + delivery + packaging + serviceFeeAmount;
  }, [fulfillmentType, total, discountAmount, deliveryFee, packagingFeeTotal, serviceFeeAmount]);

  const handleApplyCoupon = async (codeToApply) => {
    const rawCode = (typeof codeToApply === 'string' ? codeToApply : couponInput).trim();
    if (!rawCode) {
      toast.error('Por favor escribe un código de cupón');
      return;
    }
    const cleanCode = rawCode.toUpperCase();

    // Check if this code belongs to a Subscriber Meal Plan
    const configuredPlans = getConfiguredMealPlans(settings);
    const matchedMealPlan = findSubscriberPlan(configuredPlans, { code: cleanCode });

    if (matchedMealPlan) {
      setIsApplyingCoupon(true);
      try {
        const usage = await fetchPlanUsage(supabase, activeBrandId, matchedMealPlan);

        if (usage.remainingCredits <= 0) {
          toast.error(`La tiquetera #${matchedMealPlan.code} no tiene créditos restantes (${usage.usedCredits}/${usage.totalCredits} consumidos).`);
          setIsApplyingCoupon(false);
          return;
        }

        if (usage.usedTodayCount >= 1) {
          toast.error(`La tiquetera #${matchedMealPlan.code} ya redimió su almuerzo de hoy (límite 1 por día). Puedes realizar este pedido adicional a precio normal.`);
          setIsApplyingCoupon(false);
          return;
        }

        const planPromo = buildPlanPromoObject(matchedMealPlan);
        saveActiveMemberSession(activeBrandId, matchedMealPlan);
        setSkipPlanCreditForOrder(false);
        setAppliedCoupon(planPromo);
        localStorage.setItem("aa_applied_coupon", JSON.stringify(planPromo));

        if (!customerName && matchedMealPlan.customer_name) setCustomerName(matchedMealPlan.customer_name);
        if (!customerPhone && matchedMealPlan.customer_phone) setCustomerPhone(matchedMealPlan.customer_phone);
        if (!deliveryAddress && matchedMealPlan.default_address) setDeliveryAddress(matchedMealPlan.default_address);
        if (!deliveryNotes && (matchedMealPlan.default_time || matchedMealPlan.dietary_notes)) {
          const parts = [];
          if (matchedMealPlan.default_time) parts.push(`Hora programada: ${matchedMealPlan.default_time}`);
          if (matchedMealPlan.dietary_notes) parts.push(matchedMealPlan.dietary_notes);
          setDeliveryNotes(parts.join(' • '));
        }

        toast.success(`🎟️ ¡Tiquetera #${matchedMealPlan.code} vinculada! 1 almuerzo cubierto hoy.`);
        setCouponInput('');
        setIsCouponAccordionOpen(false);
      } catch (err) {
        console.error("Error al validar tiquetera:", err);
        toast.error("No se pudo verificar el saldo de la tiquetera. Intenta de nuevo.");
      } finally {
        setIsApplyingCoupon(false);
      }
      return;
    }

    if (hasDeviceUsedCoupon(cleanCode, activeBrandId)) {
      toast.error(`Ya redimiste el cupón "${cleanCode}" anteriormente en este dispositivo.`);
      return;
    }

    if (cleanCode === 'VOLVER10') {
      if (!hasValidPauseClaim(activeBrandId, cleanCode)) {
        toast.error('El cupón VOLVER10 es exclusivo para clientes que visitaron durante la pausa del restaurante.');
        return;
      }
    }

    if (cleanCode === 'DISCULPABOKU') {
      const phoneDigits = (customerPhone || '').replace(/\D/g, '').slice(-10);
      let hasStamp = hasCrmRecoveryStamp(activeBrandId);
      let hasCancelledInDb = false;
      if (!hasStamp && phoneDigits.length >= 7) {
        const { data: cancelledOrders } = await supabase
          .from('orders')
          .select('id')
          .eq('brand_id', activeBrandId)
          .eq('status', 'cancelled')
          .ilike('customer_phone', `%${phoneDigits}%`)
          .limit(1);
        hasCancelledInDb = Boolean(cancelledOrders && cancelledOrders.length > 0);
      }

      if (!hasStamp && !hasCancelledInDb) {
        if (phoneDigits.length < 7) {
          toast.error('Ingresa primero tu número de celular arriba para validar tu cupón de compensación.');
        } else {
          toast.error(`El cupón "${cleanCode}" es exclusivo de compensación para clientes con pedidos cancelados.`);
        }
        return;
      }
    }

    const phoneDigitsCheck = (customerPhone || '').replace(/\D/g, '').slice(-10);
    if (phoneDigitsCheck.length >= 7) {
      const { data: prevUsedOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('brand_id', activeBrandId)
        .neq('status', 'cancelled')
        .ilike('customer_phone', `%${phoneDigitsCheck}%`)
        .ilike('discount_reason', `%${cleanCode}%`)
        .limit(1);

      if (prevUsedOrders && prevUsedOrders.length > 0) {
        toast.error(`Este número de teléfono ya redimió el cupón "${cleanCode}" en un pedido anterior.`);
        return;
      }
    }

    const promo = (activePromotions || []).find(p => p.code && p.code.trim().toUpperCase() === cleanCode);
    if (!promo) {
      toast.error(`El cupón "${cleanCode}" no es válido o ya expiró`);
      return;
    }

    if (promo.min_order_amount && total < Number(promo.min_order_amount)) {
      toast.error(`Este cupón requiere un pedido mínimo de ${formatCOP(promo.min_order_amount)}`);
      return;
    }

    setSkipPlanCreditForOrder(false);
    setAppliedCoupon(promo);
    localStorage.setItem("aa_applied_coupon", JSON.stringify(promo));
    toast.success(`¡Cupón "${promo.code}" aplicado con éxito!`);
    setCouponInput("");
    setIsCouponAccordionOpen(false);
  };

  const handleRemoveCoupon = () => {
    const wasMealPlan = Boolean(appliedCoupon?.is_meal_plan);
    setAppliedCoupon(null);
    localStorage.removeItem("aa_applied_coupon");
    if (wasMealPlan) {
      setSkipPlanCreditForOrder(true);
      toast.success("No se descontará crédito de tu tiquetera en este pedido.");
    } else {
      toast.success("Cupón removido");
    }
  };

  const handleRestoreMealPlanCredit = () => {
    if (!activeMemberPlanSession) return;
    const planPromo = buildPlanPromoObject(activeMemberPlanSession);
    if (planPromo) {
      setSkipPlanCreditForOrder(false);
      setAppliedCoupon(planPromo);
      localStorage.setItem("aa_applied_coupon", JSON.stringify(planPromo));
      toast.success(`🎟️ Tiquetera #${activeMemberPlanSession.code} reactivada para este pedido.`);
    }
  };

  // Customer Payment States
  const [customerPaymentType, setCustomerPaymentType] = useState(() => {
    return localStorage.getItem("aa_payment_type") || "cash";
  });
  const [cashTenderedType, setCashTenderedType] = useState("exact");
  const [customCashAmount, setCustomCashAmount] = useState("");

  useEffect(() => {
    if (customerPaymentType) localStorage.setItem("aa_payment_type", customerPaymentType);
  }, [customerPaymentType]);

  useEffect(() => {
    if (availablePaymentTypes && availablePaymentTypes.length > 0) {
      const isAvailable = availablePaymentTypes.some(t => t.id === customerPaymentType);
      if (!isAvailable) {
        setCustomerPaymentType(availablePaymentTypes[0].id);
      }
    }
  }, [availablePaymentTypes, customerPaymentType]);

  const effectiveCashAmount = useMemo(() => {
    if (cashTenderedType === 'exact') return finalTotal;
    if (cashTenderedType === 'custom') return Number(customCashAmount) || 0;
    return Number(cashTenderedType) || finalTotal;
  }, [cashTenderedType, customCashAmount, finalTotal]);

  const cashChange = useMemo(() => {
    if (customerPaymentType !== 'cash') return 0;
    return Math.max(0, effectiveCashAmount - finalTotal);
  }, [customerPaymentType, effectiveCashAmount, finalTotal]);

  const isCashAmountValid = useMemo(() => {
    if (customerPaymentType !== 'cash') return true;
    if (cashTenderedType === 'exact') return true;
    return effectiveCashAmount >= finalTotal;
  }, [customerPaymentType, cashTenderedType, effectiveCashAmount, finalTotal]);

  const productsMap = useMemo(() => {
    const map = new Map();
    (allDBProducts || []).forEach(p => {
      if (p.id) map.set(String(p.id), p);
    });
    return map;
  }, [allDBProducts]);

  const restrictedCartItems = useMemo(() => {
    if (isPOSMode) return [];
    return items.filter(it => {
      const prod = productsMap.get(String(it.productId || it.id));
      return prod?.is_schedule_available === false;
    });
  }, [items, productsMap, isPOSMode]);

  const hasRestrictedItems = restrictedCartItems.length > 0;

  const paymentMethodSummary = useMemo(() => {
    if (isPOSMode) {
      return isPaid ? (paymentMethod || 'Pagado en caja') : 'Pendiente en caja';
    }
    if (customerPaymentType === 'cash') {
      if (cashTenderedType === 'exact' || effectiveCashAmount === finalTotal) {
        return `Efectivo (Pago exacto: ${formatCOP(finalTotal)})`;
      }
      return `Efectivo (Paga con: ${formatCOP(effectiveCashAmount)} - Cambio: ${formatCOP(cashChange)})`;
    }
    if (customerPaymentType === 'transfer') {
      const primaryAccount = transferMethods[0]?.details?.account_number || '3244402642';
      return `Transferencia Nequi / Llave Bre-B (${primaryAccount})`;
    }
    if (customerPaymentType === 'card') {
      return 'Datáfono contra entrega';
    }
    return 'Por acordar';
  }, [isPOSMode, isPaid, paymentMethod, customerPaymentType, cashTenderedType, effectiveCashAmount, finalTotal, cashChange, transferMethods]);

  const isLeadValid = !isLeadRequired || (
    Boolean(customerName?.trim()) && 
    Boolean(customerPhone?.trim()) && 
    (!isAddressRequired || Boolean(deliveryAddress?.trim())) &&
    isCashAmountValid
  );

  useEffect(() => {
    if (open && activeBrandId) {
      try {
        trackAnalyticsEvent('cart_open', {
          brandId: activeBrandId,
          itemsCount: items?.length || 0,
          total: finalTotal || 0,
        });
      } catch {}
    }
  }, [open, activeBrandId]);

  useEffect(() => {
    const flowFromStorage = localStorage.getItem("aa_fulfillment_flow");

    if (isPOSMode && manualType) {
      setFulfillmentType(manualType);
    } else if (flowFromStorage && (flowFromStorage === 'takeaway' || flowFromStorage === 'delivery')) {
      setFulfillmentType(flowFromStorage);
    } else if (isDarkKitchen) {
      setFulfillmentType('delivery');
    } else if (initialMesa && fulfillmentModes.dine_in) {
      setFulfillmentType('dine_in');
    } else if (flowFromStorage && fulfillmentModes[flowFromStorage]) {
      setFulfillmentType(flowFromStorage);
    } else if (fulfillmentModes.takeaway) {
      setFulfillmentType('takeaway');
    } else if (fulfillmentModes.delivery) {
      setFulfillmentType('delivery');
    }

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
  }, [isPOSMode, manualType, initialMesa, open, isDarkKitchen, fulfillmentModes]);

  useEffect(() => {
    if (activeMethods.length > 0 && !paymentMethod) {
      setPaymentMethod(activeMethods[0].id);
    }
  }, [activeMethods, paymentMethod]);

  // Upselling products
  const upsellProducts = useMemo(() => {
    if (!open || !items || items.length === 0) return [];
    
    const allProds = typeof getAllProducts === 'function' ? getAllProducts() : [];
    if (!allProds || allProds.length === 0) return [];

    const cartIds = new Set(items.map(it => it.productId || it.id));
    const cartProducts = allProds.filter(p => cartIds.has(p.id));

    const candidateIds = [];
    const addedCandidateIds = new Set();

    const addCandidate = (id) => {
      if (id && !cartIds.has(id) && !addedCandidateIds.has(id)) {
        const prod = allProds.find(p => p.id === id);
        if (prod && prod.is_active !== false) {
          candidateIds.push(id);
          addedCandidateIds.add(id);
          return true;
        }
      }
      return false;
    };

    const dishPairingLists = cartProducts.map(prod => {
      const specificIds = prod.config_options?.upsell_product_ids || prod.config_options?.upsell_ids;
      return Array.isArray(specificIds) ? specificIds.filter(id => !cartIds.has(id)) : [];
    }).filter(list => list.length > 0);

    const maxRounds = 3;
    for (let round = 0; round < maxRounds && candidateIds.length < 5; round++) {
      dishPairingLists.forEach(list => {
        if (candidateIds.length < 5 && list[round]) {
          addCandidate(list[round]);
        }
      });
    }

    if (candidateIds.length < 4) {
      const candidateProds = candidateIds.map(id => allProds.find(p => p.id === id)).filter(Boolean);
      const hasDrinksInCart = cartProducts.some(p => p.categorySlug === 'bebidas' || p.category_id === 'c0000002-0000-4000-a000-000000000002');
      const hasColdDrinkSuggested = candidateProds.some(p => p.subcategory?.includes('Autor') || p.subcategory?.includes('Tés') || p.subcategory?.includes('Gaseosas'));
      const hasHotDrinkSuggested = candidateProds.some(p => p.subcategory?.includes('Cafetería'));
      const hasSnackSuggested = candidateProds.some(p => p.categorySlug === 'boku-snacks');

      if (!hasDrinksInCart && !hasColdDrinkSuggested) {
        addCandidate('b0000b01-0000-4000-a000-000000000005');
        addCandidate('b0000b01-0000-4000-a000-000000000001');
        addCandidate('b0000006-0000-4000-a000-000000000006');
      }

      if (!hasSnackSuggested) {
        addCandidate('b0000f40-0000-4000-a000-000000000001');
        addCandidate('b0000f30-0000-4000-a000-000000000001');
        addCandidate('b0000f40-0000-4000-a000-000000000002');
        addCandidate('b0000f30-0000-4000-a000-000000000004');
      }

      const hasBreakfast = cartProducts.some(p => p.categorySlug === 'boku-desayunos-brunch');
      if (hasBreakfast && !hasHotDrinkSuggested) {
        addCandidate('b0000b01-0000-4000-a000-000000000009');
      }
    }

    if (candidateIds.length < 4) {
      allProds
        .filter(p => p.is_upsell === true && p.is_active !== false)
        .forEach(p => addCandidate(p.id));
    }

    return candidateIds
      .slice(0, 5)
      .map(id => allProds.find(p => p.id === id))
      .filter(Boolean);
  }, [items, open, getAllProducts]);

  const handleAddUpsell = (product) => {
    const hasModGroups = (product.modifier_groups && product.modifier_groups.length > 0) ||
                         (product.modifierGroups && product.modifierGroups.length > 0) ||
                         Boolean(product.config_options?.is_diy || product.configOptions?.is_diy);

    if (hasModGroups) {
      window.dispatchEvent(new CustomEvent('aa:quickview', { detail: product }));
      return;
    }

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

  const handleConfirmOrder = async (e) => {
    if (e?.preventDefault) e.preventDefault();

    if (!isPOSMode) {
      const relevantHours = (businessHours || []).filter(h => 
        !h.location_id || (currentLocationId && h.location_id === currentLocationId)
      );
      
      const { isOpen, message } = isRestaurantOpen(relevantHours, menuBrand?.config);
      if (!isOpen) {
        toast.error(message || "Lo sentimos, el restaurante está cerrado en este momento.");
        setIsSubmitting(false);
        return;
      }

      if (effectivePromo?.is_meal_plan && discountAmount > 0) {
        const configuredPlans = getConfiguredMealPlans(settings);
        const matchedMealPlan = findSubscriberPlan(configuredPlans, { code: effectivePromo.code }) || effectivePromo;
        const usageRes = await fetchPlanUsage(supabase, activeBrandId, matchedMealPlan);
        if (usageRes.remainingCredits <= 0) {
          toast.error(`Tu Plan Tiquetera (${effectivePromo.code}) ya no tiene créditos disponibles.`);
          setAppliedCoupon(null);
          localStorage.removeItem("aa_applied_coupon");
          setIsSubmitting(false);
          return;
        }
        if (usageRes.usedTodayCount >= 1) {
          toast.error(`Ya redimiste tu almuerzo del plan de hoy (máx. 1 crédito personal por día). Puedes pedir a precio normal.`);
          setAppliedCoupon(null);
          setSkipPlanCreditForOrder(true);
          localStorage.removeItem("aa_applied_coupon");
          setIsSubmitting(false);
          return;
        }
      } else if (effectivePromo?.code && !effectivePromo?.is_meal_plan) {
        const cleanCode = effectivePromo.code.trim().toUpperCase();
        if (hasDeviceUsedCoupon(cleanCode, activeBrandId)) {
          toast.error(`El cupón ${cleanCode} ya fue redimido desde este dispositivo.`);
          setAppliedCoupon(null);
          localStorage.removeItem("aa_applied_coupon");
          setIsSubmitting(false);
          return;
        }
        if (cleanCode === 'VOLVER10' || effectivePromo.coupon_scope === 'pause_only') {
          if (!hasValidPauseClaim(activeBrandId, cleanCode)) {
            toast.error("El cupón VOLVER10 es exclusivo para clientes que visitaron durante una pausa operativa.");
            setAppliedCoupon(null);
            localStorage.removeItem("aa_applied_coupon");
            setIsSubmitting(false);
            return;
          }
        }
        const cleanPhoneDigits = (customerPhone || '').replace(/\D/g, '').slice(-10);
        if (cleanPhoneDigits.length >= 7) {
          try {
            const { data: prevUsed } = await supabase
              .from('orders')
              .select('id, status')
              .eq('brand_id', activeBrandId)
              .ilike('customer_phone', `%${cleanPhoneDigits}`)
              .ilike('discount_reason', `%${cleanCode}%`)
              .neq('status', 'cancelled')
              .limit(1);
            if (prevUsed && prevUsed.length > 0) {
              toast.error(`El número ${cleanPhoneDigits} ya redimió el cupón ${cleanCode} anteriormente.`);
              setAppliedCoupon(null);
              localStorage.removeItem("aa_applied_coupon");
              setIsSubmitting(false);
              return;
            }
          } catch (err) {
            console.warn('Error checking coupon phone usage on submit:', err);
          }
        }
        if (cleanCode === 'DISCULPABOKU' || effectivePromo.coupon_scope === 'crm_recovery') {
          let isAuthorizedCrm = hasCrmRecoveryStamp(activeBrandId);
          if (!isAuthorizedCrm && cleanPhoneDigits.length >= 7) {
            try {
              const { data: cancelledOrders } = await supabase
                .from('orders')
                .select('id')
                .eq('brand_id', activeBrandId)
                .eq('status', 'cancelled')
                .ilike('customer_phone', `%${cleanPhoneDigits}`)
                .limit(1);
              if (cancelledOrders && cancelledOrders.length > 0) {
                isAuthorizedCrm = true;
              }
            } catch (err) {
              console.warn('Error checking CRM recovery on submit:', err);
            }
          }
          if (!isAuthorizedCrm) {
            toast.error("El cupón DISCULPABOKU es exclusivo para clientes con una orden previa cancelada.");
            setAppliedCoupon(null);
            localStorage.removeItem("aa_applied_coupon");
            setIsSubmitting(false);
            return;
          }
        }
      }
    }

    if (!isWithinOrderLimit && !isPOSMode) {
      toast.error("El restaurante ha alcanzado su límite de pedidos por este mes. Por favor, intenta de nuevo más tarde.");
      setIsSubmitting(false);
      return;
    }

    if (!isPOSMode && hasRestrictedItems) {
      const names = restrictedCartItems.map(it => it.name).join(', ');
      toast.error(`Los siguientes productos están fuera de su horario de atención: ${names}. Por favor retíralos para continuar.`);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const catalogProducts = (typeof getAllProducts === 'function' ? getAllProducts() : allDBProducts) || [];

      const mesa = getTable();
      let tableId = null;
      let orderLocationId = getLocationId(activeBrandId) || currentLocation?.id || locations?.find(l => l.is_main)?.id || locations?.[0]?.id || null;

      const sessionTableId = sessionStorage.getItem("aa_current_table_id");
      if (sessionTableId && sessionTableId !== "null") {
        tableId = sessionTableId;
      }

      if (fulfillmentType === 'dine_in' && mesa) {
        const tableData = await findTableRecord({
          mesa,
          brandId: activeBrandId,
          locationId: orderLocationId
        });

        if (tableData) {
          tableId = tableData.id;
          if (tableData.location_id) orderLocationId = tableData.location_id;
        }
      }

      let hasBarItemsInOrder = false;
      let hasKitchenItemsInOrder = false;
      for (const it of items) {
        const dbProd = catalogProducts.find(p => p.id === (it.productId || it.id));
        const st = (dbProd?.station || '').toLowerCase();
        const isBar = st === 'bar' || (st !== 'kitchen' && st !== 'none' && /bebida|soda|cafe|café|jugo|cerveza|agua|hatsu|gaseosa|té|refajo|cold brew|chai|milo/i.test(dbProd?.name || it.name || ''));
        if (isBar) {
          hasBarItemsInOrder = true;
        } else if (st !== 'none' && (dbProd?.requires_kitchen ?? true)) {
          hasKitchenItemsInOrder = true;
        }
      }

      const initialKitchenStatus = hasKitchenItemsInOrder ? 'pending' : 'none';
      const initialBarStatus = hasBarItemsInOrder ? 'pending' : 'none';

      let orderStatus = (!hasKitchenItemsInOrder && !hasBarItemsInOrder && fulfillmentType === 'dine_in') ? 'ready' : 'new';
      let orderData = null;

      const formattedAddress = deliveryAddress?.trim();
      const formattedNotes = deliveryNotes?.trim();
      const fullCustomerName = (fulfillmentType === 'delivery' && formattedAddress)
        ? `${customerName.trim()} [Dir: ${formattedAddress}${formattedNotes ? ` - ${formattedNotes}` : ''}]`
        : customerName.trim();

      if (!navigator.onLine) {
        const clientOrderId = createClientOrderId();
        const offlineItems = items.map((item) => ({
          product_id: item.productId || item.id,
          brand_id: activeBrandId,
          quantity: item.qty || 1,
          unit_price: getItemUnit(item),
          modifiers: item.options || {},
          notes: item.note || '',
        }));
        const result = await submitOrderResilient({
          clientOrderId,
          order: {
            status: orderStatus,
            origin: fulfillmentType === 'dine_in' ? 'table' : 'takeaway',
            fulfillment_type: fulfillmentType,
            table_id: tableId,
            brand_id: activeBrandId,
            location_id: orderLocationId || null,
            total_amount: finalTotal,
            discount_amount: discountAmount || 0,
            discount_reason: effectivePromo ? `${effectivePromo.code || effectivePromo.name} (${effectivePromo.type === 'free_delivery' ? 'Domicilio Gratis' : effectivePromo.type === 'percentage_discount' ? `${effectivePromo.value}%` : formatCOP(effectivePromo.value)})` : null,
            service_fee: serviceFeeAmount,
            customer_name: fullCustomerName || customerName,
            customer_phone: customerPhone,
            customer_id: customerId,
            scheduled_time: scheduledTime || null,
            payment_status: isPOSMode && isPaid ? 'paid' : 'pending',
            payment_method: isPOSMode ? (isPaid ? paymentMethod : null) : paymentMethodSummary,
          },
          items: offlineItems,
        });
        const pendingId = result.orderId || clientOrderId;
        localStorage.setItem("aa_last_order", JSON.stringify({ items, note, total, orderId: pendingId, pendingSync: true }));
        localStorage.setItem("aa_active_order", pendingId);
        setLastOrderId(pendingId);
        setShowSuccess(true);
        toast.success('Pedido guardado sin internet. Se enviará al volver la conexión.');
        return;
      }

      if (tableId) {
        const { data: existingOrder } = await supabase.from('orders')
          .select('*')
          .eq('table_id', tableId)
          .eq('brand_id', activeBrandId)
          .match(orderLocationId ? { location_id: orderLocationId } : {})
          .in('status', ['waiting_payment', 'new', 'preparing', 'ready'])
          .limit(1)
          .maybeSingle();
        
        if (existingOrder) {
          const updatePayload = {
            total_amount: (Number(existingOrder.total_amount) || 0) + finalTotal,
            discount_amount: (Number(existingOrder.discount_amount) || 0) + (discountAmount || 0),
            service_fee: (Number(existingOrder.service_fee) || 0) + serviceFeeAmount,
            status: 'new',
            kitchen_status: hasKitchenItemsInOrder ? 'pending' : existingOrder.kitchen_status,
            bar_status: hasBarItemsInOrder ? 'pending' : existingOrder.bar_status,
            payment_status: isPOSMode && isPaid ? 'paid' : existingOrder.payment_status,
            payment_method: isPOSMode ? (isPaid ? paymentMethod : existingOrder.payment_method) : paymentMethodSummary
          };

          const { data: updatedOrder, error: updateError } = await supabase.from('orders')
            .update(updatePayload)
            .eq('id', existingOrder.id)
            .select()
            .single();
          
          if (updateError) throw updateError;
          orderData = updatedOrder;
        }
      }

      if (!orderData) {
        const finalCustomerId = customerId || await resolveOrCreateCustomer({
          brandId: activeBrandId,
          phone: customerPhone,
          name: customerName,
          address: formattedAddress,
          notes: formattedNotes
        });

        const { data: newOrder, error: orderError } = await supabase.from('orders')
          .insert([{
            status: orderStatus,
            kitchen_status: initialKitchenStatus,
            bar_status: initialBarStatus,
            origin: fulfillmentType === 'dine_in' ? 'table' : 'takeaway',
            fulfillment_type: fulfillmentType,
            table_id: tableId,
            brand_id: activeBrandId,
            location_id: orderLocationId || null,
            total_amount: finalTotal,
            discount_amount: discountAmount || 0,
            discount_reason: effectivePromo ? `${effectivePromo.code || effectivePromo.name} (${effectivePromo.type === 'free_delivery' ? 'Domicilio Gratis' : effectivePromo.type === 'percentage_discount' ? `${effectivePromo.value}%` : formatCOP(effectivePromo.value)})` : null,
            service_fee: serviceFeeAmount,
            customer_name: fullCustomerName || customerName,
            customer_phone: customerPhone,
            customer_id: finalCustomerId,
            scheduled_time: scheduledTime || null,
            payment_status: isPOSMode && isPaid ? 'paid' : 'pending',
            payment_method: isPOSMode ? (isPaid ? paymentMethod : null) : paymentMethodSummary,
            delivery_address: fulfillmentType === 'delivery' ? (formattedAddress || null) : null,
            delivery_notes: fulfillmentType === 'delivery' ? (formattedNotes || null) : null,
            delivery_fee: fulfillmentType === 'delivery' ? deliveryFee : 0,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (orderError) throw orderError;
        orderData = newOrder;
      }

      // Insert Order Items
      const orderItemsToInsert = items.map(item => ({
        order_id: orderData.id,
        product_id: item.productId || item.id,
        brand_id: activeBrandId,
        quantity: item.qty || 1,
        unit_price: getItemUnit(item),
        options: item.options || {},
        notes: item.note || ''
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItemsToInsert);
      if (itemsError) throw itemsError;

      // Deduct Inventory in Real Time
      try {
        const deductionPayload = items.map(item => ({
          product_id: item.productId || item.id,
          quantity: item.qty || 1
        }));
        await supabase.rpc('deduct_inventory_for_order', {
          p_brand_id: activeBrandId,
          p_items: deductionPayload
        });
      } catch (invErr) {
        console.warn('Inventory auto-deduction notice:', invErr);
      }

      // Telegram notification
      try {
        sendTelegramOrderNotification({
          brandId: activeBrandId,
          orderId: orderData.id,
          total: finalTotal,
          items,
          customerName,
          customerPhone,
          fulfillmentType,
          tableNum: mesa,
          deliveryAddress: formattedAddress,
          paymentMethod: paymentMethodSummary,
          settings
        });
      } catch (tgErr) {
        console.warn('Telegram notification notice:', tgErr);
      }

      setConfirmedOrderSnapshot({
        orderId: orderData.id,
        finalTotal,
        discountAmount,
        appliedCoupon: effectivePromo,
        items: [...items],
        formattedAddress,
        paymentMethodSummary,
        fulfillmentType
      });

      setLastOrderId(orderData.id);
      localStorage.setItem("aa_last_order", JSON.stringify({ items, note, total, orderId: orderData.id }));
      localStorage.setItem("aa_active_order", orderData.id);

      // WhatsApp link preparation
      const storePhone = currentLocation?.whatsapp || settings?.whatsapp_number_orders || menuBrand?.whatsapp_number || menuBrand?.phone || '';
      if (storePhone) {
        const cleanPhone = normalizeWhatsAppNumber(storePhone);
        if (cleanPhone) {
          const deliveryInfo = fulfillmentType === 'delivery' 
            ? `\n*Dirección:* ${formattedAddress || 'No especificada'}${formattedNotes ? ` (${formattedNotes})` : ''}\n*Costo Domicilio:* ${deliveryFee > 0 ? formatCOP(deliveryFee) : 'Gratis'}` 
            : fulfillmentType === 'dine_in' 
            ? `\n*Mesa:* ${mesa || 'No especificada'}` 
            : '\n*Modalidad:* Para Llevar';

          const message = encodeURIComponent(
            `*NUEVO PEDIDO #${orderData.id.slice(-4).toUpperCase()}*\n\n` +
            `*Cliente:* ${customerName}\n` +
            `*Teléfono:* ${customerPhone}\n` +
            deliveryInfo +
            `\n*Productos:*\n` +
            items.map(it => {
              let line = `• *${it.qty}x ${it.name}* (${formatCOP(getItemUnit(it) * it.qty)})`;
              if (it.options && Object.keys(it.options).length > 0) {
                const mods = Object.entries(it.options)
                  .map(([k, v]) => `   ↳ _${k}:_ ${Array.isArray(v) ? v.join(', ') : (typeof v === 'object' && v ? (v.name || JSON.stringify(v)) : v)}`)
                  .join('\n');
                line += `\n${mods}`;
              }
              if (it.note) {
                line += `\n   ↳ 📝 _Nota:_ ${it.note}`;
              }
              return line;
            }).join('\n\n') +
            `\n\n*Subtotal:* ${formatCOP(total)}\n` +
            (discountAmount > 0 ? `*Descuento (${effectivePromo?.code || 'Cupón'}):* -${formatCOP(discountAmount)}\n` : '') +
            (packagingFeeTotal > 0 ? `*Empaque:* ${formatCOP(packagingFeeTotal)}\n` : '') +
            (serviceFeeAmount > 0 ? `*Servicio voluntario:* ${formatCOP(serviceFeeAmount)}\n` : '') +
            `*Total:* ${formatCOP(finalTotal)}\n` +
            `*Método de pago:* ${paymentMethodSummary}\n\n` +
            `Ver pedido en: ${window.location.origin}/${brandSlug}/#order/${orderData.id}`
          );
          
          setWhatsappLink(`https://wa.me/${cleanPhone}?text=${message}`);
        }
      }

      if (typeof clearCart === 'function') {
        clearCart();
      }
      if (effectivePromo?.code && !effectivePromo?.is_meal_plan) {
        markCouponUsedOnDevice(effectivePromo.code, activeBrandId, customerPhone);
        setAppliedCoupon(null);
        localStorage.removeItem("aa_applied_coupon");
      } else if (effectivePromo?.is_meal_plan) {
        window.dispatchEvent(new CustomEvent('aa_meal_plan_updated'));
      }
      setShowSuccess(true);
      
      trackAnalyticsEvent('order_completed', {
        orderId: orderData.id,
        brandId: activeBrandId,
        locationId: orderLocationId || null,
        tableId: tableId || mesa || null,
        total: finalTotal,
        fulfillmentType,
        paymentMethod: isPOSMode ? (paymentMethod || 'unspecified') : customerPaymentType
      });
      
    } catch (err) {
      console.error('Error enviando pedido:', err);
      toast.error("Hubo un error al enviar el pedido. Por favor intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const setItemNote = setItemNoteCtx || updateItemNoteCtx || ((index, value) => updateItem?.(index, { note: value }));

  const resetStates = () => {
    setCustomerName(isPOSMode ? "Mostrador" : "");
    setCustomerPhone(isPOSMode ? "0000000" : "");
    setCustomerId(null);
    setScheduledTime("");
    setIsPaid(false);
    setPaymentMethod("cash");
    setCustomerPaymentType("cash");
    setCashTenderedType("exact");
    setCustomCashAmount("");
    setShowFulfillmentSelector(false);
    setWhatsappLink("");
    setConfirmedOrderSnapshot(null);
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
    setAppliedCoupon(null);
    localStorage.removeItem("aa_applied_coupon");
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

  return {
    // Cart core
    items,
    total,
    note,
    setNote,
    increment,
    handleDecrement,
    removeItem,
    setItemNote,
    openNoteIndex,
    setOpenNoteIndex,

    // Brand & Location
    brandSlug,
    activeBrandId,
    menuBrand,
    settings,
    currentLocation,
    mesa,

    // Fulfillment
    fulfillmentModes,
    fulfillmentType,
    setFulfillmentType,
    isDarkKitchen,
    deliveryAddress,
    setDeliveryAddress,
    deliveryLocationInfo,
    setDeliveryLocationInfo,
    deliveryNotes,
    setDeliveryNotes,
    scheduledTime,
    setScheduledTime,
    isLeadRequired,
    isAddressRequired,
    isLeadValid,
    showFulfillmentSelector,
    setShowFulfillmentSelector,

    // Lead
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,

    // Tips & Totals
    includeTip,
    setIncludeTip,
    isTipEnabled,
    tipPercentage,
    serviceFeeAmount,
    packagingFeeTotal,
    deliveryFee,
    isFreeDeliveryPromoActive,
    isMealPlanDeliveryCovered,
    freeDeliveryPromo,
    finalTotal,

    // Store & Constraints
    storeStatusInfo,
    isWithinOrderLimit,
    hasRestrictedItems,
    restrictedCartItems,
    productsMap,
    allDBProducts,
    initialMesa,

    // Coupons & Plans
    appliedCoupon,
    couponInput,
    setCouponInput,
    isApplyingCoupon,
    isCouponAccordionOpen,
    setIsCouponAccordionOpen,
    availableCouponPromos,
    effectivePromo,
    automaticDiscountPromo,
    discountAmount,
    activeMemberPlanSession,
    skipPlanCreditForOrder,
    handleApplyCoupon,
    handleRemoveCoupon,
    handleRestoreMealPlanCredit,

    // Payments
    availablePaymentTypes,
    customerPaymentType,
    setCustomerPaymentType,
    cashTenderedType,
    setCashTenderedType,
    customCashAmount,
    setCustomCashAmount,
    effectiveCashAmount,
    cashChange,
    transferMethods,
    paymentMethod,
    setPaymentMethod,
    activeMethods,
    paymentMethodSummary,

    // POS Mode
    isPOSMode,
    isPaid,
    setIsPaid,

    // Upselling
    upsellProducts,
    handleAddUpsell,

    // Order Submission
    handleConfirmOrder,
    isSubmitting,
    showSuccess,
    setShowSuccess,
    lastOrderId,
    confirmedOrderSnapshot,
    resetStates,
    clearCart,

    // Clear Modal
    confirmingClear,
    setConfirmingClear,
    handleClearRequest,
    clearCartNow,
    confirmBtnRef
  };
}
