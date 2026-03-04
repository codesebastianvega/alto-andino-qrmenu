import React from 'react';

export default function BottomTabBar({ currentHash }) {
  const tabs = [
    { id: 'inicio', label: 'Inicio', icon: '🏠', hash: '#inicio' },
    { id: 'menu', label: 'Menú', icon: '🍽️', hash: '#menu' },
    { id: 'experiencias', label: 'Experiencias', icon: '✨', hash: '#experiencias' },
    { id: 'perfil', label: 'Perfil', icon: '👤', hash: '#perfil' },
  ];

  // Default to menu if no hash or unrecognizable hash (like #order/123 or #admin)
  // For admin and order tracking, this bar shouldn't even render from App.jsx,
  // but if it does, we just won't have an active tab unless we handle it here.
  const activeTabId = tabs.find(t => currentHash === t.hash || (t.id === 'menu' && (currentHash === '' || currentHash === '#')) )?.id || 'menu';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] md:hidden">
      <div className="backdrop-blur-md bg-white/80 border-t border-neutral-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center pt-2 pb-safe-bottom">
          {tabs.map((tab) => {
            const isActive = activeTabId === tab.id;
            return (
              <a
                key={tab.id}
                href={tab.hash}
                className={`flex flex-col items-center justify-center w-full py-2 px-1 gap-1 transition-colors ${
                  isActive ? 'text-alto-primary' : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                <span className={`text-2xl mb-1 transition-transform ${isActive ? 'scale-110' : 'scale-100 grayscale opacity-70'}`}>
                  {tab.icon}
                </span>
                <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'text-black font-semibold' : 'text-neutral-500'}`}>
                  {tab.label}
                </span>
                
                {/* Active indicator dot */}
                <span className={`w-1 h-1 rounded-full mt-1 transition-opacity ${isActive ? 'bg-alto-text opacity-100' : 'opacity-0'}`} />
              </a>
            );
          })}
        </div>
      </div>
      
      {/* Spacer for bottom safe area on modern phones (iOS) */}
      <div className="h-safe-bottom bg-white/80 backdrop-blur-md w-full"></div>
    </div>
  );
}
