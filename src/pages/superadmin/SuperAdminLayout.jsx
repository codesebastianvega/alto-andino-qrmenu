import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  Home,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';

export default function SuperAdminLayout() {
  const [typography, setTypography] = useState('inter');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { activeBrand } = useAuth();

  const navItems = [
    { icon: LayoutDashboard, label: 'Métricas', path: '/superadmin' },
    { icon: MessageSquare, label: 'Leads', path: '/superadmin/leads' },
    { icon: Store, label: 'Negocios', path: '/superadmin/brands' },
    { icon: Users, label: 'Usuarios', path: '/superadmin/users' },
    { icon: CreditCard, label: 'Planes', path: '/superadmin/plans' },
    { icon: Settings, label: 'Configuración', path: '/superadmin/settings' },
  ];

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('global_settings')
          .select('typography')
          .limit(1)
          .single();
        if (data && data.typography) {
          setTypography(data.typography);
        }
      } catch (err) {
        console.error('Error fetching layout settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Superadmin signOut error:', err);
    }
    navigate('/');
  };

  const handleBackToDashboard = () => {
    if (activeBrand?.slug) {
      window.location.href = `/${activeBrand.slug}/#admin`;
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex bg-alto-beige min-h-screen text-alto-text font-sans" data-typography={typography}>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-all"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Floating Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-50 lg:w-80 w-72 lg:p-6 transition-transform duration-300 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <aside
          className="h-full bg-slate-900/95 backdrop-blur-2xl border border-slate-800 lg:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative"
        >
          {/* Subtle glow effect top left */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-500/20 to-transparent opacity-50 pointer-events-none"></div>

          <div className="h-20 flex items-center justify-between px-8 border-b border-slate-800/50 relative z-10">
            <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              Aluna <span className="text-indigo-400 text-sm align-top ml-1">Admin</span>
            </h1>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 lg:hidden rounded-lg hover:bg-slate-800 text-slate-400"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-8 relative z-10 custom-scrollbar">
            <div className="px-8 mb-4">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 font-sans">
                Centro de Comando
              </p>
            </div>
            <nav className="space-y-1.5 px-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/superadmin'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 font-medium text-sm ${
                      isActive
                        ? 'bg-indigo-500/15 text-indigo-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] border border-indigo-500/20'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={18} className={isActive ? 'text-indigo-400' : 'text-slate-500'} />
                      {item.label}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-slate-800/50 space-y-1 relative z-10 bg-slate-900/50">
            <button
              onClick={handleBackToDashboard}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all font-medium text-sm"
            >
              <ArrowLeft size={18} />
              Dashboard Franquicia
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all font-medium text-sm"
            >
              <Home size={18} />
              Portal de Marcas
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all font-medium text-sm mt-2"
            >
              <LogOut size={18} />
              Cerrar Sesión
            </button>
          </div>
        </aside>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-80 flex flex-col min-h-screen relative">
        {/* Mobile Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-4 lg:hidden sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
            >
              <Menu size={20} />
            </button>
            <span className="text-xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-heading)' }}>
              Aluna
            </span>
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
