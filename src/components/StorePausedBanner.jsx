import React, { useState, useEffect } from 'react';
import { useMenuData } from '../context/MenuDataContext';
import { 
  claimPauseCoupon, 
  hasValidPauseClaim, 
  getPendingPauseCoupon, 
  hasDeviceUsedCoupon 
} from '../utils/couponSecurity';
import { toast } from './Toast';
import { Clock, CheckCircle2, Sparkles, Tag } from 'lucide-react';

export default function StorePausedBanner({ onOpenCart }) {
  const { storeStatusInfo, activeBrandId } = useMenuData();
  const [claimedCode, setClaimedCode] = useState(null);
  const [pendingCodeWhenOpen, setPendingCodeWhenOpen] = useState(null);

  const isStoreClosed = storeStatusInfo && !storeStatusInfo.isOpen;
  const pauseInfo = storeStatusInfo?.pauseInfo;
  const couponCode = pauseInfo?.offer_compensation_coupon 
    ? (pauseInfo?.compensation_coupon_code || 'VOLVER10') 
    : null;

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
      toast.success(`🎉 ¡Cupón ${couponCode} guardado! Se aplicará en tu carrito apenas abramos.`);
    }
  };

  // Caso 1: La tienda ya volvió a abrir y este dispositivo tiene un cupón guardado
  if (!isStoreClosed && pendingCodeWhenOpen) {
    return (
      <div
        data-clarity-unmask="true"
        className="relative z-20 mb-2.5 w-full rounded-2xl bg-emerald-50/95 border border-emerald-200/90 px-3.5 py-2.5 flex items-center justify-between gap-2.5 shadow-2xs"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
          <p className="text-[11px] font-bold text-emerald-950 leading-tight">
            ¡Ya abrimos! Tienes activo tu cupón <span className="font-mono font-black underline">{pendingCodeWhenOpen}</span> (10% OFF)
          </p>
        </div>
        {onOpenCart && (
          <button
            type="button"
            onClick={onOpenCart}
            className="px-3 py-1.5 rounded-xl bg-[#2f4131] text-white font-extrabold text-[11px] hover:bg-[#233124] transition-all shrink-0 cursor-pointer"
          >
            Usar →
          </button>
        )}
      </div>
    );
  }

  // Caso 2: La tienda está abierta y no hay cupón pendiente
  if (!isStoreClosed) return null;

  const isManualPause = storeStatusInfo?.isManualPause;
  const isScheduleClosed = storeStatusInfo?.isScheduleClosed;
  const reopenFormatted = storeStatusInfo?.reopenFormatted;
  const nextOpening = storeStatusInfo?.nextOpening;

  let badgeText = 'Solo vitrina por ahora';
  if (isManualPause && reopenFormatted) {
    badgeText = `Reabre ${reopenFormatted}`;
  } else if (isScheduleClosed && nextOpening) {
    badgeText = `Abre ${nextOpening.formatted}`;
  }

  const titleText = isScheduleClosed 
    ? 'Fuera de horario de servicio' 
    : 'Cocina en pausa temporal';

  const bodyText = isScheduleClosed
    ? 'Estamos fuera de nuestro horario de cocina. Puedes explorar nuestra carta, armar tu pedido y tenerlo listo para cuando abramos.'
    : (pauseInfo?.custom_message || 'En este momento no estamos recibiendo pedidos, pero puedes ver nuestra carta.');

  return (
    <div
      data-clarity-unmask="true"
      className="relative z-20 mb-2.5 w-full rounded-2xl bg-[#FFFDF8] border border-amber-300/80 p-3 shadow-[0_6px_18px_rgba(180,83,9,0.06)]"
    >
      {/* Línea 1: Estado claro y completo sin cortar texto */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full shrink-0 ${isScheduleClosed ? 'bg-amber-600' : 'bg-amber-500 animate-pulse'}`} />
          <span className="text-xs font-black text-amber-950">
            {titleText}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold shrink-0">
          <Clock className="w-2.5 h-2.5" />
          {badgeText}
        </span>
      </div>

      <p className="text-[11px] text-stone-600 font-medium leading-snug mt-1">
        {bodyText}
      </p>

      {/* Línea 2: Explicación clara del cupón de compensación */}
      {couponCode && (
        <div className="mt-2 pt-2 border-t border-amber-200/70 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <Tag className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <p className="text-[11px] text-stone-800 leading-tight">
              <span className="font-extrabold text-amber-950">🎁 10% OFF para cuando abramos</span>{' '}
              <span className="text-stone-500 font-medium">({couponCode})</span>
            </p>
          </div>

          {claimedCode === couponCode ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 text-[10px] font-extrabold shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
              Guardado
            </span>
          ) : (
            <button
              type="button"
              onClick={handleClaimCoupon}
              className="px-3 py-1.5 rounded-xl bg-amber-950 hover:bg-stone-800 text-amber-50 font-extrabold text-[11px] transition-all shrink-0 cursor-pointer active:scale-95 shadow-2xs"
            >
              Guardar cupón
            </button>
          )}
        </div>
      )}
    </div>
  );
}
