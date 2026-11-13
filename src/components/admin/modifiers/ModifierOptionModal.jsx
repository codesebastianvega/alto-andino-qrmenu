import React from 'react';
import { Icon } from '@iconify-icon/react';
import EmojiPicker from 'emoji-picker-react';
import { PrimaryButton, SecondaryButton, FormField, TextInput } from '../ui';

export default function ModifierOptionModal({
  isOpen,
  isEditing,
  optionForm,
  setOptionForm,
  onSaveOption,
  onClose,
  filterCategory,
  setFilterCategory,
  categories,
  menuProducts,
  recipes,
  ingredients,
  modifierGroups,
  activeGroupId,
  emojiPickerOpen,
  setEmojiPickerOpen,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/80 flex items-end md:items-start justify-center z-[100] p-0 md:p-4 overflow-hidden backdrop-blur-sm">
      <div className="bg-white rounded-t-[2rem] md:rounded-[2rem] w-full max-w-2xl h-[95vh] md:h-auto md:max-h-[90vh] md:my-8 flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200">
        <div className="shrink-0 p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#2f4131]">
              {isEditing ? 'Editar Opción' : 'Agregar Opción al Grupo'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Define el precio, vinculación a inventario y sub-opciones para este modificador.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <Icon icon="heroicons:x-mark" className="text-xl" />
          </button>
        </div>

        <form onSubmit={onSaveOption} className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
          <div className="p-6 space-y-5 flex-1">
            <FormField label="Jalar del Menú, Sub-receta o Inventario (Opcional)">
              <div className="mb-2">
                <select
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#2f4131]/20 text-gray-600 font-medium"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="">
                    -- Ver Todo (Productos del Menú, Sub-recetas e Insumos) --
                  </option>
                  <option value="menu_products">
                    🍔 Productos de la Carta / Menú (Para Combos)
                  </option>
                  <option value="subrecipes">⭐ Sub-recetas Disponibles como Adición</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      📦 Insumos: {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <select
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2f4131] outline-none"
                value={
                  optionForm.recipe_id
                    ? `recipe:${optionForm.recipe_id}`
                    : optionForm.ingredient_id
                    ? `ing:${optionForm.ingredient_id}`
                    : ''
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    setOptionForm({ ...optionForm, ingredient_id: '', recipe_id: '' });
                    return;
                  }

                  if (val.startsWith('prod:')) {
                    const prodId = val.replace('prod:', '');
                    const prod = (menuProducts || []).find((p) => p.id === prodId);
                    if (prod) {
                      const normalPrice = Number(prod.price) || 0;
                      const suggestedComboPrice =
                        normalPrice > 4000
                          ? Math.round((normalPrice * 0.8) / 500) * 500
                          : Math.max(0, normalPrice - 1000);
                      setOptionForm({
                        ...optionForm,
                        recipe_id: prod.recipe_id || '',
                        ingredient_id: '',
                        name: prod.name,
                        price: String(suggestedComboPrice),
                        extra_price: String(normalPrice),
                        image_url: prod.image_url || optionForm.image_url || '',
                      });
                    }
                  } else if (val.startsWith('recipe:')) {
                    const recId = val.replace('recipe:', '');
                    const rec = recipes.find((r) => r.id === recId);
                    if (rec) {
                      const portionGrams = Number(rec.addon_portion_grams) || 150;
                      const batchYield = Number(rec.batch_yield) || 1000;
                      const unitCost =
                        batchYield > 0 ? Number(rec.total_cost || 0) / batchYield : 0;
                      const portionCost = Math.round(portionGrams * unitCost);
                      const suggestedPrice =
                        Number(rec.addon_price) || Math.round(portionCost / (1 - 0.6));

                      setOptionForm({
                        ...optionForm,
                        recipe_id: rec.id,
                        ingredient_id: '',
                        name:
                          optionForm.name ||
                          `Porción Extra de ${rec.name} (${portionGrams}${rec.batch_unit || 'g'})`,
                        price: optionForm.price || String(suggestedPrice),
                      });
                    }
                  } else if (val.startsWith('ing:')) {
                    const ingId = val.replace('ing:', '');
                    const ing = ingredients.find((i) => i.id === ingId);
                    setOptionForm({
                      ...optionForm,
                      ingredient_id: ingId,
                      recipe_id: '',
                      name: ing ? ing.name : optionForm.name,
                      price: ing ? String(ing.selling_price || '') : optionForm.price,
                    });
                  }
                }}
              >
                <option value="">
                  -- Seleccionar producto del menú, sub-receta o insumo --
                </option>

                {(!filterCategory || filterCategory === 'menu_products') && (
                  <optgroup label="🍔 Productos del Menú (Jalar para Combo con Descuento)">
                    {(menuProducts || [])
                      .filter((p) => p.is_active !== false)
                      .map((prod) => (
                        <option key={`prod-${prod.id}`} value={`prod:${prod.id}`}>
                          {prod.name} (Precio Carta: ${Number(prod.price || 0).toLocaleString('es-CO')})
                        </option>
                      ))}
                  </optgroup>
                )}

                {(!filterCategory || filterCategory === 'subrecipes') && (
                  <optgroup label="🍚 Sub-recetas Preparadas (Adiciones)">
                    {recipes
                      .filter(
                        (r) =>
                          r.is_subrecipe &&
                          (r.available_as_addon || filterCategory === 'subrecipes')
                      )
                      .map((rec) => (
                        <option key={`rec-${rec.id}`} value={`recipe:${rec.id}`}>
                          {rec.name} (Porción {rec.addon_portion_grams || 150}
                          {rec.batch_unit || 'g'} - Sugerido ${Number(rec.addon_price || 0).toLocaleString()})
                        </option>
                      ))}
                  </optgroup>
                )}

                {filterCategory !== 'subrecipes' && filterCategory !== 'menu_products' && (
                  <optgroup
                    label={filterCategory ? 'Insumos Filtrados' : 'Insumos de Inventario'}
                  >
                    {ingredients
                      .filter((ing) => !filterCategory || ing.category_id === filterCategory)
                      .map((ing) => (
                        <option key={`ing-${ing.id}`} value={`ing:${ing.id}`}>
                          {ing.name}
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
              <p className="text-[10px] text-gray-500 mt-1">
                {optionForm.recipe_id ? (
                  <span className="text-emerald-700 font-bold">
                    ✓ Vinculado a Receta/Producto: Rellena nombre, foto, precio normal tachado y precio de combo automáticamente.
                  </span>
                ) : (
                  'Elige un producto ya creado en tu menú para armar combos en 1 clic (trae su foto, nombre, precio normal tachado y sugiere precio con descuento).'
                )}
              </p>
            </FormField>

            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-1 relative">
                <FormField label="Emoji">
                  <div
                    className={`flex items-center justify-center h-12 w-full border-2 border-dashed rounded-2xl cursor-pointer transition-colors text-2xl ${
                      emojiPickerOpen
                        ? 'border-[#2f4131] bg-neutral-50'
                        : 'border-neutral-200 hover:border-[#2f4131] hover:bg-neutral-50'
                    }`}
                    onClick={() => setEmojiPickerOpen((p) => !p)}
                  >
                    {optionForm.emoji || (
                      <span className="text-sm text-neutral-400 font-bold">Icono</span>
                    )}
                  </div>
                  {emojiPickerOpen && (
                    <div className="absolute top-full left-0 z-50 mt-2 shadow-2xl rounded-2xl overflow-hidden border border-neutral-100">
                      <div className="bg-white p-2 border-b border-neutral-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                          Elige tu Emoji
                        </span>
                        <button
                          type="button"
                          onClick={() => setEmojiPickerOpen(false)}
                          className="text-neutral-400 hover:text-black cursor-pointer"
                        >
                          <Icon icon="heroicons:x-mark" className="text-xl" />
                        </button>
                      </div>
                      <EmojiPicker
                        onEmojiClick={(pickerOut) => {
                          setOptionForm({ ...optionForm, emoji: pickerOut.emoji });
                          setEmojiPickerOpen(false);
                        }}
                        autoFocusSearch={false}
                        searchDisabled={false}
                        skinTonesDisabled={true}
                        width={300}
                        height={350}
                      />
                    </div>
                  )}
                </FormField>
              </div>
              <div className="col-span-3">
                <FormField label="Nombre de la opción *">
                  <TextInput
                    required
                    value={optionForm.name}
                    onChange={(e) => setOptionForm({ ...optionForm, name: e.target.value })}
                    placeholder="Ej. Bien cocido"
                  />
                </FormField>
              </div>
            </div>

            <FormField label="Imagen de esta opción (URL o ruta del sitio)">
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <TextInput
                    value={optionForm.image_url}
                    onChange={(e) => setOptionForm({ ...optionForm, image_url: e.target.value })}
                    placeholder="https://tu-cdn.com/foto.webp o /img/ingrediente.webp"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    En un ingrediente, usa su imagen inicial. En una subopción, usa la foto del resultado final: al elegirla reemplazará la imagen del ingrediente. Las rutas del sitio no descargan fotos desde Supabase.
                  </p>
                </div>
                {optionForm.image_url && (
                  <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                    <img
                      src={optionForm.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <span className="hidden text-xl text-gray-300">🖼️</span>
                  </div>
                )}
              </div>
            </FormField>

            <FormField label="Precio Adicional ($)">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2f4131] outline-none"
                  value={optionForm.price}
                  onChange={(e) => setOptionForm({ ...optionForm, price: e.target.value })}
                  placeholder="Ej. 1500"
                />
              </div>
              {(() => {
                let cost = 0;
                let unitLabel = 'u';

                if (optionForm.recipe_id) {
                  const rec = recipes.find((r) => r.id === optionForm.recipe_id);
                  if (rec) {
                    const portionGrams = Number(rec.addon_portion_grams) || 150;
                    const batchYield = Number(rec.batch_yield) || 1000;
                    const unitCost =
                      batchYield > 0 ? Number(rec.total_cost || 0) / batchYield : 0;
                    cost = Math.round(portionGrams * unitCost);
                    unitLabel = `${portionGrams}${rec.batch_unit || 'g'}`;
                  }
                } else if (optionForm.ingredient_id) {
                  const selectedIng = ingredients.find(
                    (i) => i.id === optionForm.ingredient_id
                  );
                  if (selectedIng) {
                    cost = selectedIng.unit_cost || 0;
                    unitLabel = selectedIng.usage_unit || 'u';
                  }
                }

                if (cost > 0 && optionForm.price) {
                  const price = parseFloat(optionForm.price) || 0;
                  const margin = price - cost;
                  const marginPercent = price > 0 ? Math.round((margin / price) * 100) : 0;
                  return (
                    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="text-gray-500 block mb-0.5">Costo porción:</span>
                        <span className="font-bold text-gray-800">${cost.toLocaleString()}</span>{' '}
                        <span className="text-gray-400">/{unitLabel}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-500 block mb-0.5">Margen Generado:</span>
                        <span
                          className={`font-bold ${
                            marginPercent >= 50
                              ? 'text-emerald-700'
                              : marginPercent > 0
                              ? 'text-amber-600'
                              : 'text-red-600'
                          }`}
                        >
                          ${margin.toLocaleString()} ({marginPercent}%)
                        </span>
                      </div>
                    </div>
                  );
                } else if (cost > 0) {
                  return (
                    <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-xl border border-amber-100">
                      <Icon icon="heroicons:information-circle" className="text-base" />
                      <span>
                        Costo base de la porción ({unitLabel}): <b>${cost.toLocaleString()}</b>.
                        Asígnale un precio para ver tu margen.
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
            </FormField>

            <FormField label="Precio Porción Extra / 2da ($) (Opcional)">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2f4131] outline-none"
                  value={optionForm.extra_price}
                  onChange={(e) => setOptionForm({ ...optionForm, extra_price: e.target.value })}
                  placeholder="Ej. 6000 (Si el cliente pide porción adicional o doble)"
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                Útil para ingredientes incluidos ($0): si el comensal pide una 2da porción de este
                ítem (ej. Doble Pollo), cobrará este valor. Si se deja vacío, aplica el mismo precio
                base.
              </p>
            </FormField>

            <FormField label="¿Desplegar sub-opciones? (Opcional)">
              <div className="relative">
                <select
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2f4131] outline-none"
                  value={optionForm.nested_group_id}
                  onChange={(e) =>
                    setOptionForm({ ...optionForm, nested_group_id: e.target.value })
                  }
                >
                  <option value="">-- Sin sub-opciones --</option>
                  <optgroup label="Selecciona un grupo de subopciones">
                    {modifierGroups
                      .filter((g) => g.id !== activeGroupId)
                      .map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                Ejemplo: Pollo → Estilos de preparación. Cada porción tendrá su propia elección, imagen final y recargo configurado.
              </p>
            </FormField>

            <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl mt-2">
              <div>
                <p className="text-sm font-bold text-gray-800">Disponibilidad en la Carta</p>
                <p className="text-xs text-gray-500">
                  ¿Esta opción está disponible para que los clientes la elijan?
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={optionForm.is_active !== false}
                  onChange={(e) =>
                    setOptionForm({ ...optionForm, is_active: e.target.checked })
                  }
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          <div className="shrink-0 p-4 md:p-6 bg-white border-t border-gray-100 flex flex-col sm:flex-row gap-3 mt-auto">
            <SecondaryButton
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto cursor-pointer"
            >
              Cancelar
            </SecondaryButton>
            <PrimaryButton type="submit" className="w-full sm:w-auto sm:ml-auto cursor-pointer">
              {isEditing ? 'Guardar Cambios' : 'Agregar Opción'}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
