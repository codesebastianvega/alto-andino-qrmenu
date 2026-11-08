import React from 'react';
import { Icon } from '@iconify-icon/react';
import { printThermalDocument } from '../../../../utils/thermalPrint';

export default function POSSuccessModal({
  showSuccessScreen,
  wasAutoFinalized,
  order,
  customerName,
  lastTransactionChange,
  restaurantSettings,
  activeBrand,
  onClose,
  onSuccess
}) {
  if (!showSuccessScreen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200 space-y-5">
        {/* Icono de Éxito */}
        <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Icon icon="solar:check-circle-bold" className="text-4xl" />
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">
            {wasAutoFinalized ? '¡PAGO Y PEDIDO FINALIZADO!' : '¡PAGO REGISTRADO CON ÉXITO!'}
          </h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">
            PEDIDO #{order?.id?.slice(0, 4).toUpperCase()} • {customerName || order?.customer_name || 'MOSTRADOR'}
          </p>
        </div>

        {/* Tarjeta de Cambio (si hubo cambio) */}
        {lastTransactionChange > 0 && (
          <div className="bg-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-200/50">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-90">
              CAMBIO A ENTREGAR AL CLIENTE
            </p>
            <div className="text-4xl font-black tracking-tight">${lastTransactionChange.toLocaleString()}</div>
          </div>
        )}

        {/* Aviso de Mesa Liberada si fue finalizado */}
        {wasAutoFinalized && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs font-bold flex items-center justify-center gap-2">
            <Icon icon="solar:shop-2-bold" className="text-lg text-emerald-600" />
            <span>Mesa liberada • Pedido archivado como entregado</span>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => {
              onSuccess?.({ autoFinalized: wasAutoFinalized });
              onClose();
            }}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
          >
            <Icon icon="solar:check-read-bold" className="text-xl" />
            <span>VOLVER AL TABLERO DE PEDIDOS</span>
          </button>

          {restaurantSettings?.receipt_print_enabled !== false && (
            <button
              type="button"
              onClick={() =>
                printThermalDocument({
                  order,
                  type: 'receipt',
                  width: restaurantSettings?.thermal_paper_width || '80',
                  businessName: activeBrand?.name,
                  business: activeBrand
                })
              }
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-slate-200"
            >
              <Icon icon="solar:printer-bold" className="text-base" />
              <span>Imprimir Recibo de Caja</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
