import React, { useState, useEffect } from 'react';
import { useMenuData } from '../context/MenuDataContext';
import { 
  claimPauseCoupon, 
  hasValidPauseClaim, 
  getPendingPauseCoupon, 
  hasDeviceUsedCoupon 
} from '../utils/couponSecurity';
import { toast } from './Toast';
import { Clock, Lock, Tag, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';

export default function StorePausedBanner({ onOpenCart }) {
  const { storeStatusInfo, activeBrandId, activePromotions } = useMenuData();
  const [claimedCode, setClaimedCode] = useState(null);
  const [pendingCodeWhenOpen, setPendingCodeWhenOpen] = useState(null);

  const isStoreClosed = storeStatusInfo && !storeStatusInfo.isOpen;
  const pauseInfo = storeStatusInfo?.pauseInfo;
  const couponCode = pauseInfo?.offer_compensation_coupon 
    ? (pauseInfo?.compensation_coupon_code || 'VOLVER10') 
    : null;
  const couponLabel = pauseInfo?.compensation_coupon_label || '10% de descuento en tu próximo pedido';

  useEffect(() => {
    if (!activeBrandId) return;
    if (couponCode && hasValidPauseClaim(couponCode, activeBrandId)) {
      setClaimedCode(couponCode);
    }
    const pending = getPendingPauseCoupon(activeBrandId);
    setPendingCodeWhenOpen(pending);
  }, [activeBrandId, couponCode, isStoreClosed]);

  const handleClaimCoupon = () => {
    if (!couponCode || !activeBrandId) return;

    if (hasDeviceUsedCoupon(couponCode, activeBrandId)) {
      toast.error('Ya utilizaste este cupón de compensación en un pedido anterior.');
      return;
    }

    const res = claimPauseCoupon(couponCode, activeBrandId);
    if (res.ok) {
      setClaimedCode(couponCode);
      setPendingCodeWhenOpen(couponCode);
      try {
        navigator.clipboard?.writeText(couponCode);
      } catch {}
      toast.success(`🎉 ¡Cupón ${couponCode} vinculado a tu dispositivo! Podrás usarlo en el carrito apenas abramos.`);
    }
  };

  // Caso 1: La tienda ya volvió a abrir y este dispositivo tiene un cupón guardado durante la pausa
  if (!isStoreClosed && pendingCodeWhenOpen) {
    return (
      <div className="mb-4 rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-3.5 sm:p-4 shadow-md border border-emerald-600/40 animate-in fade-in slide-in-from-top-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <p className="text-xs font-black uppercase tracking-wider text-emerald-200">
                  ¡Cocina Abierta! Tu cupón por la espera está activo
                </p>
              </div>
              <p className="text-xs text-white/90 mt-0.5">
                Tu dispositivo tiene guardado el cupón <strong className="font-mono bg-white/15 px-1.5 py-0.5 rounded">{pendingCodeWhenOpen}</strong> para esta compra.
              </p>
            </div>
          </div>
          {onOpenCart && (
            <button
              type="button"
              onClick={onOpenCart}
              className="px-3.5 py-2 rounded-xl bg-white text-emerald-950 font-black text-xs hover:bg-emerald-50 transition-all shrink-0 shadow-xs cursor-pointer"
            >
              Ver en mi Carrito →
            </button>
          )}
        </div>
      </div>
    );
  }

  // Caso 2: La tienda está abierta y no hay cupón pendiente -> No mostrar nada
  if (!isStoreClosed) return null;

  // Formatear hora estimada de reapertura si existe
  let reopenTimeStr = null;
  if (pauseInfo?.pause_until && pauseInfo?.pause_mode !== 'today') {
    try {
      const dt = new Date(pauseInfo.pause_until);
      if (dt > new Date()) {
        reopenTimeStr = dt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      }
    } catch {}
  }

  return (
    <div className="mb-5 rounded-2xl bg-gradient-to-br from-amber-950 via-stone-900 to-neutral-900 text-white p-4 sm:p-5 shadow-lg border border-amber-500/40 relative overflow-hidden">
      {/* Glow decorativo */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-3.5">
        {/* Fila Principal: Estado de Pausa + Mensaje */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0 mt-0.5">
            <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[10px] font-black uppercase tracking-wider">
                🟡 Cocina en Pausa / Cerrado Temporalmente
              </span>
              {reopenTimeStr && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-amber-200 text-[10px] font-bold border border-white/10">
                  ⏰ Regresamos aprox. {reopenTimeStr}
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] font-semibold">
                <Lock className="w-2.5 h-2.5" /> Modo Vitrina (Puedes ver la carta)
              </span>
            </div>

            <p className="text-xs sm:text-sm font-semibold text-white/95 mt-2 leading-relaxed">
              {storeStatusInfo.message || 'En este momento no estamos recibiendo pedidos. Puedes explorar nuestra carta y precios.'}
            </p>
          </div>
        </div>

        {/* Fila de Cupón de Compensación por la Espera (si está habilitado) */}
        {couponCode && (
          <div className="p-3 sm:p-3.5 rounded-xl bg-white/10 border border-amber-400/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center text-amber-300 shrink-0">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-amber-300">
                  🎁 Regalo por la espera: {couponLabel}
                </p>
                <p className="text-[11px] text-white/80">
                  Guarda el cupón <strong className="font-mono text-white">{couponCode}</strong> en este celular para usarlo en tu carrito cuando abramos.
                </p>
              </div>
            </div>

            {claimedCode === couponCode ? (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 text-xs font-black shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>¡Guardado en tu celular! ({couponCode})</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleClaimCoupon}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer active:scale-95"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Guardar Cupón {couponCode}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
