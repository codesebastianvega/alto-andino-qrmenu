import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Store,
  Settings,
  ChevronRight,
  LogOut,
  Grid,
  TrendingUp,
  Users,
  Coffee,
  ShoppingBag,
  Zap,
  Cake,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Trash2,
  AlertTriangle,
  Crown,
} from 'lucide-react';

// ── Planes disponibles ───────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'c782ae70-f342-448a-81f2-05a5cfd3ed83',
    name: 'Emprendedor',
    price: 'Gratis',
    color: '#6B7280',
    desc: 'Para comenzar',
  },
  {
    id: '64b69a3f-cba9-4569-84ea-4154f9fe1e95',
    name: 'Esencial',
    price: '$29/mes',
    color: '#2D6A4F',
    desc: 'Landing + Experiencias',
  },
  {
    id: 'ed869093-1a43-4bc1-94d6-ed773e1af1df',
    name: 'Profesional ⭐',
    price: '$79/mes',
    color: '#1d4ed8',
    desc: 'IA + Analíticas',
  },
  {
    id: '282dc250-c791-4a7d-a4ab-d0d107fc2550',
    name: 'Enterprise',
    price: 'Custom',
    color: '#7c3aed',
    desc: 'Escala sin límites',
  },
];

// ── Tipos de negocio ─────────────────────────────────────────────────────────
const BUSINESS_TYPES = [
  { value: 'restaurant',   label: 'Restaurante',  Icon: Store      },
  { value: 'cafe',         label: 'Cafetería',    Icon: Coffee     },
  { value: 'bakery',       label: 'Panadería',    Icon: Cake       },
  { value: 'dark_kitchen', label: 'Dark Kitchen', Icon: Zap        },
  { value: 'store',        label: 'Tienda',       Icon: ShoppingBag },
  { value: 'other',        label: 'Otro',         Icon: Grid       },
];

// ── Helper: crear brand ──────────────────────────────────────────────────────
async function createBrand({ userId, name, businessType, planId }) {
  const slug =
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') +
    '-' + Date.now().toString(36);

  const { data: brand, error } = await supabase
    .from('brands')
    .insert({
      name, slug, owner_id: userId, is_active: true,
      plan_id: planId, business_type: businessType,
      onboarding_completed: false,
    })
    .select().single();

  if (error) throw new Error('No se pudo crear el negocio: ' + error.message);

  await Promise.allSettled([
    supabase.from('restaurant_settings').insert({ brand_id: brand.id, business_name: name }),
    supabase.from('home_settings').insert({ brand_id: brand.id }),
    supabase.from('staff').insert({ name: 'Admin Principal', role: 'admin', pin: '1234', brand_id: brand.id }),
  ]);

  return brand;
}

// ── Modal de eliminación de marca ────────────────────────────────────────────
function DeleteBrandModal({ brand, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      // Eliminar datos relacionados primero para evitar errores de FK
      await Promise.allSettled([
        supabase.from('staff').delete().eq('brand_id', brand.id),
        supabase.from('restaurant_settings').delete().eq('brand_id', brand.id),
        supabase.from('home_settings').delete().eq('brand_id', brand.id),
      ]);
      const { error: err } = await supabase.from('brands').delete().eq('id', brand.id);
      if (err) throw err;
      setConfirmed(true);
      setTimeout(onDeleted, 900);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-sm"
      >
        <div className="bg-[#111] border border-red-500/20 rounded-[2rem] p-8 shadow-2xl overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/10 blur-[50px] rounded-full pointer-events-none" />

          <AnimatePresence mode="wait">
            {confirmed ? (
              <motion.div
                key="ok"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center py-6 text-center"
              >
                <CheckCircle2 className="w-10 h-10 text-[#7db87a] mb-3" />
                <p className="text-white font-bold">Marca eliminada</p>
                <p className="text-white/40 text-sm mt-1">Se borró permanentemente</p>
              </motion.div>
            ) : (
              <motion.div key="form" className="space-y-5">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <button onClick={onClose} className="p-2 rounded-full text-white/30 hover:text-white/70 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-1">¿Eliminar esta marca?</h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    La marca <strong className="text-white">{brand.name}</strong> y todos sus datos se
                    <strong className="text-red-300"> eliminarán permanentemente</strong>. Esta acción no se puede deshacer.
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-sm font-medium transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 text-sm font-bold transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    {loading ? 'Eliminando…' : 'Sí, eliminar'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Modal de creación de Marca ───────────────────────────────────────────────
function NewBrandModal({ onClose, onCreated }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState('restaurant');
  const [selectedPlanId, setSelectedPlanId] = useState(PLANS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('El nombre del negocio es obligatorio.'); return; }
    setLoading(true);
    setError(null);
    try {
      const brand = await createBrand({
        userId: user.id,
        name: name.trim(),
        businessType,
        planId: selectedPlanId,
      });
      setSuccess(true);
      setTimeout(() => onCreated(brand), 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && !success && onClose()}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-lg"
      >
        <div className="bg-[#111] border border-white/10 rounded-[2rem] p-8 shadow-2xl overflow-hidden">
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#7db87a]/12 blur-[60px] rounded-full pointer-events-none" />

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-[#7db87a]/20 border border-[#7db87a]/30 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-[#7db87a]" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#7db87a]">Nueva Marca</span>
              </div>
              <h2 className="text-2xl font-bold text-white leading-tight">
                Agrega un nuevo<br />negocio
              </h2>
              <p className="text-sm text-white/40 mt-1">Se conectará a tu cuenta actual.</p>
            </div>
            {!success && (
              <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 250, damping: 20, delay: 0.1 }}
                  className="w-16 h-16 rounded-full bg-[#7db87a]/20 flex items-center justify-center mb-4 border border-[#7db87a]/30"
                >
                  <CheckCircle2 className="w-8 h-8 text-[#7db87a]" />
                </motion.div>
                <p className="text-white font-bold text-lg">¡Marca creada!</p>
                <p className="text-white/40 text-sm mt-1">Yendo a la configuración inicial…</p>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={handleCreate} className="space-y-6">

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Brand Name */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    Nombre del Negocio
                  </label>
                  <div className="relative">
                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: La Postrería del Norte"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#7db87a]/40 focus:border-[#7db87a]/50 transition-all text-sm"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Business Type */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    Tipo de Negocio
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {BUSINESS_TYPES.map(({ value, label, Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setBusinessType(value)}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-[9px] uppercase font-bold tracking-tight transition-all ${
                          businessType === value
                            ? 'border-[#7db87a]/60 bg-[#7db87a]/10 text-[#7db87a]'
                            : 'border-white/10 text-white/30 hover:border-white/20 hover:text-white/60'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Plan */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                    <Crown className="w-3 h-3" />
                    Plan
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PLANS.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                          selectedPlanId === plan.id
                            ? 'border-opacity-60 bg-opacity-10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                        style={
                          selectedPlanId === plan.id
                            ? { borderColor: plan.color + '80', backgroundColor: plan.color + '15' }
                            : {}
                        }
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span
                            className="text-[10px] font-bold uppercase tracking-widest"
                            style={{ color: selectedPlanId === plan.id ? plan.color : '#ffffff50' }}
                          >
                            {plan.name}
                          </span>
                          {selectedPlanId === plan.id && (
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: plan.color }}
                            />
                          )}
                        </div>
                        <span className="text-white text-sm font-bold">{plan.price}</span>
                        <span className="text-white/30 text-[10px] mt-0.5">{plan.desc}</span>
                      </button>
                    ))}
                  </div>
                  {selectedPlanId !== PLANS[0].id && (
                    <p className="text-[10px] text-white/30 px-1">
                      💡 Los planes de pago requieren configuración de suscripción. Por ahora se asignará el plan y se activará manualmente.
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#7db87a] text-black font-bold text-sm hover:bg-[#8ec98b] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#7db87a]/20"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Creando…</>
                  ) : (
                    <><Sparkles className="w-4 h-4" />Crear Marca</>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── GlobalPortal ─────────────────────────────────────────────────────────────
export default function GlobalPortal() {
  const { profile, ownedBrands, signOut, switchBrand, refreshProfile, user } = useAuth();
  const [showNewBrandModal, setShowNewBrandModal] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState(null);

  // Auto-abrir modal si viene ?new=1 (desde BrandSwitcher)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('new') === '1') {
      setShowNewBrandModal(true);
      // Limpiar el param de la URL sin recargar
      const url = new URL(window.location.href);
      url.searchParams.delete('new');
      window.history.replaceState(null, '', url);
    }
  }, []);

  const handleBrandSelect = async (brand) => {
    try {
      console.log("🚀 Switching to brand:", brand.slug);
      await switchBrand(brand);
      console.log("✅ Switch complete. Redirecting...");
      window.location.href = `/${brand.slug}/#admin`;
    } catch (err) {
      console.error("❌ Error switching brand:", err);
    }
  };

  const handleBrandCreated = async (newBrand) => {
    await refreshProfile(user.id);
    await switchBrand(newBrand);
    window.location.href = `/${newBrand.slug}/#admin/onboarding`;
  };

  const handleBrandDeleted = async () => {
    setBrandToDelete(null);
    await refreshProfile(user.id);
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <>
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
            </div>
          </header>

          {/* Brand Grid */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* Brand cards */}
            {ownedBrands.map((brand) => (
              <motion.div
                key={brand.id}
                variants={item}
                className="group relative cursor-pointer"
                onClick={() => {
                  console.log("Card clicked!", brand);
                  handleBrandSelect(brand);
                }}
              >
                {/* Delete button (hover reveal) */}
                <button
                  onClick={(e) => { e.stopPropagation(); setBrandToDelete(brand); }}
                  className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-red-500/0 hover:bg-red-500/20 border border-red-500/0 hover:border-red-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                  title="Eliminar marca"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>

                {/* Glow overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px] pointer-events-none" />

                <div
                  className="h-full bg-white/5 border border-white/10 backdrop-blur-xl rounded-[32px] p-8 flex flex-col transition-all group-hover:bg-white/[0.08] group-hover:border-white/20 group-hover:scale-[1.02] active:scale-[0.98]"
                >
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
                    <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-[#7db87a] transition-colors">
                      {brand.name}
                    </h3>
                    <div className="flex items-center gap-2 text-white/40 text-sm mb-6">
                      <span className="capitalize">{brand.business_type || 'Restaurante'}</span>
                      <span>•</span>
                      <span>{brand.slug}.aluna.app</span>
                    </div>

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

            {/* Tarjeta "+" */}
            <motion.div
              variants={item}
              onClick={() => setShowNewBrandModal(true)}
              className="group relative cursor-pointer"
            >
              <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-[#7db87a]/0 to-[#7db87a]/0 group-hover:from-[#7db87a]/20 group-hover:to-blue-500/10 transition-all duration-500 pointer-events-none" />

              <div className="h-full min-h-[280px] border-2 border-dashed border-white/10 rounded-[32px] p-8 flex flex-col items-center justify-center text-center transition-all group-hover:border-[#7db87a]/40 group-hover:bg-[#7db87a]/5 active:scale-[0.98]">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 15 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 group-hover:bg-[#7db87a]/20 group-hover:border-[#7db87a]/40 flex items-center justify-center mb-5 transition-all"
                >
                  <Plus className="w-8 h-8 text-white/20 group-hover:text-[#7db87a] transition-colors" />
                </motion.div>

                <h3 className="text-lg font-bold text-white/30 group-hover:text-white transition-colors mb-1">
                  Nueva Marca
                </h3>
                <p className="text-sm text-white/20 group-hover:text-white/40 transition-colors max-w-[180px] leading-relaxed">
                  Agrega otro negocio a tu cuenta
                </p>

                <div className="mt-6 px-5 py-2 rounded-full bg-white/5 border border-white/10 group-hover:bg-[#7db87a]/20 group-hover:border-[#7db87a]/40 transition-all">
                  <span className="text-xs font-bold text-white/30 group-hover:text-[#7db87a] transition-colors uppercase tracking-widest">
                    Comenzar
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Estado vacío */}
            {ownedBrands.length === 0 && (
              <motion.div
                variants={item}
                className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-50"
              >
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  <Store className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold">Sin marcas registradas</h2>
                <p className="max-w-xs mt-2 text-white/50">
                  Usa la tarjeta de arriba para crear tu primer negocio en Aluna.
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Footer */}
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

      {/* ── Modales ── */}
      <AnimatePresence>
        {showNewBrandModal && (
          <NewBrandModal
            onClose={() => setShowNewBrandModal(false)}
            onCreated={handleBrandCreated}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {brandToDelete && (
          <DeleteBrandModal
            brand={brandToDelete}
            onClose={() => setBrandToDelete(null)}
            onDeleted={handleBrandDeleted}
          />
        )}
      </AnimatePresence>
    </>
  );
}
