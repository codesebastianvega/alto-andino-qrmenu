import React from 'react';
import { Loader2 } from 'lucide-react';

const DAYS_OF_WEEK = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function SedeHoursTab({
  hours = [],
  loadingHours = false,
  handleUpdateHour
}) {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div>
        <h4 className="text-base font-bold text-gray-900">Horarios de Atención</h4>
        <p className="text-xs text-gray-500 mt-0.5">Configura los horarios de atención y turnos específicos para esta sede.</p>
      </div>

      {loadingHours ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-2.5">
          {hours.map((h, index) => {
            const isClosed = h.is_closed;
            return (
              <div 
                key={h.day_of_week} 
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all gap-3 ${
                  isClosed 
                    ? 'bg-gray-50/60 border-gray-200/60 opacity-60' 
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 font-bold text-xs uppercase tracking-wider ${isClosed ? 'text-gray-400' : 'text-gray-800'}`}>
                    {DAYS_OF_WEEK[h.day_of_week]?.substring(0, 3)}
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="time" 
                      value={h.open_time || '08:00'} 
                      onChange={(e) => handleUpdateHour(index, 'open_time', e.target.value)}
                      disabled={isClosed}
                      className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-800 focus:bg-white focus:ring-1 focus:ring-[#2f4131] outline-none disabled:opacity-30 tabular-nums w-24 text-center"
                    />
                    <span className="text-gray-300 text-xs">—</span>
                    <input 
                      type="time" 
                      value={h.close_time || '22:00'} 
                      onChange={(e) => handleUpdateHour(index, 'close_time', e.target.value)}
                      disabled={isClosed}
                      className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-800 focus:bg-white focus:ring-1 focus:ring-[#2f4131] outline-none disabled:opacity-30 tabular-nums w-24 text-center"
                    />
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={() => handleUpdateHour(index, 'is_closed', !isClosed)}
                  className={`w-full sm:w-auto justify-center px-3.5 py-1.5 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                    isClosed 
                      ? 'bg-rose-50 border-rose-100 text-rose-600' 
                      : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${isClosed ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                  {isClosed ? 'Cerrado' : 'Abierto'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
