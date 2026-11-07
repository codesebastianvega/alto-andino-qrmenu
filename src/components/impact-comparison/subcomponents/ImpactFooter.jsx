import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export default function ImpactFooter({ onGoBack }) {
  return (
    <footer className="border-t border-white/10 bg-[#0F0F12] py-8 text-center px-3.5 sm:px-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <p className="text-xs sm:text-sm text-gray-400">
          ¿Listo para ver cómo se siente en un teléfono real?
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 max-w-xs sm:max-w-none mx-auto">
          <button
            type="button"
            onClick={onGoBack}
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white px-5 sm:px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition border border-white/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#D4A853]" />
            <span>Regresar Atrás</span>
          </button>
          <Link
            to="/alto-andino?demo=1#menu"
            className="w-full sm:w-auto bg-[#D4A853] text-black px-6 sm:px-8 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:brightness-110 transition shadow-xl shadow-[#D4A853]/20 flex items-center justify-center gap-2"
          >
            <span>Abrir Demo Alto Andino</span> <ExternalLink className="w-4 h-4" />
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-6 sm:px-8 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition flex items-center justify-center border border-white/5"
          >
            Ir al Inicio
          </Link>
        </div>
        <p className="text-[10px] sm:text-[11px] text-gray-500 pt-2 sm:pt-4">
          Aluna POS Gastronómico • Diseñado para ventas directas sin intermediarios.
        </p>
      </div>
    </footer>
  );
}
