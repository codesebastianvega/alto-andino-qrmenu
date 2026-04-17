import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { toast } from '../components/Toast';
import { useAdminIngredients } from '../hooks/useAdminIngredients';
import {
  PageHeader, PrimaryButton, SecondaryButton, Badge,
  FormField, TextInput, SearchInput
} from '../components/admin/ui';
import { useAuth } from '../context/AuthContext';
import { Icon } from '@iconify-icon/react';

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
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'critical' | 'healthy' | 'investment'

  const { ingredients: allIngredients, fetchIngredients } = useAdminIngredients();
  const [searchTerm, setSearchTerm] = useState('');
  const { activeBrand } = useAuth();
  const brandId = activeBrand?.id;

  const [formData, setFormData] = useState({
    name: '', description: '', target_price: 0, ingredients: []
  });

  useEffect(() => { 
    if (brandId) {
      fetchData(); 
      fetchIngredients(); 
    }
  }, [brandId, fetchIngredients]);

  const fetchData = async () => {
    if (!brandId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('recipes')
        .select(`*, recipe_ingredients(id, ingredient_id, quantity, ingredients(name, unit_cost, usage_unit))`)
        .eq('brand_id', brandId)
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

  // Global metrics for Hero Section
  const statsMetrics = useMemo(() => {
    if (!recipes.length) return { avgMargin: 0, totalInvestment: 0, criticalCount: 0, healthyCount: 0, totalCount: recipes.length };
    
    let totalInv = 0;
    let sumMargins = 0;
    let criticals = 0;
    let healthy = 0;

    recipes.forEach(r => {
      const cost = r.total_cost || 0;
      totalInv += cost;
      const m = r.target_price > 0 ? ((r.target_price - cost) / r.target_price) * 100 : 0;
      sumMargins += m;
      if (m < 30) criticals++;
      if (m >= 40) healthy++;
    });

    return {
      avgMargin: sumMargins / recipes.length,
      totalInvestment: totalInv,
      criticalCount: criticals,
      healthyCount: healthy,
      totalCount: recipes.length
    };
  }, [recipes]);

  const displayRecipes = useMemo(() => {
    return recipes.filter(r => {
      const m = r.target_price > 0 ? ((r.target_price - r.total_cost) / r.target_price) * 100 : 0;
      if (activeFilter === 'critical') return m < 30;
      if (activeFilter === 'healthy') return m >= 40;
      if (activeFilter === 'investment') return r.total_cost > (statsMetrics.totalInvestment / recipes.length);
      return true; // 'all'
    });
  }, [recipes, activeFilter, statsMetrics.totalInvestment]);

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
        total_cost: totalCost,
        brand_id: brandId
      };

      if (editingRecipe) {
        const { error } = await supabase.from('recipes').update(recipeData).eq('id', recipeId).eq('brand_id', brandId);
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

      const { data: linkedProducts } = await supabase.from('products').select('id, price').eq('recipe_id', recipeId).eq('brand_id', brandId);
      if (linkedProducts && linkedProducts.length > 0) {
        const productUpdates = linkedProducts.map(p => {
          const pPrice = parseFloat(p.price) || 0;
          const newMargin = pPrice > 0 ? ((pPrice - totalCost) / pPrice) * 100 : 0;
          return supabase.from('products').update({ cost: totalCost, margin: newMargin }).eq('id', p.id).eq('brand_id', brandId);
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
    const { error } = await supabase.from('recipes').delete().eq('id', id).eq('brand_id', brandId);
    if (error) { toast('Error al eliminar'); return; }
    setRecipes(prev => prev.filter(r => r.id !== id));
    toast('Receta eliminada');
  };

  if (loading && recipes.length === 0) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">Cargando recetas…</div>;
  }

  return (
    <div className="p-8 w-full max-w-none mx-auto animate-fadeUp">
      {/* ── Stats Hero Section (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* Total Recipes */}
        <button 
          onClick={() => setActiveFilter('all')}
          className={`glass-glow p-6 rounded-[2.5rem] border transition-all duration-300 text-left group ${
            activeFilter === 'all' 
            ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl shadow-indigo-200 scale-[1.02]' 
            : 'bg-white border-gray-100 text-gray-900 hover:border-indigo-200 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-transform group-hover:scale-110 ${
              activeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
            }`}>
              <Icon icon="heroicons:book-open" className="text-3xl" />
            </div>
            <div>
              <p className={`text-[11px] font-bold uppercase tracking-[0.2em] ${activeFilter === 'all' ? 'text-indigo-100' : 'text-gray-400'}`}>
                Total Recetas
              </p>
              <h4 className="text-3xl font-black">{statsMetrics.totalCount}</h4>
            </div>
          </div>
        </button>

        {/* Investment (High Cost Filter) */}
        <button 
          onClick={() => setActiveFilter('investment')}
          className={`glass-glow p-6 rounded-[2.5rem] border transition-all duration-300 text-left group ${
            activeFilter === 'investment' 
            ? 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-200 scale-[1.02]' 
            : 'bg-white border-gray-100 text-gray-900 hover:border-blue-200 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-transform group-hover:scale-110 ${
              activeFilter === 'investment' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
            }`}>
              <Icon icon="heroicons:banknotes" className="text-3xl" />
            </div>
            <div>
              <p className={`text-[11px] font-bold uppercase tracking-[0.2em] ${activeFilter === 'investment' ? 'text-blue-100' : 'text-gray-400'}`}>
                Inversión Total
              </p>
              <h4 className="text-3xl font-black">
                ${statsMetrics.totalInvestment.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
              </h4>
            </div>
          </div>
        </button>

        {/* Average Margin (Healthy Filter) */}
        <button 
          onClick={() => setActiveFilter('healthy')}
          className={`glass-glow p-6 rounded-[2.5rem] border transition-all duration-300 text-left group ${
            activeFilter === 'healthy' 
            ? 'bg-emerald-600 border-emerald-400 text-white shadow-xl shadow-emerald-200 scale-[1.02]' 
            : 'bg-white border-gray-100 text-gray-900 hover:border-emerald-200 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-transform group-hover:scale-110 ${
              activeFilter === 'healthy' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <Icon icon="heroicons:arrow-trending-up" className="text-3xl" />
            </div>
            <div>
              <p className={`text-[11px] font-bold uppercase tracking-[0.2em] ${activeFilter === 'healthy' ? 'text-emerald-100' : 'text-gray-400'}`}>
                Margen Promedio
              </p>
              <h4 className="text-3xl font-black">{statsMetrics.avgMargin.toFixed(1)}%</h4>
            </div>
          </div>
        </button>

        {/* Alertas Críticas (Critical Filter) */}
        <button 
          onClick={() => setActiveFilter('critical')}
          className={`glass-glow p-6 rounded-[2.5rem] border transition-all duration-300 text-left group ${
            activeFilter === 'critical' 
            ? 'bg-rose-600 border-rose-400 text-white shadow-xl shadow-rose-200 scale-[1.02]' 
            : 'bg-white border-gray-100 text-gray-900 hover:border-rose-200 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-transform group-hover:scale-110 ${
              activeFilter === 'critical' ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-600'
            }`}>
              <Icon icon="heroicons:exclamation-triangle" className="text-3xl" />
            </div>
            <div>
              <p className={`text-[11px] font-bold uppercase tracking-[0.2em] ${activeFilter === 'critical' ? 'text-rose-100' : 'text-gray-400'}`}>
                Alertas Críticas
              </p>
              <div className="flex items-baseline gap-2">
                <h4 className="text-3xl font-black">{statsMetrics.criticalCount}</h4>
                <span className={`text-[10px] font-bold ${activeFilter === 'critical' ? 'text-white/60' : 'text-rose-400'}`}>RECETAS</span>
              </div>
            </div>
          </div>
        </button>
      </div>

      <PageHeader
        badge="Gestión de Cocina"
        title="Recetas & Costos"
        subtitle="Optimiza tu menú con fichas técnicas precisas y márgenes en tiempo real."
      >
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100/80 backdrop-blur-md p-1.5 rounded-[1.25rem] border border-gray-200">
            <button 
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-white shadow-md text-gray-900 border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <ViewGridIcon />
              <span>Cuadrícula</span>
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white shadow-md text-gray-900 border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <ViewListIcon />
              <span>Lista</span>
            </button>
          </div>
          <PrimaryButton 
            onClick={() => handleOpenModal()}
            className="rounded-2xl px-6 py-3 h-auto text-sm font-bold shadow-lg shadow-indigo-100"
          >
            <Icon icon="heroicons:plus-circle" className="text-xl mr-2" />
            Crear Receta
          </PrimaryButton>
        </div>
      </PageHeader>

      {/* ── Active Filter Badge */}
      {activeFilter !== 'all' && (
        <div className="mb-6 flex animate-fadeUp">
          <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-3 border border-indigo-100 shadow-sm">
            <span>Filtro activo: {
              activeFilter === 'critical' ? 'Margen bajo (<30%)' : 
              activeFilter === 'healthy' ? 'Rentables (>40%)' :
              'Mayor Inversión'
            }</span>
            <button onClick={() => setActiveFilter('all')} className="hover:text-indigo-800 transition-colors">
              <Icon icon="heroicons:x-mark" className="text-sm" />
            </button>
          </div>
        </div>
      )}

      {/* ── Recipes View */}
      {viewMode === 'list' ? (
        <div className="glass-glow bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-xl shadow-gray-100/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 border-b border-gray-50">Nombre de Receta</th>
                  <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 border-b border-gray-50">Composición</th>
                  <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 border-b border-gray-50 hidden md:table-cell">Precio Obj.</th>
                  <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 border-b border-gray-50 text-right">Análisis Coste</th>
                  <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 border-b border-gray-50 text-right">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayRecipes.map(recipe => {
                  const m = recipe.target_price > 0 ? ((recipe.target_price - recipe.total_cost) / recipe.target_price) * 100 : 0;
                  return (
                    <tr key={recipe.id} className="group hover:bg-gray-50/80 transition-all duration-300 cursor-default">
                      <td className="px-8 py-6">
                        <div>
                          <p className="text-base font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{recipe.name}</p>
                          <p className="text-[12px] text-gray-400 font-medium mt-1 italic max-w-xs">{recipe.description || 'Sin descripción'}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-wrap gap-2">
                          <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-blue-100">
                            {recipe.recipe_ingredients?.length || 0} Insumos
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 hidden md:table-cell font-black text-gray-500 tabular-nums">
                        {(recipe.target_price || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div>
                          <p className="text-lg font-black text-gray-900 tabular-nums">
                            {(recipe.total_cost || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                          </p>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${m >= 40 ? 'text-emerald-500' : m >= 30 ? 'text-amber-500' : 'text-rose-500'}`}>
                            {m.toFixed(1)}% Margen
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-3 opacity-20 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenModal(recipe)} className="w-10 h-10 flex items-center justify-center text-blue-500 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm">
                             <Icon icon="heroicons:pencil-square" className="text-xl" />
                          </button>
                          <button onClick={() => handleDelete(recipe.id)} className="w-10 h-10 flex items-center justify-center text-rose-500 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm">
                             <Icon icon="heroicons:trash" className="text-xl" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {displayRecipes.map(recipe => {
            const ingredients = recipe.recipe_ingredients || [];
            const m = recipe.target_price > 0 ? ((recipe.target_price - recipe.total_cost) / recipe.target_price) * 100 : 0;
            
            return (
              <div key={recipe.id}
                className="glass-glow bg-white rounded-[2rem] border border-gray-100 p-6 flex flex-col group hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-100/40 transition-all duration-500 relative overflow-hidden animate-fadeUp">
                
                {/* ── Status Indicator */}
                <div className={`absolute top-0 right-8 px-4 py-1.5 rounded-b-[1rem] text-[9px] font-black uppercase tracking-widest text-white shadow-lg ${
                    m >= 45 ? 'bg-emerald-500 shadow-emerald-100' : 
                    m >= 30 ? 'bg-amber-400 shadow-amber-100' : 
                    'bg-rose-500 shadow-rose-100'
                  }`}>
                  {m >= 45 ? 'Rentable' : m >= 30 ? 'Medio' : 'Crítico'}
                </div>

                <div className="mb-6 pt-2">
                  <h3 className="text-lg font-black text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight truncate">
                    {recipe.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] bg-indigo-50 px-2 py-0.5 rounded-md">
                      {ingredients.length} items
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-8 flex-1">
                  {ingredients.slice(0, 3).map(ri => (
                    <div key={ri.id} className="flex justify-between items-center bg-gray-50/50 group-hover:bg-white border border-transparent group-hover:border-gray-100 rounded-xl px-3 py-2 transition-all shrink-0">
                      <span className="text-[12px] text-gray-600 font-bold truncate max-w-[120px]">{ri.ingredients?.name}</span>
                      <span className="text-[10px] text-gray-400 font-black tabular-nums">×{ri.quantity}</span>
                    </div>
                  ))}
                  {ingredients.length > 3 && (
                    <p className="text-[9px] text-gray-300 font-black text-center pt-1 uppercase tracking-[0.2em]">+ {ingredients.length - 3} adicionales</p>
                  )}
                  {ingredients.length === 0 && (
                    <div className="py-6 bg-gray-50/30 rounded-[1.5rem] border border-dashed border-gray-200 flex flex-col items-center justify-center grayscale opacity-60">
                      <Icon icon="heroicons:beaker" className="text-2xl mb-1" />
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider">Sin insumos</p>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-dashed border-gray-100">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Precio Obj.</p>
                      <p className="text-sm font-black text-gray-300 line-through decoration-rose-500/10 tabular-nums">
                        ${(recipe.target_price || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${m >= 30 ? 'text-indigo-400' : 'text-rose-400'}`}>Costo Producción</p>
                      <p className="text-2xl font-black text-gray-900 tabular-nums tracking-tighter">
                        ${(recipe.total_cost || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => handleOpenModal(recipe)}
                      className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-indigo-100">
                      <Icon icon="heroicons:pencil-square" className="text-base" />
                      Ficha
                    </button>
                    <button onClick={() => handleDelete(recipe.id)}
                      className="w-11 h-11 flex items-center justify-center text-rose-500 bg-rose-50/50 rounded-xl hover:bg-rose-600 hover:text-white transition-all">
                      <Icon icon="heroicons:trash" className="text-xl" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {displayRecipes.length === 0 && recipes.length > 0 && (
        <div className="mt-12 py-32 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 animate-fadeUp">
          <Icon icon="heroicons:funnel" className="text-5xl mb-4 opacity-20" />
          <p className="text-base font-black uppercase tracking-widest opacity-40">No hay resultados para este filtro</p>
          <button onClick={() => setActiveFilter('all')} className="mt-4 text-indigo-600 font-bold hover:underline">Ver todas las recetas</button>
        </div>
      )}

      {recipes.length === 0 && (
        <div className="mt-12 py-40 bg-white glass-glow rounded-[4rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300 shadow-2xl shadow-gray-50/50 animate-fadeUp">
          <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mb-6">
            <Icon icon="heroicons:book-open" className="text-5xl" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Recetario Vacío</h3>
          <p className="text-base font-medium max-w-sm text-center">Comienza creando tu primera ficha técnica para controlar los costos de tu cocina.</p>
          <PrimaryButton onClick={() => handleOpenModal()} className="mt-8 rounded-2xl px-10 py-4 h-auto text-sm font-black shadow-xl shadow-indigo-100 uppercase tracking-widest">
            Comenzar Ahora
          </PrimaryButton>
        </div>
      )}

      {/* ── MODERN MODAL EDITOR (Vision OS Redesign) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-8 overflow-y-auto animate-fadeUp">
          <div className="bg-white/95 backdrop-blur-xl rounded-[3.5rem] w-full max-w-[98vw] 2xl:max-w-7xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col my-auto border border-white/40">

            {/* Modal header with cost/margin chips */}
            <div className="flex items-center justify-between px-10 py-8 border-b border-gray-100 shrink-0 bg-white/50">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 shadow-inner">
                  <Icon icon={editingRecipe ? "heroicons:clipboard-document-check" : "heroicons:plus-circle"} className="text-3xl" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                    {editingRecipe ? 'Editar Ficha Técnica' : 'Nueva Receta'}
                  </h3>
                  <p className="text-sm text-gray-400 font-bold mt-1 uppercase tracking-widest">
                    {editingRecipe ? editingRecipe.name : 'Configuración de producción'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-12">
                <div className="hidden lg:block">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right mb-1">Costo Producción</p>
                  <p className="text-3xl font-black text-gray-900 tabular-nums tracking-tighter">
                    {totalCost.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="hidden lg:block h-10 w-[1px] bg-gray-100" />
                <div className="hidden lg:block">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right mb-1">Margen Estimado</p>
                  <p className={`text-3xl font-black tabular-nums tracking-tighter ${margin >= 40 ? 'text-emerald-500' : margin >= 30 ? 'text-amber-500' : 'text-rose-500'}`}>
                    {margin.toFixed(1)}%
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)}
                  className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl transition-all border border-gray-100">
                  <Icon icon="heroicons:x-mark" className="text-2xl" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0 bg-white/30">
              {/* ── Left: Ingredient catalog (28%) */}
              <div className="md:w-[28%] border-r border-gray-100 flex flex-col overflow-hidden bg-gray-50/20 backdrop-blur-sm">
                <div className="px-8 py-6 border-b border-gray-100 shrink-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Catálogo de Insumos</p>
                  <SearchInput 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    placeholder="Buscar ingrediente..." 
                    className="rounded-2xl border-gray-200"
                  />
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                  {filteredIngredients.map(ing => (
                    <button key={ing.id} type="button" onClick={() => handleAddIngredient(ing)}
                      className="w-full p-4 bg-white border border-gray-100 rounded-[1.5rem] text-left hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-50 transition-all flex justify-between items-center group/ing">
                      <div className="min-w-0 pr-4">
                        <p className="text-sm font-black text-gray-900 truncate uppercase tracking-tight">{ing.name}</p>
                        <p className="text-[11px] text-gray-400 font-bold mt-1 uppercase tracking-widest">
                          ${ing.unit_cost?.toLocaleString('es-CO', { maximumFractionDigits: 1 })} / {ing.usage_unit}
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 opacity-0 group-hover/ing:opacity-100 transition-all group-hover/ing:scale-110 shadow-sm shrink-0">
                        <Icon icon="heroicons:plus-small" className="text-2xl" />
                      </div>
                    </button>
                  ))}
                  {filteredIngredients.length === 0 && (
                    <div className="py-12 text-center flex flex-col items-center opacity-40">
                      <Icon icon="heroicons:magnifying-glass" className="text-4xl mb-2" />
                      <p className="text-[11px] font-black uppercase tracking-widest">Sin resultados</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Right: Recipe form (72%) */}
              <form onSubmit={handleSave} className="md:w-[72%] flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto px-10 py-8 space-y-8">
                  {/* Basic Info Bento Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3">
                       <FormField label="Nombre de la Receta" className="!mb-0">
                         <TextInput 
                           required 
                           value={formData.name} 
                           onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                           placeholder="Ej. Hamburguesa Wagyu Especial" 
                           className="text-xl font-black rounded-[1.5rem] h-14 border-gray-200 focus:border-indigo-500 uppercase tracking-tight"
                         />
                       </FormField>
                    </div>
                    <div>
                      <FormField label="Precio Venta Sugerido" className="!mb-0">
                        <div className="relative group/price">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-black text-lg group-focus-within/price:text-indigo-500 transition-colors">$</span>
                          <TextInput 
                            type="number" 
                            value={formData.target_price} 
                            onChange={e => setFormData(prev => ({ ...prev, target_price: Number(e.target.value) }))} 
                            className="pl-10 font-black text-gray-900 rounded-[1.5rem] h-14 border-gray-200 focus:border-indigo-500"
                          />
                        </div>
                      </FormField>
                    </div>
                    <div className="lg:col-span-4">
                      <FormField label="Descripción & Notas Técnicas">
                        <textarea 
                          value={formData.description} 
                          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} 
                          placeholder="Notas de preparación, temperatura de cocción, emplatado..." 
                          className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm font-medium focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none transition-all min-h-[80px]"
                        />
                      </FormField>
                    </div>
                  </div>

                  {/* Ingredient Composition Area */}
                  <div className="flex flex-col flex-1 min-h-[50vh]">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#2f4131]/10 text-[#2f4131] rounded-xl flex items-center justify-center">
                          <Icon icon="heroicons:beaker" className="text-xl" />
                        </div>
                        <div>
                          <p className="text-[12px] font-black uppercase tracking-[0.2em] text-[#2f4131]">Composición del Plato</p>
                          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Define los ingredientes y proporciones exactas</p>
                        </div>
                      </div>
                      <div className="bg-indigo-50 text-indigo-600 px-5 py-1.5 rounded-full text-[11px] font-black border border-indigo-100 uppercase tracking-widest">
                        {formData.ingredients.length} Ingredientes
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {formData.ingredients.map(ing => (
                        <div key={ing.ingredient_id} className="group/item flex flex-col p-6 bg-white border border-gray-100 shadow-sm rounded-[2rem] hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-50 transition-all duration-300 animate-fadeUp">
                          <div className="flex items-start justify-between mb-6">
                            <div className="min-w-0">
                              <p className="text-base font-black text-gray-900 leading-tight truncate pr-6 uppercase tracking-tight">{ing.name}</p>
                              <div className="flex items-center gap-2 mt-1.5 opacity-60">
                                <Icon icon="heroicons:currency-dollar" className="text-sm" />
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Unit: ${ing.unit_cost?.toFixed(1)} / {ing.usage_unit}</p>
                              </div>
                            </div>
                            <button type="button" onClick={() => handleRemoveIngredient(ing.ingredient_id)}
                              className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all group-hover/item:opacity-100 opacity-60">
                              <Icon icon="heroicons:trash" className="text-xl" />
                            </button>
                          </div>
                          
                          <div className="flex items-end justify-between pt-6 border-t border-gray-50">
                            <div>
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-2">Proporción</label>
                              <div className="flex items-center gap-3">
                                <input 
                                  type="number" 
                                  step="any" 
                                  min="0" 
                                  value={ing.quantity}
                                  onChange={e => handleUpdateQuantity(ing.ingredient_id, e.target.value)}
                                  className="w-[100px] h-12 px-4 bg-gray-50 border border-gray-100 rounded-[1.25rem] text-sm font-black text-center focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none transition-all" 
                                />
                                <span className="text-[11px] text-gray-500 font-black uppercase tracking-widest">{ing.usage_unit}</span>
                              </div>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] uppercase font-black text-gray-300 tracking-[0.2em] mb-1">Subtotal</p>
                               <div className="bg-indigo-50/50 px-4 py-2 rounded-2xl border border-indigo-100/50">
                                 <p className="text-base font-black text-indigo-700 tabular-nums tracking-tight">
                                   ${Math.round(ing.quantity * ing.unit_cost).toLocaleString('es-CO')}
                                 </p>
                               </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {formData.ingredients.length === 0 && (
                      <div className="flex-1 min-h-[350px] flex flex-col items-center justify-center border-4 border-dashed border-gray-100 rounded-[3.5rem] text-center p-12 group/empty bg-gray-50/30">
                        <div className="w-20 h-20 bg-white border border-gray-100 rounded-[2rem] flex items-center justify-center mb-6 group-hover/empty:scale-110 group-hover/empty:rotate-3 transition-all duration-500 shadow-sm">
                           <Icon icon="heroicons:beaker" className="text-4xl text-indigo-300" />
                        </div>
                        <h4 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Receta sin Composición</h4>
                        <p className="text-sm text-gray-400 max-w-[280px] font-bold uppercase tracking-widest leading-relaxed mt-2 opacity-60">Selecciona ingredientes del catálogo lateral para armar tu ficha técnica.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="px-10 py-8 border-t border-gray-100 flex gap-4 shrink-0 bg-white/50 backdrop-blur-md">
                  <SecondaryButton 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="flex-1 h-14 rounded-[1.5rem] border-2 border-gray-100 text-sm font-black uppercase tracking-widest"
                  >
                    Descartar
                  </SecondaryButton>
                  <PrimaryButton 
                    type="submit" 
                    className="flex-[2] h-14 rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-100"
                  >
                    {editingRecipe ? 'Actualizar Ficha Técnica' : 'Guardar Nueva Receta'}
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
