import React from 'react';
import { colombiaDateTime } from '../utils/orderScheduling';

export default function OrderFulfillmentPicker({
  modes,
  type,
  onType,
  scheduled,
  onScheduled,
  time,
  onTime,
  requiresScheduling = false,
  minScheduleLabel = '',
  quickSlots = []
}) {
  const button = selected => `p-3 rounded-xl border-2 text-xs font-bold transition-all ${selected ? 'border-[#2f4131] bg-[#2f4131]/10 text-[#2f4131]' : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'}`;
  const showScheduleSection = modes.scheduled || requiresScheduling;

  return <div className="space-y-3">
    <p className="text-sm font-bold">¿Cómo quieres recibir tu pedido?</p>
    <div className="grid grid-cols-2 gap-2">
      {[
        ['dine_in', 'En mesa'],
        ['takeaway', 'Recoger en tienda · Sin domicilio'],
        ['delivery', 'A domicilio'],
      ].filter(([id]) => modes[id]).map(([id, label]) => <button key={id} type="button" aria-pressed={type === id} onClick={() => onType(id)} className={button(type === id)}>{label}</button>)}
    </div>
    {showScheduleSection && <>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">¿Para cuándo lo quieres?</p>
        {requiresScheduling && (
          <span className="text-[11px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full border border-sky-200">
            📅 Pre-orden ({minScheduleLabel || 'Horario programado'})
          </span>
        )}
      </div>
      {!requiresScheduling && (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" aria-pressed={!scheduled} onClick={() => { onScheduled(false); onTime(''); }} className={button(!scheduled)}>Lo antes posible</button>
          <button type="button" aria-pressed={scheduled} onClick={() => onScheduled(true)} className={button(scheduled)}>Programar fecha y hora</button>
        </div>
      )}
      {(scheduled || requiresScheduling) && <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-2xl space-y-2.5">
        <label htmlFor="order-scheduled-time" className="block text-xs font-extrabold text-sky-950">
          Elige la hora de {type === 'takeaway' ? 'recogida' : type === 'dine_in' ? 'servicio en mesa' : 'entrega'} (hora de Colombia)
        </label>
        {quickSlots.length > 0 && (
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-sky-800 block">Horas recomendadas (toca una opción):</span>
            <div className="flex flex-wrap gap-1.5">
              {quickSlots.map(slot => {
                const isSelected = time === slot.value;
                return (
                  <button
                    key={slot.value}
                    type="button"
                    onClick={() => {
                      onScheduled(true);
                      onTime(slot.value);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-sky-700 text-white border-sky-700 shadow-xs'
                        : 'bg-white text-sky-900 border-sky-200 hover:bg-sky-100/70'
                    }`}
                  >
                    🕒 {slot.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <input
          id="order-scheduled-time"
          type="datetime-local"
          value={time}
          min={colombiaDateTime()}
          onChange={e => {
            onScheduled(true);
            onTime(e.target.value);
          }}
          className="w-full p-2.5 rounded-xl border border-sky-200 bg-white text-sm font-semibold text-neutral-900"
        />
        <p className="text-[11px] font-medium text-sky-900 leading-snug">
          Recibimos tu pedido de inmediato y lo preparamos fresco para la hora que elijas.
        </p>
      </div>}
    </>}
  </div>;
}
