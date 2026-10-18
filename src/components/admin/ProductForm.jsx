import { useState, useEffect, useRef, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useMenuData } from '../../context/MenuDataContext';
import { supabase } from '../../config/supabase';
import { Icon } from '@iconify-icon/react';
import { useLocations } from '../../hooks/useLocations';
import { useLocationOverrides } from '../../hooks/useLocationOverrides';
import { useRestaurantSettings } from '../../hooks/useRestaurantSettings';
import { validateImageSize, convertDriveLink, compressAndWebp, getMaxImageSizeMB } from '../../utils/images';
import { toast as toastFn } from '../Toast';
import { useAuth } from '../../context/AuthContext';
import { useGemini } from '../../hooks/useGemini';
import { ImageGuidance } from './ui';

const toast = {
  success: (msg) => toastFn(msg, { type: 'success' }),
  error: (msg) => toastFn(msg, { type: 'error' }),
};

const SYSTEM_CONCEPT_IDS = new Set(['operations_model', 'telegram_dispatch']);

const normalizeBrandConcepts = (concepts = []) => {
  if (!Array.isArray(concepts)) return [];
  return concepts
    .filter((concept) => {
      if (!concept) return false;
      if (typeof concept === 'string') return concept.trim().length > 0;
      if (typeof concept === 'object') {
        if (SYSTEM_CONCEPT_IDS.has(concept.id)) return false;
        if (concept.fulfillment_modes || concept.bot_token) return false;
        return Boolean(concept.name || concept.label);
      }
      return false;
    })
    .map((concept) => {
      if (typeof concept === 'string') {
        return { value: concept, label: concept };
      }
      const label = concept.name || concept.label;
      return { value: label, label };
    });
};

export default function ProductForm({
  product,
  categories = [],
  recipes = [],
  ingredients = [],
  allergens = [],
  modifierGroups: propModifierGroups,
  onSave,
  onCancel
}) {
  const { activeBrand } = useAuth();
  const { generateText, loading: isGeneratingText } = useGemini();
  const { rawModifierGroups: contextModifierGroups = [] } = useMenuData();
  const rawModifierGroups = propModifierGroups || contextModifierGroups;
  const { settings } = useRestaurantSettings();
  const brandConceptOptions = normalizeBrandConcepts(settings?.brand_concepts || []);

  // Split modifiers into main and sub
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

  // Filter only FINAL DISH recipes (exclude subrecipes like sauces, sushi rice batches, etc.)
  const finalDishRecipes = useMemo(() => {
    return (recipes || []).filter(r => !r.is_subrecipe);
  }, [recipes]);

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
    ingredient_id: null,
    packaging_fee: '',
    is_upsell: false,
    requires_kitchen: true,
    station: 'kitchen',
    subcategory: '',
    brand_concept: '',
    visibility_mode: 'all',
  });

  const [targetMargin, setTargetMargin] = useState(35);
  const [isUploading, setIsUploading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [uploadStats, setUploadStats] = useState(null);
  const [liveImageSize, setLiveImageSize] = useState(null);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [cogsMode, setCogsMode] = useState('recipe'); // 'recipe' | 'ingredient'
  const [customLocationPricing, setCustomLocationPricing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Auto-detect image size (in KB) for live validation even if uploaded previously
  useEffect(() => {
    if (!formData.image_url || imgError) {
      setLiveImageSize(null);
      return;
    }
    let isCancelled = false;
    fetch(formData.image_url, { method: 'HEAD' })
      .then(res => {
        const len = res.headers.get('content-length');
        if (len && !isCancelled) {
          const kb = (parseInt(len, 10) / 1024).toFixed(1);
          setLiveImageSize(kb);
        } else if (!isCancelled) {
          fetch(formData.image_url)
            .then(r => r.blob())
            .then(b => {
              if (!isCancelled) setLiveImageSize((b.size / 1024).toFixed(1));
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        fetch(formData.image_url)
          .then(r => r.blob())
          .then(b => {
            if (!isCancelled) setLiveImageSize((b.size / 1024).toFixed(1));
          })
          .catch(() => {});
      });
    return () => { isCancelled = true; };
  }, [formData.image_url, imgError]);

  // --- Location Overrides ---
  const { locations = [] } = useLocations();
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

      // Check if any location has an override price that diverges from the base price
      const hasDivergentPrice = prices.some(
        p => p.price !== null && p.price !== undefined && p.price !== '' && Number(p.price) !== Number(product?.price)
      );
      setCustomLocationPricing(hasDivergentPrice);

      const merged = locations.map(loc => {
        const p = prices.find(price => price.location_id === loc.id);
        const s = status.find(st => st.location_id === loc.id);
        return {
          location_id: loc.id,
          price: p && p.price !== null && p.price !== undefined ? p.price : '',
          is_active: s ? s.is_active : false,
          stock_status: s ? s.stock_status : 'in',
          is_linked: !!s
        };
      });

      setLocationOverrides(merged);
    };

    if (locations.length > 0) {
      loadOverrides();
    }
  }, [product?.id, locations]);

  // Lock body scroll and listen for Escape key
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel]);

  // Populate formData when editing existing product
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price ?? '',
        cost: product.cost ?? '',
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
        ingredient_id: product.ingredient_id || null,
        packaging_fee: product.packaging_fee ?? '',
        is_upsell: product.is_upsell ?? false,
        requires_kitchen: product.requires_kitchen ?? true,
        station: product.station || (product.requires_kitchen === false ? 'none' : 'kitchen'),
        subcategory: product.subcategory || '',
        brand_concept: product.brand_concept || '',
        visibility_mode: product.visibility_mode || 'all',
      });

      if (product.ingredient_id) {
        setCogsMode('ingredient');
      } else if (product.recipe_id) {
        setCogsMode('recipe');
      }
    }
  }, [product]);

  // Reset image error state when url changes
  useEffect(() => {
    setImgError(false);
  }, [formData.image_url]);

  // Subcategories logic
  const availableSubcategories = useMemo(() => {
    if (!formData.category_id || !categories) return [];
    const cat = categories.find(c => String(c.id) === String(formData.category_id));
    return cat?.visibility_config?.subcategories || [];
  }, [formData.category_id, categories]);

  useEffect(() => {
    if (availableSubcategories.length > 0) {
      if (
        formData.subcategory &&
        formData.subcategory !== 'Otros' &&
        !availableSubcategories.includes(formData.subcategory)
      ) {
        setFormData(prev => ({ ...prev, subcategory: '' }));
      }
    }
  }, [formData.category_id, availableSubcategories]);

  const isUnsplashPageLink = (url) => {
    if (!url) return false;
    return /unsplash\.com\/(photos|es\/fotos)\//i.test(url) && !/images\.unsplash\.com/i.test(url);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;

    if (name === 'image_url' && typeof newValue === 'string') {
      const converted = convertDriveLink(newValue);
      if (converted !== newValue) {
        newValue = converted;
        toast.success('Link de Google Drive convertido automáticamente');
      }
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleOverrideChange = (locationId, field, value) => {
    setLocationOverrides(prev => {
      const existing = prev.find(o => o.location_id === locationId);
      if (existing) {
        return prev.map(o => o.location_id === locationId ? { ...o, [field]: value } : o);
      } else {
        return [...prev, {
          location_id: locationId,
          is_active: field === 'is_active' ? value : false,
          stock_status: 'in',
          is_linked: field === 'is_active' && value === true,
          [field]: value
        }];
      }
    });
  };

  const toggleModifierGroup = (groupId) => {
    setFormData(prev => {
      const current = prev.modifier_groups || [];
      const isIn = current.includes(groupId);
      const group = rawModifierGroups.find(g => g.id === groupId);
      const associatedSubGroupIds = group ? getSubGroupsForGroup(group).map(sg => sg.id) : [];

      let newGroups;
      if (isIn) {
        newGroups = current.filter(id => id !== groupId && !associatedSubGroupIds.includes(id));
      } else {
        newGroups = Array.from(new Set([...current, groupId, ...associatedSubGroupIds]));
      }

      return { ...prev, modifier_groups: newGroups };
    });
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(formData.modifier_groups || []);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setFormData(prev => ({ ...prev, modifier_groups: items }));
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

    if (!validateImageSize(file, toast, activeBrand?.plan_id)) return;

    try {
      setIsUploading(true);
      setUploadStats(null);
      const originalSize = file.size;
      const compressedFile = await compressAndWebp(file, activeBrand?.plan_id);
      const finalSize = compressedFile.size;

      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.webp`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, compressedFile, {
          cacheControl: '31536000',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      const newImageUrl = data.publicUrl;

      // Clean up previous image if it was hosted in our bucket
      if (formData.image_url && formData.image_url.includes('supabase.co')) {
        try {
          const parts = formData.image_url.split('/');
          const oldFileName = parts[parts.length - 1];
          if (oldFileName) {
            await supabase.storage.from('products').remove([oldFileName]);
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
      setLiveImageSize((finalSize / 1024).toFixed(1));

      toast.success('Imagen optimizada a WebP y subida con éxito');
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
    const prompt = `Escribe una descripción gastronómica atractiva, apetitosa y concisa (máximo 2 frases) para el plato '${formData.name}'. Resalta sus ingredientes y experiencia de sabor.`;
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
    if (e) e.preventDefault();

    if (!formData.name || formData.name.trim() === '') {
      toast.error('El nombre del plato es obligatorio.');
      return;
    }
    if (formData.price === '' || formData.price === null || isNaN(formData.price)) {
      toast.error('El precio base al público es obligatorio.');
      return;
    }
    if (!formData.category_id) {
      toast.error('Debes seleccionar una categoría.');
      return;
    }

    setIsSaving(true);

    // Normalize location overrides
    // IMPORTANT: If customLocationPricing is false, price is explicitly NULL for all locations,
    // which triggers saveProductOverrides to DELETE any location_product_prices override in Supabase!
    const normalizedOverrides = locationOverrides.map(o => ({
      ...o,
      price: customLocationPricing
        ? (o.price === '' || o.price === undefined || o.price === null ? null : parseFloat(o.price))
        : null
    }));

    // Ensure all sub-modifiers of selected main groups are preserved
    const resolvedModifierGroups = new Set(formData.modifier_groups || []);
    (formData.modifier_groups || []).forEach(gId => {
      const group = rawModifierGroups.find(g => g.id === gId);
      if (group) {
        getSubGroupsForGroup(group).forEach(sg => resolvedModifierGroups.add(sg.id));
      }
    });

    onSave({
      ...formData,
      modifier_groups: Array.from(resolvedModifierGroups),
      price: parseFloat(formData.price),
      cost: parseFloat(formData.cost) || 0,
      packaging_fee: parseFloat(formData.packaging_fee) || 0,
      subcategory: formData.subcategory || null,
      brand_concept: formData.brand_concept || null,
      visibility_mode: formData.visibility_mode || 'all',
    }, normalizedOverrides);
  };

  // Recipe lookup (check all recipes to know if linked recipe is legacy subrecipe)
  const linkedRecipe = useMemo(() => {
    return (recipes || []).find(r => r.id === formData.recipe_id);
  }, [recipes, formData.recipe_id]);

  // Direct Ingredient lookup
  const linkedIngredient = useMemo(() => {
    return (ingredients || []).find(i => i.id === formData.ingredient_id);
  }, [ingredients, formData.ingredient_id]);

  // Filtered ingredients for direct purchase / botellería selection
  const directIngredients = useMemo(() => {
    return (ingredients || []).filter(i => !i.is_subrecipe && !(i.name || '').toLowerCase().includes('(subreceta)'));
  }, [ingredients]);

  const searchedIngredients = useMemo(() => {
    if (!ingredientSearch.trim()) return directIngredients;
    const term = ingredientSearch.toLowerCase();
    return directIngredients.filter(i => 
      (i.name || '').toLowerCase().includes(term) ||
      (i.sku || '').toLowerCase().includes(term) ||
      (i.category || '').toLowerCase().includes(term)
    );
  }, [directIngredients, ingredientSearch]);

  // Financial metrics
  const priceNum = parseFloat(formData.price) || 0;
  const costNum = parseFloat(formData.cost) || 0;
  const packFee = parseFloat(formData.packaging_fee) || 0;
  const totalCOGS = costNum + packFee;
  const profit = priceNum - totalCOGS;
  const margin = priceNum > 0 ? (profit / priceNum) * 100 : 0;
  const suggested = totalCOGS > 0 ? Math.round(totalCOGS / (1 - (targetMargin / 100))) : 0;
  const marginDiff = margin - targetMargin;

  // Filtered recipes for selection
  const searchedFinalRecipes = useMemo(() => {
    if (!recipeSearch.trim()) return finalDishRecipes;
    const term = recipeSearch.toLowerCase();
    return finalDishRecipes.filter(r => r.name?.toLowerCase().includes(term));
  }, [finalDishRecipes, recipeSearch]);

  const selectedCategoryName = useMemo(() => {
    const c = categories.find(cat => String(cat.id) === String(formData.category_id));
    return c?.name || 'Sin Categoría';
  }, [categories, formData.category_id]);

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* ═══════════════════════════════════════════════════════════════
          STUDIO HEADER BAR (Sticky Top)
      ═══════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-700">
            <Icon icon="heroicons:sparkles" className="text-xl text-emerald-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                Product Studio
              </span>
              <span className="text-xs font-semibold text-slate-600 truncate">
                / {selectedCategoryName}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate leading-tight mt-0.5">
              {formData.name.trim() ? formData.name : (product ? 'Editar Producto' : 'Nuevo Producto')}
            </h1>
          </div>
        </div>

        {/* Global Active Switch & Actions */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* Active on Menu Toggle */}
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              formData.is_active
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${formData.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            {formData.is_active ? 'Visible en Carta' : 'Oculto en Carta'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-slate-200"
          >
            Descartar (Esc)
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Icon icon="lucide:loader-2" className="animate-spin text-sm" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Icon icon="heroicons:check-circle" className="text-base" />
                <span>{product ? 'Guardar Cambios' : 'Crear Producto'}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN 3-COLUMN STUDIO LAYOUT (Scrollable)
      ═══════════════════════════════════════════════════════════════ */}
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 p-4 sm:p-6 lg:p-8">
        <form onSubmit={handleSubmit} className="max-w-[1700px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-start pb-20">

          {/* ─────────────────────────────────────────────────────────────
              COLUMNA 1: IDENTIDAD & FICHA COMERCIAL
          ───────────────────────────────────────────────────────────── */}
          <div className="space-y-6">
            
            {/* Foto del Producto */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Icon icon="heroicons:camera" className="text-slate-400 text-sm" />
                  Fotografía del Plato
                </span>
                {formData.image_url && !imgError && (
                  <div className="flex items-center gap-1.5">
                    {uploadStats?.reduction && (
                      <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {Number(uploadStats.original) > 1024 
                          ? `${(Number(uploadStats.original) / 1024).toFixed(1)} MB` 
                          : `${uploadStats.original} KB`} ➔ {uploadStats.final} KB
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                      <Icon icon="heroicons:sparkles" className="text-[10px] text-emerald-600" />
                      {uploadStats?.reduction 
                        ? `WebP (-${uploadStats.reduction}%)` 
                        : (liveImageSize ? `WebP (${liveImageSize} KB)` : 'Optimizado WebP')}
                    </span>
                  </div>
                )}
              </div>

              {/* Preview Box */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 mb-3 group">
                {formData.image_url && !imgError ? (
                  <>
                    <img
                      src={formData.image_url}
                      alt={formData.name || 'Preview'}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={() => setImgError(true)}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                      className="absolute top-2.5 right-2.5 p-1.5 bg-black/70 hover:bg-red-600 text-white rounded-lg transition-all shadow-md"
                      title="Eliminar imagen"
                    >
                      <Icon icon="heroicons:trash" className="text-sm" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <Icon icon="heroicons:photo" className="text-3xl text-slate-300 mb-1" />
                    <p className="text-xs font-semibold text-slate-400">Sin foto del plato</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Sube un archivo WebP o ingresa una URL</p>
                  </div>
                )}
              </div>

              {/* Chips de Validación Visual de Compresión & Peso */}
              {formData.image_url && !imgError && (
                <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 mb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Icon icon="heroicons:chart-bar" className="text-emerald-600 text-xs" />
                      Auditoría Visual de Peso
                    </span>
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {uploadStats?.reduction ? `Comprimido (-${uploadStats.reduction}%)` : 'Optimizado en Servidor'}
                    </span>
                  </div>

                  {/* Chips Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-0.5">
                    {/* Chip 1: Peso Actual */}
                    <div className="bg-white border border-slate-200 rounded-lg p-2 flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Peso Actual</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-xs font-black text-slate-800">
                          {uploadStats?.final 
                            ? `${uploadStats.final} KB` 
                            : (liveImageSize ? `${liveImageSize} KB` : 'Detectando...')}
                        </span>
                        <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">WebP</span>
                      </div>
                    </div>

                    {/* Chip 2: Peso Original o Estado */}
                    <div className="bg-white border border-slate-200 rounded-lg p-2 flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        {uploadStats?.original ? 'Peso Original' : 'Estado CDN'}
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-xs font-black text-slate-600">
                          {uploadStats?.original 
                            ? (Number(uploadStats.original) > 1024 
                                ? `${(Number(uploadStats.original) / 1024).toFixed(2)} MB` 
                                : `${uploadStats.original} KB`)
                            : (liveImageSize && Number(liveImageSize) < 150 ? 'Ultraligero' : 'Web Ready')}
                        </span>
                        {uploadStats?.reduction && (
                          <span className="text-[9px] font-black text-emerald-600">(-{uploadStats.reduction}%)</span>
                        )}
                      </div>
                    </div>

                    {/* Chip 3: Carga en Móvil */}
                    <div className="bg-white border border-slate-200 rounded-lg p-2 flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Carga Móvil</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Icon icon="heroicons:bolt" className="text-amber-500 text-xs shrink-0" />
                        <span className="text-xs font-black text-emerald-600">
                          {uploadStats?.final && Number(uploadStats.final) < 200 
                            ? '< 0.1s' 
                            : (liveImageSize && Number(liveImageSize) < 200 ? '< 0.1s' : 'Rápida')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Micro Hint */}
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium pt-0.5">
                    <Icon icon="heroicons:check-circle" className="text-emerald-600 text-xs shrink-0" />
                    <span>Tu imagen carga ultra rápido en los celulares de los clientes y no consume datos móviles.</span>
                  </div>
                </div>
              )}

              {/* Warnings */}
              {isUnsplashPageLink(formData.image_url) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-3 text-[11px] text-amber-800">
                  <p className="font-bold">⚠️ Enlace de página de Unsplash detectado</p>
                  <p className="text-[10px] text-amber-700 mt-0.5">
                    Haz clic derecho en la foto de Unsplash y elige <em>"Copiar dirección de imagen"</em> (debe iniciar con images.unsplash.com).
                  </p>
                </div>
              )}

              {/* File Upload Dropzone */}
              <label className={`group relative flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl transition-all cursor-pointer mb-3 ${
                isUploading ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : 'border-slate-300 bg-slate-50/60 hover:border-emerald-500 hover:bg-emerald-50/20'
              }`}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                  disabled={isUploading}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Icon icon={isUploading ? "lucide:loader-2" : "lucide:upload-cloud"} className={`text-base ${isUploading ? 'animate-spin' : ''}`} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700 group-hover:text-emerald-800">
                      {isUploading ? 'Comprimiendo y subiendo...' : 'Subir imagen desde equipo'}
                    </p>
                    <p className="text-[10px] text-slate-600">Conversión automática a WebP ultraligero</p>
                  </div>
                </div>
              </label>

              {/* URL Input */}
              <div className="relative">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  O vincular URL externa (Unsplash, Drive, CDN)
                </span>
                <input
                  type="text"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleChange}
                  placeholder="https://images.unsplash.com/... o enlace de Drive"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Datos Comerciales */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                Ficha Comercial
              </span>

              {/* Nombre */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nombre del Plato <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej. Bowl Pollito Teriyaki"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* Categoría y Subcategoría */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Categoría <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                  >
                    <option value="">Seleccionar categoría...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Subcategoría
                  </label>
                  {availableSubcategories.length > 0 ? (
                    <select
                      name="subcategory"
                      value={formData.subcategory}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                    >
                      <option value="">Ninguna / General</option>
                      {availableSubcategories.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                      <option value="Otros">Otros</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="subcategory"
                      value={formData.subcategory}
                      onChange={handleChange}
                      placeholder="Ej. Especiales"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Concepto de Marca */}
              {brandConceptOptions.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Concepto de Marca (Línea de Menú)
                  </label>
                  <select
                    name="brand_concept"
                    value={formData.brand_concept}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                  >
                    <option value="">Aplica a toda la marca</option>
                    {brandConceptOptions.map(concept => (
                      <option key={concept.value} value={concept.value}>{concept.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Descripción con IA */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Descripción Gastronómica
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={isGeneratingText}
                    className="flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-lg transition-all disabled:opacity-50"
                  >
                    <Icon icon="heroicons:sparkles" className="text-xs text-purple-600" />
                    {isGeneratingText ? 'Redactando...' : 'Generar con IA ✨'}
                  </button>
                </div>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe ingredientes clave, cocción, aromas y textura para abrir el apetito..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Estado de Stock y Upsell */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Stock Inmediato
                  </label>
                  <select
                    name="stock_status"
                    value={formData.stock_status}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-bold outline-none ${
                      formData.stock_status === 'in'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    <option value="in">🟢 Disponible para Venta</option>
                    <option value="out">🔴 Agotado / Fuera de Stock</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Sugerido en Carrito (Upsell)
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_upsell: !prev.is_upsell }))}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                      formData.is_upsell
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <span>{formData.is_upsell ? '⭐ Sugerir en Checkout' : 'No sugerir'}</span>
                    <span className={`w-2 h-2 rounded-full ${formData.is_upsell ? 'bg-amber-500' : 'bg-slate-300'}`} />
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* ─────────────────────────────────────────────────────────────
              COLUMNA 2: COSTOS, RECETA & FIJACIÓN DE PRECIOS
          ───────────────────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Tarjeta de Receta / Insumo Directo Vinculado */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                    Ficha Técnica, Insumo & COGS
                  </span>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    Vincula con recetas de platos o insumos directos (bebidas/botellas) para sincronizar costos y descontar inventario.
                  </p>
                </div>
                {(formData.recipe_id || formData.ingredient_id) && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, recipe_id: null, ingredient_id: null, cost: 0 }))}
                    className="text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200 transition-colors"
                  >
                    Desvincular
                  </button>
                )}
              </div>

              {/* Status de la Vinculación Actual */}
              {linkedRecipe ? (
                <div className={`p-3.5 rounded-xl border mb-4 flex items-center justify-between ${
                  linkedRecipe.is_subrecipe
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-blue-50/70 border-blue-200 text-blue-950'
                }`}>
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold truncate">{linkedRecipe.name}</span>
                      {linkedRecipe.is_subrecipe && (
                        <span className="bg-amber-200 text-amber-800 text-[9px] font-black uppercase px-1.5 py-0.5 rounded">
                          Subreceta
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {linkedRecipe.is_subrecipe
                        ? '⚠️ Atención: Es una subreceta. Se recomienda vincular una Receta de Plato Final.'
                        : '✓ Receta de plato final sincronizada'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">Costo Porción</span>
                    <span className="text-sm font-black text-blue-700">
                      ${Number(linkedRecipe.total_cost || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : linkedIngredient ? (
                <div className="p-3.5 rounded-xl border mb-4 flex items-center justify-between bg-emerald-50/80 border-emerald-200 text-emerald-950">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold truncate">{linkedIngredient.name}</span>
                      <span className="bg-emerald-200 text-emerald-900 text-[9px] font-black uppercase px-1.5 py-0.5 rounded">
                        Insumo Directo
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      ✓ Descuenta 1 {linkedIngredient.usage_unit || 'unidad'} por venta | Stock bodega: <strong>{linkedIngredient.stock_current ?? 0} {linkedIngredient.usage_unit}</strong>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Costo Insumo</span>
                    <span className="text-sm font-black text-emerald-800">
                      ${Number(linkedIngredient.unit_cost || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-center">
                  <p className="text-xs font-semibold text-slate-500">Sin vinculación a receta ni insumo</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">Puedes elegir una receta, un insumo de bodega o ingresar el costo manual abajo.</p>
                </div>
              )}

              {/* Segmented Mode Selector: Recetas vs Insumos Directos */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl mb-3 border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setCogsMode('recipe')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    cogsMode === 'recipe'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>🍳</span>
                  <span>Receta de Plato</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCogsMode('ingredient')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    cogsMode === 'ingredient'
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>🥤</span>
                  <span>Insumo Directo (Bebidas / Retail)</span>
                </button>
              </div>

              {/* Contenido según el modo */}
              {cogsMode === 'recipe' ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Icon icon="heroicons:magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                      <input
                        type="text"
                        placeholder="Buscar entre recetas de platos finales..."
                        value={recipeSearch}
                        onChange={(e) => setRecipeSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  {finalDishRecipes.length === 0 ? (
                    <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-center">
                      <p className="text-xs font-bold text-amber-800">No hay recetas de platos finales</p>
                      <p className="text-[10px] text-amber-600 mt-0.5">
                        Las subrecetas (salsas, marinados, arroces base) están protegidas y no aparecen aquí para evitar distorsiones de costo.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-36 overflow-y-auto custom-scrollbar border border-slate-200 rounded-xl divide-y divide-slate-100">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, recipe_id: null, ingredient_id: null, cost: 0 }))}
                        className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                          !formData.recipe_id && !formData.ingredient_id ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-50 text-slate-500'
                        }`}
                      >
                        <span>Sin vinculación (Costo manual)</span>
                        {!formData.recipe_id && !formData.ingredient_id && <Icon icon="heroicons:check" className="text-emerald-600" />}
                      </button>
                      {searchedFinalRecipes.map(r => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, recipe_id: r.id, ingredient_id: null, cost: r.total_cost || 0 }))}
                          className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                            formData.recipe_id === r.id ? 'bg-blue-50 text-blue-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span className="truncate pr-2">{r.name}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-slate-400 font-medium">${Number(r.total_cost || 0).toLocaleString()}</span>
                            {formData.recipe_id === r.id && <Icon icon="heroicons:check" className="text-blue-600" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Icon icon="heroicons:magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                      <input
                        type="text"
                        placeholder="Buscar gaseosas, cervezas, tés, insumos de venta directa..."
                        value={ingredientSearch}
                        onChange={(e) => setIngredientSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  {searchedIngredients.length === 0 ? (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <p className="text-xs font-bold text-slate-700">No se encontraron insumos</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Crea el insumo primero en la pestaña de Inventario para poder vincularlo aquí.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto custom-scrollbar border border-slate-200 rounded-xl divide-y divide-slate-100">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, recipe_id: null, ingredient_id: null, cost: 0 }))}
                        className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                          !formData.recipe_id && !formData.ingredient_id ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-50 text-slate-500'
                        }`}
                      >
                        <span>Sin vinculación (Costo manual)</span>
                        {!formData.recipe_id && !formData.ingredient_id && <Icon icon="heroicons:check" className="text-emerald-600" />}
                      </button>
                      {searchedIngredients.map(ing => (
                        <button
                          key={ing.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, ingredient_id: ing.id, recipe_id: null, cost: Number(ing.unit_cost || 0) }))}
                          className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                            formData.ingredient_id === ing.id ? 'bg-emerald-50 text-emerald-950 font-bold' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <span className="truncate block">{ing.name}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              Stock: {ing.stock_current ?? 0} {ing.usage_unit || 'u'} {ing.sku ? `· SKU: ${ing.sku}` : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-slate-500 font-medium">${Number(ing.unit_cost || 0).toLocaleString()}</span>
                            {formData.ingredient_id === ing.id && <Icon icon="heroicons:check" className="text-emerald-600" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Desglose de Costos (COGS) */}
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Costo Insumo / Receta
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                    <input
                      type="number"
                      name="cost"
                      value={formData.cost}
                      onChange={handleChange}
                      readOnly={Boolean(formData.recipe_id || formData.ingredient_id)}
                      placeholder="0"
                      className={`w-full pl-7 pr-3 py-2 border rounded-xl text-xs font-bold outline-none ${
                        formData.recipe_id || formData.ingredient_id
                          ? 'bg-blue-50/50 border-blue-200 text-blue-950 cursor-not-allowed'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  {formData.recipe_id && (
                    <span className="text-[9px] font-bold text-blue-600 mt-0.5 block">Sincronizado con receta de plato</span>
                  )}
                  {formData.ingredient_id && (
                    <span className="text-[9px] font-bold text-emerald-600 mt-0.5 block">Sincronizado con insumo directo de bodega</span>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Costo Empaque / Desechables
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                    <input
                      type="number"
                      name="packaging_fee"
                      value={formData.recipe_id ? 0 : formData.packaging_fee}
                      onChange={handleChange}
                      disabled={!!formData.recipe_id}
                      placeholder="0"
                      className={`w-full pl-7 pr-3 py-2 border rounded-xl text-xs font-bold outline-none ${
                        formData.recipe_id 
                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  <span className={`text-[9px] mt-0.5 block ${formData.recipe_id ? 'text-blue-600 font-bold' : 'text-slate-600'}`}>
                    {formData.recipe_id 
                      ? '✓ Incluido directamente en el escandallo de la receta' 
                      : 'Opcional: vaso, pitillo o bolsa'}
                  </span>
                </div>
              </div>

              {/* Total Unit COGS summary badge */}
              <div className="mt-3 bg-slate-100 rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Costo Total Unitario (COGS):</span>
                <span className="text-sm font-black text-slate-900">
                  ${totalCOGS.toLocaleString()} COP
                </span>
              </div>
            </div>

            {/* Tarjeta de Fijación de Precios & Margen */}
            <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-md space-y-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-1">
                  Precio Base al Público (COP)
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-slate-400 text-2xl font-bold">$</span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    placeholder="0"
                    className="bg-transparent border-none p-0 text-3xl font-black text-white w-full focus:ring-0 outline-none placeholder:text-slate-600"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Este es el precio oficial y uniforme que ven tus comensales en el menú digital.
                </p>
              </div>

              {/* Margen Real vs Meta */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Margen Bruto Real
                    </span>
                    <span className={`text-2xl font-black ${
                      margin >= targetMargin ? 'text-emerald-400' : margin > 0 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {margin.toFixed(0)}%
                    </span>
                  </div>

                  {/* Target Margin Input */}
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Meta Deseada
                    </span>
                    <div className="inline-flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-0.5 mt-0.5">
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={targetMargin}
                        onChange={(e) => setTargetMargin(Math.min(99, Math.max(1, Number(e.target.value))))}
                        className="w-8 bg-transparent text-xs font-bold text-white text-center outline-none"
                      />
                      <span className="text-xs text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="relative w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      margin >= targetMargin ? 'bg-emerald-400' : margin > 0 ? 'bg-amber-400' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, margin))}%` }}
                  />
                </div>

                {/* Profit info and Suggested Price */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-300 font-medium">
                    Ganancia: <strong className="text-white">${profit.toLocaleString()}</strong> / plato
                  </span>
                  {suggested > 0 && suggested !== priceNum && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, price: suggested }))}
                      className="text-[11px] font-bold text-emerald-300 hover:text-emerald-200 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/80 px-2 py-0.5 rounded-lg transition-all"
                    >
                      Sugerido: ${suggested.toLocaleString()} (Usar ↑)
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tarjeta de Disponibilidad y Precios por Sede */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                    <Icon icon="heroicons:map-pin" className="text-base text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Precios y Sedes de Venta</h3>
                    <p className="text-[10px] text-slate-600">Control de visibilidad y sobrecostos por punto de venta.</p>
                  </div>
                </div>
              </div>

              {/* Master Pricing Mode Switch */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4">
                <div className="flex items-center justify-between">
                  <div className="pr-3">
                    <p className="text-xs font-bold text-slate-800">
                      {customLocationPricing ? 'Precios diferenciados por sede' : 'Mismo precio en todas las sedes'}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      {customLocationPricing
                        ? 'Permite fijar precios únicos para sedes de alto costo.'
                        : 'Recomendado: todas las sedes heredan el Precio Base ($' + (formData.price || 0) + ' COP).'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !customLocationPricing;
                      setCustomLocationPricing(next);
                      if (!next) {
                        // Clear all override prices so they inherit base price
                        setLocationOverrides(prev => prev.map(o => ({ ...o, price: '' })));
                        toast.success('Precios unificados con el precio base');
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shrink-0 ${
                      customLocationPricing
                        ? 'bg-amber-100 border-amber-300 text-amber-900'
                        : 'bg-emerald-100 border-emerald-300 text-emerald-900'
                    }`}
                  >
                    {customLocationPricing ? 'Personalizado' : '✓ Unificado'}
                  </button>
                </div>
              </div>

              {/* Locations List */}
              <div className="space-y-2.5">
                {locations.map(loc => {
                  const override = locationOverrides.find(o => o.location_id === loc.id) || {
                    is_active: false,
                    stock_status: 'in',
                    price: '',
                    is_linked: false
                  };
                  const isActive = override.is_active || false;
                  const hasCustomPrice = customLocationPricing && override.price !== '' && override.price !== null;

                  return (
                    <div
                      key={loc.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isActive ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-50/60 border-slate-100 opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        {/* Location Name & Status Toggle */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleOverrideChange(loc.id, 'is_active', !isActive)}
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                              isActive ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isActive && <Icon icon="heroicons:check" className="text-xs" />}
                          </button>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 truncate block">{loc.name}</span>
                            <span className="text-[10px] text-slate-600">
                              {isActive ? 'Activo en sede' : 'Oculto en sede'}
                            </span>
                          </div>
                        </div>

                        {/* Price Input or Inherited Badge */}
                        <div className="shrink-0 text-right">
                          {customLocationPricing ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400 text-xs font-bold">$</span>
                              <input
                                type="number"
                                placeholder={formData.price || '0'}
                                value={override.price}
                                onChange={(e) => handleOverrideChange(loc.id, 'price', e.target.value)}
                                className="w-24 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:border-emerald-500 outline-none text-right"
                              />
                            </div>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                              Hereda ${Number(formData.price || 0).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {hasCustomPrice && (
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <span className="font-bold text-amber-700">
                            Override activo en comensal
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOverrideChange(loc.id, 'price', '')}
                            className="text-slate-400 hover:text-slate-600 underline font-semibold"
                          >
                            Restablecer a base
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ─────────────────────────────────────────────────────────────
              COLUMNA 3: EXPERIENCIA COMENSAL & OPERACIÓN COCINA
          ───────────────────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Estación de Preparación (Enrutamiento KDS) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                  Enrutamiento KDS (Cocina / Barra)
                </span>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  Define qué pantalla de comanda recibe la orden al momento de cobro.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Cocina */}
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, station: 'kitchen', requires_kitchen: true }))}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    (formData.station === 'kitchen' || (!formData.station && formData.requires_kitchen !== false))
                      ? 'bg-orange-50 border-orange-400 text-orange-950 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xl block mb-1">🍳</span>
                  <span className="text-xs font-bold block">Cocina</span>
                  <span className="text-[9px] text-slate-600 block">Platos / Bowls</span>
                </button>

                {/* Barra */}
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, station: 'bar', requires_kitchen: true }))}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    formData.station === 'bar'
                      ? 'bg-cyan-50 border-cyan-400 text-cyan-950 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xl block mb-1">🍸</span>
                  <span className="text-xs font-bold block">Barra BDS</span>
                  <span className="text-[9px] text-slate-600 block">Bebidas / Café</span>
                </button>

                {/* Directo */}
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, station: 'none', requires_kitchen: false }))}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    (formData.station === 'none' || (!formData.station && formData.requires_kitchen === false))
                      ? 'bg-slate-200 border-slate-400 text-slate-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xl block mb-1">⚡</span>
                  <span className="text-xs font-bold block">Directo</span>
                  <span className="text-[9px] text-slate-600 block">Snacks / Latas</span>
                </button>
              </div>

              {/* Modal Comensal: QuickView vs DIY */}
              <div className="pt-3 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Experiencia del Comensal al Hacer Clic
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      config_options: { ...prev.config_options, is_diy: false }
                    }))}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      !formData.config_options?.is_diy
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="text-xs block">⚡ QuickView Rápido</span>
                    <span className="text-[9px] text-slate-600 block font-normal mt-0.5">Para platos estándar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      config_options: { ...prev.config_options, is_diy: true }
                    }))}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      formData.config_options?.is_diy
                        ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="text-xs block">🧩 Arma tu Propio (DIY)</span>
                    <span className="text-[9px] text-slate-600 block font-normal mt-0.5">Paso a paso por etapas</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Grupos de Modificadores & Personalizaciones */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                    Modificadores & Extras
                  </span>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    Opciones que el cliente puede elegir (bases, salsas, proteínas adicionales).
                  </p>
                </div>
                {(formData.modifier_groups || []).length > 0 && (
                  <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                    {(formData.modifier_groups || []).length} Activos
                  </span>
                )}
              </div>

              {/* Modificadores Activos con Drag & Drop */}
              {(formData.modifier_groups || []).length > 0 ? (
                <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200">
                  <p className="text-[10px] font-bold text-purple-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Icon icon="heroicons:bars-arrow-down" className="text-xs" />
                    Orden en Menú (Arrastra para reordenar)
                  </p>
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="selected-modifiers">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1.5">
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
                                    className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-purple-200 shadow-xs"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Icon icon="heroicons:bars-2" className="text-purple-400 cursor-grab text-xs" />
                                      <span className="text-xs font-bold text-purple-950 truncate">{g.name}</span>
                                      {g.is_submodifier && (
                                        <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-black">Sub</span>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => toggleModifierGroup(id)}
                                      className="text-purple-300 hover:text-red-500 transition-colors p-0.5"
                                    >
                                      <Icon icon="heroicons:x-mark" className="text-sm" />
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
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <p className="text-xs font-semibold text-slate-500">Sin modificadores asignados</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">Selecciona los grupos disponibles abajo.</p>
                </div>
              )}

              {/* Selector de Grupos Disponibles */}
              <div className="pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-2">
                  Grupos de Modificadores Disponibles
                </span>
                {mainGroups.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1.5 border border-slate-200 rounded-xl p-2">
                    {mainGroups.map(group => {
                      const isSelected = (formData.modifier_groups || []).includes(group.id);
                      const associatedSubGroups = getSubGroupsForGroup(group);

                      return (
                        <div key={group.id} className="space-y-1">
                          <button
                            type="button"
                            onClick={() => toggleModifierGroup(group.id)}
                            className={`w-full px-2.5 py-1.5 rounded-lg border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                              isSelected
                                ? 'bg-purple-100/70 border-purple-300 text-purple-950 font-bold'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate">{group.name}</span>
                            <span className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <Icon icon="heroicons:check" className="text-[10px]" />}
                            </span>
                          </button>

                          {/* Subgroups if selected */}
                          {isSelected && associatedSubGroups.length > 0 && (
                            <div className="pl-3 border-l-2 border-purple-200 ml-2 space-y-1 py-1">
                              {associatedSubGroups.map(sg => {
                                const isSubSelected = (formData.modifier_groups || []).includes(sg.id);
                                return (
                                  <button
                                    key={sg.id}
                                    type="button"
                                    onClick={() => toggleModifierGroup(sg.id)}
                                    className={`w-full px-2 py-1 rounded text-left text-[11px] font-medium flex items-center justify-between border ${
                                      isSubSelected
                                        ? 'bg-purple-50 border-purple-200 text-purple-800 font-bold'
                                        : 'bg-white border-slate-200 text-slate-500'
                                    }`}
                                  >
                                    <span className="truncate">↳ {sg.name}</span>
                                    {isSubSelected && <Icon icon="heroicons:check" className="text-purple-600 text-xs" />}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No hay grupos configurados en la carta.</p>
                )}
              </div>
            </div>

            {/* Dietas y Alérgenos */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              {/* Dietas */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-2">
                  Dietas & Estilos de Vida
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {allergens.filter(a => a.type === 'diet').map(diet => {
                    const isSelected = formData.tags?.includes(diet.name);
                    return (
                      <button
                        key={diet.id}
                        type="button"
                        onClick={() => toggleTag(diet.name)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>{diet.emoji}</span>
                        <span>{diet.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Alérgenos */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-2">
                  Alérgenos Notificables
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {allergens.filter(a => a.type !== 'diet').map(allergen => {
                    const isSelected = formData.tags?.includes(allergen.name);
                    return (
                      <button
                        key={allergen.id}
                        type="button"
                        onClick={() => toggleTag(allergen.name)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-red-100 border-red-300 text-red-900 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>{allergen.emoji}</span>
                        <span>{allergen.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

        </form>
      </main>

      {/* ═══════════════════════════════════════════════════════════════
          STICKY BOTTOM BAR (Always reachable on mobile/tablet)
      ═══════════════════════════════════════════════════════════════ */}
      <footer className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Precio Base</span>
            <span className="text-sm font-black text-slate-900">${priceNum.toLocaleString()} COP</span>
          </div>
          <div className="hidden sm:block w-px h-6 bg-slate-200" />
          <div className="hidden sm:block">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">COGS Total</span>
            <span className="text-xs font-bold text-slate-700">${totalCOGS.toLocaleString()}</span>
          </div>
          <div className="hidden sm:block w-px h-6 bg-slate-200" />
          <div className="hidden sm:block">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Margen</span>
            <span className={`text-xs font-bold ${margin >= targetMargin ? 'text-emerald-600' : 'text-amber-600'}`}>
              {margin.toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : (product ? 'Guardar Cambios' : 'Crear Producto')}
          </button>
        </div>
      </footer>
    </div>
  );
}
