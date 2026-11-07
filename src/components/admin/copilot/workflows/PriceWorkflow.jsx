import { useState } from 'react';

export default function PriceWorkflow({ product, isExecuting, onApprove, onCancel }) {
  const [price, setPrice] = useState(product?.price || '');

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-950">Editar precio</h3>
        <p className="mt-1 text-sm text-gray-600">
          El cambio se aplicará únicamente a {product.name}.
        </p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Precio actual</p>
        <p className="mt-1 text-lg font-bold">
          $ {Number(product.price || 0).toLocaleString('es-CO')}
        </p>
        <label className="mt-4 block text-xs font-bold text-gray-700">
          Nuevo precio
          <input
            type="number"
            min="1"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-emerald-500"
          />
        </label>
      </div>
      <button
        type="button"
        disabled={isExecuting || Number(price) <= 0 || Number(price) === Number(product.price)}
        onClick={() => onApprove(Number(price))}
        className="w-full rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white transition-all hover:bg-[#21542f] disabled:opacity-40"
      >
        {isExecuting ? 'Actualizando…' : 'Revisé el precio: aprobar cambio'}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-700"
      >
        Cancelar
      </button>
    </div>
  );
}
