import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../../config/supabase';
import { toast } from '../../../Toast';
import { isValidUUID } from '../helpers/manualOrderHelpers';

export function useManualOrderCatalog({
  isOpen,
  brandId,
  locationId,
  restaurantSettings,
  menuData
}) {
  const {
    categories: menuCategories = [],
    productsByCategory = {},
    getAllProducts,
    locations: menuLocations = [],
    rawModifierGroups = []
  } = menuData || {};

  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [products, setProducts] = useState([]);
  const [locationsList, setLocationsList] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState(() => (isValidUUID(locationId) ? locationId : null));
  const [selectedCategory, setSelectedCategory] = useState('daily_specials');
  const [searchTerm, setSearchTerm] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(4000);

  const [activePaymentMethods, setActivePaymentMethods] = useState([
    { id: 'nequi', label: 'Nequi / Bre-B' },
    { id: 'efectivo', label: 'Efectivo' },
    { id: 'datafono', label: 'Datáfono' }
  ]);
  const [digitalAccountsList, setDigitalAccountsList] = useState([]);
  const [selectedDigitalAccountId, setSelectedDigitalAccountId] = useState('');
  const [splitDigitalMethod, setSplitDigitalMethod] = useState('nequi');

  // Daily Special Dynamic Data
  const [dailySpecialData, setDailySpecialData] = useState({
    activeSpecialId: null,
    activeSecondaryIds: [],
    soupName: '🥣 Crema de plátano colicero (16 oz)',
    drinkName: '🥤 Jugo del Día (5 oz)',
    promoPrice: 19000,
    label: 'El Bento del Día'
  });

  // Fetch catalog of products, locations and accounts
  useEffect(() => {
    if (!isOpen || !brandId) return;

    let isMounted = true;
    const fetchData = async () => {
      setLoadingCatalog(true);
      try {
        const [prodsRes, locsRes, pmRes, rsRes, brandRes] = await Promise.all([
          supabase
            .from('products')
            .select('id, name, description, price, cost, image_url, category_id, is_active, requires_kitchen, subcategory, categories:category_id(id, name, slug)')
            .eq('brand_id', brandId)
            .order('name', { ascending: true }),
          supabase
            .from('locations')
            .select('id, name, is_main')
            .eq('brand_id', brandId)
            .order('is_main', { ascending: false }),
          supabase
            .from('payment_methods')
            .select('id, name, type, is_active')
            .eq('brand_id', brandId)
            .eq('is_active', true)
            .order('created_at', { ascending: true }),
          supabase
            .from('restaurant_settings')
            .select('id, brand_id, location_id, brand_concepts')
            .eq('brand_id', brandId),
          supabase
            .from('brands')
            .select('id, name, config')
            .eq('id', brandId)
            .single()
        ]);

        // Extraer configuración dinámica del Bento del Día
        const rsRows = rsRes.data || [];
        const primaryRow = rsRows.find(r => !r.location_id) || rsRows[0] || null;
        const concepts = Array.isArray(primaryRow?.brand_concepts) ? primaryRow.brand_concepts : [];
        const bentoConcept = concepts.find(c => c && (c.id === 'bento_del_dia_config' || c.id === 'daily_special_config'));

        const todayNum = new Date().getDay();
        const activeSpecialId = bentoConcept?.manual_override_product_id || bentoConcept?.schedule?.[todayNum] || null;
        const activeSecondaryIds = Array.isArray(bentoConcept?.secondary_product_ids)
          ? bentoConcept.secondary_product_ids
          : (bentoConcept?.secondary_schedule?.[todayNum] || []);

        const extractedSoup = bentoConcept?.soup_name?.trim() || '🥣 Crema de plátano colicero (16 oz)';
        const extractedDrink = bentoConcept?.drink_name?.trim() || '🥤 Jugo del Día (5 oz)';
        const extractedPromoPrice = Number(bentoConcept?.promo_price) || 19000;

        setDailySpecialData({
          activeSpecialId,
          activeSecondaryIds,
          soupName: extractedSoup,
          drinkName: extractedDrink,
          promoPrice: extractedPromoPrice,
          label: bentoConcept?.label || 'El Bento del Día'
        });

        if (prodsRes.error) throw prodsRes.error;

        if (isMounted) {
          const allFetched = prodsRes.data || [];
          const rawProds = allFetched.filter(p => {
            if (p.is_active) return true;
            if (p.id === activeSpecialId || activeSecondaryIds.includes(p.id)) return true;
            return false;
          });

          setProducts(rawProds);
          const fetchedLocs = locsRes.data || [];
          setLocationsList(fetchedLocs);

          // Cuentas financieras reales
          const brandConfig = brandRes.data?.config || {};
          const finAccounts = Array.isArray(brandConfig?.financials?.accounts) && brandConfig.financials.accounts.length > 0
            ? brandConfig.financials.accounts
            : [
                { id: 'acc_cash_main', name: 'Gaveta Física (Efectivo)', type: 'cash' },
                { id: 'acc_nequi_main', name: 'Nequi / Bre-B', type: 'digital_wallet' },
                { id: 'acc_daviplata_main', name: 'Daviplata', type: 'digital_wallet' }
              ];

          const cashAcc = finAccounts.find(a => a.type === 'cash' || /efectivo|gaveta/i.test(a.name)) || finAccounts[0];
          const digAccs = finAccounts.filter(a => a.type !== 'cash' && !/efectivo|gaveta/i.test(a.name));

          const builtMethods = [
            { id: 'efectivo', accountId: cashAcc?.id || 'acc_cash_main', label: cashAcc?.name || 'Gaveta Física (Efectivo)', type: 'cash' }
          ];

          digAccs.forEach(acc => {
            let mid = acc.id;
            if (/nequi/i.test(acc.name)) mid = 'nequi';
            else if (/daviplata/i.test(acc.name)) mid = 'daviplata';
            builtMethods.push({ id: mid, accountId: acc.id, label: acc.name, type: acc.type || 'digital_wallet' });
          });

          if (Array.isArray(pmRes.data)) {
            pmRes.data.forEach(pm => {
              const lower = (pm.name || '').toLowerCase();
              const alreadyIn = builtMethods.some(b =>
                b.label.toLowerCase() === lower ||
                (lower.includes('nequi') && b.id === 'nequi') ||
                (lower.includes('daviplata') && b.id === 'daviplata') ||
                (lower.includes('efectivo') && b.id === 'efectivo')
              );
              if (!alreadyIn) {
                builtMethods.push({ id: pm.id, accountId: pm.id, label: pm.name, type: pm.type });
              }
            });
          }

          builtMethods.push({ id: 'split', label: '⚡ Pago Dividido (Mixto)', type: 'split' });
          setActivePaymentMethods(builtMethods);

          const availableDigitals = digAccs.length > 0 ? digAccs : [
            { id: 'acc_nequi_main', name: 'Nequi / Bre-B' },
            { id: 'acc_daviplata_main', name: 'Daviplata' }
          ];
          setDigitalAccountsList(availableDigitals);
          if (availableDigitals.length > 0) {
            setSelectedDigitalAccountId(availableDigitals[0].id);
            setSplitDigitalMethod(availableDigitals[0].id);
          }

          const defaultFee = Number(fetchedLocs[0]?.delivery_fee) || Number(restaurantSettings?.delivery_fee) || 4000;
          setDeliveryFee(defaultFee);

          if (isValidUUID(locationId)) {
            setSelectedLocationId(locationId);
          } else if (fetchedLocs.length > 0) {
            const mainLoc = fetchedLocs.find(l => l.is_main) || fetchedLocs[0];
            setSelectedLocationId(mainLoc.id);
          } else {
            setSelectedLocationId(null);
          }
        }
      } catch (err) {
        console.error('Error fetching catalog for manual order:', err);
        toast.error('Error al cargar catálogo de productos');
      } finally {
        if (isMounted) setLoadingCatalog(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [isOpen, brandId, locationId]);

  // Canonical all products list
  const catalogProducts = useMemo(() => {
    let list = [];
    if (typeof getAllProducts === 'function') {
      try {
        list = getAllProducts();
      } catch (e) {
        console.warn('Error calling getAllProducts in ManualOrderModal:', e);
      }
    }
    if ((!list || list.length === 0) && productsByCategory && typeof productsByCategory === 'object') {
      list = Object.values(productsByCategory).flat();
    }
    if ((!list || list.length === 0) && products.length > 0) {
      list = products;
    }
    // Deduplicate by ID & strictly filter out legacy unconfigured dishes like Arroz con Pollo
    const map = new Map();
    (list || []).forEach(p => {
      if (p && p.id && !map.has(p.id)) {
        if (p.id === 'b0000b21-0000-4000-a000-000000000021' || /arroz con pollo/i.test(p.name || '')) {
          return;
        }
        map.set(p.id, p);
      }
    });
    return Array.from(map.values());
  }, [getAllProducts, productsByCategory, products]);

  // Categories derived canonically: Del Día first, then real public store categories
  const categories = useMemo(() => {
    const list = [
      {
        id: 'daily_specials',
        name: '⭐ Del Día / Almuerzos',
        slug: 'daily_specials'
      }
    ];

    if (Array.isArray(menuCategories) && menuCategories.length > 0) {
      menuCategories.forEach(cat => {
        if (!cat || cat.is_active === false) return;
        if (cat.slug === 'boku-bentos' || cat.id === 'b0000c01-0000-4000-a000-000000000001') {
          return;
        }
        list.push(cat);
      });
    } else {
      const map = new Map();
      catalogProducts.forEach(p => {
        const cat = p.categories;
        if (cat?.id && !map.has(cat.id)) {
          map.set(cat.id, cat);
        }
      });
      map.forEach(c => list.push(c));
    }
    return list;
  }, [menuCategories, catalogProducts]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return catalogProducts.filter(p => {
      let matchesCategory = true;
      if (selectedCategory === 'daily_specials' || selectedCategory === 'boku-bentos') {
        matchesCategory = Boolean(
          p.id === dailySpecialData.activeSpecialId ||
          (Array.isArray(dailySpecialData.activeSecondaryIds) && dailySpecialData.activeSecondaryIds.includes(p.id))
        );
      } else if (selectedCategory !== 'all') {
        const cat = categories.find(c => c.id === selectedCategory || c.slug === selectedCategory);
        matchesCategory = Boolean(
          p.category_id === selectedCategory ||
          p.categoryId === selectedCategory ||
          p.categorySlug === selectedCategory ||
          (cat && (p.category_id === cat.id || p.categoryId === cat.id || p.categorySlug === cat.slug))
        );
      }

      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.desc && p.desc.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    }).sort((a, b) => {
      const aScore = a.id === dailySpecialData.activeSpecialId ? 3 :
        ((dailySpecialData.activeSecondaryIds && dailySpecialData.activeSecondaryIds.includes(a.id)) ? 2 : 0);
      const bScore = b.id === dailySpecialData.activeSpecialId ? 3 :
        ((dailySpecialData.activeSecondaryIds && dailySpecialData.activeSecondaryIds.includes(b.id)) ? 2 : 0);
      return bScore - aScore;
    });
  }, [catalogProducts, selectedCategory, searchTerm, dailySpecialData, categories]);

  return {
    loadingCatalog,
    products,
    locationsList,
    selectedLocationId,
    setSelectedLocationId,
    selectedCategory,
    setSelectedCategory,
    searchTerm,
    setSearchTerm,
    deliveryFee,
    setDeliveryFee,
    dailySpecialData,
    activePaymentMethods,
    digitalAccountsList,
    selectedDigitalAccountId,
    setSelectedDigitalAccountId,
    splitDigitalMethod,
    setSplitDigitalMethod,
    catalogProducts,
    categories,
    filteredProducts,
    rawModifierGroups
  };
}
