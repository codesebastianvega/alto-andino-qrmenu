import React from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';

export default function CascadeConfirmModal({
  cascadeModal,
  setCascadeModal,
  handleConfirmCascade,
  updateOption
}) {
  if (!cascadeModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
            cascadeModal.type === 'turn_off' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
          }`}>
            {cascadeModal.type === 'turn_off' ? <AlertTriangle className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 leading-tight">
              {cascadeModal.type === 'turn_off' ? 'Modificador Crítico Agotado' : 'Reactivación de Modificador'}
            </h3>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">
              Opción: <span className="font-black text-gray-900">{cascadeModal.option.name}</span>
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-2xl border border-gray-200/80">
          <p className="text-xs font-bold text-gray-700 mb-2">
            {cascadeModal.type === 'turn_off' 
              ? `"${cascadeModal.option.name}" se utiliza en ${cascadeModal.affectedProducts.length} platos activos:`
              : `Se reactivó "${cascadeModal.option.name}". ¿Deseas volver a habilitar los siguientes ${cascadeModal.affectedProducts.length} platos?`
            }
          </p>
          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {cascadeModal.affectedProducts.map(prod => (
              <label key={prod.id} className="flex items-center gap-2 p-1.5 bg-white rounded-xl border border-gray-200 text-xs font-bold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cascadeModal.selectedDishIds.includes(prod.id)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setCascadeModal(prev => ({
                      ...prev,
                      selectedDishIds: checked 
                        ? [...prev.selectedDishIds, prod.id] 
                        : prev.selectedDishIds.filter(id => id !== prod.id)
                    }));
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="truncate">{prod.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <button
            onClick={handleConfirmCascade}
            className={`w-full py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider text-white shadow-md transition-transform active:scale-98 cursor-pointer ${
              cascadeModal.type === 'turn_off' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {cascadeModal.type === 'turn_off' 
              ? `⚡ Pausar los ${cascadeModal.selectedDishIds.length} platos en cascada`
              : `🟢 Reactivar los ${cascadeModal.selectedDishIds.length} platos`
            }
          </button>

          <button
            onClick={async () => {
              const isTurnOff = cascadeModal.type === 'turn_off';
              await updateOption(cascadeModal.option.id, { 
                is_active: !isTurnOff, 
                stock_status: isTurnOff ? 'out' : 'in' 
              });
              setCascadeModal(null);
            }}
            className="w-full py-2 rounded-2xl text-xs font-black uppercase tracking-wider bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
          >
            Solo cambiar la opción individual
          </button>
        </div>
      </div>
    </div>
  );
}
