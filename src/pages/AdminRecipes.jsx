import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { toast } from '../components/Toast';
import { useAdminIngredients } from '../hooks/useAdminIngredients';
import {
  PageHeader, PrimaryButton, SecondaryButton, Badge,
  FormField, TextInput, SearchInput
} from '../components/admin/ui';

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const ViewGridIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
);

const ViewListIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
);

export default function AdminRecipes() {
  const [recipes,      setRecipes]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const { ingredients: allIngredients, fetchIngredients } = useAdminIngredients();
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '', description: '', target_price: 0, ingredients: []
  });

  useEffect(() => { fetchData(); fetchIngredients(); }, [fetchIngredients]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('recipes')
        .select(`*, recipe_ingredients(id, ingredient_id, quantity, ingredients(name, unit_cost, usage_unit))`)
        .order('name');
      if (error) throw error;
      setRecipes(data || []);
    } catch (err) {
      console.error(err);
      toast('Error al cargar recetas');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (recipe = null) => {
    if (recipe) {
      setEditingRecipe(recipe);
      setFormData({
        name: recipe.name, description: recipe.description || '',
        target_price: recipe.target_price || 0,
        ingredients: recipe.recipe_ingredients?.map(ri => ({
          ingredient_id: ri.ingredient_id, quantity: ri.quantity,
          name: ri.ingredients?.name, unit_cost: ri.ingredients?.unit_cost,
          usage_unit: ri.ingredients?.usage_unit
        })) || []
      });
    } else {
      setEditingRecipe(null);
      setFormData({ name: '', description: '', target_price: 0, ingredients: [] });
    }
    setIsModalOpen(true);
  };

  const filteredIngredients = useMemo(() =>
    allIngredients.filter(i =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    ), [allIngredients, searchTerm]
  );

  const handleAddIngredient = (ing) => {
    if (formData.ingredients.find(i => i.ingredient_id === ing.id)) {
      toast('El insumo ya está en la receta'); return;
    }
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { ingredient_id: ing.id, quantity: 1, name: ing.name, unit_cost: ing.unit_cost, usage_unit: ing.usage_unit }]
    }));
  };

  const handleRemoveIngredient = (id) =>
    setFormData(prev => ({ ...prev, ingredients: prev.ingredients.filter(i => i.ingredient_id !== id) }));

  const handleUpdateQuantity = (id, qty) =>
    setFormData(prev => ({ ...prev, ingredients: prev.ingredients.map(i => i.ingredient_id === id ? { ...i, quantity: parseFloat(qty) || 0 } : i) }));

  const totalCost = useMemo(() =>
    formData.ingredients.reduce((sum, i) => sum + (i.quantity * (i.unit_cost || 0)), 0),
    [formData.ingredients]
  );

  const margin = formData.target_price > 0
    ? ((formData.target_price - totalCost) / formData.target_price) * 100
    : 0;

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (!formData.name.trim()) {
        toast('El nombre de la receta es obligatorio.');
        return;
      }

      let recipeId = editingRecipe?.id;
      const recipeData = { 
        name: formData.name.trim(), 
        description: formData.description, 
        target_price: parseFloat(formData.target_price) || 0, 
        total_cost: totalCost 
      };

      if (editingRecipe) {
        const { error } = await supabase.from('recipes').update(recipeData).eq('id', recipeId);
        if (error) throw error;
        await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId);
      } else {
        const { data: newRec, error } = await supabase.from('recipes').insert([recipeData]).select().single();
        if (error) throw error;
        recipeId = newRec.id;
      }

      if (formData.ingredients.length > 0) {
        const { error } = await supabase.from('recipe_ingredients').insert(
          formData.ingredients.map(i => ({ recipe_id: recipeId, ingredient_id: i.ingredient_id, quantity: Number(i.quantity) || 0 }))
        );
        if (error) throw error;
      }

      // Sincronización de Costos hacia Productos
      const { data: linkedProducts } = await supabase.from('products').select('id, price').eq('recipe_id', recipeId);
      if (linkedProducts && linkedProducts.length > 0) {
        const productUpdates = linkedProducts.map(p => {
          const pPrice = parseFloat(p.price) || 0;
          const newMargin = pPrice > 0 ? ((pPrice - totalCost) / pPrice) * 100 : 0;
          return supabase.from('products').update({ cost: totalCost, margin: newMargin }).eq('id', p.id);
        });
        await Promise.all(productUpdates);
      }

      toast(editingRecipe ? 'Receta actualizada' : 'Receta creada');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error in handleSave:', err);
      toast('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('recipes').delete().eq('id', id);
    if (error) { toast('Error al eliminar'); return; }
    setRecipes(prev => prev.filter(r => r.id !== id));
    toast('Receta eliminada');
  };

  if (loading && recipes.length === 0) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">Cargando recetas…</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        badge="Producción"
        title="Recetas"
        subtitle="Fichas técnicas y control de costos por plato."
      >
        <div className="flex bg-gray-100 p-1 rounded-xl mr-3">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <ViewGridIcon />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <ViewListIcon />
          </button>
        </div>
        <PrimaryButton onClick={() => handleOpenModal()}>+ Nueva receta</PrimaryButton>
      </PageHeader>

      {/* Recipes View */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 border-b border-gray-100">Nombre</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 border-b border-gray-100">Insumos</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 border-b border-gray-100 hidden md:table-cell">Precio Obj.</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 border-b border-gray-100 text-right">Costo Total</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 border-b border-gray-100 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {recipes.map(recipe => (
                  <tr key={recipe.id} className="group hover:bg-gray-50/50 transition-colors border-b last:border-0 border-gray-50 text-sm font-medium">
                    <td className="px-5 py-3">
                      <p className="text-gray-900 font-semibold">{recipe.name}</p>
                      <p className="text-[12px] text-gray-400 mt-0.5 max-w-[200px] truncate">{recipe.description || 'Sin notas'}</p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="blue">{recipe.recipe_ingredients?.length || 0} insumos</Badge>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-gray-500">
                      {(recipe.target_price || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-5 py-3 text-right text-[#2f4131] font-semibold">
                      {(recipe.total_cost || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenModal(recipe)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all">
                           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => handleDelete(recipe.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all">
                           <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {recipes.map(recipe => {
            const ingredients = recipe.recipe_ingredients || [];
            return (
              <div key={recipe.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col group hover:border-gray-300 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 leading-tight">{recipe.name}</h3>
                    <p className="text-[12px] text-gray-400 font-medium mt-0.5">{ingredients.length} insumos</p>
                  </div>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(recipe)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(recipe.id)}
                      className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all">
                      <TrashIcon />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 mb-5 flex-1">
                  {ingredients.slice(0, 4).map(ri => (
                    <div key={ri.id} className="flex justify-between items-center bg-gray-50/50 rounded-lg px-2 py-1.5">
                      <span className="text-[13px] text-gray-600 font-medium truncate max-w-[150px]">{ri.ingredients?.name}</span>
                      <span className="text-[11px] text-gray-400 font-mono">×{ri.quantity} {ri.ingredients?.usage_unit}</span>
                    </div>
                  ))}
                  {ingredients.length > 4 && (
                    <p className="text-[11px] text-gray-300 font-medium text-center py-1 bg-gray-50/30 rounded-lg">… y {ingredients.length - 4} más</p>
                  )}
                  {ingredients.length === 0 && (
                    <p className="text-[12px] text-gray-300 italic text-center py-4 bg-gray-50/30 rounded-lg border border-dashed border-gray-100">Sin insumos añadidos.</p>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Costo total</span>
                  <span className="text-base font-semibold text-[#2f4131]">
                    {recipe.total_cost?.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {recipes.length === 0 && (
        <div className="mt-8 py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300">
          <p className="text-sm font-semibold">Aún no has creado ninguna receta.</p>
        </div>
      )}

      {/* ── Modal editor */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-[95vw] lg:max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col my-auto">

            {/* Modal header with cost/margin chips */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {editingRecipe ? 'Editar receta' : 'Nueva receta'}
                </h3>
                <p className="text-[13px] text-gray-400 font-medium mt-0.5">
                  {editingRecipe ? editingRecipe.name : 'Define los insumos y calcula el costo real de producción.'}
                </p>
              </div>
              {/* Live cost indicators */}
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Costo producción</p>
                  <p className="text-lg font-semibold text-gray-900 tabular-nums">
                    {totalCost.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Margen estimado</p>
                  <p className={`text-lg font-semibold tabular-nums ${margin > 30 ? 'text-green-600' : 'text-amber-500'}`}>
                    {margin.toFixed(1)}%
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
              {/* ── Left: Ingredient catalog (30%) */}
              <div className="md:w-[30%] border-r border-gray-100 flex flex-col overflow-hidden bg-gray-50/40">
                <div className="px-6 py-4 border-b border-gray-100 shrink-0">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Catálogo de insumos</p>
                  <SearchInput value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar insumo…" />
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
                  {filteredIngredients.map(ing => (
                    <button key={ing.id} type="button" onClick={() => handleAddIngredient(ing)}
                      className="w-full p-3.5 bg-white border border-gray-100 rounded-xl text-left hover:border-blue-200 hover:shadow-sm transition-all flex justify-between items-center group/row">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{ing.name}</p>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                          ${ing.unit_cost?.toFixed(1)} / {ing.usage_unit}
                        </p>
                      </div>
                      <span className="text-blue-400 opacity-0 group-hover/row:opacity-100 text-lg font-bold transition-opacity">+</span>
                    </button>
                  ))}
                  {filteredIngredients.length === 0 && (
                    <p className="py-8 text-center text-sm text-gray-400">Sin insumos encontrados.</p>
                  )}
                </div>
              </div>

              {/* ── Right: Recipe form (70%) */}
              <form onSubmit={handleSave} className="md:w-[70%] flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <FormField label="Nombre de la receta">
                      <TextInput required value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Ej. Hamburguesa de la Casa" />
                    </FormField>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Precio objetivo">
                        <TextInput type="number" value={formData.target_price} onChange={e => setFormData(prev => ({ ...prev, target_price: Number(e.target.value) }))} />
                      </FormField>
                      <FormField label="Notas">
                        <TextInput value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Opcional…" />
                      </FormField>
                    </div>
                  </div>

                  {/* Ingredient list container */}
                  <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-100 flex flex-col flex-1 min-h-[40vh]">
                    <div className="flex justify-between items-center mb-1 shrink-0">
                      <p className="text-[12px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                        Insumos Añadidos
                      </p>
                      <Badge variant="blue">{formData.ingredients.length} items</Badge>
                    </div>
                    <p className="text-[11px] text-gray-400 mb-4 shrink-0">Ingresa la cantidad requerida según la unidad de uso de cada insumo (ej. gramos, mililitros).</p>
                    
                    <div className="flex-1 overflow-y-auto pr-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {formData.ingredients.map(ing => (
                          <div key={ing.ingredient_id} className="flex flex-col justify-between p-3.5 bg-white border border-gray-200 shadow-sm rounded-xl hover:border-blue-200 transition-colors">
                            <div className="flex items-start justify-between min-w-0 mb-3">
                              <p className="text-sm font-bold text-gray-900 leading-tight pr-2 line-clamp-2">{ing.name}</p>
                              <button type="button" onClick={() => handleRemoveIngredient(ing.ingredient_id)}
                                className="p-1.5 -mr-1.5 -mt-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0">
                                <TrashIcon />
                              </button>
                            </div>
                            <div className="flex items-end justify-between border-t border-gray-50 pt-3">
                              <div className="flex flex-col gap-1 shrink-0">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cantidad</span>
                                <div className="flex items-center gap-1.5">
                                  <input type="number" step="any" min="0" value={ing.quantity}
                                    onChange={e => handleUpdateQuantity(ing.ingredient_id, e.target.value)}
                                    className="w-[70px] px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-center focus:bg-white focus:ring-2 focus:ring-[#2f4131] outline-none transition-all shadow-inner" />
                                  <span className="text-[12px] text-gray-500 font-semibold truncate max-w-[50px]">{ing.usage_unit}</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                 <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Costo</p>
                                 <p className="text-sm font-bold text-[#2f4131] bg-green-50 px-2 py-0.5 rounded-md inline-block">
                                   ${Math.round(ing.quantity * ing.unit_cost).toLocaleString('es-CO')}
                                 </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {formData.ingredients.length === 0 && (
                        <div className="h-full min-h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl text-center p-8">
                          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 mb-1">Tu receta está vacía</p>
                          <p className="text-[12px] text-gray-500 max-w-[200px]">Busca y selecciona insumos del panel izquierdo para empezar.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
                  <SecondaryButton type="button" onClick={() => setIsModalOpen(false)} className="flex-1">Cancelar</SecondaryButton>
                  <PrimaryButton type="submit" className="flex-[2]">
                    {editingRecipe ? 'Guardar cambios' : 'Crear receta'}
                  </PrimaryButton>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
