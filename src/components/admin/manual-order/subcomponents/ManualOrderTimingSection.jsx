import React from 'react';
import { Icon } from '@iconify-icon/react';

export default function ManualOrderTimingSection({
  timingMode,
  setTimingMode,
  scheduledTime,
  setScheduledTime
}) {
  return (
    <div className="p-3.5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-2.5">
      <span className="text-[11px] font-black uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
        <Icon icon="heroicons:clock" className="text-amber-600" />
        Momento de Preparación / Entrega
      </span>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setTimingMode('immediate');
            setScheduledTime('');
          }}
          className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            timingMode === 'immediate'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
              : 'bg-neutral-50 border-neutral-200 text-neutral-500'
          }`}
        >
          <Icon icon="heroicons:bolt" className="text-emerald-600" />
          <span>Lo antes posible</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTimingMode('scheduled');
            if (!scheduledTime) {
              const todayDate = new Date().toISOString().slice(0, 10);
              setScheduledTime(`${todayDate}T12:30`);
            }
          }}
          className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            timingMode === 'scheduled'
              ? 'bg-sky-50 border-sky-300 text-sky-900 shadow-xs'
              : 'bg-neutral-50 border-neutral-200 text-neutral-500'
          }`}
        >
          <Icon icon="heroicons:calendar" className="text-sky-600" />
          <span>Programar hora</span>
        </button>
      </div>

      {timingMode === 'scheduled' && (
        <div className="space-y-2 pt-1 animate-in fade-in">
          <div className="grid grid-cols-4 gap-1">
            {['12:30', '13:00', '13:30', '14:00'].map(t => {
              const todayDate = new Date().toISOString().slice(0, 10);
              const iso = `${todayDate}T${t}`;
              const isSel = scheduledTime === iso;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setScheduledTime(iso)}
                  className={`py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                    isSel
                      ? 'bg-sky-700 text-white border-sky-700 shadow-xs'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {t === '12:30' ? '12:30 PM' : t === '13:00' ? '1:00 PM' : t === '13:30' ? '1:30 PM' : '2:00 PM'}
                </button>
              );
            })}
          </div>
          <input
            type="datetime-local"
            value={scheduledTime}
            onChange={e => setScheduledTime(e.target.value)}
            className="w-full h-8 px-2.5 rounded-lg border border-neutral-200 text-xs bg-neutral-50"
          />
        </div>
      )}
    </div>
  );
}
