import { Icon } from '@iconify/react';
import { Loader2, Globe, ShieldCheck, Settings2 } from 'lucide-react';
import { PAYMENT_TYPES } from '../../../hooks/paymentmethods/useAdminPaymentMethodsData';

export default function LocationPaymentsPanel({
  selectedLocation,
  isChangingIsolation,
  onToggleIsolation,
  brandMethods,
  locationPayments,
  loadingLocPayments,
  onToggleLocStatus
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Isolation Control Banner */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              selectedLocation.independent_payments ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {selectedLocation.independent_payments ? <ShieldCheck size={20} /> : <Globe size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-gray-900 tracking-tight">
                  {selectedLocation.independent_payments ? 'Gestión Independiente de Pagos' : 'Sincronizado con la Marca'}
                </h4>
                <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                  Sede: {selectedLocation.name}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 max-w-2xl leading-relaxed">
                {selectedLocation.independent_payments 
                  ? 'Esta sede gestiona su propio catálogo de medios de pago. Los cambios globales de la marca no afectarán a este punto.'
                  : 'Esta sede utiliza automáticamente todos los medios de pago globales de la marca.'}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleIsolation}
          disabled={isChangingIsolation}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            selectedLocation.independent_payments 
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
              : 'bg-[#2f4131] hover:bg-[#253527] text-white shadow-xs'
          }`}
        >
          {isChangingIsolation ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            selectedLocation.independent_payments ? (
              <>
                <Globe size={14} />
                <span>Sincronizar con Marca</span>
              </>
            ) : (
              <>
                <ShieldCheck size={14} />
                <span>Gestionar por Sede</span>
              </>
            )
          )}
        </button>
      </div>

      {/* Methods Selection for Sede */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 transition-all ${
        !selectedLocation.independent_payments ? 'opacity-40 pointer-events-none' : ''
      }`}>
        {brandMethods.map((method) => {
          const lp = locationPayments.find(p => p.payment_method_id === method.id);
          const isActiveHere = lp ? lp.is_active : false;
          const typeInfo = PAYMENT_TYPES.find(t => t.id === method.type) || PAYMENT_TYPES[4];
          
          return (
            <div 
              key={method.id} 
              className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                isActiveHere 
                  ? 'border-gray-200/80 shadow-xs' 
                  : 'border-gray-200/50 opacity-60'
              }`}
            >
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
                      <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md mt-1 border ${typeInfo.light} ${typeInfo.text} ${typeInfo.border}`}>
                        {typeInfo.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-2">
                <button 
                  type="button"
                  onClick={() => onToggleLocStatus(method)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                    isActiveHere 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                      : 'bg-white border-gray-200 text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${isActiveHere ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                  <span>{isActiveHere ? 'Activo en Sede' : 'Inactivo'}</span>
                </button>

                {isActiveHere && !loadingLocPayments && (
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                    <Settings2 size={13} />
                    <span>Local</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hint for non-active isolation */}
      {!selectedLocation.independent_payments && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 mb-2 border border-gray-200">
            <Globe size={18} />
          </div>
          <h4 className="text-sm font-bold text-gray-900">Catálogo Sincronizado</h4>
          <p className="max-w-sm text-xs text-gray-500 mt-1">
            Para activar o desactivar medios específicos para esta sede, haz clic en <strong>Gestionar por Sede</strong> arriba.
          </p>
        </div>
      )}
    </div>
  );
}
