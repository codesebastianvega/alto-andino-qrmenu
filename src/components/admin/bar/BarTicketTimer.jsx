import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify-icon/react';
import { getStationTiming, formatOrderDuration } from '../../../utils/orderTiming';

export default function BarTicketTimer({ order, createdAt, isDark, targetMins = 10 }) {
  const [mins, setMins] = useState(null);

  useEffect(() => {
    const updateTimer = () => {
      const elapsed = order && ['preparing', 'ready'].includes(order.bar_status)
        ? getStationTiming(order, 'bar') : Math.max(0, Date.now() - new Date(createdAt).getTime());
      setMins(elapsed == null ? null : Math.floor(elapsed / 60000));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 10000);
    return () => clearInterval(interval);
  }, [createdAt, order?.bar_status, order?.bar_started_at, order?.bar_ready_at, order?.status]);

  const isOverdue = mins > targetMins;
  const isWarning = mins >= Math.floor(targetMins * 0.7);

  let badgeColor = isDark 
    ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' 
    : 'text-cyan-800 bg-cyan-50 border-cyan-200 font-bold';

  if (isWarning && !isOverdue) {
    badgeColor = isDark 
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' 
      : 'text-amber-800 bg-amber-50 border-amber-200 font-bold';
  }
  if (isOverdue) {
    badgeColor = isDark 
      ? 'text-rose-400 bg-rose-500/20 border-rose-500/40 animate-pulse font-black' 
      : 'text-rose-700 bg-rose-50 border-rose-300 animate-pulse font-black';
  }

  return (
    <div className={`text-xs font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${badgeColor}`}>
      <Icon icon={isOverdue ? "heroicons:exclamation-triangle" : "heroicons:clock"} className="text-xs" />
      <span>{order && ['preparing', 'ready'].includes(order.bar_status) ? 'Barra' : 'Espera'} · {formatOrderDuration(mins == null ? null : mins * 60000)}</span>
      {isOverdue && (
        <span className="text-[10px] ml-0.5 opacity-90">
          (+{mins - targetMins}m)
        </span>
      )}
    </div>
  );
}
