import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../config/supabase';
import { useMenuData } from '../context/MenuDataContext';
import { useAuth } from '../context/AuthContext';
import { formatCOP } from '../utils/money';
import { toast } from './Toast';
import DIYProductModal from './DIYProductModal';
import ProductQuickView from './ProductQuickView';
import Portal from './Portal';
import AddressInputWithMap from './delivery/AddressInputWithMap';
import {
  MEAL_PLAN_TEMPLATES,
  getConfiguredMealPlans,
  getMealPlanProgramConfig,
  findSubscriberPlan,
  saveActiveMemberSession,
  getActiveMemberSession,
  clearActiveMemberSession,
  fetchPlanUsage,
  buildPlanPromoObject,
  buildPlanDIYBowlProduct,
  getPlanSoupMode
} from '../utils/mealPlans';
import {
  Sparkles,
  Ticket,
  MapPin,
  Clock,
  Smartphone,
  History,
  LogOut,
  ArrowRight,
  X,
  ShieldCheck,
  MessageCircle,
  Navigation,
  UtensilsCrossed,
  SlidersHorizontal
} from 'lucide-react';

export default function MealPlanVIPBanner({ onOpenCart, onInstallPWA, isPWAInstalled }) {
  const {
    restaurantSettings,
    activeBrandId,
    getAllProducts,
    currentLocation,
    brand: menuBrand
  } = useMenuData();
  const { user: authUser } = useAuth();

  const programConfig = useMemo(
    () => getMealPlanProgramConfig(restaurantSettings),
    [restaurantSettings]
  );

  const configuredPlans = useMemo(
    () => getConfiguredMealPlans(restaurantSettings),
    [restaurantSettings]
  );

  const [activePlan, setActivePlan] = useState(null);
  const [wantsSoupToday, setWantsSoupToday] = useState(true);
  const [wantsDrinkToday, setWantsDrinkToday] = useState(true);
  const [usage, setUsage] = useState({
    totalCredits: 0,
    usedCredits: 0,
    remainingCredits: 0,
    usedTodayCount: 0,
    ordersHistory: []
  });
  const [loadingUsage, setLoadingUsage] = useState(false);

  // Cajón deslizable (Bottom Sheet) para opciones completas, historial y Bento del Día
  const [showMemberDrawer, setShowMemberDrawer] = useState(false);

  // Modal de Login / Ver Planes para visitantes
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [modalTab, setModalTab] = useState('login'); // 'login' | 'plans'
  const [includeDeliveryInPreview, setIncludeDeliveryInPreview] = useState(true);
  const [loginInput, setLoginInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [diyPlanProduct, setDiyPlanProduct] = useState(null);
  const [quickBentoProduct, setQuickBentoProduct] = useState(null);

  // Modal de dirección con Pin en Mapa
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [customAddr, setCustomAddr] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [customCoords, setCustomCoords] = useState(null);
  const lastActivatedCodeRef = useRef(null);

  const activateMemberPlan = useCallback(
    (plan, showWelcomeToast = false, autoOpenDrawer = false) => {
      if (!plan || !activeBrandId) return;

      const activationKey = `${activeBrandId}_${plan.code}_${plan.id}`;
      if (lastActivatedCodeRef.current === activationKey && !showWelcomeToast && !autoOpenDrawer) {
        return; // Ya activado previamente, corta loops infinitos de render
      }
      lastActivatedCodeRef.current = activationKey;
      if (!plan || !activeBrandId) return;

      let enrichedPlan = { ...plan };
      try {
        const savedLoc = JSON.parse(
          window.localStorage.getItem(`aa_plan_custom_loc_${activeBrandId}_${plan.code}`) || 'null'
        );
        if (savedLoc) {
          enrichedPlan = {
            ...enrichedPlan,
            default_address: savedLoc.address || enrichedPlan.default_address,
            default_delivery_notes: savedLoc.notes ?? enrichedPlan.default_delivery_notes,
            default_coords: savedLoc.coords || enrichedPlan.default_coords,
            soup_preference: savedLoc.soup_preference || enrichedPlan.soup_preference,
            drink_preference: savedLoc.drink_preference || enrichedPlan.drink_preference
          };
        }
      } catch {}

      const initialSoupMode = getPlanSoupMode(enrichedPlan, programConfig);
      setWantsSoupToday(initialSoupMode !== 'sin_sopa');
      setWantsDrinkToday(enrichedPlan.drink_preference !== 'sin_bebida');

      saveActiveMemberSession(activeBrandId, enrichedPlan);
      setActivePlan(enrichedPlan);
      setCustomAddr(enrichedPlan.default_address || '');
      setCustomNotes(enrichedPlan.default_delivery_notes || '');
      setCustomCoords(enrichedPlan.default_coords || null);

      const promoObj = buildPlanPromoObject(enrichedPlan);
      if (promoObj) {
        try {
          window.localStorage.setItem('aa_applied_coupon', JSON.stringify(promoObj));
          window.dispatchEvent(new CustomEvent('aa_coupon_applied', { detail: promoObj }));
        } catch {}
      }

      if (showWelcomeToast) {
        toast.success(`🥗 ¡Hola ${enrichedPlan.customer_name}! Tu Pase de Almuerzos está activo.`);
      }
      if (autoOpenDrawer) {
        setShowMemberDrawer(true);
      }
    },
    [activeBrandId, programConfig]
  );

  useEffect(() => {
    if (!activeBrandId || !configuredPlans.length) return;

    try {
      const params = new URLSearchParams(window.location.search);
      const urlVip = params.get('vip') || params.get('plan');
      if (urlVip) {
        const matchedFromUrl = findSubscriberPlan(configuredPlans, {
          code: urlVip,
          phone: urlVip
        });
        if (matchedFromUrl) {
          activateMemberPlan(matchedFromUrl, false);
          return;
        }
      }
    } catch {}

    const saved = getActiveMemberSession(
      activeBrandId,
      configuredPlans,
      authUser?.email || ''
    );
    if (saved) {
      activateMemberPlan(saved, false);
    } else {
      setActivePlan(null);
    }
  }, [activeBrandId, configuredPlans, authUser?.email, activateMemberPlan]);

  const refreshPlanUsage = useCallback(async () => {
    if (!activeBrandId || !activePlan) return;
    setLoadingUsage(true);
    try {
      const res = await fetchPlanUsage(supabase, activeBrandId, activePlan);
      setUsage(res);
    } finally {
      setLoadingUsage(false);
    }
  }, [activeBrandId, activePlan]);

  useEffect(() => {
    refreshPlanUsage();
  }, [refreshPlanUsage]);

  useEffect(() => {
    const handleOrderCreated = () => {
      refreshPlanUsage();
    };
    window.addEventListener('aa_meal_plan_updated', handleOrderCreated);
    return () => window.removeEventListener('aa_meal_plan_updated', handleOrderCreated);
  }, [refreshPlanUsage]);

  const handleToggleSoupPreference = (nextWantsSoup) => {
    setWantsSoupToday(nextWantsSoup);
    if (!activePlan || !activeBrandId) return;
    try {
      const existing = JSON.parse(
        window.localStorage.getItem(`aa_plan_custom_loc_${activeBrandId}_${activePlan.code}`) || '{}'
      );
      window.localStorage.setItem(
        `aa_plan_custom_loc_${activeBrandId}_${activePlan.code}`,
        JSON.stringify({
          ...existing,
          soup_preference: nextWantsSoup ? 'con_sopa' : 'sin_sopa'
        })
      );
    } catch {}
  };

  const handleToggleDrinkPreference = (nextWantsDrink) => {
    setWantsDrinkToday(nextWantsDrink);
    if (!activePlan || !activeBrandId) return;
    try {
      const existing = JSON.parse(
        window.localStorage.getItem(`aa_plan_custom_loc_${activeBrandId}_${activePlan.code}`) || '{}'
      );
      window.localStorage.setItem(
        `aa_plan_custom_loc_${activeBrandId}_${activePlan.code}`,
        JSON.stringify({
          ...existing,
          drink_preference: nextWantsDrink ? 'con_bebida' : 'sin_bebida'
        })
      );
    } catch {}
  };

  const handleManualLogin = (e) => {
    e.preventDefault();
    const clean = loginInput.trim();
    if (!clean) {
      toast.error('Ingresa tu número de celular o tu código VIP');
      return;
    }

    const found = findSubscriberPlan(configuredPlans, {
      code: clean,
      phone: clean,
      email: clean
    });

    if (!found) {
      toast.error('No encontramos una tiquetera activa con ese número o código.');
      return;
    }

    activateMemberPlan(found, true, false);
    setShowAuthModal(false);
    setLoginInput('');
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error('Error Google OAuth:', err);
      toast.error('Usa tu número de celular o código VIP para ingresar de inmediato.');
    }
  };

  const handleSaveCustomerLocation = (e) => {
    e.preventDefault();
    if (!activePlan || !activeBrandId) return;

    const updatedPlan = {
      ...activePlan,
      default_address: customAddr.trim() || activePlan.default_address,
      default_delivery_notes: customNotes.trim(),
      default_coords: customCoords || activePlan.default_coords
    };

    try {
      window.localStorage.setItem(
        `aa_plan_custom_loc_${activeBrandId}_${activePlan.code}`,
        JSON.stringify({
          address: updatedPlan.default_address,
          notes: updatedPlan.default_delivery_notes,
          coords: updatedPlan.default_coords,
          soup_preference: wantsSoupToday ? 'con_sopa' : 'sin_sopa'
        })
      );
    } catch {}

    saveActiveMemberSession(activeBrandId, updatedPlan);
    setActivePlan(updatedPlan);
    setShowAddressModal(false);
    toast.success('📍 ¡Tu dirección y punto exacto en el mapa quedaron guardados!');
  };

  const activeDailyBento = useMemo(() => {
    const allProds = typeof getAllProducts === 'function' ? getAllProducts() : [];
    return (
      allProds.find(p => p.id === 'b0000b12-0000-4000-a000-000000000002') ||
      allProds.find(p => p.is_bento_del_dia || p.is_daily_special) ||
      allProds.find(p => /bento\s+(tex-mex|mestizo|criollo|urodaki|birria)/i.test(p.name || '')) ||
      null
    );
  }, [getAllProducts]);

  const handleOpenPlanDIYBowl = () => {
    if (usage.remainingCredits <= 0) {
      toast.error('Ya consumiste todos los créditos de tu plan actual. ¡Escríbenos para renovarlo!');
      return;
    }

    const promoObj = buildPlanPromoObject(activePlan);
    if (promoObj) {
      try {
        window.localStorage.setItem('aa_applied_coupon', JSON.stringify(promoObj));
        window.dispatchEvent(new CustomEvent('aa_coupon_applied', { detail: promoObj }));
      } catch {}
    }

    const allProds = typeof getAllProducts === 'function' ? getAllProducts() : [];
    const planBowl = buildPlanDIYBowlProduct(
      allProds,
      activePlan,
      programConfig,
      wantsSoupToday,
      wantsDrinkToday
    );
    if (!planBowl) {
      toast.error('No se encontró el armador de Bowl en el catálogo.');
      return;
    }

    setShowMemberDrawer(false);
    setDiyPlanProduct(planBowl);
  };

  const handleOpenDailyBento = () => {
    if (!activeDailyBento) return;
    if (usage.remainingCredits <= 0) {
      toast.error('Ya consumiste todos los créditos de tu plan actual. ¡Escríbenos para renovarlo!');
      return;
    }

    const promoObj = buildPlanPromoObject(activePlan);
    if (promoObj) {
      try {
        window.localStorage.setItem('aa_applied_coupon', JSON.stringify(promoObj));
        window.dispatchEvent(new CustomEvent('aa_coupon_applied', { detail: promoObj }));
      } catch {}
    }

    const bentoPrice = Number(activeDailyBento?.price) || 19000;
    const bentoForPlan = {
      ...activeDailyBento,
      price: bentoPrice,
      base_plan_price: bentoPrice,
      is_plan_bowl: true,
      plan_code: activePlan?.code || 'PLAN-BOKU'
    };

    setShowMemberDrawer(false);
    const isDiy = bentoForPlan.configOptions?.is_diy || bentoForPlan.config_options?.is_diy;
    if (isDiy) {
      setDiyPlanProduct(bentoForPlan);
    } else {
      setQuickBentoProduct(bentoForPlan);
    }
  };

  const handleLogoutPlan = () => {
    lastActivatedCodeRef.current = null;
    clearActiveMemberSession(activeBrandId);
    try {
      window.localStorage.removeItem('aa_applied_coupon');
      window.dispatchEvent(new CustomEvent('aa_coupon_applied', { detail: null }));
    } catch {}
    setShowMemberDrawer(false);
    setActivePlan(null);
    toast.info('Saliste de tu sesión de tiquetera');
  };

  const handleInstallClick = () => {
    if (typeof onInstallPWA === 'function') {
      onInstallPWA();
    } else {
      setShowInstallHelp(true);
    }
  };

  const whatsappNumber = useMemo(() => {
    const raw =
      currentLocation?.whatsapp ||
      currentLocation?.phone ||
      menuBrand?.whatsapp_number ||
      menuBrand?.phone ||
      '3244402642';
    const digits = String(raw).replace(/\D/g, '');
    return digits.startsWith('57') ? digits : `57${digits}`;
  }, [currentLocation, menuBrand]);

  const activeTiers = useMemo(
    () =>
      Array.isArray(programConfig?.tiers) && programConfig.tiers.length > 0
        ? programConfig.tiers
        : MEAL_PLAN_TEMPLATES,
    [programConfig?.tiers]
  );

  const displayedTemplates = useMemo(() => {
    const filtered = activeTiers.filter(t =>
      includeDeliveryInPreview ? t.includes_delivery : !t.includes_delivery
    );
    return filtered.length > 0 ? filtered : activeTiers;
  }, [activeTiers, includeDeliveryInPreview]);

  if (programConfig?.is_enabled === false && !activePlan) return null;

  const totalStamps = Math.min(10, Math.max(5, Number(usage.totalCredits) || 5));
  const filledStamps = Math.round(
    (Math.max(0, usage.remainingCredits) / Math.max(1, usage.totalCredits)) * totalStamps
  );

  return (
    <>
      {/* TARJETA PASE VIP PREMIUM PARA EL COMENSAL (ESTILO APPLE LUMINOUS) */}
      {activePlan ? (
        <div
          data-clarity-unmask="true"
          className="relative z-20 w-full h-full rounded-[1.25rem] bg-gradient-to-br from-[#FFFFFF] via-[#FDFCF9] to-[#F5F8F5] border border-[#cba258]/55 p-3.5 sm:p-4 shadow-[0_4px_20px_rgba(47,65,49,0.05)] hover:shadow-[0_8px_30px_rgba(47,65,49,0.08)] flex flex-col justify-between transition-all duration-300"
        >
          <div>
            {/* FILA 1: Identidad del Suscriptor + Contador de Almuerzos */}
            <div className="relative z-10 flex items-start justify-between gap-2.5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#cba258]/15 border border-[#cba258]/40 text-amber-950 text-[10px] font-black tracking-wide">
                    <Sparkles className="w-2.5 h-2.5 text-[#cba258]" />
                    Club BOKU VIP • #{activePlan.code}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    {activePlan.includes_delivery
                      ? '🛵 Domicilio en tu plan'
                      : `🛵 Envío aparte ${formatCOP(activePlan.delivery_fee || 5000)}`}
                  </span>
                </div>

                <h2 className="text-[15px] sm:text-base font-black text-stone-900 mt-1 leading-tight">
                  Hola, {activePlan.customer_name}
                </h2>

                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-stone-600 font-medium">
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(true)}
                    className="inline-flex items-center gap-1 hover:text-stone-900 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3 h-3 text-[#2f4131] shrink-0" />
                    <span className="underline decoration-stone-300 underline-offset-2">
                      {activePlan.default_address || 'Asignar dirección'}
                    </span>
                  </button>
                  {activePlan.default_time && (
                    <span className="inline-flex items-center gap-1 text-stone-500 font-semibold">
                      <Clock className="w-3 h-3 text-[#2f4131] shrink-0" />
                      {activePlan.default_time}
                    </span>
                  )}
                </div>
              </div>

              {/* Contador Visual de Almuerzos Disponibles */}
              <button
                type="button"
                onClick={() => setShowMemberDrawer(true)}
                title="Ver detalles e historial de mi plan"
                className="shrink-0 rounded-xl bg-[#1D2B20] hover:bg-[#283a2c] px-3 py-1.5 text-center transition-all cursor-pointer shadow-xs"
              >
                <span className="block text-base font-black text-[#f3d493] leading-none">
                  {loadingUsage ? '...' : `${usage.remainingCredits} / ${usage.totalCredits}`}
                </span>
                <span className="block text-[8px] font-black uppercase tracking-widest text-white/70 mt-1">
                  Disponibles
                </span>
              </button>
            </div>

            {/* FILA DE SELLOS VISUALES */}
            <div className="relative z-10 mt-2.5 flex items-center gap-1">
              {Array.from({ length: totalStamps }).map((_, idx) => {
                const isAvailable = idx < filledStamps;
                return (
                  <div
                    key={idx}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      isAvailable
                        ? 'bg-gradient-to-r from-[#e3be78] to-[#cba258] shadow-[0_0_6px_rgba(203,162,88,0.4)]'
                        : 'bg-stone-200'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* FILA 2: Selector Rápido Sopa & Bebida + Botón Principal */}
          <div className="relative z-10 mt-3 pt-2.5 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Switch 1-Toque Con Sopa vs Sin Sopa */}
              <div className="inline-flex items-center p-0.5 rounded-xl bg-stone-100 border border-stone-200/80">
                <button
                  type="button"
                  onClick={() => handleToggleSoupPreference(true)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                    wantsSoupToday
                      ? 'bg-[#2f4131] text-white shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  🥣 Sopa/Fruta
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleSoupPreference(false)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                    !wantsSoupToday
                      ? 'bg-[#2f4131] text-white shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  🥗 Sin Sopa
                </button>
              </div>

              {/* Switch 1-Toque Con Bebida vs Sin Bebida */}
              <button
                type="button"
                onClick={() => handleToggleDrinkPreference(!wantsDrinkToday)}
                className={`px-2 py-1.5 rounded-xl border text-[10px] font-extrabold transition-all cursor-pointer ${
                  wantsDrinkToday
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-stone-100 border-stone-200/80 text-stone-500 hover:text-stone-800'
                }`}
                title="Incluir o quitar Jugo del Día en tu almuerzo"
              >
                {wantsDrinkToday ? '🥤 Con Jugo' : '🚫 Sin Bebida'}
              </button>
            </div>

            {/* Acciones derechas: Opciones + Armar Plato */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowMemberDrawer(true)}
                title="Opciones de mi plan, mapa e historial"
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleOpenPlanDIYBowl}
                disabled={usage.remainingCredits <= 0}
                className="px-3.5 py-2 rounded-xl bg-[#1D2B20] hover:bg-[#283a2c] disabled:opacity-50 text-[#f3d493] font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <span>
                  {usage.remainingCredits > 0 ? 'Armar plato' : 'Renovar Plan'}
                </span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* VISTA VISITANTE: CARD APPLE-STYLE PREMIUM */
        <div
          data-clarity-unmask="true"
          className="relative z-20 w-full h-full rounded-[1.25rem] bg-white/95 backdrop-blur-md border border-stone-200/80 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-stone-300 flex flex-col justify-between transition-all duration-300"
        >
          <div>
            {/* Fila superior: Badge Apple-style + Pill de Ahorro */}
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-[10px] font-black uppercase tracking-wider">
                <span>🥗</span>
                <span>Club BOKU</span>
              </span>
              <span className="text-[10px] font-bold text-amber-900 bg-amber-50/90 px-2 py-0.5 rounded-full border border-amber-200/60">
                Desde $15.000 / día
              </span>
            </div>

            {/* Título y Subtítulo exactos solicitados */}
            <h3 className="text-sm sm:text-base font-black text-stone-900 tracking-tight leading-snug mt-2.5">
              Club BOKU (Pase de Almuerzos)
            </h3>
            <p className="text-xs text-stone-500 font-medium leading-relaxed mt-1 line-clamp-2">
              Tu almuerzo fit listo cada día en tu puerta a precio especial.
            </p>
          </div>

          {/* Fila inferior de botones de acción */}
          <div className="flex items-center justify-between gap-2 mt-3.5 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={() => {
                setModalTab('plans');
                setShowAuthModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-stone-100/90 hover:bg-stone-200/80 text-stone-800 font-bold text-xs transition-colors cursor-pointer"
            >
              Ver Planes
            </button>
            <button
              type="button"
              onClick={() => {
                setModalTab('login');
                setShowAuthModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#1D2B20] hover:bg-[#283a2c] text-[#f3d493] font-black text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>Soy Miembro</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* CAJÓN DESLIZABLE (BOTTOM SHEET) CON PORTAL PARA NO SOLAPARSE NUNCA CON LA NAVBAR */}
      {showMemberDrawer && activePlan && (
        <Portal>
          <div
            data-clarity-unmask="true"
            className="fixed inset-0 z-[9990] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150"
            onClick={() => setShowMemberDrawer(false)}
          >
            <div
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 pb-8 sm:pb-6 shadow-2xl border-t sm:border border-stone-200 space-y-3.5 max-h-[90dvh] overflow-y-auto"
            >
              <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto -mt-1 sm:hidden" />

              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-[#2f4131]/10 text-[#2f4131] text-[10px] font-extrabold uppercase tracking-wide">
                      Pase Activo
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-mono text-[10px] font-bold">
                      #{activePlan.code}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-[#1A1A1A] mt-1">
                    Hola, {activePlan.customer_name}
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleLogoutPlan}
                    title="Cambiar de cuenta"
                    className="p-2 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-500 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMemberDrawer(false)}
                    className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-stone-200/90 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-[#2f4131]" />
                    Almuerzos Disponibles
                  </span>
                  <span className="text-sm font-black text-[#2f4131]">
                    {loadingUsage ? '...' : `${usage.remainingCredits} de ${usage.totalCredits}`}
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-stone-200/80 overflow-hidden">
                  <div
                    className="h-full bg-[#2f4131] rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, (usage.remainingCredits / Math.max(1, usage.totalCredits)) * 100)
                      )}%`
                    }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-stone-500">
                  <span>
                    {activePlan.includes_delivery
                      ? '🛵 Domicilio incluido en tu plan'
                      : `🛵 Envío aparte (${formatCOP(activePlan.delivery_fee || 5000)})`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowHistory(prev => !prev)}
                    className="inline-flex items-center gap-1 font-bold text-stone-700 hover:text-[#2f4131] cursor-pointer"
                  >
                    <History className="w-3 h-3" />
                    <span>Historial ({usage.usedCredits} usados)</span>
                  </button>
                </div>

                {showHistory && (
                  <div className="pt-2 border-t border-stone-200/70 space-y-1 max-h-28 overflow-y-auto text-[11px]">
                    {usage.ordersHistory.length === 0 ? (
                      <p className="text-stone-400">Aún no has redimido créditos de este plan.</p>
                    ) : (
                      usage.ordersHistory.map((ord, idx) => (
                        <div key={ord.id} className="flex items-center justify-between py-0.5 text-stone-600">
                          <span>
                            #{usage.ordersHistory.length - idx} •{' '}
                            {new Date(ord.created_at).toLocaleDateString('es-CO', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short'
                            })}
                          </span>
                          <span className="font-bold text-[#2f4131]">✓ 1 Crédito</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-500">
                  1. ¿Cómo quieres tu almuerzo hoy?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleSoupPreference(true)}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      wantsSoupToday
                        ? 'border-[#2f4131] bg-[#2f4131]/5 ring-1 ring-[#2f4131]'
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <span className="text-xs font-black text-stone-900 block">🥣 Con Sopa / Fruta</span>
                    <span className="text-[10px] text-stone-500 leading-tight block mt-0.5">
                      Sopita del día (16 oz) o Fruta fresca
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleSoupPreference(false)}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      !wantsSoupToday
                        ? 'border-[#2f4131] bg-[#2f4131]/5 ring-1 ring-[#2f4131]'
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <span className="text-xs font-black text-stone-900 block">🥗 Sin Sopa (Solo Bowl)</span>
                    <span className="text-[10px] text-stone-500 leading-tight block mt-0.5">
                      1 Base + Proteína + 5 Toppings
                    </span>
                  </button>
                </div>

                {/* Selector de Bebida del Almuerzo */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleDrinkPreference(true)}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      wantsDrinkToday
                        ? 'border-[#2f4131] bg-[#2f4131]/5 ring-1 ring-[#2f4131]'
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <span className="text-xs font-black text-stone-900 block">🥤 Con Bebida</span>
                    <span className="text-[10px] text-stone-500 leading-tight block mt-0.5">
                      Jugo del Día (5 oz) o upgrade a Té Hatsu
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleDrinkPreference(false)}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      !wantsDrinkToday
                        ? 'border-[#2f4131] bg-[#2f4131]/5 ring-1 ring-[#2f4131]'
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <span className="text-xs font-black text-stone-900 block">🚫 Sin Bebida</span>
                    <span className="text-[10px] text-stone-500 leading-tight block mt-0.5">
                      No incluir bebida con mi almuerzo
                    </span>
                  </button>
                </div>

                <p className="text-[10px] text-stone-500 bg-stone-50 border border-stone-200/70 rounded-xl px-2.5 py-1.5 leading-snug">
                  💡 <strong>Regla de Tiquetera:</strong> 1 crédito cubre 1 almuerzo personal por día. Si agregas adiciones extra, otra bebida o un 2° plato para alguien más, se suman a precio normal.
                </p>
              </div>

              <div className="p-3 rounded-2xl border border-stone-200/90 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                    Punto de entrega programado
                  </p>
                  <p className="text-xs font-extrabold text-stone-800 truncate flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#2f4131] shrink-0" />
                    <span>{activePlan.default_address || 'Asignar dirección'}</span>
                    {activePlan.default_time && (
                      <span className="text-stone-500 font-semibold">• {activePlan.default_time}</span>
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddressModal(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Navigation className="w-3 h-3 text-[#2f4131]" />
                  <span>{activePlan.default_coords?.lat ? 'Editar Mapa' : 'Fijar Pin'}</span>
                </button>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleOpenPlanDIYBowl}
                  disabled={usage.remainingCredits <= 0}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#2f4131] hover:bg-[#233124] disabled:bg-stone-200 disabled:text-stone-400 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98"
                >
                  <Sparkles className="w-4 h-4 text-[#cba258] shrink-0" />
                  <span>
                    {usage.remainingCredits > 0
                      ? wantsSoupToday
                        ? 'Armar mi Bowl + Sopa de Hoy (1 Crédito)'
                        : 'Armar mi Bowl de Hoy (1 Crédito)'
                      : 'Sin créditos disponibles — Renovar Plan'}
                  </span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>

                {activeDailyBento && usage.remainingCredits > 0 && (
                  <button
                    type="button"
                    onClick={handleOpenDailyBento}
                    className="w-full py-2.5 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5 text-[#cba258] shrink-0" />
                    <span>O pedir hoy: {activeDailyBento.name} (1 Crédito)</span>
                  </button>
                )}

                {!isPWAInstalled && (
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="w-full py-2 text-stone-500 hover:text-stone-800 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Instalar acceso directo en mi pantalla de inicio</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* MODAL PARA MARCAR EN EL MAPA LA UBICACIÓN EXACTA PARA EL DOMICILIARIO */}
      {showAddressModal && activePlan && (
        <div
          data-clarity-unmask="true"
          className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#2f4131]" />
                  Punto Exacto de Entrega en el Mapa
                </h3>
                <p className="text-xs text-stone-500">
                  Marca tu casa en el mapa para que el domiciliario llegue directo todos los días.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                className="p-1.5 rounded-xl bg-stone-100 text-stone-500 hover:text-stone-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomerLocation} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                  Dirección y Punto en el Mapa (Toca &quot;GPS&quot; o &quot;Mapa&quot;)
                </label>
                <AddressInputWithMap
                  value={customAddr}
                  onChange={setCustomAddr}
                  currentLocation={currentLocation}
                  initialCoords={customCoords}
                  onLocationSelect={locInfo => {
                    if (locInfo?.coords) {
                      setCustomCoords(locInfo.coords);
                    }
                  }}
                  placeholder="Ej: Paso Ancho, Calle 4 # 5-20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-stone-500 mb-1">
                  Indicaciones para el Domiciliario (Casa / Apto / Color de Portón)
                </label>
                <input
                  type="text"
                  value={customNotes}
                  onChange={e => setCustomNotes(e.target.value)}
                  placeholder="Ej: Casa segundo piso portón blanco, entregar 2:30 PM"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm font-semibold text-stone-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#2f4131] hover:bg-[#233124] text-white font-black text-xs shadow-md cursor-pointer"
                >
                  ✓ Guardar mi Punto Exacto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE VALIDACIÓN DE IDENTIDAD + CATÁLOGO DE PLANES */}
      {showAuthModal && (
        <div
          data-clarity-unmask="true"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#FAF7F2] border-b border-stone-200/80 p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#2f4131]/10 text-[#2f4131] flex items-center justify-center">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-[#1A1A1A] leading-tight">
                    Club BOKU • Pase de Almuerzos
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Almuerzos personalizados con o sin sopa todos los días
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="p-1.5 rounded-xl bg-stone-200/60 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 p-1.5 bg-stone-100 border-b border-stone-200">
              <button
                type="button"
                onClick={() => setModalTab('login')}
                className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  modalTab === 'login'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                🔐 Ingresar a mi Pase Club BOKU
              </button>
              <button
                type="button"
                onClick={() => setModalTab('plans')}
                className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  modalTab === 'plans'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                🥗 Ver Precios de Planes
              </button>
            </div>

            {modalTab === 'login' ? (
              <div className="p-5 space-y-4">
                <p className="text-xs font-bold text-stone-600 leading-relaxed">
                  Ingresa tu número de celular o código de miembro para abrir tu tiquetera:
                </p>

                <form onSubmit={handleManualLogin} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-stone-500 mb-1">
                      Celular o Código VIP
                    </label>
                    <input
                      type="text"
                      value={loginInput}
                      onChange={e => setLoginInput(e.target.value)}
                      placeholder="Ej: 3125535583 o CHAN"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2f4131]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-[#2f4131] hover:bg-[#233124] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#cba258]" />
                    <span>Ingresar a mi Pase</span>
                  </button>
                </form>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-stone-200" />
                  <span className="flex-shrink mx-3 text-[10px] font-bold uppercase text-stone-400">
                    O con tu cuenta Google
                  </span>
                  <div className="flex-grow border-t border-stone-200" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full py-2.5 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                    />
                  </svg>
                  <span>Validar con Google</span>
                </button>
              </div>
            ) : (
              <div className="p-4 sm:p-5 space-y-3.5 max-h-[75vh] overflow-y-auto">
                <div className="flex items-center justify-between gap-2 bg-stone-100 p-1.5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setIncludeDeliveryInPreview(false)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                      !includeDeliveryInPreview
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-500'
                    }`}
                  >
                    Solo Almuerzos
                  </button>
                  <button
                    type="button"
                    onClick={() => setIncludeDeliveryInPreview(true)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                      includeDeliveryInPreview
                        ? 'bg-[#2f4131] text-white shadow-xs'
                        : 'text-stone-500'
                    }`}
                  >
                    🛵 Todo Incluido (+Envío)
                  </button>
                </div>

                <div className="space-y-2.5">
                  {displayedTemplates.map(t => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-2xl border border-stone-200 hover:border-[#2f4131]/50 bg-[#FAF7F2]/60 flex items-center justify-between gap-3 transition-all"
                    >
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded-full bg-[#2f4131]/10 text-[#2f4131] text-[10px] font-black">
                          {t.badge}
                        </span>
                        <h4 className="text-xs sm:text-sm font-black text-stone-900 mt-1">
                          {t.label}
                        </h4>
                        <p className="text-[11px] text-stone-500">{t.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm sm:text-base font-black text-[#2f4131]">
                          {formatCOP(t.plan_price)}
                        </p>
                        <a
                          href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                            `¡Hola! Quiero activar el *${t.label}* (${formatCOP(
                              t.plan_price
                            )}) para pedir todos los días 🥗`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2f4131] hover:bg-[#233124] text-white text-[10px] font-black"
                        >
                          <MessageCircle className="w-3 h-3" />
                          Activar Plan
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-stone-500 text-center leading-relaxed">
                  ✨ Funciona como <strong>Tiquetera Flexible</strong>: eliges cada día con sopa o sin sopa, y si un día no pides tu crédito se conserva.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE INSTRUCCIONES PARA INSTALAR LA APP (PWA) */}
      {showInstallHelp && (
        <div
          data-clarity-unmask="true"
          className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#2f4131]" />
                Instala la App en tu Celular
              </h3>
              <button
                type="button"
                onClick={() => setShowInstallHelp(false)}
                className="p-1 rounded-lg bg-stone-100 text-stone-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-stone-600 space-y-2 leading-relaxed">
              <p>
                Para entrar en 1 toque todos los días con tu tiquetera ya abierta:
              </p>
              <p className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-medium">
                📱 <strong>En iPhone (Safari):</strong> Toca el botón <strong>Compartir</strong> y elige <strong>&quot;Agregar a inicio&quot;</strong>.
              </p>
              <p className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-medium">
                🤖 <strong>En Android (Chrome):</strong> Toca los <strong>3 puntos (⋮)</strong> arriba a la derecha y elige <strong>&quot;Instalar aplicación&quot;</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowInstallHelp(false)}
              className="w-full py-2.5 rounded-xl bg-stone-900 text-white font-black text-xs cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* MODAL DIY PARA ARMAR EL BOWL DEL DÍA DE LA TIQUETERA */}
      <DIYProductModal
        open={Boolean(diyPlanProduct)}
        product={diyPlanProduct}
        onClose={() => setDiyPlanProduct(null)}
        onAdd={() => {
          setDiyPlanProduct(null);
          if (typeof onOpenCart === 'function') {
            onOpenCart();
          }
        }}
      />

      {/* MODAL QUICKVIEW SI EL MIEMBRO ELIGE EL BENTO DEL DÍA CON SU CRÉDITO */}
      <ProductQuickView
        open={Boolean(quickBentoProduct)}
        product={quickBentoProduct}
        onClose={() => setQuickBentoProduct(null)}
        onAdded={() => {
          setQuickBentoProduct(null);
          if (typeof onOpenCart === 'function') {
            onOpenCart();
          }
        }}
      />
    </>
  );
}
