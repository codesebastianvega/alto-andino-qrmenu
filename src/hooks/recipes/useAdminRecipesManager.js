import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../config/supabase';
import { toast } from '../../components/Toast';
import { useAdminIngredients } from '../useAdminIngredients';
import { useAdminRecipes } from '../useAdminRecipes';
import { useGemini } from '../useGemini';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';

export function useAdminRecipesManager() {
  const { activeLocationId, activeLocation, isAllLocations } = useLocation();
  const { recipes, loading, fetchRecipes } = useAdminRecipes();
  const { ingredients: allIngredients, fetchIngredients } = useAdminIngredients();
  const { activeBrand } = useAuth();
  const brandId = activeBrand?.id;
  const { generateText, loading: isGeneratingSteps } = useGemini();

  // Navigation & View states
  const [viewMode, setViewMode] = useState('list'); // 'grid' | 'list'
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'critical' | 'healthy' | 'investment' | 'addon'
  const [recipeCategoryTab, setRecipeCategoryTab] = useState('dishes'); // 'dishes' | 'subrecipes' | 'layout'
  const [searchTerm, setSearchTerm] = useState('');
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  const [selectedStation, setSelectedStation] = useState('all');
  const [selectedIngredientId, setSelectedIngredientId] = useState('all');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isUtilitiesModalOpen, setIsUtilitiesModalOpen] = useState(false);
  const [viewingKitchenRecipe, setViewingKitchenRecipe] = useState(null);
  const [batchModalRecipe, setBatchModalRecipe] = useState(null);

  // Equipment & utilities & categories
  const [availableEquipment, setAvailableEquipment] = useState([]);
  const [utilityRates, setUtilityRates] = useState({ kwh_price: 950, gas_m3_price: 2800, water_liter_price: 5.5 });
  const [categories, setCategories] = useState([]);

  // Form & Editing state
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [modalTab, setModalTab] = useState('ingredients'); // 'ingredients' | 'steps' | 'energy'
  const [draggedStepIndex, setDraggedStepIndex] = useState(null);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

  // Linked public product state
  const [linkedProduct, setLinkedProduct] = useState(null);
  const [syncAsProduct, setSyncAsProduct] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  // Onboarding tip
  const [showTip, setShowTip] = useState(() => {
    try { return localStorage.getItem('recipes_tip_dismissed') !== 'true'; } catch { return true; }
  });

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
    available_as_addon: false,
    addon_portion_grams: 150,
    addon_price: 0,
    recipe_equipment: []
  });

  const fetchUtilitiesAndEquipment = useCallback(async () => {
    if (!brandId) return;
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
  }, [brandId, activeLocationId]);

  useEffect(() => { 
    if (brandId) {
      fetchRecipes(activeLocationId); 
      fetchIngredients(activeLocationId); 
      fetchUtilitiesAndEquipment();
    }
  }, [brandId, activeLocationId, fetchRecipes, fetchIngredients, fetchUtilitiesAndEquipment]);

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

      // Buscar si ya existe un producto vinculado
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
                usage_unit: ri.ingredients?.usage_unit,
                image_url: ri.ingredients?.image_url
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
    setCatalogSearchTerm('');
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

  // Cost calculations
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

  const handleTargetMarginChange = (percent) => {
    const desiredMargin = Number(percent);
    if (desiredMargin >= 100 || desiredMargin < 0 || totalCost <= 0) return;
    const calculatedPrice = Math.round(totalCost / (1 - (desiredMargin / 100)));
    setFormData(prev => ({ ...prev, target_price: calculatedPrice }));
  };

  const filteredIngredients = useMemo(() =>
    allIngredients.filter(i =>
      i.name.toLowerCase().includes(catalogSearchTerm.toLowerCase()) ||
      (i.category || '').toLowerCase().includes(catalogSearchTerm.toLowerCase())
    ), [allIngredients, catalogSearchTerm]
  );

  const handleAddIngredient = (ing) => {
    if (formData.ingredients.find(i => i.ingredient_id === ing.id)) {
      toast('El insumo ya está en la receta'); return;
    }
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { ingredient_id: ing.id, quantity: 1, name: ing.name, unit_cost: ing.unit_cost, usage_unit: ing.usage_unit, image_url: ing.image_url }]
    }));
  };

  const handleRemoveIngredient = (id) =>
    setFormData(prev => ({ ...prev, ingredients: prev.ingredients.filter(i => i.ingredient_id !== id) }));

  const handleUpdateQuantity = (id, qty) =>
    setFormData(prev => ({ ...prev, ingredients: prev.ingredients.map(i => i.ingredient_id === id ? { ...i, quantity: parseFloat(qty) || 0 } : i) }));

  // Dishes vs Subrecipes split
  const dishes = useMemo(() => recipes.filter(r => !r.is_subrecipe), [recipes]);
  const subrecipes = useMemo(() => recipes.filter(r => r.is_subrecipe), [recipes]);
  const activeRecipeList = recipeCategoryTab === 'subrecipes' ? subrecipes : dishes;

  // Global KPI metrics
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

  // Unique available stations
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

  // Filtered display list
  const displayRecipes = useMemo(() => {
    return activeRecipeList.filter(r => {
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchesName = r.name.toLowerCase().includes(q);
        const matchesDesc = (r.description || '').toLowerCase().includes(q);
        const matchesLocation = (r.storage_location || '').toLowerCase().includes(q);
        const matchesIngredients = (r.recipe_ingredients || []).some(ri =>
          ri.ingredients?.name?.toLowerCase().includes(q)
        );
        const matchesSteps = (r.step_by_step || []).some(s =>
          (s.title || '').toLowerCase().includes(q) || (s.desc || '').toLowerCase().includes(q)
        );
        if (!matchesName && !matchesDesc && !matchesLocation && !matchesIngredients && !matchesSteps) {
          return false;
        }
      }

      if (selectedStation !== 'all') {
        const matchLocation = (r.storage_location || '').trim().toLowerCase() === selectedStation.trim().toLowerCase();
        const matchStepStation = (r.step_by_step || []).some(s => 
          (s.station || '').trim().toLowerCase() === selectedStation.trim().toLowerCase()
        );
        if (!matchLocation && !matchStepStation) return false;
      }

      if (selectedIngredientId !== 'all') {
        const hasIngredient = (r.recipe_ingredients || []).some(ri => ri.ingredient_id === selectedIngredientId);
        if (!hasIngredient) return false;
      }

      const m = r.target_price > 0 ? ((r.target_price - r.total_cost) / r.target_price) * 100 : 0;
      if (activeFilter === 'critical') return m < 30;
      if (activeFilter === 'healthy') return m >= 40;
      if (activeFilter === 'addon') return Boolean(r.available_as_addon);
      return true;
    });
  }, [activeRecipeList, searchTerm, selectedStation, selectedIngredientId, activeFilter]);

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
        // If it's a subrecipe, synchronize it into the ingredients table
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

  return {
    // Brand & Location
    brandId,
    activeLocationId,
    activeLocation,
    isAllLocations,
    // Recipes & Ingredients
    recipes,
    loading,
    fetchRecipes,
    allIngredients,
    fetchIngredients,
    // Filters & Navigation
    viewMode,
    setViewMode,
    activeFilter,
    setActiveFilter,
    recipeCategoryTab,
    setRecipeCategoryTab,
    searchTerm,
    setSearchTerm,
    catalogSearchTerm,
    setCatalogSearchTerm,
    selectedStation,
    setSelectedStation,
    selectedIngredientId,
    setSelectedIngredientId,
    availableStations,
    filteredIngredients,
    displayRecipes,
    dishes,
    subrecipes,
    activeRecipeList,
    statsMetrics,
    hasActiveFilters,
    resetFilters,
    // Form & Modal
    isModalOpen,
    setIsModalOpen,
    isLinkModalOpen,
    setIsLinkModalOpen,
    isUtilitiesModalOpen,
    setIsUtilitiesModalOpen,
    viewingKitchenRecipe,
    setViewingKitchenRecipe,
    batchModalRecipe,
    setBatchModalRecipe,
    editingRecipe,
    modalTab,
    setModalTab,
    draggedStepIndex,
    setDraggedStepIndex,
    isGeneratingDesc,
    isGeneratingSteps,
    formData,
    setFormData,
    totalCost,
    margin,
    energyCost,
    utilityRates,
    availableEquipment,
    categories,
    linkedProduct,
    syncAsProduct,
    setSyncAsProduct,
    selectedCategoryId,
    setSelectedCategoryId,
    showTip,
    dismissTip,
    fetchUtilitiesAndEquipment,
    // Actions
    handleOpenModal,
    handleSave,
    handleDelete,
    handleAddStep,
    handleUpdateStep,
    handleRemoveStep,
    handleMoveStep,
    handleGenerateStepsAI,
    handleGenerateDescriptionAI,
    handleTargetMarginChange,
    handleAddIngredient,
    handleRemoveIngredient,
    handleUpdateQuantity
  };
}
