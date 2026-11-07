import React from 'react';
import {
  Calculator,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Clock,
  Sparkles,
  HelpCircle,
  Flame,
  BarChart3,
  Award
} from 'lucide-react';
import { formatCOP, calculatePaybackDays } from '../helpers/impactHelpers';

export default function ImpactRoiSection({
  dailyOrders,
  setDailyOrders,
  ticketBase,
  setTicketBase,
  timeframe,
  setTimeframe,
  math
}) {
  const paybackPlan1Days = calculatePaybackDays(150000, math.extraDaily);
  const paybackPlan2Days = calculatePaybackDays(790000, math.extraDaily);

  return (
    <section className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pb-14 sm:pb-20">
      <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#141419] to-[#0D0D11] border border-white/10 p-4 sm:p-8 lg:p-10 shadow-2xl relative">
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4A853]/10 border border-[#D4A853]/30 text-xs font-semibold text-[#D4A853] uppercase tracking-widest mb-3">
            <Calculator className="w-3.5 h-3.5" />
            <span>Simulador Financiero Transparente</span>
          </div>
          <h2
            className="text-2xl sm:text-4xl lg:text-5xl font-normal text-white tracking-tight"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Calcula el dinero extra que entrará a tu caja
          </h2>
          <p className="text-xs sm:text-base text-gray-300 mt-2 font-light leading-relaxed max-w-2xl mx-auto">
            Ajusta los números reales de tu restaurante. El simulador calcula el retorno combinando el aumento de ticket por fotos reales (+25%) y la mayor rotación de mesas (+15%).
          </p>

          {/* Timeframe Toggle Buttons */}
          <div className="mt-5 flex justify-center">
            <div className="p-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTimeframe('month')}
                className={`px-3.5 sm:px-5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                  timeframe === 'month'
                    ? 'bg-[#D4A853] text-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span className="hidden sm:inline">Ver Impacto </span>Mensual (30 Días)
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('day')}
                className={`px-3.5 sm:px-5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                  timeframe === 'day'
                    ? 'bg-[#D4A853] text-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span className="hidden sm:inline">Ver Impacto </span>Diario
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-stretch">
          {/* Sliders Input (Left, 5 cols) */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-6 bg-transparent sm:bg-white/5 p-0 sm:p-6 rounded-xl sm:rounded-2xl border-0 sm:border sm:border-white/10 flex flex-col justify-between">
            <div className="space-y-3.5 sm:space-y-6">
              {/* Slider 1: Pedidos diarios */}
              <div className="space-y-2 p-3 sm:p-0 rounded-xl bg-white/[0.03] sm:bg-transparent border border-white/5 sm:border-0">
                <div className="flex justify-between items-center text-xs font-semibold gap-2">
                  <span className="text-gray-300">1. Pedidos / Mesas al día:</span>
                  <span className="text-sm sm:text-base font-black text-white tabular-nums px-2.5 py-0.5 rounded-lg bg-white/10 border border-white/10 shrink-0">
                    {dailyOrders} pedidos/día
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="150"
                  step="5"
                  value={dailyOrders}
                  onChange={(e) => setDailyOrders(Number(e.target.value))}
                  className="w-full accent-[#D4A853] bg-white/10 h-2.5 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                  <span>10 (Café/Pequeño)</span>
                  <span>40 (Promedio)</span>
                  <span>150 (Alto flujo)</span>
                </div>
              </div>

              {/* Slider 2: Ticket promedio actual */}
              <div className="space-y-2 p-3 sm:p-0 rounded-xl bg-white/[0.03] sm:bg-transparent border border-white/5 sm:border-0">
                <div className="flex justify-between items-center text-xs font-semibold gap-2">
                  <span className="text-gray-300">2. Consumo por mesa (Plato base):</span>
                  <span className="text-sm sm:text-base font-black text-[#D4A853] tabular-nums px-2.5 py-0.5 rounded-lg bg-[#D4A853]/15 border border-[#D4A853]/30 shrink-0">
                    {formatCOP(ticketBase)}
                  </span>
                </div>
                <input
                  type="range"
                  min="12000"
                  max="60000"
                  step="1000"
                  value={ticketBase}
                  onChange={(e) => setTicketBase(Number(e.target.value))}
                  className="w-full accent-[#D4A853] bg-white/10 h-2.5 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                  <span>$12.000</span>
                  <span>$30.000</span>
                  <span>$60.000</span>
                </div>
              </div>

              {/* Explicación Visual del Ticket */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-[#D4A853]/10 via-[#D4A853]/5 to-transparent border border-[#D4A853]/20 space-y-2.5">
                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="font-bold text-[#D4A853] flex items-center gap-1.5 text-[11px] sm:text-xs">
                    <HelpCircle className="w-3.5 h-3.5 shrink-0" /> ¿Por qué sube a {formatCOP(math.ticketOptimized)} por mesa?
                  </span>
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-gray-400 shrink-0">
                    Precios fijos
                  </span>
                </div>

                <div className="flex items-center justify-between gap-1.5 sm:gap-2 p-2 rounded-xl bg-black/40 border border-white/5 text-center">
                  <div className="flex-1">
                    <span className="text-[9px] text-gray-400 block truncate font-medium">Plato Base</span>
                    <span className="font-bold text-white text-xs sm:text-sm tabular-nums">
                      {formatCOP(ticketBase)}
                    </span>
                  </div>
                  <span className="text-gray-500 font-bold text-xs shrink-0">+</span>
                  <div className="flex-1">
                    <span className="text-[9px] text-emerald-400 block truncate font-medium">Antojo Foto</span>
                    <span className="font-bold text-emerald-400 text-xs sm:text-sm tabular-nums">
                      +{formatCOP(math.ticketDiff)}
                    </span>
                  </div>
                  <span className="text-gray-500 font-bold text-xs shrink-0">=</span>
                  <div className="flex-1 bg-[#D4A853]/15 py-1 px-1.5 rounded-lg border border-[#D4A853]/30">
                    <span className="text-[9px] text-[#D4A853] block truncate font-black">Total Mesa</span>
                    <span className="font-black text-[#D4A853] text-xs sm:text-sm tabular-nums">
                      {formatCOP(math.ticketOptimized)}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] sm:text-[11px] text-gray-300 font-light leading-snug">
                  El plato sigue costando lo mismo. La diferencia es que al ver la <strong>foto real</strong>, el comensal añade la <strong>limonada, el café especial o el postre</strong> en lugar de pedir solo el almuerzo.
                </p>
              </div>
            </div>

            {/* Justificación de Palancas */}
            <div className="p-3 sm:p-4 rounded-xl bg-black/40 sm:bg-black/60 border border-white/10 text-xs space-y-2 mt-2 sm:mt-0">
              <p className="text-white font-bold flex items-center gap-1.5 text-xs text-[#D4A853]">
                <Sparkles className="w-3.5 h-3.5 shrink-0" /> Las 2 Palancas del Incremento:
              </p>
              <div className="space-y-1.5 text-[11px] text-gray-300">
                <p className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold shrink-0">• Venta Cruzada (+25%):</span>
                  <span>
                    1 de cada 2 clientes añade bebida o adición provocada por foto (+{formatCOP(math.ticketDiff)}/mesa).
                  </span>
                </p>
                <p className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold shrink-0">• Rotación (+15%):</span>
                  <span>
                    Pedir por QR ahorra 20 min de espera, atendiendo <strong>{math.ordersOptimized} pedidos/día</strong> (+{math.ordersDiff} mesas más).
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Results Breakdown & Big Numbers (Right, 7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-3.5 sm:space-y-4">
            {/* Grand Total Hero Box */}
            <div className="rounded-xl sm:rounded-2xl border border-emerald-500/50 bg-gradient-to-r from-emerald-950/40 via-emerald-900/30 to-black/60 p-4 sm:p-6 lg:p-7 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <TrendingUp className="w-32 h-32 sm:w-40 sm:h-40 text-emerald-400" />
              </div>

              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Facturación Adicional ({timeframe === 'month' ? 'Al Mes' : 'Por Día'})
                </span>
                <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] sm:text-[10px] font-bold uppercase whitespace-nowrap">
                  Ganancia Extra Neta
                </span>
              </div>

              <p className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight tabular-nums my-1">
                +{timeframe === 'month' ? formatCOP(math.extraMonthly) : formatCOP(math.extraDaily)}
              </p>

              <p className="text-[11px] sm:text-xs text-emerald-300 font-medium">
                {timeframe === 'month' ? (
                  <>
                    Tu restaurante pasa de facturar <strong>{formatCOP(math.monthlyBase)}</strong> a{' '}
                    <strong className="text-white underline">{formatCOP(math.monthlyOptimized)} COP/mes</strong>.
                  </>
                ) : (
                  <>
                    Tu caja pasa de facturar <strong>{formatCOP(math.dailyBase)}</strong> a{' '}
                    <strong className="text-white underline">{formatCOP(math.dailyOptimized)} COP/día</strong>.
                  </>
                )}
              </p>
            </div>

            {/* Payback in Days Card */}
            <div className="rounded-xl sm:rounded-2xl border border-[#D4A853]/40 bg-gradient-to-r from-[#1E1A11] via-[#151410] to-[#0F0F12] p-3.5 sm:p-5 relative shadow-lg">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-[#D4A853]/20 text-[#D4A853] shrink-0">
                    <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#D4A853] block">
                      Retorno de Inversión Instantáneo (Payback)
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-white mt-0.5">
                      Recuperas el Plan Despegue ($150k) en{' '}
                      <span className="text-emerald-400 font-black underline text-sm sm:text-base">
                        {paybackPlan1Days} {paybackPlan1Days === 1 ? 'día' : 'días'}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[9px] uppercase font-bold text-gray-400 block">Días restantes del mes</span>
                  <span className="text-xs sm:text-sm font-black text-emerald-400">
                    +{30 - Math.min(30, paybackPlan1Days)} días de ganancia 100% pura
                  </span>
                </div>
              </div>

              {/* Progress Bar of Payback */}
              <div className="my-2.5 space-y-1">
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${Math.min(100, Math.max(5, (paybackPlan1Days / 30) * 100))}%` }}
                    className="bg-gradient-to-r from-[#D4A853] to-amber-400 h-full rounded-full transition-all duration-500"
                  />
                  <div className="bg-emerald-500 h-full flex-1 rounded-r-full opacity-80" />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                  <span className="text-[#D4A853] font-bold">Día 1 a {paybackPlan1Days}: Pagas el Setup</span>
                  <span className="text-emerald-400 font-bold">Día {paybackPlan1Days + 1} a 30: Dinero para tu bolsillo</span>
                </div>
              </div>

              <p className="text-[10px] sm:text-[11px] text-gray-400 leading-snug">
                Con solo <strong>+{formatCOP(math.extraDaily)} extra al día</strong>, el costo de las fotos profesionales se absorbe casi de inmediato.
              </p>
            </div>

            {/* Step-by-Step Breakdown Table */}
            <div className="rounded-xl sm:rounded-2xl bg-black/50 border border-white/10 p-3.5 sm:p-5 space-y-2.5 sm:space-y-3">
              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-white/10">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-[#D4A853]" /> Desglose Matemático Transparente:
                </span>
                <span className="text-[10px] text-gray-400 uppercase font-mono font-bold">Valores Verificables</span>
              </div>

              {/* Mobile View */}
              <div className="sm:hidden space-y-2 py-1">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wide">Situación Actual</span>
                    <span className="text-xs text-gray-300 font-medium">{dailyOrders} pedidos/día × {formatCOP(ticketBase)}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-gray-200 block tabular-nums">
                      {timeframe === 'month' ? formatCOP(math.monthlyBase) : formatCOP(math.dailyBase)}
                    </span>
                    <span className="text-[9px] text-gray-500 font-medium">Base</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.04] border border-[#D4A853]/20 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-[#D4A853] block tracking-wide">Con Aluna + Fotos Reales</span>
                    <span className="text-xs text-gray-300 font-medium">{math.ordersOptimized} pedidos/día × {formatCOP(math.ticketOptimized)}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-[#D4A853] block tabular-nums">
                      {timeframe === 'month' ? formatCOP(math.monthlyOptimized) : formatCOP(math.dailyOptimized)}
                    </span>
                    <span className="text-[9px] text-emerald-400 font-bold">+ Venta Cruzada</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(16,185,129,0.08)]">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-black text-emerald-400 block tracking-wider">Dinero Extra en Caja</span>
                    <span className="text-xs text-emerald-300 font-medium">Margen neto adicional</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-base font-black text-white block tabular-nums">
                      +{timeframe === 'month' ? formatCOP(math.extraMonthly) : formatCOP(math.extraDaily)}
                    </span>
                    <span className="text-[10px] text-emerald-300 font-black uppercase">
                      +{timeframe === 'month' ? formatCOP(math.extraDaily) + '/día' : 'en tu bolsillo'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Desktop View */}
              <div className="hidden sm:grid sm:grid-cols-3 gap-3 text-xs text-gray-300 py-1 divide-x divide-white/10">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Venta Actual</p>
                  <p className="text-sm lg:text-base font-black text-gray-300">
                    {timeframe === 'month' ? formatCOP(math.monthlyBase) : formatCOP(math.dailyBase)}
                  </p>
                  <p className="text-[10px] text-gray-400 font-light">
                    {dailyOrders} pedidos × {formatCOP(ticketBase)}
                  </p>
                </div>

                <div className="pl-3 space-y-1">
                  <p className="text-[10px] uppercase text-[#D4A853] font-bold tracking-wider">Con Aluna + Fotos</p>
                  <p className="text-sm lg:text-base font-black text-[#D4A853]">
                    {timeframe === 'month' ? formatCOP(math.monthlyOptimized) : formatCOP(math.dailyOptimized)}
                  </p>
                  <p className="text-[10px] text-gray-300 font-light">
                    {math.ordersOptimized} pedidos × {formatCOP(math.ticketOptimized)}
                  </p>
                </div>

                <div className="pl-3 space-y-1">
                  <p className="text-[10px] uppercase text-emerald-400 font-bold tracking-wider">Ganancia Extra Neta</p>
                  <p className="text-sm lg:text-base font-black text-emerald-400">
                    +{timeframe === 'month' ? formatCOP(math.extraMonthly) : formatCOP(math.extraDaily)}
                  </p>
                  <p className="text-[10px] text-emerald-300 font-bold">
                    +{formatCOP(math.extraDaily)} COP / día extra
                  </p>
                </div>
              </div>

              {/* Formula Text Box */}
              <div className="mt-2 pt-2 border-t border-white/5 font-mono text-[10px] sm:text-[11px] text-gray-300 bg-white/5 p-2 sm:p-2.5 rounded-lg break-words">
                <span className="text-[#D4A853] font-bold">Fórmula de Facturación:</span>{' '}
                <span className="text-white font-bold">{math.ordersOptimized} mesas/día</span> ×{' '}
                <span className="text-[#D4A853] font-bold">{formatCOP(math.ticketOptimized)}/mesa</span> ={' '}
                <span className="text-emerald-400 font-black">{formatCOP(math.dailyOptimized)}/día</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
