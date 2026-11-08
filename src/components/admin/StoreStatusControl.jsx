import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { useMenuData } from '../../context/MenuDataContext';
import { getNextOpeningDateTime, formatTime12h } from '../../utils/businessHours';
import { toast } from '../Toast';
import { 
  Power, Clock, PauseCircle, PlayCircle, MessageSquare, 
  Tag, ShieldCheck, X, AlertTriangle, Sparkles, Check
} from 'lucide-react';

const QUICK_MESSAGES = [
  {
    label: '🔥 Alta demanda',
    text: 'Estamos preparando pedidos acumulados en cocina, volvemos a recibir órdenes en breve.'
  },
  {
    label: '🌙 Cerrado por hoy',
    text: 'Cerramos cocina por el día de hoy. ¡Te esperamos mañana desde la hora de apertura habitual!'
  },
  {
    label: '🛵 Pausa de domicilios',
    text: 'Nuestros domiciliarios están en ruta con pedidos activos. Volvemos en unos minutos.'
  },
  {
    label: '⚡ Pausa operativa',
    text: 'Estamos realizando un ajuste rápido en cocina, regresamos muy pronto.'
  }
];

const COUPON_PRESETS = [
  { code: 'VOLVER10', label: '10% de Descuento por la espera (Candado por Huella)', benefit: '10% OFF en su próxima compra' },
];

export default function StoreStatusControl() {
  const { activeBrand, refreshProfile } = useAuth();
  const { brand: menuBrand, refetchMenuData, currentBusinessHours, storeStatusInfo } = useMenuData();

  const currentBrand = activeBrand || menuBrand;
  const brandId = currentBrand?.id;

  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localStoreStatus, setLocalStoreStatus] = useState(null);

  // Sync with brand config
  useEffect(() => {
    const cfgStatus = currentBrand?.config?.store_status || menuBrand?.config?.store_status || null;
    setLocalStoreStatus(cfgStatus);
  }, [currentBrand?.config?.store_status, menuBrand?.config?.store_status]);

  // Evaluate whether currently paused
  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  const isCurrentlyPaused = useMemo(() => {
    if (!localStoreStatus?.is_paused) return false;
    if (!localStoreStatus.pause_until) return true;
    return new Date(localStoreStatus.pause_until).getTime() > nowTick;
  }, [localStoreStatus, nowTick]);

  const isScheduleClosed = !isCurrentlyPaused && storeStatusInfo && !storeStatusInfo.isOpen && storeStatusInfo.isScheduleClosed;

  // Próxima apertura calculada a partir de mañana según business_hours
  const nextOpeningTomorrow = useMemo(() => {
    return getNextOpeningDateTime(currentBusinessHours, { targetTomorrow: true });
  }, [currentBusinessHours]);

  const durationOptions = useMemo(() => [
    { id: '30m', label: '30 Minutos', sub: 'Reabre sola en 30 min', minutes: 30, icon: '⏱️' },
    { id: '1h', label: '1 Hora', sub: 'Reabre sola en 1 hora', minutes: 60, icon: '⏱️' },
    { id: '2h', label: '2 Horas', sub: 'Reabre sola en 2 horas', minutes: 120, icon: '⏱️' },
    { 
      id: 'today', 
      label: 'Hasta mañana', 
      sub: `Reabre ${nextOpeningTomorrow?.formatted || 'mañana a las 9:00 AM'} automáticamente`, 
      minutes: 'today', 
      icon: '🌙' 
    },
    { id: 'indefinite', label: 'Apagado Indefinido', sub: 'Hasta que la enciendas manualmente', minutes: null, icon: '🔒' },
  ], [nextOpeningTomorrow]);

  // Form states for modal
  const [selectedDuration, setSelectedDuration] = useState('1h');
  const [customMessage, setCustomMessage] = useState(QUICK_MESSAGES[0].text);
  const [offerCoupon, setOfferCoupon] = useState(true);
  const [selectedCouponCode, setSelectedCouponCode] = useState('VOLVER10');

  const handleOpenModal = () => {
    if (localStoreStatus && isCurrentlyPaused) {
      setSelectedDuration(localStoreStatus.pause_mode || '1h');
      setCustomMessage(localStoreStatus.custom_message || QUICK_MESSAGES[0].text);
      setOfferCoupon(localStoreStatus.offer_compensation_coupon ?? true);
      setSelectedCouponCode(localStoreStatus.compensation_coupon_code || 'VOLVER10');
    }
    setIsOpenModal(true);
  };

  const calculatePauseUntil = (durationId) => {
    const now = new Date();
    const opt = durationOptions.find(o => o.id === durationId);
    if (!opt || opt.minutes === null) return null;
    if (opt.minutes === 'today') {
      const nextOpen = getNextOpeningDateTime(currentBusinessHours, { targetTomorrow: true });
      return nextOpen.date.toISOString();
    }
    return new Date(now.getTime() + opt.minutes * 60 * 1000).toISOString();
  };

  const handlePauseStore = async () => {
    if (!brandId) return;
    setIsSaving(true);
    try {
      const pauseUntil = calculatePauseUntil(selectedDuration);
      const couponPreset = COUPON_PRESETS.find(c => c.code === selectedCouponCode) || COUPON_PRESETS[0];

      const newStoreStatus = {
        is_paused: true,
        paused_at: new Date().toISOString(),
        pause_until: pauseUntil,
        pause_mode: selectedDuration,
        custom_message: customMessage.trim() || QUICK_MESSAGES[0].text,
        offer_compensation_coupon: offerCoupon,
        compensation_coupon_code: offerCoupon ? selectedCouponCode : null,
        compensation_coupon_label: offerCoupon ? couponPreset.benefit : null
      };

      const existingConfig = currentBrand?.config || menuBrand?.config || {};
      const updatedConfig = {
        ...existingConfig,
        store_status: newStoreStatus
      };

      const { error } = await supabase
        .from('brands')
        .update({ config: updatedConfig, updated_at: new Date().toISOString() })
        .eq('id', brandId);

      if (error) throw error;

      setLocalStoreStatus(newStoreStatus);
      setIsOpenModal(false);
      toast.success('🟡 Tienda puesta en pausa. El menú público ahora está en Modo Vitrina.');
      refetchMenuData?.();
      refreshProfile?.();
    } catch (err) {
      console.error('Error pausing store:', err);
      toast.error('No se pudo pausar la tienda. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResumeStore = async () => {
    if (!brandId) return;
    setIsSaving(true);
    try {
      const newStoreStatus = {
        is_paused: false,
        resumed_at: new Date().toISOString(),
        pause_until: null,
        custom_message: ''
      };

      const existingConfig = currentBrand?.config || menuBrand?.config || {};
      const updatedConfig = {
        ...existingConfig,
        store_status: newStoreStatus
      };

      const { error } = await supabase
        .from('brands')
        .update({ config: updatedConfig, updated_at: new Date().toISOString() })
        .eq('id', brandId);

      if (error) throw error;

      setLocalStoreStatus(newStoreStatus);
      setIsOpenModal(false);
      toast.success('🟢 ¡Tienda reactivada! Ya estás recibiendo pedidos nuevamente.');
      refetchMenuData?.();
      refreshProfile?.();
    } catch (err) {
      console.error('Error resuming store:', err);
      toast.error('No se pudo reactivar la tienda.');
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-limpieza en base de datos cuando la pausa por tiempo ya expiró
  useEffect(() => {
    if (localStoreStatus?.is_paused && localStoreStatus?.pause_until) {
      const pauseEnd = new Date(localStoreStatus.pause_until).getTime();
      if (pauseEnd <= nowTick && brandId) {
        const existingConfig = currentBrand?.config || menuBrand?.config || {};
        const cleanedStatus = {
          ...localStoreStatus,
          is_paused: false,
          pause_until: null,
          resumed_at: new Date().toISOString()
        };
        supabase
          .from('brands')
          .update({
            config: { ...existingConfig, store_status: cleanedStatus },
            updated_at: new Date().toISOString()
          })
          .eq('id', brandId)
          .then(() => {
            setLocalStoreStatus(cleanedStatus);
            refetchMenuData?.();
          })
          .catch(err => console.error('Error auto-clearing expired pause:', err));
      }
    }
  }, [localStoreStatus, nowTick, brandId]);

  const formatPauseRemaining = () => {
    if (!localStoreStatus?.pause_until) return 'Manual';
    const targetDt = new Date(localStoreStatus.pause_until);
    const diffMs = targetDt.getTime() - nowTick;
    if (diffMs <= 0) return '';
    const mins = Math.ceil(diffMs / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
  };

  if (!brandId) return null;

  return (
    <>
      {/* Botón en la Barra Superior del Admin */}
      {isCurrentlyPaused ? (
        <button
          type="button"
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs border bg-rose-600 text-white border-rose-700 hover:bg-rose-700 animate-pulse"
          title="Tienda pausada manualmente — Clic para reactivar o configurar"
        >
          <span className="w-2 h-2 rounded-full bg-white" />
          <span>🔴 Tienda Pausada ({formatPauseRemaining()})</span>
        </button>
      ) : isScheduleClosed ? (
        <button
          type="button"
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs border bg-amber-500 text-white border-amber-600 hover:bg-amber-600"
          title={`Cerrado según horario de atención — Abre ${storeStatusInfo?.nextOpening?.formatted || 'pronto'}. Clic para gestionar o pausar.`}
        >
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>🌙 Fuera de Horario (Abre {storeStatusInfo?.nextOpening?.formatted || 'pronto'})</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs border bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
          title="Tienda recibiendo pedidos — Clic para pausar o cerrar temporalmente"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>🟢 Tienda Abierta</span>
        </button>
      )}

      {/* Modal de Control de Estado de Tienda */}
      {isOpenModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl max-w-lg w-full border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`p-5 border-b flex items-center justify-between ${
              isCurrentlyPaused 
                ? 'bg-rose-50 border-rose-200' 
                : isScheduleClosed
                ? 'bg-amber-50 border-amber-200'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs ${
                  isCurrentlyPaused 
                    ? 'bg-rose-600 text-white' 
                    : isScheduleClosed
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-600 text-white'
                }`}>
                  <Power className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 leading-tight">
                    {isCurrentlyPaused 
                      ? 'Tienda en Pausa Manual' 
                      : isScheduleClosed 
                      ? 'Tienda Fuera de Horario' 
                      : 'Control Maestro de Tienda'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isCurrentlyPaused 
                      ? 'El menú público está en Modo Vitrina (sin recibir pedidos).' 
                      : isScheduleClosed
                      ? `Cerrada automáticamente. Reabre ${storeStatusInfo?.nextOpening?.formatted || 'pronto'}.`
                      : 'Pausa la recepción de pedidos temporalmente con 1 clic.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="p-2 rounded-xl bg-white/80 hover:bg-white text-gray-500 hover:text-gray-800 border border-gray-200/80 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-5 custom-scrollbar">
              {/* Información de Horario Automático Activo */}
              {isScheduleClosed && !isCurrentlyPaused && (
                <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 flex flex-col gap-2">
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-black text-amber-950 uppercase tracking-wider">
                        Apertura y Cierre Automatizados
                      </p>
                      <p className="text-xs text-amber-800 mt-0.5 leading-snug">
                        Tu tienda ya está cerrada automáticamente según el horario de atención configurado. 
                        Se encenderá sola <strong>{storeStatusInfo?.nextOpening?.formatted || 'en la próxima apertura'}</strong> sin que tengas que tocar nada.
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-amber-700/90 border-t border-amber-200/60 pt-2 font-medium">
                    💡 Puedes editar tus horas exactas de apertura y cierre en <strong>Configuración &gt; Horarios de Servicio</strong>.
                  </p>
                </div>
              )}

              {/* Si ya está pausada, botón grande para reactivar de inmediato */}
              {isCurrentlyPaused && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-emerald-950 uppercase tracking-wider">¿Listo para recibir pedidos?</p>
                      <p className="text-xs text-emerald-700 mt-0.5">Habilita nuevamente el carrito en el menú público al instante.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResumeStore}
                    disabled={isSaving}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <PlayCircle className="w-4 h-4" />
                    {isSaving ? 'Reactivando...' : '🟢 Reactivar Tienda Ahora'}
                  </button>
                </div>
              )}

              {/* 1. Duración de la Pausa */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  1. ¿Por cuánto tiempo deseas pausar los pedidos?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {durationOptions.map((opt) => {
                    const active = selectedDuration === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedDuration(opt.id)}
                        className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                          opt.id === 'indefinite' ? 'sm:col-span-2' : ''
                        } ${
                          active
                            ? 'bg-amber-50/90 border-amber-500 ring-1 ring-amber-500/40'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-base leading-none mt-0.5">{opt.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-gray-900">{opt.label}</p>
                          <p className="text-[11px] text-gray-500">{opt.sub}</p>
                        </div>
                        {active && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Mensaje para el comensal */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  2. Mensaje en el Menú Público (Rápido o Personalizado)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_MESSAGES.map((qm, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCustomMessage(qm.text)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                        customMessage === qm.text
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {qm.label}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Escribe el mensaje que verán tus clientes arriba del menú..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 focus:bg-white p-3 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              {/* 3. Cupón por la molestia con candado de dispositivo */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/90 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Tag className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-gray-900">
                        Ofrecer cupón de compensación por la espera
                      </p>
                      <p className="text-[11px] text-gray-600">
                        Permite al visitante guardar un cupón en su celular para pedir apenas reabras.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOfferCoupon(!offerCoupon)}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 shrink-0 cursor-pointer ${
                      offerCoupon ? 'bg-amber-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                      offerCoupon ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {offerCoupon && (
                  <div className="space-y-2 pt-1">
                    <select
                      value={selectedCouponCode}
                      onChange={(e) => setSelectedCouponCode(e.target.value)}
                      className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none"
                    >
                      {COUPON_PRESETS.map(c => (
                        <option key={c.code} value={c.code}>
                          🎟️ {c.code} — {c.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-900 bg-amber-100/70 px-2.5 py-1.5 rounded-lg border border-amber-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>
                        <strong>Candado de Huella Activo:</strong> Solo se activará en el dispositivo que entró durante la pausa y válido por 1 única compra.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-100 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handlePauseStore}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <PauseCircle className="w-4 h-4" />
                {isSaving ? 'Guardando...' : isCurrentlyPaused ? 'Actualizar Pausa' : 'Pausar Tienda Ahora'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
