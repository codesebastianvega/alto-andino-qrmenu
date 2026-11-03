import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useMenuData } from '../context/MenuDataContext';
import { useAuth } from '../context/AuthContext';
import { formatCOP } from '../utils/money';
import { toast } from './Toast';
import DIYProductModal from './DIYProductModal';
import {
  MEAL_PLAN_TEMPLATES,
  getConfiguredMealPlans,
  findSubscriberPlan,
  saveActiveMemberSession,
  getActiveMemberSession,
  clearActiveMemberSession,
  fetchPlanUsage,
  buildPlanPromoObject,
  buildPlanDIYBowlProduct
} from '../utils/mealPlans';
import {
  Sparkles,
  Ticket,
  CheckCircle2,
  MapPin,
  Clock,
  Smartphone,
  History,
  LogOut,
  Lock,
  ArrowRight,
  X,
  ShieldCheck,
  MessageCircle
} from 'lucide-react';

export default function MealPlanVIPBanner({ onOpenCart, onInstallPWA, isPWAInstalled }) {
  const { restaurantSettings, activeBrandId, getAllProducts, currentLocation, brand: menuBrand, storeStatusInfo } = useMenuData();
  const { user: authUser } = useAuth();

  const configuredPlans = useMemo(
    () => getConfiguredMealPlans(restaurantSettings),
    [restaurantSettings]
  );

  const [activePlan, setActivePlan] = useState(null);
  const [usage, setUsage] = useState({
    totalCredits: 0,
    usedCredits: 0,
    remainingCredits: 0,
    ordersHistory: []
  });
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [modalTab, setModalTab] = useState('login'); // 'login' | 'plans'
  const [includeDeliveryInPreview, setIncludeDeliveryInPreview] = useState(true);
  const [loginInput, setLoginInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [diyPlanProduct, setDiyPlanProduct] = useState(null);

  const activateMemberPlan = useCallback(
    (plan, showWelcomeToast = false) => {
      if (!plan || !activeBrandId) return;
      saveActiveMemberSession(activeBrandId, plan);
      setActivePlan(plan);

      // Aplicar automáticamente el beneficio de la tiquetera al carrito
      const promoObj = buildPlanPromoObject(plan);
      if (promoObj) {
        try {
          window.localStorage.setItem('aa_applied_coupon', JSON.stringify(promoObj));
          window.dispatchEvent(new CustomEvent('aa_coupon_applied', { detail: promoObj }));
        } catch {}
      }

      if (showWelcomeToast) {
        toast.success(`🥗 ¡Hola ${plan.customer_name}! Tu Tiquetera BOKU Fit está activa.`);
      }
    },
    [activeBrandId]
  );

  // 1. Detectar parámetro ?vip=CODE o ?plan=CODE en la URL, o sesión previa / Google OAuth
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
          activateMemberPlan(matchedFromUrl, true);
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

  // 2. Consultar créditos consumidos en tiempo real desde la tabla orders
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

  // Escuchar evento cuando se confirma un pedido para actualizar el contador al instante
  useEffect(() => {
    const handleOrderCreated = () => {
      refreshPlanUsage();
    };
    window.addEventListener('aa_meal_plan_updated', handleOrderCreated);
    return () => window.removeEventListener('aa_meal_plan_updated', handleOrderCreated);
  }, [refreshPlanUsage]);

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
      toast.error('No encontramos una tiquetera activa con ese número o código. Verifica o escríbenos por WhatsApp.');
      return;
    }

    activateMemberPlan(found, true);
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

  const handleOpenPlanDIYBowl = () => {
    if (storeStatusInfo && !storeStatusInfo.isOpen) {
      toast.error('En este momento la cocina está en pausa. Podrás pedir tu Bowl apenas abramos.');
      return;
    }

    if (usage.remainingCredits <= 0) {
      toast.error('Ya consumiste todos los créditos de tu plan actual. ¡Escríbenos para renovarlo!');
      return;
    }

    // Asegurar que el cupón/crédito del plan esté activo en el carrito
    const promoObj = buildPlanPromoObject(activePlan);
    if (promoObj) {
      try {
        window.localStorage.setItem('aa_applied_coupon', JSON.stringify(promoObj));
        window.dispatchEvent(new CustomEvent('aa_coupon_applied', { detail: promoObj }));
      } catch {}
    }

    const allProds = typeof getAllProducts === 'function' ? getAllProducts() : [];
    const planBowl = buildPlanDIYBowlProduct(allProds, activePlan);
    if (!planBowl) {
      toast.error('No se encontró el armador de Bowl en el catálogo.');
      return;
    }

    setDiyPlanProduct(planBowl);
  };

  const handleLogoutPlan = () => {
    clearActiveMemberSession(activeBrandId);
    try {
      window.localStorage.removeItem('aa_applied_coupon');
      window.dispatchEvent(new CustomEvent('aa_coupon_applied', { detail: null }));
    } catch {}
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

  const displayedTemplates = useMemo(() => {
    return MEAL_PLAN_TEMPLATES.filter(t =>
      includeDeliveryInPreview ? t.includes_delivery : !t.includes_delivery
    );
  }, [includeDeliveryInPreview]);

  return (
    <>
      {/* VISTA 1: MIEMBRO VALIDADO -> TARJETA VIP EN EL INICIO DEL MENÚ */}
      {activePlan ? (
        <div
          data-clarity-unmask="true"
          className="relative z-20 mb-4 w-full rounded-2xl bg-gradient-to-br from-emerald-950 via-[#132A21] to-stone-950 text-white p-4 sm:p-5 shadow-[0_14px_34px_rgba(16,185,129,0.16)] border border-emerald-500/40 overflow-hidden"
        >
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-3">
            {/* Cabecera Miembro */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-400 text-emerald-950 text-[10px] font-black uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    Mi Plan BOKU Fit
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-emerald-200 text-[10px] font-bold border border-white/10">
                    Código: {activePlan.code}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-white mt-1.5 leading-tight">
                  ¡Hola, {activePlan.customer_name}! 🥗
                </h2>
                <p className="text-[11px] sm:text-xs text-emerald-100/80 font-medium">
                  {activePlan.dietary_notes || '1 Base + 1 Proteína + 5 Toppings/Verduras + Semillas + Salsa'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogoutPlan}
                title="Cambiar de cuenta"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors text-[10px] flex items-center gap-1 shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Contador Visual de Créditos (Tiquetera) */}
            <div className="p-3 rounded-xl bg-black/25 border border-white/10 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5" />
                  Almuerzos Disponibles
                </span>
                <span className="text-sm sm:text-base font-black text-white">
                  {loadingUsage ? '...' : `${usage.remainingCredits} de ${usage.totalCredits}`}
                </span>
              </div>

              {/* Barra de progreso */}
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, (usage.remainingCredits / Math.max(1, usage.totalCredits)) * 100)
                    )}%`
                  }}
                />
              </div>

              {/* Info de entrega preconfigurada */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-white/80">
                <div className="flex items-center gap-2 flex-wrap">
                  {activePlan.default_address && (
                    <span className="inline-flex items-center gap-1 text-white/90 font-semibold">
                      <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                      {activePlan.default_address}
                    </span>
                  )}
                  {activePlan.default_time && (
                    <span className="inline-flex items-center gap-1 text-emerald-200 font-semibold">
                      <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
                      {activePlan.default_time}
                    </span>
                  )}
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-[10px] font-bold">
                  {activePlan.includes_delivery
                    ? '🛵 Domicilio Incluido ($0)'
                    : `🛵 Envío: ${formatCOP(activePlan.delivery_fee || 5000)}`}
                </span>
              </div>
            </div>

            {/* Botón Principal para Armar el Bowl del Día */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                type="button"
                onClick={handleOpenPlanDIYBowl}
                disabled={usage.remainingCredits <= 0}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:bg-stone-700 disabled:text-stone-400 text-emerald-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-98"
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>
                  {usage.remainingCredits > 0
                    ? 'Armar mi Bowl de Hoy (Usar 1 Crédito)'
                    : 'Sin créditos disponibles — Renovar Plan'}
                </span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              <div className="flex items-center gap-2">
                {!isPWAInstalled && (
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="flex-1 sm:flex-initial py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                    <span>Instalar App</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowHistory(prev => !prev)}
                  className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span>Usados ({usage.usedCredits})</span>
                </button>
              </div>
            </div>

            {/* Historial desplegable de almuerzos redimidos */}
            {showHistory && (
              <div className="mt-1 p-3 rounded-xl bg-black/30 border border-white/10 text-xs space-y-1.5">
                <p className="font-bold text-emerald-300 text-[11px] uppercase tracking-wider">
                  Historial de almuerzos redimidos en tu plan:
                </p>
                {usage.ordersHistory.length === 0 ? (
                  <p className="text-white/60 text-[11px]">
                    Aún no has redimido ningún almuerzo de este paquete. ¡Arma tu primer Bowl hoy!
                  </p>
                ) : (
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {usage.ordersHistory.map((ord, idx) => (
                      <div
                        key={ord.id}
                        className="flex items-center justify-between py-1 border-b border-white/5 text-[11px]"
                      >
                        <span className="text-white/90 font-medium">
                          #{usage.ordersHistory.length - idx} •{' '}
                          {new Date(ord.created_at).toLocaleDateString('es-CO', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className="text-emerald-300 font-bold">✓ 1 Crédito usado</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* VISTA 2: BARRA COMPACTA PARA ACTIVAR TIQUETERA O VER PLANES */
        <div
          data-clarity-unmask="true"
          className="relative z-20 mb-3.5 w-full rounded-2xl bg-gradient-to-r from-[#1A2421] via-[#22312C] to-[#1A2421] text-white p-3 sm:px-4 sm:py-3 shadow-sm border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
              <Ticket className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] sm:text-xs font-black text-emerald-300 uppercase tracking-wide">
                  🥗 Planes Tiquetera BOKU Fit
                </span>
                <span className="px-1.5 py-0.2 rounded bg-white/10 text-[9px] font-bold text-white/80">
                  Semanal • Quincenal • Mensual
                </span>
              </div>
              <p className="text-[11px] text-white/75 truncate">
                Arma tu Bowl todos los días a precio especial o ingresa con tu código de miembro.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                setModalTab('login');
                setShowAuthModal(true);
              }}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Lock className="w-3 h-3" />
              <span>Soy Miembro</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setModalTab('plans');
                setShowAuthModal(true);
              }}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-[11px] transition-all cursor-pointer text-center"
            >
              Ver Planes
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE VALIDACIÓN DE IDENTIDAD + CATÁLOGO DE PLANES BOKU FIT */}
      {showAuthModal && (
        <div
          data-clarity-unmask="true"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/65 backdrop-blur-xs p-4"
        >
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1A2421] to-[#24352F] p-4 sm:p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black leading-tight">
                    Club BOKU Fit • Tiquetera Digital
                  </h3>
                  <p className="text-[11px] text-white/70">
                    Arma tu Bowl saludable todos los días
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selector de Pestañas */}
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
                🔐 Validar mi Plan
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
                <div>
                  <p className="text-xs font-bold text-stone-700 leading-relaxed">
                    Si ya activaste tu Plan Semanal, Quincenal o Mensual, valida tu identidad para desbloquear el armador de **Bowl BOKU Fit** y tus créditos:
                  </p>
                </div>

                <form onSubmit={handleManualLogin} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-stone-500 mb-1">
                      Tu Número de Celular o Código VIP
                    </label>
                    <input
                      type="text"
                      value={loginInput}
                      onChange={e => setLoginInput(e.target.value)}
                      placeholder="Ej: 3125535583 o ERIKA-BOKU"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-[#1A2421] hover:bg-emerald-900 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Desbloquear mi Tiquetera</span>
                  </button>
                </form>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-stone-200" />
                  <span className="flex-shrink mx-3 text-[10px] font-bold uppercase text-stone-400">
                    O con tu correo
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
                    Solo Bowls
                  </button>
                  <button
                    type="button"
                    onClick={() => setIncludeDeliveryInPreview(true)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                      includeDeliveryInPreview
                        ? 'bg-emerald-600 text-white shadow-xs'
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
                      className="p-3.5 rounded-2xl border border-stone-200 hover:border-emerald-500/50 bg-stone-50/60 flex items-center justify-between gap-3 transition-all"
                    >
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black">
                          {t.badge}
                        </span>
                        <h4 className="text-xs sm:text-sm font-black text-stone-900 mt-1">
                          {t.label}
                        </h4>
                        <p className="text-[11px] text-stone-500">{t.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm sm:text-base font-black text-emerald-700">
                          {formatCOP(t.plan_price)}
                        </p>
                        <a
                          href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                            `¡Hola Boku! Quiero activar el *${t.label}* (${formatCOP(
                              t.plan_price
                            )}) para armar mi Bowl todos los días 🥗`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black"
                        >
                          <MessageCircle className="w-3 h-3" />
                          Pedir Plan
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-stone-500 text-center leading-relaxed">
                  ✨ Todos los planes funcionan como **Tiquetera Flexible**: si un día no pides, tu crédito se conserva.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE AYUDA PARA INSTALAR LA APP EN EL CELULAR */}
      {showInstallHelp && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3.5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-stone-900 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                Instalar App BOKU en tu celular
              </h3>
              <button
                type="button"
                onClick={() => setShowInstallHelp(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Agrega BOKU a tu pantalla de inicio para entrar en 1 toque cada día a armar tu Bowl con tu tiquetera ya iniciada:
            </p>
            <div className="space-y-2 text-xs bg-stone-50 p-3 rounded-xl border border-stone-200">
              <p className="font-bold text-stone-800">
                🍏 En iPhone (Safari):
              </p>
              <p className="text-stone-600 text-[11px]">
                Toca el botón **Compartir** (cuadro con flecha arriba) en la barra inferior y selecciona **&quot;Agregar a inicio&quot;**.
              </p>
              <p className="font-bold text-stone-800 pt-1">
                🤖 En Android (Chrome):
              </p>
              <p className="text-stone-600 text-[11px]">
                Toca los **3 puntos (⋮)** arriba a la derecha y selecciona **&quot;Instalar aplicación&quot;** o **&quot;Agregar a la pantalla principal&quot;**.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowInstallHelp(false)}
              className="w-full py-2.5 rounded-xl bg-stone-900 text-white text-xs font-black cursor-pointer"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}

      {/* DIY MODAL ESPECIAL DEL PLAN TIQUETERA */}
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
    </>
  );
}
