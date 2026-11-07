import { useState, useEffect, useMemo } from 'react';
import { useLocations } from '../../../../hooks/useLocations';
import { useLocationOverrides } from '../../../../hooks/useLocationOverrides';
import { useGemini } from '../../../../hooks/useGemini';
import { useRestaurantSettings } from '../../../../hooks/useRestaurantSettings';
import { convertDriveLink } from '../../../../utils/images';
import { toast as toastFn } from '../../../Toast';
import {
  getSubGroupsForGroup,
  calculateFinancialMetrics,
  normalizeBrandConcepts
} from '../helpers/productFormHelpers';

const toast = {
  success: (msg) => toastFn(msg, { type: 'success' }),
  error: (msg) => toastFn(msg, { type: 'error' }),
};

export function useProductFormData({
  product,
  categories = [],
  recipes = [],
  ingredients = [],
  rawModifierGroups = [],
  activeBrand,
  onSave
}) {
  const { generateText, loading: isGeneratingText } = useGemini();

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
  const [recipeSearch, setRecipeSearch] = useState('');
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [cogsMode, setCogsMode] = useState('recipe');
  const [customLocationPricing, setCustomLocationPricing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { settings } = useRestaurantSettings();
  const brandConceptOptions = useMemo(
    () => normalizeBrandConcepts(settings?.brand_concepts || []),
    [settings?.brand_concepts]
  );

  // Split modifiers into main and sub
  const mainGroups = useMemo(() => rawModifierGroups.filter((g) => !g.is_submodifier), [rawModifierGroups]);
  const subGroups = useMemo(() => rawModifierGroups.filter((g) => g.is_submodifier), [rawModifierGroups]);

  // Location Overrides
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

      const hasDivergentPrice = prices.some(
        (p) =>
          p.price !== null &&
          p.price !== undefined &&
          p.price !== '' &&
          Number(p.price) !== Number(product?.price)
      );
      setCustomLocationPricing(hasDivergentPrice);

      const merged = locations.map((loc) => {
        const p = prices.find((price) => price.location_id === loc.id);
        const s = status.find((st) => st.location_id === loc.id);
        return {
          location_id: loc.id,
          price: p && p.price !== null && p.price !== undefined ? p.price : '',
          is_active: s ? s.is_active : (product?.is_active ?? true),
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

  // Subcategories logic
  const availableSubcategories = useMemo(() => {
    if (!formData.category_id || !categories) return [];
    const cat = categories.find((c) => String(c.id) === String(formData.category_id));
    return cat?.visibility_config?.subcategories || [];
  }, [formData.category_id, categories]);

  useEffect(() => {
    if (availableSubcategories.length > 0) {
      if (
        formData.subcategory &&
        formData.subcategory !== 'Otros' &&
        !availableSubcategories.includes(formData.subcategory)
      ) {
        setFormData((prev) => ({ ...prev, subcategory: '' }));
      }
    }
  }, [formData.category_id, availableSubcategories]);

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

    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleOverrideChange = (locationId, field, value) => {
    setLocationOverrides((prev) => {
      const existing = prev.find((o) => o.location_id === locationId);
      if (existing) {
        return prev.map((o) => (o.location_id === locationId ? { ...o, [field]: value } : o));
      } else {
        return [
          ...prev,
          {
            location_id: locationId,
            is_active: field === 'is_active' ? value : false,
            stock_status: 'in',
            is_linked: field === 'is_active' && value === true,
            [field]: value
          }
        ];
      }
    });
  };

  const toggleModifierGroup = (groupId) => {
    setFormData((prev) => {
      const current = prev.modifier_groups || [];
      const isIn = current.includes(groupId);
      const group = rawModifierGroups.find((g) => g.id === groupId);
      const associatedSubGroupIds = group ? getSubGroupsForGroup(group, subGroups).map((sg) => sg.id) : [];

      let newGroups;
      if (isIn) {
        newGroups = current.filter((id) => id !== groupId && !associatedSubGroupIds.includes(id));
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
    setFormData((prev) => ({ ...prev, modifier_groups: items }));
  };

  const toggleTag = (tagName) => {
    setFormData((prev) => {
      const current = prev.tags || [];
      const newTags = current.includes(tagName)
        ? current.filter((t) => t !== tagName)
        : [...current, tagName];
      return { ...prev, tags: newTags };
    });
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
      setFormData((prev) => ({ ...prev, description: generated }));
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

    const normalizedOverrides = locationOverrides.map((o) => ({
      ...o,
      price: customLocationPricing
        ? o.price === '' || o.price === undefined || o.price === null
          ? null
          : parseFloat(o.price)
        : null
    }));

    const resolvedModifierGroups = new Set(formData.modifier_groups || []);
    (formData.modifier_groups || []).forEach((gId) => {
      const group = rawModifierGroups.find((g) => g.id === gId);
      if (group) {
        getSubGroupsForGroup(group, subGroups).forEach((sg) => resolvedModifierGroups.add(sg.id));
      }
    });

    onSave(
      {
        ...formData,
        modifier_groups: Array.from(resolvedModifierGroups),
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost) || 0,
        packaging_fee: parseFloat(formData.packaging_fee) || 0,
        subcategory: formData.subcategory || null,
        brand_concept: formData.brand_concept || null,
        visibility_mode: formData.visibility_mode || 'all',
      },
      normalizedOverrides
    );
  };

  // Recipe lookup
  const finalDishRecipes = useMemo(() => (recipes || []).filter((r) => !r.is_subrecipe), [recipes]);
  const linkedRecipe = useMemo(() => (recipes || []).find((r) => r.id === formData.recipe_id), [recipes, formData.recipe_id]);
  const linkedIngredient = useMemo(() => (ingredients || []).find((i) => i.id === formData.ingredient_id), [ingredients, formData.ingredient_id]);

  const directIngredients = useMemo(
    () => (ingredients || []).filter((i) => !i.is_subrecipe && !(i.name || '').toLowerCase().includes('(subreceta)')),
    [ingredients]
  );

  const searchedIngredients = useMemo(() => {
    if (!ingredientSearch.trim()) return directIngredients;
    const term = ingredientSearch.toLowerCase();
    return directIngredients.filter(
      (i) =>
        (i.name || '').toLowerCase().includes(term) ||
        (i.sku || '').toLowerCase().includes(term) ||
        (i.category || '').toLowerCase().includes(term)
    );
  }, [directIngredients, ingredientSearch]);

  const searchedFinalRecipes = useMemo(() => {
    if (!recipeSearch.trim()) return finalDishRecipes;
    const term = recipeSearch.toLowerCase();
    return finalDishRecipes.filter((r) => r.name?.toLowerCase().includes(term));
  }, [finalDishRecipes, recipeSearch]);

  const selectedCategoryName = useMemo(() => {
    const c = categories.find((cat) => String(cat.id) === String(formData.category_id));
    return c?.name || 'Sin Categoría';
  }, [categories, formData.category_id]);

  const financialMetrics = useMemo(
    () =>
      calculateFinancialMetrics({
        price: formData.price,
        cost: formData.cost,
        packagingFee: formData.packaging_fee,
        targetMargin
      }),
    [formData.price, formData.cost, formData.packaging_fee, targetMargin]
  );

  return {
    formData,
    setFormData,
    targetMargin,
    setTargetMargin,
    recipeSearch,
    setRecipeSearch,
    ingredientSearch,
    setIngredientSearch,
    cogsMode,
    setCogsMode,
    customLocationPricing,
    setCustomLocationPricing,
    locationOverrides,
    locations,
    isSaving,
    isGeneratingText,
    mainGroups,
    subGroups,
    availableSubcategories,
    brandConceptOptions,
    linkedRecipe,
    linkedIngredient,
    searchedIngredients,
    searchedFinalRecipes,
    selectedCategoryName,
    financialMetrics,
    handleChange,
    handleOverrideChange,
    toggleModifierGroup,
    onDragEnd,
    toggleTag,
    handleGenerateAI,
    handleSubmit
  };
}
