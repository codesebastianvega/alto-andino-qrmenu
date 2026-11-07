import { Icon } from '@iconify/react';
import { Loader2 } from 'lucide-react';
import { BUSINESS_TYPES } from '../../../constants/businessTypes';

export function BusinessModelCard({
  settingsForm,
  setSettingsForm,
  handleSaveSettings,
  isSubmittingSettings
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-xs relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100/60">
            <Icon icon="solar:shop-2-bold" className="text-xl" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">Modelo de Negocio</h3>
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-100/80 text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider">
                {BUSINESS_TYPES.find(b => b.id === settingsForm.business_type)?.badge || 'Operación'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Define cómo reciben y piden tus comensales (Dark Kitchen, Restaurante, etc.)</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={isSubmittingSettings}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer self-start sm:self-auto shrink-0 disabled:opacity-50"
        >
          {isSubmittingSettings ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Icon icon="solar:diskette-bold-duotone" className="text-base" />
              <span>Guardar Modelo</span>
            </>
          )}
        </button>
      </div>

      {/* Selector de tipo de negocio predefinido */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        {BUSINESS_TYPES.map(bType => {
          const isSelected = settingsForm.business_type === bType.id;
          return (
            <button
              key={bType.id}
              type="button"
              onClick={() => {
                setSettingsForm(prev => ({
                  ...prev,
                  business_type: bType.id,
                  allow_delivery: bType.defaults.allow_delivery,
                  allow_takeaway: bType.defaults.allow_takeaway,
                  allow_dine_in: bType.defaults.allow_dine_in,
                  allow_scheduled: bType.defaults.allow_scheduled,
                }));
              }}
              className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'border-[#2f4131] bg-[#2f4131]/5 text-gray-900 shadow-2xs ring-1 ring-[#2f4131]'
                  : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-[#2f4131] text-white' : 'bg-gray-100 text-gray-500'}`}>
                  <Icon icon={bType.icon} className="text-base" />
                </div>
                {isSelected && (
                  <span className="text-[10px] font-semibold bg-[#2f4131] text-white px-2 py-0.5 rounded-md">
                    Activo
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 leading-snug">{bType.name}</p>
                <p className="text-[11px] text-gray-500 leading-snug mt-1">{bType.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Opciones de recepción / modalidades de entrega */}
      <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/80">
        <p className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-wider flex items-center gap-2">
          <Icon icon="solar:routing-2-bold" className="text-gray-500 text-sm" />
          Modalidades Activas para el Cliente
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <label className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${settingsForm.allow_delivery ? 'bg-white border-emerald-300 shadow-2xs' : 'bg-transparent border-gray-200/70 opacity-60'}`}>
            <input
              type="checkbox"
              checked={settingsForm.allow_delivery}
              onChange={e => setSettingsForm({ ...settingsForm, allow_delivery: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <div>
              <p className="text-xs font-bold text-gray-900">🛵 Domicilio</p>
              <p className="text-[10px] text-gray-500">Pide dirección</p>
            </div>
          </label>

          <label className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${settingsForm.allow_takeaway ? 'bg-white border-emerald-300 shadow-2xs' : 'bg-transparent border-gray-200/70 opacity-60'}`}>
            <input
              type="checkbox"
              checked={settingsForm.allow_takeaway}
              onChange={e => setSettingsForm({ ...settingsForm, allow_takeaway: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <div>
              <p className="text-xs font-bold text-gray-900">🛍️ Para Llevar</p>
              <p className="text-[10px] text-gray-500">Retiro en local</p>
            </div>
          </label>

          <label className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${settingsForm.allow_dine_in ? 'bg-white border-emerald-300 shadow-2xs' : 'bg-transparent border-gray-200/70 opacity-60'}`}>
            <input
              type="checkbox"
              checked={settingsForm.allow_dine_in}
              onChange={e => setSettingsForm({ ...settingsForm, allow_dine_in: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <div>
              <p className="text-xs font-bold text-gray-900">🍽️ En Mesa</p>
              <p className="text-[10px] text-gray-500">Mesa física</p>
            </div>
          </label>

          <label className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${settingsForm.allow_scheduled ? 'bg-white border-emerald-300 shadow-2xs' : 'bg-transparent border-gray-200/70 opacity-60'}`}>
            <input
              type="checkbox"
              checked={settingsForm.allow_scheduled}
              onChange={e => setSettingsForm({ ...settingsForm, allow_scheduled: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <div>
              <p className="text-xs font-bold text-gray-900">📅 Programados</p>
              <p className="text-[10px] text-gray-500">Fecha y hora</p>
            </div>
          </label>
        </div>

        {settingsForm.business_type === 'dark_kitchen' && (
          <div className="flex items-center gap-2.5 p-3 mt-3 rounded-xl bg-purple-50/80 border border-purple-200 text-purple-900 text-xs font-medium">
            <Icon icon="heroicons:sparkles" className="text-purple-600 shrink-0 text-base" />
            <span><strong>Modo Dark Kitchen activo:</strong> Tu carta pública y carrito irán directo a pedir dirección de entrega, ocultando números de mesa y opciones de retiro.</span>
          </div>
        )}

        <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-200/70">
          <p className="text-[11px] text-gray-500">
            Presiona <strong>Guardar Modelo</strong> para aplicar el cambio a tus sedes y al menú digital.
          </p>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSubmittingSettings}
            className="px-4 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmittingSettings ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
