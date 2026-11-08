import React from 'react';
import { Icon } from '@iconify-icon/react';

export default function KitchenBestPractices() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 flex items-start gap-3.5">
        <div className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
          <Icon icon="heroicons:scale" className="text-base" />
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
            Gramera Obligatoria
          </h4>
          <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
            Nunca calcular a ojo. El plato o empaque se coloca en la báscula y se tara a 0g antes de cada ingrediente.
          </p>
        </div>
      </div>

      <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-4 flex items-start gap-3.5">
        <div className="w-8 h-8 bg-rose-600 text-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
          <Icon icon="heroicons:shield-exclamation" className="text-base" />
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900">
            Inocuidad & Sin Cruce
          </h4>
          <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
            Carnes crudas y frescos listos jamás intercambian recipientes ni pinzas. Tablas identificadas por color.
          </p>
        </div>
      </div>

      <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-4 flex items-start gap-3.5">
        <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
          <Icon icon="heroicons:arrow-path" className="text-base" />
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
            Sistema FIFO / PEPS
          </h4>
          <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">
            Lo primero que entra es lo primero que sale. Todo inserto y biberón debe tener fecha de lote visible.
          </p>
        </div>
      </div>
    </div>
  );
}
