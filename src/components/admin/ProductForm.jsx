import { useState, useEffect } from 'react';
import { useMenuData } from '../../context/MenuDataContext';

export default function ProductForm({ product, categories, onSave, onCancel }) {
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
    variants: [],
    modifier_groups: [],
    config_options: {},
  });

  const [tagInput, setTagInput] = useState('');

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
        variants: product.variants || [],
        modifier_groups: product.modifier_groups || [],
        config_options: product.config_options || {},
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
      <div className="bg-[#FAF7F2] rounded-3xl max-w-6xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-white/20">
        
        {/* Sticky Header */}
        <div className="bg-[#2f4131] px-8 py-5 flex justify-between items-center text-white">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {product ? 'Refinar Producto' : 'Crear Nuevo Producto'}
            </h2>
            <p className="text-xs text-white/70 uppercase tracking-widest mt-0.5">Gestión de Inventario y Experiencia</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* LEFT: MAIN CONTENT */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* 1. Basic Information */}
            <section className="space-y-5">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">01</div>
                 <h3 className="text-sm font-black uppercase tracking-widest text-[#2f4131]">Información Esencial</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nombre Comercial</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Ej. Latte de Vainilla"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#2f4131] transition-all text-gray-800 font-medium"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Categoría</label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#2f4131] outline-none font-medium"
                  >
                    <option value="">Seleccionar...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                   <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Disponibilidad</label>
                   <select
                     name="stock_status"
                     value={formData.stock_status}
                     onChange={handleChange}
                     className={`w-full px-4 py-3 border-none rounded-xl focus:ring-2 outline-none font-medium transition-colors ${
                         formData.stock_status === 'out' ? 'bg-red-50 text-red-700' : 
                         formData.stock_status === 'low' ? 'bg-amber-50 text-amber-700' : 
                         'bg-gray-50'
                     }`}
                   >
                     <option value="in">Disponible ahora</option>
                     <option value="low">Pocas unidades</option>
                     <option value="out">Agotado temporalmente</option>
                   </select>
                </div>

                {/* Costs & Margins Dashboard */}
                <div className="md:col-span-2 bg-neutral-900 rounded-2xl p-6 text-white grid grid-cols-1 md:grid-cols-3 gap-6 shadow-xl">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest">Precio Venta</label>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500 font-bold">$</span>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleChange}
                          required
                          className="bg-transparent border-none p-0 text-xl font-black w-full focus:ring-0"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 border-l border-white/10 pl-6">
                      <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest">Costo Base (Insumos)</label>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500 font-bold">$</span>
                        <input
                          type="number"
                          name="cost"
                          value={formData.cost}
                          onChange={handleChange}
                          className="bg-transparent border-none p-0 text-xl font-black w-full focus:ring-0 text-blue-400"
                        />
                      </div>
                    </div>

                    <div className="pl-6 border-l border-white/10 flex flex-col justify-center">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Rentabilidad</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                margin > 50 ? 'bg-green-500/20 text-green-400' :
                                margin > 30 ? 'bg-amber-500/20 text-amber-400' :
                                'bg-red-500/20 text-red-400'
                            }`}>
                                {margin > 40 ? 'SALUDABLE' : margin > 20 ? 'OK' : 'BAJA'}
                            </span>
                        </div>
                        <span className="text-2xl font-black">{margin.toFixed(0)}% <span className="text-xs text-gray-400 font-normal">Margen</span></span>
                    </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Descripción para el Cliente</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#2f4131] outline-none resize-none font-medium"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">URL Imagen</label>
                  <input
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleChange}
                    placeholder="/img/products/..."
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#2f4131] outline-none font-medium"
                  />
                </div>
              </div>
            </section>

            {/* 2. Variants / Sizes */}
            <section className="space-y-5">
               <div className="flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">02</div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#2f4131]">Variantes y Tamaños</h3>
                 </div>
                 <button type="button" onClick={handleAddVariant} className="text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 shadow-md">
                    + Añadir Variación
                 </button>
               </div>

               {formData.variants.length === 0 ? (
                   <div className="bg-white/40 border-2 border-dashed border-gray-200 rounded-2xl py-8 text-center text-gray-400 text-sm italic">
                       Sin variaciones (Producto único)
                   </div>
               ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {formData.variants.map((variant, index) => (
                       <div key={variant.key || index} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 group">
                         <div className="flex-1 space-y-3">
                           <div>
                              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Etiqueta (Ej: Grande)</label>
                              <input
                                type="text"
                                value={variant.name}
                                onChange={(e) => updateVariant(index, 'name', e.target.value)}
                                className="w-full bg-gray-50 border-none rounded-lg py-2 px-3 text-sm font-bold"
                              />
                           </div>
                           <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-gray-400">$</span>
                              <input
                                type="number"
                                value={variant.price}
                                onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value))}
                                className="w-full bg-gray-50 border-none rounded-lg py-2 px-3 text-sm font-black text-[#2f4131]"
                              />
                           </div>
                         </div>
                         <button 
                            type="button" 
                            onClick={() => removeVariant(index)} 
                            className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-400 rounded-full hover:bg-red-500 hover:text-white transition-all transform hover:rotate-90"
                         >✕</button>
                       </div>
                     ))}
                   </div>
               )}
            </section>

            {/* 3. Modifier Groups */}
            <section className="space-y-5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">03</div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#2f4131]">Opciones de Personalización</h3>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-2 md:grid-cols-3 gap-3">
                   {availableGroups.map(group => {
                       const isSelected = (formData.modifier_groups || []).includes(group);
                       return (
                         <label key={group} className={`relative p-3 rounded-xl cursor-pointer border-2 transition-all flex flex-col justify-center items-center text-center gap-2 ${
                             isSelected ? 'bg-purple-900 border-purple-900 text-white shadow-lg scale-[1.02]' : 'bg-gray-50 border-transparent text-gray-500 hover:border-purple-200'
                         }`}>
                             <input
                                 type="checkbox"
                                 checked={isSelected}
                                 onChange={() => toggleModifierGroup(group)}
                                 className="sr-only"
                             />
                             <span className="text-[10px] font-black uppercase tracking-tighter leading-none break-words w-full">
                                 {group.replace(/-/g, ' ')}
                             </span>
                             {isSelected && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white animate-pulse"></div>}
                         </label>
                       );
                   })}
                </div>
            </section>

          </div>

          {/* RIGHT: ADVANCED CONFIG & ACTIONS */}
          <div className="space-y-8">
            
            {/* Conditional Drinking Config */}
            {isDrink && (
                <div className="bg-blue-900 text-white p-6 rounded-3xl shadow-xl shadow-blue-900/10 space-y-6">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">☕</span>
                        <h3 className="text-xs font-black uppercase tracking-widest">Lógica de Bebidas</h3>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-3 bg-white/10 rounded-2xl">
                             <div>
                                 <span className="block text-[10px] font-bold uppercase tracking-wider">Habilitar Leche</span>
                                 <span className="text-[9px] text-white/50 block">Muestra tipos de leches</span>
                             </div>
                             <div 
                                onClick={() => updateConfig('allowMilk', !currentConfig.allowMilk)}
                                className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors ${currentConfig.allowMilk ? 'bg-green-400' : 'bg-white/20'}`}
                             >
                                <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow transition-transform ${currentConfig.allowMilk ? 'translate-x-5' : 'translate-x-0'}`} />
                             </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">Requerimiento</label>
                            <select
                                value={currentConfig.milk_policy || 'optional'}
                                onChange={(e) => updateConfig('milk_policy', e.target.value)}
                                className="w-full bg-white/10 border-none rounded-xl text-xs font-bold py-3 px-4 focus:ring-0 focus:bg-white/20 transition-all text-white"
                            >
                                <option className="bg-blue-900" value="optional">Opcional</option>
                                <option className="bg-blue-900" value="required">Obligatorio</option>
                                <option className="bg-blue-900" value="none">Desactivado</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Tag Management */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col min-h-[220px]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    🏷️ Etiquetas de Búsqueda
                </h3>
                <div className="group relative">
                    <span className="cursor-help text-gray-300 hover:text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </span>
                    {/* Tooltip */}
                    <div className="absolute right-0 bottom-full mb-2 w-48 p-3 bg-gray-900 text-white text-[9px] rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20 font-medium shadow-2xl">
                        <p className="font-bold border-b border-white/10 pb-1 mb-1 text-blue-400 uppercase">Tags Reutilizables</p>
                        No necesitas crearlos cada vez. Usa palabras clave para filtrar en el buscador y organizar categorías dinámicas.
                    </div>
                </div>
              </div>

               <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    className="flex-1 bg-gray-50 border-none rounded-xl py-3 px-3 text-xs font-medium outline-none"
                    placeholder="Ej: nuevo"
                  />
                  <button type="button" onClick={handleAddTag} className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center font-bold shadow-lg hover:scale-105 transition-transform">+</button>
               </div>
               
               <div className="flex flex-wrap gap-2 flex-1 items-start content-start">
                 {formData.tags.map(tag => (
                   <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2f4131]/10 text-[#2f4131] rounded-lg text-[9px] font-black uppercase tracking-tighter border border-[#2f4131]/10">
                     {tag}
                     <button type="button" onClick={() => handleRemoveTag(tag)} className="text-[#2f4131]/40 hover:text-red-500">✕</button>
                   </span>
                 ))}
                 {formData.tags.length === 0 && <span className="text-[10px] text-gray-300 italic">Sin etiquetas asignadas...</span>}
               </div>

               {/* Quick Tags Suggestions */}
               <div className="mt-6 pt-6 border-t border-gray-100">
                  <span className="text-[8px] font-black text-gray-400 uppercase mb-3 block tracking-widest">Sugerencias Rápidas</span>
                  <div className="flex flex-wrap gap-1.5">
                      {['tradicional', 'especial', 'artesanal', 'veggie', 'picante', 'cafe'].map(t => (
                        <button 
                            key={t}
                            type="button"
                            onClick={() => {
                                if (!formData.tags.includes(t)) setFormData(p => ({ ...p, tags: [...p.tags, t] }));
                            }}
                            className="px-2 py-1 bg-white border border-gray-100 text-[8px] font-bold text-gray-500 rounded-md hover:bg-gray-800 hover:text-white transition-all uppercase tracking-tight shadow-sm"
                        >
                            + {t}
                        </button>
                      ))}
                  </div>
               </div>
            </div>

            {/* Active Switch */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                 <div className="space-y-0.5">
                    <span className="block text-[10px] font-black text-gray-900 uppercase">Visible en tienda</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase truncate">Canal Digital Activo</span>
                 </div>
                 <div 
                    onClick={() => setFormData(p => ({ ...p, is_active: !p.is_active }))}
                    className={`relative w-12 h-6 rounded-full cursor-pointer transition-all duration-300 shadow-inner ${formData.is_active ? 'bg-green-500' : 'bg-gray-200'}`}
                 >
                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-lg transform transition-transform duration-300 ${formData.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                 </div>
            </div>

            {/* Sticky Actions */}
            <div className="pt-2 flex flex-col gap-3">
                <button type="submit" className="w-full py-4 bg-[#2f4131] text-white rounded-2xl font-black shadow-2xl shadow-green-900/30 hover:bg-[#243326] transform active:scale-[0.97] transition-all text-xs uppercase tracking-[0.2em]">
                    Sincronizar Cambios
                </button>
                <button type="button" onClick={onCancel} className="w-full py-3 bg-white border border-gray-200 text-gray-400 rounded-2xl font-black hover:text-gray-900 transition-all text-[10px] uppercase tracking-widest">
                    Descartar Edición
                </button>
            </div>

          </div>

        </form>
      </div>
    </div>
  );
}
