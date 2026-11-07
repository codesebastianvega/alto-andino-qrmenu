import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../../../config/supabase';
import { useMenuData } from '../../../context/MenuDataContext';
import { useAuth } from '../../../context/AuthContext';
import { toast } from '../../Toast';
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
} from '../../../utils/mealPlans';

export function useMealPlanVIP({ onInstallPWA } = {}) {
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

  const totalStamps = Math.min(10, Math.max(5, Number(usage.totalCredits) || 5));
  const filledStamps = Math.round(
    (Math.max(0, usage.remainingCredits) / Math.max(1, usage.totalCredits)) * totalStamps
  );

  return {
    // State
    activePlan,
    wantsSoupToday,
    wantsDrinkToday,
    usage,
    loadingUsage,
    showMemberDrawer,
    setShowMemberDrawer,
    showAuthModal,
    setShowAuthModal,
    modalTab,
    setModalTab,
    includeDeliveryInPreview,
    setIncludeDeliveryInPreview,
    loginInput,
    setLoginInput,
    showHistory,
    setShowHistory,
    showInstallHelp,
    setShowInstallHelp,
    diyPlanProduct,
    setDiyPlanProduct,
    quickBentoProduct,
    setQuickBentoProduct,
    showAddressModal,
    setShowAddressModal,
    customAddr,
    setCustomAddr,
    customNotes,
    setCustomNotes,
    customCoords,
    setCustomCoords,

    // Config & Memos
    programConfig,
    configuredPlans,
    activeDailyBento,
    whatsappNumber,
    activeTiers,
    displayedTemplates,
    totalStamps,
    filledStamps,
    currentLocation,

    // Handlers
    activateMemberPlan,
    refreshPlanUsage,
    handleToggleSoupPreference,
    handleToggleDrinkPreference,
    handleManualLogin,
    handleGoogleLogin,
    handleSaveCustomerLocation,
    handleOpenPlanDIYBowl,
    handleOpenDailyBento,
    handleLogoutPlan,
    handleInstallClick
  };
}
