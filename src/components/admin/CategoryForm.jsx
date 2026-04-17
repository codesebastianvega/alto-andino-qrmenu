import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Icon } from '@iconify-icon/react';
import { supabase } from '../../config/supabase';
import { Modal, ModalHeader, FormField, TextInput, PrimaryButton, SecondaryButton } from './ui';

export default function CategoryForm({ category, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '', slug: '', icon: '🍽️', sort_order: 0, is_active: true,
    banner_image_url: '', banner_title: '', banner_description: '', 
    accent_color: '#2f4131', tint_class: 'bg-white', target_id: '',
    available_from: '', available_to: '',
    visibility_config: { 
      days: [0,1,2,3,4,5,6], 
      subcategories: [], 
      section_type: 'standard',
      is_hero: false,
      hero_featured_product_id: '',
      hero_rating: '5.0',
      hero_prep_time: '15 mins'
    }
  });
  const [categoryProducts, setCategoryProducts] = useState([]);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '', slug: category.slug || '', icon: category.icon || '🍽️',
        sort_order: category.sort_order || 0, is_active: category.is_active !== false,
        banner_image_url: category.banner_image_url || '', banner_title: category.banner_title || '',
        banner_description: category.banner_description || '', accent_color: category.accent_color || '#2f4131',
        tint_class: category.tint_class || 'bg-white', target_id: category.target_id || '',
        available_from: category.available_from || '', available_to: category.available_to || '',
        visibility_config: category.visibility_config || { 
          days: [0,1,2,3,4,5,6], 
          subcategories: [], 
          section_type: 'standard',
          is_hero: false,
          hero_featured_product_id: '',
          hero_rating: '5.0',
          hero_prep_time: '15 mins'
        }
      });
      
      if (category.id) {
        // Fetch products for this category to allow setting the hero featured product
        supabase.from('products')
          .select('id, name')
          .eq('category_id', category.id)
          .then(({ data }) => {
            if (data) setCategoryProducts(data);
          });
      }
    }
  }, [category]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSave = { ...formData, sort_order: parseInt(formData.sort_order) || 0 };
    // Convert empty strings to null for time fields so Postgres doesn't complain
    if (!dataToSave.available_from) dataToSave.available_from = null;
    if (!dataToSave.available_to) dataToSave.available_to = null;
    
    onSave(dataToSave);
  };

  const toggleDay = (dayIndex) => {
    setFormData(prev => {
      const days = prev.visibility_config?.days || [0,1,2,3,4,5,6];
      const newDays = days.includes(dayIndex) 
        ? days.filter(d => d !== dayIndex) 
        : [...days, dayIndex].sort();
      return {
        ...prev,
        visibility_config: { ...prev.visibility_config, days: newDays }
      };
    });
  };

  const handleAddSubManual = (value) => {
    const trimmedValue = value?.trim();
    if (!trimmedValue) return;
    
    setFormData(prev => {
      const currentSubs = prev.visibility_config?.subcategories || [];
      if (currentSubs.includes(trimmedValue)) return prev;
      
      return {
        ...prev,
        visibility_config: {
          ...prev.visibility_config,
          subcategories: [...currentSubs, trimmedValue]
        }
      };
    });
  };

  const removeSubcategory = (sub) => {
    setFormData(prev => ({
      ...prev,
      visibility_config: {
        ...prev.visibility_config,
        subcategories: (prev.visibility_config?.subcategories || []).filter(s => s !== sub)
      }
    }));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    
    setFormData(prev => {
      const items = Array.from(prev.visibility_config?.subcategories || []);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      return {
        ...prev,
        visibility_config: {
          ...prev.visibility_config,
          subcategories: items
        }
      };
    });
  };

  return (
    <Modal onClose={onCancel} wide>
      <ModalHeader
        title={category ? 'Editar categoría' : 'Nueva categoría'}
        subtitle="Personaliza la apariencia de esta sección en el menú."
        onClose={onCancel}
      />

      <form onSubmit={handleSubmit}>
        <div className="px-7 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Left: Basic info */}
          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 pb-1 border-b border-gray-100">
              Información básica
            </p>
            <FormField label="Nombre">
              <TextInput required name="name" value={formData.name} onChange={handleChange} placeholder="Ej. Desayunos" />
            </FormField>
            <FormField label="Slug (identificador)">
              <TextInput required name="slug" value={formData.slug} onChange={handleChange} placeholder="Ej. desayunos" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Ícono">
                <TextInput name="icon" value={formData.icon} onChange={handleChange} placeholder="🍽️" className="text-center text-xl" />
              </FormField>
              <FormField label="Orden">
                <TextInput type="number" name="sort_order" value={formData.sort_order} onChange={handleChange} />
              </FormField>
            </div>
            
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 pb-1 border-b border-gray-100 mt-6">
              Horario y Días de Disponibilidad
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Hora Inicio">
                <TextInput type="time" name="available_from" value={formData.available_from} onChange={handleChange} />
              </FormField>
              <FormField label="Hora Fin">
                <TextInput type="time" name="available_to" value={formData.available_to} onChange={handleChange} />
              </FormField>
            </div>
            <div className="space-y-2 mt-2">
              <p className="text-[11px] font-medium text-gray-500">Días activos</p>
              <div className="flex flex-wrap gap-1.5">
                {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day, i) => {
                  const isActive = formData.visibility_config?.days?.includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all ${
                        isActive ? 'bg-[#2f4131] text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Visual */}
          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 pb-1 border-b border-gray-100">
              Personalización visual
            </p>
            <FormField label="URL imagen de banner">
              <TextInput name="banner_image_url" value={formData.banner_image_url} onChange={handleChange} placeholder="https://…" />
            </FormField>
            <FormField label="Título del banner">
              <TextInput name="banner_title" value={formData.banner_title} onChange={handleChange} placeholder="Ej. Combos Especiales" />
            </FormField>
            <FormField label="Descripción del banner">
              <textarea name="banner_description" value={formData.banner_description} onChange={handleChange} rows={2}
                placeholder="Texto llamativo para el banner…"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#2f4131] outline-none resize-none" />
            </FormField>
            <FormField label="Color de acento (UI)">
              <div className="flex gap-2 items-center">
                <input type="color" name="accent_color" value={formData.accent_color} onChange={handleChange}
                  className="w-10 h-10 rounded-lg border-none cursor-pointer" />
                <TextInput name="accent_color" value={formData.accent_color} onChange={handleChange} />
              </div>
            </FormField>

            <FormField label="Clase de tinte (Fondo)">
              <div className="space-y-1.5">
                <TextInput 
                  name="tint_class" 
                  value={formData.tint_class} 
                  onChange={handleChange} 
                  placeholder="Ej. bg-amber-50" 
                />
                <p className="text-[10px] text-gray-400 italic font-medium px-1">
                  Usa clases de Tailwind (bg-white, bg-rose-50, etc.) o deja en blanco.
                </p>
              </div>
            </FormField>

            <FormField label="ID de Anclaje (Técnico)">
              <TextInput name="target_id" value={formData.target_id} onChange={handleChange} placeholder="Ej. section-platos" />
            </FormField>
          </div>

          {/* Column 3: Internal Organization & Hero */}
          <div className="space-y-4 flex flex-col">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 pb-1 border-b border-gray-100">
              Organización Interna
            </p>
            <FormField label="Habitaciones (Subcategorías)">
              <div className="space-y-3">
                <div className="relative">
                  <TextInput 
                    placeholder="Nueva subcategoría..." 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddSubManual(e.target.value.trim());
                        e.target.value = '';
                      }
                    }}
                    className="pr-10"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <kbd className="text-[10px] font-sans px-1.5 py-0.5 bg-white border border-gray-200 rounded shadow-sm">Enter</kbd>
                  </div>
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="subcategories">
                    {(provided) => (
                      <div 
                        {...provided.droppableProps} 
                        ref={provided.innerRef}
                        className="space-y-1.5 min-h-[50px] max-h-[300px] overflow-y-auto p-1"
                      >
                        {formData.visibility_config?.subcategories?.map((sub, index) => (
                          <Draggable key={sub} draggableId={sub} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`flex items-center justify-between px-4 py-2 bg-white border rounded-xl shadow-sm transition-all ${
                                  snapshot.isDragging ? 'border-[#2f4131] ring-2 ring-[#2f4131]/10 z-50' : 'border-gray-100'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div {...provided.dragHandleProps} className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing">
                                    <Icon icon="heroicons:bars-2" />
                                  </div>
                                  <span className="text-sm font-semibold text-gray-700">{sub}</span>
                                </div>
                                <button 
                                  type="button" 
                                  onClick={() => removeSubcategory(sub)}
                                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                >
                                  <Icon icon="heroicons:trash" />
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {(!formData.visibility_config?.subcategories || formData.visibility_config.subcategories.length === 0) && (
                          <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-2xl">
                            <p className="text-[11px] text-gray-400 font-medium italic">Sin subcategorías definidas.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            </FormField>
            <FormField label="Tipo de sección">
              <select 
                name="section_type" 
                value={formData.visibility_config?.section_type || 'standard'}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  visibility_config: { ...prev.visibility_config, section_type: e.target.value }
                }))}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#2f4131] outline-none"
              >
                <option value="standard">Estándar (Lista)</option>
                <option value="grid">Grid (2 columnas)</option>
                <option value="grid-compact">Grid Compacto (Mucha densidad)</option>
                <option value="horizontal-slider">Slider Horizontal (Carrusel)</option>
                <option value="list-minimal">Lista Minimalista (Texto)</option>
                <option value="simple-list">Lista Simple (Bebidas)</option>
                <option value="wide-grid">Cuadrícula Amplia (Fotos grandes)</option>
                <option value="bento-grid">Bento Grid (Premium)</option>
                <option value="masonry">Pinterest Masonry (Dinámico)</option>
              </select>
            </FormField>
            
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#2f4131] pb-1 border-b border-[#2f4131]/20 mt-6 pt-2">
              Configuración Home Hero
            </p>
            <div className="p-4 bg-blue-50/50 border border-blue-100/50 rounded-2xl space-y-4">
              <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Mostrar en Hero</p>
                  <p className="text-[11px] text-gray-500 font-medium">Aparecerá en el slider principal.</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setFormData(p => ({ ...p, visibility_config: { ...p.visibility_config, is_hero: !p.visibility_config?.is_hero } }))}
                  className={`w-9 h-[22px] rounded-full relative transition-all shadow-inner ${formData.visibility_config?.is_hero ? 'bg-[#2f4131]' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-[3px] w-4 h-4 bg-white rounded-full shadow-sm transition-all ${formData.visibility_config?.is_hero ? 'left-[18px]' : 'left-[3px]'}`} />
                </button>
              </div>
              
              {formData.visibility_config?.is_hero && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <FormField label="Producto Estrella (Se usará su Foto y Precio)">
                    <select 
                      value={formData.visibility_config?.hero_featured_product_id || ''}
                      onChange={(e) => setFormData(p => ({ ...p, visibility_config: { ...p.visibility_config, hero_featured_product_id: e.target.value } }))}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#2f4131] outline-none"
                    >
                      <option value="">Selecciona un producto...</option>
                      {categoryProducts.map(prod => (
                        <option key={prod.id} value={prod.id}>{prod.name}</option>
                      ))}
                    </select>
                    {(!categoryProducts || categoryProducts.length === 0) && (
                      <p className="text-[11px] text-orange-500 mt-1 italic">Guarda la categoría y añádele productos primero.</p>
                    )}
                  </FormField>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Rating Visual">
                      <TextInput 
                        placeholder="Ej. 4.9" 
                        value={formData.visibility_config?.hero_rating || ''} 
                        onChange={(e) => setFormData(p => ({ ...p, visibility_config: { ...p.visibility_config, hero_rating: e.target.value } }))} 
                      />
                    </FormField>
                    <FormField label="Tiempo Prep.">
                      <TextInput 
                        placeholder="Ej. 15 mins" 
                        value={formData.visibility_config?.hero_prep_time || ''} 
                        onChange={(e) => setFormData(p => ({ ...p, visibility_config: { ...p.visibility_config, hero_prep_time: e.target.value } }))} 
                      />
                    </FormField>
                  </div>
                </div>
              )}
            </div>
            
          </div>

          {/* Active toggle */}
          <div className="md:col-span-2 lg:col-span-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <p className="text-sm font-semibold text-gray-700">Categoría activa</p>
                <p className="text-[12px] text-gray-400 font-medium mt-0.5">Si se desactiva, no aparecerá en el menú público.</p>
              </div>
              <button type="button" onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                className={`w-10 h-5 rounded-full relative transition-all ${formData.is_active ? 'bg-[#2f4131]' : 'bg-gray-300'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${formData.is_active ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="px-7 py-5 border-t border-gray-100 flex gap-3">
          <SecondaryButton type="button" onClick={onCancel} className="flex-1">Cancelar</SecondaryButton>
          <PrimaryButton type="submit" className="flex-[2]">{category ? 'Guardar cambios' : 'Crear categoría'}</PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
