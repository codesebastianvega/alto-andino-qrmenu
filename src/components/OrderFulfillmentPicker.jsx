import React from 'react';
import { colombiaDateTime } from '../utils/orderScheduling';

export default function OrderFulfillmentPicker({ modes, type, onType, scheduled, onScheduled, time, onTime }) {
  const button = selected => `p-3 rounded-xl border-2 text-xs font-bold ${selected ? 'border-[#2f4131] bg-[#2f4131]/10' : 'border-neutral-200'}`;
  return <div className="space-y-3">
    <p className="text-sm font-bold">¿Cómo quieres recibir tu pedido?</p>
    <div className="grid grid-cols-2 gap-2">
      {[
        ['dine_in', 'En mesa'],
        ['takeaway', 'Recoger en tienda · Sin domicilio'],
        ['delivery', 'A domicilio'],
      ].filter(([id]) => modes[id]).map(([id, label]) => <button key={id} type="button" aria-pressed={type === id} onClick={() => onType(id)} className={button(type === id)}>{label}</button>)}
    </div>
    {modes.scheduled && <>
      <p className="text-sm font-bold">¿Para cuándo lo quieres?</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" aria-pressed={!scheduled} onClick={() => { onScheduled(false); onTime(''); }} className={button(!scheduled)}>Lo antes posible</button>
        <button type="button" aria-pressed={scheduled} onClick={() => onScheduled(true)} className={button(scheduled)}>Programar fecha y hora</button>
      </div>
      {scheduled && <div className="p-3 bg-sky-50 rounded-xl space-y-2">
        <label htmlFor="order-scheduled-time" className="block text-xs font-bold">Fecha y hora de {type === 'takeaway' ? 'recogida' : 'entrega'} (hora de Colombia)</label>
        <input id="order-scheduled-time" type="datetime-local" value={time} min={colombiaDateTime()} onChange={e => onTime(e.target.value)} className="w-full p-3 rounded-xl border border-neutral-200 bg-white text-sm" />
        <p className="text-xs text-sky-900">El negocio recibe tu pedido ahora y lo mantiene pendiente para la hora seleccionada.</p>
      </div>}
    </>}
  </div>;
}
