import { Icon } from '@iconify/react';

export function BillingStrategyCard({
  settingsForm,
  setSettingsForm,
  handleSaveSettings,
  isSubmittingSettings
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100/60">
            <Icon icon="solar:card-search-linear" className="text-xl" />
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">Estrategia de Recaudo</h4>
            <p className="text-xs text-gray-500 mt-0.5">Momento en que se solicita el pago a los comensales.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={isSubmittingSettings}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer self-start sm:self-auto shrink-0 disabled:opacity-50"
        >
          {isSubmittingSettings ? 'Guardando...' : 'Guardar Flujo'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { id: 'none', label: 'Post-pago', desc: 'Flujo libre al terminar de comer', icon: 'solar:bill-list-linear' },
          { id: 'pre_preparation', label: 'Pre-preparación', desc: 'Comanda se prepara tras el pago', icon: 'solar:shield-check-linear' },
          { id: 'pre_delivery', label: 'Pre-entrega', desc: 'Pago requerido antes de servir', icon: 'solar:box-minimalistic-linear' }
        ].map((option) => {
          const isActive = settingsForm.payment_requirement_stage === option.id;
          return (
            <label
              key={option.id}
              className={`flex flex-col justify-between gap-3 p-4 rounded-xl border transition-all cursor-pointer relative ${
                isActive
                  ? 'border-[#2f4131] bg-[#2f4131]/5 text-gray-900 shadow-2xs ring-1 ring-[#2f4131]'
                  : 'bg-white border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <input
                type="radio"
                name="payment_flow"
                value={option.id}
                checked={isActive}
                onChange={(e) => setSettingsForm({ ...settingsForm, payment_requirement_stage: e.target.value })}
                className="sr-only"
              />
              <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-[#2f4131] text-white' : 'bg-gray-100 text-gray-500'}`}>
                  <Icon icon={option.icon} className="text-base" />
                </div>
                {isActive && (
                  <span className="text-[10px] font-semibold bg-[#2f4131] text-white px-2 py-0.5 rounded-md">
                    Activo
                  </span>
                )}
              </div>
              <div>
                <span className="text-xs font-bold text-gray-900 block leading-snug">{option.label}</span>
                <span className="text-[11px] text-gray-500 block leading-snug mt-0.5">{option.desc}</span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
