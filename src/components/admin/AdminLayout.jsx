import { useState } from 'react';
import AdminProducts from '../../pages/AdminProducts';
import AdminCategories from '../../pages/AdminCategories';
import AdminModifiers from '../../pages/AdminModifiers';
import AdminExperiences from '../../pages/AdminExperiences';
import AdminRecipes from '../../pages/AdminRecipes';
import AdminBranding from '../../pages/AdminBranding';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', disabled: true },
  { id: 'products', label: 'Productos', icon: '🍔' },
  { id: 'categories', label: 'Categorías', icon: '📂' },
  { id: 'experiences', label: 'Experiencias', icon: '✨' },
  { id: 'modifiers', label: 'Insumos', icon: '🥕' },
  { id: 'recipes', label: 'Recetas', icon: '📝' },
  { id: 'branding', label: 'Branding', icon: '🎨' },
  { id: 'orders', label: 'Pedidos', icon: '📋', disabled: true },
  { id: 'settings', label: 'Configuración', icon: '⚙️', disabled: true },
];

export default function AdminLayout() {
  const [currentPage, setCurrentPage] = useState('products');
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#FAF9F6]">
      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 bottom-0 bg-[#2f4131] text-white flex flex-col z-50 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="p-4 flex flex-col h-full">
           <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} mb-10 mt-4`}>
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-2xl shrink-0">🌋</div>
              {!isCollapsed && (
                <div className="overflow-hidden whitespace-nowrap">
                   <h1 className="text-lg font-black tracking-tight leading-none">Alto Andino</h1>
                   <span className="text-[10px] font-black uppercase tracking-widest text-green-400 opacity-80">Admin SaaS</span>
                </div>
              )}
           </div>

           <nav className="space-y-1">
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.id}
                  disabled={item.disabled}
                  onClick={() => setCurrentPage(item.id)}
                  title={isCollapsed ? item.label : ''}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 ${
                    currentPage === item.id 
                      ? 'bg-white text-[#2f4131] shadow-xl shadow-green-900/40' 
                      : item.disabled 
                        ? 'opacity-30 cursor-not-allowed'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-lg shrink-0">{item.icon}</span>
                  {!isCollapsed && (
                    <span className="overflow-hidden whitespace-nowrap">
                      {item.label}
                      {item.disabled && <span className="ml-2 text-[8px] bg-white/10 px-1.5 py-0.5 rounded uppercase">Soon</span>}
                    </span>
                  )}
                </button>
              ))}
           </nav>

           <div className="mt-auto space-y-2">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full flex items-center justify-center py-3 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 transition-all"
              >
                <span className="text-sm font-bold">{isCollapsed ? '→' : '← Colapsar'}</span>
              </button>
              
              <a
                href="/"
                className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-2xl text-white/60 hover:text-white hover:bg-white/5 font-bold text-sm transition-all`}
              >
                <span>🏠</span>
                {!isCollapsed && <span className="whitespace-nowrap">Volver al Menú</span>}
              </a>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className={`flex-1 min-h-screen flex flex-col transition-all duration-300 ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-40">
           <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest text-[10px]">
              {MENU_ITEMS.find(i => i.id === currentPage)?.label || 'Panel'}
           </h2>
           <div className="flex items-center gap-4">
              <div className="text-right">
                 <p className="text-xs font-black text-gray-900 leading-none">Admin User</p>
                 <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Super Admin</span>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-100" />
           </div>
        </header>

        {/* Dynamic Page Rendering */}
        <div className="flex-1">
          {currentPage === 'products' && <AdminProducts />}
          {currentPage === 'categories' && <AdminCategories />}
          {currentPage === 'experiences' && <AdminExperiences />}
          {currentPage === 'recipes' && <AdminRecipes />}
          {currentPage === 'modifiers' && <AdminModifiers />}
          {currentPage === 'branding' && <AdminBranding />}
          {currentPage === 'dashboard' && (
            <div className="p-20 text-center opacity-20">
               <h3 className="text-4xl font-black uppercase tracking-widest">Dashboard</h3>
               <p>Coming Soon</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

