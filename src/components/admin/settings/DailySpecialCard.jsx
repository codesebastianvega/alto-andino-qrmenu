import { Icon } from '@iconify/react';

export function DailySpecialCard({
  bentoProducts = [],
  activeBrand,
  bentoConfig,
  setBentoConfig,
  setIsDailySpecialOpen,
  handleSaveSettings,
  isSubmittingSettings
}) {
  if (bentoProducts.length === 0 && activeBrand?.id !== 'a63da806-a62a-49b9-a833-07e0976785ad') {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-amber-200/80 p-6 sm:p-7 shadow-xs relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/60">
            <Icon icon="solar:calendar-date-bold-duotone" className="text-xl" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">Rotación "Plato o Especial del Día"</h3>
              <button
                type="button"
                onClick={() => setIsDailySpecialOpen(true)}
                className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>🍱</span>
                <span>Gestor de Almuerzos</span>
              </button>
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                Motor Dinámico Universal
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Asigna automáticamente un producto promocional destacado según el día de la semana (o sobrescríbelo manualmente hoy). Funciona para cualquier negocio (Bentos, Pizza del Día, Plato Ejecutivo, etc.).
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center gap-3 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200/80 self-start sm:self-auto shrink-0">
          <span className="text-xs font-semibold text-gray-600">
            {bentoConfig.enabled ? 'Activo' : 'Pausado'}
          </span>
          <button
            type="button"
            onClick={() => setBentoConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              bentoConfig.enabled ? 'bg-amber-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                bentoConfig.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {/* Status Banner */}
        <div className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all ${
          bentoConfig.enabled
            ? 'bg-amber-50/70 border-amber-200 text-amber-950'
            : 'bg-gray-50 border-gray-200 text-gray-600'
        }`}>
          <div className="flex items-center gap-2">
            <Icon icon="heroicons:sparkles" className="text-amber-600 shrink-0 text-base" />
            <span>
              {bentoConfig.enabled
                ? `La rotación automática está ACTIVA. El plato del día pasa automáticamente a la subcategoría "${bentoConfig.label || 'Plato del Día'}" con precio promo.`
                : 'La rotación está PAUSADA. Todos los productos se mostrarán a su precio estándar regular.'}
            </span>
          </div>
          {bentoConfig.promo_price > 0 && bentoConfig.standard_price > bentoConfig.promo_price && (
            <span className="shrink-0 bg-amber-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-md shadow-2xs">
              Ahorro: ${(bentoConfig.standard_price - bentoConfig.promo_price).toLocaleString('es-CO')} COP
            </span>
          )}
        </div>

        {/* Commercial Label & Promo Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/60 p-4 rounded-xl border border-gray-200/70">
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              🏷️ Nombre / Etiqueta Comercial
            </label>
            <input
              type="text"
              value={bentoConfig.label || ''}
              onChange={e => setBentoConfig(prev => ({ ...prev, label: e.target.value }))}
              className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white"
              placeholder="Ej: El Bento del Día, Plato del Día"
            />
            <p className="text-[10px] text-gray-500 mt-1">Nombre mostrado en la carta, badge y QuickView.</p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              🏷️ Precio Promo Especial
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 text-xs font-semibold">$</span>
              <input
                type="number"
                value={bentoConfig.promo_price}
                onChange={e => setBentoConfig(prev => ({ ...prev, promo_price: Number(e.target.value) || 0 }))}
                className="w-full pl-7 pr-3 py-2 text-sm font-semibold rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white"
                placeholder="19500"
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Precio con descuento aplicado al plato del día.</p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              💵 Precio Estándar Referencial
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 text-xs font-semibold">$</span>
              <input
                type="number"
                value={bentoConfig.standard_price}
                onChange={e => setBentoConfig(prev => ({ ...prev, standard_price: Number(e.target.value) || 0 }))}
                className="w-full pl-7 pr-3 py-2 text-sm font-semibold rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white"
                placeholder="22000"
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Precio base referencial para calcular el ahorro o precio de fines de semana.</p>
          </div>
        </div>

        {/* Manual Override Option */}
        <div className="bg-amber-50/30 p-4 rounded-xl border border-amber-200/60 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
              <Icon icon="solar:tuning-bold" className="text-amber-600 text-sm" />
              <span>Forzar Especial Hoy (Sobrescribir Calendario)</span>
            </label>
            {bentoConfig.manual_override_product_id && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                Sobrescrito manualmente
              </span>
            )}
          </div>
          <select
            value={bentoConfig.manual_override_product_id || ''}
            onChange={e => setBentoConfig(prev => ({ ...prev, manual_override_product_id: e.target.value || null }))}
            className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-amber-300 bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          >
            <option value="">⚡ Automático (según el calendario del día de hoy)</option>
            {bentoProducts.map(p => (
              <option key={p.id} value={p.id}>
                ⭐ Forzar hoy: {p.category?.name ? `[${p.category.name}] ` : ''}{p.name}{!p.is_active ? ' ⚠️ (Pausado)' : ''} ({Number(p.price || 0).toLocaleString('es-CO')} COP)
              </option>
            ))}
          </select>
          <p className="text-[10px] text-gray-500">
            Si seleccionas un producto aquí, será inmediatamente el plato destacado a precio promo hoy sin importar qué día de la semana sea. Déjalo en "Automático" para seguir el cronograma habitual.
          </p>
        </div>

        {/* Weekly Schedule */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Icon icon="solar:calendar-mark-bold-duotone" className="text-amber-600 text-sm" />
              <span>Programación Semanal (Lunes a Domingo)</span>
            </h4>
            <span className="text-[10px] text-gray-400">
              Hoy es: {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][new Date().getDay()]}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {[
              { dayNum: 1, name: 'Lunes', desc: 'Inicio de semana' },
              { dayNum: 2, name: 'Martes', desc: 'Día 2' },
              { dayNum: 3, name: 'Miércoles', desc: 'Mitad de semana' },
              { dayNum: 4, name: 'Jueves', desc: 'Día 4' },
              { dayNum: 5, name: 'Viernes', desc: 'Cierre semanal' },
              { dayNum: 6, name: 'Sábado', desc: 'Fin de semana', isWeekend: true },
              { dayNum: 0, name: 'Domingo', desc: 'Fin de semana', isWeekend: true },
            ].map(d => {
              const isToday = new Date().getDay() === d.dayNum;
              const currentVal = bentoConfig.schedule?.[d.dayNum] || '';
              return (
                <div
                  key={d.dayNum}
                  className={`p-3 rounded-xl border transition-all ${
                    isToday
                      ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/20 shadow-2xs'
                      : 'bg-gray-50/50 border-gray-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-900">{d.name}</span>
                      {d.isWeekend && (
                        <span className="text-[9px] font-semibold text-gray-500 bg-gray-200/70 px-1.5 py-0.2 rounded">
                          Finde
                        </span>
                      )}
                    </div>
                    {isToday && (
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-200/70 px-1.5 py-0.5 rounded">
                        HOY 📍
                      </span>
                    )}
                  </div>
                  <select
                    value={currentVal}
                    onChange={e => {
                      const val = e.target.value || null;
                      setBentoConfig(prev => ({
                        ...prev,
                        schedule: {
                          ...prev.schedule,
                          [d.dayNum]: val
                        }
                      }));
                    }}
                    className={`w-full text-xs font-medium rounded-lg border py-1.5 px-2.5 transition-all bg-white cursor-pointer ${
                      currentVal ? 'border-amber-300 text-gray-900 font-semibold' : 'border-gray-200 text-gray-400'
                    }`}
                  >
                    <option value="">(Ninguno / Sin promoción)</option>
                    {bentoProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.category?.name ? `[${p.category.name}] ` : ''}{p.name}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card Footer & Save */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-200/70">
          <p className="text-[11px] text-gray-500">
            Presiona <strong>Guardar Especial del Día</strong> para sincronizar los cambios con la carta en vivo.
          </p>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSubmittingSettings}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Icon icon="solar:disk-bold-duotone" className="text-base" />
            <span>{isSubmittingSettings ? 'Guardando...' : 'Guardar Especial del Día'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
