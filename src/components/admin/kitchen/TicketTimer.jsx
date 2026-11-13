import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify-icon/react';
import { getStationTiming, formatOrderDuration } from '../../../utils/orderTiming';

export default function TicketTimer({ order, createdAt, scheduledTime, isDark, targetMins = 15 }) {
  const [timerData, setTimerData] = useState({ mode: 'normal', mins: 0, text: '', isOverdue: false, isWarning: false });

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();

      if (order && ['preparing', 'ready'].includes(order.kitchen_status)) {
        const elapsed = getStationTiming(order, 'kitchen', now);
        const mins = elapsed == null ? 0 : Math.floor(elapsed / 60000);
        setTimerData({ mode: 'normal', mins, text: 'Cocina · ' + formatOrderDuration(elapsed), isOverdue: elapsed != null && mins > targetMins, isWarning: elapsed != null && mins >= targetMins * 0.7 });
        return;
      }
      if (scheduledTime) {
        const sched = new Date(scheduledTime);
        const diffMs = sched - now;
        const diffMins = Math.floor(diffMs / 60000);

        // 1. More than targetMins in the future: calm scheduled waiting
        if (diffMins > targetMins) {
          const h = Math.floor(diffMins / 60);
          const m = diffMins % 60;
          const countdown = h > 0 ? `${h}h ${m}m` : `${m}m`;
          const timeFormatted = sched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setTimerData({
            mode: 'scheduled_waiting',
            mins: diffMins,
            text: `🕒 Para las ${timeFormatted} (en ${countdown})`,
            isOverdue: false,
            isWarning: false
          });
          return;
        }

        // 2. Inside cooking window (fire window)
        if (diffMins >= 0) {
          const elapsedCooking = 0;
          setTimerData({
            mode: 'scheduled_fire',
            mins: elapsedCooking,
            text: `Iniciar preparación · faltan ${diffMins} min para el horario`,
            isOverdue: false,
            isWarning: true
          });
          return;
        }

        // 3. Past scheduled delivery time
        const overdueMins = Math.abs(diffMins);
        setTimerData({
          mode: 'overdue',
          mins: targetMins + overdueMins,
          text: `Hora programada vencida · ${overdueMins} min`,
          isOverdue: true,
          isWarning: false
        });
        return;
      }

      // Standard immediate order
      const elapsed = Math.max(0, Math.floor((now - new Date(createdAt)) / 60000));
      setTimerData({
        mode: 'normal',
        mins: elapsed,
        text: `Espera · ${elapsed} min`,
        isOverdue: elapsed > targetMins,
        isWarning: elapsed >= Math.floor(targetMins * 0.7) && elapsed <= targetMins
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 10000);
    return () => clearInterval(interval);
  }, [createdAt, scheduledTime, targetMins, order?.kitchen_status, order?.kitchen_started_at, order?.kitchen_ready_at, order?.status]);

  let badgeColor = isDark 
    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
    : 'text-emerald-700 bg-emerald-50 border-emerald-200';
    
  if (timerData.mode === 'scheduled_waiting') {
    badgeColor = isDark
      ? 'text-sky-300 bg-sky-950/70 border-sky-800/80 font-bold'
      : 'text-sky-800 bg-sky-50 border-sky-200 font-bold';
  } else if (timerData.mode === 'scheduled_fire') {
    badgeColor = isDark
      ? 'text-amber-300 bg-amber-950/80 border-amber-600/80 font-black animate-pulse'
      : 'text-amber-900 bg-amber-100 border-amber-300 font-black animate-pulse';
  } else if (timerData.isWarning && !timerData.isOverdue) {
    badgeColor = isDark 
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' 
      : 'text-amber-800 bg-amber-50 border-amber-200 font-bold';
  } else if (timerData.isOverdue) {
    badgeColor = isDark 
      ? 'text-rose-400 bg-rose-500/20 border-rose-500/40 animate-pulse font-black' 
      : 'text-rose-700 bg-rose-50 border-rose-300 animate-pulse font-black';
  }

  return (
    <div className={`text-xs font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${badgeColor}`}>
      <Icon 
        icon={timerData.isOverdue ? "heroicons:exclamation-triangle" : (timerData.mode === 'scheduled_waiting' ? "heroicons:calendar" : (timerData.mode === 'scheduled_fire' ? "heroicons:fire" : "heroicons:clock"))} 
        className="text-xs" 
      />
      <span>{timerData.text}</span>
      {timerData.mode === 'normal' && timerData.isOverdue && (
        <span className="text-[10px] ml-0.5 opacity-90">
          (+{timerData.mins - targetMins}m)
        </span>
      )}
    </div>
  );
}
