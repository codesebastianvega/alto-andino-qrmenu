import { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Icon } from '@iconify-icon/react';
import { supabase } from '../../config/supabase';
import { useLocations } from '../../hooks/useLocations';
import { useLocationOverrides } from '../../hooks/useLocationOverrides';
import { 
  Modal, 
  ModalHeader, 
  FormField, 
  TextInput, 
  PrimaryButton, 
  SecondaryButton, 
  ImageGuidance,
  BentoCard
} from './ui';
import IconPicker from './IconPicker';
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
      show_in_hero: false,
      hero_featured_product_id: '',
      hero_rating: '5.0',
      hero_prep_time: '15 mins',
      show_banner: true,
      banner_style: 'floating',
      banner_badge: ''
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
          show_in_hero: false,
          hero_featured_product_id: '',
          hero_rating: '5.0',
          hero_prep_time: '15 mins',
          show_banner: true,
          banner_style: 'floating',
          banner_badge: ''
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

    if (!validateImageSize(file, toast)) return;

    setIsUploading(true);
    setUploadStats(null);
    try {
      // 1. CLEANUP: Delete old image if it exists in Supabase
      if (formData.banner_image_url && formData.banner_image_url.includes('supabase.co')) {
        try {
          const url = new URL(formData.banner_image_url);
          const pathParts = url.pathname.split('/public/products/');
          if (pathParts.length > 1) {
            const oldPath = pathParts[1];
            await supabase.storage.from('products').remove([oldPath]);
          }
        } catch (cleanupErr) {
          console.warn('Non-critical: Error cleaning up old banner:', cleanupErr);
        }
      }

      const originalSize = file.size;
      // 2. COMPRESS & CONVERT to WebP
      const compressedFile = await compressAndWebp(file);
      const finalSize = compressedFile.size;
      
      // 3. PREPARE PATH
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.webp`;
      const filePath = `category-banners/${fileName}`;

      // 4. UPLOAD
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
      toast.success('Banner actualizado y optimizado');
    } catch (err) {
      console.error('Error uploading image:', err);
      toast.error('Error al subir el banner');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSave = { ...formData, sort_order: parseInt(formData.sort_order) || 0 };
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
    <Modal onClose={onCancel} wide maxWidth="max-w-6xl">
      <ModalHeader
        title={category ? 'Gestionar Categoría' : 'Nueva Categoría'}
        subtitle="Organiza tus productos y personaliza la experiencia visual."
        onClose={onCancel}
      />

      <form onSubmit={handleSubmit} className="overflow-hidden flex flex-col">
        <div className="px-7 py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-y-auto max-h-[70vh] custom-scrollbar">

          {/* CARD 1: IDENTIDAD */}
          <BentoCard title="Identidad & Disponibilidad">
            <FormField label="Icono Visual">
              <IconPicker 
                value={formData.icon} 
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))} 
              />
            </FormField>

            <FormField label="Nombre de la categoría">
              <TextInput 
                required 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="Ej. Entradas, Platos Fuertes..." 
              />
            </FormField>
            <FormField label="URL Amigable (Slug)">
              <TextInput 
                required 
                name="slug" 
                value={formData.slug} 
                onChange={handleChange} 
                placeholder="ej-categoria-slug" 
              />
            </FormField>
            
            <FormField label="Orden en Menú">
              <TextInput 
                type="number" 
                name="sort_order" 
                value={formData.sort_order} 
                onChange={handleChange} 
              />
            </FormField>

            <div className="pt-4 border-t border-gray-100 mt-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Horario de Servicio</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <FormField label="Desde">
                  <TextInput type="time" name="available_from" value={formData.available_from} onChange={handleChange} />
                </FormField>
                <FormField label="Hasta">
                  <TextInput type="time" name="available_to" value={formData.available_to} onChange={handleChange} />
                </FormField>
              </div>
              <p className="text-[10px] font-bold text-gray-500 mb-2">Días activos</p>
              <div className="flex flex-wrap gap-2">
                {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day, i) => {
                  const isActive = formData.visibility_config?.days?.includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={`w-8 h-8 rounded-xl text-[11px] font-black transition-all ${
                        isActive 
                          ? 'bg-[#2f4131] text-white shadow-md shadow-[#2f4131]/20 scale-105' 
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </BentoCard>

          {/* CARD 2: APARIENCIA */}
          <BentoCard title="Apariencia del Banner">
            <FormField label="Imagen de Portada">
              <div className="space-y-4">
                {formData.banner_image_url && (
                  <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-inner group">
                    <img src={formData.banner_image_url} alt="Banner Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, banner_image_url: '' }))}
                      className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm text-red-500 rounded-xl shadow-lg hover:bg-red-500 hover:text-white transition-all scale-90 group-hover:scale-100"
                    >
                      <Icon icon="lucide:trash-2" className="text-lg" />
                    </button>
                  </div>
                )}

                {!formData.banner_image_url && <ImageGuidance />}

                {uploadStats && formData.banner_image_url && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <Icon icon="lucide:sparkles" className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Optimización Exitosa</span>
                      </div>
                      <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[9px] font-black">
                        -{uploadStats.reduction}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white/60 rounded-xl p-2 border border-emerald-100/50 text-center">
                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Original</p>
                        <p className="text-xs font-bold text-gray-600">{uploadStats.original}KB</p>
                      </div>
                      <div className="bg-white/60 rounded-xl p-2 border border-emerald-100/50 text-center">
                        <p className="text-[9px] font-bold text-emerald-500 uppercase mb-0.5">WebP</p>
                        <p className="text-xs font-bold text-emerald-700">{uploadStats.final}KB</p>
                      </div>
                    </div>
                  </div>
                )}

                <label className={`group relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
                  isUploading ? 'bg-gray-50 border-gray-100 cursor-wait' : 'border-gray-200 bg-gray-50/50 hover:border-[#2f4131]/30 hover:bg-white hover:shadow-xl hover:shadow-gray-200/50'
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
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all ${
                      isUploading ? 'bg-gray-100 text-gray-400' : 'bg-white text-[#2f4131] shadow-md group-hover:scale-110 group-hover:rotate-3'
                    }`}>
                      <Icon icon={isUploading ? "lucide:loader-2" : "lucide:upload-cloud"} className={`text-2xl ${isUploading ? 'animate-spin' : ''}`} />
                    </div>
                    <p className="text-sm font-bold text-gray-700">
                      {isUploading ? 'Procesando...' : 'Cambiar Imagen'}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1 font-medium">PNG, JPG hasta 4MB</p>
                  </div>
                </label>

                <div className="pt-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-2">URL Manual / CDN</p>
                  <TextInput 
                    name="banner_image_url" 
                    value={formData.banner_image_url} 
                    onChange={handleChange} 
                    placeholder="https://images.unsplash.com/…" 
                    className="bg-white"
                  />
                </div>
              </div>
            </FormField>

            <div className="space-y-4 pt-4 border-t border-gray-100 mt-2">
              <div className="flex flex-col gap-4">
                <FormField label="Título en Banner">
                  <TextInput name="banner_title" value={formData.banner_title} onChange={handleChange} placeholder="Ej. Lo más pedido" />
                </FormField>
                <FormField label="Etiqueta Especial (Badge)">
                  <TextInput 
                    placeholder="Ej. Especialidad" 
                    value={formData.visibility_config?.banner_badge || ''} 
                    onChange={(e) => setFormData(p => ({ 
                      ...p, 
                      visibility_config: { ...p.visibility_config, banner_badge: e.target.value } 
                    }))} 
                  />
                </FormField>
              </div>
              <FormField label="Resumen / Descripción">
                <textarea 
                  name="banner_description" 
                  value={formData.banner_description} 
                  onChange={handleChange} 
                  rows={2}
                  placeholder="Pequeño texto descriptivo..."
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#2f4131] outline-none resize-none transition-all" 
                />
              </FormField>
            </div>
            
            <div className="pt-6 border-t border-gray-100 mt-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${formData.visibility_config?.show_banner !== false ? 'bg-[#2f4131] text-white' : 'bg-gray-200 text-gray-400'}`}>
                    <Icon icon={formData.visibility_config?.show_banner !== false ? "lucide:image" : "lucide:image-off"} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-black text-gray-800 uppercase tracking-tight">Activar Banner</p>
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black uppercase rounded-lg border border-amber-200">Pro</span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium">Mostrar destacados de categoría</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setFormData(p => ({ 
                    ...p, 
                    visibility_config: { ...p.visibility_config, show_banner: p.visibility_config?.show_banner === false } 
                  }))}
                  className={`w-11 h-6 rounded-full transition-colors relative ${formData.visibility_config?.show_banner !== false ? 'bg-[#2f4131]' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.visibility_config?.show_banner !== false ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              {formData.visibility_config?.show_banner !== false && (
                <div className="animate-in fade-in slide-in-from-top-2 space-y-4">
                  <FormField label="Tipo de Banner">
                    <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ 
                          ...p, 
                          visibility_config: { ...p.visibility_config, banner_style: 'floating' } 
                        }))}
                        className={`py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                          (formData.visibility_config?.banner_style || 'floating') === 'floating'
                            ? 'bg-white text-[#2f4131] shadow-sm'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        Flotante (Spinner)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ 
                          ...p, 
                          visibility_config: { ...p.visibility_config, banner_style: 'background' } 
                        }))}
                        className={`py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                          formData.visibility_config?.banner_style === 'background'
                            ? 'bg-white text-[#2f4131] shadow-sm'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        Fondo (Header)
                      </button>
                    </div>
                  </FormField>

                  <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex gap-3">
                    <Icon icon="lucide:info" className="text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
                      {(formData.visibility_config?.banner_style || 'floating') === 'floating' 
                        ? 'Ideal para platos o productos redondos con fondo transparente (PNG). El banner flotará después del título de la sección.'
                        : 'Ideal para fotos de ambiente o composiciones. El banner ocupará todo el ancho y contendrá el título de la categoría.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </BentoCard>

          {/* CARD 3: CONFIGURACIÓN AVANZADA */}
          <div className="space-y-6">
            <BentoCard title="Distribución & Subcategorías">
              <FormField label="Diseño de Sección">
                <select 
                  name="section_type" 
                  value={formData.visibility_config?.section_type || 'standard'}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    visibility_config: { ...prev.visibility_config, section_type: e.target.value }
                  }))}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#2f4131] outline-none transition-all"
                >
                  <option value="standard">Standard List</option>
                  <option value="grid">Grid (2 Col)</option>
                  <option value="grid-compact">Grid Compact</option>
                  <option value="horizontal-slider">Horizontal Slider</option>
                  <option value="bento-grid">Bento Grid (Premium)</option>
                  <option value="masonry">Masonry</option>
                </select>
              </FormField>

              <FormField label="Subcategorías (Habitaciones)">
                <div className="space-y-3">
                  <div className="relative group">
                    <TextInput 
                      placeholder="Escribe y presiona Enter..." 
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubManual(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="bg-white pr-10"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Icon icon="lucide:plus" className="text-gray-300 group-focus-within:text-[#2f4131] transition-colors" />
                    </div>
                  </div>

                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="subcategories">
                      {(provided) => (
                        <div 
                          {...provided.droppableProps} 
                          ref={provided.innerRef}
                          className="space-y-2 min-h-[40px] max-h-[250px] overflow-y-auto custom-scrollbar p-0.5"
                        >
                          {formData.visibility_config?.subcategories?.map((sub, index) => (
                            <Draggable key={sub} draggableId={sub} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`flex items-center justify-between pl-1 pr-3 py-1.5 bg-white border rounded-xl shadow-sm transition-all group ${
                                    snapshot.isDragging ? 'border-[#2f4131] ring-4 ring-[#2f4131]/5 z-50' : 'border-gray-100 hover:border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-1">
                                    <div 
                                      {...provided.dragHandleProps} 
                                      className="p-2 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing transition-colors"
                                      title="Arrastrar para reordenar"
                                    >
                                      <Icon icon="lucide:grip-vertical" className="text-lg" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-700">{sub}</span>
                                  </div>
                                  <button 
                                    type="button" 
                                    onClick={() => removeSubcategory(sub)}
                                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                  >
                                    <Icon icon="lucide:x" className="text-sm" />
                                  </button>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>
              </FormField>
            </BentoCard>

            <div className={`p-5 rounded-2xl border-2 transition-all ${
              formData.visibility_config?.show_in_hero 
                ? 'bg-[#2f4131]/5 border-[#2f4131]/20' 
                : 'bg-gray-50/50 border-transparent'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formData.visibility_config?.show_in_hero ? 'bg-[#2f4131] text-white' : 'bg-gray-200 text-gray-400'}`}>
                    <Icon icon="lucide:star" className={formData.visibility_config?.show_in_hero ? 'animate-pulse' : ''} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-800 uppercase tracking-tight">Home Hero</p>
                    <p className="text-[10px] text-gray-500 font-medium italic">Destacar en portada</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setFormData(p => ({ ...p, visibility_config: { ...p.visibility_config, show_in_hero: !p.visibility_config?.show_in_hero } }))}
                  className={`w-10 h-5 rounded-full relative transition-all shadow-inner ${formData.visibility_config?.show_in_hero ? 'bg-[#2f4131]' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${formData.visibility_config?.show_in_hero ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
              
              {formData.visibility_config?.show_in_hero && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <FormField label="Producto Destacado">
                    <select 
                      value={formData.visibility_config?.hero_featured_product_id || ''}
                      onChange={(e) => setFormData(p => ({ ...p, visibility_config: { ...p.visibility_config, hero_featured_product_id: e.target.value } }))}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-[#2f4131] outline-none"
                    >
                      <option value="">Selecciona un producto...</option>
                      {categoryProducts.map(prod => (
                        <option key={prod.id} value={prod.id}>{prod.name}</option>
                      ))}
                    </select>
                  </FormField>
                  <div className="flex flex-col gap-3">
                    <FormField label="Rating">
                      <TextInput 
                        placeholder="4.9" 
                        value={formData.visibility_config?.hero_rating || ''} 
                        onChange={(e) => setFormData(p => ({ ...p, visibility_config: { ...p.visibility_config, hero_rating: e.target.value } }))} 
                        className="bg-white"
                      />
                    </FormField>
                    <FormField label="Tiempo">
                      <TextInput 
                        placeholder="15-20 min" 
                        value={formData.visibility_config?.hero_prep_time || ''} 
                        onChange={(e) => setFormData(p => ({ ...p, visibility_config: { ...p.visibility_config, hero_prep_time: e.target.value } }))} 
                        className="bg-white"
                      />
                    </FormField>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SEDES DISPONIBILIDAD */}
          <div className="md:col-span-2 lg:col-span-3">
            <BentoCard title="Disponibilidad por Sede">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {locations.map(loc => {
                  const override = locationOverrides.find(o => o.location_id === loc.id);
                  const isActive = override ? override.is_active : true;
                  
                  return (
                    <div key={loc.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      isActive ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-100/50 border-transparent opacity-60'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${isActive ? 'bg-[#2f4131]/10 text-[#2f4131]' : 'bg-gray-200 text-gray-400'}`}>
                          <Icon icon="lucide:map-pin" />
                        </div>
                        <span className="text-sm font-bold text-gray-700">{loc.name}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => toggleLocation(loc.id)}
                        className={`w-10 h-5 rounded-full relative transition-all shadow-inner ${isActive ? 'bg-[#2f4131]' : 'bg-gray-200'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isActive ? 'left-5' : 'left-0.5'}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </BentoCard>
          </div>

          {/* ESTADO GLOBAL */}
          <div className="md:col-span-2 lg:col-span-3">
            <div className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
              formData.is_active ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                  formData.is_active ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-red-500 text-white shadow-red-200'
                }`}>
                  <Icon icon={formData.is_active ? "lucide:check-circle" : "lucide:pause-circle"} className="text-2xl" />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-800 uppercase tracking-tight">Estado de la Categoría</p>
                  <p className="text-xs text-gray-500 font-medium">
                    {formData.is_active ? 'Visible en el menú público' : 'Oculta para todos los clientes'}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                className={`w-14 h-7 rounded-full relative transition-all shadow-inner ${formData.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${formData.is_active ? 'left-8' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="px-7 py-6 border-t border-gray-100 bg-gray-50/30 flex gap-4">
          <SecondaryButton type="button" onClick={onCancel} className="flex-1 py-3">Cancelar</SecondaryButton>
          <PrimaryButton type="submit" className="flex-[2] py-3 shadow-xl shadow-[#2f4131]/20">
            <Icon icon="lucide:save" className="text-lg" />
            {category ? 'Guardar Cambios' : 'Crear Categoría'}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
