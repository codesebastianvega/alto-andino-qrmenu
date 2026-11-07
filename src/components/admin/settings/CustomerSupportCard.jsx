import { Icon } from '@iconify/react';

export function CustomerSupportCard({
  settingsForm,
  setSettingsForm,
  handleSaveSettings,
  isSubmittingSettings
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-xs">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Icon icon="logos:whatsapp-icon" className="text-xl" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Atención al Cliente</h3>
            <p className="text-xs text-gray-500 mt-0.5">Línea directa para que tus comensales escriban ante dudas.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Número de WhatsApp para Soporte
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Icon icon="solar:phone-calling-linear" className="text-base" />
            </div>
            <input
              type="text"
              value={settingsForm.whatsapp_number_orders}
              onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp_number_orders: e.target.value })}
              placeholder="Ej. +573001234567"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2f4131] focus:border-[#2f4131]"
            />
          </div>
          <p className={`text-[11px] mt-1.5 flex items-center gap-1.5 ${!settingsForm.whatsapp_number_orders ? 'text-amber-600' : 'text-gray-500'}`}>
            <Icon icon="solar:info-circle-linear" className="text-sm shrink-0" />
            <span>{settingsForm.whatsapp_number_orders ? 'Tus comensales verán este canal en el seguimiento de su orden.' : 'Pendiente: ingresa un número para habilitar soporte directo en pedidos.'}</span>
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          {settingsForm.whatsapp_number_orders ? (
            <a
              href={`https://wa.me/${settingsForm.whatsapp_number_orders.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hola! Tengo una duda sobre mi pedido.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer"
            >
              <Icon icon="logos:whatsapp-icon" className="text-xs" />
              <span>Probar enlace comensal</span>
            </a>
          ) : <div />}

          <button
            type="submit"
            disabled={isSubmittingSettings}
            className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmittingSettings ? 'Guardando...' : 'Guardar WhatsApp'}
          </button>
        </div>
      </form>
    </div>
  );
}
