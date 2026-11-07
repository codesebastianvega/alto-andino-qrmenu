import React from 'react';
import Portal from '../../Portal';
import { Smartphone, X } from 'lucide-react';

export default function MealPlanPwaHelpModal({ open, onClose }) {
  if (!open) return null;

  return (
    <Portal>
      <div
        data-clarity-unmask="true"
        className="fixed inset-0 z-[270] flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#2f4131]" />
              Instala la App en tu Celular
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg bg-stone-100 text-stone-500 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-stone-600 space-y-2 leading-relaxed">
            <p>
              Para entrar en 1 toque todos los días con tu tiquetera ya abierta:
            </p>
            <p className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-medium">
              📱 <strong>En iPhone (Safari):</strong> Toca el botón <strong>Compartir</strong> y elige <strong>&quot;Agregar a inicio&quot;</strong>.
            </p>
            <p className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-medium">
              🤖 <strong>En Android (Chrome):</strong> Toca los <strong>3 puntos (⋮)</strong> arriba a la derecha y elige <strong>&quot;Instalar aplicación&quot;</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-stone-900 text-white font-black text-xs cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </Portal>
  );
}
