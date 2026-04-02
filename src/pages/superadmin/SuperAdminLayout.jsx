import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { supabase } from '../../config/supabase';

export default function SuperAdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // In Bloque 3 we will add real protection logic, for now simple skeleton
  // useEffect(() => {
  //   checkSuperAdmin();
  // }, []);

  const navItems = [
    { icon: LayoutDashboard, label: 'Métricas', path: '/superadmin' },
    { icon: Store, label: 'Negocios', path: '/superadmin/brands' },
    { icon: CreditCard, label: 'Planes', path: '/superadmin/plans' },
    { icon: Settings, label: 'Configuración', path: '/superadmin/settings' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="flex bg-[#F7F7F5] min-h-screen text-[#1A1A1A] font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-[#E5E7EB] flex flex-col transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#E5E7EB]">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-800 to-emerald-600" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Aluna
          </h1>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 lg:hidden rounded-lg hover:bg-gray-100"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          <div className="px-6 mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              SuperAdmin Panel
            </p>
          </div>
          <nav className="space-y-1 px-4">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/superadmin'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon size={20} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-[#E5E7EB]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all font-medium"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 flex flex-col min-h-screen relative">
        {/* Mobile Header */}
        <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center px-4 lg:hidden sticky top-0 z-30">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 mr-4"
          >
            <Menu size={20} className="text-[#1A1A1A]" />
          </button>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-800 to-emerald-600" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Aluna
          </span>
        </header>

        <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
