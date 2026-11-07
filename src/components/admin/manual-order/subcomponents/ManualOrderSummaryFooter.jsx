import React from 'react';
import { Icon } from '@iconify-icon/react';
import { formatCOP } from '../../../../utils/money';

export default function ManualOrderSummaryFooter({
  orderItems = [],
  itemsSubtotal,
  fulfillmentType,
  activeDeliveryFee,
  grandTotal,
  printKitchenTicket,
  setPrintKitchenTicket,
  isSubmitting,
  entryFlow,
  handleCreateOrder
}) {
  const totalItemCount = orderItems.reduce((sum, i) => sum + (i.qty || 1), 0);

  return (
    <div className="pt-4 border-t border-neutral-200 mt-4 space-y-3">
      <div className="space-y-1 text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
        <div className="flex justify-between items-center">
          <span>Subtotal productos ({totalItemCount}):</span>
          <span className="font-bold text-neutral-800">{formatCOP(itemsSubtotal)}</span>
        </div>
        {fulfillmentType === 'delivery' && (
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1 font-medium text-emerald-800">
              <Icon icon="heroicons:truck" className="text-emerald-600" />
              Costo Domicilio:
            </span>
            <span className="font-black text-emerald-700">
              {activeDeliveryFee > 0 ? `+${formatCOP(activeDeliveryFee)}` : 'Gratis'}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between pt-1.5 border-t border-neutral-200">
          <span className="text-xs text-neutral-600 font-black uppercase tracking-wider">
            Total a cobrar:
          </span>
          <span className="text-xl font-black text-neutral-950">
            {formatCOP(grandTotal)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-neutral-600 cursor-pointer">
          <input
            type="checkbox"
            checked={printKitchenTicket}
            onChange={e => setPrintKitchenTicket(e.target.checked)}
            className="rounded text-neutral-900 focus:ring-0"
          />
          <span>Imprimir comanda térmica de cocina</span>
        </label>
      </div>

      <button
        type="button"
        disabled={orderItems.length === 0 || isSubmitting}
        onClick={handleCreateOrder}
        className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-98 disabled:opacity-50 ${
          entryFlow === 'completed'
            ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20'
            : 'bg-neutral-900 hover:bg-neutral-800 text-white'
        }`}
      >
        {isSubmitting ? (
          <>
            <Icon icon="heroicons:arrow-path" className="text-lg animate-spin" />
            <span>Guardando pedido...</span>
          </>
        ) : entryFlow === 'completed' ? (
          <>
            <Icon icon="heroicons:check-badge" className="text-lg text-emerald-200" />
            <span>Registrar en Ventas de Hoy e Inventario</span>
          </>
        ) : (
          <>
            <Icon icon="heroicons:paper-airplane" className="text-lg text-amber-400" />
            <span>Crear Pedido y Mandar a Cocina</span>
          </>
        )}
      </button>
    </div>
  );
}
