import React from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

export default function HeroSearchBar({ query, setQuery }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="relative mb-5 w-full max-w-2xl self-center group"
    >
      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-[#1A1A1A]/30 group-focus-within:text-[#E6B05C] transition-colors">
        <Search size={16} strokeWidth={2.5} />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar bowls, cafe, postres..."
        className="w-full bg-white shadow-sm border border-black/5 focus:border-[#E6B05C]/50 rounded-full py-3 px-12 text-[#1A1A1A] text-sm font-medium placeholder:text-[#1A1A1A]/30 outline-none transition-all"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery('')}
          className="absolute inset-y-0 right-4 flex items-center justify-center w-8 text-black/30 hover:text-black/60"
        >
          <span className="text-xl leading-none">&times;</span>
        </button>
      )}
    </motion.div>
  );
}
