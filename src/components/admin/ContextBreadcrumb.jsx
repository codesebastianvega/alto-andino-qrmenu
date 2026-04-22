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
  LayoutGrid,
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

  return (
    <div ref={dropdownRef} className="flex items-center gap-1.5 py-1 select-none">
      
      {/* --- BRAND SELECTOR --- */}
      <div className="relative">
        <button
          onClick={() => toggleDropdown('brand')}
          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all duration-300 group ${
            openDropdown === 'brand' 
              ? 'bg-gray-100/80 shadow-inner' 
              : 'hover:bg-gray-50'
          }`}
        >
          <BrandAvatar brand={activeBrand} size={24} />
          <span className="text-[15px] font-bold text-gray-900 tracking-tight">
            {activeBrand.name}
          </span>
          <motion.div
            animate={{ rotate: openDropdown === 'brand' ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
          </motion.div>
        </button>

        <AnimatePresence>
          {openDropdown === 'brand' && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="absolute left-0 top-[calc(100%+8px)] z-[100] w-[280px] bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-2xl shadow-black/10 overflow-hidden"
            >
              <div className="p-2 space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-2">
                  Tus Marcas
                </p>
                {ownedBrands.map((brand) => (
                  <button
                    key={brand.id}
                    onClick={() => handleBrandSwitch(brand)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      brand.id === activeBrand.id 
                        ? 'bg-brand-primary/5 text-brand-primary' 
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <BrandAvatar brand={brand} size={32} />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-bold truncate leading-tight">{brand.name}</p>
                      <p className="text-[10px] opacity-60 capitalize mt-0.5">{brand.business_type || 'Negocio'}</p>
                    </div>
                    {brand.id === activeBrand.id && (
                      <div className="w-5 h-5 rounded-full bg-brand-primary/20 flex items-center justify-center">
                        <Check size={12} className="text-brand-primary" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="p-2 border-t border-gray-100 bg-gray-50/50">
                <button
                  onClick={() => window.location.href = '/?new=1'}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-500 hover:text-brand-primary hover:bg-white transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg border border-dashed border-gray-300 group-hover:border-brand-primary/40 flex items-center justify-center">
                    <Plus size={14} />
                  </div>
                  <span className="text-sm font-semibold">Nueva Marca</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ChevronRight size={14} className="text-gray-300 mx-0.5" />

      {/* --- LOCATION SELECTOR --- */}
      <div className="relative">
        <button
          onClick={() => toggleDropdown('location')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300 group ${
            openDropdown === 'location' 
              ? 'bg-gray-100/80 shadow-inner' 
              : 'hover:bg-gray-50'
          }`}
        >
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
            isAllLocations ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'
          }`}>
            {isAllLocations ? <Building2 size={13} /> : <MapPin size={13} />}
          </div>
          <span className="text-[15px] font-medium text-gray-700 tracking-tight">
            {isAllLocations ? 'Todas las Sedes' : activeLocation?.name || 'Seleccionar Sede'}
          </span>
          <motion.div
            animate={{ rotate: openDropdown === 'location' ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
          </motion.div>
        </button>

        <AnimatePresence>
          {openDropdown === 'location' && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="absolute left-0 top-[calc(100%+8px)] z-[100] w-[240px] bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-2xl shadow-black/10 overflow-hidden"
            >
              <div className="p-2 space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-2">
                  Sedes disponibles
                </p>
                
                {/* Option: All Locations */}
                <button
                  onClick={() => handleLocationSwitch('all')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    isAllLocations 
                      ? 'bg-indigo-50 text-indigo-600' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isAllLocations ? 'bg-indigo-200/40' : 'bg-gray-100'
                  }`}>
                    <Building2 size={16} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold">Todas las Sedes</p>
                    <p className="text-[10px] opacity-60">Vista consolidada</p>
                  </div>
                  {isAllLocations && <Check size={14} />}
                </button>

                <div className="h-px bg-gray-100 my-1 mx-2" />

                {locations.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => handleLocationSwitch(loc.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      loc.id === activeLocationId 
                        ? 'bg-orange-50 text-orange-600' 
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      loc.id === activeLocationId ? 'bg-orange-200/40' : 'bg-gray-100'
                    }`}>
                      <MapPin size={16} />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-bold truncate leading-tight">{loc.name}</p>
                      <p className="text-[10px] opacity-60 truncate capitalize">{loc.city || 'Ubicación'}</p>
                    </div>
                    {loc.id === activeLocationId && <Check size={14} />}
                  </button>
                ))}
              </div>
              
              <div className="p-2 border-t border-gray-100 bg-gray-50/50 text-center">
                 <button 
                  onClick={() => {
                    setOpenDropdown(null);
                    // Emit event or logic to open sedes management
                  }}
                  className="text-[11px] font-bold text-brand-primary/70 hover:text-brand-primary transition-colors flex items-center justify-center gap-1.5 mx-auto py-1"
                 >
                   Gestionar Sedes <ArrowRight size={10} />
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
