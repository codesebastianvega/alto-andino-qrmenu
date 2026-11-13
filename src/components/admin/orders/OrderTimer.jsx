import React from 'react';
import { Icon } from '@iconify-icon/react';
import { formatOrderDuration, getOrderTiming, getOrderSchedule } from '../../../utils/orderTiming';
import { useOrderClock } from './OrderTimingBreakdown';

export function OrderTimer({ order }) {
  const now = useOrderClock(order.status);
  const current = getOrderTiming(order, now).current;
  if (!current) return null;
  const schedule = getOrderSchedule(order, now);
  if (current.key === 'scheduled') return <div className="px-2 py-1 rounded-lg text-[10px] font-bold bg-sky-100 text-sky-800" title="Espera programada; todavía no es tiempo de preparación">
    Programado · {schedule.label}<span className="block font-medium">Faltan {Math.ceil(schedule.remainingMs / 60000)} min</span>
  </div>;
  let color = 'bg-slate-100 text-slate-600';
  if (current.ms != null) {
    if (current.key === 'fulfillment') color = 'bg-indigo-100 text-indigo-700';
    else if (current.key === 'ready') color = 'bg-amber-100 text-amber-800';
    else color = current.ms >= 20 * 60000 ? 'bg-red-500 text-white' : current.ms >= 10 * 60000 ? 'bg-yellow-500 text-white' : 'bg-emerald-500 text-white';
  }
  return <div className={'px-2 py-0.5 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 shadow-sm ' + color} title="Tiempo de esta etapa, no el total del pedido">
    <Icon icon="heroicons:clock" className="text-[14px] shrink-0" />
    <span>{current.label} · {formatOrderDuration(current.ms)}</span>
  </div>;
}
export default OrderTimer;
