import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../config/supabase';
import { Icon } from '@iconify-icon/react';
import { toast } from '../Toast';
import { formatCOP } from '../../utils/money';
import { printThermalDocument } from '../../utils/thermalPrint';

export default function ManualOrderModal({
  isOpen,
  onClose,
  onOrderCreated,
  brandId,
  locationId,
  restaurantSettings
}) {
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Cart of items being built: [{ product, qty, unitPrice, options, notes }]
  const [orderItems, setOrderItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active item configuration (when clicking a product with options)
  const [configuringProduct, setConfiguringProduct] = useState(null);
  const [selectedModifiers, setSelectedModifiers] = useState({});

  // Customer & Delivery Info
  const [customerName, setCustomerName] = useState('Cliente WhatsApp');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState('delivery');
  
  // Timing: immediate vs scheduled
  const [timingMode, setTimingMode] = useState('immediate'); // 'immediate' | 'scheduled'
  const [scheduledTime, setScheduledTime] = useState('');

  // Payment
  const [isPaid, setIsPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('nequi'); // 'nequi', 'daviplata', 'efectivo', 'datafono', 'bancolombia'
  const [printKitchenTicket, setPrintKitchenTicket] = useState(true);

  // Fetch catalog of products
  useEffect(() => {
    if (!isOpen || !brandId) return;

    let isMounted = true;
    const fetchCatalog = async () => {
      setLoadingCatalog(true);
      try {
        const { data: prods, error: pErr } = await supabase
          .from('products')
          .select('id, name, description, price, cost, image_url, category_id, is_active, requires_kitchen, subcategory, categories:category_id(id, name, slug)')
          .eq('brand_id', brandId)
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (pErr) throw pErr;
        if (isMounted) setProducts(prods || []);
      } catch (err) {
        console.error('Error fetching catalog for manual order:', err);
        toast.error('Error al cargar catálogo de productos');
      } finally {
        if (isMounted) setLoadingCatalog(false);
      }
    };

    fetchCatalog();
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
  }, [isOpen, brandId]);

  // Categories derived from products
  const categories = useMemo(() => {
    const map = new Map();
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
      const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
      const matchesSearch = !searchTerm.trim() || 
        p.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(searchTerm.toLowerCase().trim()));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  // Open product modifier configuration
  const handleSelectProduct = (product) => {
    // Determine modifier groups for special dishes
    const isMestizo = product.id === 'b0000b14-0000-4000-a000-000000000004' || /mestizo/i.test(product.name);
    const isMazorcada = product.id === 'b0000b22-0000-4000-a000-000000000022' || /mazorcada/i.test(product.name);

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
              { id: 'opt-pimenton-no', name: 'Sin pimentón', extra: 0 }
            ]
          },
          {
            name: '🥣 Entrada Incluida',
            min: 1,
            max: 1,
            options: [
              { id: 'opt-crema-platano', name: '🥣 Crema de plátano colicero (16 oz)', extra: 0 },
              { id: 'opt-fruta-fresca', name: '🍍 Porción de Fruta fresca picada', extra: 0 },
              { id: 'opt-sin-sopa', name: '🚫 Sin sopa ni fruta', extra: 0 }
            ]
          },
          {
            name: '🥤 Bebida de la Casa Incluida',
            min: 1,
            max: 1,
            options: [
              { id: 'opt-jugo-dia', name: '🥤 Jugo del Día (5 oz)', extra: 0 },
              { id: 'opt-hatsu-caja', name: '🧃 Té Hatsu en Caja (200 ml)', extra: 2000 },
              { id: 'opt-hatsu-lata', name: '🥫 Té Hatsu en Lata (250 ml)', extra: 4000 },
              { id: 'opt-sin-bebida', name: '🚫 Sin bebida', extra: 0 }
            ]
          }
        ]
      });
      setSelectedModifiers({
        '🍗 Proteína a elección': ['Pollo salteado al wok'],
        '🍯 Salsa a elección': ['Salsa BBQ de la casa'],
        '🫑 Toque de Pimentón': ['Con pimentón salteado'],
        '🥣 Entrada Incluida': ['🥣 Crema de plátano colicero (16 oz)'],
        '🥤 Bebida de la Casa Incluida': ['🥤 Jugo del Día (5 oz)']
      });
      return;
    }

    if (isMestizo) {
      setConfiguringProduct({
        product,
        groups: [
          {
            name: '🍗 Tu Proteína',
            min: 1,
            max: 1,
            options: [
              { id: 'opt-mestizo-pollo', name: 'Pollo al curry dorado', extra: 0 },
              { id: 'opt-mestizo-cerdo', name: 'Cerdo teriyaki', extra: 0 }
            ]
          },
          {
            name: '🍲 Tu Principio Casero',
            min: 1,
            max: 1,
            options: [
              { id: 'opt-mestizo-garbanzos', name: 'Garbanzos caseros', extra: 0 },
              { id: 'opt-mestizo-maduritos', name: 'Maduritos melosos en panela', extra: 0 }
            ]
          },
          {
            name: '🥣 Entrada Incluida',
            min: 1,
            max: 1,
            options: [
              { id: 'opt-crema-platano', name: '🥣 Crema de plátano colicero (16 oz)', extra: 0 },
              { id: 'opt-fruta-fresca', name: '🍍 Porción de Fruta fresca picada', extra: 0 },
              { id: 'opt-sin-sopa', name: '🚫 Sin sopa ni fruta', extra: 0 }
            ]
          },
          {
            name: '🥤 Bebida de la Casa Incluida',
            min: 1,
            max: 1,
            options: [
              { id: 'opt-jugo-dia', name: '🥤 Jugo del Día (5 oz)', extra: 0 },
              { id: 'opt-hatsu-caja', name: '🧃 Té Hatsu en Caja (200 ml)', extra: 2000 },
              { id: 'opt-hatsu-lata', name: '🥫 Té Hatsu en Lata (250 ml)', extra: 4000 },
              { id: 'opt-sin-bebida', name: '🚫 Sin bebida', extra: 0 }
            ]
          }
        ]
      });
      setSelectedModifiers({
        '🍗 Tu Proteína': ['Pollo al curry dorado'],
        '🍲 Tu Principio Casero': ['Garbanzos caseros'],
        '🥣 Entrada Incluida': ['🥣 Crema de plátano colicero (16 oz)'],
        '🥤 Bebida de la Casa Incluida': ['🥤 Jugo del Día (5 oz)']
      });
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

    setOrderItems(prev => [
      ...prev,
      {
        product,
        qty: 1,
        unitPrice,
        options: formattedOptions,
        notes: ''
      }
    ]);

    setConfiguringProduct(null);
    setSelectedModifiers({});
    toast.success(`${product.name} agregado al pedido`);
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
  const grandTotal = useMemo(() => {
    return orderItems.reduce((acc, it) => acc + (it.unitPrice * it.qty), 0);
  }, [orderItems]);

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
      const orderPayload = {
        brand_id: brandId,
        location_id: locationId || null,
        status: 'new',
        origin: 'pos',
        fulfillment_type: fulfillmentType,
        customer_name: customerName.trim() || 'Cliente Mostrador / WhatsApp',
        customer_phone: customerPhone.trim() || null,
        delivery_address: fulfillmentType === 'delivery' ? (deliveryAddress.trim() || null) : null,
        scheduled_time: timingMode === 'scheduled' ? (new Date(scheduledTime).toISOString()) : null,
        total_amount: grandTotal,
        payment_status: isPaid ? 'paid' : 'pending',
        payment_method: isPaid ? paymentMethod : null,
        notes: orderNotes.trim() || null,
        created_at: new Date().toISOString()
      };

      const { data: createdOrder, error: orderErr } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select()
        .single();

      if (orderErr) throw orderErr;

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

      // Print kitchen thermal ticket if enabled
      if (printKitchenTicket) {
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

      toast.success(`¡Pedido #${createdOrder.order_number || createdOrder.id.slice(0, 5)} creado y enviado a cocina!`);
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
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
          >
            <Icon icon="heroicons:x-mark" className="text-xl" />
          </button>
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
                  const isSpecial = /especial del d[ií]a|bento del d[ií]a/i.test(p.subcategory || '') || /especial del d[ií]a/i.test(p.name);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProduct(p)}
                      className="flex flex-col p-3 rounded-2xl border border-neutral-200 bg-white hover:border-amber-500/80 hover:shadow-md transition-all text-left group cursor-pointer relative overflow-hidden"
                    >
                      {isSpecial && (
                        <span className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-wider bg-amber-500 text-neutral-950 px-1.5 py-0.5 rounded-md">
                          ⭐ Hoy
                        </span>
                      )}
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

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Nombre (ej: Carlos M.)"
                    className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-medium bg-neutral-50"
                  />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="WhatsApp (ej: 312...)"
                    className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-medium bg-neutral-50"
                  />
                </div>

                {fulfillmentType === 'delivery' && (
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    placeholder="Dirección de entrega (ej: Cra 7 #3-15 Apto 402)"
                    className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-medium bg-neutral-50"
                  />
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
                          <p className="text-xs font-black text-amber-700 mt-1">
                            {formatCOP(item.unitPrice * item.qty)}
                          </p>
                        </div>

                        {/* Qty Controls */}
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
                            onClick={() => handleRemoveItem(idx)}
                            className="w-6 h-6 rounded-md text-red-500 hover:bg-red-50 flex items-center justify-center ml-1"
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
              <div className="p-3 bg-white rounded-2xl border border-neutral-200 space-y-2">
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
                          : 'bg-neutral-50 text-neutral-500 border-neutral-200'
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
                          : 'bg-neutral-50 text-neutral-500 border-neutral-200'
                      }`}
                    >
                      Por Cobrar
                    </button>
                  </div>
                </div>

                {isPaid && (
                  <div className="flex gap-1 overflow-x-auto pt-1">
                    {[
                      { id: 'nequi', label: 'Nequi' },
                      { id: 'daviplata', label: 'Daviplata' },
                      { id: 'efectivo', label: 'Efectivo' },
                      { id: 'datafono', label: 'Datáfono' },
                      { id: 'bancolombia', label: 'Bancolombia' }
                    ].map(pm => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border shrink-0 transition-all ${
                          paymentMethod === pm.id
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                        }`}
                      >
                        {pm.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-neutral-200 mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500 font-medium">Total a cobrar:</span>
                <span className="text-xl font-black text-neutral-950">
                  {formatCOP(grandTotal)}
                </span>
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
                className="w-full py-3.5 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <Icon icon="heroicons:arrow-path" className="text-lg animate-spin" />
                    <span>Enviando a cocina...</span>
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
                                  ? 'bg-amber-500/10 border-amber-600 text-amber-950 font-bold'
                                  : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                              }`}
                            >
                              <span>{opt.name}</span>
                              {opt.extra > 0 && (
                                <span className="text-[11px] font-bold text-amber-800">
                                  +{formatCOP(opt.extra)}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-neutral-100 flex gap-2">
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
        )}

      </div>
    </div>
  );
}
