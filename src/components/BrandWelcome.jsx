import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, ArrowRight, Sparkles } from 'lucide-react';

export default function BrandWelcome({ brandName, logoUrl, bgUrl, mesa, onStart }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-black"
    >
      {/* Background Image with Overlay */}
      <motion.div 
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 10, ease: "linear" }}
        className="absolute inset-0 z-0"
      >
        <img 
          src={bgUrl || "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop"} 
          className="w-full h-full object-cover opacity-60 grayscale-[20%]"
          alt="Restaurant background"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80" />
      </motion.div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-sm md:max-w-xl lg:max-w-2xl px-8 flex flex-col items-center text-center">
        
        {/* Logo or Icon */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mb-8 md:mb-12"
        >
          {logoUrl ? (
            <img src={logoUrl} alt={brandName} className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-2xl" />
          ) : (
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl">
              <Utensils className="text-white w-10 h-10 md:w-14 md:h-14" />
            </div>
          )}
        </motion.div>

        {/* Brand Name & Welcome */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 md:px-5 md:py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/70 text-[10px] md:text-[11px] font-bold tracking-[0.2em] uppercase mb-4 md:mb-8 transition-colors">
            <Sparkles size={14} className="text-[#E6B05C]" />
            Experiencia Digital
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-2 md:mb-6 tracking-tight drop-shadow-sm" style={{ fontFamily: "'DM Serif Display', serif" }}>
            {brandName}
          </h1>
          
          {mesa ? (
            <p className="text-[#E6B05C] font-bold text-lg md:text-2xl mb-6 md:mb-10 flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#E6B05C] animate-pulse" />
              Mesa {mesa}
            </p>
          ) : (
            <p className="text-white/60 text-sm md:text-lg mb-8 md:mb-12 font-medium max-w-md mx-auto">
              Bienvenido a una nueva forma de explorar nuestra gastronomía.
            </p>
          )}
        </motion.div>

        {/* Start Button */}
        <motion.button
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          onClick={onStart}
          className="group relative w-full md:w-96 py-4 md:py-5 mt-8 md:mt-12 bg-white rounded-full flex items-center justify-center gap-3 shadow-2xl transition-all hover:bg-[#fafafa]"
        >
          <span className="text-[#1A1A1A] font-bold text-sm md:text-base tracking-wider">
            ABRIR MENÚ
          </span>
          <ArrowRight className="text-[#1A1A1A] w-4 h-4 group-hover:translate-x-1 transition-transform" />
          
          {/* Subtle Glow Effect */}
          <div className="absolute inset-0 rounded-full bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
        </motion.button>

        {/* Footer info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1 }}
          className="mt-12 text-white/30 text-[10px] uppercase tracking-widest font-bold"
        >
          Powered by <span className="text-white/50">Aluna</span>
        </motion.p>
      </div>

      {/* Side Decoration */}
      <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </motion.div>
  );
}
