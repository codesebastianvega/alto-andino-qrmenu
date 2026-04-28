import React, { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';

export const GlassCard = ({ children, className = "", noHover = false }) => (
  <motion.div 
    whileHover={noHover ? {} : { y: -4, transition: { duration: 0.2 } }}
    className={`bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] glass-glow ${className}`}
  >
    {children}
  </motion.div>
);

export const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[13px] font-bold transition-all duration-300 ${
      active 
        ? 'bg-[#1A1A1A] text-white shadow-[0_10px_20px_rgba(0,0,0,0.15)] scale-105' 
        : 'bg-white/50 text-gray-500 hover:bg-white hover:text-gray-900 border border-transparent'
    }`}
  >
    <Icon className={`w-4 h-4 ${active ? 'text-emerald-400' : ''}`} />
    {label}
  </button>
);

export const DiffBadge = ({ value }) => {
  if (value === 0 || value === undefined) return null;
  const isPositive = value > 0;
  return (
    <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black ${
      isPositive ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
    }`}>
      {isPositive ? '↑' : '↓'} {Math.abs(Math.round(value))}%
    </div>
  );
};

export const HeatmapCell = React.memo(({ day, h, maxCount, onHover, onLeave, active }) => {
  const opacity = h.count > 0 ? 0.12 + (h.count / maxCount) * 0.88 : 0.05;
  const color = h.count > 0 ? 'bg-emerald-500' : 'bg-gray-100';
  
  return (
    <div 
      className={`flex-1 h-7 rounded-sm ${color} transition-all hover:ring-2 hover:ring-emerald-400 cursor-pointer relative group`}
      style={{ opacity: active ? 1 : opacity, transform: active ? 'scale(1.1)' : 'scale(1)', zIndex: active ? 10 : 1 }}
      onMouseEnter={(e) => onHover(day, h, e.clientX, e.clientY, e.currentTarget)}
      onMouseMove={(e) => onHover(day, h, e.clientX, e.clientY, e.currentTarget)}
      onMouseLeave={onLeave}
    >
      {active && (
        <motion.div 
          layoutId="heatmap-glow"
          className="absolute inset-0 bg-emerald-400/20 blur-md rounded-sm"
        />
      )}
    </div>
  );
});

export const WeeklyHeatmap = React.memo(({ data }) => {
  const [hover, setHover] = useState(null);
  
  const maxCount = useMemo(() => {
    if (!data || !Array.isArray(data)) return 1;
    const counts = data.flatMap(day => (day.hours || []).map(h => h.count || 0));
    return Math.max(...counts, 1);
  }, [data]);

  const handleHover = useCallback((day, hourData, x, y) => {
    setHover({
      day,
      hour: hourData.hour,
      count: hourData.count,
      x,
      y
    });
  }, []);

  const handleLeave = useCallback(() => setHover(null), []);

  if (!data || !Array.isArray(data)) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-400 font-bold uppercase text-[10px] tracking-widest bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
        Cargando mapa de calor...
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex flex-col gap-1.5 overflow-x-auto pt-8 pb-4 custom-scrollbar">
        {data.map((day, di) => (
          <div key={di} className="flex items-center gap-1.5 min-w-[600px]">
            <span className="w-8 text-[10px] font-black text-gray-400 uppercase">{day?.day}</span>
            <div className="flex-1 flex gap-1">
              {(day?.hours || []).map((h, hi) => (
                <HeatmapCell 
                  key={hi}
                  day={day?.day}
                  h={h}
                  maxCount={maxCount}
                  onHover={handleHover}
                  onLeave={handleLeave}
                  active={hover?.day === day?.day && hover?.hour === h?.hour}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {createPortal(
        <AnimatePresence>
          {hover && (
            <motion.div
              key="heatmap-tooltip"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                left: hover.x,
                top: hover.y
              }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ 
                type: "spring", 
                damping: 25, 
                stiffness: 350,
                opacity: { duration: 0.1 }
              }}
              style={{ 
                position: 'fixed', 
                pointerEvents: 'none',
                zIndex: 999999,
                x: '-50%',
                y: 'calc(-100% - 20px)'
              }}
              className="bg-[#101010]/95 backdrop-blur-2xl text-white p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center min-w-[160px] border border-white/10"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none">
                  {hover.day} • {hover.hour}:00h
                </p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black tabular-nums">{hover.count}</span>
                <span className="text-gray-400 font-bold uppercase text-[9px] tracking-tight">Pedidos realizados</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
});

export const VisionTooltip = ({ active, payload, label, formatter, units = "ventas" }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0A0A0B]/95 backdrop-blur-3xl text-white p-4 rounded-2xl border border-white/10 min-w-[180px] animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            <p className="text-[10px] font-black text-white/90 uppercase tracking-widest leading-none">
              {label}
            </p>
          </div>
          <span className="text-[8px] font-bold text-emerald-400/50 uppercase tracking-tighter">Vision OS</span>
        </div>
        <div className="space-y-2">
          {payload.map((item, i) => (
            <div key={i} className="flex justify-between items-center gap-4 group">
              <div className="flex items-center gap-2">
                <div 
                  className="w-1 h-3 rounded-full" 
                  style={{ backgroundColor: item.color || item.fill || '#10B981' }} 
                />
                <span className="text-gray-400 font-bold uppercase text-[9px] tracking-tight group-hover:text-white/80 transition-colors">
                  {item.name === 'revenue' ? 'Ingresos' : 
                   item.name === 'avgTicket' ? 'Ticket Prom.' : 
                   item.name === 'count' ? 'Ventas' :
                   item.name === 'cumPercentage' ? 'Acomulado' :
                   item.name === 'value' ? units :
                   item.name}
                </span>
              </div>
              <span className="text-[13px] font-black tabular-nums text-white">
                {formatter ? formatter(item.value, item.name) : 
                 (item.name === 'cumPercentage' ? `${item.value.toFixed(1)}%` : 
                  (typeof item.value === 'number' && item.value > 1000 ? item.value.toLocaleString() : item.value))}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};
