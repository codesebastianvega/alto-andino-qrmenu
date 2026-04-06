import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { UserPlus, AlertCircle, Store, Coffee, Cake, Zap, ShoppingBag, Grid } from 'lucide-react';

// Plan IDs from DB
const PLAN_IDS = {
  emprendedor: 'c782ae70-f342-448a-81f2-05a5cfd3ed83',
  esencial: '64b69a3f-cba9-4569-84ea-4154f9fe1e95',
  profesional: 'ed869093-1a43-4bc1-94d6-ed773e1af1df',
  enterprise: '282dc250-c791-4a7d-a4ab-d0d107fc2550',
};

const PLAN_LABELS = {
  emprendedor: { name: 'Emprendedor', color: '#6B7280', bg: '#F3F4F6' },
  esencial:    { name: 'Esencial', color: '#2D6A4F', bg: '#ECFDF5' },
  profesional: { name: 'Profesional ⭐', color: '#1d4ed8', bg: '#EFF6FF' },
  enterprise:  { name: 'Enterprise', color: '#7c3aed', bg: '#F5F3FF' },
};

const BUSINESS_TYPES = [
  { value: 'restaurant', label: 'Restaurante', Icon: Store },
  { value: 'cafe',       label: 'Cafetería',   Icon: Coffee },
  { value: 'bakery',     label: 'Panadería',   Icon: Cake },
  { value: 'dark_kitchen', label: 'Dark Kitchen', Icon: Zap },
  { value: 'store',      label: 'Tienda',      Icon: ShoppingBag },
  { value: 'other',      label: 'Otro',        Icon: Grid },
];

export default function RegisterPage() {
  const { signUp } = useAuth();

  // Read plan from URL search query (?plan=profesional)
  const getPlanFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('plan') || 'emprendedor';
  };

  const [selectedPlan] = useState(getPlanFromUrl);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    restaurantName: '',
    businessType: 'restaurant',
  });

  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.passwordConfirm) {
      return setError('Las contraseñas no coinciden');
    }
    if (formData.password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres');
    }

    setLoading(true);

    try {
      // 1. Crear usuario en Auth
      const { data: authData, error: authError } = await signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { full_name: formData.restaurantName } }
      });

      if (authError) throw authError;
      const user = authData?.user;
      if (!user) throw new Error('Error al registrar usuario');

      // Resolve plan_id
      const planId = PLAN_IDS[selectedPlan] || PLAN_IDS.emprendedor;

      // 2. Crear Brand
      const brandSlug = formData.restaurantName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

      const { data: brandData, error: brandError } = await supabase
        .from('brands')
        .insert({
          name: formData.restaurantName,
          slug: brandSlug,
          owner_id: user.id,
          is_active: true,
          plan_id: planId,
          business_type: formData.businessType,
        })
        .select()
        .single();

      if (brandError) {
        console.error('Error creando brand:', brandError);
        throw new Error('No se pudo crear el negocio. ' + brandError.message);
      }

      const brandId = brandData.id;

      // 3. Actualizar perfil con brand_id y rol owner
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'owner', brand_id: brandId, full_name: formData.restaurantName })
        .eq('id', user.id);

      if (profileError) console.error('Error actualizando profile:', profileError);

      // 4. Crear restaurant_settings por defecto
      const { error: rsError } = await supabase
        .from('restaurant_settings')
        .insert({ brand_id: brandId, business_name: formData.restaurantName });

      if (rsError) console.error('Error creando restaurant_settings:', rsError);

      // 5. Crear home_settings por defecto
      const { error: hsError } = await supabase
        .from('home_settings')
        .insert({ brand_id: brandId });

      if (hsError) console.error('Error creando home_settings:', hsError);

      // 6. Crear staff "Admin Principal" con PIN 1234
      const { error: staffError } = await supabase
        .from('staff')
        .insert({ name: 'Admin Principal', role: 'admin', pin: '1234', brand_id: brandId });

      if (staffError) console.error('Error creando staff:', staffError);

      setSuccess(true);

    } catch (err) {
      setError(err.message || 'Error al completar el registro.');
    } finally {
      setLoading(false);
    }
  };

  const planLabel = PLAN_LABELS[selectedPlan] || PLAN_LABELS.emprendedor;

  // ── Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col justify-center py-12 px-4">
        <div className="mx-auto w-full max-w-md">
          <div className="bg-[#111] border border-white/10 rounded-3xl py-10 px-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-white mb-3">¡Bienvenido a Aluna!</h2>
            <p className="text-gray-400 mb-2">
              Tu negocio <strong className="text-white">{formData.restaurantName}</strong> fue creado exitosamente.
            </p>
            <p className="text-gray-500 text-sm mb-8">
              Revisa tu correo para verificar tu cuenta, luego podrás acceder a tu panel de administración.
            </p>
            <a
              href="/login"
              className="w-full inline-flex justify-center rounded-full py-3 px-6 bg-white text-[#1A1A1A] text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              Ir a Iniciar Sesión →
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Register form
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col justify-center py-12 px-4">
      <div className="mx-auto w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-3xl text-white tracking-wide" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Aluna
          </span>
          <h2 className="mt-4 text-2xl font-bold text-white">Crea tu cuenta</h2>
          <p className="mt-1 text-sm text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <a href="/login" className="text-[#7db87a] hover:underline">Inicia sesión</a>
          </p>
        </div>

        {/* Plan badge */}
        {selectedPlan && (
          <div className="mb-6 flex justify-center">
            <span
              className="text-xs font-bold px-4 py-1.5 rounded-full border"
              style={{ color: planLabel.color, borderColor: planLabel.color + '40', background: planLabel.bg + '10' }}
            >
              Plan seleccionado: {planLabel.name}
            </span>
          </div>
        )}

        {/* Card */}
        <div className="bg-[#111] border border-white/10 rounded-3xl py-8 px-8 shadow-2xl">
          <form className="space-y-5" onSubmit={handleSubmit}>

            {error && (
              <div className="rounded-xl bg-red-900/20 border border-red-500/20 p-4 flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Nombre del negocio */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Nombre de tu Negocio
              </label>
              <input
                name="restaurantName"
                type="text"
                required
                value={formData.restaurantName}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#7db87a]/50 focus:border-[#7db87a]/50 transition"
                placeholder="Mi Restaurante"
              />
            </div>

            {/* Tipo de negocio */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Tipo de Negocio
              </label>
              <div className="grid grid-cols-3 gap-2">
                {BUSINESS_TYPES.map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData({ ...formData, businessType: value })}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-medium transition-all ${
                      formData.businessType === value
                        ? 'border-[#7db87a] bg-[#7db87a]/10 text-[#7db87a]'
                        : 'border-white/10 text-gray-500 hover:border-white/30 hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Correo Electrónico
              </label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#7db87a]/50 focus:border-[#7db87a]/50 transition"
                placeholder="correo@ejemplo.com"
              />
            </div>

            {/* Contraseña */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Contraseña
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#7db87a]/50 transition"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Confirmar
                </label>
                <input
                  name="passwordConfirm"
                  type="password"
                  required
                  value={formData.passwordConfirm}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#7db87a]/50 transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-full text-sm font-semibold bg-white text-[#1A1A1A] hover:bg-gray-100 disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-800" />
                  Creando tu negocio...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Crear mi negocio
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Al registrarte aceptas nuestros términos de servicio y política de privacidad.
        </p>
      </div>
    </div>
  );
}
