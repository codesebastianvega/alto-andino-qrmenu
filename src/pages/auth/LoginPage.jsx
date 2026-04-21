import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { LogIn, AlertCircle, ArrowLeft, Mail, Lock, Eye, EyeOff, Github, Chrome } from 'lucide-react';
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
    <div className="min-h-screen bg-[#060606] relative flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Premium Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1A3A2C,transparent_70%)] opacity-20"></div>
        <div className="absolute inset-0" style={{ 
          backgroundImage: `linear-gradient(#ffffff03 1px, transparent 1px), linear-gradient(90deg, #ffffff03 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>
        
        {/* Dynamic Glow Orbs */}
        <motion.div 
          animate={{ 
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#2D6A4F]/20 blur-[120px] rounded-full"
        />
        <motion.div 
          animate={{ 
            x: [0, -80, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 2 }}
          className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#D4A853]/10 blur-[150px] rounded-full"
        />
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
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block"
          >
            <span className="text-5xl text-white tracking-[0.2em] font-light mb-3 block" style={{ fontFamily: "'DM Serif Display', serif" }}>
              ALUNA
            </span>
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-[#D4A853] to-transparent mx-auto opacity-60"></div>
          </motion.div>
          <h2 className="mt-6 text-2xl font-medium text-white/90">
            Bienvenido de nuevo
          </h2>
          <p className="mt-2 text-white/40 text-sm">
            Ingresa a tu cuenta para gestionar tu negocio.
          </p>
        </div>

        <motion.div
          animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <SpotlightCard className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden group/card">
            {/* Card Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none"></div>

            <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 mb-4"
                  >
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                      <p className="text-sm text-red-200">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-12 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#D4A853]/30 focus:border-[#D4A853]/50 transition-all text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/30 hover:text-white transition-colors"
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
                  className="h-4 w-4 bg-white/5 border-white/10 rounded text-[#D4A853] focus:ring-[#D4A853] focus:ring-offset-black"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-white/40">
                  Recordarme
                </label>
              </div>
            </div>

            <div className="pt-2">
              <MagneticButton className="w-full">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative group h-12 rounded-2xl bg-white text-[#0A0A0A] font-bold text-sm overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-[#D4A853] translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <div className="relative z-10 flex items-center justify-center gap-2 group-hover:text-white transition-colors duration-300">
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
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#121212] px-2 text-white/30 tracking-widest">O continúa con</span>
                </div>
              </div>

               <div className="grid grid-cols-2 gap-4">
                <MagneticButton className="w-full">
                  <button type="button" className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors group">
                    <Chrome className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                    <span className="text-xs font-medium text-white/60 group-hover:text-white">Google</span>
                  </button>
                </MagneticButton>
                <MagneticButton className="w-full">
                  <button type="button" className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors group">
                    <Github className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                    <span className="text-xs font-medium text-white/60 group-hover:text-white">GitHub</span>
                  </button>
                </MagneticButton>
              </div>
            </div>
          </form>
        </SpotlightCard>
      </motion.div>

        <p className="mt-8 text-center text-sm text-white/30">
          ¿No tienes una cuenta activa?{' '}
          <Link to="/registro" className="font-bold text-[#D4A853] hover:text-white transition-colors">
            Registra tu negocio gratis
          </Link>
        </p>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap justify-center gap-6 text-[10px] uppercase tracking-widest font-bold text-white/20">
          <span className="flex items-center gap-2"><Zap className="w-3 h-3" /> Setup instantáneo</span>
          <span className="flex items-center gap-2"><Lock className="w-3 h-3" /> Seguridad bancaria</span>
          <span className="flex items-center gap-2"><Coffee className="w-3 h-3" /> Soporte 24/7</span>
        </div>
      </FadeIn>
    </div>
  );
}
