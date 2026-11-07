import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function ConsolidationWorkflow({
  categories = [],
  isExecuting,
  onApprove,
  onCancel,
}) {
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const source = categories.find((category) => category.id === sourceId);
  const target = categories.find((category) => category.id === targetId);

  if (reviewing && source && target) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-red-700">
            Cambio de riesgo alto
          </p>
          <p className="mt-2 text-sm text-red-900 leading-relaxed">
            Aluna moverá <strong>{source.product_count} producto(s)</strong> de{' '}
            <strong>{source.name}</strong> a <strong>{target.name}</strong> y desactivará la categoría
            repetida. Ningún plato será eliminado.
          </p>
        </div>
        <button
          type="button"
          disabled={isExecuting}
          onClick={() =>
            onApprove({
              source_category_id: source.id,
              target_category_id: target.id,
            })
          }
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60 transition-all"
        >
          {isExecuting ? (
            <>
              <Loader2 size={17} className="animate-spin" /> Consolidando…
            </>
          ) : (
            'Aprobar consolidación'
          )}
        </button>
        <button
          type="button"
          disabled={isExecuting}
          onClick={() => setReviewing(false)}
          className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-700"
        >
          Cambiar selección
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-950">Consolidar categorías duplicadas</h3>
        <p className="mt-1 text-sm text-gray-600">
          Unifica productos repetidos en una sola categoría oficial sin perder historial.
        </p>
      </div>

      <div className="space-y-3.5 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
        <div>
          <label className="block text-xs font-bold text-gray-700">
            Categoría duplicada que se desactivará *
          </label>
          <select
            value={sourceId}
            onChange={(event) => {
              setSourceId(event.target.value);
              if (event.target.value === targetId) setTargetId('');
            }}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-500"
          >
            <option value="">Seleccionar categoría a mover…</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.product_count} productos)
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-gray-400">
            Sus productos se trasladarán y la categoría quedará inactiva.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700">
            Categoría destino que se conservará *
          </label>
          <select
            value={targetId}
            onChange={(event) => setTargetId(event.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-500"
          >
            <option value="">Seleccionar categoría principal…</option>
            {categories
              .filter((category) => category.id !== sourceId)
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.product_count} productos)
                </option>
              ))}
          </select>
          <p className="mt-1 text-[11px] text-gray-400">
            Esta categoría permanecerá activa en el menú con todos los productos consolidados.
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled={!source || !target}
        onClick={() => setReviewing(true)}
        className="w-full rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white hover:bg-[#21542f] disabled:opacity-40 transition-all"
      >
        Revisar consolidación
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
