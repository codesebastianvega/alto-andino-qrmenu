export function ThermalPrintingCard({
  settingsForm,
  setSettingsForm,
  handleSaveSettings,
  isSubmittingSettings
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">Impresión y Documentos</h4>
            <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 px-2 py-0.5 rounded-md">
              Factura electrónica (Próximamente)
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">KDS digital principal, con impresión térmica opcional.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${settingsForm.kitchen_print_enabled ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-900">Comanda opcional</span>
            <input
              type="checkbox"
              checked={settingsForm.kitchen_print_enabled}
              onChange={(e) => setSettingsForm({ ...settingsForm, kitchen_print_enabled: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-gray-500">Para locales que no utilicen KDS de cocina.</p>
        </label>

        <label className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${settingsForm.receipt_print_enabled ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-900">Recibo / cuenta</span>
            <input
              type="checkbox"
              checked={settingsForm.receipt_print_enabled}
              onChange={(e) => setSettingsForm({ ...settingsForm, receipt_print_enabled: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-gray-500">Documento interno para control de comensales.</p>
        </label>

        <div className="p-3.5 rounded-xl border border-gray-200 bg-white flex flex-col justify-between">
          <span className="text-xs font-bold text-gray-900 mb-1">Papel térmico</span>
          <select
            value={settingsForm.thermal_paper_width}
            onChange={(e) => setSettingsForm({ ...settingsForm, thermal_paper_width: e.target.value })}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:ring-1 focus:ring-[#2f4131]"
          >
            <option value="80">80 mm (Estándar)</option>
            <option value="50">50 mm (Compacto)</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end mt-5">
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={isSubmittingSettings}
          className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          {isSubmittingSettings ? 'Guardando...' : 'Guardar Impresión'}
        </button>
      </div>
    </div>
  );
}
