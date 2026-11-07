import { useState, useEffect, useMemo } from 'react';
import { useAdminIngredients } from '../useAdminIngredients';
import { useIngredientCategories } from '../useIngredientCategories';
import { useAdminProviders } from '../useAdminProviders';
import { useLocations } from '../useLocations';
import { useLocationInventory } from '../useLocationInventory';
import { useLinkCatalog } from '../useLinkCatalog';
import { useLocation } from '../../context/LocationContext';
import { getZeroWasteSuggestion } from '../../utils/zeroWasteKnowledge';
import { getExpirationStatus } from '../../utils/inventoryHelpers';

export const emptyForm = {
  name: '',
  description: '',
  sku: '',
  image_url: '',
  reception_date: '',
  expiration_date: '',
  purchase_price: 0,
  purchase_unit: 'Unidad',
  purchase_quantity: 1,
  usage_unit: 'unidad',
  stock_current: 0,
  stock_min: 0,
  selling_price: 0,
  is_modifier: false,
  category_id: '',
  provider_id: '',
  is_active: true,
  has_merma: false,
  merma_percent: 0,
  portion_size: 50
};

export function useAdminInsumosData(activeLocationId) {
  const {
    ingredients,
    loading,
    fetchIngredients,
    createIngredient,
    updateIngredient,
    deleteIngredient,
    toggleIngredientStatus
  } = useAdminIngredients();

  const { categories } = useIngredientCategories();
  const { providers, fetchProviders } = useAdminProviders();

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [showZeroOnly, setShowZeroOnly] = useState(false);
  const [showZeroWasteOnly, setShowZeroWasteOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'raw' | 'subrecipe' | 'expiring'
  const [sortBy, setSortBy] = useState('name_asc');
  const [batchModalItem, setBatchModalItem] = useState(null);

  // inlineEdit: { id, purchase_price, purchase_quantity, purchase_unit, usage_unit }
  const [inlineEdit, setInlineEdit] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const { activeLocation, isAllLocations } = useLocation();

  const [showInvTip, setShowInvTip] = useState(() => {
    try {
      return localStorage.getItem('inventory_tip_dismissed') !== 'true';
    } catch {
      return true;
    }
  });

  const dismissInvTip = () => {
    setShowInvTip(false);
    try {
      localStorage.setItem('inventory_tip_dismissed', 'true');
    } catch {}
  };

  // Per-location inventory state
  const { locations } = useLocations();
  const { saveInventory, fetchInventory } = useLocationInventory();
  const { linkItem, unlinkItem } = useLinkCatalog();
  const [locationInventory, setLocationInventory] = useState({});

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchIngredients(activeLocationId);
    fetchProviders();
  }, [activeLocationId, fetchIngredients, fetchProviders]);

  const unitCost = useMemo(() =>
    (parseFloat(form.purchase_price) || 0) / (parseFloat(form.purchase_quantity) || 1),
    [form.purchase_price, form.purchase_quantity]
  );

  const inlineUnitCost = useMemo(() => {
    if (!inlineEdit) return 0;
    return (parseFloat(inlineEdit.purchase_price) || 0) / (parseFloat(inlineEdit.purchase_quantity) || 1);
  }, [inlineEdit]);

  const zeroCostCount = useMemo(() =>
    ingredients.filter(i => !i.unit_cost || i.unit_cost === 0).length,
    [ingredients]
  );

  const totalInventoryValue = useMemo(() =>
    ingredients.reduce((sum, i) => sum + ((i.unit_cost || 0) * (i.stock_current || 0)), 0),
    [ingredients]
  );

  const outOfStockCount = useMemo(() =>
    ingredients.filter(i => (Number(i.stock_current) || 0) <= 0).length,
    [ingredients]
  );

  const lowStockCount = useMemo(() =>
    ingredients.filter(i => (Number(i.stock_current) || 0) > 0 && (Number(i.stock_current) || 0) <= (Number(i.stock_min) || 0)).length,
    [ingredients]
  );

  const zeroWasteCount = useMemo(() =>
    ingredients.filter(i => Boolean(i.has_merma)).length,
    [ingredients]
  );

  const rawCount = useMemo(() =>
    ingredients.filter(i => !i.is_subrecipe && !(i.name || '').toLowerCase().includes('(subreceta)')).length,
    [ingredients]
  );

  const subrecipeCount = useMemo(() =>
    ingredients.filter(i => Boolean(i.is_subrecipe) || (i.name || '').toLowerCase().includes('(subreceta)')).length,
    [ingredients]
  );

  const expiringSoonCount = useMemo(() =>
    ingredients.filter(i => {
      const exp = getExpirationStatus(i.expiration_date);
      return exp && exp.days <= 7;
    }).length,
    [ingredients]
  );

  const filtered = useMemo(() => {
    const list = ingredients.filter(i => {
      let matchSearch = true;
      const expStatus = getExpirationStatus(i.expiration_date);
      const isExpiringItem = expStatus && expStatus.days <= 7;

      if (search === 'stock_bajo') {
        matchSearch = i.stock_current <= i.stock_min;
      } else if (search === 'por_vencer') {
        matchSearch = Boolean(isExpiringItem);
      } else if (search === 'high_value') {
        const avgValue = totalInventoryValue / (ingredients.length || 1);
        matchSearch = ((i.unit_cost || 0) * (i.stock_current || 0)) >= avgValue;
      } else {
        matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) ||
                      (i.sku || '').toLowerCase().includes(search.toLowerCase());
      }

      const matchCat = catFilter === 'all' || i.category_id === catFilter;
      const matchProv = providerFilter === 'all' || i.provider_id === providerFilter;
      const matchZero = !showZeroOnly || !i.unit_cost || i.unit_cost === 0;
      const matchZeroWaste = !showZeroWasteOnly || Boolean(i.has_merma);

      const isSubrecipeItem = Boolean(i.is_subrecipe) || (i.name || '').toLowerCase().includes('(subreceta)');
      const matchType = typeFilter === 'all' ? true :
                        typeFilter === 'subrecipe' ? isSubrecipeItem :
                        typeFilter === 'expiring' ? isExpiringItem :
                        !isSubrecipeItem;

      return matchSearch && matchCat && matchProv && matchZero && matchZeroWaste && matchType;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'name_asc') {
        return (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' });
      }
      if (sortBy === 'name_desc') {
        return (b.name || '').localeCompare(a.name || '', 'es', { sensitivity: 'base' });
      }
      if (sortBy === 'category') {
        const catA = categories.find(c => c.id === a.category_id)?.name || 'Sin Categ';
        const catB = categories.find(c => c.id === b.category_id)?.name || 'Sin Categ';
        const cmp = catA.localeCompare(catB, 'es', { sensitivity: 'base' });
        return cmp !== 0 ? cmp : (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' });
      }
      if (sortBy === 'stock_asc') {
        return (a.stock_current || 0) - (b.stock_current || 0);
      }
      if (sortBy === 'stock_desc') {
        return (b.stock_current || 0) - (a.stock_current || 0);
      }
      if (sortBy === 'exp_asc') {
        if (!a.expiration_date && !b.expiration_date) return 0;
        if (!a.expiration_date) return 1;
        if (!b.expiration_date) return -1;
        return new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime();
      }
      if (sortBy === 'value_desc') {
        const valA = (a.unit_cost || 0) * (a.stock_current || 0);
        const valB = (b.unit_cost || 0) * (b.stock_current || 0);
        return valB - valA;
      }
      if (sortBy === 'recent') {
        const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return dateB - dateA;
      }
      return (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' });
    });
  }, [ingredients, search, catFilter, providerFilter, showZeroOnly, showZeroWasteOnly, typeFilter, totalInventoryValue, sortBy, categories]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setLocationInventory({});
    setIsOpen(true);
  };

  const openEdit = async (item) => {
    const defaultZw = getZeroWasteSuggestion(item.name);
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description || '',
      sku: item.sku || '',
      image_url: item.image_url || '',
      reception_date: item.reception_date || '',
      expiration_date: item.expiration_date || '',
      purchase_price: item.purchase_price || 0,
      purchase_unit: item.purchase_unit || 'Unidad',
      purchase_quantity: item.purchase_quantity || 1,
      usage_unit: item.usage_unit || 'unidad',
      stock_current: item.stock_current || 0,
      stock_min: item.stock_min || 0,
      selling_price: item.selling_price || 0,
      is_modifier: item.is_modifier || false,
      category_id: item.category_id || '',
      provider_id: item.provider_id || '',
      is_active: item.is_active,
      portion_size: item.portion_size || 50,
      has_merma: item.has_merma ?? (defaultZw !== null),
      merma_percent: item.merma_percent ?? (defaultZw?.defaultPercent || 20)
    });

    const existingInv = await fetchInventory({ ingredient_id: item.id });
    const invMap = {};
    existingInv.forEach(inv => {
      invMap[inv.location_id] = {
        stock_quantity: inv.stock_quantity,
        min_stock: inv.min_stock
      };
    });
    setLocationInventory(invMap);

    setIsOpen(true);
  };

  const openInlineEdit = (item) => {
    setInlineEdit({
      id: item.id,
      purchase_price: item.purchase_price || 0,
      purchase_quantity: item.purchase_quantity || 1,
      purchase_unit: item.purchase_unit || 'Unidad',
      usage_unit: item.usage_unit || 'unidad',
    });
    setConfirmDelete(null);
  };

  const saveInlineCost = async () => {
    if (!inlineEdit) return;
    const item = ingredients.find(i => i.id === inlineEdit.id);
    if (!item) return;
    const ok = await updateIngredient(inlineEdit.id, {
      ...item,
      purchase_price: inlineEdit.purchase_price,
      purchase_quantity: inlineEdit.purchase_quantity,
      purchase_unit: inlineEdit.purchase_unit,
    });
    if (ok !== null) setInlineEdit(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const savedItem = editing
      ? await updateIngredient(editing.id, form)
      : await createIngredient(form, activeLocationId);

    if (savedItem) {
      const invData = Object.entries(locationInventory).map(([locId, data]) => ({
        location_id: locId,
        ingredient_id: savedItem.id,
        stock_quantity: data.stock_quantity,
        min_stock: data.min_stock
      }));

      if (invData.length > 0) {
        await saveInventory(invData);
      }

      setIsOpen(false);
    }
  };

  const handleLinkIngredients = async (selectedIds) => {
    for (const id of selectedIds) {
      await linkItem('inventory', activeLocationId, id);
    }
    fetchIngredients(activeLocationId);
    setIsLinkModalOpen(false);
  };

  const handleUnlinkIngredient = async (id) => {
    if (window.confirm('¿Desvincular este insumo de esta sede?')) {
      await unlinkItem('inventory', activeLocationId, id);
      fetchIngredients(activeLocationId);
    }
  };

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const fi = (k, v) => setInlineEdit(prev => ({ ...prev, [k]: v }));

  const handlePurchaseUnitChange = (unit) => {
    let usageUnit = form.usage_unit;
    let purchaseQuantity = form.purchase_quantity;

    switch (unit) {
      case 'Kilogramos':
        usageUnit = 'Gramo';
        purchaseQuantity = 1000;
        break;
      case 'Litros':
        usageUnit = 'Mililitro';
        purchaseQuantity = 1000;
        break;
      case 'Libras':
        usageUnit = 'Gramo';
        purchaseQuantity = 500;
        break;
      case 'Gramos':
        usageUnit = 'Gramo';
        purchaseQuantity = '';
        break;
      case 'Mililitros':
        usageUnit = 'Mililitro';
        purchaseQuantity = '';
        break;
      case 'Unidades':
      case 'Paquetes':
      case 'Cajas':
      case 'Botellas':
      case 'Latas':
        usageUnit = 'Unidad';
        purchaseQuantity = 1;
        break;
      case 'Onzas':
        usageUnit = 'Onza';
        purchaseQuantity = '';
        break;
      default:
        break;
    }

    setForm(prev => ({
      ...prev,
      purchase_unit: unit,
      usage_unit: usageUnit,
      purchase_quantity: purchaseQuantity
    }));
  };

  return {
    ingredients,
    loading,
    categories,
    providers,
    locations,
    activeLocation,
    isAllLocations,
    isOpen,
    setIsOpen,
    editing,
    search,
    setSearch,
    catFilter,
    setCatFilter,
    providerFilter,
    setProviderFilter,
    showZeroOnly,
    setShowZeroOnly,
    showZeroWasteOnly,
    setShowZeroWasteOnly,
    typeFilter,
    setTypeFilter,
    sortBy,
    setSortBy,
    batchModalItem,
    setBatchModalItem,
    inlineEdit,
    setInlineEdit,
    confirmDelete,
    setConfirmDelete,
    isLinkModalOpen,
    setIsLinkModalOpen,
    showInvTip,
    dismissInvTip,
    locationInventory,
    setLocationInventory,
    form,
    setForm,
    unitCost,
    inlineUnitCost,
    zeroCostCount,
    totalInventoryValue,
    outOfStockCount,
    lowStockCount,
    zeroWasteCount,
    rawCount,
    subrecipeCount,
    expiringSoonCount,
    filtered,
    openCreate,
    openEdit,
    openInlineEdit,
    saveInlineCost,
    handleSave,
    handleLinkIngredients,
    handleUnlinkIngredient,
    deleteIngredient,
    toggleIngredientStatus,
    fetchIngredients,
    f,
    fi,
    handlePurchaseUnitChange
  };
}
