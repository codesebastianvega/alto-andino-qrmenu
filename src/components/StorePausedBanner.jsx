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
      <div
        data-clarity-unmask="true"
        className="relative z-20 mb-4 w-full rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-3 sm:p-4 shadow-md border border-emerald-500/40"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <p className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-emerald-200 truncate">
                  ¡Cocina Abierta! Tu cupón está listo
                </p>
              </div>
              <p className="text-[11px] sm:text-xs text-white/90 mt-0.5">
                Usa tu cupón <strong className="font-mono bg-white/15 px-1.5 py-0.5 rounded">{pendingCodeWhenOpen}</strong> en el carrito.
              </p>
            </div>
          </div>
          {onOpenCart && (
            <button
              type="button"
              onClick={onOpenCart}
              className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-white text-emerald-950 font-black text-xs hover:bg-emerald-50 transition-all shrink-0 shadow-xs cursor-pointer text-center"
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
    <div
      data-clarity-unmask="true"
      className="relative z-20 mb-4 w-full rounded-2xl bg-gradient-to-br from-stone-900 via-neutral-900 to-stone-950 text-white p-3.5 sm:p-4 shadow-[0_12px_28px_rgba(0,0,0,0.16)] border border-amber-500/40 overflow-hidden"
    >
      {/* Glow decorativo sutil */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col">
        {/* Fila de Badges Compactos (1 sola línea en móvil) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-950 animate-ping" />
            Cocina en Pausa
          </span>
          {reopenTimeStr && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 text-[10px] font-bold border border-amber-400/30">
              <Clock className="w-2.5 h-2.5 shrink-0" />
              Regresa {reopenTimeStr}
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white/75 text-[10px] font-semibold">
            <Lock className="w-2.5 h-2.5 shrink-0" />
            Modo Vitrina
          </span>
        </div>

        {/* Mensaje conciso */}
        <p className="text-xs sm:text-sm font-medium text-white/90 mt-2 leading-snug">
          {storeStatusInfo.message || 'En este momento no estamos recibiendo pedidos. Puedes explorar nuestra carta y precios.'}
        </p>

        {/* Barra de Cupón de Compensación por la Espera (si está habilitado) */}
        {couponCode && (
          <div className="mt-2.5 pt-2.5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-start sm:items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0 mt-0.5 sm:mt-0">
                <Tag className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-extrabold text-amber-300 leading-tight">
                  🎁 Regalo por la espera: {couponLabel}
                </p>
                <p className="text-[11px] text-white/75 leading-tight mt-0.5">
                  Guarda el cupón <strong className="font-mono text-white bg-white/10 px-1.5 py-0.5 rounded">{couponCode}</strong> para cuando abramos
                </p>
              </div>
            </div>

            {claimedCode === couponCode ? (
              <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[11px] font-black shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>¡Guardado en tu celular! ({couponCode})</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleClaimCoupon}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all shrink-0 cursor-pointer active:scale-95"
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Guardar Cupón {couponCode}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
