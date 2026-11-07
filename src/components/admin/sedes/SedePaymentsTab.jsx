import React from 'react';
import { Switch } from '../ui';
import { Icon } from '@iconify/react';

export default function SedePaymentsTab({
  form,
  setForm,
  brandPaymentMethods = [],
  locationPayments = [],
  togglePaymentMethod
}) {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      <div className={`p-5 rounded-2xl border transition-all ${
        form.independent_payments 
          ? 'bg-emerald-50/60 border-emerald-200' 
          : 'bg-gray-50/70 border-gray-200'
      }`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h4 className="text-sm font-bold text-gray-900 mb-0.5">Pagos Independientes</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              {form.independent_payments 
                ? "Esta sede gestiona sus propios métodos de pago (cuentas bancarias, datáfonos locales)." 
                : "Esta sede utilizará los métodos de pago configurados a nivel general de la marca."}
            </p>
          </div>
          <Switch 
            checked={form.independent_payments} 
            onChange={(val) => setForm({...form, independent_payments: val})} 
          />
        </div>
      </div>

      {form.independent_payments && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500">Métodos Disponibles</h5>
            <span className="text-[11px] text-gray-400">Activa los que aplican a esta sede</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {brandPaymentMethods.map(method => {
              const locPay = locationPayments.find(lp => lp.payment_method_id === method.id);
              const isEnabled = locPay?.is_active ?? false;

              return (
                <div 
                  key={method.id} 
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    isEnabled 
                      ? 'bg-white border-emerald-200 shadow-sm' 
                      : 'bg-gray-50/50 border-gray-200/80 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isEnabled ? 'bg-[#2f4131] text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Icon icon={method.type === 'transfer' ? 'solar:card-transfer-bold' : 'solar:wad-of-money-bold'} width="20" />
                    </div>
                    <div>
                      <h6 className="text-sm font-bold text-gray-900 leading-tight">{method.name}</h6>
                      <p className="text-xs text-gray-400">{method.type === 'transfer' ? 'Transferencia QR / Cuenta' : 'Efectivo / Datáfono'}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => togglePaymentMethod(method.id, !isEnabled)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      isEnabled 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                        : 'bg-white border-gray-200 text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Icon icon={isEnabled ? 'solar:check-circle-bold' : 'solar:add-circle-bold'} className="text-sm" />
                    {isEnabled ? 'Activo' : 'Activar'}
                  </button>
                </div>
              );
            })}

            {brandPaymentMethods.length === 0 && (
              <div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center">
                <Icon icon="solar:card-transfer-broken" width="36" className="text-gray-300 mb-2" />
                <p className="text-xs font-semibold text-gray-500">No hay métodos configurados en la marca.</p>
              </div>
            )}
          </div>
          
          {locationPayments.some(lp => lp.is_active && lp.payment_method?.type === 'transfer') && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Icon icon="solar:qr-code-bold" width="18" />
              </div>
              <div>
                <h6 className="text-xs font-bold text-amber-900 mb-0.5">Nota sobre QRs de Transferencia</h6>
                <p className="text-xs text-amber-800/80 leading-relaxed">
                  Pronto podrás subir una imagen de QR específica para esta sede. Por ahora se usará el número de cuenta registrado en la marca.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
