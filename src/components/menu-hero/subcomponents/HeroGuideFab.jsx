import React from 'react';
import { Sparkles } from 'lucide-react';

export default function HeroGuideFab({
  instantProduct,
  storeStatusInfo,
  fabPosition,
  primaryColor,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onClick
}) {
  if (!instantProduct || storeStatusInfo?.isOpen === false) return null;

  return (
    <button
      type="button"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClick={onClick}
      className="fixed z-[90] flex touch-none select-none items-center gap-2 rounded-full border border-white/80 bg-white/92 p-2 pr-3 text-[11px] font-black uppercase tracking-wide text-[#1A1A1A] shadow-[0_14px_36px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-transform active:scale-95 lg:hidden"
      style={{ left: fabPosition.x, top: fabPosition.y }}
      aria-label="Abrir guía de antojo"
    >
      <span
        className="flex h-8 w-8 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: primaryColor }}
      >
        <Sparkles size={14} />
      </span>
      <span>Guía</span>
    </button>
  );
}
