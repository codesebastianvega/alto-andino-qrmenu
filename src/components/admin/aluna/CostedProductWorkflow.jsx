import { useMemo, useState } from 'react';
import { Loader2, Plus, Trash2, Sparkles, AlertCircle } from 'lucide-react';

const EMPTY_INGREDIENT = { name: '', purchase_price: '', purchase_quantity: '', purchase_unit: 'g', usage_unit: 'g', recipe_quantity: '' };

export default function CostedProductWorkflow({ brandName, initialDraft = {}, isExecuting, onApprove, onApproveQuick, onCancel }) {
  const existingProduct = initialDraft.existing_product || null;
  const extractedIngredients = Array.isArray(initialDraft.recipe_draft?.ingredients) && initialDraft.recipe_draft.ingredients.length
    ? initialDraft.recipe_draft.ingredients.map((ingredient) => ({ ...EMPTY_INGREDIENT, ...ingredient }))
    : [{ ...EMPTY_INGREDIENT }];
  const [step, setStep] = useState('form');
  const [categoryName, setCategoryName] = useState(existingProduct?.category_name || initialDraft.category_name || '');
  const [product, setProduct] = useState({ name: existingProduct?.name || initialDraft.product_name || '', description: existingProduct?.description || initialDraft.description || '', price: existingProduct?.price || initialDraft.price || '', tags: Array.isArray(initialDraft.tags) ? initialDraft.tags.join(', ') : '' });
  const [servings, setServings] = useState(Number(initialDraft.recipe_draft?.servings) > 0 ? Number(initialDraft.recipe_draft.servings) : 1);
  const [ingredients, setIngredients] = useState(extractedIngredients);
  const updateIngredient = (index, field, value) => setIngredients((current) => current.map((ingredient, currentIndex) => currentIndex === index ? { ...ingredient, [field]: value } : ingredient));
  const calculations = useMemo(() => {
    const total = ingredients.reduce((sum, ingredient) => {
      const purchasePrice = Number(ingredient.purchase_price) || 0;
      const purchaseQuantity = Number(ingredient.purchase_quantity) || 0;
      const recipeQuantity = Number(ingredient.recipe_quantity) || 0;
      return sum + (purchaseQuantity > 0 ? purchasePrice / purchaseQuantity * recipeQuantity : 0);
    }, 0);
    const perPortion = servings > 0 ? total / servings : 0;
    const price = Number(product.price) || 0;
    return { total, perPortion, margin: price > 0 ? (price - perPortion) / price * 100 : 0 };
  }, [ingredients, product.price, servings]);
  const isComplete = categoryName.trim() && product.name.trim() && product.description.trim() && Number(product.price) > 0 && servings > 0 && ingredients.length > 0 && ingredients.every((ingredient) => ingredient.name.trim() && Number(ingredient.purchase_price) > 0 && Number(ingredient.purchase_quantity) > 0 && Number(ingredient.recipe_quantity) > 0);
  const canCreateQuick = categoryName.trim() && product.name.trim() && product.description.trim() && Number(product.price) > 0;
  const proposal = {
    category_name: categoryName.trim(),
    product: { existing_product_id: existingProduct?.id || null, name: product.name.trim(), description: product.description.trim(), price: Number(product.price), tags: product.tags.split(',').map((tag) => tag.trim()).filter(Boolean), requires_kitchen: true },
    recipe: { name: `Receta ${product.name.trim()}`, yield_quantity: servings, yield_unit: 'porciones', servings },
    ingredients: ingredients.map((ingredient) => ({ ...ingredient, name: ingredient.name.trim(), purchase_price: Number(ingredient.purchase_price), purchase_quantity: Number(ingredient.purchase_quantity), recipe_quantity: Number(ingredient.recipe_quantity) })),
  };
  const quickProposal = {
    category_name: categoryName.trim(),
    products: [{
      name: product.name.trim(),
      description: product.description.trim(),
      price: Number(product.price),
      tags: product.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      requires_kitchen: true,
    }],
  };

  if (step === 'quick_review') return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-800">Crear ahora y costear después</p>
        <p className="mt-2 text-sm leading-relaxed text-blue-900">Aluna creará <strong>{product.name}</strong> en {brandName} sin ingredientes ni receta técnica. El producto podrá venderse en la carta de inmediato y quedará pendiente completar su costeo real.</p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold text-gray-950 text-base">{product.name}</p>
            <p className="text-xs text-gray-500">Categoría: {categoryName}</p>
          </div>
          <span className="font-bold text-emerald-700 text-base">$ {Number(product.price).toLocaleString('es-CO')} COP</span>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed border-t border-gray-100 pt-2">{product.description}</p>
        <p className="mt-2 text-[11px] font-semibold text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
          Nota: No descontará stock de insumos hasta que le vincules una receta.
        </p>
      </div>
      <button type="button" disabled={isExecuting} onClick={() => onApproveQuick(quickProposal)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white hover:bg-[#21542f] disabled:opacity-60 transition-all">
        {isExecuting ? <><Loader2 size={17} className="animate-spin" /> Creando producto…</> : 'Aprobar y crear sin receta'}
      </button>
      <button type="button" disabled={isExecuting} onClick={() => setStep('form')} className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-700">
        Volver y completar costos
      </button>
    </div>
  );

  if (step === 'review') return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Propuesta gastronómica con costeo</p>
        <p className="mt-2 text-sm text-amber-900">Aluna vinculará o creará los insumos de inventario, registrará la receta técnica y creará el producto en {brandName}.</p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold text-gray-950 text-base">{product.name}</p>
            <p className="text-xs text-gray-500">{categoryName} · Rendimiento: {servings} porción(es)</p>
          </div>
          <span className="font-bold text-emerald-700 text-base">$ {Number(product.price).toLocaleString('es-CO')} COP</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-gray-50 p-2.5 border border-gray-100">
            <p className="text-[10px] uppercase font-bold text-gray-500">Costo / porción</p>
            <p className="font-bold text-gray-900 text-sm mt-0.5">$ {Math.round(calculations.perPortion).toLocaleString('es-CO')}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-2.5 border border-gray-100">
            <p className="text-[10px] uppercase font-bold text-gray-500">Precio de venta</p>
            <p className="font-bold text-gray-900 text-sm mt-0.5">$ {Number(product.price).toLocaleString('es-CO')}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-2.5 border border-emerald-100">
            <p className="text-[10px] uppercase font-bold text-emerald-700">Margen bruto</p>
            <p className="font-bold text-emerald-800 text-sm mt-0.5">{calculations.margin.toFixed(1)}%</p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs font-bold text-gray-700 mb-2">Desglose de insumos en la receta:</p>
          <div className="space-y-1.5">
            {ingredients.map((ingredient, index) => {
              const pPrice = Number(ingredient.purchase_price) || 0;
              const pQty = Number(ingredient.purchase_quantity) || 0;
              const rQty = Number(ingredient.recipe_quantity) || 0;
              const portionCost = pQty > 0 ? (pPrice / pQty) * rQty : 0;
              return (
                <div key={`${ingredient.name}-${index}`} className="flex justify-between items-center text-xs bg-gray-50/70 p-2 rounded-lg">
                  <span className="font-medium text-gray-800">{ingredient.name} <span className="text-gray-400">({ingredient.recipe_quantity} {ingredient.usage_unit})</span></span>
                  <span className="font-semibold text-emerald-800">$ {Math.round(portionCost).toLocaleString('es-CO')}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <button type="button" disabled={isExecuting} onClick={() => onApprove(proposal)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white hover:bg-[#21542f] disabled:opacity-60 transition-all">
        {isExecuting ? <><Loader2 size={17} className="animate-spin" /> Creando estructura gastronómica…</> : 'Aprobar ingredientes, receta y producto'}
      </button>
      <button type="button" disabled={isExecuting} onClick={() => setStep('form')} className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-700">
        Corregir datos
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-950">
          {existingProduct ? 'Crear y vincular receta' : 'Producto con costo real de inventario'}
        </h3>
        <p className="mt-1 text-xs text-gray-600 leading-relaxed">
          Aluna reutiliza los insumos que ya existen en tu sede y solo crea los que falten. Completa cada campo con claridad.
        </p>
      </div>

      {existingProduct ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Producto de la carta seleccionado</p>
          <p className="mt-1 font-bold text-emerald-950 text-sm">{existingProduct.name}</p>
          <p className="mt-0.5 text-xs text-emerald-700">La receta se vinculará a este producto existente; no se creará un duplicado.</p>
        </div>
      ) : null}

      {initialDraft.recipe_draft?.quantities_are_estimates ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 flex items-start gap-2.5 text-xs leading-relaxed text-amber-900">
          <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold text-amber-950">Cantidades sugeridas por Aluna: </strong>
            <span>Revísalas y ajústalas con tus costos y compras reales antes de aprobar.</span>
          </div>
        </div>
      ) : null}

      {/* SECCIÓN 1: Ficha del Producto */}
      <div className="space-y-3.5 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
        <div className="border-b border-gray-100 pb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">1. Datos del Producto para la Carta</h4>
          <p className="text-[11px] text-gray-500">Información visible para los comensales en el menú QR.</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700">Categoría en el menú *</label>
          <input 
            disabled={Boolean(existingProduct)} 
            value={categoryName} 
            onChange={(event) => setCategoryName(event.target.value)} 
            placeholder="Ej: Bebidas Frías, Fuertes, Postres" 
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
          />
          <p className="mt-1 text-[11px] text-gray-400">Sección donde se exhibirá el producto en el menú digital.</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700">Nombre del producto *</label>
          <input 
            disabled={Boolean(existingProduct)} 
            value={product.name} 
            onChange={(event) => setProduct((current) => ({ ...current, name: event.target.value }))} 
            placeholder="Ej: Soda de Frutos Rojos 16oz" 
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
          />
          <p className="mt-1 text-[11px] text-gray-400">Nombre atractivo y claro que verá el cliente.</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700">Descripción para el menú QR *</label>
          <textarea 
            disabled={Boolean(existingProduct)} 
            value={product.description} 
            onChange={(event) => setProduct((current) => ({ ...current, description: event.target.value }))} 
            placeholder="Ej: Refrescante soda artesanal con arándanos y fresas maceradas, hielo y un toque de hierbabuena fresca..." 
            rows={2} 
            className="mt-1 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
          />
          <p className="mt-1 text-[11px] text-gray-400">Resalta los ingredientes clave y el sabor para tentar al comensal.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700">Precio de venta al público (COP) *</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2 text-xs font-bold text-gray-400">$</span>
              <input 
                type="number" 
                min="1" 
                value={product.price} 
                onChange={(event) => setProduct((current) => ({ ...current, price: event.target.value }))} 
                placeholder="Ej: 14000" 
                className="w-full rounded-xl border border-gray-200 pl-7 pr-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
              />
            </div>
            <p className="mt-1 text-[11px] text-gray-400">Valor en pesos colombianos con impuestos incluidos.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700">Rendimiento de la receta (Porciones) *</label>
            <input 
              type="number" 
              min="1" 
              value={servings} 
              onChange={(event) => setServings(Number(event.target.value))} 
              placeholder="Ej: 1" 
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
            />
            <p className="mt-1 text-[11px] text-gray-400">Porciones individuales que rinde la preparación base.</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700">Etiquetas o badges (opcional)</label>
          <input 
            value={product.tags} 
            onChange={(event) => setProduct((current) => ({ ...current, tags: event.target.value }))} 
            placeholder="Ej: Recomendado, Frutas Naturales, Sin Azúcar" 
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
          />
          <p className="mt-1 text-[11px] text-gray-400">Separadas por comas para filtros y destacados en la carta.</p>
        </div>
      </div>

      {/* SECCIÓN 2: Insumos de la Receta */}
      <div className="space-y-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-950 leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-1">
            <Sparkles size={14} className="text-emerald-700" />
            <span>2. Insumos e Ingredientes (Ficha Técnica de Costeo)</span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-normal">
            Ingresa cómo compras cada insumo al proveedor (<strong>precio y cantidad total del empaque</strong>) y cuánto <strong>gastas en la receta</strong>. Aluna calculará el costo por porción y descontará inventario automáticamente.
          </p>
        </div>

        <div className="space-y-3">
          {ingredients.map((ingredient, index) => {
            const pPrice = Number(ingredient.purchase_price) || 0;
            const pQty = Number(ingredient.purchase_quantity) || 0;
            const rQty = Number(ingredient.recipe_quantity) || 0;
            const ingCost = pQty > 0 ? (pPrice / pQty) * rQty : 0;

            return (
              <div key={index} className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Insumo #{index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    {ingCost > 0 && (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                        Costo receta: ${Math.round(ingCost).toLocaleString('es-CO')} COP
                      </span>
                    )}
                    {ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setIngredients((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                        aria-label="Quitar ingrediente"
                        className="rounded-lg p-1 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700">Nombre del insumo o materia prima *</label>
                  <input
                    value={ingredient.name}
                    onChange={(event) => updateIngredient(index, 'name', event.target.value)}
                    placeholder="Ej: Soda Bretaña 300ml, Arándanos congelados, Azúcar Morena"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <p className="mt-1 text-[11px] text-gray-400">Si este insumo ya existe en tu inventario, Aluna lo vinculará sin duplicarlo.</p>
                </div>

                {/* Datos de Compra al Proveedor */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Datos de Compra al Proveedor (Presentación comercial)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700">Precio compra ($) *</label>
                      <div className="relative mt-1">
                        <span className="absolute left-2.5 top-1.5 text-xs font-bold text-gray-400">$</span>
                        <input
                          type="number"
                          min="0"
                          value={ingredient.purchase_price}
                          onChange={(event) => updateIngredient(index, 'purchase_price', event.target.value)}
                          placeholder="Ej: 3500"
                          className="w-full rounded-lg border border-gray-200 bg-white pl-6 pr-2 py-1.5 text-xs outline-none focus:border-emerald-500"
                        />
                      </div>
                      <p className="mt-0.5 text-[10px] text-gray-400">Costo total del empaque</p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700">Cantidad comprada *</label>
                      <input
                        type="number"
                        min="0"
                        value={ingredient.purchase_quantity}
                        onChange={(event) => updateIngredient(index, 'purchase_quantity', event.target.value)}
                        placeholder="Ej: 1 o 1000"
                        className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-emerald-500"
                      />
                      <p className="mt-0.5 text-[10px] text-gray-400">Contenido total del paquete</p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700">Unidad de empaque</label>
                      <input
                        value={ingredient.purchase_unit}
                        onChange={(event) => updateIngredient(index, 'purchase_unit', event.target.value)}
                        placeholder="Ej: botella, g, kg, ml"
                        className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-emerald-500"
                      />
                      <p className="mt-0.5 text-[10px] text-gray-400">Unidad del proveedor</p>
                    </div>
                  </div>
                </div>

                {/* Datos de Uso en la Receta */}
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Datos de Uso en la Receta (Para {servings} porción/porciones)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700">Cantidad usada en receta *</label>
                      <input
                        type="number"
                        min="0"
                        value={ingredient.recipe_quantity}
                        onChange={(event) => updateIngredient(index, 'recipe_quantity', event.target.value)}
                        placeholder="Ej: 1 (botella) o 50 (g)"
                        className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-emerald-500"
                      />
                      <p className="mt-0.5 text-[10px] text-gray-400">Cantidad requerida para preparar</p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700">Unidad de uso</label>
                      <input
                        value={ingredient.usage_unit}
                        onChange={(event) => updateIngredient(index, 'usage_unit', event.target.value)}
                        placeholder="Ej: botella, g, porción"
                        className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-emerald-500"
                      />
                      <p className="mt-0.5 text-[10px] text-gray-400">Unidad para descontar stock</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button type="button" onClick={() => setIngredients((current) => [...current, { ...EMPTY_INGREDIENT }])} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300 py-3 text-xs font-bold text-emerald-700 hover:bg-emerald-50/50 transition-colors">
        <Plus size={15} /> Añadir otro ingrediente
      </button>

      <button type="button" disabled={!isComplete} onClick={() => setStep('review')} className="w-full rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white shadow-sm hover:bg-[#21542f] disabled:opacity-40 transition-all">
        Calcular costos y revisar propuesta
      </button>

      {!existingProduct ? (
        <button type="button" disabled={!canCreateQuick} onClick={() => setStep('quick_review')} className="w-full rounded-xl border border-blue-200 bg-blue-50 py-3 text-sm font-bold text-blue-800 hover:bg-blue-100 disabled:opacity-40 transition-all">
          No tengo los costos: crear ahora y costear después
        </button>
      ) : null}

      <p className="text-center text-[11px] leading-relaxed text-gray-500">
        Puedes completar ingredientes, receta y costos más adelante sin perder este producto.
      </p>
      <button type="button" onClick={onCancel} className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-700">
        Cancelar
      </button>
    </div>
  );
}

