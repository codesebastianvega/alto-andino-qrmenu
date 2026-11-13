import React, { useEffect, useState } from 'react';
import { formatOrderDuration, getOrderTiming, getStationTiming } from '../../../utils/orderTiming';

export function useOrderClock(status) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    setNow(Date.now());
    if (status === 'delivered' || status === 'cancelled') return;
    const id = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(id);
  }, [status]);
  return now;
}

export default function OrderTimingBreakdown({ order, compact = false }) {
  const now = useOrderClock(order.status);
  const timing = getOrderTiming(order, now);
  return <section aria-label="Tiempos del pedido" className={compact ? 'rounded-lg bg-slate-50 border border-slate-100 p-2' : 'rounded-2xl bg-white border border-slate-200 p-4 space-y-3'}>
    {!compact && <h3 className="text-sm font-bold text-slate-800">Tiempos del pedido</h3>}
    <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
      {timing.stages.map(stage => <div key={stage.key} className={stage.running ? 'text-emerald-800' : 'text-slate-500'}>
        <span className="block text-[10px] font-semibold">{stage.label}{stage.running ? ' · ahora' : ''}</span>
        <span className={`block font-bold ${compact ? 'text-[11px]' : 'text-sm'}`}>{formatOrderDuration(stage.ms)}</span>
      </div>)}
    </div>
    {timing.plannedWaitMs != null && <p className="text-[10px] text-sky-700">Espera programada: <b>{formatOrderDuration(timing.plannedWaitMs)}</b> · no cuenta como demora operativa.</p>}
    {timing.untilReadyMs != null && <p className="text-[10px] text-slate-500">{timing.untilReadyLabel}: <b>{formatOrderDuration(timing.untilReadyMs)}</b></p>}
    {!compact && <>
      <p className="text-xs text-slate-600">Tiempo total desde recibido: <b>{formatOrderDuration(timing.totalMs)}</b></p>
      {timing.plannedWaitMs != null && <p className="text-xs text-slate-600">Tiempo operativo sin la reserva: <b>{formatOrderDuration(timing.operationalTotalMs)}</b></p>}
      {(order.kitchen_started_at || order.bar_started_at) && <p className="text-xs text-slate-500">Último ciclo por estación — Cocina: {formatOrderDuration(getStationTiming(order, 'kitchen', now))} · Barra: {formatOrderDuration(getStationTiming(order, 'bar', now))}</p>}
      <p className="text-[10px] text-slate-400">{timing.hasMissing ? 'Sin registro indica que falta una marca de esa etapa; no se estima con la hora del pago. ' : ''}Preparación excluye la espera de despacho y la entrega. En mesa mide hasta cerrar el pedido; no es tiempo de cocina.</p>
    </>}
  </section>;
}
