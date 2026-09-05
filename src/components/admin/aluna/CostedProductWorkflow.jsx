import { useMemo, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';

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
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-blue-800">Crear ahora y costear después</p><p className="mt-2 text-sm leading-relaxed text-blue-900">Aluna creará <strong>{product.name}</strong> en {brandName} sin ingredientes, receta ni costo. El producto podrá venderse y la auditoría mantendrá pendiente completar su costo real.</p></div>
      <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm"><p className="font-bold text-gray-950">{product.name}</p><p className="mt-1 text-gray-500">{categoryName}</p><div className="mt-3 flex justify-between border-t border-gray-100 pt-3"><span className="text-gray-500">Precio de venta</span><span className="font-bold text-emerald-700">$ {Number(product.price).toLocaleString('es-CO')}</span></div><p className="mt-3 text-xs font-semibold text-amber-700">Pendiente: ingredientes, receta, costo y margen real.</p></div>
      <button type="button" disabled={isExecuting} onClick={() => onApproveQuick(quickProposal)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white disabled:opacity-60">{isExecuting ? <><Loader2 size={17} className="animate-spin" /> Creando producto…</> : 'Aprobar y crear sin receta'}</button>
      <button type="button" disabled={isExecuting} onClick={() => setStep('form')} className="w-full py-2 text-xs font-semibold text-gray-500">Volver y añadir costos</button>
    </div>
  );

  if (step === 'review') return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-amber-800">Propuesta gastronómica</p><p className="mt-2 text-sm text-amber-900">Aluna creará o reutilizará ingredientes, creará la receta y luego el producto vinculado en {brandName}.</p></div>
      <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm"><p className="font-bold text-gray-950">{product.name}</p><p className="text-gray-500">{categoryName} · {servings} porción(es)</p><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-gray-50 p-2"><p className="text-[10px] text-gray-500">Costo/porción</p><p className="font-bold">$ {Math.round(calculations.perPortion).toLocaleString('es-CO')}</p></div><div className="rounded-xl bg-gray-50 p-2"><p className="text-[10px] text-gray-500">Precio</p><p className="font-bold">$ {Number(product.price).toLocaleString('es-CO')}</p></div><div className="rounded-xl bg-emerald-50 p-2"><p className="text-[10px] text-emerald-700">Margen</p><p className="font-bold text-emerald-800">{calculations.margin.toFixed(1)}%</p></div></div>
        <div className="mt-4 space-y-1">{ingredients.map((ingredient, index) => <div key={`${ingredient.name}-${index}`} className="flex justify-between text-xs"><span>{ingredient.name} · {ingredient.recipe_quantity}{ingredient.usage_unit}</span><span>$ {Math.round(Number(ingredient.purchase_price) / Number(ingredient.purchase_quantity) * Number(ingredient.recipe_quantity)).toLocaleString('es-CO')}</span></div>)}</div>
      </div>
      <button type="button" disabled={isExecuting} onClick={() => onApprove(proposal)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white disabled:opacity-60">{isExecuting ? <><Loader2 size={17} className="animate-spin" /> Creando estructura…</> : 'Aprobar ingredientes, receta y producto'}</button>
      <button type="button" disabled={isExecuting} onClick={() => setStep('form')} className="w-full py-2 text-xs font-semibold text-gray-500">Corregir datos</button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div><h3 className="text-lg font-bold text-gray-950">{existingProduct ? 'Crear y vincular receta' : 'Producto con costo real'}</h3><p className="mt-1 text-sm text-gray-600">Aluna reutiliza los insumos que ya existen y solo crea los faltantes. La cantidad de compra debe expresarse en la unidad de uso equivalente.</p></div>
      {existingProduct ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Producto seleccionado</p><p className="mt-1 font-bold text-emerald-950">{existingProduct.name}</p><p className="mt-1 text-xs text-emerald-800">La receta se vinculará a este producto; no se creará un duplicado.</p></div> : null}
      {initialDraft.recipe_draft?.quantities_are_estimates ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900"><strong>Cantidades sugeridas por Aluna.</strong> Revísalas antes de aprobar; no reemplazan la ficha técnica real del negocio.</div> : null}
      <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4"><input disabled={Boolean(existingProduct)} value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Categoría *" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm disabled:bg-gray-50" /><input disabled={Boolean(existingProduct)} value={product.name} onChange={(event) => setProduct((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre del producto *" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm disabled:bg-gray-50" /><textarea disabled={Boolean(existingProduct)} value={product.description} onChange={(event) => setProduct((current) => ({ ...current, description: event.target.value }))} placeholder="Descripción real *" rows={2} className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm disabled:bg-gray-50" /><div className="grid grid-cols-2 gap-3"><input type="number" min="1" value={product.price} onChange={(event) => setProduct((current) => ({ ...current, price: event.target.value }))} placeholder="Precio de venta *" className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm" /><input type="number" min="1" value={servings} onChange={(event) => setServings(Number(event.target.value))} placeholder="Porciones" className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm" /></div><input value={product.tags} onChange={(event) => setProduct((current) => ({ ...current, tags: event.target.value }))} placeholder="Etiquetas separadas por coma" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" /></div>
      <div className="space-y-3">{ingredients.map((ingredient, index) => <div key={index} className="rounded-2xl border border-gray-200 bg-white p-4"><div className="mb-3 flex justify-between"><p className="text-xs font-bold text-gray-600">Ingrediente {index + 1}</p>{ingredients.length > 1 ? <button type="button" onClick={() => setIngredients((current) => current.filter((_, currentIndex) => currentIndex !== index))} aria-label="Quitar ingrediente"><Trash2 size={15} className="text-red-500" /></button> : null}</div><input value={ingredient.name} onChange={(event) => updateIngredient(index, 'name', event.target.value)} placeholder="Nombre *" className="mb-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" /><div className="grid grid-cols-3 gap-2"><input type="number" min="0" value={ingredient.purchase_price} onChange={(event) => updateIngredient(index, 'purchase_price', event.target.value)} placeholder="Costo compra" className="rounded-xl border border-gray-200 px-2 py-2 text-xs" /><input type="number" min="0" value={ingredient.purchase_quantity} onChange={(event) => updateIngredient(index, 'purchase_quantity', event.target.value)} placeholder="Cantidad compra" className="rounded-xl border border-gray-200 px-2 py-2 text-xs" /><input type="number" min="0" value={ingredient.recipe_quantity} onChange={(event) => updateIngredient(index, 'recipe_quantity', event.target.value)} placeholder="Usado/receta" className="rounded-xl border border-gray-200 px-2 py-2 text-xs" /></div><div className="mt-2 grid grid-cols-2 gap-2"><input value={ingredient.purchase_unit} onChange={(event) => updateIngredient(index, 'purchase_unit', event.target.value)} placeholder="Unidad compra" className="rounded-xl border border-gray-200 px-2 py-2 text-xs" /><input value={ingredient.usage_unit} onChange={(event) => updateIngredient(index, 'usage_unit', event.target.value)} placeholder="Unidad uso" className="rounded-xl border border-gray-200 px-2 py-2 text-xs" /></div></div>)}</div>
      <button type="button" onClick={() => setIngredients((current) => [...current, { ...EMPTY_INGREDIENT }])} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300 py-3 text-xs font-bold text-emerald-700"><Plus size={15} /> Añadir ingrediente</button>
      <button type="button" disabled={!isComplete} onClick={() => setStep('review')} className="w-full rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white disabled:opacity-40">Calcular y revisar propuesta</button>
      {!existingProduct ? <button type="button" disabled={!canCreateQuick} onClick={() => setStep('quick_review')} className="w-full rounded-xl border border-blue-200 bg-blue-50 py-3 text-sm font-bold text-blue-800 disabled:opacity-40">No tengo los costos: crear ahora</button> : null}
      <p className="text-center text-[11px] leading-relaxed text-gray-500">Puedes completar ingredientes, receta y costos más adelante sin perder este producto.</p>
      <button type="button" onClick={onCancel} className="w-full py-2 text-xs font-semibold text-gray-500">Cancelar</button>
    </div>
  );
}
