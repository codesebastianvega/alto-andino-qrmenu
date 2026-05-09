import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LOADING_PHRASES = [
  "Calentando los fogones...",
  "Afilando los cuchillos...",
  "Preparando los mejores ingredientes...",
  "Organizando las mesas...",
  "Poniendo a punto el servicio...",
  "Revisando la carta del día...",
  "Decorando los platos...",
  "Sincronizando con la cocina..."
];

const LoadingScreen = ({ mode = 'splash', brandLogo = null, businessType = 'restaurant' }) => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Cycle phrases
  useEffect(() => {
    if (mode === 'splash') {
      const phraseInterval = setInterval(() => {
        setPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length);
      }, 2500);

      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) return 100;
          const increment = Math.random() * 15;
          return Math.min(prev + increment, 95); // Stay at 95 until finished
        });
      }, 800);

      return () => {
        clearInterval(phraseInterval);
        clearInterval(progressInterval);
      };
    }
  }, [mode]);

  if (mode === 'skeleton') {
    return (
      <div className="w-full h-full p-6 animate-pulse bg-neutral-900/50">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-8">
          <div className="h-10 w-48 bg-neutral-800 rounded-lg shadow-sm"></div>
          <div className="h-10 w-32 bg-neutral-800 rounded-lg shadow-sm"></div>
        </div>

        {/* Categories Skeleton */}
        <div className="flex gap-4 mb-8 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 w-28 bg-neutral-800 rounded-full flex-shrink-0 shadow-sm"></div>
          ))}
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-neutral-800 rounded-2xl border border-neutral-700/50 shadow-md"></div>
          ))}
        </div>

        {/* Shimmer overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            className="w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-white overflow-hidden">
      {/* Background Decorative elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative w-full max-w-md flex flex-col items-center">
        {/* Brand Logo or Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-12 relative"
        >
          {brandLogo ? (
            <img 
              src={brandLogo} 
              alt="Brand Logo" 
              className="w-32 h-32 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
            />
          ) : (
            <div className="w-24 h-24 bg-neutral-800 rounded-3xl flex items-center justify-center border border-neutral-700 shadow-2xl">
              <span className="text-4xl">🍽️</span>
            </div>
          )}
          
          {/* Animated Glow Ring */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -inset-4 rounded-full bg-white/5 blur-xl -z-10"
          />
        </motion.div>

        {/* Progress Section */}
        <div className="w-full mb-8">
          <div className="flex justify-between items-end mb-2">
            <AnimatePresence mode="wait">
              <motion.span
                key={phraseIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="text-neutral-400 text-sm font-medium tracking-wide"
              >
                {LOADING_PHRASES[phraseIndex]}
              </motion.span>
            </AnimatePresence>
            <span className="text-xs font-mono text-neutral-500">{Math.round(progress)}%</span>
          </div>

          {/* Loading Bar Container */}
          <div className="h-1.5 w-full bg-neutral-800/50 rounded-full overflow-hidden border border-neutral-800 shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 bg-[length:200%_100%] rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]"
            />
          </div>
        </div>

        {/* Footer info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 absolute bottom-[-100px]"
        >
          Alto Andino System • Premium Experience
        </motion.p>
      </div>
    </div>
  );
};

export default LoadingScreen;
