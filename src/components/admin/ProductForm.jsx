import { useState, useEffect, useRef, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useMenuData } from '../../context/MenuDataContext';
import { supabase } from '../../config/supabase';
import { Modal, ModalHeader, FormField, TextInput, PrimaryButton, SecondaryButton, Switch, ImageGuidance } from './ui';
import { Icon } from '@iconify-icon/react';
import { useLocations } from '../../hooks/useLocations';
import { useLocationOverrides } from '../../hooks/useLocationOverrides';
import { useRestaurantSettings } from '../../hooks/useRestaurantSettings';
import { validateImageSize, convertDriveLink, compressAndWebp } from '../../utils/images';
import { toast as toastFn } from '../Toast';
import { useAuth } from '../../context/AuthContext';
import { useGemini } from '../../hooks/useGemini';

const toast = {
  success: (msg) => toastFn(msg, { type: 'success' }),
  error: (msg) => toastFn(msg, { type: 'error' }),
};

const normalizeBrandConcepts = (concepts = []) =>
  concepts
    .map((concept) => {
      if (typeof concept === 'string') {
        return { value: concept, label: concept };
      }

      if (concept && typeof concept === 'object') {
        const label = concept.name || concept.label || concept.id || '';
        return label ? { value: label, label } : null;
      }

      return null;
    })
    .filter(Boolean);

export default function ProductForm({ product, categories, recipes = [], allergens = [], modifierGroups: propModifierGroups, onSave, onCancel }) {
  const { activeBrand } = useAuth();
  const { generateText, loading: isGeneratingText } = useGemini();
  const { rawModifierGroups: contextModifierGroups = [] } = useMenuData();
  const rawModifierGroups = propModifierGroups || contextModifierGroups;
  const { settings } = useRestaurantSettings();
  const brandConceptOptions = normalizeBrandConcepts(settings?.brand_concepts || []);
  const mainGroups = rawModifierGroups.filter(g => !g.is_submodifier);
  const subGroups = rawModifierGroups.filter(g => g.is_submodifier);

  const getSubGroupsForGroup = (group) => {
    const opts = group.modifier_options || group.options || [];
    if (opts.length === 0) return [];
    const nestedIds = opts.map(o => o.nested_group_id).filter(Boolean);
    return subGroups.filter(sg => nestedIds.includes(sg.id));
  };

  const getOrphanSubGroups = () => {
    const associatedIds = new Set();
    mainGroups.forEach(g => {
      const opts = g.modifier_options || g.options || [];
      opts.forEach(o => {
        if (o.nested_group_id) associatedIds.add(o.nested_group_id);
      });
    });
    return subGroups.filter(sg => !associatedIds.has(sg.id));
  };

  const orphanSubGroups = getOrphanSubGroups();

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(formData.modifier_groups || []);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setFormData(prev => ({ ...prev, modifier_groups: items }));
  };

  const [formData, setFormData] = useState({
    name: '', description: '', price: '', cost: '',
    category_id: '', stock_status: 'in', image_url: '',
    tags: [], is_active: true, is_addon: false,
    variants: [], modifier_groups: [], config_options: {}, recipe_id: null, packaging_fee: '',
    is_upsell: false, requires_kitchen: true, subcategory: '', brand_concept: '',
  });
  const [targetMargin, setTargetMargin] = useState(35);
  const [manageGroups, setManageGroups] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [uploadStats, setUploadStats] = useState(null);
  const fileInputRef = useRef(null);

  // --- Location Overrides ---
  const { locations } = useLocations();
  const { getProductOverrides } = useLocationOverrides();
  const [locationOverrides, setLocationOverrides] = useState([]);

  useEffect(() => {
    const loadOverrides = async () => {
      let prices = [];
      let status = [];
      
      if (product?.id) {
        const overrides = await getProductOverrides(product.id);
        prices = overrides.prices || [];
        status = overrides.status || [];
      }
      
      // Always merge with all locations to ensure they all show up
      const merged = locations.map(loc => {
        const p = prices.find(price => price.location_id === loc.id);
        const s = status.find(st => st.location_id === loc.id);
        return {
          location_id: loc.id,
          price: p ? p.price : '',
          is_active: s ? s.is_active : false, // Default to false if not linked
          stock_status: s ? s.stock_status : 'in',
          is_linked: !!s // New field to track if it's actually linked in DB
        };
      });
      
      setLocationOverrides(merged);
    };
    
    if (locations.length > 0) {
      loadOverrides();
    }
  }, [product?.id, locations]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleOverrideChange = (locationId, field, value) => {
    setLocationOverrides(prev => {
      const existing = prev.find(o => o.location_id === locationId);
      if (existing) {
        return prev.map(o => o.location_id === locationId ? { ...o, [field]: value } : o);
      } else {
        // Initialize with default values if not present
        return [...prev, { 
          location_id: locationId, 
          is_active: field === 'is_active' ? value : false, 
          stock_status: 'in', 
          is_linked: field === 'is_active' && value === true, // If they activate it, we consider it linked-to-be
          [field]: value 
        }];
      }
    });
  };

  // Reset image error state whenever the URL changes
  useEffect(() => {
    setImgError(false);
  }, [formData.image_url]);

  // Get available subcategories for the selected category
  const availableSubcategories = useMemo(() => {
    if (!formData.category_id || !categories) return [];
    const cat = categories.find(c => String(c.id) === String(formData.category_id));
    return cat?.visibility_config?.subcategories || [];
  }, [formData.category_id, categories]);

  // Reset subcategory if it's no longer valid for the new category
  useEffect(() => {
    if (availableSubcategories.length > 0) {
      // If the current subcategory is not in the new list (and not empty), reset it
      // Exception: Keep "Otros" or empty
      if (formData.subcategory && 
          formData.subcategory !== 'Otros' && 
          !availableSubcategories.includes(formData.subcategory)) {
        setFormData(prev => ({ ...prev, subcategory: '' }));
      }
    }
  }, [formData.category_id, availableSubcategories]);

  // Detect if the user pasted an Unsplash *page* URL instead of a direct image URL
  const isUnsplashPageLink = (url) => {
    if (!url) return false;
    return /unsplash\.com\/(photos|es\/fotos)\//i.test(url) && !/images\.unsplash\.com/i.test(url);
  };

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
        is_upsell: product.is_upsell ?? false,
        requires_kitchen: product.requires_kitchen ?? true,
        subcategory: product.subcategory || '',
        brand_concept: product.brand_concept || '',
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;
    
    // Auto-convert Google Drive links if the field is image_url
    if (name === 'image_url' && typeof newValue === 'string') {
      const converted = convertDriveLink(newValue);
      if (converted !== newValue) {
        newValue = converted;
        toast.success('Link de Google Drive convertido automáticamente');
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const toggleModifierGroup = (groupId) => {
    setFormData(prev => {
      const current = prev.modifier_groups || [];
      const isIn = current.includes(groupId);
      const newGroups = isIn ? current.filter(id => id !== groupId) : [...current, groupId];
      return {
        ...prev,
        modifier_groups: newGroups,
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



  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Aunque comprimamos, validamos el tamaño inicial por seguridad (ahora 4MB)
    if (!validateImageSize(file, toast)) return;

    try {
      setIsUploading(true);
      setUploadStats(null);
      
      const originalSize = file.size;

      // 1. Comprimir y convertir a WebP en el cliente
      const compressedFile = await compressAndWebp(file);
      const finalSize = compressedFile.size;
      
      // 2. Preparar ruta (forzar .webp)
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.webp`;
      const filePath = `${fileName}`;

      // 3. Subir a Supabase con Cache Control agresivo (1 año)
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, compressedFile, {
          cacheControl: '31536000',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 4. Obtener URL pública
      const { data } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      const newImageUrl = data.publicUrl;

      // 5. Lógica de limpieza: Borrar imagen anterior si existía
      if (formData.image_url && formData.image_url.includes('supabase.co')) {
        try {
          const parts = formData.image_url.split('/');
          const oldFileName = parts[parts.length - 1];
          
          if (oldFileName) {
            await supabase.storage
              .from('products')
              .remove([oldFileName]);
          }
        } catch (cleanupError) {
          console.warn('Error limpiando imagen antigua:', cleanupError);
        }
      }

      setFormData(prev => ({ ...prev, image_url: newImageUrl }));
      setUploadStats({
        original: (originalSize / 1024).toFixed(1),
        final: (finalSize / 1024).toFixed(1),
        reduction: (((originalSize - finalSize) / originalSize) * 100).toFixed(0)
      });
      
      toast.success('Imagen optimizada y subida correctamente');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error subiendo imagen. Intenta de nuevo.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGenerateAI = async () => {
    if (!formData.name) {
      toast.error('Por favor escribe el nombre del plato primero');
      return;
    }
    const prompt = `Escribe una descripción muy apetitosa, comercial y corta para un plato de restaurante llamado '${formData.name}'. Enfócate en resaltar su sabor y calidad.`;
    const generated = await generateText({ 
      brandId: activeBrand?.id, 
      prompt, 
      actionType: 'dish_description' 
    });
    if (generated) {
      setFormData(prev => ({ ...prev, description: generated }));
      toast.success('Descripción generada con IA ✨');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category_id) {
      alert('Por favor completa nombre, precio y categoría.');
      return;
    }
    
    // Normalize overrides
    const normalizedOverrides = locationOverrides.map(o => ({
      ...o,
      price: o.price === '' || o.price === undefined || o.price === null ? null : parseFloat(o.price)
    }));

    onSave({ 
      ...formData, 
      price: parseFloat(formData.price), 
      cost: parseFloat(formData.cost) || 0, 
      packaging_fee: parseFloat(formData.packaging_fee) || 0,
      subcategory: formData.subcategory || null,
      brand_concept: formData.brand_concept || null
    }, normalizedOverrides);
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
    <div className="fixed inset-0 bg-black/60 flex items-end md:items-start justify-center z-[100] p-0 md:p-4 overflow-hidden backdrop-blur-sm">
      <div className="bg-white rounded-t-[2rem] md:rounded-[2rem] w-full max-w-6xl h-[95vh] md:h-auto md:max-h-[90vh] md:my-8 flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200">

        {/* ── Header */}
        <div className="flex items-start justify-between px-5 md:px-8 py-4 md:py-6 border-b border-gray-100 shrink-0">
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

            {/* ── Left: 2 columns */}
            <div className="lg:col-span-2 space-y-6">

            {/* Basic Info */}
            <section className="border border-gray-100 rounded-2xl p-6 space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Información general</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
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
                <div className="md:col-span-3">
                  <FormField label="Subcategoría (Opcional)">
                    {availableSubcategories.length > 0 ? (
                      <select 
                        name="subcategory" 
                        value={formData.subcategory} 
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#2f4131] outline-none"
                      >
                        <option value="">Seleccionar subcategoría...</option>
                        {availableSubcategories.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                        <option value="Otros">Otros</option>
                      </select>
                    ) : (
                      <TextInput 
                        name="subcategory" 
                        value={formData.subcategory} 
                        onChange={handleChange} 
                        placeholder="Ej. Detox, Proteicos, etc." 
                      />
                    )}
                  </FormField>
                </div>
                <div className="md:col-span-3">
                  <FormField label="Concepto de Marca">
                    {brandConceptOptions.length > 0 ? (
                      <select 
                        name="brand_concept" 
                        value={formData.brand_concept} 
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#2f4131] outline-none"
                      >
                        <option value="">Seleccionar concepto...</option>
                        {brandConceptOptions.map(concept => (
                          <option key={concept.value} value={concept.value}>{concept.label}</option>
                        ))}
                      </select>
                    ) : (
                      <TextInput 
                        name="brand_concept" 
                        value={formData.brand_concept} 
                        onChange={handleChange} 
                        placeholder="Ej. Restaurante, Café, etc." 
                      />
                    )}
                  </FormField>
                </div>
                {/* --- SECCIÓN: DISPONIBILIDAD POR SEDE --- */}
                <div className="md:col-span-3">
                  <section className="bg-white border border-gray-100 rounded-2xl p-6 mb-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-[#2f4131]/5 flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#2f4131]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900">Disponibilidad por Sede</h3>
                        <p className="text-xs text-gray-500">Configura precios y visibilidad específicos para cada punto de venta.</p>
                      </div>
                      <div className="ml-auto">
                        <select
                          value={formData.visibility_mode || 'all'}
                          onChange={(e) => setFormData(prev => ({ ...prev, visibility_mode: e.target.value }))}
                          className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#2f4131]/10 text-gray-700 font-medium"
                        >
                          <option value="all">Todas las sedes (por defecto)</option>
                          <option value="specific">Sedes específicas (Whitelist)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {locations.map(loc => {
                        const locOverride = locationOverrides.find(o => o.location_id === loc.id);
                        const isLinked = locOverride?.is_linked;
                        
                        // Determinar si está activo basado en el modo y si existe registro
                        const isActive = locOverride?.is_active || false;
                        
                        const override = locOverride || { 
                          is_active: false, 
                          stock_status: 'in', 
                          price: '',
                          is_linked: false
                        };
                        return (
                          <div key={loc.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 rounded-xl border border-gray-50 bg-gray-50/30">
                            <div className="flex items-center gap-3 sm:min-w-[180px]">
                              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-900 leading-tight">{loc.name}</span>
                                {isLinked ? (
                                  <span className="text-[9px] font-bold text-green-600 uppercase tracking-wider">Vinculado</span>
                                ) : (
                                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">No vinculado</span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-row items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto">
                              {/* Toggle Visibilidad */}
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-medium text-gray-500 uppercase">Visible</span>
                                <Switch
                                  checked={isActive}
                                  onChange={(val) => handleOverrideChange(loc.id, 'is_active', val)}
                                  size="sm"
                                />
                              </div>

                              {/* Precio Override */}
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-medium text-gray-500 uppercase">Precio</span>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                  <input
                                    type="number"
                                    placeholder={formData.price || '0'}
                                    value={override.price}
                                    onChange={(e) => handleOverrideChange(loc.id, 'price', e.target.value)}
                                    className="w-28 pl-6 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-[#2f4131] outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>

                <div className="md:col-span-3 relative">
                  <div className="absolute right-0 top-0 -mt-1 mr-1 z-10">
                    <button 
                      type="button" 
                      onClick={handleGenerateAI}
                      disabled={isGeneratingText}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-100 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      <Icon icon="heroicons:sparkles" className="text-sm" />
                      {isGeneratingText ? 'Generando...' : 'Generar con IA'}
                    </button>
                  </div>
                  <FormField label="Descripción">
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={3}
                      placeholder="Describe los sabores, texturas y por qué deberían pedirlo…"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#2f4131] outline-none resize-none" />
                  </FormField>
                </div>
                <div className="md:col-span-3">
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
                <div className="md:col-span-1">
                  <FormField label="¿Sugerido para Upselling?">
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, is_upsell: !prev.is_upsell }))}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${formData.is_upsell ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-5 rounded-full relative transition-all ${formData.is_upsell ? 'bg-amber-500' : 'bg-gray-300'}`}>
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${formData.is_upsell ? 'left-4' : 'left-0.5'}`} />
                        </div>
                        <span>{formData.is_upsell ? 'Sí' : 'No'}</span>
                      </div>
                    </button>
                  </FormField>
                  <p className="text-[11px] text-gray-400 mt-1 leading-tight">Si está activo, se sugerirá este producto en el carrito (Ej. bebidas, postres).</p>
                </div>
                <div className="md:col-span-1">
                  <FormField label="¿Requiere preparación en cocina?">
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, requires_kitchen: !prev.requires_kitchen }))}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${formData.requires_kitchen ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-5 rounded-full relative transition-all ${formData.requires_kitchen ? 'bg-blue-500' : 'bg-gray-300'}`}>
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${formData.requires_kitchen ? 'left-4' : 'left-0.5'}`} />
                        </div>
                        <span>{formData.requires_kitchen ? 'Sí' : 'No'}</span>
                      </div>
                    </button>
                  </FormField>
                  <p className="text-[11px] text-gray-400 mt-1 leading-tight">Manda pedido a cocina. Apágalo para productos ya listos (Ej. gaseosas, chips).</p>
                </div>
                <div className="md:col-span-3">
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


                {/* Modifier Groups UI Revamp */}
                <div className="md:col-span-full mt-4 pt-4 border-t border-gray-100">
                  <div className="mb-4">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Personalizaciones / Extras</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Asigna grupos de opciones principales a este producto. Seleccionalos abajo y arrástralos aquí para ordenarlos.</p>
                  </div>

                  {/* Drag and drop for selected items */}
                  {(formData.modifier_groups || []).length > 0 && (
                    <div className="mb-6 p-4 rounded-2xl bg-violet-50/50 border border-violet-100">
                      <p className="text-[11px] font-bold text-violet-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Icon icon="heroicons:bars-arrow-down" className="text-sm" /> 
                        Modificadores Activos (Arrastra para ordenar)
                      </p>
                      <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="selected-modifiers">
                          {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                              {(formData.modifier_groups || []).map((id, index) => {
                                const g = rawModifierGroups.find(x => x.id === id);
                                if (!g) return null;
                                return (
                                  <Draggable key={id} draggableId={id} index={index}>
                                    {(provided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-violet-200 shadow-sm transition-shadow hover:shadow-md"
                                      >
                                        <div className="flex items-center gap-3">
                                          <Icon icon="heroicons:bars-2" className="text-violet-300 cursor-grab" />
                                          <span className="text-sm font-semibold text-violet-900">{g.name}</span>
                                          {g.is_submodifier && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">Sub</span>}
                                        </div>
                                        <button type="button" onClick={() => toggleModifierGroup(id)} className="text-violet-300 hover:text-red-500 transition-colors p-1">
                                          <Icon icon="heroicons:x-mark" className="text-lg" />
                                        </button>
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    </div>
                  )}

                  {rawModifierGroups.length > 0 ? (
                    <>
                      {/* Main Groups */}
                      {mainGroups.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Modificadores Principales</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
                            {mainGroups.map(group => {
                              const isSelected = (formData.modifier_groups || []).includes(group.id);
                              const associatedSubGroups = getSubGroupsForGroup(group);
                              
                              return (
                                <div key={group.id} className="flex flex-col gap-2">
                                  <button type="button" onClick={() => toggleModifierGroup(group.id)}
                                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                                      isSelected ? 'border-violet-400 bg-violet-50 text-violet-900' : 'border-gray-100 text-gray-500 hover:border-gray-200 bg-gray-50'
                                    }`}>
                                    <div className="flex items-center gap-2">
                                      <span className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${isSelected ? 'bg-violet-600 border-violet-600' : 'border-gray-300'}`} />
                                      <span className="text-sm font-semibold truncate capitalize">{group.name}</span>
                                    </div>
                                  </button>

                                  {isSelected && associatedSubGroups.length > 0 && (
                                    <div className="pl-4 border-l-2 border-violet-100 flex flex-col gap-1.5 ml-1.5 mt-1">
                                      {associatedSubGroups.map(sg => {
                                        const isSubSelected = (formData.modifier_groups || []).includes(sg.id);
                                        return (
                                          <button key={sg.id} type="button" onClick={() => toggleModifierGroup(sg.id)}
                                            className={`px-3 py-1.5 text-left rounded-lg border text-[11px] font-semibold transition-all ${
                                              isSubSelected ? 'border-violet-300 bg-violet-100 text-violet-800' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                                            }`}>
                                            {isSubSelected && '✓ '} Sub: {sg.name}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Orphan Sub Groups */}
                      {orphanSubGroups.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-400 mb-2">Otros Sub-modificadores</p>
                          <p className="text-[10px] text-gray-400 mb-3 leading-tight">Sub-modificadores que no están linkeados a ninguna opción principal actualmente.</p>
                          <div className="flex flex-wrap gap-2">
                            {orphanSubGroups.map(group => {
                              const isSelected = (formData.modifier_groups || []).includes(group.id);
                              return (
                                <button key={group.id} type="button" onClick={() => toggleModifierGroup(group.id)}
                                  className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
                                    isSelected ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-gray-200 bg-white text-gray-400 hover:bg-gray-50'
                                  }`}>
                                  {isSelected && '✓ '} {group.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Icon icon="heroicons:squares-plus" className="text-gray-400 text-xl" />
                      </div>
                      <p className="text-sm font-semibold text-gray-500 mb-1">No hay grupos de modificadores</p>
                      <p className="text-[10px] text-gray-400 max-w-[200px] mx-auto leading-tight">
                        Crea grupos en la sección <span className="font-bold">Extras y Opciones</span> para poder asignarlos a tus productos.
                      </p>
                    </div>
                  )}
                </div>

                {/* Diets Section */}
                <div className="md:col-span-1 mt-4 pt-4 border-t border-gray-100">
                  <p className="block text-sm font-medium text-gray-700 mb-2">Dietas</p>
                  <div className="flex flex-wrap gap-2">
                    {allergens.filter(a => a.type === 'diet').map(diet => {
                      const isSelected = formData.tags?.includes(diet.name);
                      return (
                        <button
                          key={diet.id}
                          type="button"
                          onClick={() => toggleTag(diet.name)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-sm transition-colors ${
                            isSelected
                              ? 'bg-[#1C2B1E]/10 border-[#1C2B1E]/20 text-[#1C2B1E] font-semibold'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-base">{diet.emoji}</span>
                          <span>{diet.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">
                    Selecciona las dietas que aplican a este producto.
                  </p>
                </div>

                {/* Allergens Section */}
                <div className="md:col-span-1 mt-4 pt-4 border-t border-gray-100">
                  <p className="block text-sm font-medium text-gray-700 mb-2">Alérgenos</p>
                  <div className="flex flex-wrap gap-2">
                    {allergens.filter(a => a.type !== 'diet').length > 0 ? allergens.filter(a => a.type !== 'diet').map(allergen => {
                      const isSelected = formData.tags?.includes(allergen.name);
                      return (
                        <button
                          key={allergen.id}
                          type="button"
                          onClick={() => toggleTag(allergen.name)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-sm transition-colors ${
                            isSelected
                              ? 'bg-red-50 border-red-200 text-red-700 font-semibold'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-base">{allergen.emoji}</span>
                          <span>{allergen.name}</span>
                        </button>
                      );
                    }) : (
                      <p className="text-xs text-gray-400">No hay alérgenos configurados.</p>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">
                    Marca si el producto contiene alguno de estos alérgenos.
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
              
              {/* Preview area */}
              {formData.image_url && (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 mb-3">
                  {!imgError ? (
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      <svg className="w-8 h-8 text-red-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                      </svg>
                      <p className="text-[12px] font-semibold text-red-400">No se pudo cargar la imagen</p>
                      <p className="text-[11px] text-gray-400 mt-1">Verifica que la URL sea de una imagen directa (.jpg, .png, .webp)</p>
                    </div>
                  )}
                  {/* Clear image button */}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-all"
                    title="Quitar imagen"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              )}



              {/* Unsplash page link warning */}
              {isUnsplashPageLink(formData.image_url) && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-3">
                  <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  <div>
                    <p className="text-[12px] font-semibold text-amber-700">Este es un link de página, no de imagen</p>
                    <p className="text-[11px] text-amber-600 mt-0.5 leading-relaxed">
                      En Unsplash, haz clic derecho sobre la foto → "Copiar dirección de imagen". 
                      El link debe comenzar con <code className="bg-amber-100 px-1 rounded text-[10px]">https://images.unsplash.com/...</code>
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col gap-4 mt-2">
                <ImageGuidance />
                
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">Subir archivo directo</label>
                  <label className={`group relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
                    isUploading ? 'bg-gray-50 border-gray-100 cursor-not-allowed' : 'border-violet-100 bg-violet-50/30 hover:border-violet-300 hover:bg-violet-50'
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
                        isUploading ? 'bg-gray-200 text-gray-400 animate-pulse' : 'bg-violet-100 text-violet-600 group-hover:scale-110'
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
                
                {isUploading && (
                  <p className="text-[11px] text-violet-600 font-medium animate-pulse">
                    Subiendo imagen...
                  </p>
                )}

                <FormField label="O ingresa la URL manualmente (Recomendado)">
                  <TextInput type="text" name="image_url" value={formData.image_url} onChange={handleChange}
                    placeholder="https://images.unsplash.com/…  o  /img/products/mi-foto.jpg" disabled={isUploading} />
                </FormField>
                
                {formData.image_url && !imgError && !isUnsplashPageLink(formData.image_url) && (
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-green-600 font-medium flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      Imagen cargada correctamente
                    </p>
                    {uploadStats ? (
                      <div className="flex items-center gap-1.5 animate-in fade-in zoom-in duration-300">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm">
                          WebP
                        </span>
                        <span className="bg-gray-50 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider shadow-sm">
                          {uploadStats.final} KB
                        </span>
                      </div>
                    ) : formData.image_url.includes('.webp') ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm">
                        WebP
                      </span>
                    ) : formData.image_url.includes('images.unsplash.com') ? (
                      <span className="bg-gray-50 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm">
                        UNSPLASH
                      </span>
                    ) : (
                      <span className="bg-gray-50 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm">
                        {formData.image_url.match(/\.([a-zA-Z0-9]{3,4})(?:[\?#]|$)/)?.[1]?.toUpperCase() || 'IMG'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 md:px-8 py-4 flex items-center justify-end gap-3 z-10 shrink-0">
          <SecondaryButton type="button" onClick={onCancel} className="w-full sm:w-auto px-6 py-2.5">
            Cancelar
          </SecondaryButton>
          <PrimaryButton type="submit" className="w-full sm:w-auto px-6 py-2.5">
            {product ? 'Guardar cambios' : 'Crear producto'}
          </PrimaryButton>
        </div>
      </form>
    </div>
  </div>
);
}
