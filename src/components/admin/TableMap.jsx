import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../config/supabase';
import { useLocation } from '../../context/LocationContext';
import { toast } from '../Toast';

// ─── Timer en vivo por mesa ───────────────────────────────────────────────────
function TableTimer({ createdAt }) {
  const [mins, setMins] = useState(0);

  useEffect(() => {
    const update = () =>
      setMins(Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [createdAt]);

  const color =
    mins >= 60 ? 'text-red-400' :
    mins >= 30 ? 'text-orange-400' :
    'text-emerald-400';

  return (
    <span className={`text-[11px] font-bold tabular-nums ${color}`}>
      {mins >= 60
        ? `${Math.floor(mins / 60)}h ${mins % 60}m`
        : `${mins} min`}
    </span>
  );
}

// ─── Config semáforo ─────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  libre: {
    label: 'Libre',
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-500/20',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    glow: '',
    cardBg: 'bg-white/[0.03]',
  },
  ocupada: {
    label: 'Ocupada',
    dot: 'bg-amber-400',
    ring: 'ring-amber-400/20',
    badge: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
    glow: 'shadow-amber-500/10',
    cardBg: 'bg-amber-950/20',
  },
  sucia: {
    label: 'Sucia',
    dot: 'bg-orange-500',
    ring: 'ring-orange-500/30',
    badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    glow: 'shadow-orange-500/20',
    cardBg: 'bg-orange-950/20',
  },
  needs_billing: {
    label: 'Por cobrar',
    dot: 'bg-red-500',
    ring: 'ring-red-500/30',
    badge: 'bg-red-500/10 text-red-400 border-red-500/20',
    glow: 'shadow-red-500/20',
    cardBg: 'bg-red-950/20',
  },
  free: { // Fallback legacy
    label: 'Libre', dot: 'bg-emerald-500', ring: 'ring-emerald-500/20', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', glow: '', cardBg: 'bg-white/[0.03]'
  }
};

// ─── Tarjeta individual de mesa ──────────────────────────────────────────────
const TableCard = React.forwardRef(({ table }, ref) => {
  const cfg = STATUS_CONFIG[table.status] || STATUS_CONFIG.libre;
  const order = table.activeOrder;
  const total = order ? Number(order.total_amount || 0) : 0;
  const [freeing, setFreeing] = useState(false);
  const { locations, isAllLocations } = useLocation();

  const locationName = isAllLocations 
    ? locations.find(l => l.id === table.location_id)?.name 
    : null;

  const slaAlert =
    table.minutesSinceActivity !== null && table.minutesSinceActivity >= 40;
  const slaWarn =
    table.minutesSinceActivity !== null && table.minutesSinceActivity >= 20 && !slaAlert;

  const handleFreeTable = async (e) => {
    e.stopPropagation();
    setFreeing(true);
    
    // Si está ocupada o por cobrar, pasa a sucia (Limpieza pendiente)
    // Si ya está sucia, pasa a libre
    const nextStatus = (table.status === 'sucia') ? 'libre' : 'sucia';
    const shouldClearTimer = nextStatus === 'sucia'; // El cliente se fue

    const { error } = await supabase
      .from('restaurant_tables')
      .update({ 
        physical_status: nextStatus, 
        occupied_at: shouldClearTimer ? null : table.occupied_at 
      })
      .eq('id', table.id);

    setFreeing(false);
    if (!error) {
      toast.success(nextStatus === 'sucia' ? 'Mesa para limpieza 🧹' : 'Mesa lista ✨');
    } else {
      toast.error('Error al actualizar mesa');
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative rounded-2xl border border-white/8 p-4 flex flex-col gap-3 transition-all duration-300
        ${cfg.cardBg} ${cfg.ring} ring-1 shadow-lg ${cfg.glow}
        ${table.status === 'needs_billing' ? 'animate-pulse-slow' : ''}
      `}
    >
      {/* Location label if in all mode */}
      {locationName && (
        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10">
          <p className="text-[8px] font-black text-white/40 uppercase tracking-tighter">
            {locationName}
          </p>
        </div>
      )}
      {/* SLA alert bar */}
      {(slaAlert || slaWarn) && (
        <div
          className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl ${
            slaAlert ? 'bg-red-500' : 'bg-orange-400'
          }`}
        />
      )}

      {/* Header: número + estado */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-none mb-1">
            Mesa
          </p>
          <p className="text-3xl font-black text-white leading-none">
            {table.table_number}
          </p>
        </div>

        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${cfg.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${table.status !== 'libre' ? 'animate-pulse' : ''}`} />
          {cfg.label}
        </div>
      </div>

      <div className="flex-1 space-y-2">
        {/* Tiempo + SLA (si está ocupada o hay orden) */}
        {(table.status !== 'libre' && table.status !== 'free') && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <TableTimer createdAt={table.occupied_at || (order ? order.created_at : Date.now())} />
            </div>
            {slaAlert && (
              <span className="text-[9px] font-black text-red-400 uppercase tracking-wider animate-pulse">
                ⚠ SLA
              </span>
            )}
            {slaWarn && !slaAlert && (
              <span className="text-[9px] font-black text-orange-400 uppercase tracking-wider">
                ⏱ Lento
              </span>
            )}
          </div>
        )}

        {/* Info de la orden activa si la hay */}
        {order ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-white/40 font-medium">
                {order.fulfillment_type === 'dine_in' ? 'Mesa' : 'Llevar'}
              </span>
              {order.order_items && (
                <span className="text-[10px] text-white/30">
                  · {order.order_items.length} ítem{order.order_items.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {/* Total */}
            <div className="pt-1 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Total</span>
              <span className="text-base font-black text-white">
                ${total.toLocaleString('es-CO')}
              </span>
            </div>
          </>
        ) : (table.status === 'libre' || table.status === 'free') ? (
          <div className="flex-1 flex items-center justify-center py-2 h-full">
             <span className="text-[11px] text-white/15 font-medium uppercase tracking-widest">
               Sin pedido
             </span>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center py-2 h-full">
            <span className="text-[11px] text-emerald-400/50 font-medium tracking-wide">
              Pedido Cerrado
            </span>
          </div>
        )}
      </div>

      {/* Action Button: Liberar Mesa / Limpiar */}
      {(table.status !== 'libre' && table.status !== 'free') && (
        <button
          onClick={handleFreeTable}
          disabled={freeing}
          className={`mt-2 w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex justify-center items-center gap-2 shadow-sm
            ${table.status === 'sucia' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white' 
              : 'bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white'
            }
            disabled:opacity-50
          `}
        >
          {freeing ? (
            'Procesando...'
          ) : table.status === 'sucia' ? (
            <><span className="text-xs">✨</span> Marcar Limpia</>
          ) : (
            <><span className="text-xs">🧹</span> Liberar Mesa</>
          )}
        </button>
      )}
    </motion.div>
  );
});

// ─── Componente principal ─────────────────────────────────────────────────────
export default function TableMap({ tablesWithStatus = [], areas = [], loading = false }) {
  const { isAllLocations, locations } = useLocation();
  const [filter, setFilter] = useState('all'); // 'all' | 'libre' | 'ocupada' | 'sucia' | 'needs_billing'
  const [selectedAreaId, setSelectedAreaId] = useState('all');
  const [selectedLocationId, setSelectedLocationId] = useState('all');

  // Reset filters when areas or locations change significantly
  useEffect(() => {
    setSelectedAreaId('all');
  }, [areas.length]);

  useEffect(() => {
    setSelectedLocationId('all');
  }, [isAllLocations]);

  // 1. Filtrar por sede (solo si estamos en modo "Todas")
  const tablesInLocation = isAllLocations && selectedLocationId !== 'all'
    ? tablesWithStatus.filter(t => t.location_id === selectedLocationId)
    : tablesWithStatus;

  // 2. Filtrar por área
  const tablesInArea = selectedAreaId === 'all'
    ? tablesInLocation
    : tablesInLocation.filter(t => t.area_id === selectedAreaId);

  // 3. Calculamos contadores basados en las mesas del área/sede actual
  const counts = {
    all:           tablesInArea.length,
    libre:         tablesInArea.filter(t => t.status === 'libre' || t.status === 'free').length,
    ocupada:       tablesInArea.filter(t => t.status === 'ocupada').length,
    sucia:         tablesInArea.filter(t => t.status === 'sucia').length,
    needs_billing: tablesInArea.filter(t => t.status === 'needs_billing').length,
  };

  // 4. Aplicamos el filtro de estado final
  const filtered = filter === 'all'
    ? tablesInArea
    : filter === 'libre'
      ? tablesInArea.filter(t => t.status === 'libre' || t.status === 'free')
      : tablesInArea.filter(t => t.status === filter);

  const FILTERS = [
    { id: 'all',           label: 'Todas',       count: counts.all,           dot: 'bg-white/30' },
    { id: 'libre',         label: 'Libres',      count: counts.libre,         dot: 'bg-emerald-500' },
    { id: 'ocupada',       label: 'Ocupadas',    count: counts.ocupada,       dot: 'bg-amber-400' },
    { id: 'sucia',         label: 'Sucias',      count: counts.sucia,         dot: 'bg-orange-500' },
    { id: 'needs_billing', label: 'Por cobrar',  count: counts.needs_billing, dot: 'bg-red-500' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (tablesWithStatus.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
            <rect x="4" y="3" width="16" height="4" rx="1"/><path d="M6 7v14M18 7v14M12 7v14M4 14h16"/>
          </svg>
        </div>
        <p className="text-white/30 font-bold text-sm">No hay mesas configuradas</p>
        <p className="text-white/15 text-xs mt-1">Ve a "Mesas y QRs" para crearlas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selectores de Sede y Área */}
      <div className="flex flex-col gap-4">
        {/* Selector de Sede (solo si estamos en modo "Todas") */}
        {isAllLocations && locations.length > 1 && (
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest pl-1">Filtrar por Sede</span>
            <div className="flex items-center gap-1 p-1 bg-white/5 rounded-2xl w-fit overflow-x-auto no-scrollbar border border-white/5">
              <button
                onClick={() => setSelectedLocationId('all')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  selectedLocationId === 'all'
                    ? 'bg-white/10 text-white shadow-lg'
                    : 'text-white/30 hover:text-white/60'
                }`}
              >
                Todas las Sedes
              </button>
              {locations.map(loc => (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLocationId(loc.id)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                    selectedLocationId === loc.id
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 shadow-lg'
                      : 'text-white/30 hover:text-white/60 border border-transparent'
                  }`}
                >
                  {loc.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selector de Áreas (Tabs) */}
        {areas.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest pl-1">Filtrar por Área</span>
            <div className="flex items-center gap-1 p-1 bg-white/5 rounded-2xl w-fit overflow-x-auto no-scrollbar border border-white/5">
              <button
                onClick={() => setSelectedAreaId('all')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  selectedAreaId === 'all'
                    ? 'bg-white/10 text-white shadow-lg'
                    : 'text-white/30 hover:text-white/60'
                }`}
              >
                Todas las Áreas
              </button>
              {areas
                .filter(a => selectedLocationId === 'all' || a.location_id === selectedLocationId)
                .map(area => (
                  <button
                    key={area.id}
                    onClick={() => setSelectedAreaId(area.id)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                      selectedAreaId === area.id
                        ? 'bg-[#2f4131] text-white shadow-lg border border-white/10'
                        : 'text-white/30 hover:text-white/60 border border-transparent'
                    }`}
                  >
                    {area.name}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Filtros rápidos de estado */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border ${
              filter === f.id
                ? 'bg-white/10 border-white/20 text-white shadow-sm'
                : 'bg-white/[0.03] border-white/5 text-white/40 hover:text-white/70 hover:bg-white/[0.06]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${f.dot}`} />
            {f.label}
            <span className={`ml-0.5 text-[10px] font-black ${filter === f.id ? 'text-white' : 'text-white/30'}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Grid de mesas */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 text-center text-white/20 text-sm font-medium"
          >
            No hay mesas en este estado
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map(table => (
                <TableCard key={table.id} table={table} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leyenda SLA */}
      <div className="flex items-center gap-4 pt-1 text-[10px] text-white/20 font-medium">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-0.5 bg-orange-400 rounded" /> +20 min sin avance
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-0.5 bg-red-500 rounded" /> +40 min — alerta SLA
        </span>
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.7; }
        }
        .animate-pulse-slow { animation: pulse-slow 2.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
