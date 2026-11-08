import React from 'react';
import { MessageCircle } from 'lucide-react';
import { openWhatsApp } from '../upgradeStoreData';

export default function UpgradeBanner() {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="space-y-1 max-w-xl">
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
          Sin intermediarios ni cláusulas
        </span>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">
          Arma tu sistema gastronómico como quieras
        </h2>
        <p className="text-xs text-emerald-100/80 leading-relaxed">
          Elige un plan todo-en-uno o agrega únicamente los módulos que tu cocina y salón necesitan hoy. Puedes activarlos o cancelarlos mes a mes sin penalizaciones.
        </p>
      </div>

      <button
        type="button"
        onClick={() => openWhatsApp('¡Hola! Quiero asesoría para elegir el mejor plan y módulos para mi restaurante.')}
        className="px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-950 font-black text-xs transition-all shadow-sm shrink-0 flex items-center gap-1.5 cursor-pointer"
      >
        <MessageCircle className="w-4 h-4 text-emerald-600" />
        <span>Asesoría por WhatsApp</span>
      </button>
    </div>
  );
}
