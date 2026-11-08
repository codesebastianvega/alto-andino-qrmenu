import React from "react";
import { Icon } from "@iconify-icon/react";

export default function QuickViewSpecialNotes({ specialInstructions, setSpecialInstructions }) {
  return (
    <div className="mt-6 pt-5 border-t border-neutral-100">
      <label className="flex items-center gap-2 text-xs font-black text-neutral-800 uppercase tracking-wider mb-2.5">
        <Icon icon="solar:notes-bold" className="text-base text-brand-primary" />
        <span>Instrucciones para cocina</span>
        <span className="text-[10px] lowercase text-neutral-400 font-semibold">(opcional)</span>
      </label>
      <textarea
        rows={2}
        value={specialInstructions}
        onChange={(e) => setSpecialInstructions(e.target.value)}
        placeholder="Ej: Sin cebolla, término medio, salsa aparte..."
        className="w-full text-base sm:text-xs font-medium text-neutral-800 bg-neutral-50/80 hover:bg-neutral-50 focus:bg-white border border-neutral-200 rounded-2xl p-3.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none transition-all placeholder:text-neutral-400"
        maxLength={150}
      />
      <div className="flex justify-end mt-1">
        <span className="text-[10px] font-semibold text-neutral-400 tabular-nums">
          {specialInstructions.length}/150
        </span>
      </div>
    </div>
  );
}
