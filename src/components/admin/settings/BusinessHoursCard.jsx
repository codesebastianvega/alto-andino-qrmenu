const getDayName = (day) => ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][day];

export function BusinessHoursCard({
  hours = [],
  handleUpdateHour,
  handleSaveHours,
  isSubmittingHours
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs flex flex-col overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">Horarios de Servicio</h3>
          <p className="text-xs text-gray-500 mt-0.5">Controla la disponibilidad del menú digital por día.</p>
        </div>
        <button
          type="button"
          onClick={handleSaveHours}
          disabled={isSubmittingHours}
          className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          {isSubmittingHours ? 'Guardando...' : 'Guardar Horarios'}
        </button>
      </div>

      <div className="p-5 sm:p-6 space-y-2">
        {hours.map((h, index) => {
          const isClosed = h.is_closed;
          return (
            <div
              key={h.day_of_week}
              className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl border transition-all gap-3 ${
                isClosed
                  ? 'bg-gray-50/60 border-gray-200/60 opacity-60'
                  : 'bg-white border-gray-200/80 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`w-12 text-xs font-bold uppercase tracking-wider ${isClosed ? 'text-gray-400' : 'text-gray-800'}`}>
                  {getDayName(h.day_of_week).substring(0, 3)}
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="time"
                    value={h.open_time || '08:00'}
                    onChange={(e) => handleUpdateHour(index, 'open_time', e.target.value)}
                    disabled={isClosed}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-800 focus:bg-white focus:ring-1 focus:ring-[#2f4131] outline-none disabled:opacity-40 tabular-nums w-24 text-center cursor-pointer"
                  />
                  <span className="text-gray-400 text-xs">—</span>
                  <input
                    type="time"
                    value={h.close_time || '22:00'}
                    onChange={(e) => handleUpdateHour(index, 'close_time', e.target.value)}
                    disabled={isClosed}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-800 focus:bg-white focus:ring-1 focus:ring-[#2f4131] outline-none disabled:opacity-40 tabular-nums w-24 text-center cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleUpdateHour(index, 'is_closed', !isClosed)}
                className={`w-full sm:w-auto px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isClosed
                    ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${isClosed ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                {isClosed ? 'Cerrado' : 'Abierto'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
