import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { 
  LogIn, AlertCircle, ArrowLeft, Mail, Lock, 
  Eye, EyeOff, Zap, Coffee 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn, MagneticButton, SpotlightCard } from '../../components/aluna/animations';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await signIn({ email, password });
      
      if (signInError) throw signInError;
      
      if (data?.user) {
        // Redirigir según el rol y la marca asociada
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role, brand:brands(slug)')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileData?.role === 'superadmin') {
          window.location.href = '/superadmin';
        } else {
          window.location.href = '/';
        }
      }
      
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Premium Background with Image */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img 
          src="/assets/images/auth-bg.png" 
          alt="Atmosphere" 
          className="w-full h-full object-cover scale-110 blur-sm"
        />
        {/* Overlay más oscuro para dar contraste al contenido exterior */}
        <div className="absolute inset-0 bg-stone-900/50"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/30 via-transparent to-stone-900/40"></div>
      </div>

      <FadeIn direction="up" className="w-full max-w-md relative z-10">
        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8 text-sm group font-medium">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver a inicio
        </Link>

        {/* Branding */}
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block"
          >
            <span className="text-5xl text-white tracking-[0.2em] font-light mb-3 block drop-shadow-md" style={{ fontFamily: "'DM Serif Display', serif" }}>
              ALUNA
            </span>
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-[#D4A853] to-transparent mx-auto"></div>
          </motion.div>
          <h2 className="mt-6 text-2xl font-semibold text-white drop-shadow-sm">
            Bienvenido de nuevo
          </h2>
          <p className="mt-2 text-white/70 text-sm">
            Ingresa a tu cuenta para gestionar tu negocio.
          </p>
        </div>

        <motion.div
          animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <SpotlightCard className="bg-white/95 backdrop-blur-xl border border-stone-200/80 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden group/card" spotlightColor="rgba(212,168,83,0.08)">

            <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-2xl bg-red-50 border border-red-100 p-4 mb-4"
                  >
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-stone-600 uppercase tracking-widest mb-2 ml-1">
                  Correo electrónico
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400 group-focus-within:text-[#D4A853] transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D4A853]/30 focus:border-[#D4A853] transition-all text-sm"
                    placeholder="ejemplo@aluna.test"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2 ml-1">
                  <label htmlFor="password" className="block text-xs font-bold text-stone-600 uppercase tracking-widest">
                    Contraseña
                  </label>
                  <a href="#" className="text-xs font-semibold text-[#D4A853] hover:text-stone-900 transition-colors">
                    ¿Olvidaste la clave?
                  </a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400 group-focus-within:text-[#D4A853] transition-colors">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-12 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D4A853]/30 focus:border-[#D4A853] transition-all text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-stone-400 hover:text-stone-800 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-stone-300 text-[#D4A853] focus:ring-[#D4A853]"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-stone-600 font-medium">
                  Recordarme
                </label>
              </div>
            </div>

            <div className="pt-2">
              <MagneticButton className="w-full">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative group h-12 rounded-2xl bg-slate-900 text-white font-bold text-sm overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-slate-200"
                >
                  <div className="absolute inset-0 bg-[#D4A853] translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <div className="relative z-10 flex items-center justify-center gap-2 transition-colors duration-300">
                    {loading ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
                        Accediendo...
                      </>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4" /> Entrar a mi cuenta
                      </>
                    )}
                  </div>
                </button>
              </MagneticButton>
            </div>

            {/* Social Logins */}
            <div className="pt-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-stone-200"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 shrink-0">O continúa con</span>
                <div className="flex-1 border-t border-stone-200"></div>
              </div>

              <MagneticButton className="w-full">
                  <button
                    type="button"
                    onClick={async () => {
                      await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: { redirectTo: window.location.origin + '/' },
                      });
                    }}
                    className="w-full flex items-center justify-center gap-3 py-3 bg-stone-50 border border-stone-200 rounded-2xl hover:bg-white hover:border-[#D4A853]/50 hover:shadow-sm transition-all group"
                  >
                    {/* Google G icon */}
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-xs font-bold text-stone-600 group-hover:text-stone-900">Continuar con Google</span>
                  </button>
                </MagneticButton>
            </div>
          </form>
        </SpotlightCard>
      </motion.div>

        <p className="mt-8 text-center text-sm text-white/80">
          ¿No tienes una cuenta activa?{' '}
          <Link to="/registro" className="font-bold text-[#D4A853] hover:text-white transition-colors">
            Registra tu negocio gratis
          </Link>
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-6 text-[10px] uppercase tracking-widest font-bold text-white/50">
          <span className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-[#D4A853]" /> Setup instantáneo</span>
          <span className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-[#D4A853]" /> Seguridad bancaria</span>
          <span className="flex items-center gap-1.5"><Coffee className="w-3 h-3 text-[#D4A853]" /> Soporte 24/7</span>
        </div>
      </FadeIn>
    </div>
  );
}
