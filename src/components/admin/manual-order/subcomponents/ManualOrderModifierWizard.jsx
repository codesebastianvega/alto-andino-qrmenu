import React from 'react';
import { Icon } from '@iconify-icon/react';
import { formatCOP } from '../../../../utils/money';

export default function ManualOrderModifierWizard({
  configuringProduct,
  setConfiguringProduct,
  selectedModifiers = {},
  setSelectedModifiers,
  itemKitchenNotes,
  setItemKitchenNotes,
  modalDishLivePrice,
  handleConfirmConfiguredProduct
}) {
  if (!configuringProduct) return null;

  return (
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
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center cursor-pointer"
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
                    const includedCount =
                      g.included_count !== undefined && g.included_count !== null
                        ? g.included_count
                        : g.max === 1
                        ? 1
                        : 0;

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
                        className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
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
              className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmConfiguredProduct}
              className="flex-1 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 cursor-pointer"
            >
              Confirmar y Agregar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
