import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { toast } from '../components/Toast';
import { useAdminIngredients } from '../hooks/useAdminIngredients';
import { useAdminRecipes } from '../hooks/useAdminRecipes';
import { useGemini } from '../hooks/useGemini';
import {
  PageHeader, PrimaryButton, SecondaryButton, Badge,
  FormField, TextInput, SearchInput
} from '../components/admin/ui';
import { useAuth } from '../context/AuthContext';
import { Icon } from '@iconify-icon/react';
import { useLocation } from '../context/LocationContext';
import { LinkCatalogModal } from '../components/admin/LinkCatalogModal';
import { Link as LinkIcon, Lightbulb, X } from 'lucide-react';
import { KitchenRecipeViewerModal } from '../components/admin/KitchenRecipeViewerModal';
import { KitchenStationLayout } from '../components/admin/KitchenStationLayout';
import KitchenUtilitiesModal from '../components/admin/KitchenUtilitiesModal';
import Portal from '../components/Portal';

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
  const { activeLocationId, activeLocation, isAllLocations } = useLocation();
  const { recipes, loading, fetchRecipes } = useAdminRecipes();
  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'critical' | 'healthy' | 'investment'
  const [recipeCategoryTab, setRecipeCategoryTab] = useState('dishes'); // 'dishes' | 'subrecipes' | 'layout'
  const [viewingKitchenRecipe, setViewingKitchenRecipe] = useState(null);
  const [isUtilitiesModalOpen, setIsUtilitiesModalOpen] = useState(false);
  const [availableEquipment, setAvailableEquipment] = useState([]);
  const [utilityRates, setUtilityRates] = useState({ kwh_price: 950, gas_m3_price: 2800, water_liter_price: 5.5 });
  const [categories, setCategories] = useState([]);
  const [linkedProduct, setLinkedProduct] = useState(null);
  const [syncAsProduct, setSyncAsProduct] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [isSyncingProduct, setIsSyncingProduct] = useState(false);

  const [showTip, setShowTip] = useState(() => {
    try { return localStorage.getItem('recipes_tip_dismissed') !== 'true'; } catch { return true; }
  });

  const { ingredients: allIngredients, fetchIngredients } = useAdminIngredients();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStation, setSelectedStation] = useState('all');
  const [selectedIngredientId, setSelectedIngredientId] = useState('all');
  const { activeBrand } = useAuth();
  const brandId = activeBrand?.id;
  const { generateText, loading: isGeneratingSteps } = useGemini();
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [draggedStepIndex, setDraggedStepIndex] = useState(null);
  const [modalTab, setModalTab] = useState('ingredients'); // 'ingredients' | 'steps' | 'energy'

  const dismissTip = () => {
    setShowTip(false);
    try { localStorage.setItem('recipes_tip_dismissed', 'true'); } catch {}
  };

  const [formData, setFormData] = useState({
    name: '', 
    description: '', 
    target_price: 0, 
    is_subrecipe: false,
    batch_yield: 1000,
    batch_unit: 'g',
    shelf_life_days: 1,
    storage_location: '',
    prep_time_minutes: '',
    step_by_step: [],
    ingredients: [],
    // Addon fields
    available_as_addon: false,
    addon_portion_grams: 150,
    addon_price: 0,
    // Equipment & utilities
    recipe_equipment: [] // [{ equipment_id, usage_minutes, name, energy_type, power_watts, gas_consumption_m3_per_hour, water_liters_per_cycle }]
  });

  useEffect(() => { 
    if (brandId) {
      fetchRecipes(activeLocationId); 
      fetchIngredients(activeLocationId); 
      fetchUtilitiesAndEquipment();
    }
  }, [brandId, activeLocationId, fetchRecipes, fetchIngredients]);

  const fetchUtilitiesAndEquipment = async () => {
    try {
      // 1. Tarifas
      let q = supabase.from('kitchen_utility_rates').select('*').eq('brand_id', brandId);
      if (activeLocationId && activeLocationId !== 'all') {
        q = q.eq('location_id', activeLocationId);
      }
      const { data: rData } = await q.maybeSingle();
      if (rData) {
        setUtilityRates({
          kwh_price: Number(rData.kwh_price) || 950,
          gas_m3_price: Number(rData.gas_m3_price) || 2800,
          water_liter_price: Number(rData.water_liter_price) || 5.5
        });
      }

      // 2. Equipos
      let eqQ = supabase.from('kitchen_equipment').select('*').eq('brand_id', brandId);
      if (activeLocationId && activeLocationId !== 'all') {
        eqQ = eqQ.or(`location_id.eq.${activeLocationId},location_id.is.null`);
      }
      const { data: eqData } = await eqQ.order('name');
      if (eqData) setAvailableEquipment(eqData);

      // 3. Categorías de productos
      const { data: catData } = await supabase
        .from('categories')
        .select('id, name')
        .eq('brand_id', brandId)
        .order('name');
      if (catData) setCategories(catData);
    } catch (err) {
      console.error('Error fetching equipment, rates and categories:', err);
    }
  };

  const handleOpenModal = async (recipe = null) => {
    if (recipe) {
      setEditingRecipe(recipe);
      let parsedSteps = [];
      if (Array.isArray(recipe.step_by_step) && recipe.step_by_step.length > 0) {
        parsedSteps = recipe.step_by_step;
      } else if (recipe.instructions) {
        parsedSteps = recipe.instructions.split('\n').filter(Boolean).map((text, idx) => ({
          step: idx + 1,
          title: `Paso ${idx + 1}`,
          desc: text,
          station: recipe.is_subrecipe ? 'Mise en Place' : 'Cocina'
        }));
      }

      // Buscar si ya existe un producto en la carta vinculado a esta receta
      try {
        const { data: prodData } = await supabase
          .from('products')
          .select('id, name, price, cost, category_id, is_active')
          .eq('recipe_id', recipe.id)
          .eq('brand_id', brandId)
          .maybeSingle();

        if (prodData) {
          setLinkedProduct(prodData);
          setSyncAsProduct(true);
          setSelectedCategoryId(prodData.category_id || '');
        } else {
          setLinkedProduct(null);
          setSyncAsProduct(false);
          setSelectedCategoryId('');
        }
      } catch (err) {
        console.error('Error fetching linked product:', err);
        setLinkedProduct(null);
        setSyncAsProduct(false);
      }

      // Cargar recipe_equipment vinculados
      let loadedEquipment = [];
      try {
        const { data: reData } = await supabase
          .from('recipe_equipment')
          .select('*, kitchen_equipment(*)')
          .eq('recipe_id', recipe.id);
        if (reData) {
          loadedEquipment = reData.map(re => ({
            equipment_id: re.equipment_id,
            usage_minutes: Number(re.usage_minutes) || 0,
            water_liters_override: re.water_liters_override,
            name: re.kitchen_equipment?.name || 'Equipo',
            energy_type: re.kitchen_equipment?.energy_type || 'electric',
            power_watts: re.kitchen_equipment?.power_watts || 0,
            gas_consumption_m3_per_hour: re.kitchen_equipment?.gas_consumption_m3_per_hour || 0,
            water_liters_per_cycle: re.kitchen_equipment?.water_liters_per_cycle || 0
          }));
        }
      } catch (e) {
        console.error('Error cargando equipos de la receta:', e);
      }

      setFormData({
        name: recipe.name, 
        description: recipe.description || '',
        target_price: recipe.target_price || 0,
        is_subrecipe: Boolean(recipe.is_subrecipe),
        batch_yield: Number(recipe.batch_yield) || 1000,
        batch_unit: recipe.batch_unit || 'g',
        shelf_life_days: Number(recipe.shelf_life_days) || 1,
        storage_location: recipe.storage_location || '',
        prep_time_minutes: recipe.prep_time_minutes ?? '',
        step_by_step: parsedSteps,
        ingredients: (() => {
          const map = new Map();
          (recipe.recipe_ingredients || []).forEach(ri => {
            if (!map.has(ri.ingredient_id)) {
              map.set(ri.ingredient_id, {
                ingredient_id: ri.ingredient_id, 
                quantity: ri.quantity,
                name: ri.ingredients?.name, 
                unit_cost: ri.ingredients?.unit_cost,
                usage_unit: ri.ingredients?.usage_unit
              });
            }
          });
          return Array.from(map.values());
        })(),
        available_as_addon: Boolean(recipe.available_as_addon),
        addon_portion_grams: Number(recipe.addon_portion_grams) || 150,
        addon_price: Number(recipe.addon_price) || 0,
        recipe_equipment: loadedEquipment
      });
    } else {
      setEditingRecipe(null);
      setFormData({ 
        name: '', 
        description: '', 
        target_price: 0, 
        is_subrecipe: recipeCategoryTab === 'subrecipes',
        batch_yield: 1000,
        batch_unit: 'g',
        shelf_life_days: 1,
        storage_location: '',
        prep_time_minutes: '',
        step_by_step: [],
        ingredients: [],
        available_as_addon: false,
        addon_portion_grams: 150,
        addon_price: 0,
        recipe_equipment: []
      });
      setLinkedProduct(null);
      setSyncAsProduct(false);
      setSelectedCategoryId('');
    }
    setModalTab('ingredients');
    setIsModalOpen(true);
  };

  const handleAddStep = () => {
    setFormData(prev => ({
      ...prev,
      step_by_step: [
        ...(prev.step_by_step || []),
        {
          step: (prev.step_by_step || []).length + 1,
          title: '',
          desc: '',
          station: prev.is_subrecipe ? 'Mise en Place' : 'Cocina'
        }
      ]
    }));
  };

  const handleUpdateStep = (index, field, value) => {
    setFormData(prev => {
      const updated = [...(prev.step_by_step || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, step_by_step: updated };
    });
  };

  const handleRemoveStep = (index) => {
    setFormData(prev => {
      const filtered = (prev.step_by_step || []).filter((_, i) => i !== index);
      const renumbered = filtered.map((s, idx) => ({ ...s, step: idx + 1 }));
      return { ...prev, step_by_step: renumbered };
    });
  };

  const handleMoveStep = (index, direction) => {
    setFormData(prev => {
      const steps = [...(prev.step_by_step || [])];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= steps.length) return prev;
      const [moved] = steps.splice(index, 1);
      steps.splice(targetIndex, 0, moved);
      const renumbered = steps.map((s, idx) => ({ ...s, step: idx + 1 }));
      return { ...prev, step_by_step: renumbered };
    });
  };

  const handleGenerateStepsAI = async () => {
    if (!formData.name.trim()) {
      toast('Por favor escribe el nombre de la receta primero');
      return;
    }
    const ingredientNames = formData.ingredients.map(i => `${i.quantity} ${i.usage_unit || 'g'} de ${i.name}`).join(', ');
    const prompt = `Actúa como Chef Ejecutivo de restaurante. Genera una lista de 3 a 5 pasos operativos estandarizados (SOP) para preparar y ensamblar la receta "${formData.name}".
${ingredientNames ? `Ingredientes disponibles: ${ingredientNames}.` : ''}
${formData.is_subrecipe ? 'Esta es una SUBRECETA o preparación en bache previo al turno (Mise en Place).' : 'Este es un PLATO FINAL de ensamble y despacho.'}

Devuelve ÚNICAMENTE un arreglo JSON válido (sin explicaciones adicionales) con esta estructura:
[
  {
    "step": 1,
    "title": "Título corto del paso",
    "desc": "Instrucción clara, técnica y precisa para cocina.",
    "station": "Ensamble"
  }
]`;

    try {
      const raw = await generateText({
        brandId,
        prompt,
        actionType: 'recipe_steps'
      });
      if (!raw) return;

      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFormData(prev => ({
            ...prev,
            step_by_step: parsed.map((item, idx) => ({
              step: idx + 1,
              title: item.title || `Paso ${idx + 1}`,
              desc: item.desc || '',
              station: item.station || (prev.is_subrecipe ? 'Mise en Place' : 'Cocina')
            }))
          }));
          toast('¡Pasos generados con IA con éxito! ✨');
          return;
        }
      }

      // Fallback
      const lines = raw.split('\n').filter(l => l.trim().length > 0);
      const fallbackSteps = lines.slice(0, 5).map((l, idx) => ({
        step: idx + 1,
        title: `Paso ${idx + 1}`,
        desc: l.replace(/^\d+[\.\-\)]\s*/, ''),
        station: formData.is_subrecipe ? 'Mise en Place' : 'Cocina'
      }));
      setFormData(prev => ({ ...prev, step_by_step: fallbackSteps }));
      toast('¡Pasos generados con éxito! ✨');
    } catch (err) {
      console.error('Error generando pasos con IA:', err);
      toast('No se pudo generar con IA. Intenta agregar los pasos manualmente.');
    }
  };

  const handleGenerateDescriptionAI = async () => {
    if (!formData.name.trim()) {
      toast('Por favor escribe el nombre de la receta primero');
      return;
    }
    const ingredientNames = formData.ingredients.map(i => i.name).filter(Boolean).slice(0, 8).join(', ');
    const prompt = `Actúa como Chef Ejecutivo y redactor gastronómico. Redacta una descripción corta (1 a 2 oraciones, máximo 25 palabras) apetitosa y profesional para la carta digital y ficha técnica de "${formData.name}".
${ingredientNames ? `Ingredientes destacados: ${ingredientNames}.` : ''}
${formData.is_subrecipe ? 'Es una preparación base/subreceta (Mise en Place).' : 'Es un plato principal de restaurante.'}
Devuelve ÚNICAMENTE el texto de la descripción, sin comillas ni títulos adicionales.`;

    try {
      setIsGeneratingDesc(true);
      const raw = await generateText({
        brandId,
        prompt,
        actionType: 'recipe_description'
      });
      if (raw && typeof raw === 'string') {
        const cleanDesc = raw.trim().replace(/^["']|["']$/g, '');
        setFormData(prev => ({ ...prev, description: cleanDesc }));
        toast('¡Descripción creada con IA con éxito! ✨');
      }
    } catch (err) {
      console.error('Error generando descripción con IA:', err);
      toast('No se pudo generar la descripción con IA.');
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleTargetMarginChange = (percent) => {
    const desiredMargin = Number(percent);
    if (desiredMargin >= 100 || desiredMargin < 0 || totalCost <= 0) return;
    // Formula: Price = Cost / (1 - (margin / 100))
    const calculatedPrice = Math.round(totalCost / (1 - (desiredMargin / 100)));
    setFormData(prev => ({ ...prev, target_price: calculatedPrice }));
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

  // Costo de energía, gas y agua para los equipos vinculados
  const energyCost = useMemo(() => {
    return (formData.recipe_equipment || []).reduce((sum, item) => {
      let cost = 0;
      const mins = Number(item.usage_minutes) || 0;
      if (mins <= 0) return sum;

      if (item.energy_type === 'electric' || item.energy_type === 'dual') {
        const kw = (Number(item.power_watts) || 0) / 1000;
        cost += (kw * (mins / 60) * (utilityRates.kwh_price || 950));
      }
      if (item.energy_type === 'gas' || item.energy_type === 'dual') {
        const m3PerHour = Number(item.gas_consumption_m3_per_hour) || 0;
        cost += (m3PerHour * (mins / 60) * (utilityRates.gas_m3_price || 2800));
      }
      // Agua
      const waterLiters = item.water_liters_override !== undefined && item.water_liters_override !== null
        ? Number(item.water_liters_override)
        : Number(item.water_liters_per_cycle) || 0;
      cost += (waterLiters * (utilityRates.water_liter_price || 5.5));

      return sum + cost;
    }, 0);
  }, [formData.recipe_equipment, utilityRates]);

  const ingredientsCost = useMemo(() =>
    formData.ingredients.reduce((sum, i) => sum + (i.quantity * (i.unit_cost || 0)), 0),
    [formData.ingredients]
  );

  const totalCost = useMemo(() => {
    return Math.round(ingredientsCost + energyCost);
  }, [ingredientsCost, energyCost]);

  const margin = formData.target_price > 0
    ? ((formData.target_price - totalCost) / formData.target_price) * 100
    : 0;

  // Split recipes into dishes and subrecipes
  const dishes = useMemo(() => recipes.filter(r => !r.is_subrecipe), [recipes]);
  const subrecipes = useMemo(() => recipes.filter(r => r.is_subrecipe), [recipes]);
  const activeRecipeList = recipeCategoryTab === 'subrecipes' ? subrecipes : dishes;

  // Global metrics for Hero Section
  const statsMetrics = useMemo(() => {
    if (!recipes.length) {
      return { 
        avgMargin: 0, 
        totalInvestment: 0, 
        criticalCount: 0, 
        healthyCount: 0, 
        totalCount: 0,
        dishCount: 0,
        subrecipeCount: 0
      };
    }
    
    let totalInv = 0;
    let sumMargins = 0;
    let criticals = 0;
    let healthy = 0;
    let dishCount = 0;
    let subrecipeCount = 0;

    recipes.forEach(r => {
      const cost = r.total_cost || 0;
      totalInv += cost;
      if (r.is_subrecipe) {
        subrecipeCount++;
      } else {
        dishCount++;
        const m = r.target_price > 0 ? ((r.target_price - cost) / r.target_price) * 100 : 0;
        sumMargins += m;
        if (m < 30) criticals++;
        if (m >= 40) healthy++;
      }
    });

    return {
      avgMargin: dishCount > 0 ? sumMargins / dishCount : 0,
      totalInvestment: totalInv,
      criticalCount: criticals,
      healthyCount: healthy,
      totalCount: recipes.length,
      dishCount,
      subrecipeCount
    };
  }, [recipes]);

  // Unique available stations from recipes and step_by_step
  const availableStations = useMemo(() => {
    const set = new Set();
    recipes.forEach(r => {
      if (r.storage_location && r.storage_location.trim()) {
        set.add(r.storage_location.trim());
      }
      if (Array.isArray(r.step_by_step)) {
        r.step_by_step.forEach(s => {
          if (s.station && s.station.trim()) {
            set.add(s.station.trim());
          }
        });
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [recipes]);

  const displayRecipes = useMemo(() => {
    return activeRecipeList.filter(r => {
      // 1. Text Search (name, description, storage location, ingredients, steps)
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchName = (r.name || '').toLowerCase().includes(q);
        const matchDesc = (r.description || '').toLowerCase().includes(q);
        const matchStorage = (r.storage_location || '').toLowerCase().includes(q);
        const matchIngredients = (r.recipe_ingredients || []).some(ri =>
          (ri.ingredients?.name || '').toLowerCase().includes(q)
        );
        const matchSteps = (r.step_by_step || []).some(s =>
          (s.title || '').toLowerCase().includes(q) ||
          (s.desc || '').toLowerCase().includes(q) ||
          (s.station || '').toLowerCase().includes(q)
        );
        if (!matchName && !matchDesc && !matchStorage && !matchIngredients && !matchSteps) {
          return false;
        }
      }

      // 2. Station Filter
      if (selectedStation !== 'all') {
        const qStation = selectedStation.toLowerCase();
        const matchStorage = (r.storage_location || '').toLowerCase() === qStation;
        const matchStepStation = (r.step_by_step || []).some(s => (s.station || '').toLowerCase() === qStation);
        if (!matchStorage && !matchStepStation) return false;
      }

      // 3. Ingredient Filter
      if (selectedIngredientId !== 'all') {
        const hasIng = (r.recipe_ingredients || []).some(ri => ri.ingredient_id === selectedIngredientId);
        if (!hasIng) return false;
      }

      // 4. Financial & Margin Filter
      if (activeFilter !== 'all') {
        if (!r.is_subrecipe) {
          const m = r.target_price > 0 ? ((r.target_price - r.total_cost) / r.target_price) * 100 : 0;
          if (activeFilter === 'critical') return m < 30;
          if (activeFilter === 'healthy') return m >= 40;
          if (activeFilter === 'investment') return r.total_cost > (statsMetrics.totalInvestment / (dishes.length || 1));
        } else {
          if (activeFilter === 'investment') {
            const avgSubCost = statsMetrics.totalInvestment / (subrecipes.length || 1);
            return r.total_cost > avgSubCost;
          }
          if (activeFilter === 'addon') {
            return Boolean(r.available_as_addon);
          }
        }
      }

      return true;
    });
  }, [
    activeRecipeList,
    searchTerm,
    selectedStation,
    selectedIngredientId,
    activeFilter,
    statsMetrics.totalInvestment,
    dishes.length,
    subrecipes.length
  ]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStation('all');
    setSelectedIngredientId('all');
    setActiveFilter('all');
  };

  const hasActiveFilters = Boolean(
    searchTerm.trim() || 
    selectedStation !== 'all' || 
    selectedIngredientId !== 'all' || 
    activeFilter !== 'all'
  );

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
        brand_id: brandId,
        is_subrecipe: Boolean(formData.is_subrecipe),
        batch_yield: parseFloat(formData.batch_yield) || 1000,
        batch_unit: formData.batch_unit || 'g',
        shelf_life_days: parseFloat(formData.shelf_life_days) || 1,
        storage_location: formData.storage_location || null,
        prep_time_minutes: formData.prep_time_minutes !== '' && !isNaN(formData.prep_time_minutes) ? Number(formData.prep_time_minutes) : null,
        available_as_addon: Boolean(formData.available_as_addon),
        addon_portion_grams: parseFloat(formData.addon_portion_grams) || 150,
        addon_price: parseFloat(formData.addon_price) || 0,
        step_by_step: (formData.step_by_step || []).filter(s => s.title?.trim() || s.desc?.trim()),
        instructions: (formData.step_by_step || []).map(s => `${s.title ? s.title + ': ' : ''}${s.desc}`).join('\n')
      };

      if (editingRecipe) {
        const { error } = await supabase.from('recipes').update(recipeData).eq('id', recipeId).eq('brand_id', brandId);
        if (error) throw error;
        await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId);
        await supabase.from('recipe_equipment').delete().eq('recipe_id', recipeId);
      } else {
        const { data: newRec, error } = await supabase.from('recipes').insert([recipeData]).select().single();
        if (error) throw error;
        recipeId = newRec.id;

        // Automatically link to current location if specified
        if (activeLocationId && activeLocationId !== 'all') {
          const { error: linkError } = await supabase
            .from('location_recipes')
            .insert([{
              location_id: activeLocationId,
              recipe_id: recipeId
            }]);
          
          if (linkError) {
            console.error('Error linking recipe to location:', linkError);
          }
        }
      }

      // Guardar equipos de cocina asociados
      if ((formData.recipe_equipment || []).length > 0) {
        const { error: eqErr } = await supabase.from('recipe_equipment').insert(
          formData.recipe_equipment.map(eq => ({
            recipe_id: recipeId,
            equipment_id: eq.equipment_id,
            usage_minutes: Number(eq.usage_minutes) || 0,
            water_liters_override: eq.water_liters_override !== undefined && eq.water_liters_override !== '' ? Number(eq.water_liters_override) : null
          }))
        );
        if (eqErr) console.error('Error guardando equipos de receta:', eqErr);
      }

      if (formData.ingredients.length > 0) {
        const { error } = await supabase.from('recipe_ingredients').insert(
          formData.ingredients.map(i => ({ recipe_id: recipeId, ingredient_id: i.ingredient_id, quantity: Number(i.quantity) || 0 }))
        );
        if (error) throw error;
      }

      // If it's a dish, update products that link to it
      if (!formData.is_subrecipe) {
        const { data: linkedProducts } = await supabase.from('products').select('id, price').eq('recipe_id', recipeId).eq('brand_id', brandId);
        if (linkedProducts && linkedProducts.length > 0) {
          const productUpdates = linkedProducts.map(p => {
            const pPrice = Number(formData.target_price) > 0 ? Number(formData.target_price) : (parseFloat(p.price) || 0);
            const newMargin = pPrice > 0 ? ((pPrice - totalCost) / pPrice) * 100 : 0;
            return supabase.from('products').update({ 
              cost: totalCost, 
              margin: newMargin,
              ...(Number(formData.target_price) > 0 ? { price: Number(formData.target_price) } : {})
            }).eq('id', p.id).eq('brand_id', brandId);
          });
          await Promise.all(productUpdates);
        }
      } else {
        // If it's a subrecipe, synchronize it into the ingredients table so it can be added to final dishes
        const batchYield = parseFloat(formData.batch_yield) || 1000;
        const unitCost = batchYield > 0 ? (totalCost / batchYield) : 0;
        
        const { data: existingIng } = await supabase
          .from('ingredients')
          .select('id')
          .eq('subrecipe_id', recipeId)
          .eq('brand_id', brandId)
          .maybeSingle();

        if (existingIng) {
          await supabase.from('ingredients').update({
            name: `${formData.name.trim()} (Subreceta)`,
            purchase_price: totalCost,
            purchase_quantity: batchYield,
            usage_unit: formData.batch_unit || 'g',
            unit_cost: unitCost,
            storage_location: formData.storage_location || null,
            is_subrecipe: true
          }).eq('id', existingIng.id);
        } else {
          const { data: cat } = await supabase
            .from('ingredient_categories')
            .select('id')
            .eq('brand_id', brandId)
            .ilike('name', '%Subrecetas%')
            .maybeSingle();

          await supabase.from('ingredients').insert([{
            brand_id: brandId,
            name: `${formData.name.trim()} (Subreceta)`,
            category_id: cat?.id || null,
            category: 'Preparaciones (Subrecetas)',
            purchase_unit: 'bache',
            usage_unit: formData.batch_unit || 'g',
            purchase_price: totalCost,
            purchase_quantity: batchYield,
            unit_cost: unitCost,
            is_active: true,
            is_subrecipe: true,
            subrecipe_id: recipeId,
            storage_location: formData.storage_location || null
          }]);
        }
        // Sincronizar producto en la carta si es subreceta disponible como adición/producto
        if (formData.available_as_addon && syncAsProduct) {
          const portionGrams = parseFloat(formData.addon_portion_grams) || 150;
          const portionCost = Math.round(portionGrams * unitCost);
          const sellingPrice = parseFloat(formData.addon_price) || 0;
          const portionMargin = sellingPrice > 0 ? (((sellingPrice - portionCost) / sellingPrice) * 100) : 0;
          const prodName = `Porción ${formData.name.trim()} (${portionGrams}${formData.batch_unit || 'g'})`;

          // Buscar categoría seleccionada o por defecto
          let targetCatId = selectedCategoryId;
          if (!targetCatId) {
            const defaultCat = categories.find(c => /adici|extra|acompaña|entrada/i.test(c.name)) || categories[0];
            targetCatId = defaultCat?.id || null;
          }

          if (linkedProduct) {
            await supabase.from('products').update({
              name: prodName,
              price: sellingPrice,
              cost: portionCost,
              margin: portionMargin,
              category_id: targetCatId,
              is_active: true,
              is_addon: true
            }).eq('id', linkedProduct.id);
          } else {
            await supabase.from('products').insert([{
              brand_id: brandId,
              name: prodName,
              description: `Porción fresca preparada de ${formData.name.trim()} (${portionGrams}${formData.batch_unit || 'g'}).`,
              price: sellingPrice,
              cost: portionCost,
              margin: portionMargin,
              category_id: targetCatId,
              recipe_id: recipeId,
              is_active: true,
              is_addon: true,
              stock_status: 'in_stock'
            }]);
          }
        } else if ((!formData.available_as_addon || !syncAsProduct) && linkedProduct) {
          // Si se desmarcó, desactivar el producto en el menú público
          await supabase.from('products').update({ is_active: false }).eq('id', linkedProduct.id);
        }

        fetchIngredients(activeLocationId);
      }

      toast(editingRecipe ? 'Receta actualizada' : 'Receta creada');
      setIsModalOpen(false);
      fetchRecipes(activeLocationId);
    } catch (err) {
      console.error('Error in handleSave:', err);
      toast('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('recipes').delete().eq('id', id).eq('brand_id', brandId);
    if (error) { toast('Error al eliminar'); return; }
    fetchRecipes(activeLocationId);
    toast('Receta eliminada');
  };

  if (loading && recipes.length === 0) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">Cargando recetas…</div>;
  }

  return (
    <div className="p-6 md:p-8 w-full max-w-[1600px] mx-auto space-y-6 animate-fade-in">
      {/* ── KPI Metrics Cards (Clean Executive SaaS) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Platos Carta */}
        <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Platos de Carta</span>
            <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Icon icon="heroicons:book-open" className="text-base" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{statsMetrics.dishCount}</span>
            <span className="text-xs text-slate-400">recetas ensamble</span>
          </div>
        </div>

        {/* Sub-recetas / Mise en Place */}
        <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Sub-recetas Prep</span>
            <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <Icon icon="heroicons:beaker" className="text-base" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{statsMetrics.subrecipeCount}</span>
            <span className="text-xs text-slate-400">baches activos</span>
          </div>
        </div>

        {/* Margen Promedio */}
        <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Margen Promedio</span>
            <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Icon icon="heroicons:arrow-trending-up" className="text-base" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 tabular-nums">{statsMetrics.avgMargin.toFixed(1)}%</span>
            <span className="text-xs text-slate-400">sobre precio venta</span>
          </div>
        </div>

        {/* Inversión Total */}
        <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Inversión Recetario</span>
            <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
              <Icon icon="heroicons:banknotes" className="text-base" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              ${statsMetrics.totalInvestment.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-slate-400">costo base total</span>
          </div>
        </div>

        {/* TARJETA DESTACADA: Costos de Energía & Equipos */}
        <div 
          onClick={() => setIsUtilitiesModalOpen(true)}
          className="p-4 rounded-xl border border-amber-300/80 bg-gradient-to-br from-amber-500/10 to-amber-500/5 hover:from-amber-500/20 hover:to-amber-500/10 transition-all cursor-pointer shadow-2xs group relative"
          title="Haz clic para configurar tarifas de luz, gas, agua y electrodomésticos de la sede"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
              <span>Energía & Equipos</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            </span>
            <div className="w-7 h-7 rounded-md bg-amber-500 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <Icon icon="heroicons:bolt" className="text-base" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black tracking-tight text-amber-950 tabular-nums">
                {availableEquipment.length}
              </span>
              <span className="text-xs font-semibold text-amber-800">equipos activos</span>
            </div>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300/70">
              ⚡ Tarifas
            </span>
          </div>
        </div>
      </div>

      {/* ── Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Fichas Técnicas & Sub-recetas</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Estandarización de porciones, costos de producción y fichas digitales para cocina.</p>
        </div>
        <div className="flex items-center gap-2.5">
          {!isAllLocations && (
            <button
              onClick={() => setIsLinkModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-all border border-slate-200 shadow-2xs"
            >
              <LinkIcon size={14} />
              Vincular Catálogo
            </button>
          )}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button 
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'grid' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <ViewGridIcon />
              <span>Cuadrícula</span>
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'list' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <ViewListIcon />
              <span>Lista</span>
            </button>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all shadow-2xs"
          >
            <Icon icon="heroicons:plus" className="text-base" />
            <span>{recipeCategoryTab === 'subrecipes' ? 'Nueva Sub-receta' : 'Crear Receta'}</span>
          </button>
        </div>
      </div>

      {/* ── Category View Tabs: Segmented Control */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200/80 gap-1">
          <button
            onClick={() => { setRecipeCategoryTab('dishes'); setActiveFilter('all'); }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              recipeCategoryTab === 'dishes'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icon icon="heroicons:sparkles" className="text-sm text-indigo-600" />
            <span>Platos & Ensamble</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200/60 text-slate-700 text-[11px] font-mono font-bold">
              {dishes.length}
            </span>
          </button>

          <button
            onClick={() => { setRecipeCategoryTab('subrecipes'); setActiveFilter('all'); }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              recipeCategoryTab === 'subrecipes'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icon icon="heroicons:beaker" className="text-sm text-amber-600" />
            <span>Sub-recetas & Prep</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200/60 text-slate-700 text-[11px] font-mono font-bold">
              {subrecipes.length}
            </span>
          </button>

          <button
            onClick={() => setRecipeCategoryTab('layout')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              recipeCategoryTab === 'layout'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icon icon="heroicons:map-pin" className="text-sm text-emerald-600" />
            <span>Layout de Estaciones Cocina</span>
          </button>
        </div>

        {activeFilter !== 'all' && (
          <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md text-xs font-medium border border-indigo-200">
            <span>Filtro: {
              activeFilter === 'critical' ? 'Margen bajo (<30%)' : 
              activeFilter === 'healthy' ? 'Rentables (>40%)' :
              'Mayor Inversión'
            }</span>
            <button onClick={() => setActiveFilter('all')} className="hover:text-indigo-900 ml-1">
              <Icon icon="heroicons:x-mark" className="text-xs" />
            </button>
          </div>
        )}
      </div>

      {/* ── Onboarding Tip Banner (Crisp) */}
      {showTip && recipes.length > 0 && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-slate-600 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-base shrink-0">💡</span>
            <p className="leading-normal">
              <strong>Flujo de estandarización:</strong> 1. Crear Insumos → 2. Armar Sub-recetas / Fichas Técnicas → 3. Vincular a Productos de la Carta para sincronizar costos y márgenes automáticamente.
            </p>
          </div>
          <button onClick={dismissTip} className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200/60 shrink-0" title="Descartar">
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── Conditional View: If Layout Tab is active, render KitchenStationLayout */}
      {recipeCategoryTab === 'layout' ? (
        <KitchenStationLayout />
      ) : (
        <>
          {/* ── Search & Filter Toolbar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[240px]">
                <Icon 
                  icon="heroicons:magnifying-glass" 
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" 
                />
                <input 
                  type="text" 
                  placeholder={recipeCategoryTab === 'subrecipes' ? "Buscar sub-receta por nombre, insumo, ubicación..." : "Buscar plato por nombre, ingrediente, estación..."} 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title="Borrar búsqueda"
                  >
                    <Icon icon="heroicons:x-mark" className="text-xs" />
                  </button>
                )}
              </div>

              {/* Filters Group */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Station Filter */}
                <div className="relative min-w-[170px] flex-1 sm:flex-initial">
                  <Icon icon="heroicons:map-pin" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <select
                    value={selectedStation}
                    onChange={e => setSelectedStation(e.target.value)}
                    className="w-full pl-8 pr-8 py-2 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">Todas las estaciones</option>
                    {availableStations.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                  <Icon icon="heroicons:chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                </div>

                {/* Ingredient Filter */}
                <div className="relative min-w-[190px] flex-1 sm:flex-initial">
                  <Icon icon="heroicons:beaker" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <select
                    value={selectedIngredientId}
                    onChange={e => setSelectedIngredientId(e.target.value)}
                    className="w-full pl-8 pr-8 py-2 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">Todos los insumos</option>
                    {allIngredients.map(ing => (
                      <option key={ing.id} value={ing.id}>{ing.name}</option>
                    ))}
                  </select>
                  <Icon icon="heroicons:chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                </div>

                {/* Financial Quick Pills */}
                {recipeCategoryTab === 'dishes' ? (
                  <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                    <button
                      onClick={() => setActiveFilter('all')}
                      className={`px-2.5 py-1.5 rounded-md font-semibold transition-all ${activeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setActiveFilter('healthy')}
                      className={`px-2.5 py-1.5 rounded-md font-semibold transition-all ${activeFilter === 'healthy' ? 'bg-emerald-600 text-white shadow-2xs font-bold' : 'text-slate-500 hover:text-emerald-700'}`}
                    >
                      Rentables (&gt;40%)
                    </button>
                    <button
                      onClick={() => setActiveFilter('critical')}
                      className={`px-2.5 py-1.5 rounded-md font-semibold transition-all ${activeFilter === 'critical' ? 'bg-rose-600 text-white shadow-2xs font-bold' : 'text-slate-500 hover:text-rose-700'}`}
                    >
                      Bajo Margen (&lt;30%)
                    </button>
                  </div>
                ) : (
                  <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                    <button
                      onClick={() => setActiveFilter('all')}
                      className={`px-2.5 py-1.5 rounded-md font-semibold transition-all ${activeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      Todas
                    </button>
                    <button
                      onClick={() => setActiveFilter('addon')}
                      className={`px-2.5 py-1.5 rounded-md font-semibold transition-all ${activeFilter === 'addon' ? 'bg-indigo-600 text-white shadow-2xs font-bold' : 'text-slate-500 hover:text-indigo-700'}`}
                    >
                      Vendible como Addon
                    </button>
                  </div>
                )}

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all border border-rose-200"
                    title="Restablecer todos los filtros"
                  >
                    <Icon icon="heroicons:x-mark" className="text-xs" />
                    <span>Limpiar</span>
                  </button>
                )}
              </div>
            </div>

            {/* Status / Count Bar */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">
                  Mostrando {displayRecipes.length} de {activeRecipeList.length} {recipeCategoryTab === 'subrecipes' ? 'sub-recetas' : 'recetas'}
                </span>
                {hasActiveFilters && (
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-[11px] font-bold border border-indigo-100">
                    Filtros aplicados
                  </span>
                )}
              </div>
              {displayRecipes.length === 0 && (
                <span className="text-rose-600 font-medium">Ninguna receta coincide con los filtros aplicados</span>
              )}
            </div>
          </div>

          {/* ── Recipes View */}
          {viewMode === 'list' ? (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="px-5 py-3">Nombre de Receta</th>
                      <th className="px-5 py-3">Tipo & Ubicación</th>
                      <th className="px-5 py-3 hidden md:table-cell">
                        {recipeCategoryTab === 'subrecipes' ? 'Rendimiento' : 'Precio Sugerido'}
                      </th>
                      <th className="px-5 py-3 text-right">Costo & Margen</th>
                      <th className="px-5 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {displayRecipes.map(recipe => {
                      const m = recipe.target_price > 0 ? ((recipe.target_price - recipe.total_cost) / recipe.target_price) * 100 : 0;
                      return (
                        <tr key={recipe.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3.5">
                            <div>
                              <p className="font-semibold text-slate-900">{recipe.name}</p>
                              {recipe.description && (
                                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-sm">{recipe.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${
                                recipe.is_subrecipe 
                                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              }`}>
                                {recipe.is_subrecipe ? 'Sub-receta' : `${recipe.recipe_ingredients?.length || 0} Insumos`}
                              </span>
                              {recipe.storage_location && (
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <Icon icon="heroicons:map-pin" className="text-xs text-slate-400" />
                                  {recipe.storage_location}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 hidden md:table-cell tabular-nums font-semibold text-slate-700">
                            {recipe.is_subrecipe ? (
                              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                                {recipe.batch_yield || 0} {recipe.batch_unit || 'g'}
                              </span>
                            ) : (
                              (recipe.target_price || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="tabular-nums font-bold text-slate-900">
                              {(recipe.total_cost || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                            </div>
                            {recipe.is_subrecipe ? (
                              <div className="text-[11px] text-slate-500 font-medium">
                                ${((recipe.total_cost || 0) / (recipe.batch_yield || 1)).toFixed(2)} / {recipe.batch_unit || 'g'}
                              </div>
                            ) : (
                              <span className={`text-[11px] font-semibold ${m >= 40 ? 'text-emerald-600' : m >= 30 ? 'text-amber-600' : 'text-rose-600'}`}>
                                {m.toFixed(1)}% Margen
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => setViewingKitchenRecipe(recipe)} 
                                className="h-8 px-2.5 flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-all"
                                title="Ver Ficha Digital de Cocina"
                              >
                                <Icon icon="heroicons:device-phone-mobile" className="text-sm" />
                                <span className="hidden lg:inline">Ficha</span>
                              </button>
                              <button onClick={() => handleOpenModal(recipe)} className="w-8 h-8 flex items-center justify-center text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-all">
                                <Icon icon="heroicons:pencil-square" className="text-base" />
                              </button>
                              <button onClick={() => handleDelete(recipe.id)} className="w-8 h-8 flex items-center justify-center text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md transition-all">
                                <Icon icon="heroicons:trash" className="text-base" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
              {displayRecipes.map(recipe => {
                const ingredients = recipe.recipe_ingredients || [];
                const m = recipe.target_price > 0 ? ((recipe.target_price - recipe.total_cost) / recipe.target_price) * 100 : 0;
                
                return (
                  <div key={recipe.id}
                    className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden group shadow-sm hover:shadow-md ${
                      recipe.is_subrecipe 
                        ? 'border-amber-200/80 hover:border-amber-400/90' 
                        : 'border-slate-200 hover:border-indigo-300'
                    }`}>
                    
                    {/* Top Accent Strip */}
                    <div className={`h-1.5 w-full ${recipe.is_subrecipe ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-indigo-500 to-indigo-600'}`} />

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          {recipe.is_subrecipe ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100/80 text-amber-900 border border-amber-300/60 shadow-2xs">
                              <Icon icon="heroicons:beaker" className="text-sm text-amber-700" />
                              Sub-receta Prep
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-100/80 text-indigo-900 border border-indigo-200 shadow-2xs">
                              <Icon icon="heroicons:sparkles" className="text-sm text-indigo-600" />
                              Plato de Carta
                            </span>
                          )}

                          {recipe.is_subrecipe ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-mono text-slate-800 bg-amber-50/70 border border-amber-200/80">
                              <Icon icon="heroicons:scale" className="text-xs text-amber-600" />
                              {recipe.batch_yield || 0} {recipe.batch_unit || 'g'}
                            </span>
                          ) : (
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                              m >= 40 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : m >= 30 
                                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {m.toFixed(0)}% Margen
                            </span>
                          )}
                        </div>

                        {/* Title & Metadata */}
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-800 transition-colors line-clamp-1 min-h-[1.5rem]" title={recipe.name}>
                          {recipe.name}
                        </h3>
                        
                        <div className="flex items-center gap-2 mt-1.5 mb-3.5 text-xs text-slate-500 flex-wrap">
                          <span className="font-semibold text-slate-700">{ingredients.length} insumos</span>
                          {recipe.storage_location && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="inline-flex items-center gap-1 text-slate-600 font-medium truncate max-w-[170px]" title={recipe.storage_location}>
                                <Icon icon="heroicons:map-pin" className="text-xs text-slate-400 shrink-0" />
                                <span>{recipe.storage_location}</span>
                              </span>
                            </>
                          )}
                          {recipe.prep_time_minutes && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="inline-flex items-center gap-1 text-slate-600 font-medium font-mono">
                                <Icon icon="heroicons:clock" className="text-xs text-slate-400 shrink-0" />
                                <span>{recipe.prep_time_minutes}m</span>
                              </span>
                            </>
                          )}
                        </div>

                        {/* Structured Ingredients Mini-Table with fixed uniform height */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 mb-4 space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 pb-1 border-b border-slate-200/80">
                            <span>Ingrediente</span>
                            <span>Gramaje</span>
                          </div>
                          
                          <div className="space-y-1.5 min-h-[75px] flex flex-col justify-start">
                            {ingredients.slice(0, 3).map((ri, index) => (
                              <div key={ri.ingredient_id || index} className="flex items-center justify-between text-xs py-0.5 px-1">
                                <span className="text-slate-800 font-medium truncate pr-2">{ri.ingredients?.name}</span>
                                <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs shrink-0">
                                  {ri.quantity} {ri.ingredients?.usage_unit || 'g'}
                                </span>
                              </div>
                            ))}
                            {ingredients.length === 0 && (
                              <p className="text-xs text-slate-400 text-center py-4">Sin ingredientes configurados</p>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-500 font-medium text-center pt-1 border-t border-slate-200/70 min-h-[22px]">
                            {ingredients.length > 3 ? (
                              <span>+ {ingredients.length - 3} ingredientes más en la ficha</span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Ficha completa</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Financial Footer */}
                      <div>
                        <div className={`rounded-xl p-3 border flex items-center justify-between mb-3.5 ${
                          recipe.is_subrecipe 
                            ? 'bg-amber-50/40 border-amber-200/70' 
                            : 'bg-slate-50 border-slate-200/80'
                        }`}>
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              {recipe.is_subrecipe ? 'Costo x gramo' : 'Precio venta'}
                            </span>
                            <span className="font-mono text-xs font-extrabold text-slate-800">
                              {recipe.is_subrecipe 
                                ? `$${((recipe.total_cost || 0) / (recipe.batch_yield || 1)).toFixed(2)} / ${recipe.batch_unit || 'g'}`
                                : (recipe.target_price || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              {recipe.is_subrecipe ? 'Costo bache' : 'Costo unitario'}
                            </span>
                            <span className="font-mono text-base font-black text-slate-900">
                              ${(recipe.total_cost || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setViewingKitchenRecipe(recipe)}
                            className={`flex-1 h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs ${
                              recipe.is_subrecipe
                                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                            title="Ver ficha técnica digital de cocina"
                          >
                            <Icon icon="heroicons:device-phone-mobile" className="text-sm" />
                            <span>{recipe.is_subrecipe ? 'Ficha Bache' : 'Ficha Cocina'}</span>
                          </button>
                          <button 
                            onClick={() => handleOpenModal(recipe)}
                            className="w-9 h-9 flex items-center justify-center text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-xl transition-colors"
                            title="Editar receta"
                          >
                            <Icon icon="heroicons:pencil-square" className="text-sm" />
                          </button>
                          <button 
                            onClick={() => handleDelete(recipe.id)}
                            className="w-9 h-9 flex items-center justify-center text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-xl transition-colors"
                            title="Eliminar receta"
                          >
                            <Icon icon="heroicons:trash" className="text-sm" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {displayRecipes.length === 0 && recipes.length > 0 && (
        <div className="mt-8 py-20 bg-slate-50/70 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
          <Icon icon="heroicons:funnel" className="text-4xl mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">No hay recetas para este filtro</p>
          <p className="text-xs text-slate-400 mt-0.5">Prueba cambiando los filtros o la búsqueda</p>
          <button onClick={() => setActiveFilter('all')} className="mt-4 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors">
            Ver todas las recetas
          </button>
        </div>
      )}

      {recipes.length === 0 && (
        <div className="mt-8 py-16 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center shadow-sm">
          <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 text-indigo-600 border border-indigo-100">
            <Icon icon="heroicons:book-open" className="text-2xl" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Recetario Vacío</h3>
          <p className="text-sm text-slate-500 font-normal max-w-md text-center mb-8">
            Las recetas te permiten controlar costos estándar, mermas y calcular márgenes brutos automáticamente.
          </p>

          {/* Step-by-step flow guide */}
          <div className="flex items-center gap-3 mb-8 flex-wrap justify-center max-w-2xl px-4">
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 px-4 py-3 rounded-lg flex-1 min-w-[180px]">
              <div className="w-7 h-7 bg-emerald-600 text-white rounded-md flex items-center justify-center text-xs font-bold shrink-0">1</div>
              <div>
                <p className="text-xs font-bold text-slate-900">Crear Insumos</p>
                <p className="text-xs text-slate-500">Materias primas y costos</p>
              </div>
            </div>
            <Icon icon="heroicons:chevron-right" className="text-slate-300 text-lg hidden sm:block shrink-0" />
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 px-4 py-3 rounded-lg flex-1 min-w-[180px]">
              <div className="w-7 h-7 bg-indigo-600 text-white rounded-md flex items-center justify-center text-xs font-bold shrink-0">2</div>
              <div>
                <p className="text-xs font-bold text-slate-900">Armar Recetas</p>
                <p className="text-xs text-slate-500">Insumos y gramajes</p>
              </div>
            </div>
            <Icon icon="heroicons:chevron-right" className="text-slate-300 text-lg hidden sm:block shrink-0" />
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 px-4 py-3 rounded-lg flex-1 min-w-[180px]">
              <div className="w-7 h-7 bg-violet-600 text-white rounded-md flex items-center justify-center text-xs font-bold shrink-0">3</div>
              <div>
                <p className="text-xs font-bold text-slate-900">Vincular Platos</p>
                <p className="text-xs text-slate-500">Márgenes automáticos</p>
              </div>
            </div>
          </div>

          <PrimaryButton onClick={() => handleOpenModal()} className="rounded-lg px-5 py-2.5 h-auto text-xs font-semibold shadow-sm">
            <Icon icon="heroicons:plus" className="text-base" />
            Crear Primera Receta
          </PrimaryButton>
        </div>
      )}

      {/* ── RECIPE EDITOR MODAL (Clean Professional Design mounted via Portal) */}
      {isModalOpen && (
        <Portal>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4 lg:p-6 overflow-y-auto animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[94vh] overflow-hidden shadow-2xl flex flex-col my-auto border border-slate-200">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                  <Icon icon={editingRecipe ? "heroicons:clipboard-document-check" : "heroicons:plus-circle"} className="text-xl" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingRecipe ? 'Editar Ficha Técnica' : 'Nueva Receta / Sub-receta'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {editingRecipe ? editingRecipe.name : 'Configuración de producción y proporciones'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-semibold text-slate-500">Costo Producción</p>
                  <p className="text-lg font-bold text-slate-900 tabular-nums">
                    {totalCost.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="hidden sm:block h-7 w-[1px] bg-slate-200" />
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-semibold text-slate-500">Margen Estimado</p>
                  <p className={`text-lg font-bold tabular-nums ${margin >= 40 ? 'text-emerald-600' : margin >= 30 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {margin.toFixed(1)}%
                  </p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-all"
                >
                  <Icon icon="heroicons:x-mark" className="text-xl" />
                </button>
              </div>
            </div>

            {/* Sub Navigation Tabs con Colores Sólidos */}
            <div className="flex border-b border-slate-200 bg-slate-100/80 px-6 py-2.5 gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setModalTab('ingredients')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  modalTab === 'ingredients'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon icon="heroicons:scale" className={`text-sm ${modalTab === 'ingredients' ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>1. Insumos & Gramera</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  modalTab === 'ingredients' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {formData.ingredients.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('steps')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  modalTab === 'steps'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon icon="heroicons:clipboard-document-list" className={`text-sm ${modalTab === 'steps' ? 'text-indigo-200' : 'text-indigo-600'}`} />
                <span>2. Paso a Paso de Cocina</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  modalTab === 'steps' ? 'bg-indigo-800 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {(formData.step_by_step || []).length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('energy')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  modalTab === 'energy'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon icon="heroicons:bolt" className={`text-sm ${modalTab === 'energy' ? 'text-amber-200' : 'text-amber-600'}`} />
                <span>3. Equipos & Energía (CIF)</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  modalTab === 'energy' ? 'bg-amber-800 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {(formData.recipe_equipment || []).length}
                </span>
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0 bg-white">
              {/* ── Left Column (34%) for ingredients catalog */}
              {modalTab === 'ingredients' ? (
                <div className="md:w-[34%] border-r border-slate-200 flex flex-col overflow-hidden bg-slate-50/70">
                  <div className="p-4 border-b border-slate-200 shrink-0 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Catálogo de Insumos</p>
                      <span className="text-[11px] font-semibold text-slate-400">{filteredIngredients.length} disponibles</span>
                    </div>
                    <SearchInput 
                      value={searchTerm} 
                      onChange={e => setSearchTerm(e.target.value)} 
                      placeholder="Buscar insumo por nombre..." 
                      className="rounded-lg border-slate-200 text-xs h-9"
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                    {filteredIngredients.map(ing => {
                      const isAlreadyUsed = formData.ingredients.some(i => i.ingredient_id === ing.id);
                      return (
                        <button 
                          key={ing.id} 
                          type="button" 
                          onClick={() => handleAddIngredient(ing)}
                          className={`w-full p-2.5 rounded-xl text-left transition-all flex justify-between items-center group/ing ${
                            isAlreadyUsed
                              ? 'bg-emerald-50/60 border-2 border-emerald-500 shadow-2xs hover:bg-emerald-100/60'
                              : 'bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <p className={`text-xs font-bold truncate ${isAlreadyUsed ? 'text-emerald-950 font-black' : 'text-slate-800'}`}>
                                {ing.name}
                              </p>
                              {isAlreadyUsed && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-600 text-white shrink-0 uppercase tracking-wider">
                                  ✓ En receta
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium tabular-nums mt-0.5">
                              ${ing.unit_cost?.toLocaleString('es-CO', { maximumFractionDigits: 1 })} / {ing.usage_unit}
                            </p>
                          </div>
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                            isAlreadyUsed
                              ? 'bg-emerald-600 text-white border border-emerald-700'
                              : 'bg-indigo-50 border border-indigo-100 text-indigo-600 group-hover/ing:bg-indigo-600 group-hover/ing:text-white'
                          }`}>
                            <Icon icon={isAlreadyUsed ? "heroicons:check" : "heroicons:plus"} className="text-sm font-bold" />
                          </div>
                        </button>
                      );
                    })}
                    {filteredIngredients.length === 0 && (
                      <div className="py-8 text-center flex flex-col items-center text-slate-400">
                        <Icon icon="heroicons:magnifying-glass" className="text-2xl mb-1 text-slate-300" />
                        <p className="text-xs font-medium">Sin insumos encontrados</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="md:w-[32%] border-r border-slate-200 flex flex-col overflow-hidden bg-slate-50/50">
                  <div className="p-4 border-b border-slate-200 shrink-0">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Insumos de la Receta</p>
                    <p className="text-[11px] text-slate-500">Consulta los gramajes exactos para redactar cada paso operativo.</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                    {formData.ingredients.map((ing, i) => (
                      <div key={ing.ingredient_id || i} className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between shadow-2xs">
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold text-slate-800 truncate">{ing.name}</p>
                          <p className="text-[11px] text-indigo-600 font-semibold">{ing.quantity} {ing.usage_unit}</p>
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                          #{i + 1}
                        </span>
                      </div>
                    ))}
                    {formData.ingredients.length === 0 && (
                      <div className="p-6 text-center text-slate-400">
                        <p className="text-xs font-medium">No has agregado insumos aún.</p>
                        <button type="button" onClick={() => setModalTab('ingredients')} className="mt-2 text-xs font-bold text-indigo-600 hover:underline">
                          Ir a pestaña 1 (Insumos)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Right Column (68%) */}
              <form onSubmit={handleSave} className="md:w-[68%] flex flex-col overflow-hidden">
                {modalTab === 'ingredients' ? (
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="sm:col-span-2">
                         <label className="text-xs font-bold text-slate-700 block mb-1">Nombre de la Receta *</label>
                         <input 
                           required 
                           value={formData.name} 
                           onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                           placeholder="Ej. Poke Bowl Pollito Crazy" 
                           className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 outline-none focus:border-indigo-500"
                         />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700">Precio Venta</label>
                          <span className="text-[10px] text-slate-400 font-semibold">Al público</span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">$</span>
                          <input 
                            type="number" 
                            value={formData.target_price} 
                            onChange={e => setFormData(prev => ({ ...prev, target_price: Number(e.target.value) }))} 
                            className="w-full h-10 pl-7 pr-3 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 outline-none focus:border-indigo-500 tabular-nums"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700">Margen Deseado</label>
                          <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                            margin >= 60 ? 'bg-emerald-100 text-emerald-800' : margin >= 30 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {margin > 0 ? `${margin.toFixed(1)}% Real` : '0%'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="relative flex-1">
                            <input 
                              type="number" 
                              min="0"
                              max="99.9"
                              step="any"
                              value={margin > 0 ? Number(margin.toFixed(1)) : ''} 
                              onChange={e => handleTargetMarginChange(e.target.value)}
                              placeholder="65"
                              className="w-full h-10 px-3 pr-7 bg-indigo-50/50 border border-indigo-200 rounded-lg text-sm font-black text-indigo-900 outline-none focus:border-indigo-500 tabular-nums"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-indigo-500 font-bold text-xs">%</span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            {[60, 70].map(pct => (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => handleTargetMarginChange(pct)}
                                className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-slate-600 transition-colors"
                                title={`Fijar margen en ${pct}%`}
                              >
                                {pct}%
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="sm:col-span-4">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700">Descripción & Notas Técnicas</label>
                          <button
                            type="button"
                            onClick={handleGenerateDescriptionAI}
                            disabled={isGeneratingDesc}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 px-2.5 py-1 rounded-lg transition-all disabled:opacity-50"
                          >
                            <Icon icon={isGeneratingDesc ? "lucide:loader-2" : "heroicons:sparkles"} className={`text-xs ${isGeneratingDesc ? 'animate-spin' : ''}`} />
                            <span>{isGeneratingDesc ? 'Generando...' : 'Sugerir con IA ✨'}</span>
                          </button>
                        </div>
                        <textarea 
                          value={formData.description} 
                          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} 
                          placeholder="Instrucciones para cocina, montaje, advertencias de alérgenos o descripción atractiva..." 
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 min-h-[64px]"
                        />
                      </div>

                      {/* Subreceta Toggle & Extra fields */}
                      <div className="sm:col-span-4 bg-amber-50/70 border border-amber-200/90 rounded-2xl p-5 shadow-2xs">
                        <div className="flex items-center justify-between gap-4 mb-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                              <Icon icon="heroicons:beaker" className="text-xl" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-amber-950">Sub-receta / Preparación en Bache (Mise en Place)</p>
                              <p className="text-xs text-amber-800 mt-0.5">Activar si se prepara en volumen previo al turno (arroz sushi preparado, salsas, cubos marinados).</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input 
                              type="checkbox" 
                              checked={formData.is_subrecipe} 
                              onChange={e => setFormData(prev => ({ ...prev, is_subrecipe: e.target.checked }))} 
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                          </label>
                        </div>

                        {formData.is_subrecipe && (() => {
                          const batchYield = Number(formData.batch_yield) || 1000;
                          const unitCostPerGram = batchYield > 0 ? (totalCost / batchYield) : 0;
                          const portionGrams = Number(formData.addon_portion_grams) || 150;
                          const portionCost = Math.round(portionGrams * unitCostPerGram);
                          const addonPrice = Number(formData.addon_price) || 0;
                          const addonMargin = addonPrice > 0 ? (((addonPrice - portionCost) / addonPrice) * 100) : 0;

                          return (
                            <>
                              {/* Métricas clave del bache */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3.5 border-t border-amber-200/80 animate-fade-in">
                                <div className="p-2.5 bg-amber-100/60 rounded-xl border border-amber-200 text-center">
                                  <span className="text-[10px] uppercase font-bold text-amber-800 block">Costo Total Bache</span>
                                  <span className="text-sm font-black font-mono text-amber-950">${Math.round(totalCost).toLocaleString('es-CO')}</span>
                                </div>
                                <div className="p-2.5 bg-amber-100/60 rounded-xl border border-amber-200 text-center">
                                  <span className="text-[10px] uppercase font-bold text-amber-800 block">Costo Unitario</span>
                                  <span className="text-sm font-black font-mono text-amber-950">${unitCostPerGram > 0 ? unitCostPerGram.toFixed(1) : '0'} / {formData.batch_unit || 'g'}</span>
                                </div>
                                <div className="p-2.5 bg-amber-100/60 rounded-xl border border-amber-200 text-center">
                                  <span className="text-[10px] uppercase font-bold text-amber-800 block">Rendimiento</span>
                                  <span className="text-sm font-black font-mono text-amber-950">{batchYield.toLocaleString()} {formData.batch_unit || 'g'}</span>
                                </div>
                                <div className="p-2.5 bg-amber-100/60 rounded-xl border border-amber-200 text-center">
                                  <span className="text-[10px] uppercase font-bold text-amber-800 block">Porciones Estándar</span>
                                  <span className="text-sm font-black font-mono text-amber-950">~{portionGrams > 0 ? Math.floor(batchYield / portionGrams) : 0} porciones</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-amber-200/60">
                                <div>
                                  <label className="text-xs font-bold text-amber-950 block mb-1">Rendimiento Bache</label>
                                  <input 
                                    type="number" 
                                    value={formData.batch_yield} 
                                    onChange={e => setFormData(prev => ({ ...prev, batch_yield: Number(e.target.value) }))} 
                                    placeholder="Ej: 2200" 
                                    className="w-full h-9 px-3 bg-white border border-amber-300 rounded-lg font-bold text-xs text-slate-900 outline-none focus:border-amber-600 tabular-nums shadow-2xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-bold text-amber-950 block mb-1">Unidad</label>
                                  <input 
                                    type="text" 
                                    value={formData.batch_unit} 
                                    onChange={e => setFormData(prev => ({ ...prev, batch_unit: e.target.value }))} 
                                    placeholder="g, ml, porción" 
                                    className="w-full h-9 px-3 bg-white border border-amber-300 rounded-lg font-semibold text-xs text-slate-900 outline-none focus:border-amber-600 shadow-2xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-bold text-amber-950 block mb-1">Vida Útil (Días)</label>
                                  <input 
                                    type="number" 
                                    value={formData.shelf_life_days} 
                                    onChange={e => setFormData(prev => ({ ...prev, shelf_life_days: Number(e.target.value) }))} 
                                    placeholder="Ej: 3" 
                                    className="w-full h-9 px-3 bg-white border border-amber-300 rounded-lg font-bold text-xs text-slate-900 outline-none focus:border-amber-600 tabular-nums shadow-2xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-bold text-amber-950 block mb-1">Ubicación / Nevera</label>
                                  <input 
                                    type="text" 
                                    value={formData.storage_location} 
                                    onChange={e => setFormData(prev => ({ ...prev, storage_location: e.target.value }))} 
                                    placeholder="Nevera 1 - Inserto..." 
                                    className="w-full h-9 px-3 bg-white border border-amber-300 rounded-lg font-medium text-xs text-slate-900 outline-none focus:border-amber-600 shadow-2xs"
                                  />
                                </div>
                              </div>

                              {/* Opciones de Venta como Adición y Producto Público */}
                              <div className={`mt-4 pt-4 border-t transition-all rounded-2xl p-4 border shadow-2xs space-y-3.5 ${
                                formData.available_as_addon 
                                  ? 'bg-amber-50/90 border-amber-300 ring-1 ring-amber-300/60' 
                                  : 'bg-white/80 border-slate-200'
                              }`}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      role="switch"
                                      aria-checked={formData.available_as_addon}
                                      onClick={() => setFormData(prev => ({ ...prev, available_as_addon: !prev.available_as_addon }))}
                                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                        formData.available_as_addon ? 'bg-amber-600' : 'bg-slate-300'
                                      }`}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                          formData.available_as_addon ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                      />
                                    </button>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-950 block">Disponible como Adición / Extra en Menú</span>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                          formData.available_as_addon 
                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                                        }`}>
                                          {formData.available_as_addon ? 'Activo' : 'Desactivado'}
                                        </span>
                                      </div>
                                      <span className="text-[11px] text-slate-500">Permite a los comensales pedir una porción extra (ej. 110g Shari) descontando del bache preparado</span>
                                    </div>
                                  </div>

                                  {formData.available_as_addon && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {/* Gramaje de Porción */}
                                      <div className="flex items-center gap-1.5 bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 shadow-2xs">
                                        <span className="text-[10px] font-bold text-amber-800 uppercase">Porción:</span>
                                        <input 
                                          type="number"
                                          min="1"
                                          value={formData.addon_portion_grams}
                                          onChange={e => setFormData(prev => ({ ...prev, addon_portion_grams: e.target.value }))}
                                          className="w-16 h-6 text-center font-bold text-xs text-slate-900 outline-none tabular-nums bg-slate-50 border border-slate-200 rounded"
                                        />
                                        <span className="text-xs font-bold text-slate-700">{formData.batch_unit || 'g'}</span>
                                      </div>

                                      {/* Precio de Venta Adición */}
                                      <div className="flex items-center gap-1.5 bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 shadow-2xs">
                                        <span className="text-[10px] font-bold text-amber-800 uppercase">Precio:</span>
                                        <span className="text-xs font-bold text-slate-400">$</span>
                                        <input 
                                          type="number"
                                          min="0"
                                          step="100"
                                          value={formData.addon_price}
                                          onChange={e => setFormData(prev => ({ ...prev, addon_price: Number(e.target.value) }))}
                                          placeholder="4500"
                                          className="w-20 h-6 font-bold text-xs text-slate-900 outline-none tabular-nums bg-slate-50 border border-slate-200 rounded px-1"
                                        />
                                      </div>

                                      {/* Preset 60% Margen para la adición */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const suggestedAddon = portionCost > 0 ? Math.round(portionCost / (1 - 0.60)) : 4000;
                                          setFormData(prev => ({ ...prev, addon_price: suggestedAddon }));
                                        }}
                                        className="px-2 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-md text-[10px] font-bold transition-colors shadow-2xs"
                                        title="Calcular precio con 60% de margen"
                                      >
                                        Sugerir 60%
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Desglose financiero y rentabilidad de la adición */}
                                {formData.available_as_addon && (
                                  <>
                                    <div className="flex items-center justify-between p-2.5 bg-amber-100/70 rounded-xl border border-amber-200/90 text-xs">
                                      <div className="flex items-center gap-2">
                                        <span className="text-slate-600 font-medium">Costo porción ({portionGrams}{formData.batch_unit || 'g'}):</span>
                                        <strong className="font-mono font-bold text-slate-900">${portionCost.toLocaleString('es-CO')} COP</strong>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <span className="text-slate-600 font-medium">Rentabilidad estimada:</span>
                                        <span className={`px-2 py-0.5 rounded-md font-black font-mono text-xs border ${
                                          addonMargin >= 50 
                                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                                            : addonMargin >= 30 
                                            ? 'bg-amber-100 text-amber-800 border-amber-300' 
                                            : 'bg-rose-100 text-rose-800 border-rose-300'
                                        }`}>
                                          {addonMargin > 0 ? `${addonMargin.toFixed(1)}% Margen` : '0.0%'}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Publicar directamente como Producto en la Carta Pública */}
                                    <div className="p-3 bg-white rounded-xl border border-amber-200 shadow-2xs space-y-2.5">
                                      <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5">
                                          <button
                                            type="button"
                                            role="switch"
                                            aria-checked={syncAsProduct}
                                            onClick={() => setSyncAsProduct(prev => !prev)}
                                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                              syncAsProduct ? 'bg-indigo-600' : 'bg-slate-300'
                                            }`}
                                          >
                                            <span
                                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                syncAsProduct ? 'translate-x-4' : 'translate-x-0'
                                              }`}
                                            />
                                          </button>
                                          <div>
                                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                              <span>🛍️ Mostrar como Ítem Suelto en la Carta Pública</span>
                                              {linkedProduct && (
                                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                                  linkedProduct.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                  {linkedProduct.is_active ? '• Publicado' : '• Pausado'}
                                                </span>
                                              )}
                                            </span>
                                            <p className="text-[11px] text-slate-500">
                                              Crea una tarjeta individual en la carta para que el cliente pueda pedir la porción directamente al carrito sin entrar a un bowl.
                                            </p>
                                          </div>
                                        </div>

                                        {syncAsProduct && (
                                          <div className="flex items-center gap-2 shrink-0">
                                            <label className="text-[11px] font-bold text-slate-600">Categoría:</label>
                                            <select
                                              value={selectedCategoryId}
                                              onChange={e => setSelectedCategoryId(e.target.value)}
                                              className="h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
                                            >
                                              <option value="">-- Seleccionar categoría --</option>
                                              {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                              ))}
                                            </select>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Ingredient Composition Area */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Composición de Ingredientes</h4>
                          <p className="text-xs text-slate-500 font-medium">Define las cantidades exactas para el gramaje estándar.</p>
                        </div>
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-slate-200">
                          {formData.ingredients.length} Insumos vinculados
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {formData.ingredients.map(ing => (
                          <div key={ing.ingredient_id} className="p-3.5 bg-white border border-slate-300 rounded-xl shadow-xs hover:border-slate-400 transition-all flex flex-col justify-between">
                            <div className="flex items-start justify-between gap-2 mb-2.5">
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate">{ing.name}</p>
                                <p className="text-[11px] text-slate-500 font-medium tabular-nums mt-0.5">
                                  Costo unitario: ${ing.unit_cost?.toFixed(2)} / {ing.usage_unit}
                                </p>
                              </div>
                              <button 
                                type="button" 
                                onClick={() => handleRemoveIngredient(ing.ingredient_id)}
                                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all shrink-0"
                                title="Quitar de la receta"
                              >
                                <Icon icon="heroicons:trash" className="text-base" />
                              </button>
                            </div>
                            
                            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                                <span className="text-[11px] text-slate-500 font-bold uppercase">Cant:</span>
                                <input 
                                  type="number" 
                                  step="any" 
                                  min="0" 
                                  value={ing.quantity}
                                  onChange={e => handleUpdateQuantity(ing.ingredient_id, e.target.value)}
                                  className="w-16 h-7 px-1.5 bg-white border border-slate-300 rounded font-black text-xs text-center text-slate-900 focus:border-indigo-600 outline-none tabular-nums" 
                                />
                                <span className="text-xs text-slate-700 font-bold">{ing.usage_unit}</span>
                              </div>
                              <div className="text-right">
                                 <span className="text-xs font-black text-slate-900 tabular-nums bg-emerald-50 text-emerald-800 px-2 py-1 rounded-md border border-emerald-100">
                                   ${Math.round(ing.quantity * ing.unit_cost).toLocaleString('es-CO')}
                                 </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {formData.ingredients.length === 0 && (
                        <div className="py-10 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50">
                          <Icon icon="heroicons:beaker" className="text-3xl text-slate-300 mb-2" />
                          <h5 className="text-xs font-bold text-slate-700">Sin ingredientes en la receta</h5>
                          <p className="text-xs text-slate-500 max-w-xs mt-1">Haz clic en los insumos del catálogo izquierdo para agregarlos a la ficha técnica.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : modalTab === 'steps' ? (
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Header de Paso a Paso */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                      <div>
                        <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                          <Icon icon="heroicons:clipboard-document-list" className="text-base text-indigo-600" />
                          Procedimiento Operativo Estandarizado (SOP)
                        </h4>
                        <p className="text-[11px] text-indigo-900/70 mt-0.5">
                          Pasos numerados que el personal de cocina verá y tachará en pantalla durante el turno.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 bg-white border border-indigo-200 rounded-lg px-2.5 py-1 shadow-2xs">
                          <Icon icon="heroicons:clock" className="text-indigo-600 text-xs" />
                          <span className="text-[11px] font-bold text-slate-700">Tiempo:</span>
                          <input 
                            type="number" 
                            min="0"
                            value={formData.prep_time_minutes} 
                            onChange={e => setFormData(prev => ({ ...prev, prep_time_minutes: e.target.value }))}
                            placeholder="Ej: 8" 
                            className="w-12 h-6 px-1 text-center font-bold text-xs text-indigo-950 bg-indigo-50/40 border border-indigo-200 rounded outline-none focus:bg-white"
                          />
                          <span className="text-[11px] text-slate-500 font-medium">min</span>
                        </div>

                        <button
                          type="button"
                          onClick={handleGenerateStepsAI}
                          disabled={isGeneratingSteps}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-2xs transition-all disabled:opacity-50"
                        >
                          <Icon icon={isGeneratingSteps ? "lucide:loader-2" : "heroicons:sparkles"} className={`text-xs ${isGeneratingSteps ? 'animate-spin' : ''}`} />
                          <span>{isGeneratingSteps ? 'Generando...' : 'Sugerir con IA ✨'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleAddStep}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-all"
                        >
                          <Icon icon="heroicons:plus" className="text-xs" />
                          <span>+ Agregar Paso</span>
                        </button>
                      </div>
                    </div>

                    {/* Lista de Pasos con Drag & Drop */}
                    {(formData.step_by_step || []).length > 0 ? (
                      <div className="space-y-3">
                        {(formData.step_by_step || []).map((step, idx) => (
                          <div 
                            key={idx} 
                            draggable
                            onDragStart={() => setDraggedStepIndex(idx)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => {
                              if (draggedStepIndex === null || draggedStepIndex === idx) return;
                              setFormData(prev => {
                                const list = [...(prev.step_by_step || [])];
                                const [removed] = list.splice(draggedStepIndex, 1);
                                list.splice(idx, 0, removed);
                                return {
                                  ...prev,
                                  step_by_step: list.map((s, i) => ({ ...s, step: i + 1 }))
                                };
                              });
                              setDraggedStepIndex(null);
                            }}
                            className={`p-4 bg-white border rounded-xl shadow-2xs transition-all space-y-2.5 ${
                              draggedStepIndex === idx 
                                ? 'opacity-40 border-indigo-400 scale-[0.99]' 
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                                  title="Arrastra para reordenar paso"
                                >
                                  <Icon icon="heroicons:bars-3" className="text-base" />
                                </div>
                                <span className="w-6 h-6 rounded-md bg-indigo-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                                  {step.step || idx + 1}
                                </span>
                                <span className="text-xs font-bold text-slate-800">Paso {step.step || idx + 1}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                {/* Estación Selector */}
                                <div className="flex items-center gap-1">
                                  <span className="text-[11px] text-slate-500 font-medium">Estación:</span>
                                  <select
                                    value={step.station || (formData.is_subrecipe ? 'Mise en Place' : 'Cocina')}
                                    onChange={e => handleUpdateStep(idx, 'station', e.target.value)}
                                    className="text-xs font-semibold px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-indigo-500"
                                  >
                                    <option value="Cocina">🍳 Cocina (General)</option>
                                    <option value="Ensamble">🥗 Ensamble / Fríos</option>
                                    <option value="Parrilla">🥩 Parrilla / Plancha</option>
                                    <option value="Fritura">🍟 Fritura / Calientes</option>
                                    <option value="Barra">🍸 Barra / Bebidas</option>
                                    <option value="Mise en Place">🔪 Mise en Place (Pre-turno)</option>
                                  </select>
                                </div>

                                {/* Mover y Borrar */}
                                <div className="flex items-center gap-0.5 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveStep(idx, -1)}
                                    className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-all"
                                    title="Subir paso"
                                  >
                                    <Icon icon="heroicons:chevron-up" className="text-xs" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === (formData.step_by_step.length - 1)}
                                    onClick={() => handleMoveStep(idx, 1)}
                                    className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-all"
                                    title="Bajar paso"
                                  >
                                    <Icon icon="heroicons:chevron-down" className="text-xs" />
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveStep(idx)}
                                  className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                  title="Eliminar paso"
                                >
                                  <Icon icon="heroicons:trash" className="text-sm" />
                                </button>
                              </div>
                            </div>

                            <div>
                              <input
                                type="text"
                                value={step.title || ''}
                                onChange={e => handleUpdateStep(idx, 'title', e.target.value)}
                                placeholder="Título corto del paso (Ej. Pesar arroz sushi y base de bowl)"
                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                              />
                            </div>

                            <div>
                              <textarea
                                value={step.desc || ''}
                                onChange={e => handleUpdateStep(idx, 'desc', e.target.value)}
                                placeholder="Instrucción detallada de preparación, gramaje exacto a verificar en gramera, temperatura o técnica..."
                                rows={2}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-indigo-500 resize-none leading-relaxed"
                              />
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={handleAddStep}
                          className="w-full py-2.5 border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-xl text-xs font-bold text-indigo-700 flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Icon icon="heroicons:plus" className="text-sm" />
                          <span>+ Agregar Siguiente Paso</span>
                        </button>
                      </div>
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50 p-6">
                        <div className="w-12 h-12 rounded-xl bg-indigo-100/70 text-indigo-600 flex items-center justify-center mb-3">
                          <Icon icon="heroicons:clipboard-document-list" className="text-2xl" />
                        </div>
                        <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Sin pasos operativos registrados aún</h5>
                        <p className="text-xs text-slate-500 max-w-md mt-1 mb-4 leading-relaxed">
                          Estandariza cómo se elabora este plato para que cualquier cocinero o auxiliar opere con la calidad exacta en su pantalla de producción.
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={handleAddStep}
                            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all"
                          >
                            + Agregar Primer Paso
                          </button>
                          <button
                            type="button"
                            onClick={handleGenerateStepsAI}
                            disabled={isGeneratingSteps}
                            className="px-4 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold transition-all disabled:opacity-50"
                          >
                            {isGeneratingSteps ? 'Generando...' : '✨ Sugerir con IA'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ── TAB 3: EQUIPOS, ENERGÍA & SERVICIOS (CIF) ── */
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50/60 border border-amber-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                          <Icon icon="heroicons:bolt" className="text-2xl" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                            Costos Indirectos: Energía, Gas & Agua por Receta
                          </h4>
                          <p className="text-[11px] text-amber-800 mt-0.5">
                            Asocia los electrodomésticos utilizados para calcular automáticamente el costo real de cocción.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-900 bg-white px-3 py-1.5 rounded-lg border border-amber-300">
                          Total Servicios: ${Math.round(energyCost).toLocaleString('es-CO')} COP
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsUtilitiesModalOpen(true)}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                        >
                          <Icon icon="heroicons:cog-6-tooth" className="text-sm" />
                          <span>Configurar Equipos / Tarifas</span>
                        </button>
                      </div>
                    </div>

                    {/* Selector de Equipos para añadir */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                      <h5 className="text-xs font-bold text-slate-800 mb-2">Vincular Electrodoméstico a esta Ficha</h5>
                      <div className="flex flex-wrap items-center gap-2">
                        {availableEquipment.map(eq => {
                          const isAlreadyLinked = (formData.recipe_equipment || []).some(item => item.equipment_id === eq.id);
                          return (
                            <button
                              key={eq.id}
                              type="button"
                              disabled={isAlreadyLinked}
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  recipe_equipment: [
                                    ...(prev.recipe_equipment || []),
                                    {
                                      equipment_id: eq.id,
                                      usage_minutes: Number(formData.prep_time_minutes) || 30,
                                      water_liters_override: eq.water_liters_per_cycle || null,
                                      name: eq.name,
                                      energy_type: eq.energy_type,
                                      power_watts: eq.power_watts,
                                      gas_consumption_m3_per_hour: eq.gas_consumption_m3_per_hour,
                                      water_liters_per_cycle: eq.water_liters_per_cycle
                                    }
                                  ]
                                }));
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                                isAlreadyLinked
                                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                  : 'bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border-slate-200 hover:border-amber-300'
                              }`}
                            >
                              <Icon icon={eq.energy_type === 'electric' ? 'heroicons:bolt' : eq.energy_type === 'gas' ? 'heroicons:fire' : 'heroicons:beaker'} className="text-xs text-amber-600" />
                              <span>{eq.name}</span>
                              {!isAlreadyLinked && <Icon icon="heroicons:plus" className="text-xs" />}
                            </button>
                          );
                        })}
                        {availableEquipment.length === 0 && (
                          <p className="text-xs text-slate-400 italic">No tienes equipos registrados. Usa el botón superior para agregar tu arrocera, freidora, estufa, etc.</p>
                        )}
                      </div>
                    </div>

                    {/* Lista de equipos vinculados a la receta */}
                    {(formData.recipe_equipment || []).length > 0 ? (
                      <div className="space-y-3">
                        {(formData.recipe_equipment || []).map((item, idx) => {
                          let itemCost = 0;
                          const mins = Number(item.usage_minutes) || 0;
                          if (item.energy_type === 'electric' || item.energy_type === 'dual') {
                            const kw = (Number(item.power_watts) || 0) / 1000;
                            itemCost += (kw * (mins / 60) * utilityRates.kwh_price);
                          }
                          if (item.energy_type === 'gas' || item.energy_type === 'dual') {
                            const m3PerHour = Number(item.gas_consumption_m3_per_hour) || 0;
                            itemCost += (m3PerHour * (mins / 60) * utilityRates.gas_m3_price);
                          }
                          const waterLiters = item.water_liters_override !== null && item.water_liters_override !== undefined
                            ? Number(item.water_liters_override)
                            : Number(item.water_liters_per_cycle) || 0;
                          itemCost += (waterLiters * utilityRates.water_liter_price);

                          return (
                            <div key={item.equipment_id || idx} className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                                  <Icon icon={item.energy_type === 'electric' ? 'heroicons:bolt' : item.energy_type === 'gas' ? 'heroicons:fire' : 'heroicons:beaker'} className="text-lg" />
                                </div>
                                <div>
                                  <h5 className="text-xs font-bold text-slate-900">{item.name}</h5>
                                  <p className="text-[11px] text-slate-500">
                                    {item.energy_type === 'electric' ? `${item.power_watts}W (${((item.power_watts || 0)/1000).toFixed(1)} kW)` : item.energy_type === 'gas' ? `${item.gas_consumption_m3_per_hour} m³/h` : 'Ciclo de agua'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase">Tiempo Uso:</span>
                                  <input 
                                    type="number"
                                    min="1"
                                    value={item.usage_minutes}
                                    onChange={e => {
                                      const val = e.target.value;
                                      setFormData(prev => ({
                                        ...prev,
                                        recipe_equipment: prev.recipe_equipment.map((eq, i) => i === idx ? { ...eq, usage_minutes: val } : eq)
                                      }));
                                    }}
                                    className="w-14 h-6 text-center font-bold text-xs text-slate-900 outline-none tabular-nums bg-white border border-slate-300 rounded"
                                  />
                                  <span className="text-xs font-semibold text-slate-600">min</span>
                                </div>

                                <div className="text-right min-w-[90px]">
                                  <span className="block text-[10px] uppercase font-bold text-slate-400">Gasto Energía:</span>
                                  <span className="text-xs font-black text-amber-800 tabular-nums">
                                    ${Math.round(itemCost).toLocaleString('es-CO')} COP
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      recipe_equipment: prev.recipe_equipment.filter((_, i) => i !== idx)
                                    }));
                                  }}
                                  className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                  title="Quitar equipo"
                                >
                                  <Icon icon="heroicons:trash" className="text-base" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-10 border border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50 p-6">
                        <Icon icon="heroicons:bolt" className="text-3xl text-amber-400 mx-auto mb-2" />
                        <h5 className="text-xs font-bold text-slate-800 uppercase">Sin equipos vinculados a esta receta</h5>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                          Si esta preparación requiere cocción (arrocera, estufa, freidora, horno), selecciónala arriba para sumarle su costo de minutos de gas o luz.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Controls */}
                <div className="px-6 py-3.5 border-t border-slate-200 flex justify-end gap-2.5 shrink-0 bg-slate-50">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all"
                  >
                    Descartar
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
                  >
                    {editingRecipe ? 'Actualizar Ficha Técnica' : 'Guardar Nueva Receta'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Portal>
      )}
      {/* Catalog Link Modal */}
      <LinkCatalogModal 
        isOpen={isLinkModalOpen}
        onClose={() => {
          setIsLinkModalOpen(false);
          fetchRecipes(activeLocationId);
        }}
        type="recipe"
        locationId={activeLocationId}
        locationName={activeLocation?.name || 'Sede'}
      />

      {/* ── Mobile Kitchen Recipe Viewer Modal */}
      {viewingKitchenRecipe && (
        <KitchenRecipeViewerModal
          recipe={viewingKitchenRecipe}
          allRecipes={recipes}
          isOpen={Boolean(viewingKitchenRecipe)}
          onClose={() => setViewingKitchenRecipe(null)}
        />
      )}

      {/* ── Modal de Tarifas de Energía & Equipos de Cocina */}
      <KitchenUtilitiesModal
        isOpen={isUtilitiesModalOpen}
        onClose={() => {
          setIsUtilitiesModalOpen(false);
          fetchUtilitiesAndEquipment();
        }}
        brandId={brandId}
        locationId={activeLocationId}
        locationName={activeLocation?.name || 'Sede Principal'}
      />
    </div>
  );
}
