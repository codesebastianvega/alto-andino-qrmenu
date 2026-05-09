import { useState, useMemo } from 'react';
import { Icon } from '@iconify-icon/react';
import { SearchInput } from './ui';

const CURATED_ICONS = [
  // Food
  { icon: 'lucide:utensils', label: 'Cubiertos' },
  { icon: 'lucide:utensils-crossed', label: 'Cubiertos Cruzados' },
  { icon: 'lucide:pizza', label: 'Pizza' },
  { icon: 'lucide:burger', label: 'Hamburguesa' },
  { icon: 'lucide:sandwich', label: 'Sandwich' },
  { icon: 'lucide:salad', label: 'Ensalada' },
  { icon: 'lucide:soup', label: 'Sopa' },
  { icon: 'lucide:egg', label: 'Huevo / Desayuno' },
  { icon: 'lucide:croissant', label: 'Panadería' },
  { icon: 'lucide:cake-slice', label: 'Postre' },
  { icon: 'lucide:ice-cream', label: 'Helado' },
  { icon: 'lucide:beef', label: 'Carnes' },
  { icon: 'lucide:fish', label: 'Pescados' },
  { icon: 'lucide:apple', label: 'Frutas' },
  { icon: 'lucide:carrot', label: 'Vegetales' },
  
  // Drinks
  { icon: 'lucide:coffee', label: 'Café' },
  { icon: 'lucide:cup-soda', label: 'Bebidas' },
  { icon: 'lucide:beer', label: 'Cerveza' },
  { icon: 'lucide:wine', label: 'Vinos' },
  { icon: 'lucide:martini', label: 'Cocteles' },
  { icon: 'lucide:glass-water', label: 'Agua' },
  
  // Tags/Attributes
  { icon: 'lucide:flame', label: 'Picante / Popular' },
  { icon: 'lucide:leaf', label: 'Vegano / Saludable' },
  { icon: 'lucide:star', label: 'Destacado' },
  { icon: 'lucide:heart', label: 'Favorito' },
  { icon: 'lucide:clock', label: 'Tiempo / Horario' },
  { icon: 'lucide:chef-hat', label: 'Especialidad' },
  { icon: 'lucide:award', label: 'Premio' },
  { icon: 'lucide:ticket', label: 'Oferta' },
  { icon: 'lucide:shopping-bag', label: 'Para llevar' },
];

const COMMON_EMOJIS = [
  '🍽️', '🍳', '🍕', '🍔', '🌮', '🥗', '🍜', '🍱', '🥩', '🍰', '🍦', '☕', '🍷', '🍺', '🥤', '🥑', '🥐', '🌶️', '🌿', '✨'
];

export default function IconPicker({ value, onChange, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredIcons = useMemo(() => {
    if (!search) return CURATED_ICONS;
    const s = search.toLowerCase();
    return CURATED_ICONS.filter(i => 
      i.label.toLowerCase().includes(s) || i.icon.toLowerCase().includes(s)
    );
  }, [search]);

  const isEmoji = (val) => {
    return !val?.includes(':');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-[#2f4131]/30 hover:bg-white transition-all group"
      >
        <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
          {value ? (
            isEmoji(value) ? (
              <span>{value}</span>
            ) : (
              <Icon icon={value} className="text-[#2f4131]" style={{ color: 'currentColor' }} />
            )
          ) : (
            <Icon icon="lucide:plus" className="text-gray-300 text-sm" />
          )}
        </div>
        <div className="flex-1 text-left">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight leading-none mb-1">
            Icono Seleccionado
          </p>
          <p className="text-xs font-bold text-gray-700 truncate">
            {value ? (isEmoji(value) ? 'Emoji' : value.split(':')[1]) : 'Seleccionar...'}
          </p>
        </div>
        <Icon icon="lucide:chevron-down" className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[110]" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full left-0 mt-2 w-[320px] bg-white border border-gray-100 rounded-2xl shadow-2xl z-[120] p-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <SearchInput 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Buscar icono o emoji..."
            />

            <div className="mt-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
              {/* Emojis Section */}
              {!search && (
                <div className="mb-6">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Emojis Populares</p>
                  <div className="grid grid-cols-5 gap-1">
                    {COMMON_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          onChange({ target: { name: 'icon', value: emoji } });
                          setIsOpen(false);
                        }}
                        className={`aspect-square rounded-xl flex items-center justify-center text-xl hover:bg-gray-100 transition-all ${value === emoji ? 'bg-[#2f4131]/10 ring-1 ring-[#2f4131]/20' : ''}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Iconify Section */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                  {search ? 'Resultados' : 'Iconos de la Marca'}
                </p>
                <div className="grid grid-cols-5 gap-1">
                  {filteredIcons.map(item => (
                    <button
                      key={item.icon}
                      type="button"
                      title={item.label}
                      onClick={() => {
                        onChange({ target: { name: 'icon', value: item.icon } });
                        setIsOpen(false);
                      }}
                      className={`aspect-square rounded-xl flex items-center justify-center text-xl hover:bg-gray-100 transition-all ${value === item.icon ? 'bg-[#2f4131]/10 ring-1 ring-[#2f4131]/20' : ''}`}
                    >
                      <Icon icon={item.icon} className={value === item.icon ? 'text-[#2f4131]' : 'text-gray-500'} style={{ color: 'currentColor' }} />
                    </button>
                  ))}
                  
                  {/* Manual Input if searching and no results */}
                  {search && filteredIcons.length === 0 && (
                    <div className="col-span-5 py-4 text-center">
                      <p className="text-[11px] text-gray-400 font-medium">No encontramos "{search}" en la lista curada.</p>
                      <button
                        type="button"
                        onClick={() => {
                          onChange({ target: { name: 'icon', value: search } });
                          setIsOpen(false);
                        }}
                        className="mt-2 text-[10px] font-bold text-[#2f4131] underline underline-offset-4"
                      >
                        Usar "{search}" como ID de Iconify
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
               <p className="text-[9px] text-gray-400 font-medium">Tip: Puedes usar nombres de Lucide</p>
               <button 
                 type="button" 
                 onClick={() => {
                   onChange({ target: { name: 'icon', value: '' } });
                   setIsOpen(false);
                 }}
                 className="text-[10px] font-bold text-red-500 hover:text-red-600"
               >
                 Limpiar
               </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
