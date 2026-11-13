import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { useMenuData } from '../../context/MenuDataContext';
import { Icon } from '@iconify-icon/react';
import { toast } from '../Toast';
import { formatCOP } from '../../utils/money';
import { printThermalDocument } from '../../utils/thermalPrint';
import { parseCustomerInfo } from '../../hooks/useCRM';
import { resolveOrCreateCustomer, syncCollectionToFinancials } from '../../utils/customerSync';
import { getInitialManualOrderStatus } from '../../utils/orderTiming';

const isValidUUID = (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export default function ManualOrderModal({
  isOpen,
  onClose,
  onOrderCreated,
  brandId: propBrandId,
  locationId,
  restaurantSettings: propRestaurantSettings
}) {
  const { activeBrand, profile } = useAuth();
  const brandId = propBrandId || activeBrand?.id || profile?.brand_id || localStorage.getItem('aa_active_brand_id');

  // Single Source of Truth: Menú oficial y canónico compartido con la tienda pública
  const menuData = useMenuData();
  const {
    categories: menuCategories = [],
    productsByCategory = {},
    getAllProducts,
    getModifiers,
    restaurantSettings: menuSettings,
    locations: menuLocations = [],
    rawModifierGroups = [],
    loading: menuDataLoading
  } = menuData || {};

  const restaurantSettings = propRestaurantSettings || menuSettings || {};

  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [products, setProducts] = useState([]);
  const [locationsList, setLocationsList] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState(() => isValidUUID(locationId) ? locationId : null);
  const [selectedCategory, setSelectedCategory] = useState('daily_specials');
  const [searchTerm, setSearchTerm] = useState('');

  // Cart of items being built: [{ product, qty, unitPrice, options, notes }]
  const [orderItems, setOrderItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active item configuration (when clicking a product with options)
  const [configuringProduct, setConfiguringProduct] = useState(null);
  const [selectedModifiers, setSelectedModifiers] = useState({});
  const [customDishPrice, setCustomDishPrice] = useState(null);
  const [isEditingPriceDirectly, setIsEditingPriceDirectly] = useState(false);
  const [itemKitchenNotes, setItemKitchenNotes] = useState('');
  const [editingItemIndex, setEditingItemIndex] = useState(null);

  // Customer & Delivery Info
  const [customerName, setCustomerName] = useState('Cliente WhatsApp');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(4000);
  const [orderNotes, setOrderNotes] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState('delivery');
  
  // Autocompletado inteligente de clientes desde CRM/pedidos previos
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  
  // Timing: immediate vs scheduled
  const [timingMode, setTimingMode] = useState('immediate'); // 'immediate' | 'scheduled'
  const [scheduledTime, setScheduledTime] = useState('');

  // Flow: send to kitchen vs already delivered
  const [entryFlow, setEntryFlow] = useState('kitchen'); // 'kitchen' | 'completed'

  // Payment
  const [isPaid, setIsPaid] = useState(false);
  const [pendingType, setPendingType] = useState('contra_entrega'); // 'contra_entrega' | 'fiado'
  const [paymentMethod, setPaymentMethod] = useState('nequi'); // 'nequi', 'efectivo', 'datafono'
  const [activePaymentMethods, setActivePaymentMethods] = useState([
    { id: 'nequi', label: 'Nequi / Bre-B' },
    { id: 'efectivo', label: 'Efectivo' },
    { id: 'datafono', label: 'Datáfono' }
  ]);
  const [cashTendered, setCashTendered] = useState('');
  const [printKitchenTicket, setPrintKitchenTicket] = useState(true);

  // Daily Special Dynamic Data
  const [dailySpecialData, setDailySpecialData] = useState({
    activeSpecialId: null,
    activeSecondaryIds: [],
    soupName: '🥣 Crema de plátano colicero (16 oz)',
    drinkName: '🥤 Jugo del Día (5 oz)',
    promoPrice: 19000,
    label: 'El Bento del Día'
  });

  // Split Payment (Pago Mixto)
  const [splitCashAmount, setSplitCashAmount] = useState('');
  const [splitDigitalAmount, setSplitDigitalAmount] = useState('');
  const [splitDigitalMethod, setSplitDigitalMethod] = useState('nequi');
  const [digitalAccountsList, setDigitalAccountsList] = useState([]);
  const [selectedDigitalAccountId, setSelectedDigitalAccountId] = useState('');

  // Fetch catalog of products and locations
  useEffect(() => {
    if (!isOpen || !brandId) return;

    let isMounted = true;
    const fetchData = async () => {
      setLoadingCatalog(true);
      try {
        const [prodsRes, locsRes, pmRes, rsRes, brandRes] = await Promise.all([
          supabase
            .from('products')
            .select('id, name, description, price, cost, image_url, category_id, is_active, requires_kitchen, subcategory, modifier_groups, config_options, categories:category_id(id, name, slug)')
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
          // Incluir productos activos en catálogo general Y platos expresamente seleccionados para hoy
          const rawProds = allFetched.filter(p => {
            if (p.is_active) return true;
            if (p.id === activeSpecialId || activeSecondaryIds.includes(p.id)) return true;
            return false;
          });

          setProducts(rawProds);
          const fetchedLocs = locsRes.data || [];
          setLocationsList(fetchedLocs);

          // Fuente única de verdad para cuentas y medios de pago:
          // Las cuentas financieras reales de la empresa viven en brands.config.financials.accounts
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

          // Si en payment_methods de base de datos hay otros métodos activos (ej. Datáfono), integrarlos
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
    setOrderItems([]);
    setCustomerName('Cliente WhatsApp');
    setCustomerPhone('');
    setDeliveryAddress('');
    setOrderNotes('');
    setTimingMode('immediate');
    setScheduledTime('');
    setIsPaid(false);
    setPaymentMethod('nequi');

    return () => { isMounted = false; };
  }, [isOpen, brandId, locationId]);

  // Live autocomplete: buscar clientes recurrentes por nombre
  useEffect(() => {
    const qName = customerName?.trim() || '';
    if (!qName || qName.length < 2 || qName === 'Cliente WhatsApp') {
      setCustomerSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingCustomer(true);
        const { data } = await supabase
          .from('orders')
          .select('customer_name, customer_phone, delivery_address, delivery_notes')
          .eq('brand_id', brandId)
          .ilike('customer_name', `%${qName}%`)
          .order('created_at', { ascending: false })
          .limit(10);

        if (data && data.length > 0) {
          const map = new Map();
          data.forEach(item => {
            const raw = (item.customer_phone || item.customer_name || '').toLowerCase().trim();
            if (raw && !map.has(raw)) {
              map.set(raw, item);
            }
          });
          setCustomerSuggestions(Array.from(map.values()));
        } else {
          setCustomerSuggestions([]);
        }
      } catch (err) {
        console.error('Error fetching customer suggestions:', err);
      } finally {
        setIsSearchingCustomer(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [customerName, brandId]);

  // Si escriben un número de teléfono, autocompletar nombre y dirección si ya existía
  useEffect(() => {
    const raw = (customerPhone || '').replace(/\D/g, '');
    if (raw.length < 7) return;

    const timer = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('orders')
          .select('customer_name, delivery_address, delivery_notes')
          .eq('brand_id', brandId)
          .ilike('customer_phone', `%${raw}%`)
          .order('created_at', { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          const prev = data[0];
          if (prev.customer_name && (!customerName || customerName === 'Cliente WhatsApp')) {
            setCustomerName(prev.customer_name);
          }
          if (prev.delivery_address && !deliveryAddress) {
            setDeliveryAddress(prev.delivery_address);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [customerPhone, customerName, deliveryAddress, brandId]);

  // Canonical all products list: single source of truth from MenuDataContext
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
        // Don't duplicate if it represents the bentos category already represented by 'daily_specials'
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
        // En Del Día / Almuerzos SOLO deben aparecer los platos específicamente configurados para hoy
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
      // Priorizar el plato del día y las opciones de hoy arriba
      const aScore = a.id === dailySpecialData.activeSpecialId ? 3 :
        ((dailySpecialData.activeSecondaryIds && dailySpecialData.activeSecondaryIds.includes(a.id)) ? 2 : 0);
      const bScore = b.id === dailySpecialData.activeSpecialId ? 3 :
        ((dailySpecialData.activeSecondaryIds && dailySpecialData.activeSecondaryIds.includes(b.id)) ? 2 : 0);
      return bScore - aScore;
    });
  }, [catalogProducts, selectedCategory, searchTerm, dailySpecialData, categories]);

  // Open product modifier configuration — 100% DINÁMICO DESDE BASE DE DATOS (CERO MODIFICADORES HARDCODEADOS O SUPUESTOS)
  const handleSelectProduct = (product) => {
    let rawGroups = product.modifierGroups || product.modifier_groups;
    if ((!rawGroups || rawGroups.length === 0) && typeof getModifiers === 'function') {
      try {
        rawGroups = getModifiers(product.id);
      } catch (e) {
        console.warn('Error fetching modifiers:', e);
      }
    }

    if (rawGroups && Array.isArray(rawGroups) && rawGroups.length > 0) {
      // Detectar qué grupos son hijos anidados (nested_group_id) dentro de este producto
      // para NO mostrarlos sueltos arriba como grupos independientes.
      const nestedChildGroupIds = new Set();
      rawGroups.forEach(g => {
        const gKey = typeof g === 'string' ? g : (g?.id || g?.name);
        const foundMeta = (rawModifierGroups || []).find(x => x.id === gKey || x.name === gKey);
        const opts = (typeof g === 'object' && Array.isArray(g.options)) ? g.options : (foundMeta?.options || foundMeta?.modifier_options || []);
        opts.forEach(o => {
          if (o?.nested_group_id) nestedChildGroupIds.add(o.nested_group_id);
        });
      });

      const normalizedGroups = rawGroups.map(g => {
        if (!g) return null;
        // Si ya es un objeto completo de grupo con opciones
        if (typeof g === 'object' && Array.isArray(g.options) && g.options.length > 0) {
          if (g.id && nestedChildGroupIds.has(g.id)) return null;
          return {
            name: g.name || 'Opciones',
            min: g.min_select !== undefined ? g.min_select : (g.min || 0),
            max: g.max_select !== undefined ? g.max_select : (g.max || 1),
            included_count: g.included_count !== undefined && g.included_count !== null ? g.included_count : null,
            options: g.options.map(opt => ({
              id: opt.id || opt.name,
              name: opt.name,
              extra: opt.extra !== undefined ? opt.extra : (opt.extra_price !== undefined ? opt.extra_price : (opt.price || 0)),
              is_default: Boolean(opt.is_default)
            }))
          };
        }
        // Si es UUID o nombre de grupo: usar EXCLUSIVAMENTE la definición real en rawModifierGroups de la base de datos
        const gKey = typeof g === 'string' ? g : (g.id || g.name);
        if (nestedChildGroupIds.has(gKey)) return null;
        const foundMeta = (rawModifierGroups || []).find(x => x.id === gKey || x.name === gKey);
        if (foundMeta && (nestedChildGroupIds.has(foundMeta.id) || foundMeta.is_submodifier)) return null;
        const opts = foundMeta?.options || foundMeta?.modifier_options || [];
        if (opts.length > 0) {
          return {
            name: foundMeta.name || 'Opciones',
            min: foundMeta.min_select || 0,
            max: foundMeta.max_select || 1,
            included_count: foundMeta.included_count !== undefined && foundMeta.included_count !== null ? foundMeta.included_count : null,
            options: opts.map(o => ({
              id: o.id || o.name,
              name: o.name,
              extra: o.price || o.extra_price || 0,
              is_default: Boolean(o.is_default)
            }))
          };
        }
        return null;
      }).filter(Boolean);

      if (normalizedGroups.length > 0) {
        const initialModifiers = {};
        normalizedGroups.forEach(g => {
          const defaultOpts = g.options.filter(o => o.is_default).map(o => o.name);
          if (defaultOpts.length > 0) {
            initialModifiers[g.name] = defaultOpts.slice(0, g.max);
          } else if (g.min > 0 && g.options.length > 0) {
            initialModifiers[g.name] = [g.options[0].name];
          } else {
            initialModifiers[g.name] = [];
          }
        });

        setConfiguringProduct({
          product,
          groups: normalizedGroups
        });
        setSelectedModifiers(initialModifiers);
        setCustomDishPrice(null);
        setIsEditingPriceDirectly(false);
        setItemKitchenNotes('');
        setEditingItemIndex(null);
        return;
      }
    }

    // Si el producto no tiene grupos de modificadores configurados en el Admin, se agrega directo sin inventar nada
    addSimpleProductToCart(product);
  };

  const addSimpleProductToCart = (product) => {
    setOrderItems(prev => {
      const existing = prev.find(item => item.product.id === product.id && Object.keys(item.options || {}).length === 0);
      if (existing) {
        return prev.map(item => item === existing ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, {
        product,
        qty: 1,
        unitPrice: Number(product.price) || 0,
        options: {},
        notes: ''
      }];
    });
    toast.success(`${product.name} agregado`);
  };

  const handleConfirmConfiguredProduct = () => {
    if (!configuringProduct) return;
    const { product, groups } = configuringProduct;

    // Calculate extra modifier price (e.g. 2nd protein = $7.000)
    let extra = 0;
    groups.forEach(g => {
      const selected = selectedModifiers[g.name] || [];
      if (g.included_count !== undefined && g.included_count !== null) {
        selected.forEach((optName, idx) => {
          if (idx >= g.included_count) {
            const optObj = g.options.find(o => o.name === optName);
            extra += (optObj?.extra || 0);
          }
        });
      } else {
        selected.forEach(optName => {
          const optObj = g.options.find(o => o.name === optName);
          extra += (optObj?.extra || 0);
        });
      }
    });

    const unitPrice = customDishPrice !== null && customDishPrice !== undefined && customDishPrice !== ''
      ? Math.max(0, Number(customDishPrice))
      : ((Number(product.price) || 0) + extra);

    // Flatten options for comanda
    const formattedOptions = {};
    Object.entries(selectedModifiers).forEach(([gName, arr]) => {
      if (arr && arr.length > 0) {
        formattedOptions[gName] = arr.length === 1 ? arr[0] : arr;
      }
    });

    setOrderItems(prev => {
      const newItem = {
        product,
        qty: editingItemIndex !== null && prev[editingItemIndex] ? prev[editingItemIndex].qty : 1,
        unitPrice,
        options: formattedOptions,
        notes: itemKitchenNotes.trim()
      };
      if (editingItemIndex !== null) {
        return prev.map((it, i) => i === editingItemIndex ? newItem : it);
      }
      return [...prev, newItem];
    });

    setConfiguringProduct(null);
    setSelectedModifiers({});
    setCustomDishPrice(null);
    setIsEditingPriceDirectly(false);
    setItemKitchenNotes('');
    setEditingItemIndex(null);
    toast.success(`${product.name} ${editingItemIndex !== null ? 'actualizado' : 'agregado al pedido'}`);
  };

  const modalDishLivePrice = useMemo(() => {
    if (!configuringProduct) return 0;
    if (customDishPrice !== null && customDishPrice !== undefined && customDishPrice !== '') {
      return Math.max(0, Number(customDishPrice));
    }
    const base = Number(configuringProduct.product.price) || 0;
    let extra = 0;
    configuringProduct.groups.forEach(g => {
      const selected = selectedModifiers[g.name] || [];
      if (g.included_count !== undefined && g.included_count !== null) {
        selected.forEach((optName, idx) => {
          if (idx >= g.included_count) {
            const optObj = g.options.find(o => o.name === optName);
            extra += (optObj?.extra || 0);
          }
        });
      } else {
        selected.forEach(optName => {
          const optObj = g.options.find(o => o.name === optName);
          extra += (optObj?.extra || 0);
        });
      }
    });
    return base + extra;
  }, [configuringProduct, selectedModifiers, customDishPrice]);

  const handleEditItem = (index) => {
    const item = orderItems[index];
    if (!item) return;

    handleSelectProduct(item.product);
    const prefill = {};
    Object.entries(item.options || {}).forEach(([k, v]) => {
      prefill[k] = Array.isArray(v) ? v : [v];
    });
    setSelectedModifiers(prefill);
    setCustomDishPrice(item.unitPrice !== undefined ? item.unitPrice : null);
    setIsEditingPriceDirectly(false);
    setItemKitchenNotes(item.notes || '');
    setEditingItemIndex(index);
  };

  const handleRemoveItem = (index) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItemQty = (index, delta) => {
    setOrderItems(prev => {
      return prev.map((it, i) => {
        if (i !== index) return it;
        const newQty = it.qty + delta;
        return newQty > 0 ? { ...it, qty: newQty } : null;
      }).filter(Boolean);
    });
  };

  // Grand total calculation
  const itemsSubtotal = useMemo(() => {
    return orderItems.reduce((acc, it) => acc + (it.unitPrice * it.qty), 0);
  }, [orderItems]);

  const activeDeliveryFee = fulfillmentType === 'delivery' ? Number(deliveryFee || 0) : 0;
  const grandTotal = itemsSubtotal + activeDeliveryFee;

  // Submit and create order
  const handleCreateOrder = async () => {
    if (orderItems.length === 0) {
      toast.error('Agrega al menos un plato o producto al pedido.');
      return;
    }
    if (timingMode === 'scheduled' && !scheduledTime) {
      toast.error('Por favor selecciona la fecha y hora programada.');
      return;
    }

    setIsSubmitting(true);
    try {
      let parsedScheduledTime = null;
      if (timingMode === 'scheduled' && scheduledTime) {
        try {
          parsedScheduledTime = new Date(scheduledTime).toISOString();
        } catch (e) {
          parsedScheduledTime = scheduledTime;
        }
      }

      const effectiveLocationId = isValidUUID(selectedLocationId)
        ? selectedLocationId
        : (isValidUUID(locationId) ? locationId : (locationsList.find(l => l.is_main)?.id || locationsList[0]?.id || null));

      const isAlreadyDelivered = entryFlow === 'completed';

      let finalPaymentMethod = paymentMethod;
      let finalDeliveryNotes = orderNotes.trim();

      const tenderNum = Number(String(cashTendered).replace(/\D/g, '')) || 0;

      if (!isPaid) {
        if (pendingType === 'fiado') {
          finalPaymentMethod = 'fiado';
        } else {
          finalPaymentMethod = 'contra_entrega';
        }
      } else {
        if (paymentMethod === 'split') {
          const cashVal = Number(String(splitCashAmount).replace(/\D/g, '')) || 0;
          const digVal = Number(String(splitDigitalAmount).replace(/\D/g, '')) || 0;
          const selDig = digitalAccountsList.find(d => d.id === selectedDigitalAccountId || d.id === splitDigitalMethod) || digitalAccountsList[0];
          const digLabel = selDig?.name || 'Billetera Digital';
          finalPaymentMethod = `Pago Dividido (Efectivo: ${formatCOP(cashVal)} + ${digLabel}: ${formatCOP(digVal)})`;
          const splitNote = `[⚡ Pago Mixto: ${formatCOP(cashVal)} Efectivo + ${formatCOP(digVal)} ${digLabel}]`;
          finalDeliveryNotes = finalDeliveryNotes ? `${finalDeliveryNotes}\n${splitNote}` : splitNote;
        } else if (paymentMethod === 'efectivo') {
          if (tenderNum > 0) {
            if (tenderNum === grandTotal) {
              finalPaymentMethod = 'Efectivo (Exacto)';
            } else if (tenderNum > grandTotal) {
              const change = tenderNum - grandTotal;
              finalPaymentMethod = `Efectivo (Paga: ${formatCOP(tenderNum)} | Vueltas: ${formatCOP(change)})`;
              const cashNote = `[💵 Paga en efectivo con ${formatCOP(tenderNum)} - Llevar ${formatCOP(change)} de vueltas]`;
              finalDeliveryNotes = finalDeliveryNotes ? `${finalDeliveryNotes}\n${cashNote}` : cashNote;
            } else {
              finalPaymentMethod = `Efectivo (Abono: ${formatCOP(tenderNum)})`;
            }
          } else {
            finalPaymentMethod = 'efectivo';
          }
        }
      }

      const finalPaymentStatus = isPaid ? 'paid' : 'pending';
      const finalPaymentMethodResolved = isPaid ? finalPaymentMethod : (pendingType === 'fiado' ? 'fiado' : 'contra_entrega');

      // Vincular o crear el cliente en public.customers para integridad relacional estricta
      const resolvedCustomerId = await resolveOrCreateCustomer({
        brandId,
        phone: customerPhone.trim(),
        name: customerName.trim(),
        address: fulfillmentType === 'delivery' ? deliveryAddress.trim() : '',
        notes: finalDeliveryNotes
      });

      const orderPayload = {
        brand_id: brandId,
        location_id: effectiveLocationId,
        customer_id: resolvedCustomerId,
        status: getInitialManualOrderStatus({ completed: isAlreadyDelivered, scheduledTime: parsedScheduledTime }),
        kitchen_status: isAlreadyDelivered ? 'ready' : 'pending',
        bar_status: isAlreadyDelivered ? 'ready' : 'pending',
        delivered_at: isAlreadyDelivered ? new Date().toISOString() : null,
        origin: 'whatsapp',
        fulfillment_type: fulfillmentType,
        customer_name: customerName.trim() || 'Cliente Mostrador / WhatsApp',
        customer_phone: customerPhone.trim() || null,
        delivery_address: fulfillmentType === 'delivery' ? (deliveryAddress.trim() || null) : null,
        delivery_notes: finalDeliveryNotes || null,
        delivery_fee: activeDeliveryFee,
        scheduled_time: parsedScheduledTime,
        total_amount: grandTotal,
        paid_amount: isPaid ? grandTotal : 0,
        payment_status: finalPaymentStatus,
        payment_method: finalPaymentMethodResolved
      };

      const { data: createdOrder, error: orderErr } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select()
        .single();

      if (orderErr) throw orderErr;

      // Si el pedido ya fue pagado al crearse, sincronizar ingreso al bolsillo correspondiente en Finanzas
      if (isPaid && grandTotal > 0) {
        if (paymentMethod === 'split') {
          const cashVal = Number(String(splitCashAmount).replace(/\D/g, '')) || 0;
          const digVal = Number(String(splitDigitalAmount).replace(/\D/g, '')) || 0;
          const selDig = digitalAccountsList.find(d => d.id === selectedDigitalAccountId || d.id === splitDigitalMethod) || digitalAccountsList[0];
          const digLabel = selDig?.name || 'Billetera Digital';
          syncCollectionToFinancials({
            brandId,
            customerName: customerName.trim() || 'Cliente WhatsApp',
            amount: grandTotal,
            paymentMethod: 'Pago Dividido',
            splitPayments: [
              { method: 'efectivo', accountId: 'acc_cash_main', amount: cashVal },
              { method: digLabel, accountId: selDig?.id || 'acc_nequi_main', amount: digVal }
            ],
            isHistorical: false,
            notes: `Venta directa #${String(createdOrder.id).slice(0, 4).toUpperCase()}`
          });
        } else {
          syncCollectionToFinancials({
            brandId,
            customerName: customerName.trim() || 'Cliente WhatsApp',
            amount: grandTotal,
            paymentMethod: finalPaymentMethodResolved,
            isHistorical: false,
            notes: `Venta directa #${String(createdOrder.id).slice(0, 4).toUpperCase()}`
          });
        }
      }

      // Insert order items
      const itemsPayload = orderItems.map(it => ({
        order_id: createdOrder.id,
        product_id: it.product.id,
        brand_id: brandId,
        quantity: it.qty,
        unit_price: it.unitPrice,
        modifiers: {
          _item_name: it.product.name,
          ...(it.options || {})
        },
        notes: it.notes || ''
      }));

      const { error: itemsErr } = await supabase
        .from('order_items')
        .insert(itemsPayload);

      if (itemsErr) throw itemsErr;

      // Print kitchen thermal ticket if enabled (only for new active orders)
      if (!isAlreadyDelivered && printKitchenTicket) {
        try {
          const thermalPayload = {
            order: createdOrder,
            order_items: itemsPayload.map(i => ({
              ...i,
              products: { name: i.modifiers?._item_name || 'Plato' }
            })),
            restaurant_settings: restaurantSettings
          };
          printThermalDocument(thermalPayload, 'kitchen');
        } catch (printErr) {
          console.warn('Could not print thermal ticket automatically:', printErr);
        }
      }

      if (isAlreadyDelivered) {
        toast.success(`¡Pedido #${createdOrder.order_number || createdOrder.id.slice(0, 5)} registrado en ventas e inventario!`);
      } else {
        toast.success(`¡Pedido #${createdOrder.order_number || createdOrder.id.slice(0, 5)} creado y enviado a cocina!`);
      }
      if (onOrderCreated) onOrderCreated();
      onClose();
    } catch (err) {
      console.error('Error creating manual order:', err);
      toast.error('Error al crear pedido: ' + (err.message || 'Error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-neutral-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-neutral-800">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-neutral-950 flex items-center justify-center font-bold text-lg shadow-md shadow-amber-500/20">
              <Icon icon="heroicons:bolt" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">Nuevo Pedido Rápido</h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-neutral-950 px-2 py-0.5 rounded-full">
                  POS / WhatsApp
                </span>
              </div>
              <p className="text-xs text-neutral-400">Registra pedidos de mostrador o WhatsApp en 15 segundos</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-neutral-800 p-1 rounded-xl text-xs font-bold gap-1 border border-neutral-700">
              <button
                type="button"
                onClick={() => {
                  setEntryFlow('kitchen');
                  setPrintKitchenTicket(true);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  entryFlow === 'kitchen'
                    ? 'bg-amber-400 text-neutral-950 font-black shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Icon icon="heroicons:fire" />
                <span>Mandar a Cocina</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEntryFlow('completed');
                  setPrintKitchenTicket(false);
                  setIsPaid(true);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  entryFlow === 'completed'
                    ? 'bg-emerald-500 text-white font-black shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Para pedidos que ya despachaste o entregaste. Suma a ventas de hoy y descuenta insumos de inventario sin sonar en cocina."
              >
                <Icon icon="heroicons:check-badge" />
                <span>Ya Entregado (Histórico)</span>
              </button>
            </div>
            
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
            >
              <Icon icon="heroicons:x-mark" className="text-xl" />
            </button>
          </div>
        </div>

        {/* Content Body: Two columns (Left: Catalog & Selector, Right: Customer & Order Summary) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200">
          
          {/* Left Column: Products Selector (7 cols) */}
          <div className="lg:col-span-7 p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto max-h-[75vh]">
            
            {/* Search and Category Tabs */}
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Icon icon="heroicons:magnifying-glass" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-base" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar plato o bebida..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 text-xs font-semibold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-neutral-50"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  Todos
                </button>
                {categories.map(c => (
                  <button
                    key={c.id || c.slug}
                    type="button"
                    onClick={() => setSelectedCategory(c.id || c.slug)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                      selectedCategory === (c.id || c.slug) || (c.id === 'daily_specials' && selectedCategory === 'daily_specials')
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Special Banner Header */}
            <div className="mb-3 p-3 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-start gap-2.5">
                <span className="text-xl shrink-0">🍱</span>
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-neutral-950 px-1.5 py-0.5 rounded-md">
                      Almuerzo Estrella de Hoy
                    </span>
                    <span className="text-xs font-black text-neutral-900">
                      {catalogProducts.find(p => p.id === dailySpecialData.activeSpecialId)?.name?.replace(/\s*\(Especial del Día\)/i, '') || 'Poke Tori Katsu'} ({formatCOP(catalogProducts.find(p => p.id === dailySpecialData.activeSpecialId)?.price || dailySpecialData.promoPrice || 22000)})
                    </span>
                    {dailySpecialData.activeSecondaryIds && dailySpecialData.activeSecondaryIds.length > 0 && (
                      <>
                        <span className="text-neutral-300">•</span>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-1.5 py-0.5 rounded-md">
                          Opción del Día
                        </span>
                        <span className="text-xs font-bold text-neutral-800">
                          {catalogProducts.find(p => dailySpecialData.activeSecondaryIds.includes(p.id))?.name?.replace(/\s*\(Especial del Día\)/i, '') || 'Salmón Fresh'} ({formatCOP(catalogProducts.find(p => dailySpecialData.activeSecondaryIds.includes(p.id))?.price || 22000)})
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-600">
                    Entrada: <strong>{dailySpecialData.soupName}</strong> • Bebida: <strong>{dailySpecialData.drinkName}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCategory('daily_specials')}
                className="text-xs font-black px-3 py-1.5 rounded-xl bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-all shadow-xs shrink-0 cursor-pointer self-start sm:self-auto"
              >
                Ver del Día ⭐
              </button>
            </div>

            {/* Products Grid */}
            {loadingCatalog ? (
              <div className="py-12 flex flex-col items-center justify-center text-neutral-400 gap-2">
                <Icon icon="heroicons:arrow-path" className="text-2xl animate-spin" />
                <p className="text-xs">Cargando catálogo...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-12 text-center text-neutral-400 text-xs">
                No se encontraron productos disponibles.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5">
                {filteredProducts.map(p => {
                  const isPrimarySpecial = p.id === dailySpecialData.activeSpecialId;
                  const isSecondarySpecial = dailySpecialData.activeSecondaryIds && dailySpecialData.activeSecondaryIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProduct(p)}
                      className="flex flex-col p-3 rounded-2xl border border-neutral-200 bg-white hover:border-amber-500/80 hover:shadow-md transition-all text-left group cursor-pointer relative overflow-hidden"
                    >
                      {isPrimarySpecial ? (
                        <span className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-wider bg-amber-500 text-neutral-950 px-1.5 py-0.5 rounded-md shadow-2xs">
                          ⭐ Plato del Día
                        </span>
                      ) : isSecondarySpecial ? (
                        <span className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white px-1.5 py-0.5 rounded-md shadow-2xs">
                          🔥 Poke Premium
                        </span>
                      ) : null}
                      <p className="font-bold text-xs text-neutral-900 group-hover:text-amber-800 line-clamp-1 pr-8">
                        {p.name.replace(/\s*\(Especial del Día\)/i, '')}
                      </p>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 mt-0.5 leading-tight">
                        {p.description || p.desc || p.subcategory || 'Plato BOKU'}
                      </p>
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-neutral-100">
                        <span className="text-xs font-black text-neutral-900">
                          {formatCOP(p.price || 0)}
                        </span>
                        <span className="w-6 h-6 rounded-lg bg-neutral-100 group-hover:bg-amber-500 group-hover:text-neutral-950 flex items-center justify-center text-xs font-bold transition-all">
                          +
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Customer Details, Timing, Items Summary (5 cols) */}
          <div className="lg:col-span-5 p-4 sm:p-6 flex flex-col justify-between bg-neutral-50/50 overflow-y-auto max-h-[75vh]">
            <div className="space-y-4">
              
              {/* Flow Explanation Banner if completed */}
              {entryFlow === 'completed' && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
                  <Icon icon="heroicons:check-circle" className="text-base text-emerald-600 shrink-0" />
                  <span><strong>Modo Histórico:</strong> Este pedido ya fue entregado. Se sumará a las ventas de hoy y descontará los ingredientes del inventario sin sonar la alarma en cocina.</span>
                </div>
              )}

              {/* Customer Info Box */}
              <div className="p-3.5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                    <Icon icon="heroicons:user" className="text-amber-600" />
                    Datos del Cliente
                  </span>
                  <div className="flex gap-1">
                    {['delivery', 'takeaway'].map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setFulfillmentType(mode)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                          fulfillmentType === mode
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                        }`}
                      >
                        {mode === 'delivery' ? '🛵 Domicilio' : '🛍️ Recoger'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative space-y-1.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={customerName}
                        onChange={e => {
                          setCustomerName(e.target.value);
                          setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder="Nombre (ej: Manuela Vega)"
                        className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-medium bg-neutral-50 focus:bg-white focus:border-[#2f4131] outline-none"
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        placeholder="WhatsApp (ej: 312...)"
                        className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-medium bg-neutral-50 focus:bg-white focus:border-[#2f4131] outline-none"
                      />
                    </div>
                  </div>

                  {/* Dropdown de sugerencias de clientes recurrentes del CRM */}
                  {showSuggestions && customerSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-neutral-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-neutral-100 max-h-48 overflow-y-auto">
                      <div className="px-3 py-1.5 bg-neutral-50 text-[10px] font-black text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Clientes recurrentes encontrados</span>
                        <button 
                          type="button" 
                          onClick={() => setShowSuggestions(false)}
                          className="text-neutral-400 hover:text-neutral-600 text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                      {customerSuggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            const parsed = parseCustomerInfo(sug.customer_name, sug.delivery_address, sug.delivery_notes);
                            setCustomerName(parsed.cleanName || sug.customer_name || customerName);
                            if (sug.customer_phone) setCustomerPhone(sug.customer_phone);
                            if (parsed.address || sug.delivery_address) setDeliveryAddress(parsed.address || sug.delivery_address);
                            if (parsed.notes && !orderNotes) setOrderNotes(parsed.notes);
                            setShowSuggestions(false);
                            toast.success(`Cliente cargado: ${parsed.cleanName || sug.customer_name}`);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-emerald-50/60 transition-colors flex items-center justify-between gap-2 group cursor-pointer"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-800 truncate">
                              {sug.customer_name}
                            </p>
                            <p className="text-[10px] text-gray-400 flex items-center gap-1.5 truncate">
                              {sug.customer_phone && <span>📱 {sug.customer_phone}</span>}
                              {sug.delivery_address && <span>📍 {sug.delivery_address}</span>}
                            </p>
                          </div>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 shrink-0">
                            Cargar
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Tip informativo de CRM para el operador */}
                  {customerName && customerName !== 'Cliente WhatsApp' && !customerPhone && (
                    <p className="text-[10px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/60 flex items-center gap-1.5">
                      <Icon icon="solar:info-circle-bold" className="shrink-0 text-amber-600 text-xs" />
                      <span>💡 Agrega el WhatsApp para vincular a {customerName} con su historial de compras en el CRM.</span>
                    </p>
                  )}
                </div>

                {fulfillmentType === 'delivery' && (
                  <div className="space-y-1.5 pt-0.5">
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={e => setDeliveryAddress(e.target.value)}
                      placeholder="Dirección de entrega (ej: Cra 7 #3-15 Apto 402)"
                      className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-medium bg-neutral-50 focus:bg-white"
                    />
                    <div className="flex items-center justify-between gap-2 bg-neutral-50 px-2.5 py-1.5 rounded-xl border border-neutral-200">
                      <span className="text-[11px] font-bold text-neutral-600 flex items-center gap-1 shrink-0">
                        <Icon icon="heroicons:truck" className="text-emerald-600" />
                        Valor Domicilio:
                      </span>
                      <div className="flex items-center gap-1">
                        {[0, 3000, 4000, 5000].map(feeOpt => (
                          <button
                            key={feeOpt}
                            type="button"
                            onClick={() => setDeliveryFee(feeOpt)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-black border transition-all ${
                              deliveryFee === feeOpt
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                            }`}
                          >
                            {feeOpt === 0 ? 'Gratis' : `$${(feeOpt/1000).toFixed(0)}k`}
                          </button>
                        ))}
                        <div className="relative w-20">
                          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-400">$</span>
                          <input
                            type="number"
                            step="500"
                            min="0"
                            value={deliveryFee}
                            onChange={e => setDeliveryFee(Math.max(0, Number(e.target.value) || 0))}
                            className="w-full pl-4 pr-1 py-0.5 text-right font-black text-xs rounded-lg border border-neutral-200 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Timing Box: Immediate vs Scheduled */}
              <div className="p-3.5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-2.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                  <Icon icon="heroicons:clock" className="text-amber-600" />
                  Momento de Preparación / Entrega
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTimingMode('immediate');
                      setScheduledTime('');
                    }}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      timingMode === 'immediate'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-500'
                    }`}
                  >
                    <Icon icon="heroicons:bolt" className="text-emerald-600" />
                    <span>Lo antes posible</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTimingMode('scheduled');
                      if (!scheduledTime) {
                        const todayDate = new Date().toISOString().slice(0, 10);
                        setScheduledTime(`${todayDate}T12:30`);
                      }
                    }}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      timingMode === 'scheduled'
                        ? 'bg-sky-50 border-sky-300 text-sky-900 shadow-xs'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-500'
                    }`}
                  >
                    <Icon icon="heroicons:calendar" className="text-sky-600" />
                    <span>Programar hora</span>
                  </button>
                </div>

                {timingMode === 'scheduled' && (
                  <div className="space-y-2 pt-1 animate-in fade-in">
                    <div className="grid grid-cols-4 gap-1">
                      {['12:30', '13:00', '13:30', '14:00'].map(t => {
                        const todayDate = new Date().toISOString().slice(0, 10);
                        const iso = `${todayDate}T${t}`;
                        const isSel = scheduledTime === iso;
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setScheduledTime(iso)}
                            className={`py-1 rounded-lg text-[11px] font-bold border transition-all ${
                              isSel
                                ? 'bg-sky-700 text-white border-sky-700 shadow-xs'
                                : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                            }`}
                          >
                            {t === '12:30' ? '12:30 PM' : t === '13:00' ? '1:00 PM' : t === '13:30' ? '1:30 PM' : '2:00 PM'}
                          </button>
                        );
                      })}
                    </div>
                    <input
                      type="datetime-local"
                      value={scheduledTime}
                      onChange={e => setScheduledTime(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-lg border border-neutral-200 text-xs bg-neutral-50"
                    />
                  </div>
                )}
              </div>

              {/* Items in Cart */}
              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-neutral-500 flex items-center justify-between">
                  <span>Platos en este pedido ({orderItems.length})</span>
                  {orderItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setOrderItems([])}
                      className="text-[10px] text-red-500 hover:underline font-bold"
                    >
                      Vaciar
                    </button>
                  )}
                </span>

                {orderItems.length === 0 ? (
                  <div className="p-6 rounded-2xl border-2 border-dashed border-neutral-200 text-center text-neutral-400 text-xs">
                    Toca cualquier plato a la izquierda para agregarlo.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[22vh] overflow-y-auto pr-1">
                    {orderItems.map((item, idx) => (
                      <div key={idx} className="p-2.5 bg-white rounded-xl border border-neutral-200 flex items-start justify-between gap-2 shadow-xs">
                        <div className="flex-1">
                          <p className="text-xs font-bold text-neutral-900 leading-snug">
                            {item.product.name.replace(/\s*\(Especial del Día\)/i, '')}
                          </p>
                          {/* Modifiers List */}
                          {Object.entries(item.options || {}).length > 0 && (
                            <div className="mt-0.5 space-y-0.5 text-[10px] text-neutral-500">
                              {Object.entries(item.options).map(([k, v]) => (
                                <p key={k}>
                                  <span className="text-neutral-400">{k}:</span> <strong className="text-neutral-700">{Array.isArray(v) ? v.join(', ') : v}</strong>
                                </p>
                              ))}
                            </div>
                          )}
                          {item.notes && (
                            <p className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md mt-1 border border-amber-200/50">
                              📝 {item.notes}
                            </p>
                          )}
                          <p className="text-xs font-black text-amber-700 mt-1">
                            {formatCOP(item.unitPrice * item.qty)}
                          </p>
                        </div>

                        {/* Qty Controls & Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQty(idx, -1)}
                            className="w-6 h-6 rounded-md bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-xs font-bold"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQty(idx, 1)}
                            className="w-6 h-6 rounded-md bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-xs font-bold"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditItem(idx)}
                            className="w-6 h-6 rounded-md text-amber-700 hover:bg-amber-50 flex items-center justify-center ml-0.5"
                            title="Editar modificadores"
                          >
                            <Icon icon="heroicons:pencil-square" className="text-sm" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="w-6 h-6 rounded-md text-red-500 hover:bg-red-50 flex items-center justify-center ml-0.5"
                          >
                            <Icon icon="heroicons:trash" className="text-sm" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Status and Method */}
              <div className="p-3 bg-white rounded-2xl border border-neutral-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-neutral-500">
                    Estado del Pago
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setIsPaid(true)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                        isPaid
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      ✓ Ya Pagado
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPaid(false)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                        !isPaid
                          ? 'bg-amber-500 text-neutral-950 border-amber-500 shadow-xs font-black'
                          : 'bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      Por Cobrar
                    </button>
                  </div>
                </div>

                {isPaid ? (
                  <div className="space-y-2.5 pt-1 border-t border-neutral-100 animate-in fade-in">
                    <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                      {activePaymentMethods.map(pm => (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setPaymentMethod(pm.id)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border shrink-0 transition-all ${
                            paymentMethod === pm.id
                              ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                              : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                          }`}
                        >
                          {pm.label}
                        </button>
                      ))}
                    </div>

                    {/* Calculadora de Vueltas / Cambio en Efectivo */}
                    {paymentMethod === 'efectivo' && (
                      <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-xs font-bold text-neutral-700 shrink-0">
                            Paga con efectivo:
                          </label>
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">$</span>
                            <input
                              type="text"
                              value={cashTendered}
                              onChange={e => {
                                const val = e.target.value.replace(/\D/g, '');
                                setCashTendered(val ? Number(val).toLocaleString('es-CO') : '');
                              }}
                              placeholder={grandTotal.toLocaleString('es-CO')}
                              className="w-full pl-7 pr-3 py-1.5 text-xs font-black rounded-xl border border-neutral-300 bg-white text-right focus:ring-2 focus:ring-[#2f4131]/20 focus:border-[#2f4131]"
                            />
                          </div>
                        </div>

                        {/* Chips rápidos de denominación colombiana */}
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => setCashTendered(grandTotal.toLocaleString('es-CO'))}
                            className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                          >
                            Exacto ({formatCOP(grandTotal)})
                          </button>
                          {grandTotal <= 20000 && (
                            <button
                              type="button"
                              onClick={() => setCashTendered((20000).toLocaleString('es-CO'))}
                              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                            >
                              $ 20.000
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setCashTendered((50000).toLocaleString('es-CO'))}
                            className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                          >
                            $ 50.000
                          </button>
                          <button
                            type="button"
                            onClick={() => setCashTendered((100000).toLocaleString('es-CO'))}
                            className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                          >
                            $ 100.000
                          </button>
                        </div>

                        {/* Cálculo instantáneo de vueltas */}
                        {(() => {
                          const tenderNum = Number(String(cashTendered).replace(/\D/g, '')) || 0;
                          if (tenderNum >= grandTotal && grandTotal > 0) {
                            const change = tenderNum - grandTotal;
                            return (
                              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-950">
                                <span className="text-xs font-bold flex items-center gap-1.5">
                                  <Icon icon="heroicons:banknotes" className="text-base text-emerald-700" />
                                  Cambio / Vueltas a entregar:
                                </span>
                                <span className="text-sm font-black text-emerald-800">{formatCOP(change)}</span>
                              </div>
                            );
                          } else if (tenderNum > 0 && tenderNum < grandTotal) {
                            return (
                              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-950">
                                <span className="text-xs font-bold flex items-center gap-1.5">
                                  <Icon icon="heroicons:exclamation-circle" className="text-base text-amber-700" />
                                  Falta por pagar:
                                </span>
                                <span className="text-sm font-black text-amber-800">{formatCOP(grandTotal - tenderNum)}</span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}

                    {/* ─── PAGO MIXTO / DIVIDIDO (Efectivo + Nequi/Transferencia) ─── */}
                    {paymentMethod === 'split' && (
                      <div className="p-3.5 bg-gradient-to-br from-amber-50/70 via-purple-50/40 to-neutral-50 rounded-2xl border border-purple-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">⚡</span>
                            <span className="text-xs font-black text-neutral-900 uppercase tracking-tight">
                              Pago Dividido (Mixto)
                            </span>
                          </div>
                          <span className="text-xs font-black text-neutral-900 bg-white px-2 py-0.5 rounded-lg border border-neutral-200 shadow-2xs">
                            Total: {formatCOP(grandTotal)}
                          </span>
                        </div>

                        {/* Inputs de Efectivo y Nequi con balance automático */}
                        <div className="grid grid-cols-2 gap-2">
                          {/* Parte 1: Efectivo */}
                          <div className="bg-white p-2.5 rounded-xl border border-neutral-200 shadow-2xs space-y-1">
                            <label className="text-[10px] font-black uppercase text-neutral-600 tracking-wider flex items-center gap-1">
                              <span>💵 Efectivo</span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">$</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={splitCashAmount}
                                onChange={e => {
                                  const num = Number(e.target.value.replace(/\D/g, '') || 0);
                                  setSplitCashAmount(e.target.value ? num.toLocaleString('es-CO') : '');
                                  const remaining = Math.max(0, grandTotal - num);
                                  setSplitDigitalAmount(remaining > 0 ? remaining.toLocaleString('es-CO') : '0');
                                }}
                                placeholder="0"
                                className="w-full pl-6 pr-2 py-1.5 text-xs font-black text-neutral-900 rounded-lg border border-neutral-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                          </div>

                          {/* Parte 2: Billetera Digital Real */}
                          <div className="bg-white p-2.5 rounded-xl border border-neutral-200 shadow-2xs space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black uppercase text-purple-700 tracking-wider flex items-center gap-1">
                                <span>🟣 Billetera Digital</span>
                              </label>
                              <select
                                value={selectedDigitalAccountId}
                                onChange={e => {
                                  setSelectedDigitalAccountId(e.target.value);
                                  setSplitDigitalMethod(e.target.value);
                                }}
                                className="text-[10px] font-bold bg-neutral-100 border border-neutral-200 rounded px-1.5 py-0.5 text-neutral-800 focus:outline-hidden"
                              >
                                {digitalAccountsList.map(da => (
                                  <option key={da.id} value={da.id}>{da.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">$</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={splitDigitalAmount}
                                onChange={e => {
                                  const num = Number(e.target.value.replace(/\D/g, '') || 0);
                                  setSplitDigitalAmount(e.target.value ? num.toLocaleString('es-CO') : '');
                                  const remaining = Math.max(0, grandTotal - num);
                                  setSplitCashAmount(remaining > 0 ? remaining.toLocaleString('es-CO') : '0');
                                }}
                                placeholder="0"
                                className="w-full pl-6 pr-2 py-1.5 text-xs font-black text-purple-950 rounded-lg border border-purple-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Chips de ajuste rápido */}
                        <div className="flex items-center justify-between gap-1 text-[10px]">
                          <span className="text-neutral-500 font-bold">Atajos:</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const half = Math.round(grandTotal / 2);
                                setSplitCashAmount(half.toLocaleString('es-CO'));
                                setSplitDigitalAmount((grandTotal - half).toLocaleString('es-CO'));
                              }}
                              className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-700 font-bold hover:bg-neutral-100 cursor-pointer"
                            >
                              50% / 50%
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const roundCash = Math.floor(grandTotal / 10000) * 10000;
                                setSplitCashAmount(roundCash.toLocaleString('es-CO'));
                                setSplitDigitalAmount(Math.max(0, grandTotal - roundCash).toLocaleString('es-CO'));
                              }}
                              className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-700 font-bold hover:bg-neutral-100 cursor-pointer"
                            >
                              Redondear Efectivo
                            </button>
                          </div>
                        </div>

                        {/* Verificación de Suma Total */}
                        {(() => {
                          const cashVal = Number(String(splitCashAmount).replace(/\D/g, '')) || 0;
                          const digVal = Number(String(splitDigitalAmount).replace(/\D/g, '')) || 0;
                          const totalSum = cashVal + digVal;
                          const diff = grandTotal - totalSum;

                          if (diff === 0 && grandTotal > 0) {
                            return (
                              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center justify-between">
                                <span>✅ Total exacto cubierto</span>
                                <span>{formatCOP(cashVal)} EFECTIVO + {formatCOP(digVal)} {splitDigitalMethod === 'datafono' ? 'DATÁFONO' : 'NEQUI'}</span>
                              </div>
                            );
                          } else if (diff > 0) {
                            return (
                              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold flex items-center justify-between">
                                <span>⚠️ Faltan {formatCOP(diff)} por distribuir</span>
                                <span>Suma: {formatCOP(totalSum)}</span>
                              </div>
                            );
                          } else {
                            return (
                              <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold flex items-center justify-between">
                                <span>⚠️ Supera por {formatCOP(Math.abs(diff))}</span>
                                <span>Suma: {formatCOP(totalSum)}</span>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 pt-1 border-t border-neutral-100 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPendingType('contra_entrega')}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                          pendingType === 'contra_entrega'
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                            : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon icon="heroicons:truck" className="text-sm" />
                          <span>Contra Entrega</span>
                        </div>
                        <p className={`text-[10px] font-normal mt-0.5 ${pendingType === 'contra_entrega' ? 'text-neutral-300' : 'text-neutral-400'}`}>
                          Paga al recibir su pedido
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPendingType('fiado')}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                          pendingType === 'fiado'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon icon="heroicons:user-group" className="text-sm" />
                          <span>🤝 Fiado / Crédito</span>
                        </div>
                        <p className={`text-[10px] font-normal mt-0.5 ${pendingType === 'fiado' ? 'text-amber-100' : 'text-neutral-400'}`}>
                          Hermana, empleado o cliente
                        </p>
                      </button>
                    </div>

                    {pendingType === 'fiado' && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-amber-900 font-black text-xs">
                          <Icon icon="heroicons:information-circle" className="text-base text-amber-700" />
                          <span>Cuenta por cobrar a: {customerName.trim() || 'Cliente'}</span>
                        </div>
                        <p className="text-[11px] text-amber-800 leading-tight">
                          El pedido se creará y los ingredientes se descuentan del inventario de una vez. Quedará marcado como <strong>🤝 FIADO</strong> para que lleves el saldo exacto y puedas registrar el pago cuando te cancelen.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-neutral-200 mt-4 space-y-3">
              <div className="space-y-1 text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                <div className="flex justify-between items-center">
                  <span>Subtotal productos ({orderItems.reduce((sum, i) => sum + i.qty, 0)}):</span>
                  <span className="font-bold text-neutral-800">{formatCOP(itemsSubtotal)}</span>
                </div>
                {fulfillmentType === 'delivery' && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1 font-medium text-emerald-800">
                      <Icon icon="heroicons:truck" className="text-emerald-600" />
                      Costo Domicilio:
                    </span>
                    <span className="font-black text-emerald-700">
                      {activeDeliveryFee > 0 ? `+${formatCOP(activeDeliveryFee)}` : 'Gratis'}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1.5 border-t border-neutral-200">
                  <span className="text-xs text-neutral-600 font-black uppercase tracking-wider">Total a cobrar:</span>
                  <span className="text-xl font-black text-neutral-950">
                    {formatCOP(grandTotal)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-neutral-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printKitchenTicket}
                    onChange={e => setPrintKitchenTicket(e.target.checked)}
                    className="rounded text-neutral-900 focus:ring-0"
                  />
                  <span>Imprimir comanda térmica de cocina</span>
                </label>
              </div>

              <button
                type="button"
                disabled={orderItems.length === 0 || isSubmitting}
                onClick={handleCreateOrder}
                className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-98 disabled:opacity-50 ${
                  entryFlow === 'completed'
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Icon icon="heroicons:arrow-path" className="text-lg animate-spin" />
                    <span>Guardando pedido...</span>
                  </>
                ) : entryFlow === 'completed' ? (
                  <>
                    <Icon icon="heroicons:check-badge" className="text-lg text-emerald-200" />
                    <span>Registrar en Ventas de Hoy e Inventario</span>
                  </>
                ) : (
                  <>
                    <Icon icon="heroicons:paper-airplane" className="text-lg text-amber-400" />
                    <span>Crear Pedido y Mandar a Cocina</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Configurator for Dishes with Modifiers (e.g. Mazorcada / Bento Mestizo) */}
        {configuringProduct && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl border border-neutral-200 w-full max-w-lg p-5 flex flex-col max-h-[85vh] overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div>
                  <h4 className="font-extrabold text-sm text-neutral-900">
                    {configuringProduct.product.name}
                  </h4>
                  <p className="text-xs text-neutral-400">Elige las opciones y combo del plato</p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfiguringProduct(null)}
                  className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center"
                >
                  <Icon icon="heroicons:x-mark" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-4">
                {configuringProduct.groups.map(g => {
                  const currentSel = selectedModifiers[g.name] || [];
                  return (
                    <div key={g.name} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-neutral-800">{g.name}</label>
                        <span className="text-[10px] text-neutral-400">
                          {g.max > 1 ? `Hasta ${g.max} opciones` : 'Elige 1'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                        {g.options.map(opt => {
                          const isSel = currentSel.includes(opt.name);
                          const hasIncludedCount = g.included_count !== undefined && g.included_count !== null;
                          const includedCount = hasIncludedCount ? g.included_count : 0;
                          const optExtra = Number(opt.extra || 0);
                          
                          let badgeEl = null;
                          if (hasIncludedCount) {
                            if (isSel) {
                              const selIndex = currentSel.indexOf(opt.name);
                              if (selIndex < includedCount) {
                                badgeEl = (
                                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                    ✓ Incluido ($0)
                                  </span>
                                );
                              } else {
                                badgeEl = (
                                  <span className="text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-lg">
                                    +{formatCOP(optExtra)} (Adicional)
                                  </span>
                                );
                              }
                            } else {
                              if (currentSel.length < includedCount) {
                                badgeEl = (
                                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50/70 px-2 py-0.5 rounded-lg">
                                    Incluido ($0)
                                  </span>
                                );
                              } else if (optExtra > 0) {
                                badgeEl = (
                                  <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                                    +{formatCOP(optExtra)} (2da opción)
                                  </span>
                                );
                              }
                            }
                          } else {
                            // Comportamiento estándar por precio individual de cada opción:
                            // Si la opción cuesta > 0 (ej. Coca-Cola $5.000, Té Hatsu $6.000), SIEMPRE se cobra y muestra su precio real.
                            if (optExtra > 0) {
                              badgeEl = (
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                                  isSel
                                    ? 'text-amber-950 bg-amber-200/80 border-amber-400'
                                    : 'text-amber-800 bg-amber-50 border-amber-200'
                                }`}>
                                  +{formatCOP(optExtra)}
                                </span>
                              );
                            } else {
                              badgeEl = (
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${
                                  isSel
                                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold'
                                    : 'text-emerald-600 bg-emerald-50/70'
                                }`}>
                                  {isSel ? '✓ Incluido ($0)' : 'Incluido ($0)'}
                                </span>
                              );
                            }
                          }

                          return (
                            <button
                              key={opt.id || opt.name}
                              type="button"
                              onClick={() => {
                                setSelectedModifiers(prev => {
                                  const list = prev[g.name] || [];
                                  if (g.max === 1) {
                                    // Si es un grupo opcional (min === 0) y ya estaba seleccionada, permitir desmarcación
                                    if ((g.min === 0 || !g.min) && list.includes(opt.name)) {
                                      return { ...prev, [g.name]: [] };
                                    }
                                    return { ...prev, [g.name]: [opt.name] };
                                  }
                                  if (list.includes(opt.name)) {
                                    return { ...prev, [g.name]: list.filter(x => x !== opt.name) };
                                  }
                                  if (list.length < g.max) {
                                    return { ...prev, [g.name]: [...list, opt.name] };
                                  }
                                  return prev;
                                });
                              }}
                              className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                                isSel
                                  ? 'bg-amber-500/10 border-amber-600 text-amber-950 font-bold shadow-xs'
                                  : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                              }`}
                            >
                              <span>{opt.name}</span>
                              {badgeEl}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Notas de Cocina por Plato */}
                <div className="space-y-1 pt-2 border-t border-neutral-100">
                  <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                    <Icon icon="heroicons:pencil-square" className="text-amber-600" />
                    Instrucciones de cocina para este plato (opcional):
                  </label>
                  <input
                    type="text"
                    value={itemKitchenNotes}
                    onChange={e => setItemKitchenNotes(e.target.value)}
                    placeholder="Ej: Sin sal, ensalada aparte, poco arroz, bien cocido..."
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-[#2f4131]/20 focus:border-[#2f4131]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <span className="text-xs font-bold text-neutral-500 block">Precio total de este plato:</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isEditingPriceDirectly) {
                          setCustomDishPrice(modalDishLivePrice);
                          setIsEditingPriceDirectly(true);
                        } else {
                          setIsEditingPriceDirectly(false);
                        }
                      }}
                      className="text-[10px] font-bold text-amber-700 hover:text-amber-800 underline cursor-pointer"
                    >
                      {isEditingPriceDirectly ? '✓ Cerrar edición directa' : '✏️ Editar precio manual'}
                    </button>
                  </div>

                  {isEditingPriceDirectly ? (
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-xs font-bold text-neutral-400">$</span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        autoFocus
                        value={customDishPrice === null ? '' : customDishPrice}
                        onChange={(e) => setCustomDishPrice(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                        placeholder="0"
                        className="w-32 pl-6 pr-2 py-1 text-sm font-black text-neutral-900 bg-amber-50 border border-amber-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-neutral-900 bg-neutral-100 px-2.5 py-1 rounded-xl">
                        {formatCOP(modalDishLivePrice)}
                      </span>
                      {customDishPrice !== null && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomDishPrice(null);
                            setIsEditingPriceDirectly(false);
                          }}
                          title="Restablecer precio calculado"
                          className="text-[10px] text-gray-400 hover:text-gray-600 p-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setConfiguringProduct(null);
                      setCustomDishPrice(null);
                      setIsEditingPriceDirectly(false);
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmConfiguredProduct}
                    className="flex-1 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 cursor-pointer"
                  >
                    Confirmar y Agregar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
