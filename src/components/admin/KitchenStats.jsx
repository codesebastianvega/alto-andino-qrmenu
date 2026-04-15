import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function KitchenStats({ orders = [], liveEvents = [], loading = false }) {
  // ─── Variables derivadas ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    const preparing = orders.filter(o => o.status === 'preparing');
    const ready = orders.filter(o => o.status === 'ready');
    const delivered = orders.filter(o => o.status === 'delivered');

    // Calcular SLA promedio de los pedidos entregados hoy
    let avgPrepTimeStr = '-- min';
    if (delivered.length > 0) {
      let totalMins = 0;
      let validCount = 0;
      delivered.forEach(o => {
        if (o.created_at && o.delivered_at) {
          const diff = (new Date(o.delivered_at).getTime() - new Date(o.created_at).getTime()) / 60000;
          if (diff >= 0) {
            totalMins += diff;
            validCount++;
          }
        }
      });
      if (validCount > 0) {
        avgPrepTimeStr = `${Math.round(totalMins / validCount)} min`;
      }
    }

    return { preparing, ready, delivered, avgPrepTimeStr };
  }, [orders]);

  if (loading) {
    return (
      <div className="flex gap-6 animate-pulse">
        <div className="flex-1 bg-white/[0.03] rounded-3xl border border-white/5 h-64" />
        <div className="w-80 bg-white/[0.03] rounded-3xl border border-white/5 h-64 hidden xl:block" />
      </div>
    );
  }

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* ── Panel Principal: KPIs de Cocina ───────────────────────────── */}
      <div className="flex-1 bg-[#2C1910] rounded-3xl border border-orange-500/20 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-32 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="p-6 relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <span className="text-orange-400 text-lg leading-none">🔥</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Inteligencia de Cocina</h2>
              <p className="text-[10px] text-orange-200/50 font-medium tracking-wide">Rendimiento en tiempo real</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* KPI: En Preparación */}
            <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">En Fuego</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white">{stats.preparing.length}</span>
                <span className="text-[11px] text-white/30 font-medium">pedidos</span>
              </div>
              {stats.preparing.length > 0 && (
                <div className="mt-3 flex -space-x-2">
                  {stats.preparing.slice(0, 5).map((o, i) => (
                    <div key={o.id} className="w-6 h-6 rounded-full bg-orange-500/20 border-2 border-[#2C1910] flex items-center justify-center z-10" style={{ zIndex: 5 - i }}>
                      <span className="text-[8px] font-bold text-orange-300">
                        {o.fulfillment_type === 'dine_in' ? `M${o.restaurant_tables?.table_number || ''}` : 'L'}
                      </span>
                    </div>
                  ))}
                  {stats.preparing.length > 5 && (
                    <div className="w-6 h-6 rounded-full bg-white/10 border-2 border-[#2C1910] flex items-center justify-center z-0">
                      <span className="text-[8px] font-bold text-white/50">+{stats.preparing.length - 5}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* KPI: Listos */}
            <div className="bg-black/20 rounded-2xl p-4 border border-white/5 relative overflow-hidden">
              <p className="text-[10px] text-emerald-400/50 uppercase tracking-widest font-bold mb-1 z-10 relative">Retraso Despacho</p>
              <div className="flex items-baseline gap-2 z-10 relative">
                <span className="text-4xl font-black text-white">{stats.ready.length}</span>
                <span className="text-[11px] text-white/30 font-medium">listos</span>
              </div>
              {stats.ready.length > 3 && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-red-500 z-10" />
              )}
            </div>

            {/* KPI: SLA Promedio */}
            <div className="bg-black/20 rounded-2xl p-4 border border-white/5 md:col-span-1 col-span-2">
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Tiempo de Entrega</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white">{stats.avgPrepTimeStr.split(' ')[0]}</span>
                <span className="text-[11px] text-white/30 font-medium">min</span>
              </div>
              <p className="mt-2 text-[10px] text-white/30">
                Basado en {stats.delivered.length} pedido{stats.delivered.length !== 1 ? 's' : ''} hoy
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Feed en vivo (Eventos recientes) ─────────────────────────── */}
      <div className="xl:w-80 bg-[#0F170F] rounded-3xl border border-white/5 shadow-xl p-6 flex flex-col max-h-[300px]">
        <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-4 flex items-center justify-between">
          <span>Feed en Vivo</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </h3>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {liveEvents.length === 0 ? (
            <div className="h-full flex items-center justify-center flex-col gap-2 opacity-30 pt-10">
              <span className="text-2xl">📡</span>
              <p className="text-[10px] text-white uppercase tracking-wider font-medium">Esperando actividad...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {liveEvents.map((event, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-3 items-start"
                  >
                    <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 text-[11px]">
                      {event.icon}
                    </div>
                    <div className="pt-1">
                      <p className="text-xs font-semibold text-white/80 leading-tight">
                        {event.label}
                      </p>
                      <p className="text-[10px] text-white/30 mt-0.5">
                        {new Date(event.time).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>
    </div>
  );
}
