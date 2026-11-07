import { Icon } from '@iconify-icon/react';
import { Sparkles } from 'lucide-react';
import { getStockHealth, getExpirationStatus } from '../../../utils/inventoryHelpers';
import { getZeroWasteSuggestion } from '../../../utils/zeroWasteKnowledge';

export function InsumosCards({
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
  setBatchModalItem
}) {
  return (
    <div className="md:hidden flex flex-col gap-3 mt-4">
      {filtered.map(item => {
        const cat = categories.find(c => c.id === item.category_id);
        const health = getStockHealth(item.stock_current, item.stock_min);
        const hasZero = !item.unit_cost || item.unit_cost === 0;
        const isInline = inlineEdit?.id === item.id;
        const isDelConf = confirmDelete === item.id;
        const isSubrecipe = Boolean(item.is_subrecipe) || (item.name || '').toLowerCase().includes('(subreceta)');

        if (isDelConf) {
          return (
            <div key={item.id} className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 flex flex-col gap-2.5 animate-fade-in">
              <p className="text-xs font-bold text-rose-800">¿Eliminar {item.name} del inventario?</p>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => {
                    deleteIngredient(item.id);
                    setConfirmDelete(null);
                  }}
                  className="flex-1 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold uppercase shadow-2xs"
                >
                  Eliminar
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          );
        }

        if (isInline) {
          return (
            <div key={item.id} className="bg-blue-50/50 border border-blue-200 rounded-xl p-3.5 flex flex-col gap-2.5 animate-fade-in text-xs">
              <p className="font-bold text-slate-900">{item.name}</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Precio Compra ($)</label>
                  <input
                    type="number"
                    value={inlineEdit.purchase_price}
                    onChange={e => fi('purchase_price', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-blue-200 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Cant. ({inlineEdit.purchase_unit})</label>
                  <input
                    type="number"
                    value={inlineEdit.purchase_quantity}
                    onChange={e => fi('purchase_quantity', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-blue-200 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center mt-1 pt-2 border-t border-blue-100">
                <p className="font-extrabold text-emerald-800">Costo: ${inlineUnitCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                <div className="flex gap-1.5">
                  <button onClick={() => setInlineEdit(null)} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600">
                    Cancelar
                  </button>
                  <button onClick={saveInlineCost} className="px-3 py-1 bg-emerald-800 rounded-lg text-xs font-semibold text-white shadow-2xs">
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div
            key={item.id}
            className={`bg-white p-3.5 rounded-xl border shadow-2xs flex flex-col gap-2.5 transition-all ${
              hasZero ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200/90'
            }`}
          >
            <div className="flex gap-2.5 items-center">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0 bg-white shadow-2xs"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border ${
                  item.is_active ? 'bg-slate-100 text-slate-700 border-slate-200/80' : 'bg-slate-50 text-slate-400 border-slate-200/50'
                }`}>
                  {item.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">{cat?.name || 'Sin Categoría'}</span>
                  {isSubrecipe && (
                    <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-1.5 py-0.2 rounded">
                      🍲 Subreceta
                    </span>
                  )}
                  {item.provider_id && (
                    <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-100 font-semibold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                      <Icon icon="heroicons:truck" className="text-[10px]" />
                      <span className="truncate max-w-[80px]">{providers.find(p => p.id === item.provider_id)?.name}</span>
                    </span>
                  )}
                  {item.sku && (
                    <span className="text-[9px] font-mono font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200/60">
                      {item.sku}
                    </span>
                  )}
                  {(() => {
                    const exp = getExpirationStatus(item.expiration_date);
                    if (!exp) return null;
                    return (
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border inline-flex items-center gap-1 ${exp.color}`}>
                        <Icon icon="heroicons:clock" className="text-[9px]" />
                        {exp.label}
                      </span>
                    );
                  })()}
                </div>
                <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5">{item.name}</h4>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Costo ({item.usage_unit})</p>
                <p className="font-extrabold text-slate-800">
                  {hasZero ? (
                    <span className="text-amber-600 font-bold text-[11px] flex items-center gap-1">
                      <Icon icon="heroicons:exclamation-circle" /> Sin Costo
                    </span>
                  ) : (
                    `$${(item.unit_cost || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                  )}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock Actual</p>
                <div className="flex items-center gap-1.5">
                  <p className={`font-extrabold flex items-center gap-1 ${health.textColor}`}>
                    {item.stock_current} {item.usage_unit}
                    {health.icon && (
                      <span className={`flex items-center justify-center h-3.5 w-3.5 rounded-full ${health.iconBg} ml-0.5`} title={health.label}>
                        <Icon icon={health.icon} className="text-[9px]" />
                      </span>
                    )}
                  </p>
                  {item.stock_min > 0 && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border tabular-nums ${health.badgeBg}`}>
                      {health.shortLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {(() => {
              if (!item.has_merma) return null;
              const zw = getZeroWasteSuggestion(item.name) || {
                badge: 'Merma Activa',
                suggestion: `Insumo con ${item.merma_percent || 20}% de merma configurada para rescate y sub-recetas.`,
                potentialSaving: `${item.merma_percent || 20}% de merma`
              };
              return (
                <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200/90 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                      <Sparkles size={11} className="text-emerald-600" />
                      Zero-Waste: {zw.badge}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                      +{zw.potentialSaving}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 font-normal leading-relaxed">
                    {zw.suggestion}
                  </p>
                </div>
              );
            })()}

            <div className="flex items-center justify-between pt-1">
              <div>
                {hasZero && (
                  <button onClick={() => openInlineEdit(item)} className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-bold flex items-center gap-1">
                    Fijar Precio
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {isSubrecipe && (
                  <button
                    onClick={() => setBatchModalItem(item)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-md border border-amber-300 shadow-2xs mr-1"
                  >
                    <span>🍲 Preparar</span>
                  </button>
                )}
                <button
                  onClick={() => toggleIngredientStatus(item.id, item.is_active)}
                  title={item.is_active ? "Insumo activo (clic para desactivar)" : "Insumo inactivo (clic para activar)"}
                  className={`h-7 px-2 flex items-center gap-1 text-[11px] font-bold rounded-lg border transition-all ${
                    item.is_active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-300'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${item.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  <span>{item.is_active ? 'Activo' : 'Inactivo'}</span>
                </button>
                <button onClick={() => openEdit(item)} title="Editar" className="h-7 px-2.5 flex items-center gap-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-2xs">
                  <Icon icon="heroicons:pencil-square" className="text-sm text-slate-400" />
                  <span>Editar</span>
                </button>
                <button onClick={() => setConfirmDelete(item.id)} title="Eliminar" className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-lg shadow-2xs">
                  <Icon icon="heroicons:trash" className="text-sm" />
                </button>
                {!isAllLocations && (
                  <button onClick={() => handleUnlinkIngredient(item.id)} title="Desvincular" className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-amber-600 bg-white border border-slate-200 rounded-md shadow-2xs">
                    <Icon icon="heroicons:link-slash" className="text-sm" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
