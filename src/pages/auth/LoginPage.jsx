import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { LogIn, AlertCircle, ArrowLeft, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { FadeIn, MagneticButton, SpotlightCard } from '../../components/aluna/animations';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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
          // Redirigir a la raíz para que el Global Portal gestione la selección
          window.location.href = '/';
        }
      }
      
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] relative flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=1920&auto=format&fit=crop"
          alt="Abstract Background"
          className="w-full h-full object-cover opacity-20 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/90 to-[#2D6A4F]/20"></div>
        {/* Animated Glow */}
        <div className="absolute top-1/4 -right-20 w-[400px] h-[400px] bg-[#D4A853]/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/4 -left-20 w-[400px] h-[400px] bg-[#2D6A4F]/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <FadeIn direction="up" className="w-full max-w-md relative z-10">
        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8 text-sm group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver a inicio
        </Link>

        {/* Branding */}
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block"
          >
            <span className="text-4xl text-white tracking-widest font-light mb-2 block" style={{ fontFamily: "'DM Serif Display', serif" }}>
              ALUNA
            </span>
            <div className="h-px w-12 bg-[#D4A853] mx-auto opacity-60"></div>
          </motion.div>
          <h2 className="mt-6 text-2xl font-medium text-white/90">
            Bienvenido de nuevo
          </h2>
          <p className="mt-2 text-white/40 text-sm">
            Ingresa a tu cuenta para gestionar tu negocio.
          </p>
        </div>

        <SpotlightCard className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-3xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4"
              >
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              </motion.div>
            )}

            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2 ml-1">
                  Correo electrónico
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#D4A853] transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#D4A853]/30 focus:border-[#D4A853]/50 transition-all text-sm"
                    placeholder="ejemplo@aluna.test"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2 ml-1">
                  <label htmlFor="password" className="block text-xs font-medium text-white/50 uppercase tracking-widest">
                    Contraseña
                  </label>
                  <a href="#" className="text-xs text-[#D4A853] hover:text-white transition-colors">
                    ¿Olvidaste la clave?
                  </a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#D4A853] transition-colors">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#D4A853]/30 focus:border-[#D4A853]/50 transition-all text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 bg-white/5 border-white/10 rounded text-[#D4A853] focus:ring-[#D4A853] focus:ring-offset-black"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-white/40">
                  Recordarme
                </label>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full relative group h-12 rounded-2xl bg-white text-[#0A0A0A] font-bold text-sm overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-[#D4A853] translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <div className="relative z-10 flex items-center justify-center gap-2 group-hover:text-black transition-colors duration-300">
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
            </div>
          </form>
        </SpotlightCard>

        <p className="mt-8 text-center text-sm text-white/30">
          ¿No tienes una cuenta activa?{' '}
          <Link to="/registro" className="font-bold text-[#D4A853] hover:text-white transition-colors">
            Registra tu negocio gratis
          </Link>
        </p>
      </FadeIn>
    </div>
  );
  );
}
