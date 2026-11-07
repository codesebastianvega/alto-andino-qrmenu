import { Icon } from '@iconify-icon/react';
import { Sparkles, Leaf } from 'lucide-react';
import { TableContainer, Th } from '../ui';
import { getStockHealth, getExpirationStatus, formatRelativeTime } from '../../../utils/inventoryHelpers';
import { getZeroWasteSuggestion } from '../../../utils/zeroWasteKnowledge';

export function InsumosTable({
  filtered = [],
  categories = [],
  providers = [],
  inlineEdit,
  setInlineEdit,
  fi,
  saveInlineCost,
  inlineUnitCost,
  confirmDelete,
  setConfirmDelete,
  isAllLocations = false,
  deleteIngredient,
  toggleIngredientStatus,
  openEdit,
  openInlineEdit,
  handleUnlinkIngredient,
  setBatchModalItem,
  showZeroOnly = false,
  search = ''
}) {
  return (
    <div className="hidden md:block">
      <TableContainer className="rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden bg-white">
        <table className="w-full min-w-[1000px] border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80">
              <Th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Insumo / SKU</Th>
              <Th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría / Prov.</Th>
              <Th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Costo Unit.</Th>
              <Th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock / Alerta</Th>
              <Th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Valor Stock</Th>
              <Th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Caducidad / Días</Th>
              <Th className="py-3 px-3 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                <span className="inline-flex items-center gap-1 bg-emerald-100/80 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                  <Sparkles size={11} /> Zero-Waste IA
                </span>
              </Th>
              <Th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Última Act.</Th>
              <Th right className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(item => {
              const cat = categories.find(c => c.id === item.category_id);
              const health = getStockHealth(item.stock_current, item.stock_min);
              const hasZero = !item.unit_cost || item.unit_cost === 0;
              const isInline = inlineEdit?.id === item.id;
              const isDelConf = confirmDelete === item.id;
              const isSubrecipe = Boolean(item.is_subrecipe) || (item.name || '').toLowerCase().includes('(subreceta)');

              // Delete confirmation row
              if (isDelConf) {
                return (
                  <tr key={item.id} className="bg-rose-50/60 border-y border-rose-100">
                    <td colSpan={9} className="px-4 py-3">
                      <div className="flex items-center justify-between animate-fade-in">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-rose-100 rounded-md flex items-center justify-center text-rose-600 text-sm">
                            <Icon icon="heroicons:trash" />
                          </div>
                          <p className="text-xs font-bold text-rose-800">
                            ¿Eliminar <span className="underline decoration-rose-300">{item.name}</span> del inventario?
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              deleteIngredient(item.id);
                              setConfirmDelete(null);
                            }}
                            className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 shadow-2xs transition-all"
                          >
                            Sí, Eliminar
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 transition-all"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              }

              // Inline cost editor row
              if (isInline) {
                return (
                  <tr key={item.id} className="bg-blue-50/40 border-y border-blue-100">
                    <td className="px-4 py-3" colSpan={9}>
                      <div className="flex flex-wrap items-end gap-3 text-xs">
                        <div className="flex-1 min-w-[140px]">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Insumo</p>
                          <p className="text-xs font-bold text-slate-900">{item.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium capitalize">{item.usage_unit}</p>
                        </div>
                        <div className="flex-1 min-w-[110px]">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Precio compra</label>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 text-xs">$</span>
                            <input
                              autoFocus
                              type="number"
                              value={inlineEdit.purchase_price}
                              onChange={e => fi('purchase_price', Number(e.target.value))}
                              className="w-24 px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-100 outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex-1 min-w-[90px]">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Cant. interna</label>
                          <input
                            type="number"
                            value={inlineEdit.purchase_quantity}
                            onChange={e => fi('purchase_quantity', Number(e.target.value))}
                            className="w-20 px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-100 outline-none"
                          />
                        </div>
                        <div className="flex-1 min-w-[90px]">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Unidad compra</label>
                          <input
                            type="text"
                            value={inlineEdit.purchase_unit}
                            onChange={e => fi('purchase_unit', e.target.value)}
                            className="w-20 px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-100 outline-none"
                          />
                        </div>
                        {/* Live cost preview */}
                        <div className="flex-1 min-w-[110px] text-center">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Costo unitario</p>
                          <p className={`text-base font-extrabold tabular-nums ${
                            inlineUnitCost > 0 ? 'text-emerald-700' : 'text-slate-400'
                          }`}>
                            ${inlineUnitCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            <span className="text-[10px] text-slate-400 font-medium ml-1">/{item.usage_unit}</span>
                          </p>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={saveInlineCost}
                            className="px-3 py-1.5 bg-emerald-800 text-white rounded-lg text-xs font-semibold hover:bg-emerald-900 transition-all shadow-2xs"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setInlineEdit(null)}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 transition-all"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => openEdit(item)}
                            className="px-2.5 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold transition-all"
                          >
                            Editar todo…
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              }

              // Normal row
              return (
                <tr
                  key={item.id}
                  className={`group transition-colors ${
                    hasZero ? 'bg-amber-50/20 hover:bg-amber-50/40' : 'hover:bg-slate-50/70'
                  } ${!item.is_active ? 'opacity-60 grayscale-[0.5]' : ''}`}
                >
                  {/* Name column */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-7 h-7 rounded-md object-cover border border-slate-200 shrink-0 bg-white shadow-2xs"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs shrink-0 border ${
                          item.is_active ? 'bg-slate-100 text-slate-700 border-slate-200/80' : 'bg-slate-50 text-slate-400 border-slate-200/50'
                        }`}>
                          {item.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate max-w-[220px]">{item.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">{item.usage_unit || 'unidad'}</span>
                          {isSubrecipe && (
                            <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300/80 px-1.5 py-0.2 rounded font-bold">
                              🍲 Subreceta
                            </span>
                          )}
                          {item.recipe_usage_count > 0 && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.2 rounded font-semibold">
                              {item.recipe_usage_count} receta{item.recipe_usage_count === 1 ? '' : 's'} · {item.recipe_required_quantity} {item.usage_unit}
                            </span>
                          )}
                          {item.sku && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono font-semibold border border-slate-200/60">
                              {item.sku}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category / Provider column */}
                  <td className="py-3 px-3">
                    <div className="flex flex-col gap-1">
                      <div>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold uppercase border border-slate-200/60 inline-block">
                          {cat?.name || 'Sin Categ.'}
                        </span>
                      </div>
                      {item.provider_id && (
                        <div className="flex items-center gap-1 text-[10px] text-blue-600 font-semibold truncate max-w-[140px]">
                          <Icon icon="heroicons:truck" className="text-xs shrink-0" />
                          <span className="truncate">{providers.find(p => p.id === item.provider_id)?.name || 'Proveedor'}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Cost column */}
                  <td className="py-3 px-3">
                    {hasZero ? (
                      <button
                        onClick={() => openInlineEdit(item)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-md text-[11px] font-semibold transition-all border border-amber-200/80 shadow-2xs"
                      >
                        <Icon icon="heroicons:currency-dollar" className="text-xs" />
                        Fijar precio
                      </button>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-xs font-extrabold text-slate-900 tabular-nums">
                          ${(item.unit_cost || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">Por {item.usage_unit || 'u'}</span>
                      </div>
                    )}
                  </td>

                  {/* Stock column */}
                  <td className="py-3 px-3">
                    <div className="flex flex-col gap-1 max-w-[130px]">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-extrabold tabular-nums ${health.textColor}`}>
                          {item.stock_current} <span className="text-[10px] font-semibold text-slate-400">{item.usage_unit}</span>
                        </span>
                        {health.icon && (
                          <span className={`flex items-center justify-center h-4 w-4 rounded-full ${health.iconBg}`} title={health.label}>
                            <Icon icon={health.icon} className="text-[10px]" />
                          </span>
                        )}
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${health.colorClass}`}
                          style={{ width: `${health.barPercentage}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-semibold text-slate-400">
                        <span>Mín: {item.stock_min}</span>
                        {item.stock_min > 0 && (
                          <span className={`font-bold tabular-nums ${health.textColor}`} title={`${health.percentage}% del stock mínimo`}>
                            {health.shortLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Valor Stock column */}
                  <td className="py-3 px-3">
                    <div className="flex flex-col">
                      <span className="text-xs font-extrabold text-slate-900 tabular-nums">
                        ${((item.unit_cost || 0) * (item.stock_current || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                      <p className="text-[10px] text-slate-400 font-medium">Valor total</p>
                    </div>
                  </td>

                  {/* Expiration date column */}
                  <td className="py-3 px-3">
                    {(() => {
                      const exp = getExpirationStatus(item.expiration_date);
                      if (!exp) {
                        return (
                          <span className="text-[11px] text-slate-300 font-medium">—</span>
                        );
                      }
                      return (
                        <div className="flex flex-col gap-0.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${exp.color} w-fit`}>
                            <Icon icon="heroicons:clock" className="text-[11px]" />
                            {exp.label}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium">
                            {item.expiration_date}
                          </span>
                        </div>
                      );
                    })()}
                  </td>

                  {/* Zero-Waste IA column */}
                  <td className="py-3 px-3">
                    {(() => {
                      if (!item.has_merma) {
                        return (
                          <span className="text-[11px] text-slate-300 font-medium">
                            —
                          </span>
                        );
                      }
                      const zw = getZeroWasteSuggestion(item.name) || {
                        badge: 'Merma Activa',
                        suggestion: `Insumo con ${item.merma_percent || 20}% de merma configurada para rescate y sub-recetas.`,
                        potentialSaving: `${item.merma_percent || 20}% de merma`
                      };
                      return (
                        <div className="group/zw relative inline-block">
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/90 hover:bg-emerald-100 transition-colors cursor-help">
                            <Leaf size={12} className="text-emerald-600 shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold leading-tight truncate max-w-[120px]">{zw.badge}</span>
                              <span className="text-[9px] text-emerald-600 font-medium leading-none">{zw.potentialSaving}</span>
                            </div>
                          </div>
                          {/* Hover tooltip with full culinary idea */}
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover/zw:block z-50 w-64 p-3 bg-slate-900 text-white rounded-xl shadow-xl text-left border border-slate-800 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-center gap-1.5 mb-1 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                              <Sparkles size={12} />
                              Rescate IA Zero-Waste
                            </div>
                            <p className="text-xs text-slate-200 font-normal leading-relaxed">
                              {zw.suggestion}
                            </p>
                            <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-emerald-300 font-semibold">
                              <span>Rendimiento estimado</span>
                              <span>+{zw.potentialSaving}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </td>

                  {/* Last updated column */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1 text-slate-500 font-medium text-xs">
                      <Icon icon="heroicons:clock" className="text-xs text-slate-400" />
                      <span>{formatRelativeTime(item.updated_at)}</span>
                    </div>
                  </td>

                  {/* Actions column */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isSubrecipe && (
                        <button
                          onClick={() => setBatchModalItem(item)}
                          title="Preparar bache de esta subreceta"
                          className="flex items-center gap-1 px-2.5 h-7 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-md border border-amber-300 shadow-2xs transition-all mr-0.5"
                        >
                          <span>🍲</span>
                          <span>Preparar</span>
                        </button>
                      )}
                      <button
                        onClick={() => toggleIngredientStatus(item.id, item.is_active)}
                        title={item.is_active ? "Insumo activo (clic para desactivar)" : "Insumo inactivo (clic para activar)"}
                        className={`h-7 px-2 flex items-center gap-1 text-[11px] font-bold rounded-lg border transition-all ${
                          item.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200 hover:text-slate-800'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${item.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span>{item.is_active ? 'Activo' : 'Inactivo'}</span>
                      </button>
                      <button
                        onClick={() => openEdit(item)}
                        title="Editar insumo"
                        className="h-7 px-2.5 flex items-center gap-1 text-xs font-bold text-slate-700 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 rounded-lg border border-slate-200/90 shadow-2xs transition-all"
                      >
                        <Icon icon="heroicons:pencil-square" className="text-sm text-slate-400" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => { setConfirmDelete(item.id); setInlineEdit(null); }}
                        title="Eliminar insumo"
                        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200/80 bg-white transition-all shadow-2xs"
                      >
                        <Icon icon="heroicons:trash" className="text-sm" />
                      </button>
                      {!isAllLocations && (
                        <button
                          onClick={() => handleUnlinkIngredient(item.id)}
                          title="Desvincular de esta sede"
                          className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg border border-slate-200/80 bg-white transition-all shadow-2xs"
                        >
                          <Icon icon="heroicons:link-slash" className="text-sm" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-xs text-slate-400 font-medium">
                  {showZeroOnly ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <Icon icon="heroicons:check-badge" className="text-2xl text-emerald-500" />
                      <span>¡Todos tus insumos tienen un costo definido!</span>
                    </div>
                  ) : search === 'stock_bajo' ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <Icon icon="heroicons:check-circle" className="text-2xl text-emerald-500" />
                      <span>No hay insumos con stock bajo. ¡Buen trabajo!</span>
                    </div>
                  ) : search === 'high_value' ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <Icon icon="heroicons:information-circle" className="text-2xl text-blue-500" />
                      <span>No hay insumos con valor significativamente alto actualmente.</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <Icon icon="heroicons:magnifying-glass" className="text-2xl text-slate-300" />
                      <span>No se encontraron insumos que coincidan con la búsqueda.</span>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}
