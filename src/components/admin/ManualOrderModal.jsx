import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '@iconify-icon/react';
import { toast } from '../Toast';
import { formatCOP } from '../../utils/money';
import { printThermalDocument } from '../../utils/thermalPrint';
import { parseCustomerInfo } from '../../hooks/useCRM';
import { resolveOrCreateCustomer, syncCollectionToFinancials } from '../../utils/customerSync';

const isValidUUID = (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export default function ManualOrderModal({
  isOpen,
  onClose,
  onOrderCreated,
  brandId: propBrandId,
  locationId,
  restaurantSettings
}) {
  const { activeBrand, profile } = useAuth();
  const brandId = propBrandId || activeBrand?.id || profile?.brand_id || localStorage.getItem('aa_active_brand_id');
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [products, setProducts] = useState([]);
  const [locationsList, setLocationsList] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState(() => isValidUUID(locationId) ? locationId : null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Cart of items being built: [{ product, qty, unitPrice, options, notes }]
  const [orderItems, setOrderItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active item configuration (when clicking a product with options)
  const [configuringProduct, setConfiguringProduct] = useState(null);
  const [selectedModifiers, setSelectedModifiers] = useState({});
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

  // Fetch catalog of products and locations
  useEffect(() => {
    if (!isOpen || !brandId) return;

    let isMounted = true;
    const fetchData = async () => {
      setLoadingCatalog(true);
      try {
        const [prodsRes, locsRes, pmRes, rsRes] = await Promise.all([
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
            .eq('brand_id', brandId)
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
          // Incluir platos activos Y TAMBIÉN platos del día / bentos rotativos aunque estén inactivos en catálogo general
          const rawProds = allFetched.filter(p => {
            if (p.is_active) return true;
            if (p.id === activeSpecialId || activeSecondaryIds.includes(p.id)) return true;
            if (/bento/i.test(p.subcategory || '') || /bento/i.test(p.name) || p.category_id === 'b0000c01-0000-4000-a000-000000000001') return true;
            return false;
          }).map(p => {
            if (p.id === activeSpecialId || activeSecondaryIds.includes(p.id)) {
              return { ...p, price: extractedPromoPrice || p.price };
            }
            return p;
          });

          // Asegurar presencia inmediata de Bento Mediterráneo
          const hasMedit = rawProds.some(p => p.id === 'b0000b18-0000-4000-a000-000000000018' || /mediterr[aá]neo/i.test(p.name));
          if (!hasMedit) {
            rawProds.unshift({
              id: 'b0000b18-0000-4000-a000-000000000018',
              name: 'Bento Mediterráneo (Fresco y Balanceado)',
              description: 'Arroz blanco con perejil, hummus casero cremoso de garbanzo con aceite y páprika, champiñones al ajillo, pepino fresco, tomates cherry y rábano crocante. 👉 Proteína a elección (al limón): Filete de merluza dorada o pechuga de pollo al wok.',
              price: 19000,
              cost: 7500,
              image_url: '/bento-mediterraneo.jpg',
              category_id: 'b0000c01-0000-4000-a000-000000000001',
              is_active: true,
              requires_kitchen: true,
              subcategory: 'Bentos Caseros',
              categories: { id: 'b0000c01-0000-4000-a000-000000000001', name: 'BOKU Bentos Caseros', slug: 'boku-bentos' }
            });
          }

          // Asegurar presencia y actualización de Bento Criollo Antioqueño (La Paisa)
          const criolloIndex = rawProds.findIndex(p => p.id === 'b0000b11-0000-4000-a000-000000000001' || /criollo/i.test(p.name));
          if (criolloIndex >= 0) {
            rawProds[criolloIndex] = {
              ...rawProds[criolloIndex],
              name: 'Bento Criollo Antioqueño (La Paisa)',
              description: 'La bandeja paisa de siempre, pero en el bowl de la casa: arroz blanco, fríjoles a elección (rojos o negros), carne a elección (molida, cerdo o pollo al wok), chorizo y morcilla, huevo frito, aguacate y maduritos melosos.',
              price: 19000
            };
          } else {
            rawProds.unshift({
              id: 'b0000b11-0000-4000-a000-000000000001',
              name: 'Bento Criollo Antioqueño (La Paisa)',
              description: 'La bandeja paisa de siempre, pero en el bowl de la casa: arroz blanco, fríjoles a elección (rojos o negros), carne a elección (molida, cerdo o pollo al wok), chorizo y morcilla, huevo frito, aguacate y maduritos melosos.',
              price: 19000,
              cost: 7500,
              image_url: 'https://gqjfjtzsdpslwffbqqyw.supabase.co/storage/v1/object/public/products/4l57b6hx21n_1792011029842.webp',
              category_id: 'b0000c01-0000-4000-a000-000000000001',
              is_active: true,
              requires_kitchen: true,
              subcategory: 'Bentos Caseros',
              categories: { id: 'b0000c01-0000-4000-a000-000000000001', name: 'BOKU Bentos Caseros', slug: 'boku-bentos' }
            });
          }

          // Auto-sincronizar silenciosamente a Supabase si el usuario tiene sesión activa de admin
          supabase.auth.getSession().then(({ data: sessData }) => {
            if (sessData?.session?.user && brandId) {
              supabase.from('products').upsert([
                {
                  id: 'b0000b18-0000-4000-a000-000000000018',
                  brand_id: brandId,
                  name: 'Bento Mediterráneo (Fresco y Balanceado)',
                  description: 'Arroz blanco con perejil, hummus casero cremoso de garbanzo con aceite y páprika, champiñones al ajillo, pepino fresco, tomates cherry y rábano crocante. 👉 Proteína a elección (al limón): Filete de merluza dorada o pechuga de pollo al wok.',
                  price: 19000,
                  cost: 7500,
                  margin: 60.5,
                  category_id: 'b0000c01-0000-4000-a000-000000000001',
                  image_url: '/bento-mediterraneo.jpg',
                  is_active: true,
                  stock_status: 'in',
                  requires_kitchen: true,
                  station: 'kitchen',
                  subcategory: 'Bentos Caseros'
                },
                {
                  id: 'b0000b11-0000-4000-a000-000000000001',
                  brand_id: brandId,
                  name: 'Bento Criollo Antioqueño (La Paisa)',
                  description: 'La bandeja paisa de siempre, pero en el bowl de la casa: arroz blanco, fríjoles a elección (rojos o negros), carne a elección (molida, cerdo o pollo al wok), chorizo y morcilla, huevo frito, aguacate y maduritos melosos.',
                  price: 19000,
                  cost: 7500,
                  category_id: 'b0000c01-0000-4000-a000-000000000001',
                  is_active: true,
                  requires_kitchen: true
                }
              ], { onConflict: 'id' }).then(({ error: upsertErr }) => {
                if (upsertErr) console.warn('Background sync products note:', upsertErr.message);
              });
            }
          }).catch(() => {});

          setProducts(rawProds);
          const fetchedLocs = locsRes.data || [];
          setLocationsList(fetchedLocs);

          // Cargar medios de pago configurados en base de datos; si no hay, usar los reales de Boku Bento
          const splitOption = { id: 'split', label: '⚡ Pago Dividido (Nequi + Efectivo)' };
          if (pmRes.data && pmRes.data.length > 0) {
            const mapped = pmRes.data.map(m => {
              const lower = (m.name || '').toLowerCase();
              let id = 'nequi';
              if (m.type === 'cash' || lower.includes('efectivo')) id = 'efectivo';
              else if (m.type === 'card' || lower.includes('datafono') || lower.includes('datáfono')) id = 'datafono';
              else id = m.id || 'nequi';
              return { id, label: m.name };
            });
            setActivePaymentMethods([...mapped, splitOption]);
          } else {
            setActivePaymentMethods([
              { id: 'nequi', label: 'Nequi / Bre-B' },
              { id: 'efectivo', label: 'Efectivo' },
              { id: 'datafono', label: 'Datáfono' },
              splitOption
            ]);
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

  // Categories derived from products con categoría prioritaria ⭐ Del Día
  const categories = useMemo(() => {
    const map = new Map();
    // Pestaña especial destacada de Almuerzos y Bentos del día
    map.set('daily_specials', {
      id: 'daily_specials',
      name: '⭐ Del Día / Almuerzos',
      slug: 'del-dia'
    });
    products.forEach(p => {
      const cat = p.categories;
      if (cat?.id && !map.has(cat.id)) {
        map.set(cat.id, cat);
      }
    });
    return Array.from(map.values());
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      let matchesCategory = true;
      if (selectedCategory === 'daily_specials') {
        matchesCategory = Boolean(
          p.id === dailySpecialData.activeSpecialId ||
          dailySpecialData.activeSecondaryIds.includes(p.id) ||
          /bento|almuerzo|especial del d[ií]a/i.test(p.name) ||
          /bento/i.test(p.subcategory || '') ||
          p.category_id === 'b0000c01-0000-4000-a000-000000000001'
        );
      } else if (selectedCategory !== 'all') {
        matchesCategory = p.category_id === selectedCategory;
      }

      const matchesSearch = !searchTerm.trim() || 
        p.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(searchTerm.toLowerCase().trim()));
      return matchesCategory && matchesSearch;
    }).sort((a, b) => {
      // Priorizar el plato del día y las opciones de hoy arriba
      const aScore = a.id === dailySpecialData.activeSpecialId ? 2 : (dailySpecialData.activeSecondaryIds.includes(a.id) ? 1 : 0);
      const bScore = b.id === dailySpecialData.activeSpecialId ? 2 : (dailySpecialData.activeSecondaryIds.includes(b.id) ? 1 : 0);
      return bScore - aScore;
    });
  }, [products, selectedCategory, searchTerm, dailySpecialData]);

  // Open product modifier configuration
  const handleSelectProduct = (product) => {
    // Grupos compartidos de Entrada y Bebida con los nombres DINÁMICOS de hoy
    const currentSoupName = dailySpecialData.soupName || '🥣 Crema de plátano colicero (16 oz)';
    const currentDrinkName = dailySpecialData.drinkName || '🥤 Jugo del Día (5 oz)';

    const sharedSoupGroup = {
      name: '🥣 Entrada Incluida',
      min: 1,
      max: 1,
      options: [
        { id: 'opt-bento-soup-today', name: currentSoupName, extra: 0 },
        { id: 'opt-bento-fruta', name: '🍍 Porción de Fruta fresca picada', extra: 0 },
        { id: 'opt-bento-nosoup', name: '🚫 Sin sopa ni fruta', extra: 0 }
      ]
    };

    const sharedDrinkGroup = {
      name: '🥤 Bebida de la Casa Incluida',
      min: 1,
      max: 1,
      options: [
        { id: 'opt-bento-drink-today', name: currentDrinkName, extra: 0 },
        { id: 'opt-bento-hatsu-caja', name: '🧃 Té Hatsu en Caja (200 ml)', extra: 2000 },
        { id: 'opt-bento-hatsu-lata', name: '🥫 Té Hatsu en Lata (250 ml)', extra: 4000 },
        { id: 'opt-bento-nodrink', name: '🚫 Sin bebida', extra: 0 }
      ]
    };

    // Determine modifier groups for special dishes
    const isMediterraneo = product.id === 'b0000b18-0000-4000-a000-000000000018' || /mediterr[aá]neo/i.test(product.name);
    const isCriollo = product.id === 'b0000b11-0000-4000-a000-000000000001' || /criollo|la paisa/i.test(product.name);
    const isMestizo = product.id === 'b0000b14-0000-4000-a000-000000000004' || /mestizo/i.test(product.name);
    const isMazorcada = product.id === 'b0000b22-0000-4000-a000-000000000022' || /mazorcada/i.test(product.name);

    if (isMediterraneo) {
      setConfiguringProduct({
        product,
        groups: [
          {
            name: '🐟 Proteína al Limón',
            min: 1,
            max: 2,
            included_count: 1,
            options: [
              { id: 'opt-medit-merluza', name: 'Filete de merluza dorada', extra: 8000 },
              { id: 'opt-medit-pollo', name: 'Pechuga de pollo al wok', extra: 7000 }
            ]
          },
          sharedSoupGroup,
          sharedDrinkGroup
        ]
      });
      setSelectedModifiers({
        '🐟 Proteína al Limón': ['Filete de merluza dorada'],
        '🥣 Entrada Incluida': [currentSoupName],
        '🥤 Bebida de la Casa Incluida': [currentDrinkName]
      });
      setItemKitchenNotes('');
      setEditingItemIndex(null);
      return;
    }

    if (isCriollo) {
      setConfiguringProduct({
        product,
        groups: [
          {
            name: '🍲 Tu Fríjol',
            min: 1,
            max: 2,
            included_count: 1,
            options: [
              { id: 'opt-criollo-frijol-rojo', name: 'Fríjoles rojos calados', extra: 4000 },
              { id: 'opt-criollo-frijol-negro', name: 'Fríjoles negros', extra: 4000 }
            ]
          },
          {
            name: '🥩 Tu Proteína Criolla',
            min: 1,
            max: 3,
            included_count: 1,
            options: [
              { id: 'opt-criollo-molida', name: 'Carne molida sazonada', extra: 7000 },
              { id: 'opt-criollo-cerdo', name: 'Cerdo al wok en cubos', extra: 7000 },
              { id: 'opt-criollo-pollo', name: 'Pollo al wok en cubos', extra: 7000 }
            ]
          },
          sharedSoupGroup,
          sharedDrinkGroup
        ]
      });
      setSelectedModifiers({
        '🍲 Tu Fríjol': ['Fríjoles rojos calados'],
        '🥩 Tu Proteína Criolla': ['Carne molida sazonada'],
        '🥣 Entrada Incluida': [currentSoupName],
        '🥤 Bebida de la Casa Incluida': [currentDrinkName]
      });
      setItemKitchenNotes('');
      setEditingItemIndex(null);
      return;
    }

    if (isMazorcada) {
      setConfiguringProduct({
        product,
        groups: [
          {
            name: '🍗 Proteína a elección',
            min: 1,
            max: 2,
            included_count: 1,
            options: [
              { id: 'opt-mazor-pollo', name: 'Pollo salteado al wok', extra: 7000 },
              { id: 'opt-mazor-cerdo', name: 'Cerdo salteado al wok', extra: 7000 }
            ]
          },
          {
            name: '🍯 Salsa a elección',
            min: 1,
            max: 2,
            options: [
              { id: 'opt-mazor-bbq', name: 'Salsa BBQ de la casa', extra: 0 },
              { id: 'opt-mazor-tartara', name: 'Salsa Tártara cremosa', extra: 0 }
            ]
          },
          {
            name: '🫑 Toque de Pimentón',
            min: 0,
            max: 1,
            options: [
              { id: 'opt-pimenton-si', name: 'Con pimentón salteado', extra: 0 },
              { id: 'opt-pimenton-no', name: '🚫 Sin pimentón', extra: 0 }
            ]
          },
          {
            name: '🌽 Toppings & Exclusiones',
            min: 0,
            max: 4,
            options: [
              { id: 'opt-sin-papita', name: '🚫 Sin papita cabello de ángel', extra: 0 },
              { id: 'opt-sin-jamon', name: '🚫 Sin jamón', extra: 0 },
              { id: 'opt-sin-salchicha', name: '🚫 Sin salchicha', extra: 0 },
              { id: 'opt-sin-queso', name: '🚫 Sin queso fundido', extra: 0 }
            ]
          },
          sharedSoupGroup,
          sharedDrinkGroup
        ]
      });
      setSelectedModifiers({
        '🍗 Proteína a elección': ['Pollo salteado al wok'],
        '🍯 Salsa a elección': ['Salsa BBQ de la casa'],
        '🫑 Toque de Pimentón': ['Con pimentón salteado'],
        '🥣 Entrada Incluida': [currentSoupName],
        '🥤 Bebida de la Casa Incluida': [currentDrinkName]
      });
      setItemKitchenNotes('');
      setEditingItemIndex(null);
      return;
    }

    if (isMestizo) {
      setConfiguringProduct({
        product,
        groups: [
          {
            name: '🍗 Tu Proteína',
            min: 1,
            max: 2,
            included_count: 1,
            options: [
              { id: 'opt-mestizo-pollo', name: 'Pollo al curry dorado', extra: 7000 },
              { id: 'opt-mestizo-cerdo', name: 'Cerdo teriyaki', extra: 7000 }
            ]
          },
          {
            name: '🍲 Tu Principio Casero',
            min: 1,
            max: 2,
            included_count: 1,
            options: [
              { id: 'opt-mestizo-garbanzos', name: 'Garbanzos caseros', extra: 4000 },
              { id: 'opt-mestizo-maduritos', name: 'Maduritos melosos en panela', extra: 4000 },
              { id: 'opt-mestizo-mitad', name: 'Mitad garbanzos y mitad maduritos', extra: 0 },
              { id: 'opt-mestizo-sin-principio', name: '🚫 Sin principio', extra: 0 }
            ]
          },
          {
            name: '🥗 Ensalada & Vegetales',
            min: 0,
            max: 5,
            options: [
              { id: 'opt-ensalada-normal', name: 'Ensalada cremosa de remolacha (normal)', extra: 0 },
              { id: 'opt-ensalada-aparte', name: 'Ensalada en recipiente aparte', extra: 0 },
              { id: 'opt-sin-ensalada', name: '🚫 Sin ensalada de remolacha', extra: 0 },
              { id: 'opt-sin-champinones', name: '🚫 Sin champiñones al ajillo', extra: 0 },
              { id: 'opt-sin-brocoli', name: '🚫 Sin brócoli al vapor', extra: 0 },
              { id: 'opt-sin-tomates', name: '🚫 Sin tomates cherry', extra: 0 }
            ]
          },
          sharedSoupGroup,
          sharedDrinkGroup
        ]
      });
      setSelectedModifiers({
        '🍗 Tu Proteína': ['Pollo al curry dorado'],
        '🍲 Tu Principio Casero': ['Garbanzos caseros'],
        '🥣 Entrada Incluida': [currentSoupName],
        '🥤 Bebida de la Casa Incluida': [currentDrinkName]
      });
      setItemKitchenNotes('');
      setEditingItemIndex(null);
      return;
    }

    // Si es cualquier otro Bento o Especial del Día, abrir selector dinámico de sopa y bebida
    const isGenericBentoOrSpecial = Boolean(
      product.id === dailySpecialData.activeSpecialId ||
      dailySpecialData.activeSecondaryIds.includes(product.id) ||
      /bento|almuerzo|especial/i.test(product.name) ||
      /bento/i.test(product.subcategory || '') ||
      product.category_id === 'b0000c01-0000-4000-a000-000000000001'
    );

    if (isGenericBentoOrSpecial) {
      setConfiguringProduct({
        product,
        groups: [
          sharedSoupGroup,
          sharedDrinkGroup
        ]
      });
      setSelectedModifiers({
        '🥣 Entrada Incluida': [currentSoupName],
        '🥤 Bebida de la Casa Incluida': [currentDrinkName]
      });
      setItemKitchenNotes('');
      setEditingItemIndex(null);
      return;
    }

    // Direct simple product without special modifier wizard
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

    const unitPrice = (Number(product.price) || 0) + extra;

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
    setItemKitchenNotes('');
    setEditingItemIndex(null);
    toast.success(`${product.name} ${editingItemIndex !== null ? 'actualizado' : 'agregado al pedido'}`);
  };

  const modalDishLivePrice = useMemo(() => {
    if (!configuringProduct) return 0;
    const base = Number(configuringProduct.product.price) || 0;
    let extra = 0;
    configuringProduct.groups.forEach(g => {
      const selected = selectedModifiers[g.name] || [];
      const included = (g.included_count !== undefined && g.included_count !== null) ? g.included_count : (g.max === 1 ? 1 : 0);
      selected.forEach((optName, idx) => {
        if (idx >= included) {
          const optObj = g.options.find(o => o.name === optName);
          extra += (optObj?.extra || 0);
        }
      });
    });
    return base + extra;
  }, [configuringProduct, selectedModifiers]);

  const handleEditItem = (index) => {
    const item = orderItems[index];
    if (!item) return;

    handleSelectProduct(item.product);
    const prefill = {};
    Object.entries(item.options || {}).forEach(([k, v]) => {
      prefill[k] = Array.isArray(v) ? v : [v];
    });
    setSelectedModifiers(prefill);
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
          const digLabel = splitDigitalMethod === 'datafono' ? 'Datáfono' : 'Nequi';
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
        status: isAlreadyDelivered ? 'delivered' : 'preparing',
        kitchen_status: isAlreadyDelivered ? 'completed' : 'pending',
        bar_status: isAlreadyDelivered ? 'completed' : 'pending',
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
          syncCollectionToFinancials({
            brandId,
            customerName: customerName.trim() || 'Cliente WhatsApp',
            amount: grandTotal,
            paymentMethod: 'Pago Dividido',
            splitPayments: [
              { method: 'efectivo', amount: cashVal },
              { method: splitDigitalMethod, amount: digVal }
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
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                      selectedCategory === c.id
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
            {dailySpecialData.activeSpecialId && (
              <div className="mb-3 p-3 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 border border-amber-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🍱</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-neutral-950 px-1.5 py-0.5 rounded-md">
                        Almuerzo Estrella de Hoy
                      </span>
                      <span className="text-xs font-black text-neutral-900">
                        {products.find(p => p.id === dailySpecialData.activeSpecialId)?.name || 'Bento del Día'} ({formatCOP(dailySpecialData.promoPrice)})
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-600 mt-0.5">
                      Entrada: <strong>{dailySpecialData.soupName}</strong> • Bebida: <strong>{dailySpecialData.drinkName}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('daily_specials')}
                  className="text-xs font-black px-3 py-1.5 rounded-xl bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  Ver del Día ⭐
                </button>
              </div>
            )}

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
                  const isSecondarySpecial = dailySpecialData.activeSecondaryIds.includes(p.id);
                  const isSpecial = isPrimarySpecial || isSecondarySpecial || /especial del d[ií]a|bento del d[ií]a/i.test(p.subcategory || '') || /especial del d[ií]a/i.test(p.name);
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
                          ⭐ Opción Hoy
                        </span>
                      ) : isSpecial ? (
                        <span className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-wider bg-amber-400 text-neutral-950 px-1.5 py-0.5 rounded-md">
                          ⭐ Combo Hoy
                        </span>
                      ) : null}
                      <p className="font-bold text-xs text-neutral-900 group-hover:text-amber-800 line-clamp-1 pr-8">
                        {p.name.replace(/\s*\(Especial del Día\)/i, '')}
                      </p>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 mt-0.5 leading-tight">
                        {p.description || p.subcategory || 'Plato BOKU'}
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

                          {/* Parte 2: Nequi / Digital */}
                          <div className="bg-white p-2.5 rounded-xl border border-neutral-200 shadow-2xs space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black uppercase text-purple-700 tracking-wider flex items-center gap-1">
                                <span>🟣 {splitDigitalMethod === 'datafono' ? 'Datáfono' : 'Nequi'}</span>
                              </label>
                              <select
                                value={splitDigitalMethod}
                                onChange={e => setSplitDigitalMethod(e.target.value)}
                                className="text-[9px] font-black bg-neutral-100 border border-neutral-200 rounded px-1 py-0.5 text-neutral-700"
                              >
                                <option value="nequi">Nequi</option>
                                <option value="datafono">Datáfono</option>
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
                          const includedCount = (g.included_count !== undefined && g.included_count !== null) ? g.included_count : (g.max === 1 ? 1 : 0);
                          
                          let badgeEl = null;
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
                                  +{formatCOP(opt.extra || 0)} (Adicional)
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
                            } else if (opt.extra > 0) {
                              badgeEl = (
                                <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                                  +{formatCOP(opt.extra)} (2da opción)
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
                  <span className="text-xs font-bold text-neutral-500">Precio total de este plato:</span>
                  <span className="text-sm font-black text-neutral-900 bg-neutral-100 px-2.5 py-1 rounded-xl">
                    {formatCOP(modalDishLivePrice)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfiguringProduct(null)}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmConfiguredProduct}
                    className="flex-1 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800"
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
