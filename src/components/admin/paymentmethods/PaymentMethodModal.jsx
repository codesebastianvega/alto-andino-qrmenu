import { createPortal } from 'react-dom';
import { FormField, TextInput, Switch } from '../ui';
import { Icon } from '@iconify/react';
import { Loader2 } from 'lucide-react';
import { PAYMENT_TYPES } from '../../../hooks/paymentmethods/useAdminPaymentMethodsData';

export default function PaymentMethodModal({
  isOpen,
  onClose,
  editingMethod,
  formData,
  setFormData,
  onTypeChange,
  onSubmit,
  isSaving
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[9999] animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-gray-100 bg-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100/60">
              <Icon icon="solar:card-2-bold" className="text-xl" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight">
                {editingMethod ? 'Editar Medio de Pago' : 'Nuevo Medio de Pago'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Configura la categoría y nombre para tus comensales.</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center cursor-pointer"
          >
            <Icon icon="solar:close-circle-bold" className="text-xl" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
            {/* Type Selection */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                Categoría de Transacción *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PAYMENT_TYPES.map((type) => {
                  const isSelected = formData.type === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => onTypeChange(type.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all text-xs font-semibold cursor-pointer ${
                        isSelected
                          ? 'bg-[#2f4131] border-[#2f4131] text-white shadow-xs'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon icon={type.icon} className="text-base shrink-0" />
                      <span className="truncate">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name */}
            <FormField label="Nombre del Medio de Pago *">
              <TextInput
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej. Transferencia Nequi 312..."
                required
              />
            </FormField>

            {/* Configuración Bancaria / Nequi / Bre-B */}
            {(formData.type === 'transfer' || formData.type === 'digital_wallet') && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Plantillas Rápidas
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Nequi', icon: 'solar:wallet-bold', type: 'digital_wallet', placeholder: '310 123 4567' },
                      { label: 'Daviplata', icon: 'solar:wallet-bold', type: 'digital_wallet', placeholder: '310 123 4567' },
                      { label: 'Bancolombia', icon: 'solar:card-2-bold', type: 'transfer', placeholder: 'Cuenta Ahorros 123-456789-01' },
                      { label: 'Llave Bre-B', icon: 'solar:flash-bold', type: 'transfer', placeholder: 'Llave Celular / NIT / Alias' },
                      { label: 'Davivienda', icon: 'solar:card-2-bold', type: 'transfer', placeholder: 'Cuenta Ahorros' }
                    ].map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            name: prev.name && prev.name !== 'Transferencia' && prev.name !== 'Billetera Digital' ? prev.name : `Transferencia ${preset.label}`,
                            type: preset.type,
                            details: {
                              ...prev.details,
                              bank_name: preset.label,
                              account_type: preset.type === 'digital_wallet' ? 'Billetera Digital' : 'Cuenta de Ahorros'
                            }
                          }));
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Banco / Plataforma *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Nequi, Bancolombia, Bre-B..."
                      value={formData.details?.bank_name || ''}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        details: { ...prev.details, bank_name: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tipo de Cuenta
                    </label>
                    <select
                      value={formData.details?.account_type || 'Ahorros'}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        details: { ...prev.details, account_type: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Billetera Digital">Billetera Digital (Nequi / Daviplata)</option>
                      <option value="Ahorros">Cuenta de Ahorros</option>
                      <option value="Corriente">Cuenta Corriente</option>
                      <option value="Llave Bre-B">Llave Bre-B Interoperable</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Número de Cuenta o Teléfono *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. 3101234567 o 123-456789-01"
                      value={formData.details?.account_number || ''}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        details: { ...prev.details, account_number: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Llave Bre-B (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. 3101234567 o aluna@breb"
                      value={formData.details?.bre_b_key || ''}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        details: { ...prev.details, bre_b_key: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nombre del Titular
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Nombre del restaurante o dueño"
                      value={formData.details?.holder_name || ''}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        details: { ...prev.details, holder_name: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      NIT / Documento Titular
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. 901.234.567-8"
                      value={formData.details?.holder_id || ''}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        details: { ...prev.details, holder_id: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Instrucciones para el Cliente (Visible en Checkout)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Enviar comprobante al WhatsApp indicando el código de pedido."
                    value={formData.details?.instructions || ''}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      details: { ...prev.details, instructions: e.target.value }
                    }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Status Toggle */}
            <div 
              onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                formData.is_active 
                  ? 'bg-emerald-50/60 border-emerald-200/80 shadow-2xs' 
                  : 'bg-white border-gray-200/80 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  formData.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Icon icon={formData.is_active ? "solar:shield-check-bold" : "solar:shield-minus-bold"} className="text-lg" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 leading-tight">Disponibilidad Inmediata</p>
                  <p className="text-[11px] text-gray-500">Visible para clientes al finalizar la orden</p>
                </div>
              </div>
              <Switch 
                checked={formData.is_active} 
                onChange={(val) => setFormData({ ...formData, is_active: val })} 
              />
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex items-center justify-end gap-2.5 rounded-b-2xl shrink-0">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSaving} 
              className="px-5 py-2 rounded-xl bg-[#2f4131] hover:bg-[#253527] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Icon icon="solar:diskette-bold-duotone" className="text-base" />
                  <span>{editingMethod ? 'Guardar Cambios' : 'Crear Medio'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
