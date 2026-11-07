import { Icon } from '@iconify/react';

export function OperationalIntelligenceCard({
  settingsForm,
  setSettingsForm,
  handleSaveSettings,
  isSubmittingSettings
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-xs">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Icon icon="solar:bolt-linear" className="text-xl" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Inteligencia Operativa</h3>
            <p className="text-xs text-gray-500 mt-0.5">Umbrales y métricas de desempeño para el KDS y mapa de mesas.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Inactivity Threshold */}
        <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200/70">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100/70 text-amber-700 flex items-center justify-center text-sm">
                <Icon icon="solar:clock-circle-linear" />
              </div>
              <span className="text-xs font-semibold text-gray-800">Alerta de Inactividad</span>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md tabular-nums">
              {settingsForm.inactivity_threshold_mins} min
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="120"
            step="5"
            value={settingsForm.inactivity_threshold_mins}
            onChange={(e) => setSettingsForm({ ...settingsForm, inactivity_threshold_mins: parseInt(e.target.value) })}
            className="w-full accent-[#2f4131] h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <p className="text-[11px] text-gray-500 mt-2">Alerta visual en mesas tras este tiempo sin ordenar.</p>
        </div>

        {/* Prep Target */}
        <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200/70">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center text-sm">
                <Icon icon="solar:chef-hat-broken" />
              </div>
              <span className="text-xs font-semibold text-gray-800">Meta de Cocina</span>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md tabular-nums">
              {settingsForm.target_prep_time_mins} min
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="60"
            step="1"
            value={settingsForm.target_prep_time_mins}
            onChange={(e) => setSettingsForm({ ...settingsForm, target_prep_time_mins: parseInt(e.target.value) })}
            className="w-full accent-emerald-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <p className="text-[11px] text-gray-500 mt-2">Tiempo ideal en cocina para mantener semáforo en verde.</p>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={isSubmittingSettings}
          className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          {isSubmittingSettings ? 'Guardando...' : 'Guardar Umbrales'}
        </button>
      </div>
    </div>
  );
}
