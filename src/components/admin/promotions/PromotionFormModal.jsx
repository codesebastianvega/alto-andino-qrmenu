import { Icon } from '@iconify-icon/react';

export default function PromotionFormModal({
  isOpen,
  onClose,
  editingPromo,
  formData,
  setFormData,
  onSubmit,
  isSaving
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-neutral-200 flex flex-col">
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏷️</span>
            <h3 className="text-base sm:text-lg font-black text-neutral-900">
              {editingPromo ? 'Editar Campaña' : 'Nueva Campaña Promocional'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg cursor-pointer"
          >
            <Icon icon="heroicons:x-mark" className="text-xl" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
          {/* Nombre de la campaña */}
          <div>
            <label className="block font-bold text-neutral-700 mb-1">Nombre de la Campaña *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Semana de Apertura: Domicilio Gratis"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            />
          </div>

          {/* Tipo de Campaña */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'free_delivery', target: 'delivery' })}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                formData.type === 'free_delivery'
                  ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500/30'
                  : 'border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              <p className="font-bold text-neutral-900 flex items-center gap-1.5">
                <span>🚚</span> Domicilio Gratis
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">$0 COP en envíos</p>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'percentage_discount' })}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                formData.type === 'percentage_discount'
                  ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500/30'
                  : 'border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              <p className="font-bold text-neutral-900 flex items-center gap-1.5">
                <span>%</span> Porcentaje OFF
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">Ej: 10%, 15%, 20%</p>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'fixed_discount' })}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                formData.type === 'fixed_discount'
                  ? 'border-purple-500 bg-purple-50/60 ring-1 ring-purple-500/30'
                  : 'border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              <p className="font-bold text-neutral-900 flex items-center gap-1.5">
                <span>💲</span> Descuento Fijo
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">Monto en pesos (COP)</p>
            </button>
          </div>

          {/* Valor del Descuento y Monto Mínimo */}
          <div className={`grid grid-cols-1 ${formData.type !== 'free_delivery' ? 'sm:grid-cols-2' : ''} gap-3`}>
            {formData.type !== 'free_delivery' && (
              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  {formData.type === 'percentage_discount' ? 'Porcentaje de Descuento (%)' : 'Valor del Descuento (COP)'}
                </label>
                <input
                  type="number"
                  min="1"
                  max={formData.type === 'percentage_discount' ? 100 : 500000}
                  value={formData.value}
                  onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-emerald-500/20 font-medium"
                />
              </div>
            )}

            <div>
              <label className="block font-bold text-neutral-700 mb-1">Monto Mínimo de Pedido (COP)</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.min_order_amount}
                onChange={e => setFormData({ ...formData, min_order_amount: Number(e.target.value) })}
                placeholder="0 = Sin mínimo"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-emerald-500/20 font-medium"
              />
            </div>
          </div>

          {/* Código de Cupón Opcional */}
          <div>
            <label className="block font-bold text-neutral-700 mb-1">
              Código de Cupón (Opcional)
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="Ej: BOKUAPERTURA (dejar vacío si aplica automáticamente)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-emerald-500/20 font-mono font-bold uppercase"
            />
            <p className="text-[11px] text-neutral-400 mt-1">
              Si no ingresas código, la promoción se aplicará automáticamente a todos los pedidos que califiquen.
            </p>
          </div>

          {/* Vigencia (Fechas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-neutral-700 mb-1">Fecha de Inicio *</label>
              <input
                type="datetime-local"
                required
                value={formData.start_date}
                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-emerald-500/20 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-neutral-700 mb-1">Fecha de Finalización</label>
              <input
                type="datetime-local"
                value={formData.end_date}
                onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-emerald-500/20 font-medium"
              />
            </div>
          </div>

          {/* Banner Anuncio en Menú */}
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-neutral-900 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.show_banner}
                  onChange={e => setFormData({ ...formData, show_banner: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-neutral-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span>Mostrar Banner Anuncio en la Carta del Cliente</span>
              </label>
            </div>

            {formData.show_banner && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                    Mensaje del Banner
                  </label>
                  <input
                    type="text"
                    value={formData.banner_message}
                    onChange={e => setFormData({ ...formData, banner_message: e.target.value })}
                    placeholder="🎉 ¡Semana de Apertura! Domicilio 100% GRATIS en todos tus pedidos"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white font-medium"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 mb-1">Color Fondo</label>
                    <input
                      type="color"
                      value={formData.banner_bg_color}
                      onChange={e => setFormData({ ...formData, banner_bg_color: e.target.value })}
                      className="w-10 h-10 p-0.5 rounded-lg border border-neutral-300 cursor-pointer bg-white"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-neutral-600 mb-1">Previsualización</label>
                    <div
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-center truncate shadow-xs"
                      style={{ backgroundColor: formData.banner_bg_color, color: formData.banner_text_color }}
                    >
                      {formData.banner_message || 'Tu anuncio aquí'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botones Guardar / Cancelar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-[#2f4131] hover:bg-[#243326] text-white font-bold flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Icon icon="line-md:loading-loop" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar y Aplicar</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
