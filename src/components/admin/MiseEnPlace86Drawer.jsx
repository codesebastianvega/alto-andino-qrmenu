import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Icon } from '@iconify-icon/react';
import Portal from '../Portal';
import { supabase } from '../../config/supabase';
import { toast } from '../Toast';

export function MiseEnPlace86Drawer({
  isOpen,
  onClose,
  isDark = false,
  activeBrandId,
  activeLocationId = null
}) {
  const [items, setItems] = useState([]);
  const [dependencies, setDependencies] = useState({});
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'depleted' | 'low' | 'ok'
  const [editingItem, setEditingItem] = useState(null);
  const [customGrams, setCustomGrams] = useState('');

  // 1. Cargar subrecetas e insumos de servicio de mise en place
  const loadMiseEnPlace = useCallback(async () => {
    if (!activeBrandId) return;
    try {
      setLoading(true);

      // A. Insumos de mise en place / subrecetas
      const { data: ingData, error: ingError } = await supabase
        .from('ingredients')
        .select(`
          id,
          name,
          category,
          usage_unit,
          portion_size,
          stock_current,
          stock_min,
          is_subrecipe,
          subrecipe_id,
          storage_location
        `)
        .eq('brand_id', activeBrandId)
        .or('is_subrecipe.eq.true,storage_location.ilike.%mise%,storage_location.ilike.%linea%,storage_location.ilike.%preparac%,storage_location.ilike.%caliente%,storage_location.ilike.%nevera%,is_modifier.eq.true')
        .order('name');

      if (ingError) throw ingError;

      // B. Mapeo de dependencias (platos y modificadores vinculados)
      const [recIngRes, prodRes, modRes] = await Promise.all([
        supabase.from('recipe_ingredients').select('ingredient_id, recipe_id'),
        supabase.from('products').select('id, name, recipe_id').eq('brand_id', activeBrandId),
        supabase.from('modifier_options').select('id, name, ingredient_id, recipe_id')
      ]);

      const depMap = {};
      const recIngs = recIngRes.data || [];
      const prods = prodRes.data || [];
      const mods = modRes.data || [];

      // Mapear cada ingrediente a sus platos fijos y opciones
      (ingData || []).forEach(ing => {
        // Platos directos o por recipe_id
        const recipeIds = recIngs
          .filter(ri => ri.ingredient_id === ing.id)
          .map(ri => ri.recipe_id);

        const dependentProds = prods
          .filter(p => p.recipe_id && recipeIds.includes(p.recipe_id))
          .map(p => p.name);

        // Modificadores directos o por subrecipe_id
        const dependentMods = mods
          .filter(m => m.ingredient_id === ing.id || (ing.subrecipe_id && m.recipe_id === ing.subrecipe_id))
          .map(m => m.name);

        depMap[ing.id] = {
          products: Array.from(new Set(dependentProds)),
          modifiers: Array.from(new Set(dependentMods))
        };
      });

      setDependencies(depMap);
      setItems(ingData || []);
    } catch (err) {
      console.error('Error loading mise en place items:', err);
      toast('Error al cargar insumos de mise en place');
    } finally {
      setLoading(false);
    }
  }, [activeBrandId]);

  useEffect(() => {
    if (isOpen) {
      loadMiseEnPlace();
    }
  }, [isOpen, loadMiseEnPlace]);

  // 2. Ejecutar acción de 1-toque en Postgres RPC
  const handleQuickAction = async (item, action, customQty = 0) => {
    try {
      setProcessingId(item.id);

      const { data, error } = await supabase.rpc('fn_mise_en_place_quick_86', {
        p_ingredient_id: item.id,
        p_action: action,
        p_quantity: customQty,
        p_location_id: activeLocationId || null
      });

      if (error) throw error;

      const newStock = Number(data?.new_stock ?? (action === 'exhaust' ? 0 : customQty));

      // Actualizar estado local inmediatamente
      setItems(prev => prev.map(it => it.id === item.id ? { ...it, stock_current: newStock } : it));

      const deps = dependencies[item.id] || { products: [], modifiers: [] };
      const totalDeps = deps.products.length + deps.modifiers.length;

      if (action === 'exhaust') {
        toast(`🛑 ${item.name} marcado AGOTADO (86). ${totalDeps > 0 ? `${totalDeps} platos/opciones deshabilitados en el menú.` : ''}`);
      } else if (action === 'restock_batch') {
        toast(`🍲 Bache de ${item.name} listo (${newStock} ${item.usage_unit || 'g'}). Platos reactivados en el menú.`);
      } else {
        toast(`✅ Stock de ${item.name} ajustado a ${newStock} ${item.usage_unit || 'g'}.`);
      }

      setEditingItem(null);
      setCustomGrams('');
    } catch (err) {
      console.error('Error applying quick 86 action:', err);
      toast('Error al actualizar disponibilidad');
    } finally {
      setProcessingId(null);
    }
  };

  // 3. Cálculos de estado y porciones para filtrado
  const computedItems = useMemo(() => {
    return items.map(item => {
      const portionSize = Number(item.portion_size) || 100;
      const stock = Number(item.stock_current) || 0;
      const portions = Math.floor(stock / Math.max(portionSize, 1));
      const isOut = portions <= 0;
      const isLow = portions > 0 && portions <= 5;
      const isSingle = portions === 1;
      const deps = dependencies[item.id] || { products: [], modifiers: [] };

      return {
        ...item,
        portionSize,
        stock,
        portions,
        isOut,
        isLow,
        isSingle,
        dependentProducts: deps.products,
        dependentModifiers: deps.modifiers,
        totalDependents: deps.products.length + deps.modifiers.length
      };
    });
  }, [items, dependencies]);

  // Contadores para badges del header
  const counts = useMemo(() => {
    const depleted = computedItems.filter(i => i.isOut).length;
    const low = computedItems.filter(i => i.isLow).length;
    const ok = computedItems.filter(i => !i.isOut && !i.isLow).length;
    return { depleted, low, ok, total: computedItems.length };
  }, [computedItems]);

  // Filtrado por buscador y estado
  const filteredItems = useMemo(() => {
    let result = computedItems;

    if (filterMode === 'depleted') {
      result = result.filter(i => i.isOut);
    } else if (filterMode === 'low') {
      result = result.filter(i => i.isLow);
    } else if (filterMode === 'ok') {
      result = result.filter(i => !i.isOut && !i.isLow);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => 
        i.name.toLowerCase().includes(q) ||
        (i.storage_location && i.storage_location.toLowerCase().includes(q)) ||
        i.dependentProducts.some(p => p.toLowerCase().includes(q)) ||
        i.dependentModifiers.some(m => m.toLowerCase().includes(q))
      );
    }

    // Ordenar: primero agotados, luego stock bajo, luego alfabético
    return result.sort((a, b) => {
      if (a.isOut !== b.isOut) return a.isOut ? -1 : 1;
      if (a.isLow !== b.isLow) return a.isLow ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [computedItems, filterMode, searchQuery]);

  if (!isOpen) return null;

  return (
    <Portal targetId="modal-root">
      <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
        {/* Backdrop click to close */}
        <div className="fixed inset-0 -z-10" onClick={onClose} />

        {/* Drawer Content */}
        <div className={`w-full max-w-2xl h-full flex flex-col shadow-2xl transition-transform animate-in slide-in-from-right duration-300 ${
          isDark ? 'bg-[#0f1422] text-gray-100 border-l border-gray-800' : 'bg-slate-50 text-slate-900 border-l border-slate-200'
        }`}>
          {/* Header */}
          <div className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 ${
            isDark ? 'border-gray-800 bg-gray-900/80' : 'border-slate-200 bg-white'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center text-xl shrink-0">
                ⚡
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black tracking-tight">
                    Mise en Place & Auto-86
                  </h2>
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    counts.depleted > 0 
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {counts.depleted} agotados
                  </span>
                </div>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  Control táctil de 1-toque: agota o reactiva platos en tiempo real en la carta.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={loadMiseEnPlace}
                disabled={loading}
                title="Refrescar insumos"
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon icon="heroicons:arrow-path" className={`text-lg ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon icon="heroicons:x-mark" className="text-xl" />
              </button>
            </div>
          </div>

          {/* Quick Filters & Search */}
          <div className={`p-3.5 border-b space-y-2.5 ${
            isDark ? 'border-gray-800 bg-gray-900/40' : 'border-slate-200 bg-slate-100/60'
          }`}>
            {/* Search Input */}
            <div className="relative">
              <Icon 
                icon="heroicons:magnifying-glass" 
                className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${isDark ? 'text-gray-400' : 'text-slate-400'}`} 
              />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar subreceta, insumo o plato dependiente..."
                className={`w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-lg border focus:outline-none transition-colors ${
                  isDark 
                    ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-amber-500' 
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-xs ${isDark ? 'text-gray-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
                >
                  <Icon icon="heroicons:x-mark" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded-full font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  filterMode === 'all'
                    ? (isDark ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-900 text-white font-black')
                    : (isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-slate-600 border border-slate-200')
                }`}
              >
                <span>Todas</span>
                <span className="opacity-70 font-mono text-[11px]">{counts.total}</span>
              </button>

              <button
                onClick={() => setFilterMode('depleted')}
                className={`px-3 py-1 rounded-full font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  filterMode === 'depleted'
                    ? 'bg-rose-600 text-white font-black'
                    : (isDark ? 'bg-gray-800 text-rose-400 hover:bg-gray-700' : 'bg-white text-rose-700 border border-rose-200')
                }`}
              >
                <span>🛑 Agotadas (86)</span>
                <span className="font-mono text-[11px] px-1 rounded bg-rose-500/20">{counts.depleted}</span>
              </button>

              <button
                onClick={() => setFilterMode('low')}
                className={`px-3 py-1 rounded-full font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  filterMode === 'low'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : (isDark ? 'bg-gray-800 text-amber-400 hover:bg-gray-700' : 'bg-white text-amber-700 border border-amber-200')
                }`}
              >
                <span>⚡ Stock Bajo (1-5 porc.)</span>
                <span className="font-mono text-[11px] px-1 rounded bg-amber-500/20">{counts.low}</span>
              </button>

              <button
                onClick={() => setFilterMode('ok')}
                className={`px-3 py-1 rounded-full font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  filterMode === 'ok'
                    ? 'bg-emerald-600 text-white font-black'
                    : (isDark ? 'bg-gray-800 text-emerald-400 hover:bg-gray-700' : 'bg-white text-emerald-700 border border-emerald-200')
                }`}
              >
                <span>🟢 Disponible</span>
                <span className="font-mono text-[11px] px-1 rounded bg-emerald-500/20">{counts.ok}</span>
              </button>
            </div>
          </div>

          {/* List of Mise en Place Subrecipes */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3">
            {loading && items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Icon icon="line-md:loading-loop" className="text-3xl text-amber-500 mb-2" />
                <p className="text-xs uppercase tracking-wider font-bold">Cargando mise en place...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center">
                <Icon icon="solar:box-minimalistic-bold" className="text-4xl mb-2 opacity-50" />
                <p className="text-sm font-semibold">No se encontraron preparaciones</p>
                <p className="text-xs opacity-75 mt-0.5">Prueba con otro término de búsqueda o filtro</p>
              </div>
            ) : (
              filteredItems.map(item => {
                const isProcessing = processingId === item.id;
                const isEditing = editingItem?.id === item.id;

                let cardBorder = isDark ? 'border-gray-800/90 bg-gray-900/60' : 'border-slate-200 bg-white';
                if (item.isOut) {
                  cardBorder = isDark ? 'border-rose-900/60 bg-rose-950/20' : 'border-rose-200 bg-rose-50/50';
                } else if (item.isLow) {
                  cardBorder = isDark ? 'border-amber-900/60 bg-amber-950/20' : 'border-amber-200 bg-amber-50/50';
                }

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-4 transition-all shadow-xs flex flex-col gap-3 ${cardBorder}`}
                  >
                    {/* Top Row: Name, Storage & Portions Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm sm:text-base tracking-tight">
                            {item.name}
                          </h3>
                          {item.is_subrecipe && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                              isDark ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}>
                              Subreceta
                            </span>
                          )}
                        </div>

                        {item.storage_location && (
                          <p className={`text-[11px] flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                            <Icon icon="heroicons:map-pin" className="text-xs opacity-75 shrink-0" />
                            <span>{item.storage_location}</span>
                          </p>
                        )}
                      </div>

                      {/* Portions Badge */}
                      <div className="text-right shrink-0">
                        {item.isOut ? (
                          <div className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-lg bg-rose-600 text-white shadow-xs">
                            <Icon icon="heroicons:no-symbol" className="text-sm" />
                            <span>86 AGOTADO</span>
                          </div>
                        ) : item.isSingle ? (
                          <div className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 shadow-xs animate-pulse">
                            <span>🔥 ¡Última porción!</span>
                          </div>
                        ) : item.isLow ? (
                          <div className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-500 border border-amber-500/30">
                            <Icon icon="heroicons:bolt" className="text-xs" />
                            <span>Quedan {item.portions} porc.</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <Icon icon="heroicons:check-circle" className="text-xs" />
                            <span>{item.portions} porciones</span>
                          </div>
                        )}
                        <p className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                          {item.stock} {item.usage_unit || 'g'} (~{item.portionSize}g / porc)
                        </p>
                      </div>
                    </div>

                    {/* Middle: Impacted Dishes & Modifiers */}
                    {item.totalDependents > 0 && (
                      <div className={`p-2 rounded-xl text-xs space-y-1 border ${
                        isDark ? 'bg-gray-950/60 border-gray-800' : 'bg-white/80 border-slate-200'
                      }`}>
                        <p className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                          item.isOut 
                            ? 'text-rose-500' 
                            : (isDark ? 'text-gray-400' : 'text-slate-600')
                        }`}>
                          <Icon icon={item.isOut ? "heroicons:exclamation-triangle" : "heroicons:link"} />
                          <span>
                            {item.isOut ? 'Deshabilitados en el Menú:' : 'Afecta a:'}
                          </span>
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {item.dependentProducts.map(pName => (
                            <span 
                              key={pName} 
                              className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                                item.isOut
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 line-through'
                                  : (isDark ? 'bg-gray-800 text-gray-200 border-gray-700' : 'bg-slate-100 text-slate-700 border-slate-200')
                              }`}
                            >
                              🍱 {pName}
                            </span>
                          ))}
                          {item.dependentModifiers.map(mName => (
                            <span 
                              key={mName} 
                              className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                                item.isOut
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 line-through'
                                  : (isDark ? 'bg-gray-800 text-gray-200 border-gray-700' : 'bg-slate-100 text-slate-700 border-slate-200')
                              }`}
                            >
                              ⚙️ {mName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Inline Adjuster Mode */}
                    {isEditing ? (
                      <div className={`p-3 rounded-xl border flex flex-col gap-2 ${
                        isDark ? 'bg-gray-950 border-gray-800' : 'bg-slate-100 border-slate-300'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">Ajustar Stock Manual ({item.usage_unit || 'g'}):</span>
                          <button
                            onClick={() => { setEditingItem(null); setCustomGrams(''); }}
                            className="text-xs text-slate-400 hover:text-slate-600"
                          >
                            Cancelar
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={customGrams}
                            onChange={e => setCustomGrams(e.target.value)}
                            placeholder={`Ej: ${item.stock || 500}`}
                            className={`flex-1 px-3 py-2 text-sm font-bold rounded-lg border focus:outline-none ${
                              isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                          <button
                            onClick={() => handleQuickAction(item, 'set_grams', Number(customGrams) || 0)}
                            disabled={isProcessing}
                            className="h-10 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider"
                          >
                            Guardar
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {/* Bottom Action Buttons (52px Touch Targets for Kitchen Tablets) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                      {/* Action 1: 86 Agotado */}
                      <button
                        onClick={() => handleQuickAction(item, 'exhaust')}
                        disabled={isProcessing || item.isOut}
                        className={`h-12 px-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                          item.isOut
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 opacity-70 cursor-not-allowed'
                            : 'bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white'
                        }`}
                      >
                        {isProcessing ? (
                          <Icon icon="line-md:loading-loop" className="text-base" />
                        ) : (
                          <>
                            <Icon icon="heroicons:no-symbol" className="text-base" />
                            <span>86 Agotar</span>
                          </>
                        )}
                      </button>

                      {/* Action 2: Bache Listo (+Yield) */}
                      <button
                        onClick={() => handleQuickAction(item, 'restock_batch')}
                        disabled={isProcessing}
                        className={`h-12 px-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-[0.98] ${
                          item.isOut
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
                            : (isDark ? 'bg-gray-800 hover:bg-gray-700 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200')
                        }`}
                      >
                        {isProcessing ? (
                          <Icon icon="line-md:loading-loop" className="text-base" />
                        ) : (
                          <>
                            <Icon icon="heroicons:arrow-path" className="text-base" />
                            <span>Bache Listo</span>
                          </>
                        )}
                      </button>

                      {/* Action 3: Ajustar Manual (+/-) */}
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setCustomGrams(String(item.stock || ''));
                        }}
                        className={`col-span-2 sm:col-span-1 h-12 px-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border shadow-xs ${
                          isDark 
                            ? 'bg-gray-800/80 hover:bg-gray-700 text-gray-300 border-gray-700' 
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <Icon icon="heroicons:adjustments-horizontal" className="text-base" />
                        <span>Ajustar</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer Status */}
          <div className={`p-3.5 border-t flex items-center justify-between text-xs ${
            isDark ? 'border-gray-800 bg-gray-900/90 text-gray-400' : 'border-slate-200 bg-white text-slate-600'
          }`}>
            <span className="font-medium">
              Sede: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{activeLocationId ? 'Sede Actual' : 'General (Todas)'}</strong>
            </span>
            <span className="font-mono text-[11px] opacity-75">
              Aluna Auto-86 Engine v2.0
            </span>
          </div>
        </div>
      </div>
    </Portal>
  );
}
