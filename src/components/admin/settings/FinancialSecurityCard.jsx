import { Icon } from '@iconify/react';
import { Switch } from '../ui';

export function FinancialSecurityCard({
  settingsForm,
  setSettingsForm,
  handleSaveSettings,
  isSubmittingSettings
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-xs">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Icon icon="solar:hand-money-linear" className="text-xl" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Economía y Seguridad</h3>
            <p className="text-xs text-gray-500 mt-0.5">Propina voluntaria para el servicio y privacidad de métricas.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={isSubmittingSettings}
          className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          {isSubmittingSettings ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      <div className="space-y-3">
        {/* Tip Control */}
        <div className="p-4 rounded-xl border border-gray-200/80 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-gray-900 block">Propina sugerida</span>
            <p className="text-xs text-gray-500 mt-0.5">Sugerir porcentaje de servicio al cliente en órdenes digitales.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {settingsForm.is_service_fee_enabled && (
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settingsForm.service_fee_percentage}
                  onChange={(e) => setSettingsForm({ ...settingsForm, service_fee_percentage: parseInt(e.target.value) || 0 })}
                  className="w-12 bg-transparent border-none p-0 text-center text-xs font-bold text-gray-800 focus:outline-none focus:ring-0"
                />
                <span className="text-xs font-semibold text-gray-500">%</span>
              </div>
            )}
            <Switch
              checked={settingsForm.is_service_fee_enabled}
              onChange={(val) => setSettingsForm({ ...settingsForm, is_service_fee_enabled: val })}
            />
          </div>
        </div>

        {/* Privacy Control */}
        <div className="p-4 rounded-xl border border-gray-200/80 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-gray-900 block">Privacidad de facturación</span>
            <p className="text-xs text-gray-500 mt-0.5">Ocultar cifras de venta y total acumulado a perfiles de staff o meseros.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Icon
              icon={settingsForm.hide_sales_from_staff ? "solar:eye-closed-linear" : "solar:eye-linear"}
              className={`text-lg ${settingsForm.hide_sales_from_staff ? 'text-amber-600' : 'text-gray-400'}`}
            />
            <Switch
              checked={settingsForm.hide_sales_from_staff}
              onChange={(val) => setSettingsForm({ ...settingsForm, hide_sales_from_staff: val })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
