import React from 'react';
import { Crown, Sparkles, AlertCircle, Lock } from 'lucide-react';
import { GlassCard } from './AnalyticsCommon';

export default function PlanCapacityBanner({ planDetails, activeBrand }) {
  const { 
    loading: planLoading,
    ordersThisMonth,
    productsCount,
    planName,
    maxOrders,
    maxProducts,
    isTrialActive,
    trialDaysLeft,
  } = planDetails || {};

  const aiLimit = activeBrand?.ai_generation_limit || 0;
  const aiUsed = activeBrand?.ai_generations_used || 0;
  const hasAiAddon = activeBrand?.has_ai_addon || false;

  if (planLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/40 backdrop-blur-xl border border-white/20 rounded-3xl p-6 h-36 flex flex-col justify-between animate-pulse">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200/60 rounded-full w-2/3" />
              <div className="h-3 bg-gray-200/40 rounded-full w-1/2" />
            </div>
            <div className="space-y-2">
              <div className="h-2 bg-gray-200/50 rounded-full w-full" />
              <div className="h-3 bg-gray-200/40 rounded-full w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Helper for color and progress metrics
  const getMetricConfig = (used, max) => {
    const isUnlimited = max === null || max === undefined || max === -1;
    if (isUnlimited) {
      return {
        pct: 0,
        isUnlimited: true,
        colorClass: 'bg-emerald-500',
        bgLightClass: 'bg-emerald-50',
        textClass: 'text-emerald-600',
        label: 'Ilimitado'
      };
    }
    const pct = Math.min(100, Math.max(0, (used / max) * 100));
    let colorClass = 'bg-emerald-500';
    let bgLightClass = 'bg-emerald-50';
    let textClass = 'text-emerald-600';

    if (pct >= 90) {
      colorClass = 'bg-rose-500';
      bgLightClass = 'bg-rose-50';
      textClass = 'text-rose-600';
    } else if (pct >= 70) {
      colorClass = 'bg-amber-500';
      bgLightClass = 'bg-amber-50';
      textClass = 'text-amber-600';
    }

    return {
      pct,
      isUnlimited: false,
      colorClass,
      bgLightClass,
      textClass,
      label: `${Math.round(pct)}%`
    };
  };

  const ordersConfig = getMetricConfig(ordersThisMonth, maxOrders);
  const productsConfig = getMetricConfig(productsCount, maxProducts);
  const aiConfig = getMetricConfig(aiUsed, aiLimit);

  return (
    <div className="space-y-4 mb-8">
      {/* Plan Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 backdrop-blur-xl border border-white/50 rounded-3xl p-5 px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-white/60">
            <Crown className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Tu Plan Actual</span>
              {isTrialActive && (
                <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  Prueba Activa
                </span>
              )}
            </div>
            <h3 className="text-base font-black text-gray-900 leading-tight">
              {planName}
            </h3>
          </div>
        </div>

        {isTrialActive && (
          <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/80 self-start sm:self-auto shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" style={{ animationDuration: '3s' }} />
            <span className="text-xs font-bold text-gray-700">
              <strong className="text-indigo-600 font-black">{trialDaysLeft}</strong> {trialDaysLeft === 1 ? 'día restante' : 'días restantes'} de prueba Premium
            </span>
          </div>
        )}
      </div>

      {/* 3 Columns Capacity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Pedidos */}
        <GlassCard noHover className="p-6 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pedidos Mensuales</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-gray-900 tabular-nums">{ordersThisMonth}</span>
                <span className="text-[11px] font-bold text-gray-400">/ {ordersConfig.isUnlimited ? '∞' : maxOrders}</span>
              </div>
            </div>
            <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${ordersConfig.bgLightClass} ${ordersConfig.textClass}`}>
              {ordersConfig.label}
            </div>
          </div>

          <div className="mt-4">
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${ordersConfig.colorClass} transition-all duration-500`} 
                style={{ width: `${ordersConfig.isUnlimited ? 0 : ordersConfig.pct}%` }} 
              />
            </div>
            {ordersConfig.pct >= 90 && !ordersConfig.isUnlimited && (
              <p className="text-[9px] font-bold text-rose-500 uppercase mt-1.5 flex items-center gap-1 animate-pulse">
                <AlertCircle className="w-3 h-3" /> Límite de pedidos casi alcanzado
              </p>
            )}
          </div>
        </GlassCard>

        {/* Card 2: Productos */}
        <GlassCard noHover className="p-6 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Productos Activos</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-gray-900 tabular-nums">{productsCount}</span>
                <span className="text-[11px] font-bold text-gray-400">/ {productsConfig.isUnlimited ? '∞' : maxProducts}</span>
              </div>
            </div>
            <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${productsConfig.bgLightClass} ${productsConfig.textClass}`}>
              {productsConfig.label}
            </div>
          </div>

          <div className="mt-4">
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${productsConfig.colorClass} transition-all duration-500`} 
                style={{ width: `${productsConfig.isUnlimited ? 0 : productsConfig.pct}%` }} 
              />
            </div>
            {productsConfig.pct >= 90 && !productsConfig.isUnlimited && (
              <p className="text-[9px] font-bold text-rose-500 uppercase mt-1.5 flex items-center gap-1 animate-pulse">
                <AlertCircle className="w-3 h-3" /> Límite de productos casi alcanzado
              </p>
            )}
          </div>
        </GlassCard>

        {/* Card 3: Predicciones IA (Con Locked Overlay) */}
        <GlassCard noHover className="p-6 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Predicciones IA</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-gray-900 tabular-nums">{aiUsed}</span>
                <span className="text-[11px] font-bold text-gray-400">/ {aiLimit}</span>
              </div>
            </div>
            {hasAiAddon && aiLimit > 0 && (
              <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${aiConfig.bgLightClass} ${aiConfig.textClass}`}>
                {aiConfig.label}
              </div>
            )}
          </div>

          <div className="mt-4">
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${aiConfig.colorClass} transition-all duration-500`} 
                style={{ width: `${hasAiAddon && aiLimit > 0 ? aiConfig.pct : 0}%` }} 
              />
            </div>
            {hasAiAddon && aiLimit > 0 && aiConfig.pct >= 90 && (
              <p className="text-[9px] font-bold text-rose-500 uppercase mt-1.5 flex items-center gap-1 animate-pulse">
                <AlertCircle className="w-3 h-3" /> Límite de predicciones agotado
              </p>
            )}
          </div>

          {/* Locked Overlay si no tiene AI addon */}
          {(!hasAiAddon || aiLimit === 0) && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[6px] flex flex-col items-center justify-center text-center p-4 transition-all duration-300">
              <div className="w-9 h-9 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center mb-1.5 shadow-md">
                <Lock className="w-4 h-4 text-amber-400" />
              </div>
              <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight">Módulo IA Bloqueado</h4>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter mt-0.5">
                Adquiere el addon para activar predicciones
              </p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
