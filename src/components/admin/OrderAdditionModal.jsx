import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../config/supabase';
import { Icon } from '@iconify-icon/react';
import { toast } from '../Toast';
import { printThermalDocument } from '../../utils/thermalPrint';

export default function OrderAdditionModal({
  order,
  isOpen,
  onClose,
  onOrderUpdated,
  brandId,
  restaurantSettings
}) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Lista de ítems a agregar: [{ product, quantity, unit_price, notes }]
  const [additionCart, setAdditionCart] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [printAdditionTicket, setPrintAdditionTicket] = useState(true);

  // Cargar catálogo de productos y categorías de la marca
  useEffect(() => {
    if (!isOpen || !brandId) return;

    let isMounted = true;
    const fetchCatalog = async () => {
      setLoadingCatalog(true);
      try {
        const [catsRes, prodsRes] = await Promise.all([
          supabase
            .from('categories')
            .select('id, name, slug, icon, sort_order')
            .eq('brand_id', brandId)
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
          supabase
            .from('products')
            .select('id, name, price, image_url, category_id, is_active, is_drink')
            .eq('brand_id', brandId)
            .eq('is_active', true)
            .order('name', { ascending: true })
        ]);

        if (isMounted) {
          setCategories(catsRes.data || []);
          setProducts(prodsRes.data || []);
        }
      } catch (err) {
        console.error('Error al cargar catálogo para adición:', err);
        toast.error('Error al cargar catálogo');
      } finally {
        if (isMounted) setLoadingCatalog(false);
      }
    };

    fetchCatalog();
    setAdditionCart([]);
    setSearchTerm('');
    setSelectedCategory('all');

    return () => {
      isMounted = false;
    };
  }, [isOpen, brandId]);

  // Filtrado de productos por búsqueda y categoría
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
      const matchesSearch = !searchTerm.trim() || p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  // Agregar producto al carrito de la adición
  const handleAddProduct = (product) => {
    setAdditionCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          unit_price: Number(product.price) || 0,
          notes: ''
        }
      ];
    });
  };

  // Modificar cantidad en el carrito de la adición
  const handleUpdateQty = (productId, delta) => {
    setAdditionCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  // Modificar nota de un ítem de la adición
  const handleUpdateNotes = (productId, notes) => {
    setAdditionCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, notes } : item
      )
    );
  };

  // Eliminar ítem
  const handleRemoveItem = (productId) => {
    setAdditionCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Cálculos de totales
  const additionTotal = useMemo(() => {
    return additionCart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  }, [additionCart]);

  const currentOrderTotal = Number(order?.total_amount) || 0;
  const newOrderTotal = currentOrderTotal + additionTotal;
  const orderCode = order?.id ? order.id.slice(-4).toUpperCase() : 'N/A';

  // Detectar si un ítem es bebida
  const isDrinkProduct = (prod) => {
    if (prod.is_drink !== undefined) return Boolean(prod.is_drink);
    const cat = categories.find((c) => c.id === prod.category_id);
    const catName = (cat?.name || '').toLowerCase();
    const catSlug = (cat?.slug || '').toLowerCase();
    const prodName = prod.name.toLowerCase();
    return (
      catName.includes('bebida') ||
      catName.includes('trago') ||
      catName.includes('coctel') ||
      catName.includes('bar') ||
      catName.includes('café') ||
      catName.includes('té') ||
      catSlug.includes('bebida') ||
      catSlug.includes('bar') ||
      prodName.includes('soda') ||
      prodName.includes('cerveza') ||
      prodName.includes('té') ||
      prodName.includes('jugo') ||
      prodName.includes('agua')
    );
  };

  // Confirmar y guardar la adición
  const handleConfirmAddition = async () => {
    if (additionCart.length === 0) {
      toast.error('Agrega al menos un producto a la adición.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Insertar ítems en order_items
      const orderItemsToInsert = additionCart.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        notes: item.notes.trim() || null,
        modifiers: {},
        is_paid: false,
        brand_id: brandId,
        created_at: new Date().toISOString()
      }));

      const { data: insertedItems, error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert)
        .select('*, products(name)');

      if (itemsError) throw itemsError;

      // 2. Determinar si hay bebidas y/o comidas para coordinar KDS / BDS
      const hasDrinks = additionCart.some((it) => isDrinkProduct(it.product));
      const hasFood = additionCart.some((it) => !isDrinkProduct(it.product));

      const updates = {
        total_amount: newOrderTotal,
        updated_at: new Date().toISOString()
      };

      if (hasDrinks) {
        updates.bar_status = 'pending';
      }
      if (hasFood) {
        updates.kitchen_status = 'pending';
      }

      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', order.id);

      if (orderUpdateError) throw orderUpdateError;

      // 3. Notificación a Telegram (si está configurado)
      try {
        const telegramConcept = Array.isArray(restaurantSettings?.brand_concepts)
          ? restaurantSettings.brand_concepts.find((c) => c && c.id === 'telegram_dispatch')
          : null;

        const botToken = telegramConcept?.bot_token || restaurantSettings?.telegram_bot_token;
        const chatId = telegramConcept?.chat_id || restaurantSettings?.telegram_chat_id;

        if (botToken && chatId && telegramConcept?.enabled !== false) {
          let msg = `➕ <b>NUEVA ADICIÓN A PEDIDO #${orderCode}</b>\n`;
          msg += `━━━━━━━━━━━━━━━━━━━━\n`;
          if (order.table_number || order.mesa) {
            msg += `🪑 <b>Mesa:</b> MESA ${order.table_number || order.mesa}\n`;
          }
          if (order.customer_name) {
            msg += `👤 <b>Cliente:</b> ${order.customer_name}\n`;
          }
          msg += `⏰ <b>Hora Adición:</b> ${new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}\n\n`;
          msg += `📋 <b>ÍTEMS AGREGADOS:</b>\n`;
          additionCart.forEach((it) => {
            msg += `• <b>${it.quantity}x</b> ${it.product.name} — $${(it.unit_price * it.quantity).toLocaleString()}\n`;
            if (it.notes) {
              msg += `  ↳ <i>"${it.notes}"</i>\n`;
            }
          });
          msg += `\n💰 <b>Subtotal Adición:</b> $${additionTotal.toLocaleString()}\n`;
          msg += `💵 <b>NUEVO TOTAL ORDEN:</b> <b>$${newOrderTotal.toLocaleString()}</b>\n`;

          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: msg,
              parse_mode: 'HTML'
            })
          });
        }
      } catch (tErr) {
        console.warn('Error silencioso notificando adición a Telegram:', tErr);
      }

      // 4. Imprimir comanda de adición si está habilitado
      if (printAdditionTicket) {
        try {
          const additionOrderSnapshot = {
            ...order,
            id: order.id,
            total_amount: newOrderTotal,
            order_items: additionCart.map((it) => ({
              id: it.product.id,
              quantity: it.quantity,
              unit_price: it.unit_price,
              notes: it.notes,
              products: { name: `[ADICIÓN] ${it.product.name}` }
            }))
          };
          printThermalDocument('kitchen', additionOrderSnapshot, restaurantSettings);
        } catch (printErr) {
          console.warn('Error imprimiendo comanda de adición:', printErr);
        }
      }

      toast.success(`Adición agregada a la Orden #${orderCode}!`);
      if (onOrderUpdated) onOrderUpdated();
      onClose();
    } catch (err) {
      console.error('Error al guardar adición:', err);
      toast.error('No se pudo guardar la adición');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-gray-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={() => !isSubmitting && onClose()} 
      />
      
      <div className="relative z-10 w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60 font-black text-lg">
              <Icon icon="solar:cart-plus-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-gray-900 tracking-tight">
                  Agregar Adición a Pedido #{orderCode}
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                  {order.table_number || order.mesa ? `Mesa ${order.table_number || order.mesa}` : (order.customer_name || 'En Barra')}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-medium">
                Suma platos, bebidas o extras directamente a esta comanda sin generar facturas separadas.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 transition-colors"
          >
            <Icon icon="heroicons:x-mark" className="text-xl" />
          </button>
        </div>

        {/* Modal Body: 2 Columns (Catalog on left, Addition Cart on right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden min-h-0">
          
          {/* Left Column: Product Selector (7 cols) */}
          <div className="lg:col-span-7 flex flex-col border-r border-gray-100 bg-slate-50/50 p-4 overflow-hidden">
            
            {/* Search and Category Filter Toolbar */}
            <div className="space-y-3 mb-3 shrink-0">
              <div className="relative">
                <Icon 
                  icon="solar:magnifer-linear" 
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" 
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar producto, bebida, entrada o postre..."
                  className="w-full pl-10 pr-9 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#2f4131]/20 focus:border-[#2f4131] transition-all"
                  autoFocus
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                  >
                    <Icon icon="heroicons:x-mark" />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-gray-900 text-white shadow-xs'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  Todos ({products.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      selectedCategory === cat.id
                        ? 'bg-gray-900 text-white shadow-xs'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1 overflow-y-auto pr-1">
              {loadingCatalog ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
                  <Icon icon="line-md:loading-loop" className="text-2xl animate-spin text-[#2f4131]" />
                  <p className="text-xs font-semibold">Cargando carta...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-center p-4">
                  <Icon icon="solar:box-minimalistic-linear" className="text-3xl mb-1 text-gray-300" />
                  <p className="text-xs font-bold text-gray-600">No encontramos productos coincidentes</p>
                  <p className="text-[11px] text-gray-400">Intenta con otra búsqueda o categoría.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {filteredProducts.map((p) => {
                    const inCart = additionCart.find((it) => it.product.id === p.id);
                    const isDrink = isDrinkProduct(p);

                    return (
                      <div
                        key={p.id}
                        onClick={() => handleAddProduct(p)}
                        className={`group relative bg-white border rounded-xl p-2.5 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md hover:border-amber-400 active:scale-[0.98] ${
                          inCart ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-gray-200/80'
                        }`}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-12 h-12 rounded-lg object-cover bg-gray-100 shrink-0 border border-gray-100"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-gray-400 text-lg">
                              <Icon icon={isDrink ? 'solar:cup-bold' : 'solar:chef-hat-bold'} />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-gray-900 leading-tight line-clamp-2">
                              {p.name}
                            </h4>
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">
                              {isDrink ? '🍸 Barra' : '🍳 Cocina'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                          <span className="text-xs font-black text-gray-900">
                            ${Number(p.price || 0).toLocaleString()}
                          </span>
                          <button
                            type="button"
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                              inCart
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-gray-100 text-gray-700 group-hover:bg-[#2f4131] group-hover:text-white'
                            }`}
                          >
                            {inCart ? inCart.quantity : '+'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Addition Cart (5 cols) */}
          <div className="lg:col-span-5 flex flex-col bg-white p-4 justify-between overflow-hidden">
            <div>
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-800">
                    Ítems de la Adición
                  </h4>
                  <span className="text-[10px] font-black bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                    {additionCart.length}
                  </span>
                </div>
                {additionCart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAdditionCart([])}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-800 transition-colors"
                  >
                    Vaciar
                  </button>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-2.5 max-h-[38vh] lg:max-h-[46vh] overflow-y-auto pr-1">
                {additionCart.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    <Icon icon="solar:cart-large-2-linear" className="text-4xl mx-auto mb-2 text-gray-200" />
                    <p className="text-xs font-bold text-gray-500">No has seleccionado adiciones</p>
                    <p className="text-[11px] text-gray-400">Haz clic en los productos de la izquierda para sumar.</p>
                  </div>
                ) : (
                  additionCart.map((it) => (
                    <div
                      key={it.product.id}
                      className="p-2.5 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-900 leading-snug">
                            {it.product.name}
                          </p>
                          <p className="text-[11px] font-bold text-gray-500">
                            ${(it.unit_price * it.quantity).toLocaleString()}
                          </p>
                        </div>

                        {/* Qty Controls */}
                        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg p-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(it.product.id, -1)}
                            className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-rose-600 font-bold"
                          >
                            -
                          </button>
                          <span className="w-5 text-center text-xs font-black text-gray-900">
                            {it.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(it.product.id, 1)}
                            className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-emerald-600 font-bold"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it.product.id)}
                          className="text-gray-300 hover:text-rose-500 transition-colors pt-0.5"
                        >
                          <Icon icon="solar:trash-bin-trash-linear" className="text-sm" />
                        </button>
                      </div>

                      {/* Special Note Input */}
                      <input
                        type="text"
                        value={it.notes}
                        onChange={(e) => handleUpdateNotes(it.product.id, e.target.value)}
                        placeholder="Nota de preparación (ej: sin hielo, bien caliente)..."
                        className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-amber-400 italic text-gray-700 placeholder:text-gray-400"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Addition Summary & Confirm Action */}
            <div className="pt-3 border-t border-gray-100 space-y-3 mt-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-gray-200/70 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Total actual del pedido:</span>
                  <span>${currentOrderTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-amber-700 font-bold">
                  <span>+ Subtotal de esta adición:</span>
                  <span>+${additionTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-900 font-black text-sm pt-1.5 border-t border-gray-200">
                  <span>Nuevo Total Comanda:</span>
                  <span className="text-[#2f4131]">${newOrderTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Print Ticket Toggle */}
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-600 select-none">
                <input
                  type="checkbox"
                  checked={printAdditionTicket}
                  onChange={(e) => setPrintAdditionTicket(e.target.checked)}
                  className="rounded text-[#2f4131] focus:ring-[#2f4131] w-4 h-4"
                />
                <Icon icon="solar:printer-linear" className="text-base text-gray-500" />
                <span>Imprimir comanda de adición para cocina/barra</span>
              </label>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="w-1/3 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddition}
                  disabled={isSubmitting || additionCart.length === 0}
                  className="flex-1 py-2.5 rounded-xl bg-[#2f4131] hover:bg-[#233124] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Icon icon="line-md:loading-loop" className="animate-spin text-base" />
                      <span>Agregando a Comanda...</span>
                    </>
                  ) : (
                    <>
                      <Icon icon="solar:check-circle-bold" className="text-base" />
                      <span>Confirmar Adición (+${additionTotal.toLocaleString()})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
