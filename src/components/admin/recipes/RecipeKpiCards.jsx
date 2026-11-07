import React from 'react';
import { Icon } from '@iconify-icon/react';

export default function RecipeKpiCards({ statsMetrics, availableEquipment = [], onOpenUtilitiesModal }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {/* Platos Carta */}
      <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">Platos de Carta</span>
          <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Icon icon="heroicons:book-open" className="text-base" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{statsMetrics.dishCount}</span>
          <span className="text-xs text-slate-400">recetas ensamble</span>
        </div>
      </div>

      {/* Sub-recetas / Mise en Place */}
      <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">Sub-recetas Prep</span>
          <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
            <Icon icon="heroicons:beaker" className="text-base" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{statsMetrics.subrecipeCount}</span>
          <span className="text-xs text-slate-400">baches activos</span>
        </div>
      </div>

      {/* Margen Promedio */}
      <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">Margen Promedio</span>
          <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Icon icon="heroicons:arrow-trending-up" className="text-base" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-emerald-600 tabular-nums">{statsMetrics.avgMargin.toFixed(1)}%</span>
          <span className="text-xs text-slate-400">sobre precio venta</span>
        </div>
      </div>

      {/* Inversión Total */}
      <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">Inversión Recetario</span>
          <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
            <Icon icon="heroicons:banknotes" className="text-base" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            ${statsMetrics.totalInvestment.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
          </span>
          <span className="text-xs text-slate-400">costo base total</span>
        </div>
      </div>

      {/* TARJETA DESTACADA: Costos de Energía & Equipos */}
      <div 
        onClick={onOpenUtilitiesModal}
        className="p-4 rounded-xl border border-amber-300/80 bg-gradient-to-br from-amber-500/10 to-amber-500/5 hover:from-amber-500/20 hover:to-amber-500/10 transition-all cursor-pointer shadow-2xs group relative"
        title="Haz clic para configurar tarifas de luz, gas, agua y electrodomésticos de la sede"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
            <span>Energía & Equipos</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          </span>
          <div className="w-7 h-7 rounded-md bg-amber-500 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
            <Icon icon="heroicons:bolt" className="text-base" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black tracking-tight text-amber-950 tabular-nums">
              {availableEquipment.length}
            </span>
            <span className="text-xs font-semibold text-amber-800">equipos activos</span>
          </div>
          <span className="text-[11px] font-bold text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300/70">
            ⚡ Tarifas
          </span>
        </div>
      </div>
    </div>
  );
}
