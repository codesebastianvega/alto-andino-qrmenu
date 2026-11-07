import React from 'react';
import { Sparkles, CheckCircle2, Layers } from 'lucide-react';
import { formatCOP } from '../../../utils/money';

export default function PrintPageHeader({
  planInfo,
  printTier,
  isUnlimited,
  canPrintFree,
  remainingFreeFaces,
}) {
  return (
    <div className="max-w-[1600px] mx-auto mb-6 no-print">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-neutral-900 text-white">
              Módulo Oficial
            </span>
            <span className="text-xs font-bold text-neutral-500">Plan {planInfo.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Generador de Carta Imprimible (PDF)
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-medium">
            Exporta tu carta en alta resolución para imprenta, afiches de mesa, volantes y menú
            físico. Paginación automática continua sin cortes.
          </p>
        </div>

        {/* Estado de cuota / Caras */}
        <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 p-3 rounded-xl shrink-0">
          {isUnlimited ? (
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
              <Sparkles size={18} className="text-amber-500 shrink-0" />
              <div>
                <div className="text-[11px] uppercase tracking-wider text-emerald-800">
                  Caras Ilimitadas
                </div>
                <div className="text-[10px] text-neutral-500 font-normal">
                  Incluido en tu Plan {planInfo.name}
                </div>
              </div>
            </div>
          ) : canPrintFree ? (
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <div>
                <div className="text-[11px] uppercase tracking-wider text-emerald-800">
                  {remainingFreeFaces} cara disponible este mes
                </div>
                <div className="text-[10px] text-neutral-500 font-normal">
                  Incluida en tu suscripción
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
              <Layers size={18} className="text-amber-600 shrink-0" />
              <div>
                <div className="text-[11px] uppercase tracking-wider text-neutral-900">
                  {formatCOP(printTier.pricePerFace)} por cara
                </div>
                <div className="text-[10px] text-neutral-500 font-normal">
                  Tarifa con descuento Plan {planInfo.name}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
