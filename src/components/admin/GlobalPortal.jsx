import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Store, 
  Settings, 
  ChevronRight, 
  LogOut, 
  Grid,
  TrendingUp,
  Users,
  Layout
} from 'lucide-react';

export default function GlobalPortal() {
  const { profile, ownedBrands, signOut, switchBrand } = useAuth();

  const handleBrandSelect = async (brand) => {
    await switchBrand(brand);
    // Redirect to the brand's admin panel
    window.location.href = `/${brand.slug}/#admin`;
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-brand-primary/30">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#7db87a]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 px-2">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7db87a] to-[#5a9c57] flex items-center justify-center shadow-lg shadow-[#7db87a]/20">
                <Grid className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium tracking-widest uppercase text-white/40">Aluna Brands Portal</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">
              Hola, {profile?.full_name?.split(' ')[0] || 'dueño'}
            </h1>
            <p className="text-lg text-white/50 max-w-xl">
              Gestiona todas tus marcas y restaurantes desde un solo lugar.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => signOut()}
              className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all flex items-center gap-2 text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
            <a 
              href="/registro"
              className="px-6 py-2.5 rounded-full bg-white text-black hover:bg-gray-200 transition-all flex items-center gap-2 text-sm font-bold shadow-lg shadow-white/5"
            >
              <Plus className="w-4 h-4" />
              Nueva Marca
            </a>
          </div>
        </header>

        {/* Brand Grid */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {ownedBrands.map((brand) => (
            <motion.div 
              key={brand.id}
              variants={item}
              onClick={() => handleBrandSelect(brand)}
              className="group relative cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px] pointer-events-none" />
              
              <div className="h-full bg-white/5 border border-white/10 backdrop-blur-xl rounded-[32px] p-8 flex flex-col transition-all group-hover:bg-white/[0.08] group-hover:border-white/20 group-hover:scale-[1.02] active:scale-[0.98]">
                {/* Brand Identity */}
                <div className="flex items-start justify-between mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                    {brand.logo_url ? (
                      <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-8 h-8 text-white/20" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 rounded-full bg-[#7db87a]/10 border border-[#7db87a]/20">
                      <span className="text-[10px] font-bold text-[#7db87a] uppercase tracking-widest">Activo</span>
                    </div>
                    {brand.plans?.name && (
                      <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                          {brand.plans.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Brand Info */}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-[#7db87a] transition-colors">{brand.name}</h3>
                  <div className="flex items-center gap-2 text-white/40 text-sm mb-6">
                    <span className="capitalize">{brand.business_type || 'Restaurante'}</span>
                    <span>•</span>
                    <span>{brand.slug}.aluna.app</span>
                  </div>

                  {/* Simple Stats Placeholder */}
                  <div className="grid grid-cols-2 gap-4 py-4 border-t border-white/5">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Órdenes Hoy</div>
                      <div className="text-xl font-semibold text-white/90">--</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Ventas Hoy</div>
                      <div className="text-xl font-semibold text-white/90">$0</div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-6 flex items-center justify-between text-[#7db87a]">
                  <span className="text-sm font-bold opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                    Gestionar Negocio
                  </span>
                  <div className="w-10 h-10 rounded-full bg-[#7db87a] flex items-center justify-center shadow-lg shadow-[#7db87a]/20 text-black">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Empty/Add States */}
          {ownedBrands.length === 0 && (
            <motion.div 
              variants={item}
              className="col-span-full py-32 flex flex-col items-center justify-center text-center opacity-50"
            >
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <Store className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold">Sin marcas registradas</h2>
              <p className="max-w-xs mt-2">Parece que aún no tienes ningún negocio configurado en Aluna.</p>
              <a 
                href="/registro"
                className="mt-8 px-8 py-3 rounded-full bg-white text-black font-bold hover:bg-gray-200 transition-all"
              >
                Comenzar ahora
              </a>
            </motion.div>
          )}
        </motion.div>

        {/* Global Stats/Utility Section (Optional future expansion) */}
        {ownedBrands.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-20 pt-12 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h4 className="font-bold mb-1">Rendimiento Global</h4>
                <p className="text-sm text-white/40">Próximamente: Ve el resumen de ingresos de todos tus locales.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h4 className="font-bold mb-1">Gestión de Staff</h4>
                <p className="text-sm text-white/40">Administra los permisos de tu equipo desde un centro unificado.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                <Settings className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <h4 className="font-bold mb-1">Configuración Aluna</h4>
                <p className="text-sm text-white/40">Ajusta tus preferencias de facturación y perfil global.</p>
              </div>
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
