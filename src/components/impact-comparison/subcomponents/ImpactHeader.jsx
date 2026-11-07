import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Smartphone } from 'lucide-react';

export default function ImpactHeader({ onGoBack }) {
  return (
    <header className="border-b border-white/10 bg-[#0F0F12]/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            type="button"
            onClick={onGoBack}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-200 hover:text-white px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition active:scale-95 shrink-0 cursor-pointer"
            title="Volver a la página anterior"
            aria-label="Ir atrás"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4A853] shrink-0" />
            <span className="text-[11px] sm:text-xs">Atrás</span>
          </button>

          <div className="h-4 w-px bg-white/10" />

          <Link
            to="/"
            className="text-base sm:text-2xl font-bold tracking-tight text-white flex items-center gap-1.5"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Aluna{' '}
            <span className="hidden sm:inline-block text-xs uppercase tracking-widest text-[#D4A853] font-sans px-2.5 py-0.5 rounded-full border border-[#D4A853]/30 bg-[#D4A853]/10 font-bold">
              Impact Lab
            </span>
            <span className="sm:hidden text-[9px] uppercase tracking-wider text-[#D4A853] font-sans px-1.5 py-0.5 rounded border border-[#D4A853]/30 bg-[#D4A853]/10 font-bold">
              Lab
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Link
            to="/alto-andino?demo=1#menu"
            className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-white/90 hover:text-white px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center gap-1 whitespace-nowrap"
          >
            <Smartphone className="w-3 h-3 text-[#D4A853] shrink-0" />
            <span>
              <span className="hidden sm:inline">Ver </span>Demo
              <span className="hidden sm:inline"> Real</span>
            </span>
          </Link>
          <Link
            to="/"
            className="text-[11px] sm:text-xs uppercase tracking-wider font-bold bg-[#D4A853] text-black px-3 py-1.5 sm:px-4 sm:py-2 rounded-full hover:brightness-110 transition shadow-lg shadow-[#D4A853]/20 whitespace-nowrap"
          >
            <span>Inicio</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
