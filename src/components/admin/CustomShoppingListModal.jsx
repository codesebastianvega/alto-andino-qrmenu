import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from '@iconify-icon/react';
import { toast } from '../Toast';
import Portal from '../Portal';

export function CustomShoppingListModal({
  isOpen,
  onClose,
  ingredients = [],
  providers = [],
  initialSelectedIds = new Set(),
  initialQuantities = {},
  brandName = 'Mi Restaurante'
}) {
  const [recipientType, setRecipientType] = useState('free'); // 'free' | 'provider'
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [customPhone, setCustomPhone] = useState('+57');
  const [customRecipientName, setCustomRecipientName] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('Por favor confirmar recepción del pedido y hora estimada de entrega.');
  
  // Ítems seleccionados y sus cantidades y notas específicas
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [quantities, setQuantities] = useState({});
  const [itemNotes, setItemNotes] = useState({});
  const [adHocItems, setAdHocItems] = useState([]);
  
  // Búsqueda en el selector de insumos
  const [searchQuery, setSearchQuery] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Sincronizar selección inicial cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setSelectedItemIds(new Set(initialSelectedIds));
      setQuantities({ ...initialQuantities });
      setIsCopied(false);
    }
  }, [isOpen, initialSelectedIds, initialQuantities]);

  // Si cambia el proveedor seleccionado, actualizar nombre y teléfono
  const handleSelectProvider = (provId) => {
    setSelectedProviderId(provId);
    const prov = providers.find(p => p.id === provId);
    if (prov) {
      setCustomRecipientName(prov.name || '');
      setCustomPhone(prov.phone || '+57');
    }
  };

  // Lista combinada de insumos de inventario + ad-hoc creados al vuelo
  const allAvailableItems = useMemo(() => {
    return [...ingredients, ...adHocItems];
  }, [ingredients, adHocItems]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return allAvailableItems;
    const q = searchQuery.toLowerCase();
    return allAvailableItems.filter(i => 
      (i.name || '').toLowerCase().includes(q) ||
      (i.sku || '').toLowerCase().includes(q)
    );
  }, [allAvailableItems, searchQuery]);

  const toggleItem = (id) => {
    const next = new Set(selectedItemIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
      if (!quantities[id]) {
        setQuantities(prev => ({ ...prev, [id]: 1 }));
      }
    }
    setSelectedItemIds(next);
  };

  const updateQuantity = (id, val) => {
    const parsed = parseFloat(val);
    setQuantities(prev => ({ ...prev, [id]: isNaN(parsed) || parsed < 0 ? 0 : parsed }));
  };

  const updateItemNote = (id, note) => {
    setItemNotes(prev => ({ ...prev, [id]: note }));
  };

  // Agregar ítem libre no registrado
  const [newAdHocName, setNewAdHocName] = useState('');
  const [newAdHocUnit, setNewAdHocUnit] = useState('Unidad');

  const handleAddAdHoc = (e) => {
    e.preventDefault();
    if (!newAdHocName.trim()) return;
    const newItem = {
      id: `adhoc-${Date.now()}`,
      name: newAdHocName.trim(),
      purchase_unit: newAdHocUnit || 'Unidad',
      purchase_price: 0,
      stock_current: 0,
      stock_min: 0,
      isAdHoc: true
    };
    setAdHocItems(prev => [...prev, newItem]);
    setSelectedItemIds(prev => new Set(prev).add(newItem.id));
    setQuantities(prev => ({ ...prev, [newItem.id]: 1 }));
    setNewAdHocName('');
    toast(`"${newItem.name}" agregado a la lista.`);
  };

  // Selección rápida
  const handleSelectLowStock = () => {
    const lowIds = new Set(selectedItemIds);
    const newQty = { ...quantities };
    ingredients.forEach(i => {
      if (Number(i.stock_current) <= Number(i.stock_min)) {
        lowIds.add(i.id);
        const needed = (Number(i.stock_min) - Number(i.stock_current)) || 1;
        newQty[i.id] = needed > 0 ? needed : 1;
      }
    });
    setSelectedItemIds(lowIds);
    setQuantities(newQty);
    toast('Insumos con stock bajo seleccionados.');
  };

  const handleSelectAll = () => {
    const allIds = new Set(allAvailableItems.map(i => i.id));
    const newQty = { ...quantities };
    allAvailableItems.forEach(i => {
      if (!newQty[i.id]) newQty[i.id] = 1;
    });
    setSelectedItemIds(allIds);
    setQuantities(newQty);
  };

  const handleDeselectAll = () => {
    setSelectedItemIds(new Set());
  };

  // Calcular costo total estimado
  const estimatedTotal = useMemo(() => {
    return Array.from(selectedItemIds).reduce((acc, id) => {
      const item = allAvailableItems.find(i => i.id === id);
      const price = Number(item?.purchase_price) || 0;
      const qty = Number(quantities[id]) || 1;
      return acc + (price * qty);
    }, 0);
  }, [selectedItemIds, allAvailableItems, quantities]);

  // Mensaje generado para WhatsApp
  const generatedWhatsAppMessage = useMemo(() => {
    const itemsList = Array.from(selectedItemIds)
      .map(id => {
        const item = allAvailableItems.find(i => i.id === id);
        if (!item) return null;
        const qty = quantities[id] || 1;
        const unit = item.purchase_unit || 'Unidad';
        const note = itemNotes[id]?.trim() ? ` _(${itemNotes[id].trim()})_` : '';
        return `• *${item.name}:* ${qty} ${unit}${note}`;
      })
      .filter(Boolean);

    const recipientGreeting = customRecipientName.trim() ? ` a ${customRecipientName.trim()}` : '';
    const dateStr = new Date().toLocaleDateString('es-CO', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });

    let msg = `🛒 *PEDIDO DE COMPRAS - ${brandName.toUpperCase()}*\n`;
    msg += `📅 *Fecha:* ${dateStr}\n`;
    if (customRecipientName.trim()) {
      msg += `👤 *Destinatario:* ${customRecipientName.trim()}\n`;
    }
    msg += `\n*ÍTEMS SOLICITADOS (${itemsList.length}):*\n`;
    msg += itemsList.join('\n');

    if (estimatedTotal > 0) {
      msg += `\n\n💰 *Total Estimado:* $${estimatedTotal.toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP`;
    }

    if (deliveryNote.trim()) {
      msg += `\n\n📝 *Notas de entrega / Instrucciones:*\n${deliveryNote.trim()}`;
    }

    msg += `\n\n_Generado desde Aluna QR Menu_`;
    return msg;
  }, [selectedItemIds, allAvailableItems, quantities, itemNotes, customRecipientName, brandName, estimatedTotal, deliveryNote]);

  // Enviar por WhatsApp
  const handleSendWhatsApp = () => {
    if (selectedItemIds.size === 0) {
      toast('Debes seleccionar al menos un insumo para enviar.');
      return;
    }

    const cleanPhone = customPhone.replace(/\D/g, '');
    const waUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(generatedWhatsAppMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(generatedWhatsAppMessage)}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
    toast('Abriendo WhatsApp...');
  };

  // Copiar al portapapeles
  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(generatedWhatsAppMessage);
      setIsCopied(true);
      toast('Mensaje copiado al portapapeles.');
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.error('Error al copiar:', err);
      toast('Error al copiar al portapapeles.');
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-4xl w-full my-auto shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm shrink-0">
                <Icon icon="heroicons:paper-airplane" className="text-xl" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Lista de Compras Personalizada</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    WhatsApp Libre
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Selecciona insumos, agrega notas específicas y envía a cualquier número o contacto sin restricciones.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <Icon icon="heroicons:x-mark" className="text-xl" />
            </button>
          </div>

          {/* Body en 2 Columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
            {/* Columna Izquierda: Selección de Insumos (7 cols) */}
            <div className="lg:col-span-7 p-4 sm:p-5 border-b lg:border-b-0 lg:border-r border-slate-100 space-y-4 overflow-y-auto">
              {/* Acciones Rápidas de Selección */}
              <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
                <span className="text-xs font-bold text-slate-700">
                  Insumos Seleccionados: <strong className="text-emerald-700 font-black">{selectedItemIds.size}</strong>
                </span>
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={handleSelectLowStock}
                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold rounded-md border border-amber-200 transition-colors"
                  >
                    ⚠️ Stock Bajo
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md transition-colors"
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 font-semibold rounded-md transition-colors"
                  >
                    Ninguno
                  </button>
                </div>
              </div>

              {/* Buscador de Insumos */}
              <div className="relative">
                <Icon icon="heroicons:magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  placeholder="Buscar insumo por nombre o SKU..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Lista Scrolleable de Insumos */}
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {filteredItems.map(item => {
                  const isSelected = selectedItemIds.has(item.id);
                  const isLow = Number(item.stock_current) <= Number(item.stock_min);

                  return (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isSelected 
                          ? 'bg-emerald-50/50 border-emerald-300 shadow-2xs' 
                          : 'bg-white border-slate-200/90 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleItem(item.id)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                              <span>{item.name}</span>
                              {item.isAdHoc && (
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-bold">
                                  Libre
                                </span>
                              )}
                              {isLow && !item.isAdHoc && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                                  Bajo ({item.stock_current} / {item.stock_min})
                                </span>
                              )}
                            </p>
                            <span className="text-[10px] text-slate-400 font-medium">
                              Unidad: {item.purchase_unit || 'Unidad'} {item.purchase_price ? `• $${Number(item.purchase_price).toLocaleString()} c/u` : ''}
                            </span>
                          </div>
                        </label>

                        {/* Cantidad */}
                        {isSelected && (
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[11px] font-bold text-slate-500">Cant:</span>
                            <input
                              type="number"
                              min="0.1"
                              step="any"
                              value={quantities[item.id] !== undefined ? quantities[item.id] : 1}
                              onChange={e => updateQuantity(item.id, e.target.value)}
                              className="w-16 text-center text-xs font-bold border border-emerald-300 rounded-md py-1 bg-white text-emerald-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        )}
                      </div>

                      {/* Nota Específica del Ítem */}
                      {isSelected && (
                        <div className="mt-2 pt-2 border-t border-emerald-200/50 flex items-center gap-1.5">
                          <Icon icon="heroicons:pencil" className="text-xs text-emerald-600 shrink-0" />
                          <input
                            type="text"
                            placeholder="Nota para este ítem (ej. 'maduro', 'marca X', 'bien sellado')..."
                            value={itemNotes[item.id] || ''}
                            onChange={e => updateItemNote(item.id, e.target.value)}
                            className="w-full text-[11px] bg-transparent border-none p-0 text-slate-700 placeholder-slate-400 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredItems.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No se encontraron insumos con "{searchQuery}".
                  </div>
                )}
              </div>

              {/* Agregar Ítem Ad-Hoc / Libre */}
              <form onSubmit={handleAddAdHoc} className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="+ Agregar ítem libre no registrado..."
                  value={newAdHocName}
                  onChange={e => setNewAdHocName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Unidad (kg, paq...)"
                  value={newAdHocUnit}
                  onChange={e => setNewAdHocUnit(e.target.value)}
                  className="w-24 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!newAdHocName.trim()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-all shrink-0"
                >
                  Agregar
                </button>
              </form>
            </div>

            {/* Columna Derecha: Destinatario, Notas y Vista Previa (5 cols) */}
            <div className="lg:col-span-5 p-4 sm:p-5 space-y-4 bg-slate-50/50 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                {/* Selector de Destino: Proveedor o Libre */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Destinatario del Pedido</label>
                    <div className="inline-flex bg-slate-200/80 p-0.5 rounded-lg text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setRecipientType('free')}
                        className={`px-2 py-0.5 rounded-md transition-all ${recipientType === 'free' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'}`}
                      >
                        Número Libre
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecipientType('provider')}
                        className={`px-2 py-0.5 rounded-md transition-all ${recipientType === 'provider' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'}`}
                      >
                        Proveedor
                      </button>
                    </div>
                  </div>

                  {recipientType === 'provider' ? (
                    <div>
                      <select
                        value={selectedProviderId}
                        onChange={e => handleSelectProvider(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Selecciona un proveedor registrado...</option>
                        {providers.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.phone ? `(${p.phone})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input
                          type="text"
                          placeholder="Nombre (ej. Don Pedro)"
                          value={customRecipientName}
                          onChange={e => setCustomRecipientName(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <input
                          type="tel"
                          placeholder="+57 310 123 4567"
                          value={customPhone}
                          onChange={e => setCustomPhone(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Instrucciones Generales / Notas de Entrega */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Instrucciones / Notas de Entrega
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Instrucciones de entrega, horarios, condiciones de pago..."
                    value={deliveryNote}
                    onChange={e => setDeliveryNote(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                {/* Vista Previa del Mensaje de WhatsApp */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Icon icon="heroicons:chat-bubble-left-ellipsis" className="text-xs text-emerald-600" />
                      <span>Vista Previa Mensaje WhatsApp</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                      <Icon icon={isCopied ? "heroicons:check" : "heroicons:clipboard"} className="text-xs" />
                      <span>{isCopied ? '¡Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 text-[11px] leading-relaxed font-mono whitespace-pre-wrap max-h-52 overflow-y-auto border border-slate-800">
                    {generatedWhatsAppMessage}
                  </pre>
                </div>
              </div>

              {/* Botones Inferiores de Acción */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  disabled={selectedItemIds.size === 0}
                  className="w-full py-2.5 bg-[#25D366] hover:bg-[#20BE5C] disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.662-2.06r-.006-.002c-.173-.298-.018-.46.13-.608.134-.134.298-.348.446-.522.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span>Enviar por WhatsApp a {customPhone || 'Número Libre'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all text-center"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}

export default CustomShoppingListModal;
