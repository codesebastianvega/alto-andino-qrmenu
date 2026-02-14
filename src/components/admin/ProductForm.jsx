import { useState, useEffect } from 'react';
import { useMenuData } from '../../context/MenuDataContext';

export default function ProductForm({ product, categories, recipes = [], onSave, onCancel }) {
  const { modifiers: modifierGroupsData } = useMenuData(); // modifiers is { groupName: [items] }
  const availableGroups = Object.keys(modifierGroupsData || {});

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost: '', 
    category_id: '',
    stock_status: 'in',
    image_url: '',
    tags: [],
    is_active: true,
    is_addon: false,
    variants: [],
    modifier_groups: [],
    config_options: {},
    recipe_id: null,
  });

  const [tagInput, setTagInput] = useState('');
  const [showRecipeModal, setShowRecipeModal] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        cost: product.cost || '', 
        category_id: product.category_id || '',
        stock_status: product.stock_status || 'in',
        image_url: product.image_url || '',
        tags: product.tags || [],
        is_active: product.is_active ?? true,
        is_addon: product.is_addon || false,
        variants: product.variants || [],
        modifier_groups: product.modifier_groups || [],
        config_options: product.config_options || {},
        recipe_id: product.recipe_id || null,
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Tags Management
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // Modifier Groups Management
  const toggleModifierGroup = (group) => {
    setFormData(prev => {
      const current = prev.modifier_groups || [];
      if (current.includes(group)) {
        return { ...prev, modifier_groups: current.filter(g => g !== group) };
      }
      return { ...prev, modifier_groups: [...current, group] };
    });
  };

  // Variants Management
  const handleAddVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        { key: Date.now().toString(), name: '', price: 0, stock_status: 'in' }
      ]
    }));
  };

  const updateVariant = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const removeVariant = (index) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  // Config Options Logic
  const updateConfig = (key, value) => {
      setFormData(prev => {
          const currentConfig = prev.config_options || {};
          const newConfig = { ...currentConfig, [key]: value };
          if (value === '' || value === null || value === undefined) {
              delete newConfig[key];
          }
          return { ...prev, config_options: newConfig };
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.category_id) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    onSave({
      ...formData,
      price: parseFloat(formData.price),
      cost: parseFloat(formData.cost) || 0,
    });
  };

  const currentConfig = formData.config_options || {};
  
  // Financial Metrics
  const priceNum = parseFloat(formData.price) || 0;
  const costNum = parseFloat(formData.cost) || 0;
  const profit = priceNum - costNum;
  const margin = priceNum > 0 ? (profit / priceNum) * 100 : 0;

  // Conditional Sections
  const selectedCategory = categories.find(c => c.id === formData.category_id);
  const catSlug = (selectedCategory?.slug || '').toLowerCase();
  const isDrink = catSlug.includes('cafe') || catSlug.includes('smoothie') || catSlug.includes('bebida') || catSlug.includes('jugo');

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-[#FAF7F2] rounded-[40px] max-w-6xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-white/20">
        
        {/* Header */}
        <div className="bg-[#2f4131] px-10 py-8 flex justify-between items-center text-white shrink-0">
          <div>
            <h2 className="text-2xl font-black tracking-tight">
              {product ? 'Refinar Producto' : 'Crear Nuevo Producto'}
            </h2>
            <p className="text-[10px] text-white/50 uppercase tracking-widest font-black mt-1">Sincronización de Menú e Inventario</p>
          </div>
          <button onClick={onCancel} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          <div className="lg:col-span-2 space-y-10">
            {/* 1. Basic Info */}
            <section className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 text-lg">📝</div>
                 <div>
                    <h3 className="text-lg font-black text-gray-900 leading-tight">Información del Producto</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Atributos comerciales base</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nombre Público</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Ej. Bowl de Acai Amazónico"
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#2f4131] transition-all text-gray-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Categoría</label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    required
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#2f4131] outline-none font-bold"
                  >
                    <option value="">Seleccionar...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Disponibilidad</label>
                   <select
                     name="stock_status"
                     value={formData.stock_status}
                     onChange={handleChange}
                     className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 outline-none font-bold"
                   >
                     <option value="in">Disponible</option>
                     <option value="out">Agotado</option>
                   </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Visibilidad en Menú Público</label>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                    className={`w-full px-6 py-5 rounded-2xl font-black text-sm transition-all flex items-center justify-between ${
                      formData.is_active 
                        ? 'bg-green-50 border-2 border-green-500 text-green-900' 
                        : 'bg-gray-100 border-2 border-gray-300 text-gray-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-6 rounded-full transition-all relative ${formData.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_active ? 'left-7' : 'left-1'}`}></div>
                      </div>
                      <span>{formData.is_active ? 'ACTIVO - Visible en menú público' : 'INACTIVO - Oculto del menú público'}</span>
                    </div>
                    <span className="text-2xl">{formData.is_active ? '👁️' : '🚫'}</span>
                  </button>
                  <p className="mt-2 text-[9px] text-gray-400 font-medium leading-relaxed italic ml-1">
                    {formData.is_active 
                      ? 'Este producto aparecerá en el menú público. Si está agotado, se mostrará pero no se podrá agregar al carrito.' 
                      : 'Este producto NO aparecerá en el menú público, independientemente de su disponibilidad.'}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Descripción Tentadora</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Describe los sabores, texturas y porqué deberían ordenarlo..."
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#2f4131] outline-none resize-none font-medium text-sm text-gray-600 leading-relaxed"
                  />
                </div>
              </div>
            </section>

            {/* 2. Recipe Linking */}
            <section className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 text-lg">👩‍🍳</div>
                  <div>
                     <h3 className="text-lg font-black text-gray-900 leading-tight">Configuración de Receta</h3>
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Enlace con el inventario técnico</p>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, recipe_id: null })}
                      className={`p-5 rounded-[24px] border-2 text-left transition-all relative overflow-hidden ${!formData.recipe_id ? 'border-[#2f4131] bg-green-50/10' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                    >
                      <span className={`block font-black text-sm mb-1 ${!formData.recipe_id ? 'text-[#2f4131]' : 'text-gray-400'}`}>Sin Receta</span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase">Costo manual</span>
                    </button>
                    {recipes.map(recipe => (
                      <button
                        key={recipe.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, recipe_id: recipe.id, cost: recipe.total_cost || 0 })}
                        className={`p-5 rounded-[24px] border-2 text-left transition-all relative overflow-hidden ${formData.recipe_id === recipe.id ? 'border-blue-500 bg-blue-50/20' : 'border-gray-100 bg-white hover:border-blue-100'}`}
                      >
                        <span className={`block font-black text-sm mb-1 truncate ${formData.recipe_id === recipe.id ? 'text-blue-900' : 'text-gray-900'}`}>{recipe.name}</span>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[9px] text-gray-400 font-bold uppercase">Base: ${recipe.total_cost?.toLocaleString()}</span>
                          {formData.recipe_id === recipe.id && <span className="text-blue-500 font-black text-[10px]">✔</span>}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="p-6 bg-neutral-900 rounded-[24px] text-white flex items-center justify-between shadow-xl">
                      <div className="space-y-1">
                        <label className="block text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Costo de Producción Actual</label>
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-500 font-bold text-xl">$</span>
                          <input
                            type="number"
                            name="cost"
                            value={formData.cost}
                            onChange={handleChange}
                            readOnly={!!formData.recipe_id}
                            className={`bg-transparent border-none p-0 text-3xl font-black w-32 focus:ring-0 ${formData.recipe_id ? 'text-blue-400 cursor-not-allowed' : 'text-white'}`}
                          />
                        </div>
                        {formData.recipe_id && <p className="text-[8px] text-blue-400/60 font-black uppercase tracking-widest mt-1">Sincronizado con Receta Técnica</p>}
                      </div>
                      <div className="h-12 w-px bg-white/10" />
                      <div className="text-right">
                         <span className="block text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Precio Sugerido (35% Costo)</span>
                         <span className="text-2xl font-black text-gray-300">${(costNum / 0.35).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                  </div>
               </div>
            </section>

            {/* 3. Personalization */}
            <section className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 text-lg">⚙️</div>
                    <div>
                        <h3 className="text-lg font-black text-gray-900 leading-tight">Canales de Personalización</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Modificadores y experiencia de compra</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                   {availableGroups.map(group => {
                       const isSelected = (formData.modifier_groups || []).includes(group);
                       return (
                         <button
                           key={group}
                           type="button"
                           onClick={() => toggleModifierGroup(group)}
                           className={`p-4 rounded-2xl text-left border-2 transition-all flex justify-between items-center ${
                             isSelected ? 'bg-purple-50 border-purple-200 text-purple-900 shadow-sm' : 'bg-gray-50 border-transparent text-gray-400 hover:border-gray-200'
                           }`}
                         >
                           <span className="text-[10px] font-black uppercase tracking-tight truncate pr-2">{group.replace(/-/g, ' ')}</span>
                           <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] border ${isSelected ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-200 text-transparent'}`}>✓</span>
                         </button>
                       );
                   })}
                </div>
            </section>
          </div>

            {/* Sidebar Column */}
            <div className="space-y-8">
              {/* Recipe Connection Card */}
              <div className="bg-blue-50/50 rounded-[32px] p-8 border border-blue-100/50">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Ficha Técnica</h3>
                    <p className="text-[10px] text-gray-500 font-medium mt-1">Costeo automático por receta.</p>
                  </div>
                  {!formData.recipe_id ? (
                    <button 
                      type="button"
                      onClick={() => setShowRecipeModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                    >
                      Vincular
                    </button>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, recipe_id: null, cost: 0})}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-200 transition-all font-black"
                    >
                      Desvincular
                    </button>
                  )}
                </div>

                {formData.recipe_id ? (
                  <div className="bg-white rounded-2xl p-6 border border-blue-200 flex justify-between items-center">
                    <div>
                      <span className="block text-[8px] font-black text-blue-500 uppercase mb-1">Vinculado a:</span>
                      <span className="font-bold text-gray-900 text-sm leading-tight block">
                        {recipes.find(r => r.id === formData.recipe_id)?.name || 'Cargando...'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[8px] font-black text-gray-400 uppercase mb-1">Costo Calc.</span>
                      <span className="font-black text-[#2f4131] text-lg">
                        ${recipes.find(r => r.id === formData.recipe_id)?.total_cost?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-[10px] text-gray-400 italic font-medium">
                    Sin ficha técnica vinculada.
                  </div>
                )}
              </div>

              {/* Commercial Card */}
              <div className="bg-[#2f4131] rounded-[32px] p-8 text-white shadow-xl shadow-green-900/40 sticky top-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-8 ml-1">Configuración Comercial</h3>
                
                <div className="space-y-8">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-3 ml-1">Precio al Público (COP)</label>
                    <div className="relative">
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 text-white/30 font-black text-2xl">$</span>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        className="bg-transparent border-none p-0 pl-7 text-5xl font-black w-full focus:ring-0 placeholder:text-white/10"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/10">
                    <div className="flex justify-between items-end mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Margen de Ganancia</span>
                      <span className={`text-4xl font-black ${margin > 40 ? 'text-green-400' : 'text-amber-400'}`}>{margin.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-700 ${margin > 40 ? 'bg-green-400' : 'bg-amber-400'}`} 
                        style={{ width: `${Math.min(100, Math.max(0, margin))}%` }}
                      ></div>
                    </div>
                    <p className="mt-4 text-[10px] font-medium text-white/40 leading-relaxed italic text-center">Basado en el costo base de insumos y el precio de venta actual.</p>
                  </div>

                  <div className="space-y-4 pt-4">
                    <button
                      type="submit"
                      className="w-full py-5 bg-white text-[#2f4131] rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:scale-105 active:scale-95 transition-all"
                    >
                      {product ? 'Sincronizar Cambios' : 'Crear Producto'}
                    </button>
                    <button
                      type="button"
                      onClick={onCancel}
                      className="w-full py-5 bg-white/10 text-white/60 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-white/20 transition-all font-black"
                    >
                      Regresar sin Guardar
                    </button>
                  </div>
                </div>
              </div>

              {/* Media Card */}
              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50 overflow-hidden">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex justify-between items-center">
                  Imagen Visual
                  <span className="text-[8px] bg-amber-100 text-amber-600 px-2 py-1 rounded-full uppercase font-black">Recomendado</span>
                </h3>
                
                <div className="aspect-square bg-gray-50 rounded-[28px] overflow-hidden border-2 border-dashed border-gray-100 mb-6 flex items-center justify-center relative group">
                  {formData.image_url ? (
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="text-center text-gray-300">
                      <span className="text-4xl block mb-2">📸</span>
                      <span className="text-[9px] font-black uppercase tracking-widest">Previsualización</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">URL de la Imagen</label>
                    <input
                      type="url"
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleChange}
                      placeholder="https://ejemplo.com/foto.jpg"
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 text-xs focus:ring-2 focus:ring-[#2f4131] outline-none placeholder:text-gray-200"
                    />
                </div>
                <p className="mt-4 text-[9px] text-gray-400 font-medium leading-relaxed italic">Atención: El enlace debe ser directo a la imagen.</p>
              </div>
            </div>
        </form>

        {/* Recipe Selection Modal */}
        {showRecipeModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-6">
            <div className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
              <div className="px-10 py-8 bg-[#2f4131] text-white">
                <h3 className="text-2xl font-black tracking-tight">Vincular Receta</h3>
                <p className="text-white/60 text-sm font-medium">Selecciona la ficha técnica para este producto.</p>
              </div>
              
              <div className="p-8 max-h-[60vh] overflow-y-auto space-y-3">
                {recipes.map(recipe => (
                  <button
                    key={recipe.id}
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        recipe_id: recipe.id,
                        cost: recipe.total_cost || 0
                      });
                      setShowRecipeModal(false);
                    }}
                    className="w-full p-6 text-left border border-gray-100 rounded-2xl bg-gray-50 hover:border-blue-300 hover:bg-white transition-all flex justify-between items-center group"
                  >
                    <div>
                      <span className="block font-bold text-gray-900 text-sm">{recipe.name}</span>
                      <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Costo Base: ${recipe.total_cost?.toLocaleString()} COP</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-500 opacity-0 group-hover:opacity-100 font-black text-[10px] uppercase tracking-widest transition-opacity translate-x-2 group-hover:translate-x-0 transition-transform duration-300">Seleccionar</span>
                      <span className="text-blue-500">→</span>
                    </div>
                  </button>
                ))}
                
                {recipes.length === 0 && (
                  <div className="text-center py-16">
                    <span className="text-4xl block mb-4">📂</span>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">No hay recetas disponibles</p>
                    <p className="text-[10px] text-gray-400 mt-2">Crea primero una receta técnica en el panel de inventario.</p>
                  </div>
                )}
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setShowRecipeModal(false)}
                  className="w-full py-4 bg-white text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[11px] border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  Regresar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
