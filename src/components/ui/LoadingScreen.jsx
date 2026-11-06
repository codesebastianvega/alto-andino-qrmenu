import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen = ({ mode = 'splash', brandLogo = null }) => {
  if (mode === 'skeleton') {
    return (
      <div className="w-full h-full p-6 animate-pulse bg-gray-50/80">
        <div className="flex justify-between items-center mb-8">
          <div className="h-10 w-44 bg-gray-200 rounded-xl" />
          <div className="h-10 w-28 bg-gray-200 rounded-xl" />
        </div>
        <div className="flex gap-3 mb-8 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-24 bg-gray-200 rounded-full flex-shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 bg-gray-200/70 rounded-2xl border border-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  // Modo Simple & Limpio: Indicador estático y ligero
  return (
    <div className="fixed inset-0 z-[9999] bg-[#F7F8F9] flex flex-col items-center justify-center p-6 text-gray-800">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-4"
      >
        {brandLogo ? (
          <div className="w-20 h-20 rounded-2xl bg-white p-2.5 shadow-sm border border-gray-200/70 flex items-center justify-center overflow-hidden">
            <img
              src={brandLogo}
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-gray-200/70 flex items-center justify-center text-xl">
            🍽️
          </div>
        )}

        <div className="flex items-center gap-2.5 mt-2">
          <div className="w-4 h-4 rounded-full border-2 border-emerald-600/20 border-t-emerald-600 animate-spin" />
          <span className="text-[12px] font-medium text-gray-500 tracking-wide">
            Cargando...
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
