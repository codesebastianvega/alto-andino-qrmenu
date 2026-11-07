import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { EMPTY_PRODUCT } from '../helpers/copilotHelpers';

export default function CatalogWorkflow({
  brandName,
  initialDraft,
  isExecuting,
  onApprove,
  onCancel,
}) {
  const [step, setStep] = useState('form');
  const [categoryName, setCategoryName] = useState(() => initialDraft?.category_name || '');
  const [products, setProducts] = useState(() => [
    {
      ...EMPTY_PRODUCT,
      name: initialDraft?.product_name || '',
      description: initialDraft?.description || '',
      price: initialDraft?.price > 0 ? String(initialDraft.price) : '',
      tags: Array.isArray(initialDraft?.tags) ? initialDraft.tags.join(', ') : '',
      requires_kitchen: initialDraft?.requires_kitchen !== false,
    },
  ]);

  const updateProduct = (index, field, value) =>
    setProducts((current) =>
      current.map((product, productIndex) =>
        productIndex === index ? { ...product, [field]: value } : product
      )
    );

  const removeProduct = (index) =>
    setProducts((current) => current.filter((_, productIndex) => productIndex !== index));

  const normalizedProducts = products.map((product) => ({
    ...product,
    price: Number(product.price),
    tags: product.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
  }));

  const canContinue =
    categoryName.trim() &&
    normalizedProducts.length > 0 &&
    normalizedProducts.every(
      (product) => product.name.trim() && product.description.trim() && product.price > 0
    );

  if (step === 'review') {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-800">
            Propuesta pendiente de aprobación
          </p>
          <p className="mt-2 text-sm text-amber-900">
            Aluna creará la categoría y vinculará sus productos a las sedes activas de {brandName}.
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Categoría</p>
          <p className="font-bold text-gray-950 text-base">{categoryName}</p>
          <div className="mt-4 space-y-3">
            {normalizedProducts.map((product, index) => (
              <div
                key={`${product.name}-${index}`}
                className="rounded-xl bg-gray-50 p-3 border border-gray-100"
              >
                <div className="flex justify-between gap-3">
                  <p className="text-sm font-bold text-gray-900">{product.name}</p>
                  <p className="text-sm font-bold text-emerald-700">
                    $ {product.price.toLocaleString('es-CO')} COP
                  </p>
                </div>
                <p className="mt-1 text-xs text-gray-600">{product.description}</p>
                <p className="mt-2 text-[10px] uppercase tracking-wide text-gray-400">
                  {product.tags.length ? product.tags.join(' · ') : 'Sin etiquetas'} ·{' '}
                  {product.requires_kitchen ? 'Requiere cocina (KDS)' : 'No requiere cocina'}
                </p>
              </div>
            ))}
          </div>
        </div>
        <button
          type="button"
          disabled={isExecuting}
          onClick={() =>
            onApprove({
              category_name: categoryName.trim(),
              products: normalizedProducts,
            })
          }
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white hover:bg-[#21542f] disabled:opacity-60 transition-all"
        >
          {isExecuting ? (
            <>
              <Loader2 size={17} className="animate-spin" /> Creando catálogo…
            </>
          ) : (
            'Aprobar y crear catálogo'
          )}
        </button>
        <button
          type="button"
          disabled={isExecuting}
          onClick={() => setStep('form')}
          className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-700"
        >
          Corregir propuesta
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-950">Crear catálogo inicial</h3>
        <p className="mt-1 text-sm text-gray-600">
          Completa los datos de tu menú. Puedes preparar hasta diez productos en una sola aprobación.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
        <label className="block text-xs font-bold text-gray-700">
          Nombre de la categoría principal *
        </label>
        <input
          value={categoryName}
          onChange={(event) => setCategoryName(event.target.value)}
          placeholder="Ej: Bento Boxes, Platos Fuertes, Bebidas Frías"
          className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        />
        <p className="mt-1 text-[11px] text-gray-400">
          Sección principal de tu menú QR donde se agruparán estos productos.
        </p>
      </div>

      <div className="space-y-3.5">
        {products.map((product, index) => (
          <div
            key={index}
            className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Producto #{index + 1}
              </p>
              {products.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeProduct(index)}
                  className="text-xs font-bold text-red-500 hover:text-red-700"
                >
                  Quitar producto
                </button>
              ) : null}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700">
                Nombre del plato o producto *
              </label>
              <input
                value={product.name}
                onChange={(event) => updateProduct(index, 'name', event.target.value)}
                placeholder="Ej: Bento Salmón Teriyaki"
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Nombre visible en el menú QR para los clientes.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700">
                Descripción para el menú QR *
              </label>
              <textarea
                value={product.description}
                onChange={(event) => updateProduct(index, 'description', event.target.value)}
                placeholder="Ej: Salmón fresco glaseado en salsa teriyaki casera, arroz al vapor, edamames y ensalada wakame..."
                rows={2}
                className="mt-1 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Describe ingredientes y sabor para despertar el apetito del comensal.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700">
                  Precio de venta al público (COP) *
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2 text-xs font-bold text-gray-400">$</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={product.price}
                    onChange={(event) => updateProduct(index, 'price', event.target.value)}
                    placeholder="Ej: 32000"
                    className="w-full rounded-xl border border-gray-200 pl-7 pr-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  Precio final en pesos colombianos con impuestos.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700">
                  Etiquetas / Badges (opcional)
                </label>
                <input
                  value={product.tags}
                  onChange={(event) => updateProduct(index, 'tags', event.target.value)}
                  placeholder="Ej: Recomendado, Sin Gluten, Nuevo"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Palabras clave separadas por comas para filtros.
                </p>
              </div>
            </div>

            <div className="pt-1 border-t border-gray-100">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={product.requires_kitchen}
                  onChange={(event) =>
                    updateProduct(index, 'requires_kitchen', event.target.checked)
                  }
                  className="rounded border-gray-300 text-emerald-700 focus:ring-emerald-500"
                />
                <span>Requiere preparación en cocina (KDS)</span>
              </label>
              <p className="ml-5 mt-0.5 text-[11px] text-gray-400">
                Si está marcado, los pedidos enviarán comanda a la pantalla de cocina o impresora.
              </p>
            </div>
          </div>
        ))}
      </div>

      {products.length < 10 ? (
        <button
          type="button"
          onClick={() => setProducts((current) => [...current, { ...EMPTY_PRODUCT }])}
          className="w-full rounded-xl border border-dashed border-emerald-300 py-3 text-xs font-bold text-emerald-700 hover:bg-emerald-50/50 transition-colors"
        >
          + Añadir otro producto
        </button>
      ) : null}

      <button
        type="button"
        disabled={!canContinue}
        onClick={() => setStep('review')}
        className="w-full rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white hover:bg-[#21542f] disabled:opacity-40 transition-all"
      >
        Revisar propuesta
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-700"
      >
        Volver al diagnóstico
      </button>
    </div>
  );
}
