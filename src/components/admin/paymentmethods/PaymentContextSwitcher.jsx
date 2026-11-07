import { Globe, MapPin } from 'lucide-react';

export default function PaymentContextSwitcher({
  activeContext,
  setActiveContext,
  locations
}) {
  return (
    <div className="bg-gray-100/90 rounded-2xl p-1.5 border border-gray-200/70 inline-flex items-center gap-1 max-w-full overflow-x-auto custom-scrollbar">
      <button
        type="button"
        onClick={() => setActiveContext('brand')}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
          activeContext === 'brand' 
            ? 'bg-white text-gray-900 shadow-xs' 
            : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
        }`}
      >
        <Globe size={14} className={activeContext === 'brand' ? 'text-[#2f4131]' : 'text-gray-400'} />
        <span>Global (Marca)</span>
      </button>
      
      <div className="w-px h-4 bg-gray-300/70 mx-1 shrink-0" />

      {locations.map(loc => (
        <button
          key={loc.id}
          type="button"
          onClick={() => setActiveContext(loc.id)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeContext === loc.id 
              ? 'bg-white text-gray-900 shadow-xs' 
              : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
          }`}
        >
          <MapPin size={14} className={activeContext === loc.id ? 'text-[#2f4131]' : 'text-gray-400'} />
          <span>{loc.name}</span>
        </button>
      ))}
    </div>
  );
}
