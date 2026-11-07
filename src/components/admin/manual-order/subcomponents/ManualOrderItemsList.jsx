import React from 'react';
import { Icon } from '@iconify-icon/react';
import { formatCOP } from '../../../../utils/money';

export default function ManualOrderItemsList({
  orderItems = [],
  setOrderItems,
  handleUpdateItemQty,
  handleEditItem,
  handleRemoveItem
}) {
  return (
    <div className="space-y-2">
      <span className="text-[11px] font-black uppercase tracking-wider text-neutral-500 flex items-center justify-between">
        <span>Platos en este pedido ({orderItems.length})</span>
        {orderItems.length > 0 && (
          <button
            type="button"
            onClick={() => setOrderItems([])}
            className="text-[10px] text-red-500 hover:underline font-bold cursor-pointer"
          >
            Vaciar
          </button>
        )}
      </span>

      {orderItems.length === 0 ? (
        <div className="p-6 rounded-2xl border-2 border-dashed border-neutral-200 text-center text-neutral-400 text-xs">
          Toca cualquier plato a la izquierda para agregarlo.
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[22vh] overflow-y-auto pr-1">
          {orderItems.map((item, idx) => (
            <div
              key={idx}
              className="p-2.5 bg-white rounded-xl border border-neutral-200 flex items-start justify-between gap-2 shadow-xs"
            >
              <div className="flex-1">
                <p className="text-xs font-bold text-neutral-900 leading-snug">
                  {item.product.name.replace(/\s*\(Especial del Día\)/i, '')}
                </p>

                {/* Modifiers List */}
                {Object.entries(item.options || {}).length > 0 && (
                  <div className="mt-0.5 space-y-0.5 text-[10px] text-neutral-500">
                    {Object.entries(item.options).map(([k, v]) => (
                      <p key={k}>
                        <span className="text-neutral-400">{k}:</span>{' '}
                        <strong className="text-neutral-700">{Array.isArray(v) ? v.join(', ') : v}</strong>
                      </p>
                    ))}
                  </div>
                )}

                {item.notes && (
                  <p className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md mt-1 border border-amber-200/50">
                    📝 {item.notes}
                  </p>
                )}

                <p className="text-xs font-black text-amber-700 mt-1">
                  {formatCOP(item.unitPrice * item.qty)}
                </p>
              </div>

              {/* Qty Controls & Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleUpdateItemQty(idx, -1)}
                  className="w-6 h-6 rounded-md bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-xs font-bold cursor-pointer"
                >
                  -
                </button>
                <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                <button
                  type="button"
                  onClick={() => handleUpdateItemQty(idx, 1)}
                  className="w-6 h-6 rounded-md bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-xs font-bold cursor-pointer"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => handleEditItem(idx)}
                  className="w-6 h-6 rounded-md text-amber-700 hover:bg-amber-50 flex items-center justify-center ml-0.5 cursor-pointer"
                  title="Editar modificadores"
                >
                  <Icon icon="heroicons:pencil-square" className="text-sm" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  className="w-6 h-6 rounded-md text-red-500 hover:bg-red-50 flex items-center justify-center ml-0.5 cursor-pointer"
                >
                  <Icon icon="heroicons:trash" className="text-sm" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
