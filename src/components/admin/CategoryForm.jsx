import { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Icon } from '@iconify-icon/react';
import { supabase } from '../../config/supabase';
import { useLocations } from '../../hooks/useLocations';
import { useLocationOverrides } from '../../hooks/useLocationOverrides';
import { Modal, ModalHeader, FormField, TextInput, PrimaryButton, SecondaryButton, ImageGuidance } from './ui';
import { convertDriveLink, validateImageSize, compressAndWebp } from '../../utils/images';
import { toast as toastFn } from '../Toast';

const toast = {
  success: (msg) => toastFn(msg, { type: 'success' }),
  error: (msg) => toastFn(msg, { type: 'error' }),
};

export default function CategoryForm({ category, onSave, onCancel }) {
  const { locations } = useLocations();
  const { getCategoryOverrides, saveCategoryOverrides } = useLocationOverrides();
  const [locationOverrides, setLocationOverrides] = useState([]);
  const [loadingOverrides, setLoadingOverrides] = useState(false);

  useEffect(() => {
    if (category?.id) {
      loadOverrides();
    } else {
      // For new category, default to active in all locations
      setLocationOverrides(locations.map(loc => ({
        location_id: loc.id,
        is_active: true
      })));
    }
  }, [category, locations]);

  async function loadOverrides() {
    setLoadingOverrides(true);
    const overrides = await getCategoryOverrides(category.id);
    // Merge with all available locations to ensure every location has an entry
    const merged = locations.map(loc => {
      const existing = overrides.find(o => o.location_id === loc.id);
      return {
        location_id: loc.id,
        is_active: existing ? existing.is_active : true // Default to true if not specified
      };
    });
    setLocationOverrides(merged);
    setLoadingOverrides(false);
  }

  const toggleLocation = (locationId) => {
    setLocationOverrides(prev => prev.map(o => 
      o.location_id === locationId ? { ...o, is_active: !o.is_active } : o
    ));
  };

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
    let newValue = type === 'checkbox' ? checked : value;

    // Auto-convert Google Drive links if the field is banner_image_url
    if (name === 'banner_image_url' && typeof newValue === 'string') {
      const converted = convertDriveLink(newValue);
      if (converted !== newValue) {
        newValue = converted;
        // Since we don't have a direct toast import here, we can just use setFormData
        // or add a toast if available. ProductForm already has it.
      }
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const [isUploading, setIsUploading] = useState(false);
  const [uploadStats, setUploadStats] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Aunque comprimamos, validamos el tamaño inicial por seguridad (ahora 4MB)
    if (!validateImageSize(file, toast)) return;

    setIsUploading(true);
    setUploadStats(null);
    try {
      const originalSize = file.size;
      // 1. Comprimir y convertir a WebP en el cliente
      const compressedFile = await compressAndWebp(file);
      const finalSize = compressedFile.size;
      
      // 2. Preparar ruta (forzar .webp)
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.webp`;
      const filePath = `category-banners/${fileName}`;

      // 3. Subir a Supabase con Cache Control agresivo (1 año)
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, compressedFile, {
          cacheControl: '31536000',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, banner_image_url: publicUrl }));
      setUploadStats({
        original: (originalSize / 1024).toFixed(1),
        final: (finalSize / 1024).toFixed(1),
        reduction: (((originalSize - finalSize) / originalSize) * 100).toFixed(0)
      });
      toast.success('Imagen optimizada y subida correctamente');
    } catch (err) {
      console.error('Error uploading image:', err);
      toast.error('Error al subir la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSave = { ...formData, sort_order: parseInt(formData.sort_order) || 0 };
    // Convert empty strings to null for time fields so Postgres doesn't complain
    if (!dataToSave.available_from) dataToSave.available_from = null;
    if (!dataToSave.available_to) dataToSave.available_to = null;
    
    onSave(dataToSave, locationOverrides);
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
            <FormField label="Imagen de banner">
              <div className="space-y-4">
                {formData.banner_image_url && (
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                    <img src={formData.banner_image_url} alt="Banner Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, banner_image_url: '' }))}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-all"
                    >
                      <Icon icon="heroicons:trash" className="text-xs" />
                    </button>
                  </div>
                )}

                <ImageGuidance />

                {uploadStats && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Icon icon="lucide:zap" className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-wider">Imagen Optimizada</span>
                      </div>
                      <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black">
                        -{uploadStats.reduction}% de peso
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/50 rounded-xl p-2.5 border border-emerald-100/50">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight mb-0.5">Antes</p>
                        <p className="text-xs font-bold text-gray-600">{uploadStats.original} KB</p>
                      </div>
                      <div className="bg-white/50 rounded-xl p-2.5 border border-emerald-100/50">
                        <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-tight mb-0.5">Después (WebP)</p>
                        <p className="text-xs font-bold text-emerald-700">{uploadStats.final} KB</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">Subir archivo directo</label>
                  <label className={`group relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
                    isUploading ? 'bg-gray-50 border-gray-100 cursor-not-allowed' : 'border-[#2f4131]/10 bg-[#2f4131]/5 hover:border-[#2f4131]/30 hover:bg-[#2f4131]/10'
                  }`}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      ref={fileInputRef}
                      disabled={isUploading}
                      className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-transform ${
                        isUploading ? 'bg-gray-200 text-gray-400 animate-pulse' : 'bg-[#2f4131]/10 text-[#2f4131] group-hover:scale-110'
                      }`}>
                        <Icon icon={isUploading ? "lucide:loader-2" : "lucide:upload-cloud"} className={`text-xl ${isUploading ? 'animate-spin' : ''}`} />
                      </div>
                      <p className={`text-sm font-bold ${isUploading ? 'text-gray-400' : 'text-gray-700'}`}>
                        {isUploading ? 'Subiendo e incorporando...' : 'Seleccionar imagen'}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        JPG, PNG o WebP hasta <span className="font-bold text-gray-500">4.0 MB</span>
                      </p>
                    </div>
                  </label>
                </div>

                <div className="pt-2 border-t border-gray-50">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-tight mb-2">O ingresa la URL manualmente (Recomendado)</p>
                  <TextInput 
                    name="banner_image_url" 
                    value={formData.banner_image_url} 
                    onChange={handleChange} 
                    placeholder="https://images.unsplash.com/…" 
                    disabled={isUploading}
                  />
                </div>
              </div>
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

          {/* Disponibilidad por Sede */}
          <div className="md:col-span-2 lg:col-span-3">
            <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Icon icon="heroicons:map-pin" className="text-xl text-[#2f4131]" />
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Disponibilidad por Sede</h3>
              </div>
              <p className="text-[12px] text-gray-400 font-medium leading-relaxed">
                Define en qué sedes estará disponible esta categoría. Si la marca tiene sedes con diferentes menús, puedes controlarlo aquí.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {locations.map(loc => {
                  const override = locationOverrides.find(o => o.location_id === loc.id);
                  const isActive = override ? override.is_active : true;
                  
                  return (
                    <div key={loc.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                          <Icon icon="heroicons:home" />
                        </div>
                        <span className="text-[13px] font-bold text-gray-700">{loc.name}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => toggleLocation(loc.id)}
                        className={`w-9 h-[22px] rounded-full relative transition-all shadow-inner ${isActive ? 'bg-[#2f4131]' : 'bg-gray-200'}`}
                      >
                        <div className={`absolute top-[3px] w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isActive ? 'left-[18px]' : 'left-[3px]'}`} />
                      </button>
                    </div>
                  );
                })}
                {locations.length === 0 && (
                  <p className="col-span-full text-[11px] text-gray-400 italic">Cargando sedes o no hay sedes configuradas...</p>
                )}
              </div>
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
