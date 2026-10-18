import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../config/supabase';
import { toast } from '../Toast';
import { Icon } from '@iconify-icon/react';
import { X, Sparkles, AlertTriangle, CheckCircle2, ChevronRight, Scale, ChefHat } from 'lucide-react';
import Portal from '../Portal';

export function BatchProductionModal({ isOpen, onClose, targetItem, activeLocationId, onProduced }) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recipeData, setRecipeData] = useState(null);
  const [subrecipeIngredient, setSubrecipeIngredient] = useState(null);
  const [producedQty, setProducedQty] = useState('');

  // 1. Cargar la receta completa y sus ingredientes con stock en vivo
  useEffect(() => {
    if (!isOpen || !targetItem) {
      setRecipeData(null);
      setSubrecipeIngredient(null);
      setProducedQty('');
      return;
    }

    const loadRecipeDetails = async () => {
      setLoading(true);
      try {
        let recipeId = null;

        // Si el targetItem viene de Insumos (es un ingrediente de subreceta)
        if (targetItem.subrecipe_id) {
          recipeId = targetItem.subrecipe_id;
          setSubrecipeIngredient(targetItem);
        } else if (targetItem.is_subrecipe && targetItem.batch_yield !== undefined) {
          // Viene de Recetas (es la receta directamente)
          recipeId = targetItem.id;
        } else {
          // Intentar buscar si este ingrediente tiene receta vinculada
          const { data: recMatch } = await supabase
            .from('recipes')
            .select('id')
            .eq('id', targetItem.id)
            .eq('is_subrecipe', true)
            .maybeSingle();

          if (recMatch) {
            recipeId = recMatch.id;
          } else {
            const { data: ingMatch } = await supabase
              .from('ingredients')
              .select('*')
              .eq('id', targetItem.id)
              .maybeSingle();
            if (ingMatch?.subrecipe_id) {
              recipeId = ingMatch.subrecipe_id;
              setSubrecipeIngredient(ingMatch);
            }
          }
        }

        if (!recipeId) {
          toast('No se encontró una subreceta vinculada para este insumo.');
          onClose();
          return;
        }

        // Cargar receta completa con insumos
        const { data: recipe, error: recErr } = await supabase
          .from('recipes')
          .select(`
            id, name, is_subrecipe, batch_yield, batch_unit, prep_time_minutes, storage_location,
            recipe_ingredients (
              id, quantity, ingredient_id,
              ingredients (
                id, name, stock_current, stock_min, usage_unit, unit_cost, sku
              )
            )
          `)
          .eq('id', recipeId)
          .single();

        if (recErr || !recipe) {
          throw recErr || new Error('Receta no encontrada');
        }

        setRecipeData(recipe);
        const standard = Number(recipe.batch_yield) || 1000;
        setProducedQty(standard);

        // Si aún no teníamos el subrecipeIngredient, buscarlo
        if (!subrecipeIngredient) {
          const { data: ingData } = await supabase
            .from('ingredients')
            .select('*')
            .or(`subrecipe_id.eq.${recipe.id},id.eq.${recipe.id}`)
            .limit(1)
            .maybeSingle();
          if (ingData) setSubrecipeIngredient(ingData);
        }
      } catch (err) {
        console.error('Error cargando subreceta para producción:', err);
        toast('Error cargando detalles de la subreceta: ' + (err.message || 'Error'));
      } finally {
        setLoading(false);
      }
    };

    loadRecipeDetails();
  }, [isOpen, targetItem]);

  // 2. Cálculos de regla de tres y semáforo de existencias
  const standardYield = Number(recipeData?.batch_yield) || 1000;
  const currentProduced = Number(producedQty) || 0;
  const scaleFactor = standardYield > 0 && currentProduced > 0 ? currentProduced / standardYield : 0;

  const calculatedIngredients = useMemo(() => {
    if (!recipeData?.recipe_ingredients) return [];
    return recipeData.recipe_ingredients.map(ri => {
      const baseQty = Number(ri.quantity) || 0;
      const requiredQty = Math.round(baseQty * scaleFactor * 100) / 100;
      const currentStock = Number(ri.ingredients?.stock_current) || 0;
      const unit = ri.ingredients?.usage_unit || 'g';
      const isSufficient = currentStock >= requiredQty;
      const deficit = isSufficient ? 0 : Math.round((requiredQty - currentStock) * 100) / 100;
      const costPerUnit = Number(ri.ingredients?.unit_cost) || 0;
      const totalCost = requiredQty * costPerUnit;

      return {
        id: ri.ingredient_id,
        name: ri.ingredients?.name || 'Insumo',
        sku: ri.ingredients?.sku,
        baseQty,
        requiredQty,
        currentStock,
        unit,
        isSufficient,
        deficit,
        costPerUnit,
        totalCost
      };
    });
  }, [recipeData, scaleFactor]);

  const missingIngredients = useMemo(() => {
    return calculatedIngredients.filter(i => !i.isSufficient);
  }, [calculatedIngredients]);

  const estimatedBatchCost = useMemo(() => {
    return calculatedIngredients.reduce((sum, i) => sum + i.totalCost, 0);
  }, [calculatedIngredients]);

  // Presets rápidos de cantidad
  const setPreset = (percentage) => {
    const val = Math.round((standardYield * (percentage / 100)) * 10) / 10;
    setProducedQty(val);
  };

  // 3. Confirmar Producción vía RPC Postgres
  const handleConfirmProduction = async () => {
    if (!recipeData) return;
    const qty = Number(producedQty);
    if (!qty || qty <= 0) {
      toast('Ingresa una cantidad producida válida mayor a 0.');
      return;
    }

    setSubmitting(true);
    try {
      const locId = (activeLocationId && activeLocationId !== 'all') ? activeLocationId : null;

      const { data, error } = await supabase.rpc('fn_produce_subrecipe_batch', {
        p_recipe_id: recipeData.id,
        p_produced_quantity: qty,
        p_location_id: locId
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'No se pudo procesar la producción del bache');
      }

      toast(`¡Bache producido con éxito! Se sumaron ${qty} ${recipeData.batch_unit || 'g'} de ${recipeData.name} y se descontaron los insumos base.`);
      onProduced?.(data);
      onClose();
    } catch (err) {
      console.error('Error al registrar bache de subreceta:', err);
      toast('Error al registrar producción: ' + (err.message || 'Error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                <ChefHat className="text-amber-100" size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest bg-amber-500/30 text-amber-100 px-2 py-0.5 rounded border border-amber-400/30">
                    Constructor de Bache
                  </span>
                  {recipeData?.storage_location && (
                    <span className="text-[11px] text-amber-200 font-medium">
                      Estación: {recipeData.storage_location}
                    </span>
                  )}
                </div>
                <h2 className="text-base font-bold text-white mt-0.5 leading-snug">
                  {recipeData ? recipeData.name : 'Preparar Subreceta / Mise en Place'}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Icon icon="heroicons:arrow-path" className="animate-spin text-3xl text-amber-600" />
                <p className="text-xs font-semibold">Cargando receta y verificando existencias en bodega...</p>
              </div>
            ) : recipeData ? (
              <>
                {/* Panel de Configuración de Cantidad */}
                <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-200/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                        Cantidad que vas a preparar hoy
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Rendimiento estándar de ficha: <strong className="font-mono text-slate-700">{standardYield} {recipeData.batch_unit || 'g'}</strong>
                      </p>
                    </div>

                    {/* Presets Rápidos */}
                    <div className="flex items-center gap-1.5 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setPreset(50)}
                        className={`px-2 py-1 rounded text-[11px] font-bold border transition-all ${
                          currentProduced === standardYield * 0.5
                            ? 'bg-amber-600 text-white border-amber-700'
                            : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50'
                        }`}
                      >
                        50%
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreset(100)}
                        className={`px-2 py-1 rounded text-[11px] font-bold border transition-all ${
                          currentProduced === standardYield
                            ? 'bg-amber-600 text-white border-amber-700'
                            : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50'
                        }`}
                      >
                        100%
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreset(150)}
                        className={`px-2 py-1 rounded text-[11px] font-bold border transition-all ${
                          currentProduced === standardYield * 1.5
                            ? 'bg-amber-600 text-white border-amber-700'
                            : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50'
                        }`}
                      >
                        150%
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreset(200)}
                        className={`px-2 py-1 rounded text-[11px] font-bold border transition-all ${
                          currentProduced === standardYield * 2
                            ? 'bg-amber-600 text-white border-amber-700'
                            : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50'
                        }`}
                      >
                        200%
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={producedQty}
                        onChange={(e) => setProducedQty(e.target.value)}
                        placeholder="Ej. 1000"
                        className="w-full px-4 py-2.5 bg-white border-2 border-amber-300 rounded-xl font-mono text-base font-black text-slate-900 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-xs text-amber-700 uppercase">
                        {recipeData.batch_unit || 'g'}
                      </span>
                    </div>

                    <div className="bg-white px-3.5 py-2 rounded-xl border border-amber-200/80 text-center shrink-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Factor Escala</span>
                      <span className="font-mono text-xs font-black text-amber-800">
                        {scaleFactor > 0 ? `${(scaleFactor * 100).toFixed(0)}%` : '—'}
                      </span>
                    </div>

                    <div className="bg-white px-3.5 py-2 rounded-xl border border-amber-200/80 text-center shrink-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Costo Estimado</span>
                      <span className="font-mono text-xs font-black text-slate-900">
                        ${estimatedBatchCost.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Alerta de Insumos Faltantes (si aplica) */}
                {missingIngredients.length > 0 && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 animate-fade-in">
                    <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={18} />
                    <div className="text-xs">
                      <p className="font-bold text-rose-800">
                        Stock insuficiente para {missingIngredients.length} insumo{missingIngredients.length > 1 ? 's' : ''}:
                      </p>
                      <p className="text-rose-700 mt-0.5 leading-relaxed">
                        Te hace falta materia prima en bodega para completar este bache exacto. Si preparas de todos modos, los insumos quedarán en 0 y se generará una alerta de compra.
                      </p>
                    </div>
                  </div>
                )}

                {/* Tabla de Insumos Requeridos vs Stock en Bodega */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Scale size={14} className="text-slate-500" />
                      Insumos a descontar de bodega
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {calculatedIngredients.length} ingredientes
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                          <th className="py-2.5 px-3">Ingrediente Base</th>
                          <th className="py-2.5 px-3 text-right">Cant. Requerida</th>
                          <th className="py-2.5 px-3 text-right">Stock en Bodega</th>
                          <th className="py-2.5 px-3 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {calculatedIngredients.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-3">
                              <p className="font-bold text-slate-900 leading-tight">{item.name}</p>
                              {item.sku && (
                                <span className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              {item.requiredQty} <span className="text-[10px] text-slate-400 font-normal">{item.unit}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold">
                              <span className={item.isSufficient ? 'text-slate-700' : 'text-rose-600 font-bold'}>
                                {item.currentStock} {item.unit}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {item.isSufficient ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 size={11} /> Disponible
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200" title={`Faltan ${item.deficit} ${item.unit}`}>
                                  <AlertTriangle size={11} /> Faltan {item.deficit} {item.unit}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {calculatedIngredients.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">
                              Esta subreceta no tiene ingredientes base configurados en su ficha.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Explicación Operativa */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-600 text-[11px] flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-600 shrink-0" />
                  <p>
                    Al confirmar, se descontarán proporcionalmente los insumos base y se aumentará el stock de <strong>{recipeData.name}</strong> en <strong>{currentProduced} {recipeData.batch_unit || 'g'}</strong>, reactivando en cascada todos los platos de la carta que la utilizan.
                  </p>
                </div>
              </>
            ) : null}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition-all"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleConfirmProduction}
              disabled={submitting || loading || !recipeData || currentProduced <= 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Icon icon="heroicons:arrow-path" className="animate-spin text-base" />
                  <span>Procesando bache...</span>
                </>
              ) : (
                <>
                  <ChefHat size={16} />
                  <span>Confirmar Producción de Bache ({currentProduced} {recipeData?.batch_unit || 'g'})</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </Portal>
  );
}
