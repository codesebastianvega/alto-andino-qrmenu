import React from 'react';

export default function MealPlansKpisBar({
  plansCount = 0,
  totalRemainingCredits = 0,
  gpsVerifiedCount = 0,
  creditUnitPlural = 'Almuerzos'
}) {
  return (
    <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/10">
      <div className="bg-white/5 rounded-xl px-3.5 py-2.5 border border-white/10">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/80 block">
          Suscriptores Activos
        </span>
        <span className="text-lg sm:text-xl font-black text-white">
          {plansCount} <span className="text-xs font-semibold text-white/60">clientes</span>
        </span>
      </div>
      <div className="bg-white/5 rounded-xl px-3.5 py-2.5 border border-white/10">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/80 block">
          {creditUnitPlural} por Entregar
        </span>
        <span className="text-lg sm:text-xl font-black text-emerald-300">
          {totalRemainingCredits} <span className="text-xs font-semibold text-white/60">disponibles</span>
        </span>
      </div>
      <div className="bg-white/5 rounded-xl px-3.5 py-2.5 border border-white/10">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/80 block">
          Pin GPS para Domiciliario
        </span>
        <span className="text-lg sm:text-xl font-black text-white">
          {gpsVerifiedCount}/{plansCount} <span className="text-xs font-semibold text-white/60">ubicados en mapa</span>
        </span>
      </div>
    </div>
  );
}
