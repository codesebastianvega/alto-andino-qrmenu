import { useState, useEffect, useRef } from 'react';
import { useMenuData } from '../../context/MenuDataContext';
import { supabase } from '../../config/supabase';
import { Modal, ModalHeader, FormField, TextInput, PrimaryButton, SecondaryButton } from './ui';

export default function ProductForm({ product, categories, recipes = [], allergens = [], onSave, onCancel }) {
  const { modifiers: modifierGroupsData } = useMenuData();
  const availableGroups = Object.keys(modifierGroupsData || {});

  const [formData, setFormData] = useState({
    name: '', description: '', price: '', cost: '',
    category_id: '', stock_status: 'in', image_url: '',
    tags: [], is_active: true, is_addon: false,
    variants: [], modifier_groups: [], config_options: {}, recipe_id: null, packaging_fee: '',
  });
  const [targetMargin, setTargetMargin] = useState(35);
  const [manageGroups, setManageGroups] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '', description: product.description || '',
        price: product.price || '', cost: product.cost || '',
        category_id: product.category_id || '', stock_status: product.stock_status || 'in',
        image_url: product.image_url || '', tags: product.tags || [],
        is_active: product.is_active ?? true, is_addon: product.is_addon || false,
        variants: product.variants || [], modifier_groups: product.modifier_groups || [],
        config_options: product.config_options || {}, recipe_id: product.recipe_id || null,
        packaging_fee: product.packaging_fee || '',
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleModifierGroup = (group) => {
    setFormData(prev => {
      const current = prev.modifier_groups || [];
      const isIn = current.includes(group);
      const newGroups = isIn ? current.filter(g => g !== group) : [...current, group];
      // When adding, default to optional; when removing, clean up config
      const prevConfig = prev.config_options?.modifier_config || {};
      const newConfig = { ...prevConfig };
      if (!isIn) newConfig[group] = 'optional';
      else delete newConfig[group];
      return {
        ...prev,
        modifier_groups: newGroups,
        config_options: { ...prev.config_options, modifier_config: newConfig },
      };
    });
  };

  const toggleTag = (tagName) => {
    setFormData(prev => {
      const current = prev.tags || [];
      const newTags = current.includes(tagName)
        ? current.filter(t => t !== tagName)
        : [...current, tagName];
      return { ...prev, tags: newTags };
    });
  };

  const setModifierConfig = (group, config) => {
    setFormData(prev => ({
      ...prev,
      config_options: {
        ...prev.config_options,
        modifier_config: { ...(prev.config_options?.modifier_config || {}), [group]: config },
      },
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      // Generate a unique file name
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error subiendo imagen. Intenta de nuevo.');
    } finally {
      setIsUploading(false);
      // Reset input so the same file could be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category_id) {
      alert('Por favor completa nombre, precio y categoría.');
      return;
    }
    onSave({ ...formData, price: parseFloat(formData.price), cost: parseFloat(formData.cost) || 0, packaging_fee: parseFloat(formData.packaging_fee) || 0 });
  };

  const priceNum  = parseFloat(formData.price) || 0;
  const costNum   = parseFloat(formData.cost)  || 0;
  const profit    = priceNum - costNum;
  const margin    = priceNum > 0 ? (profit / priceNum) * 100 : 0;
  // suggested = cost / (1 - targetMargin/100)
  const suggested = costNum > 0 ? Math.round(costNum / (1 - (targetMargin / 100))) : 0;
  const marginDiff = margin - targetMargin;

  const linkedRecipe = recipes.find(r => r.id === formData.recipe_id);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-[100] p-4 overflow-y-auto backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-5xl my-8 overflow-hidden shadow-2xl">

        {/* ── Header */}
        <div className="flex items-start justify-between px-8 py-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 leading-tight">
              {product ? 'Editar producto' : 'Nuevo producto'}
            </h2>
            <p className="text-[13px] text-gray-400 font-medium mt-0.5">
              {product ? `Editando: ${product.name}` : 'Completa los datos del nuevo producto.'}
            </p>
          </div>
          <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all mt-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left: 2 columns */}
          <div className="lg:col-span-2 space-y-6">

            {/* Basic Info */}
            <section className="border border-gray-100 rounded-2xl p-6 space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Información general</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <FormField label="Nombre público">
                    <TextInput required name="name" value={formData.name} onChange={handleChange} placeholder="Ej. Bowl de Acai Amazónico" />
                  </FormField>
                </div>
                <FormField label="Categoría">
                  <select required name="category_id" value={formData.category_id} onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#2f4131] outline-none">
                    <option value="">Seleccionar…</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </FormField>
                <FormField label="Disponibilidad">
                  <select name="stock_status" value={formData.stock_status} onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#2f4131] outline-none">
                    <option value="in">Disponible</option>
                    <option value="out">Agotado</option>
                  </select>
                </FormField>
                <FormField label="Costo Empaque (Llevar)">
                  <TextInput type="number" name="packaging_fee" value={formData.packaging_fee} onChange={handleChange} placeholder="Ej. 1500" />
                </FormField>
                <div className="hidden md:block"></div>
                <div className="md:col-span-2">
                  <FormField label="Descripción">
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={3}
                      placeholder="Describe los sabores, texturas y por qué deberían pedirlo…"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#2f4131] outline-none resize-none" />
                  </FormField>
                </div>
                <div className="md:col-span-2">
                  <FormField label="Visibilidad en menú">
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${formData.is_active ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-5 rounded-full relative transition-all ${formData.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${formData.is_active ? 'left-4' : 'left-0.5'}`} />
                        </div>
                        <span>{formData.is_active ? 'Activo — visible en el menú' : 'Inactivo — oculto del menú'}</span>
                      </div>
                    </button>
                  </FormField>
                </div>
                <div className="md:col-span-2">
                  <FormField label="Modo 'Arma tu propio' (DIY)">
                    <button type="button" onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      config_options: { ...prev.config_options, is_diy: !prev.config_options?.is_diy } 
                    }))}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${formData.config_options?.is_diy ? 'bg-violet-50 border-violet-200 text-violet-800' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-5 rounded-full relative transition-all ${formData.config_options?.is_diy ? 'bg-violet-500' : 'bg-gray-300'}`}>
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${formData.config_options?.is_diy ? 'left-4' : 'left-0.5'}`} />
                        </div>
                        <span className="text-left leading-tight">
                          {formData.config_options?.is_diy ? 'Activo — Usará el modal Premium DIY por pasos' : 'Inactivo — Usará el modal rápido (QuickView)'}
                        </span>
                      </div>
                    </button>
                  </FormField>
                </div>

                {/* Dietary Tags & Allergens */}
                <div className="md:col-span-2 mt-4 pt-4 border-t border-gray-100">
                  <p className="block text-sm font-medium text-gray-700 mb-2">Dietas y Alérgenos</p>
                  <div className="flex flex-wrap gap-2">
                    {allergens.length > 0 ? allergens.map(allergen => {
                      const isSelected = formData.tags?.includes(allergen.name);
                      return (
                        <button
                          key={allergen.id}
                          type="button"
                          onClick={() => toggleTag(allergen.name)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-sm transition-colors ${
                            isSelected
                              ? 'bg-[#1C2B1E]/10 border-[#1C2B1E]/20 text-[#1C2B1E] font-semibold'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-base">{allergen.emoji}</span>
                          <span>{allergen.name}</span>
                        </button>
                      );
                    }) : (
                      <p className="text-xs text-gray-400">No hay alérgenos configurados. Asegúrate de agregarlos en Configuración.</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Estas etiquetas se mostrarán en la carta virtual junto al producto.
                  </p>
                </div>
              </div>
            </section>

            {/* Recipe Linking */}
            <section className="border border-gray-100 rounded-2xl p-6">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">Receta vinculada</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                <button type="button" onClick={() => setFormData(prev => ({ ...prev, recipe_id: null, cost: 0 }))}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${!formData.recipe_id ? 'border-[#2f4131] bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}>
                  <span className={`block text-sm font-semibold ${!formData.recipe_id ? 'text-[#2f4131]' : 'text-gray-400'}`}>Sin receta</span>
                  <span className="text-[11px] text-gray-400">Costo manual</span>
                </button>
                {recipes.map(recipe => (
                  <button key={recipe.id} type="button"
                    onClick={() => setFormData(prev => ({ ...prev, recipe_id: recipe.id, cost: recipe.total_cost || 0 }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${formData.recipe_id === recipe.id ? 'border-blue-400 bg-blue-50' : 'border-gray-100 hover:border-blue-100'}`}>
                    <span className={`block text-sm font-semibold truncate ${formData.recipe_id === recipe.id ? 'text-blue-900' : 'text-gray-900'}`}>{recipe.name}</span>
                    <span className="text-[11px] text-gray-400">${recipe.total_cost?.toLocaleString()}</span>
                    {formData.recipe_id === recipe.id && <span className="text-[10px] font-semibold text-blue-500 block mt-0.5">✓ Vinculada</span>}
                  </button>
                ))}
              </div>

              {/* Cost + suggested price bar */}
              <div className="flex items-stretch gap-0 p-0 bg-gray-900 rounded-xl overflow-hidden">
                {/* Costo */}
                <div className="flex-[2] p-4">
                  <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Costo de producción</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-gray-500">$</span>
                    <input type="number" name="cost" value={formData.cost} onChange={handleChange}
                      readOnly={!!formData.recipe_id}
                      className={`bg-transparent border-none p-0 text-2xl font-semibold w-28 focus:ring-0 outline-none ${formData.recipe_id ? 'text-blue-400 cursor-not-allowed' : 'text-white'}`} />
                  </div>
                  {formData.recipe_id && <p className="text-[10px] text-blue-400/60 font-medium mt-0.5">Sincronizado con receta</p>}
                </div>

                {/* Divider */}
                <div className="w-px bg-white/5" />

                {/* Precio sugerido: editable margin % + value + button */}
                <div className="flex-[3] p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Precio sugerido</span>
                    <div className="flex items-center gap-1.5 bg-white/10 border border-white/10 rounded-lg px-3 py-1">
                      <input
                        type="number"
                        min="1" max="99"
                        value={targetMargin}
                        onChange={e => setTargetMargin(Math.min(99, Math.max(1, Number(e.target.value))))}
                        className="w-10 bg-transparent border-none p-0 text-[13px] font-semibold text-white text-center focus:ring-0 outline-none"
                      />
                      <span className="text-[13px] text-gray-400 font-semibold">%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xl font-semibold text-gray-300 tabular-nums">
                      {suggested > 0 ? `$${suggested.toLocaleString()}` : '—'}
                    </p>
                    {suggested > 0 && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, price: suggested }))}
                        className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-[11px] font-semibold text-white/70 hover:text-white transition-all whitespace-nowrap"
                      >
                        ↑ Usar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Modifier Groups */}
            {availableGroups.length > 0 && (
              <section className="border border-gray-100 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Personalizaciones / Extras</p>
                    <p className="text-[11px] text-gray-300 mt-0.5">Asigna grupos de opciones al producto</p>
                  </div>
                  <button type="button" onClick={() => setManageGroups(v => !v)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-violet-100 bg-violet-50 text-violet-600 hover:bg-violet-100 transition-all text-[11px] font-semibold">
                    ⚙ {manageGroups ? 'Cerrar' : 'Gestionar grupos'}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableGroups.map(group => {
                    const isSelected = (formData.modifier_groups || []).includes(group);
                    const modType = formData.config_options?.modifier_config?.[group] || 'optional';
                    const groupItems = modifierGroupsData[group] || [];
                    const previewItems = groupItems.slice(0, 3);
                    return (
                      <div key={group}
                        className={`rounded-xl border-2 transition-all duration-150 overflow-hidden ${
                          isSelected ? 'border-violet-200 bg-violet-50' : 'border-gray-100 bg-gray-50 opacity-60'
                        }`}>
                        {/* Card header — click to toggle */}
                        <button type="button" onClick={() => toggleModifierGroup(group)}
                          className="w-full p-3 text-left flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
                                isSelected ? 'bg-violet-600 border-violet-600' : 'border-gray-300'
                              }`} />
                              <span className={`text-[13px] font-semibold truncate capitalize ${
                                isSelected ? 'text-violet-900' : 'text-gray-400'
                              }`}>{group.replace(/-/g, ' ')}</span>
                            </div>
                            {/* Items preview */}
                            {groupItems.length > 0 && (
                              <p className={`text-[11px] mt-1 ml-5 truncate ${
                                isSelected ? 'text-violet-500' : 'text-gray-300'
                              }`}>
                                {previewItems.map(i => i.name).join(' · ')}
                                {groupItems.length > 3 ? ` +${groupItems.length - 3}` : ''}
                              </p>
                            )}
                          </div>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${
                            isSelected ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-300'
                          }`}>{groupItems.length}</span>
                        </button>
                        {/* Required/Optional toggle — only when selected */}
                        {isSelected && (
                          <div className="border-t border-violet-100 p-3 bg-white/50 space-y-3">
                            <div className="flex gap-1 bg-gray-100/50 p-1 rounded-xl">
                              {['optional', 'required', 'custom'].map(t => {
                                const currentConfig = modType; 
                                const isCurrent = (typeof currentConfig === 'string' && currentConfig === t) || (typeof currentConfig === 'object' && t === 'custom');
                                return (
                                <button key={t} type="button"
                                  onClick={() => {
                                    if (t === 'custom') setModifierConfig(group, { type: 'custom', min: 1, max: 2 });
                                    else setModifierConfig(group, t);
                                  }}
                                  className={`flex-1 text-[10px] font-semibold py-1.5 rounded-lg transition-colors ${
                                    isCurrent
                                      ? 'bg-violet-600 text-white shadow-sm'
                                      : 'text-gray-500 hover:bg-violet-50'
                                  }`}>
                                  {t === 'required' ? 'Único' : t === 'optional' ? 'Múltiple' : 'Personalizado'}
                                </button>
                                );
                              })}
                            </div>
                            
                            {typeof modType === 'object' && (
                              <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                <label className="flex-1 flex items-center justify-between text-[11px] font-semibold text-gray-600">
                                  <span>Mín. a elegir:</span>
                                  <input type="number" min="0" 
                                    value={modType.min ?? 1}
                                    onChange={e => setModifierConfig(group, { ...modType, min: parseInt(e.target.value) || 0 })}
                                    className="w-12 px-2 py-1 text-center text-[12px] font-bold bg-white border border-gray-200 rounded focus:ring-1 focus:ring-violet-500 outline-none" />
                                </label>
                                <div className="w-px h-6 bg-gray-200" />
                                <label className="flex-1 flex items-center justify-between text-[11px] font-semibold text-gray-600">
                                  <span>Límite (Max):</span>
                                  <input type="number" min="0" 
                                    value={modType.max ?? 2}
                                    onChange={e => setModifierConfig(group, { ...modType, max: parseInt(e.target.value) || 0 })}
                                    className="w-12 px-2 py-1 text-center text-[12px] font-bold bg-white border border-gray-200 rounded focus:ring-1 focus:ring-violet-500 outline-none" />
                                </label>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Groups management drawer */}
                {manageGroups && (
                  <div className="mt-4 border border-violet-100 rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 bg-violet-50 border-b border-violet-100 flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-violet-700 uppercase tracking-wider">Grupos disponibles</p>
                      <p className="text-[10px] text-violet-400">Los grupos se crean desde Insumos → Categorías</p>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {availableGroups.map(group => {
                        const items = modifierGroupsData[group] || [];
                        return (
                          <div key={group} className="px-4 py-2.5 flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-semibold text-gray-700 capitalize">{group.replace(/-/g, ' ')}</p>
                              {items.length > 0 ? (
                                <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                                  {items.map(i => i.name).join(' · ')}
                                </p>
                              ) : (
                                <p className="text-[11px] text-gray-300 mt-0.5">Sin ítems aún</p>
                              )}
                            </div>
                            <span className="text-[10px] font-semibold bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full shrink-0 mt-0.5">
                              {items.length} ítem{items.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
                      <p className="text-[10px] text-gray-400">Para agregar ítems a un grupo, ve a <strong>Insumos → Categorías</strong> y edita la categoría correspondiente</p>
                    </div>
                  </div>
                )}
              </section>
            )}

          </div>

          {/* ── Right sidebar */}
          <div className="space-y-5">
            {/* Price & margin card */}
            <div className="bg-[#2f4131] rounded-2xl p-6 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-4">Precio al público (COP)</p>
              <div className="flex items-baseline gap-1 mb-6 min-w-0">
                <span className="text-white/30 text-2xl font-semibold flex-shrink-0">$</span>
                <input type="number" name="price" value={formData.price} onChange={handleChange} required
                  className="bg-transparent border-none p-0 text-4xl font-semibold w-full min-w-0 focus:ring-0 placeholder:text-white/10 outline-none"
                  placeholder="0" />
              </div>
              <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] text-white/40 font-medium uppercase tracking-wider">Margen real</span>
                  <span className={`text-2xl font-semibold ${
                    margin >= targetMargin ? 'text-green-400' : margin > 0 ? 'text-amber-400' : 'text-white/20'
                  }`}>{margin.toFixed(0)}%</span>
                </div>
                {/* Target marker */}
                <div className="relative w-full bg-white/10 h-1.5 rounded-full overflow-visible mb-1">
                  <div className={`h-full rounded-full transition-all duration-300 ${
                    margin >= targetMargin ? 'bg-green-400' : 'bg-amber-400'
                  }`} style={{ width: `${Math.min(100, Math.max(0, margin))}%` }} />
                  {/* Target line */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3.5 bg-white/30 rounded-full"
                    style={{ left: `${Math.min(100, targetMargin)}%` }}
                    title={`Meta: ${targetMargin}%`}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-white/25 font-medium">
                  <span>0%</span>
                  <span>Meta {targetMargin}%</span>
                </div>
                <p className="text-[11px] text-white/30 font-medium mt-2 text-center leading-relaxed">
                  Ganancia: ${profit.toLocaleString(undefined, { maximumFractionDigits: 0 })} por unidad
                  {marginDiff !== 0 && priceNum > 0 && (
                    <span className={`ml-2 font-semibold ${
                      marginDiff >= 0 ? 'text-green-400/60' : 'text-red-400/60'
                    }`}>
                      ({marginDiff > 0 ? '+' : ''}{marginDiff.toFixed(0)}% vs meta)
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Recipe status card */}
            <div className="border border-gray-100 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Ficha técnica</p>
                {formData.recipe_id && (
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, recipe_id: null, cost: 0 }))}
                    className="text-[11px] font-semibold text-red-400 hover:text-red-600 transition-colors">
                    Desvincular
                  </button>
                )}
              </div>
              {linkedRecipe ? (
                <div className="flex justify-between items-center bg-blue-50 rounded-xl p-4">
                  <div>
                    <p className="text-[11px] font-semibold text-blue-400 uppercase">Vinculada a</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{linkedRecipe.name}</p>
                  </div>
                  <p className="text-base font-semibold text-[#2f4131]">${linkedRecipe.total_cost?.toLocaleString()}</p>
                </div>
              ) : (
                <p className="text-[13px] text-gray-400 italic text-center py-3">Sin ficha técnica vinculada.</p>
              )}
            </div>

            {/* Image */}
            <div className="border border-gray-100 rounded-2xl p-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Imagen</p>
              {formData.image_url && (
                <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 mb-3">
                  <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover"
                    onError={e => { e.target.style.display = 'none'; }} />
                </div>
              )}
              
              <div className="flex flex-col gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                  disabled={isUploading}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-violet-50 file:text-violet-700
                    hover:file:bg-violet-100 transition-all cursor-pointer disabled:opacity-50"
                />
                
                {isUploading && (
                  <p className="text-[11px] text-violet-600 font-medium animate-pulse">
                    Subiendo imagen...
                  </p>
                )}

                <FormField label="O ingresa la URL manualmente">
                  <TextInput type="url" name="image_url" value={formData.image_url} onChange={handleChange}
                    placeholder="https://ejemplo.com/foto.jpg" disabled={isUploading} />
                </FormField>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <PrimaryButton type="submit" className="w-full py-3">
                {product ? 'Guardar cambios' : 'Crear producto'}
              </PrimaryButton>
              <SecondaryButton type="button" onClick={onCancel} className="w-full py-3">
                Cancelar
              </SecondaryButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
