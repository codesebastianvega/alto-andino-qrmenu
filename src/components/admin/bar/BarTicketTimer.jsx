import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify-icon/react';

export default function BarTicketTimer({ createdAt, isDark, targetMins = 10 }) {
  const [mins, setMins] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      setMins(Math.max(0, Math.floor((new Date() - new Date(createdAt)) / 60000)));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 10000);
    return () => clearInterval(interval);
  }, [createdAt]);

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
      <span>{mins}m</span>
      {isOverdue && (
        <span className="text-[10px] ml-0.5 opacity-90">
          (+{mins - targetMins}m)
        </span>
      )}
    </div>
  );
}
