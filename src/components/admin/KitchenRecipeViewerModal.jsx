import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from '@iconify-icon/react';
import Portal from '../Portal';
import { supabase } from '../../config/supabase';

export function KitchenRecipeViewerModal({ recipe, allRecipes = [], isOpen, onClose, onPrepareBatch }) {
  const [multiplier, setMultiplier] = useState(1);
  const [activeTab, setActiveTab] = useState('grams'); // 'grams' | 'steps' | 'modifiers' | 'economics'
  const [selectedSubrecipe, setSelectedSubrecipe] = useState(null);
  const [checkedSteps, setCheckedSteps] = useState({});
  const [linkedProduct, setLinkedProduct] = useState(null);
  const [modifierHierarchy, setModifierHierarchy] = useState([]);
  const [loadingModifiers, setLoadingModifiers] = useState(false);

  // Si se seleccionó una subreceta para ver en detalle, cambiamos el foco temporalmente
  const currentRecipe = selectedSubrecipe || recipe;
  const isSubrecipe = Boolean(currentRecipe?.is_subrecipe);
  const ingredients = currentRecipe?.recipe_ingredients || [];

  // Cargar producto vinculado y su jerarquía de modificadores + sub-modificadores
  useEffect(() => {
    let isMounted = true;
    async function loadModifiersForRecipe() {
      if (!isOpen || !currentRecipe?.id || currentRecipe?.is_subrecipe) {
        if (isMounted) {
          setLinkedProduct(null);
          setModifierHierarchy([]);
        }
        return;
      }
      setLoadingModifiers(true);
      try {
        const { data: prodData } = await supabase
          .from('products')
          .select('id, name, price, modifier_groups')
          .eq('recipe_id', currentRecipe.id)
          .maybeSingle();

        if (!prodData || !Array.isArray(prodData.modifier_groups) || prodData.modifier_groups.length === 0) {
          if (isMounted) {
            setLinkedProduct(prodData || null);
            setModifierHierarchy([]);
            setLoadingModifiers(false);
          }
          return;
        }

        const { data: allGroups } = await supabase
          .from('modifier_groups')
          .select('*, modifier_options!modifier_options_group_id_fkey(*)')
          .eq('brand_id', currentRecipe.brand_id);

        if (isMounted && allGroups) {
          const groupMap = new Map(allGroups.map(g => [g.id, g]));
          const hierarchy = prodData.modifier_groups
            .map(gid => groupMap.get(gid))
            .filter(Boolean)
            .map(group => {
              const sortedOpts = [...(group.modifier_options || [])]
                .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                .map(opt => {
                  const nestedGroup = opt.nested_group_id ? groupMap.get(opt.nested_group_id) : null;
                  const nestedOptions = nestedGroup
                    ? [...(nestedGroup.modifier_options || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                    : [];
                  return {
                    ...opt,
                    nestedGroup: nestedGroup ? { ...nestedGroup, options: nestedOptions } : null
                  };
                });
              return {
                ...group,
                options: sortedOpts
              };
            });

          setLinkedProduct(prodData);
          setModifierHierarchy(hierarchy);
        }
      } catch (err) {
        console.error('Error loading modifiers for recipe viewer:', err);
      } finally {
        if (isMounted) setLoadingModifiers(false);
      }
    }
    loadModifiersForRecipe();
    return () => { isMounted = false; };
  }, [isOpen, currentRecipe?.id, currentRecipe?.is_subrecipe, currentRecipe?.brand_id]);

  // Pasos de preparación (desde step_by_step en jsonb o fallback de instrucciones)
  const steps = useMemo(() => {
    if (!currentRecipe) return [];
    if (Array.isArray(currentRecipe.step_by_step) && currentRecipe.step_by_step.length > 0) {
      return currentRecipe.step_by_step;
    }
    if (currentRecipe.instructions) {
      return currentRecipe.instructions.split('\n').filter(Boolean).map((text, idx) => ({
        step: idx + 1,
        title: `Paso ${idx + 1}`,
        desc: text,
        station: 'Cocina'
      }));
    }
    return [];
  }, [currentRecipe]);

  const toggleStep = (stepNum) => {
    setCheckedSteps(prev => ({
      ...prev,
      [stepNum]: !prev[stepNum]
    }));
  };

  const resetSteps = () => {
    setCheckedSteps({});
  };

  const handleClose = () => {
    setSelectedSubrecipe(null);
    setMultiplier(1);
    if (onClose) onClose();
  };

  // Helper para escalar números de gramaje o medidas dentro del texto del paso (ej: "150g" -> "600g" en 4x)
  const scaleTextMeasurements = (text, mult) => {
    if (!text || mult <= 1) return text;
    // Busca patrones como "150g", "150 g", "35ml", "35 ml", "10ml", "180g"
    return text.replace(/(\b\d+(?:\.\d+)?)\s*(g|gr|gramos|ml|mililitros|oz|onzas)\b/gi, (match, numStr, unit) => {
      const originalNum = parseFloat(numStr);
      if (isNaN(originalNum)) return match;
      const scaled = Math.round(originalNum * mult * 10) / 10;
      return `${scaled}${unit} (${originalNum}${unit} × ${mult})`;
    });
  };

  // Retorno temprano condicional SIEMPRE después de declarar todos los Hooks
  if (!isOpen || !recipe || !currentRecipe) return null;

  // Cálculo de costos unitarios y escalados
  const totalScaledCost = (currentRecipe.total_cost || 0) * (isSubrecipe ? 1 : multiplier);
  const targetPrice = (currentRecipe.target_price || 0) * (isSubrecipe ? 1 : multiplier);
  const grossMargin = targetPrice > 0 ? ((targetPrice - totalScaledCost) / targetPrice) * 100 : 0;

  return (
    <Portal>
      <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-0 overflow-hidden animate-fade-in">
        {/* Modal Container: Pantalla completa en tablet, celular y desktop */}
        <div className="bg-white w-full h-full max-w-none max-h-none rounded-none shadow-2xl flex flex-col overflow-hidden border-none">
        
        {/* ── Top Bar Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 shrink-0 relative">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {selectedSubrecipe ? (
                <button
                  onClick={() => setSelectedSubrecipe(null)}
                  className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all shrink-0"
                  title="Volver al plato principal"
                >
                  <Icon icon="heroicons:arrow-left" className="text-lg" />
                </button>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <Icon icon={isSubrecipe ? "heroicons:beaker" : "heroicons:book-open"} className="text-xl" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                    isSubrecipe 
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                      : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                  }`}>
                    {isSubrecipe ? 'Sub-receta (Mise en Place)' : 'Plato Final (Ensamble)'}
                  </span>
                  {currentRecipe.prep_time_minutes && (
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <Icon icon="heroicons:clock" className="text-xs" />
                      {currentRecipe.prep_time_minutes} min
                    </span>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white truncate mt-0.5">
                  {currentRecipe.name}
                </h3>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all shrink-0"
            >
              <Icon icon="heroicons:x-mark" className="text-xl" />
            </button>
          </div>

          {/* Selector de Multiplicador de Porciones (Solo para platos de ensamble) */}
          {!isSubrecipe && (
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Icon icon="heroicons:calculator" className="text-sm text-indigo-400" />
                Porciones simultáneas:
              </span>
              <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                {[1, 2, 3, 4, 6].map(num => (
                  <button
                    key={num}
                    onClick={() => setMultiplier(num)}
                    className={`w-8 h-7 rounded-md font-bold text-xs transition-all ${
                      multiplier === num 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {num}x
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Información del Bache (Si es subreceta) */}
          {isSubrecipe && (
            <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Icon icon="heroicons:scale" className="text-amber-400 text-sm" />
                  <span>Rendimiento: <strong className="text-white font-mono">{currentRecipe.batch_yield || 0} {currentRecipe.batch_unit || 'g'}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Icon icon="heroicons:calendar" className="text-emerald-400 text-sm" />
                  <span>Vida útil: <strong className="text-white font-mono">{currentRecipe.shelf_life_days || 1} días</strong></span>
                </div>
                {currentRecipe.storage_location && (
                  <div className="flex items-center gap-1.5 text-indigo-300">
                    <Icon icon="heroicons:map-pin" className="text-indigo-400 text-sm" />
                    <span>{currentRecipe.storage_location}</span>
                  </div>
                )}
              </div>
              {onPrepareBatch && (
                <button
                  type="button"
                  onClick={() => onPrepareBatch(currentRecipe)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                >
                  <span>🍳</span>
                  <span>Preparar este Bache</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Sub Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 py-2 shrink-0 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('grams')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'grams' 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Icon icon="heroicons:scale" className="text-sm text-indigo-600" />
            <span>Gramera & Pesos ({ingredients.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('steps')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'steps' 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Icon icon="heroicons:clipboard-document-list" className="text-sm text-indigo-600" />
            <span>Paso a Paso ({steps.length})</span>
          </button>

          {!isSubrecipe && (
            <button
              onClick={() => setActiveTab('modifiers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                activeTab === 'modifiers' 
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon icon="heroicons:adjustments-horizontal" className="text-sm text-amber-600" />
              <span>Modificadores & Rappi ({modifierHierarchy.length})</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('economics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'economics' 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Icon icon="heroicons:banknotes" className="text-sm text-emerald-600" />
            <span>Costos & Margen</span>
          </button>
        </div>

        {/* ── Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* ════ TAB 1: GRAMERA & INSUMOS ════ */}
          {activeTab === 'grams' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {isSubrecipe ? 'Pesaje del Bache Completo' : `Porcionado en Gramera (${multiplier} ${multiplier === 1 ? 'Bowl' : 'Bowls'})`}
                  </h4>
                  <p className="text-xs text-slate-500 font-normal">
                    Tarar en 0g antes de cada adición. Seguir el orden de montaje.
                  </p>
                </div>
                {!isSubrecipe && multiplier > 1 && (
                  <span className="bg-indigo-50 text-indigo-600 border border-indigo-200 px-2.5 py-0.5 rounded-md text-xs font-bold">
                    Multiplicado × {multiplier}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {ingredients.map((ri, index) => {
                  const baseQty = Number(ri.quantity) || 0;
                  const scaledQty = baseQty * (isSubrecipe ? 1 : multiplier);
                  const ing = ri.ingredients || {};
                  const isPrepSubrecipe = ing.name?.toLowerCase().includes('subreceta');

                  // Buscar si existe la subreceta en la lista global de recetas (por ID o por nombre flexible)
                  const matchingSubrecipe = isPrepSubrecipe 
                    ? (
                        (ing.subrecipe_id && allRecipes.find(r => r.id === ing.subrecipe_id)) ||
                        allRecipes.find(r => r.is_subrecipe && (
                          ing.name?.toLowerCase().includes(r.name.toLowerCase().split('(')[0].trim().toLowerCase()) ||
                          r.name?.toLowerCase().includes(ing.name.toLowerCase().replace(/\(subreceta\)/i, '').trim().toLowerCase()) ||
                          (ing.name?.toLowerCase().includes('goulash') && r.name?.toLowerCase().includes('goulash'))
                        ))
                      )
                    : null;

                  return (
                    <div 
                      key={ri.ingredient_id || index}
                      className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-sm transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {index + 1}
                        </div>
                        {ing.image_url && (
                          <img
                            src={ing.image_url}
                            alt={ing.name}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0 bg-white shadow-2xs"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {ing.name}
                            </p>
                            {isPrepSubrecipe && (
                              <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                Subreceta
                              </span>
                            )}
                          </div>
                          
                          {/* Ubicación de almacenamiento */}
                          {ri.storage_location || ing.storage_location ? (
                            <p className="text-xs text-indigo-600 font-medium flex items-center gap-1 mt-0.5">
                              <Icon icon="heroicons:map-pin" className="text-xs" />
                              <span>{ri.storage_location || ing.storage_location}</span>
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {/* Botón para ver subreceta si aplica */}
                        {matchingSubrecipe && (
                          <button
                            onClick={() => setSelectedSubrecipe(matchingSubrecipe)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-sm border border-amber-600 transition-all cursor-pointer"
                            title="Ver receta de elaboración"
                          >
                            <Icon icon="heroicons:eye" className="text-xs" />
                            <span>Ver Ficha</span>
                          </button>
                        )}

                        {/* Gramaje Destacado */}
                        <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-right min-w-[75px] shadow-sm">
                          <p className="text-base font-bold font-mono leading-none">
                            {scaledQty.toLocaleString('es-CO')}
                          </p>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mt-0.5">
                            {ing.usage_unit || 'g'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════ TAB 2: PASO A PASO DE COCINA ════ */}
          {activeTab === 'steps' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Instrucciones de Cocina y Ensamble
                  </h4>
                  <p className="text-xs text-slate-500 font-normal">
                    Toca cada paso a medida que avanzas para confirmar la línea de producción.
                  </p>
                </div>
                {Object.keys(checkedSteps).length > 0 && (
                  <button
                    onClick={resetSteps}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Reiniciar marcas
                  </button>
                )}
              </div>

              {steps.length === 0 ? (
                <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Icon icon="heroicons:document-text" className="text-3xl mb-2 opacity-50 mx-auto" />
                  <p className="text-sm font-semibold text-slate-600">No hay pasos detallados registrados.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {steps.map(step => {
                    const isDone = Boolean(checkedSteps[step.step]);
                    return (
                      <div
                        key={step.step}
                        onClick={() => toggleStep(step.step)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                          isDone 
                            ? 'bg-emerald-50/50 border-emerald-200 opacity-60' 
                            : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isDone ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {isDone ? <Icon icon="heroicons:check" className="text-base" /> : step.step}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h5 className={`text-sm font-bold tracking-tight ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                              {scaleTextMeasurements(step.title, isSubrecipe ? 1 : multiplier)}
                            </h5>
                            {step.station && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
                                {step.station}
                              </span>
                            )}
                          </div>
                          <p className={`text-sm leading-relaxed ${isDone ? 'text-slate-400' : 'text-slate-700'}`}>
                            {scaleTextMeasurements(step.desc, isSubrecipe ? 1 : multiplier)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════ TAB 2.5: MODIFICADORES & SUB-MODIFICADORES (JERARQUÍA & RAPPI) ════ */}
          {activeTab === 'modifiers' && !isSubrecipe && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Árbol Jerárquico de Modificadores & Sub-modificadores
                  </h4>
                  <p className="text-xs text-slate-500 font-normal">
                    Estructura homologada 1:1 para Carta QR Aluna y Catálogo Rappi con precios directamente proporcionales.
                  </p>
                </div>
                {linkedProduct && (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-bold font-mono">
                    Plato Base: ${Number(linkedProduct.price || 0).toLocaleString('es-CO')}
                  </span>
                )}
              </div>

              {loadingModifiers ? (
                <div className="text-center py-10 text-slate-400">
                  <p className="text-xs font-semibold">Cargando jerarquía de modificadores...</p>
                </div>
              ) : modifierHierarchy.length === 0 ? (
                <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Icon icon="heroicons:adjustments-horizontal" className="text-3xl mb-2 opacity-50 mx-auto" />
                  <p className="text-sm font-semibold text-slate-600">Este plato se sirve con su receta estándar sin modificadores adicionales.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modifierHierarchy.map((group, gIdx) => (
                    <div key={group.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs font-bold flex items-center justify-center">
                            {gIdx + 1}
                          </span>
                          <h5 className="text-sm font-bold text-white">{group.name}</h5>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            group.is_required
                              ? 'bg-rose-500/20 text-rose-200 border border-rose-400/30'
                              : 'bg-slate-700 text-slate-300'
                          }`}>
                            {group.is_required ? 'Obligatorio' : 'Opcional'}
                          </span>
                          <span className="text-[11px] font-mono bg-white/10 text-slate-200 px-2 py-0.5 rounded-md">
                            Min: {group.min_select || 0} • Max: {group.max_select || 1}
                            {group.allow_quantity && group.included_quantity > 0 ? ` (${group.included_quantity} incl.)` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {(group.options || []).map((opt) => (
                          <div key={opt.id} className="p-3.5 space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                                <span className="text-xs sm:text-sm font-semibold text-slate-800">{opt.name}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                                  Number(opt.price) > 0
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {Number(opt.price) > 0 ? `+$${Number(opt.price).toLocaleString('es-CO')}` : 'Incluido ($0)'}
                                </span>
                                {group.allow_quantity && opt.extra_price !== null && opt.extra_price !== undefined && Number(opt.extra_price) > 0 && (
                                  <span className="text-[11px] font-mono bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">
                                    Extra: +${Number(opt.extra_price).toLocaleString('es-CO')}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Sub-modificador Anidado (Nivel 2) */}
                            {opt.nestedGroup && (
                              <div className="ml-4 sm:ml-6 pl-3.5 border-l-2 border-indigo-300 bg-indigo-50/40 rounded-r-xl p-3 space-y-2">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-1.5">
                                    <Icon icon="heroicons:arrow-turn-down-right" className="text-indigo-600 text-sm" />
                                    <span className="text-xs font-bold text-indigo-950">
                                      Sub-modificador: {opt.nestedGroup.name}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                                    {opt.nestedGroup.is_required ? 'Obligatorio' : 'Opcional'} (Min {opt.nestedGroup.min_select || 0} / Max {opt.nestedGroup.max_select || 1})
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                                  {(opt.nestedGroup.options || []).map(subOpt => (
                                    <div
                                      key={subOpt.id}
                                      className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-indigo-100 text-xs"
                                    >
                                      <span className="font-medium text-slate-700 truncate">{subOpt.name}</span>
                                      <span className={`font-mono font-bold shrink-0 ${
                                        Number(subOpt.price) > 0 ? 'text-indigo-700' : 'text-slate-500'
                                      }`}>
                                        {Number(subOpt.price) > 0 ? `+$${Number(subOpt.price).toLocaleString('es-CO')}` : '+$0'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ TAB 3: ECONOMÍA & COSTOS ════ */}
          {activeTab === 'economics' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Costo Producción</p>
                  <p className="text-xl font-bold text-slate-900 font-mono">
                    ${totalScaledCost.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-slate-500 font-normal mt-1">
                    {isSubrecipe ? `Total bache de ${currentRecipe.batch_yield || 0}g` : `Unitario × ${multiplier}`}
                  </p>
                </div>

                {!isSubrecipe && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">PVP Sugerido</p>
                    <p className="text-xl font-bold text-indigo-600 font-mono">
                      ${targetPrice.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-slate-500 font-normal mt-1">
                      Precio carta al comensal
                    </p>
                  </div>
                )}

                {!isSubrecipe && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Margen Bruto</p>
                    <p className={`text-xl font-bold font-mono ${grossMargin >= 40 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {grossMargin.toFixed(1)}%
                    </p>
                    <p className="text-xs text-slate-500 font-normal mt-1">
                      Margen de contribución
                    </p>
                  </div>
                )}

                {isSubrecipe && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Costo por Gramo</p>
                    <p className="text-xl font-bold text-indigo-600 font-mono">
                      ${((currentRecipe.total_cost || 0) / (currentRecipe.batch_yield || 1)).toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500 font-normal mt-1">
                      Costo exacto por {currentRecipe.batch_unit || 'g'}
                    </p>
                  </div>
                )}

                {isSubrecipe && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Vida en Frío</p>
                    <p className="text-xl font-bold text-emerald-600 font-mono">
                      {currentRecipe.shelf_life_days || 1} Días
                    </p>
                    <p className="text-xs text-slate-500 font-normal mt-1">
                      Rotación máxima recomendada
                    </p>
                  </div>
                )}
              </div>

              {/* Desglose de insumos con costo individual */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Desglose de Costo Insumo por Insumo
                </p>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                  {ingredients.map((ri, idx) => {
                    const ing = ri.ingredients || {};
                    const unitCost = Number(ing.unit_cost) || 0;
                    const qty = Number(ri.quantity) || 0;
                    const lineCost = qty * unitCost * (isSubrecipe ? 1 : multiplier);
                    return (
                      <div key={idx} className="p-3.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-slate-900">{ing.name}</p>
                          <p className="text-xs text-slate-500 font-mono">
                            {qty * (isSubrecipe ? 1 : multiplier)} {ing.usage_unit} × ${unitCost.toFixed(1)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900 font-mono">
                            ${Math.round(lineCost).toLocaleString('es-CO')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ── Footer Controls */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <p className="text-xs text-slate-500 font-normal hidden sm:block">
            Boku Bento • Ficha Técnica Oficial de Cocina
          </p>
          <button
            onClick={handleClose}
            className="w-full sm:w-auto px-5 py-2 bg-slate-900 text-white rounded-lg font-semibold text-xs hover:bg-slate-800 transition-colors shadow-sm"
          >
            Cerrar Ficha
          </button>
        </div>

      </div>
    </div>
    </Portal>
  );
}
export default KitchenRecipeViewerModal;
