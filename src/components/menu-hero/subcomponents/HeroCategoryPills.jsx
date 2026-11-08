import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify-icon/react';
import { categoryIcons } from '../../../data/categoryIcons';
import { HERO_CATEGORY_ICONS, FALLBACK_CATEGORY_ICON } from '../data/heroGuideData';

export default function HeroCategoryPills({
  categories = [],
  activeCategory,
  setActiveCategory,
  primaryColor
}) {
  return (
    <div className="relative w-full overflow-visible">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full flex items-center justify-start md:justify-center gap-2.5 overflow-x-auto hide-scrollbar scrollbar-hide pb-2 pt-1 px-1 bg-transparent"
      >
        {[{ slug: 'todos', label: 'Todos' }, ...categories].map((cat, idx) => {
          const catId = cat.slug || cat.id;
          const catLabel = cat.label || cat.name || catId;
          const icon = HERO_CATEGORY_ICONS[catId] || categoryIcons[catId] || cat.icon || FALLBACK_CATEGORY_ICON;
          const isActive = activeCategory === catId;

          return (
            <button
              type="button"
              key={`${catId}-${idx}`}
              onClick={() => setActiveCategory(catId)}
              className={`shrink-0 flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-extrabold transition-all duration-300 ${
                isActive
                  ? 'border-transparent bg-white text-[#1A1A1A] shadow-[0_8px_22px_rgba(0,0,0,0.08)]'
                  : 'border-black/5 bg-white/60 text-[#1A1A1A]/60 hover:bg-white'
              }`}
              style={isActive ? { boxShadow: `0 10px 24px ${primaryColor}1f` } : undefined}
            >
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{
                  backgroundColor: isActive ? `${primaryColor}12` : 'rgba(255,255,255,0.72)',
                  color: isActive ? primaryColor : 'rgba(26,26,26,0.58)'
                }}
              >
                <Icon icon={icon} width="17" height="17" />
              </span>
              <span className="max-w-[120px] truncate">{catLabel}</span>
            </button>
          );
        })}
      </motion.div>
    </div>
  );
}
