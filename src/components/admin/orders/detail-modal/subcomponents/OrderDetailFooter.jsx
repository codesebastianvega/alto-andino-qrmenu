import React from 'react';
import { Icon } from '@iconify-icon/react';
import { toast } from '@/components/Toast';
import { printThermalDocument } from '@/utils/thermalPrint';

export default function OrderDetailFooter({
  selectedOrder,
  restaurantSettings,
  activeBrand,
  shareToWhatsApp,
  setIsMerging,
  setMergeSourceOrder,
  setSelectedOrder,
  isCancelling,
  setIsCancelling,
  cancellationReason,
  setCancellationReason,
  cancelOrder,
  setIsPOSModalOpen,
  updateOrderStatus,
  updatingStatus
}) {
  if (!selectedOrder) return null;

  return (
    <div className="shrink-0 border-t border-slate-200 bg-white p-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] md:px-8 md:py-4 z-20 flex flex-col gap-3 shadow-[0_-4px_25px_rgba(0,0,0,0.06)]">
      {/* Fila 1: Botones Secundarios Compactos */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => shareToWhatsApp?.(selectedOrder, 'summary')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 border border-slate-200"
          >
            <Icon icon="logos:whatsapp-icon" className="text-sm" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={() => {
              setIsMerging?.(true);
              setMergeSourceOrder?.(selectedOrder);
              setSelectedOrder?.(null);
              toast('Ahora selecciona el pedido destino', { icon: '🎯' });
            }}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 border border-emerald-200"
          >
            <Icon icon="heroicons:arrows-right-left" className="text-sm" />
            <span>Consolidar</span>
          </button>

          {restaurantSettings?.kitchen_print_enabled && (
            <button
              onClick={() =>
                printThermalDocument({
                  order: selectedOrder,
                  type: 'kitchen',
                  width: restaurantSettings?.thermal_paper_width || '80',
                  businessName: activeBrand?.name,
                  business: activeBrand
                })
              }
              className="px-3 py-2 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Icon icon="solar:printer-bold" className="text-sm" />
              <span>Comanda</span>
            </button>
          )}

          {restaurantSettings?.receipt_print_enabled !== false && (
            <button
              onClick={() =>
                printThermalDocument({
                  order: selectedOrder,
                  type: 'receipt',
                  width: restaurantSettings?.thermal_paper_width || '80',
                  businessName: activeBrand?.name,
                  business: activeBrand
                })
              }
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Icon icon="solar:bill-check-bold" className="text-sm" />
              <span>Recibo</span>
            </button>
          )}
        </div>

        {/* Cancelación */}
        <div>
          {!isCancelling ? (
            <button
              onClick={() => setIsCancelling?.(true)}
              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 border border-red-200"
            >
              <Icon icon="heroicons:trash" className="text-sm" />
              <span>Cancelar</span>
            </button>
          ) : (
            <div className="flex gap-1.5 items-center bg-red-50 p-1.5 rounded-xl border border-red-200 animate-in fade-in">
              <input
                type="text"
                placeholder="Motivo de cancelación..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason?.(e.target.value)}
                className="bg-white border border-red-200 text-base sm:text-xs font-medium p-1.5 px-2.5 rounded-lg focus:ring-1 focus:ring-red-400 w-full sm:w-48"
              />
              <button
                onClick={() => cancelOrder?.(selectedOrder.id)}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-black"
              >
                Confirmar
              </button>
              <button onClick={() => setIsCancelling?.(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <Icon icon="heroicons:x-mark" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fila 2: Acciones Operativas Primarias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Botón: Cobrar / POS Modal */}
        {selectedOrder.payment_status !== 'paid' && (
          <button
            onClick={() => setIsPOSModalOpen?.(true)}
            disabled={updatingStatus === selectedOrder.id}
            className={`py-3 px-4 rounded-xl font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 border ${
              (restaurantSettings?.payment_requirement_stage === 'pre_preparation' &&
                selectedOrder.status === 'new') ||
              (restaurantSettings?.payment_requirement_stage === 'pre_delivery' &&
                selectedOrder.status === 'ready')
                ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200/50'
                : 'bg-white border-emerald-600 text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <Icon icon="solar:round-transfer-horizontal-bold" className="text-xl" />
            <span>COBRAR / REGISTRAR PAGO</span>
          </button>
        )}

        {/* Botones de Estado */}
        {selectedOrder.status === 'new' && (
          <button
            onClick={() => updateOrderStatus?.(selectedOrder.id, 'preparing')}
            disabled={
              updatingStatus === selectedOrder.id ||
              (restaurantSettings?.payment_requirement_stage === 'pre_preparation' &&
                selectedOrder.payment_status !== 'paid')
            }
            className={`py-3 px-4 rounded-xl font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
              restaurantSettings?.payment_requirement_stage === 'pre_preparation' &&
              selectedOrder.payment_status !== 'paid'
                ? 'bg-neutral-200 text-neutral-400 border border-neutral-300 cursor-not-allowed grayscale'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200/50'
            } ${selectedOrder.payment_status === 'paid' ? 'sm:col-span-2' : ''}`}
          >
            <Icon icon="solar:fire-bold" className="text-xl" />
            <span>
              {restaurantSettings?.payment_requirement_stage === 'pre_preparation' &&
              selectedOrder.payment_status !== 'paid'
                ? 'PAGO REQUERIDO PARA COCINA'
                : 'ENVIAR A COCINA'}
            </span>
          </button>
        )}

        {selectedOrder.status === 'preparing' && (
          <button
            onClick={() => updateOrderStatus?.(selectedOrder.id, 'ready')}
            disabled={updatingStatus === selectedOrder.id}
            className={`py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-sm shadow-md shadow-amber-200/50 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
              selectedOrder.payment_status === 'paid' ? 'sm:col-span-2' : ''
            }`}
          >
            <Icon icon="solar:check-circle-bold" className="text-xl" />
            <span>LISTO PARA ENTREGA</span>
          </button>
        )}

        {selectedOrder.status === 'ready' && (
          <>
            {selectedOrder.fulfillment_type === 'dine_in' ? (
              <button
                onClick={() => updateOrderStatus?.(selectedOrder.id, 'on_table')}
                disabled={updatingStatus === selectedOrder.id}
                className={`py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-sm shadow-md shadow-purple-200/50 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
                  selectedOrder.payment_status === 'paid' ? 'sm:col-span-2' : ''
                }`}
              >
                <Icon icon="solar:shop-2-bold" className="text-xl" />
                <span>SERVIR EN MESA</span>
              </button>
            ) : (
              <button
                onClick={() => updateOrderStatus?.(selectedOrder.id, 'on_the_way')}
                disabled={updatingStatus === selectedOrder.id}
                className={`py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-sm shadow-md shadow-purple-200/50 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
                  selectedOrder.payment_status === 'paid' ? 'sm:col-span-2' : ''
                }`}
              >
                <Icon icon="solar:delivery-bold" className="text-xl" />
                <span>
                  {selectedOrder.fulfillment_type === 'delivery' ? 'ENVIAR DOMICILIO' : 'LISTO PARA RECOGER'}
                </span>
              </button>
            )}
          </>
        )}

        {(selectedOrder.status === 'on_table' || selectedOrder.status === 'on_the_way') && (
          <button
            onClick={() => updateOrderStatus?.(selectedOrder.id, 'delivered')}
            disabled={
              updatingStatus === selectedOrder.id ||
              (restaurantSettings?.payment_requirement_stage === 'pre_delivery' &&
                selectedOrder.payment_status !== 'paid')
            }
            className={`py-3 px-4 rounded-xl font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
              restaurantSettings?.payment_requirement_stage === 'pre_delivery' &&
              selectedOrder.payment_status !== 'paid'
                ? 'bg-neutral-200 text-neutral-400 border border-neutral-300 cursor-not-allowed grayscale'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200/50'
            } ${selectedOrder.payment_status === 'paid' ? 'sm:col-span-2' : ''}`}
          >
            <Icon icon="solar:check-read-bold" className="text-xl" />
            <span>
              {restaurantSettings?.payment_requirement_stage === 'pre_delivery' &&
              selectedOrder.payment_status !== 'paid'
                ? 'PAGO REQUERIDO PARA FINALIZAR'
                : selectedOrder.status === 'on_the_way'
                ? 'PEDIDO ENTREGADO'
                : 'FINALIZAR PEDIDO'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
