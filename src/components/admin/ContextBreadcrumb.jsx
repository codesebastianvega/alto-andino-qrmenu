import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronDown, 
  Store, 
  MapPin, 
  Check, 
  Building2, 
  Plus, 
  ArrowRight,
  Coffee,
  Cake,
  Zap,
  ShoppingBag,
  Grid
} from 'lucide-react';

const BUSINESS_TYPE_ICON = {
  restaurant: Store,
  cafe: Coffee,
  bakery: Cake,
  dark_kitchen: Zap,
  store: ShoppingBag,
  other: Grid,
};

function BrandAvatar({ brand, size = 24 }) {
  const Icon = BUSINESS_TYPE_ICON[brand?.business_type] || Store;
  if (brand?.logo_url) {
    return (
      <img
        src={brand.logo_url}
        alt={brand.name}
        style={{ width: size, height: size }}
        className="rounded-lg object-cover shrink-0 shadow-sm"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-lg bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shrink-0"
    >
      <Icon size={size * 0.6} className="text-brand-primary" />
    </div>
  );
}

export default function ContextBreadcrumb() {
  const { activeBrand, ownedBrands, switchBrand } = useAuth();
  const { locations, activeLocationId, activeLocation, switchLocation, isAllLocations } = useLocation();
  
  const [openDropdown, setOpenDropdown] = useState(null); // 'brand' | 'location' | null
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!activeBrand) return null;

  const toggleDropdown = (type) => {
    setOpenDropdown(openDropdown === type ? null : type);
  };

  const handleBrandSwitch = async (brand) => {
    setOpenDropdown(null);
    await switchBrand(brand);
    // Persist brand selection and reload to update contexts
    window.location.href = `/${brand.slug}/#admin`;
  };

  const handleLocationSwitch = (id) => {
    switchLocation(id);
    setOpenDropdown(null);
  };

  // Dynamic Styles
  const activeBrandColor = activeBrand.restaurant_settings?.primary_color || '#b8a17a';
  const royalIndigo = '#6366f1'; // Premium Executive Indigo

  return (
    <div ref={dropdownRef} className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-2 py-1 select-none w-full lg:w-auto">
      
      {/* ── Brand Selector (Dynamic Glassmorphism) ───────────────────── */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => toggleDropdown('brand')}
          style={{ 
            backgroundColor: `${activeBrandColor}20`,
            borderColor: `${activeBrandColor}40`,
            boxShadow: openDropdown === 'brand' ? `0 0 20px ${activeBrandColor}15` : 'none'
          }}
          className={`flex items-center gap-2.5 px-3 py-2 lg:py-1.5 rounded-xl border backdrop-blur-md transition-all duration-300 group w-full lg:w-auto`}
        >
          <BrandAvatar brand={activeBrand} size={24} />
          <span className="text-[14px] font-extrabold text-white lg:text-gray-900 tracking-tight">
            {activeBrand.name}
          </span>
          <motion.div
            animate={{ rotate: openDropdown === 'brand' ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {openDropdown === 'brand' && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              className="absolute left-0 right-0 lg:right-auto top-[calc(100%+12px)] z-[100] w-full lg:w-[320px] bg-[#1A1A1A] lg:bg-white/80 backdrop-blur-2xl rounded-2xl border border-white/20 lg:border-white shadow-2xl shadow-black/80 overflow-hidden"
            >
              <div className="p-2.5 space-y-1.5">
                <p className="text-[11px] font-black text-white/40 lg:text-gray-400 uppercase tracking-[0.2em] px-3 py-2">
                  Tus Marcas
                </p>
                {ownedBrands.map((brand) => {
                  const brandColor = brand.restaurant_settings?.[0]?.primary_color || brand.restaurant_settings?.primary_color || '#b8a17a';
                  const isSelected = brand.id === activeBrand.id;
                  return (
                    <button
                      key={brand.id}
                      onClick={() => handleBrandSwitch(brand)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group ${
                        isSelected 
                          ? 'bg-white text-gray-900 shadow-xl' 
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      <BrandAvatar brand={brand} size={36} />
                      <div className="flex-1 text-left min-w-0">
                        <p className={`text-[14px] font-bold truncate leading-tight ${isSelected ? 'text-gray-900' : 'text-white'}`}>
                          {brand.name}
                        </p>
                        <p className={`text-[11px] font-medium capitalize mt-1 ${isSelected ? 'text-gray-500' : 'text-white/50'}`}>
                          {brand.business_type || 'Negocio'}
                        </p>
                      </div>
                      {isSelected ? (
                        <div 
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all shadow-sm"
                          style={{ backgroundColor: `${brandColor}20`, color: brandColor }}
                        >
                          <Check size={16} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowRight size={16} className="text-white/40" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="p-2 border-t border-white/10 lg:border-gray-100/50 bg-white/5 lg:bg-gray-50/30">
                <button
                  onClick={() => window.location.href = '/?new=1'}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-white/10 lg:hover:bg-gray-50 transition-colors text-white/80 lg:text-gray-600"
                >
                  <div className="w-9 h-9 rounded-lg border border-dashed border-white/30 lg:border-gray-300 flex items-center justify-center">
                    <Plus size={18} />
                  </div>
                  <span className="text-sm font-bold">Añadir Nueva Marca</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ChevronRight size={14} className="text-gray-300 mx-0.5 hidden lg:block" />

      {/* ── Location Selector (Coral Blue Glass) ────────────────────── */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => toggleDropdown('location')}
          style={{ 
            backgroundColor: `${royalIndigo}20`,
            borderColor: `${royalIndigo}40`,
            boxShadow: openDropdown === 'location' ? `0 0 20px ${royalIndigo}20` : 'none'
          }}
          className={`flex items-center gap-3 px-4 py-2.5 lg:py-1.5 rounded-xl border backdrop-blur-md transition-all duration-300 group w-full lg:w-auto shadow-sm`}
        >
          <div 
            className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
            style={{ backgroundColor: `${royalIndigo}40`, color: '#FFFFFF' }}
          >
            {isAllLocations ? <Building2 size={13} /> : <MapPin size={13} />}
          </div>
          <span className="text-[14px] font-extrabold text-white lg:text-gray-800 tracking-tight">
            {isAllLocations ? 'Todas las Sedes' : activeLocation?.name || 'Seleccionar Sede'}
          </span>
          <motion.div
            animate={{ rotate: openDropdown === 'location' ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <ChevronDown size={14} className="text-white/60 lg:text-gray-400 group-hover:text-white transition-colors" />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {openDropdown === 'location' && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              className="absolute left-0 right-0 lg:right-auto top-[calc(100%+12px)] z-[100] w-full lg:w-[280px] bg-[#1A1A1A] lg:bg-white/80 backdrop-blur-2xl rounded-2xl border border-white/20 lg:border-white shadow-2xl shadow-black/80 overflow-hidden"
            >
              <div className="p-2.5 space-y-1.5">
                <p className="text-[11px] font-black text-white/40 lg:text-gray-400 uppercase tracking-[0.2em] px-3 py-2">
                  Tus Sedes
                </p>
                
                {/* Option: All Locations */}
                <button
                  onClick={() => handleLocationSwitch('all')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                    isAllLocations 
                      ? 'bg-white text-gray-900 shadow-xl' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <div 
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                      isAllLocations ? 'bg-brand-primary/10 text-brand-primary' : 'bg-white/10 text-white/70'
                    }`}
                  >
                    <Building2 size={18} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className={`text-[14px] font-bold truncate ${isAllLocations ? 'text-gray-900' : 'text-white'}`}>
                      Todas las Sedes
                    </p>
                    <p className={`text-[11px] ${isAllLocations ? 'text-gray-500' : 'text-white/50'}`}>
                      Vista consolidada
                    </p>
                  </div>
                  {isAllLocations && <Check size={16} className="text-brand-primary" strokeWidth={3} />}
                </button>

                <div className="h-px bg-white/10 lg:bg-gray-100/50 my-1.5 mx-2" />

                {locations.map((loc) => {
                  const isSelected = loc.id === activeLocationId;
                  return (
                    <button
                      key={loc.id}
                      onClick={() => handleLocationSwitch(loc.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                        isSelected 
                          ? 'bg-white text-gray-900 shadow-xl' 
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      <div 
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                          isSelected ? 'bg-brand-primary/10 text-brand-primary' : 'bg-white/10 text-white/70'
                        }`}
                      >
                        <MapPin size={18} />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className={`text-[14px] font-bold truncate leading-tight ${isSelected ? 'text-gray-900' : 'text-white'}`}>
                          {loc.name}
                        </p>
                        <p className={`text-[11px] truncate capitalize ${isSelected ? 'text-gray-500' : 'text-white/50'}`}>
                          {loc.city || 'Ubicación'}
                        </p>
                      </div>
                      {isSelected && <Check size={16} className="text-brand-primary" strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
              
              <div className="p-3 border-t border-white/10 lg:border-gray-100/50 bg-white/5 lg:bg-gray-50/30 text-center">
                 <button 
                  onClick={() => setOpenDropdown(null)}
                  className="text-[12px] font-black tracking-wider uppercase text-brand-primary hover:brightness-110 transition-all flex items-center justify-center gap-2 mx-auto"
                 >
                   Gestionar Sedes <ChevronRight size={14} />
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
