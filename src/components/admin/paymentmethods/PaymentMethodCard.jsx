import { Icon } from '@iconify/react';
import { Trash2 } from 'lucide-react';
import { PAYMENT_TYPES } from '../../../hooks/paymentmethods/useAdminPaymentMethodsData';

export function PaymentMethodCard({ method, onEdit, onDelete, onToggle }) {
  const typeInfo = PAYMENT_TYPES.find(t => t.id === method.type) || PAYMENT_TYPES[4];
  
  return (
    <div className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
      method.is_active 
        ? 'border-gray-200/80 hover:border-gray-300 shadow-xs hover:shadow-sm' 
        : 'border-gray-200/50 opacity-60'
    }`}>
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs ${typeInfo.bg}`}>
              <Icon icon={method.icon || 'solar:bill-list-bold'} className="text-xl" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-gray-900 tracking-tight truncate leading-snug">
                {method.name}
              </h4>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md border ${typeInfo.light} ${typeInfo.text} ${typeInfo.border}`}>
                  {typeInfo.label}
                </span>
                <span className="text-[10px] font-mono text-gray-400">
                  #{method.id.slice(0, 6)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button 
              type="button"
              onClick={onEdit} 
              className="p-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-900 border border-gray-200/80 shadow-2xs transition-colors cursor-pointer"
              title="Editar medio"
            >
              <Icon icon="solar:pen-new-square-linear" className="text-sm" />
            </button>
            <button 
              type="button"
              onClick={onDelete} 
              className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-gray-400 hover:text-rose-600 border border-gray-200/80 shadow-2xs transition-colors cursor-pointer"
              title="Eliminar medio"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Account Details Box */}
        {method.details && (method.details.account_number || method.details.bre_b_key) && (
          <div className="mt-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-xs">
            {method.details.bank_name && (
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Banco / Entidad:</span>
                <span className="font-bold text-slate-800">{method.details.bank_name}</span>
              </div>
            )}
            {method.details.account_number && (
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">{method.details.account_type || 'Cuenta'}:</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  {method.details.account_number}
                </span>
              </div>
            )}
            {method.details.bre_b_key && (
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <span>⚡ Llave Bre-B:</span>
                </span>
                <span className="font-mono font-bold text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  {method.details.bre_b_key}
                </span>
              </div>
            )}
            {method.details.holder_name && (
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 border-t border-slate-200/50">
                <span>Titular: {method.details.holder_name}</span>
                {method.details.holder_id && <span>NIT/CC: {method.details.holder_id}</span>}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-5 py-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-2">
        <button 
          type="button"
          onClick={onToggle}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
            method.is_active 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
              : 'bg-white border-gray-200 text-gray-500 hover:text-gray-800'
          }`}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${method.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          <span>{method.is_active ? 'Activo Global' : 'Inactivo'}</span>
        </button>

        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          {method.is_active ? 'Visible en checkout' : 'Oculto'}
        </span>
      </div>
    </div>
  );
}

export function EmptyState({ onAdd }) {
  return (
    <div className="col-span-full bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 mb-4 border border-gray-200">
        <Icon icon="solar:wallet-bold" className="text-2xl" />
      </div>
      <h4 className="text-base font-bold text-gray-900 tracking-tight">Sin medios de pago configurados</h4>
      <p className="text-xs text-gray-500 mt-1 max-w-sm">
        Registra tus opciones de cobro (Efectivo, Transferencia Nequi/Daviplata, Datáfono) para que los clientes puedan pagar.
      </p>
      <button 
        type="button"
        onClick={onAdd} 
        className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
      >
        <Icon icon="solar:add-circle-bold" className="text-base" />
        <span>Añadir Medio de Pago</span>
      </button>
    </div>
  );
}
