import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { toast } from '../components/Toast';
import { useAdminIngredients } from '../hooks/useAdminIngredients';

export default function AdminRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  
  const { ingredients: allIngredients, fetchIngredients } = useAdminIngredients();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_price: 0,
    ingredients: [] // { ingredient_id, quantity, name, unit_cost, usage_unit }
  });

  useEffect(() => {
    fetchData();
    fetchIngredients();
  }, [fetchIngredients]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: recs, error: recError } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            id,
            ingredient_id,
            quantity,
            ingredients (name, unit_cost, usage_unit)
          )
        `)
        .order('name');
      
      if (recError) throw recError;
      setRecipes(recs || []);
    } catch (err) {
      console.error(err);
      toast('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (recipe = null) => {
    if (recipe) {
      setEditingRecipe(recipe);
      setFormData({
        name: recipe.name,
        description: recipe.description || '',
        target_price: recipe.target_price || 0,
        ingredients: recipe.recipe_ingredients?.map(ri => ({
          ingredient_id: ri.ingredient_id,
          quantity: ri.quantity,
          name: ri.ingredients?.name,
          unit_cost: ri.ingredients?.unit_cost,
          usage_unit: ri.ingredients?.usage_unit
        })) || []
      });
    } else {
      setEditingRecipe(null);
      setFormData({
        name: '',
        description: '',
        target_price: 0,
        ingredients: []
      });
    }
    setIsModalOpen(true);
  };

  const filteredIngredients = useMemo(() => {
    return allIngredients.filter(ing => 
      ing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ing.category && ing.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [allIngredients, searchTerm]);

  const handleAddIngredient = (ing) => {
    if (formData.ingredients.find(i => i.ingredient_id === ing.id)) {
      toast('El ingrediente ya está en la lista');
      return;
    }
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { 
        ingredient_id: ing.id, 
        quantity: 1, 
        name: ing.name, 
        unit_cost: ing.unit_cost,
        usage_unit: ing.usage_unit
      }]
    });
  };

  const handleRemoveIngredient = (ingredientId) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter(i => i.ingredient_id !== ingredientId)
    });
  };

  const handleUpdateQuantity = (ingredientId, qty) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.map(i => 
        i.ingredient_id === ingredientId ? { ...i, quantity: parseFloat(qty) || 0 } : i
      )
    });
  };

  const calculateTotalCost = (ingredients) => {
    return ingredients.reduce((sum, ing) => sum + (ing.quantity * (ing.unit_cost || 0)), 0);
  };

  const totalCost = useMemo(() => calculateTotalCost(formData.ingredients), [formData.ingredients]);
  const margin = formData.target_price > 0 ? ((formData.target_price - totalCost) / formData.target_price) * 100 : 0;

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      let recipeId = editingRecipe?.id;

      const recipeData = {
        name: formData.name,
        description: formData.description,
        target_price: parseFloat(formData.target_price) || 0,
        total_cost: totalCost
      };

      if (editingRecipe) {
        const { error: recError } = await supabase
          .from('recipes')
          .update(recipeData)
          .eq('id', recipeId);
        if (recError) throw recError;
        await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId);
      } else {
        const { data: newRec, error: recError } = await supabase
          .from('recipes')
          .insert([recipeData])
          .select()
          .single();
        if (recError) throw recError;
        recipeId = newRec.id;
      }

      if (formData.ingredients.length > 0) {
        const ingredientsToInsert = formData.ingredients.map(ing => ({
          recipe_id: recipeId,
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity
        }));
        const { error: ingError } = await supabase
          .from('recipe_ingredients')
          .insert(ingredientsToInsert);
        if (ingError) throw ingError;
      }

      toast(editingRecipe ? 'Receta actualizada' : 'Receta creada');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta receta permanentemente?')) return;
    try {
      const { error } = await supabase.from('recipes').delete().eq('id', id);
      if (error) throw error;
      setRecipes(recipes.filter(r => r.id !== id));
      toast('Receta eliminada');
    } catch (err) {
      toast('Error al eliminar');
    }
  };

  if (loading && recipes.length === 0) {
    return (
      <div className="p-20 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest text-xs">
        Cargando Recetas Técnicas...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-10">
        <div>
           <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
              📝 Fichas Técnicas
           </div>
           <h2 className="text-3xl font-black text-gray-900 tracking-tight">Gestión de Recetas</h2>
           <p className="text-gray-500 font-medium text-sm">Define la composición técnica y conoce el costo real de producción.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="px-8 py-4 bg-[#2f4131] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-green-900/20 hover:scale-105 active:scale-95 transition-all"
        >
          + Nueva Receta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {recipes.map(recipe => (
          <div key={recipe.id} className="bg-white rounded-[32px] p-8 shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col group hover:border-blue-200 transition-all">
             <div className="flex justify-between items-start mb-6">
                <div>
                   <h3 className="font-black text-gray-900 text-xl tracking-tight mb-1">{recipe.name}</h3>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{recipe.recipe_ingredients?.length || 0} Insumos</p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => handleOpenModal(recipe)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:scale-110 active:scale-90 transition-all">✏️</button>
                   <button onClick={() => handleDelete(recipe.id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:scale-110 active:scale-90 transition-all">🗑️</button>
                </div>
             </div>

             <div className="space-y-3 mb-8 flex-1">
                {recipe.recipe_ingredients?.slice(0, 4).map(ri => (
                   <div key={ri.id} className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold truncate max-w-[150px]">{ri.ingredients?.name}</span>
                      <span className="text-gray-400 font-mono">x{ri.quantity} {ri.ingredients?.usage_unit}</span>
                   </div>
                ))}
                {(recipe.recipe_ingredients?.length || 0) > 4 && (
                   <div className="text-[10px] text-gray-300 font-black italic">... y {recipe.recipe_ingredients.length - 4} más</div>
                )}
             </div>

             <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Costo Total</span>
                <span className="text-lg font-black text-[#2f4131]">
                   {recipe.total_cost?.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                </span>
             </div>
          </div>
        ))}

        {recipes.length === 0 && (
          <div className="col-span-full py-20 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
             <span className="text-4xl mb-4">🥣</span>
             <p className="font-black uppercase tracking-widest text-[10px]">No has creado ninguna receta aún</p>
          </div>
        )}
      </div>

      {/* Modal Recipe Editor */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col">
             <div className="px-10 py-8 bg-[#2f4131] text-white flex justify-between items-center shrink-0">
                <div>
                   <h3 className="text-2xl font-black tracking-tight">{editingRecipe ? 'Editar Receta Técnica' : 'Nueva Receta Técnica'}</h3>
                   <p className="text-white/60 text-sm font-medium">Control preciso de insumos y rentabilidad por plato.</p>
                </div>
                <div className="text-right flex items-center gap-8">
                   <div className="text-right">
                      <span className="block text-[10px] font-black uppercase text-white/40 mb-1">Costo Producción</span>
                      <span className="text-3xl font-black">{totalCost.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</span>
                   </div>
                   <div className="w-px h-10 bg-white/20" />
                   <div className="text-right">
                      <span className="block text-[10px] font-black uppercase text-white/40 mb-1">Margen Estimado</span>
                      <span className={`text-3xl font-black ${margin > 30 ? 'text-green-400' : 'text-amber-400'}`}>
                        {margin.toFixed(1)}%
                      </span>
                   </div>
                </div>
             </div>
             
             <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2">
                {/* Ingredients Selector */}
                <div className="p-8 border-r border-gray-100 overflow-y-auto bg-gray-50/50 flex flex-col">
                   <div className="mb-6">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Catálogo de Insumos</h4>
                      <input 
                        type="text" 
                        placeholder="Buscar insumo..."
                        className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#2f4131]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                   </div>
                   <div className="space-y-2 flex-1 overflow-y-auto pr-2">
                      {filteredIngredients.map(ing => (
                        <button
                          key={ing.id}
                          onClick={() => handleAddIngredient(ing)}
                          className="w-full p-4 bg-white rounded-2xl border border-gray-100 text-left hover:border-blue-300 hover:shadow-md transition-all flex justify-between items-center group"
                        >
                           <div>
                              <span className="block font-bold text-gray-900 text-sm">{ing.name}</span>
                              <div className="flex gap-2">
                                <span className="text-[9px] text-gray-400 font-bold uppercase">Costo: ${ing.unit_cost?.toFixed(1)} / {ing.usage_unit}</span>
                                <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 rounded uppercase font-black">{ing.category}</span>
                              </div>
                           </div>
                           <span className="text-blue-500 opacity-0 group-hover:opacity-100 font-black text-lg transition-all">+</span>
                        </button>
                      ))}
                      {filteredIngredients.length === 0 && (
                        <div className="py-10 text-center text-gray-400 text-xs italic">
                           No se encontraron insumos.
                        </div>
                      )}
                   </div>
                </div>

                {/* Recipe Composition */}
                <form onSubmit={handleSave} className="p-8 flex flex-col h-full overflow-hidden">
                   <div className="space-y-4 mb-8">
                      <div>
                         <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Nombre de la Receta</label>
                         <input 
                           required
                           type="text" 
                           className="w-full px-6 py-3.5 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-[#2f4131]"
                           placeholder="Ej: Hamburguesa de la Casa"
                           value={formData.name}
                           onChange={e => setFormData({...formData, name: e.target.value})}
                         />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Precio Objetivo</label>
                           <input 
                             type="number" 
                             className="w-full px-6 py-3.5 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-blue-500"
                             value={formData.target_price}
                             onChange={e => setFormData({...formData, target_price: Number(e.target.value)})}
                           />
                        </div>
                         <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Categoría Sugerida</label>
                            <input 
                               type="text"
                               className="w-full px-6 py-3.5 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-[#2f4131]"
                               placeholder="Ej: Hamburguesas"
                               value={formData.category || ''}
                               onChange={e => setFormData({...formData, category: e.target.value})}
                            />
                         </div>
                      </div>
                      <div>
                         <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Notas de Preparación</label>
                         <textarea 
                           className="w-full px-6 py-3 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-[#2f4131] h-20 resize-none text-xs"
                           placeholder="Ej: Cocinar por 5 minutos, añadir sal al final..."
                           value={formData.description}
                           onChange={e => setFormData({...formData, description: e.target.value})}
                         />
                      </div>
                   </div>

                   <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Insumos Requeridos</h4>
                        <span className="text-[10px] font-bold text-blue-500">{formData.ingredients.length} items</span>
                      </div>
                      <div className="space-y-2">
                         {formData.ingredients.map(ing => (
                           <div key={ing.ingredient_id} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 group">
                              <div className="flex-1">
                                 <span className="block font-bold text-gray-900 text-sm truncate max-w-[120px]">{ing.name}</span>
                                 <span className="text-[9px] text-gray-400 font-black uppercase">Subtotal: ${(ing.quantity * ing.unit_cost).toFixed(1)}</span>
                              </div>
                              <div className="w-32 flex items-center gap-2">
                                 <input 
                                   type="number" 
                                   step="0.001"
                                   min="0"
                                   className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl font-bold text-gray-900 text-center focus:ring-1 focus:ring-blue-500"
                                   value={ing.quantity}
                                   onChange={e => handleUpdateQuantity(ing.ingredient_id, e.target.value)}
                                 />
                                 <span className="text-[10px] font-black text-gray-400 w-8">{ing.usage_unit}</span>
                              </div>
                              <button 
                                type="button"
                                onClick={() => handleRemoveIngredient(ing.ingredient_id)}
                                className="p-2 text-red-200 hover:text-red-500 transition-colors"
                              >
                                ✕
                              </button>
                           </div>
                         ))}
                         {formData.ingredients.length === 0 && (
                           <div className="py-12 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 text-center text-gray-300 text-xs italic">
                              Agrega insumos desde el panel izquierdo para construir la receta.
                           </div>
                         )}
                      </div>
                   </div>

                   <div className="pt-8 flex gap-3 mt-auto shrink-0">
                      <button 
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-gray-200 transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        className="flex-2 px-10 py-4 bg-[#2f4131] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-green-900/20 hover:scale-105 active:scale-95 transition-all"
                      >
                        {editingRecipe ? 'Guardar Cambios' : 'Crear Receta'}
                      </button>
                   </div>
                </form>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
