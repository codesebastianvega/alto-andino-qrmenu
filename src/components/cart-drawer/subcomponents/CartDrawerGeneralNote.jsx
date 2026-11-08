import React from "react";
import { Icon } from "@iconify-icon/react";

export default function CartDrawerGeneralNote({ note, setNote }) {
  return (
    <div className="p-4 md:px-6 md:py-4 pb-6 md:pb-6">
      <div className="rounded-2xl bg-neutral-50 p-4 ring-1 ring-neutral-200/60 focus-within:ring-[#2f4131]/30 focus-within:bg-white transition-all">
        <div className="flex items-center gap-2 mb-2">
          <Icon icon="heroicons:document-text" className="h-4 w-4 text-neutral-400" />
          <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">
            Instrucciones Especiales
          </label>
        </div>
        <textarea
          value={note ?? ""}
          onChange={(e) => setNote?.(e.target.value)}
          placeholder="Ej: Tráiganlo cuando lleguemos todos, pago en efectivo..."
          className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none font-medium min-h-[50px] resize-none"
          rows={2}
        />
      </div>
    </div>
  );
}
