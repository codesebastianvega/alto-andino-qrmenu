import { useState, useMemo, useEffect } from 'react';
import { Badge, SearchInput } from './ui';

export function ShoppingListBoard({ ingredients, providers }) {
  // We need to fetch and manage the dragging state here
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [quantities, setQuantities] = useState({});
  const [providerOverrides, setProviderOverrides] = useState({});
  const [adHocItems, setAdHocItems] = useState([]);
  
  const [leftSearch, setLeftSearch] = useState('');

  // Initial load logic: pre-select low stock items
  useEffect(() => {
    const defaultSelected = new Set();
    const defaultQuantities = {};
    ingredients.forEach(i => {
      if (i.stock_current <= i.stock_min) {
        defaultSelected.add(i.id);
        defaultQuantities[i.id] = (i.stock_min - i.stock_current) || 1;
        if (defaultQuantities[i.id] < 1) defaultQuantities[i.id] = 1;
      }
    });
    setSelectedIds(defaultSelected);
    setQuantities(defaultQuantities);
  }, [ingredients]);

  // Combined Items
  const allItems = useMemo(() => {
    return [...ingredients, ...adHocItems];
  }, [ingredients, adHocItems]);

  const toggleSelection = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
      if (!quantities[id]) {
        setQuantities(prev => ({ ...prev, [id]: 1 }));
      }
    }
    setSelectedIds(next);
  };

  const updateQuantity = (id, value) => {
    const parsed = parseInt(value, 10);
    setQuantities(prev => ({ ...prev, [id]: isNaN(parsed) ? '' : parsed }));
  };

  // The actual drag logic
  const handleDragStart = (e, itemId) => {
    e.dataTransfer.setData('itemId', itemId);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e, targetProviderId) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('itemId');
    if (itemId) {
      setProviderOverrides(prev => ({ ...prev, [itemId]: targetProviderId }));
      // Auto-select if dropped
      if (!selectedIds.has(itemId)) {
         toggleSelection(itemId);
      }
    }
  };

  // Grouping for the Right Column
  const providerPanels = useMemo(() => {
    const panels = { 'sin-proveedor': [] };
    providers.forEach(p => { panels[p.id] = []; });

    selectedIds.forEach(id => {
      const item = allItems.find(i => i.id === id);
      if (item) {
        const pId = providerOverrides[id] !== undefined ? providerOverrides[id] : (item.provider_id || 'sin-proveedor');
        if (!panels[pId]) panels[pId] = [];
        panels[pId].push(item);
      }
    });
    return panels;
  }, [allItems, providers, selectedIds, providerOverrides]);

  // Left Column (Available Items) filter
  const leftColumnItems = useMemo(() => {
    return allItems
      .filter(i => !selectedIds.has(i.id)) // Only show unselected items on the left board (or show all?)
      // Actually, Kanban usually moves cards. So if it's selected, it's on the right.
      .filter(i => {
        if (!leftSearch) return true;
        return i.name.toLowerCase().includes(leftSearch.toLowerCase()) || 
               (i.sku || '').toLowerCase().includes(leftSearch.toLowerCase());
      });
  }, [allItems, selectedIds, leftSearch]);

  const handleAddAdHoc = () => {
    if (!leftSearch.trim()) return;
    const newItem = {
      id: `adhoc-${Date.now()}`,
      name: leftSearch.trim(),
      sku: 'AD-HOC',
      purchase_unit: 'Unidad',
      purchase_price: 0,
      stock_current: 0,
      stock_min: 0,
      isAdHoc: true
    };
    setAdHocItems(prev => [...prev, newItem]);
    setLeftSearch('');
    // Auto drop it in "sin-proveedor" and select it
    setProviderOverrides(prev => ({ ...prev, [newItem.id]: 'sin-proveedor' }));
    toggleSelection(newItem.id);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[800px]">
      {/* Left Column: Available Inventory */}
      <div className="w-full lg:w-1/3 flex flex-col bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-white shadow-sm z-10">
          <h2 className="text-lg font-bold text-gray-900">Insumos Disponibles</h2>
          <p className="text-xs text-gray-500 mb-3">Arrastra los items hacia los proveedores</p>
          <div className="flex gap-2">
            <SearchInput 
              value={leftSearch} 
              onChange={e => setLeftSearch(e.target.value)} 
              placeholder="Buscar para agregar..." 
            />
          </div>
          {leftSearch && !leftColumnItems.length && (
            <button 
              onClick={handleAddAdHoc}
              className="mt-2 w-full py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-semibold transition-colors border border-emerald-200 border-dashed"
            >
              + Agregar "{leftSearch}" como Ad-Hoc
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {leftColumnItems.map(item => (
            <div 
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item.id)}
              className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between group"
            >
              <div>
                <p className="text-sm font-bold text-gray-800">{item.name}</p>
                <div className="flex gap-2 text-[10px] text-gray-500 mt-1 font-medium">
                  {item.isAdHoc ? (
                    <Badge variant="blue">Ad-Hoc</Badge>
                  ) : (
                    <>
                      <span>Stock: <strong className={item.stock_current <= item.stock_min ? "text-red-500" : ""}>{item.stock_current}</strong></span>
                      <span>Mín: {item.stock_min}</span>
                    </>
                  )}
                </div>
              </div>
              <button 
                onClick={() => toggleSelection(item.id)}
                className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-center transition-colors"
                title="Añadir a la lista"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>
          ))}
          {leftColumnItems.length === 0 && !leftSearch && (
            <div className="text-center py-10 text-gray-400 text-sm font-medium">
              Todos los insumos están en la lista.
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Providers Drop Zones */}
      <div className="w-full lg:w-2/3 flex flex-col bg-gray-100/50 rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-white shadow-sm z-10 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Pedidos por Proveedor</h2>
            <p className="text-xs text-gray-500">Suelta los insumos en el proveedor correspondiente</p>
          </div>
          <Badge variant="blue" className="text-sm px-3 py-1">{selectedIds.size} items en total</Badge>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {['sin-proveedor', ...providers.map(p => p.id)].map(provId => {
            const isSin = provId === 'sin-proveedor';
            const provider = isSin ? null : providers.find(p => p.id === provId);
            const provName = isSin ? 'Sin proveedor asignado' : provider.name;
            const items = providerPanels[provId] || [];

            if (items.length === 0 && isSin) return null; // Hide empty sin proveedor? Maybe keep it as drop zone.

            const estimatedCost = items.reduce((acc, i) => acc + ((i.purchase_price || 0) * (quantities[i.id] || 1)), 0);
            
            const message = `Hola${provider ? ` ${provider.name}` : ''}, necesito hacer el siguiente pedido:\n` + 
              items.map(i => `- ${quantities[i.id] || 1}x ${i.purchase_unit || 'Unidad'} de ${i.name}`).join('\n');
            const waLink = provider?.phone
              ? `https://wa.me/${provider.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
              : `https://wa.me/?text=${encodeURIComponent(message)}`;

            return (
              <div 
                key={provId} 
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, provId)}
                className={`bg-white rounded-xl border-2 transition-colors flex flex-col max-h-[400px] ${
                  items.length > 0 ? 'border-blue-100 shadow-sm' : 'border-dashed border-gray-200 opacity-60 hover:opacity-100'
                }`}
              >
                {/* Provider Header */}
                <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0 rounded-t-xl">
                  <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                    {provName}
                    <Badge variant={items.length > 0 ? "emerald" : "gray"}>{items.length}</Badge>
                  </h3>
                </div>

                {/* Items Drop Zone */}
                <div className="p-3 flex-1 overflow-y-auto space-y-2 min-h-[100px]">
                  {items.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-gray-400 font-medium">
                      Arrastra insumos aquí
                    </div>
                  ) : (
                    items.map(item => (
                      <div key={item.id} className="group flex flex-col gap-2 p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:border-blue-200 transition-colors">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-semibold text-gray-800 leading-tight pr-4">{item.name}</p>
                          <button 
                            onClick={() => toggleSelection(item.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-[10px] text-gray-400 font-medium">
                            {item.purchase_unit || 'Unidad'} <span className="mx-1">•</span> ${item.purchase_price || 0} c/u
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-gray-400">Cant:</span>
                            <input 
                              type="number" 
                              min="1"
                              value={quantities[item.id] || ''}
                              onChange={(e) => updateQuantity(item.id, e.target.value)}
                              className="w-14 text-center text-sm font-bold border border-gray-200 rounded py-0.5 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-blue-700"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Provider Footer */}
                {items.length > 0 && (
                  <div className="p-3 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0 rounded-b-xl">
                    <div className="text-xs font-semibold text-gray-500">
                      Total: <span className="text-gray-900">${estimatedCost.toLocaleString()}</span>
                    </div>
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold bg-[#25D366] text-white hover:bg-[#20BE5C] px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.662-2.06r-.006-.002c-.173-.298-.018-.46.13-.608.134-.134.298-.348.446-.522.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      Enviar
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
