import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Camera, 
  Save, 
  Lock, 
  ShieldCheck, 
  Loader2,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Chrome
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import { toast } from '../components/Toast';

export default function AdminProfile() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Google connection
  const isGoogleConnected = user?.identities?.some(i => i.provider === 'google') ?? false;
  const isPasswordProvider = user?.identities?.some(i => i.provider === 'email') ?? false;

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    avatar_url: ''
  });

  // Password change state
  const [passForm, setPassForm] = useState({ current: '', newPass: '', confirm: '' });
  const [showPass, setShowPass] = useState({ current: false, newPass: false, confirm: false });

  // Email change state
  const [emailForm, setEmailForm] = useState({ newEmail: '', confirmPass: '' });
  const [showEmailPass, setShowEmailPass] = useState(false);

  // Split full_name for UI
  const [nameParts, setNameParts] = useState({ first: '', last: '' });

  useEffect(() => {
    if (profile) {
      const name = profile.full_name || '';
      const parts = name.split(' ');
      const first = parts[0] || '';
      const last = parts.slice(1).join(' ') || '';
      
      setNameParts({ first, last });
      setFormData({
        full_name: name,
        phone: profile.phone || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

  const hasChanges = profile ? (
    nameParts.first !== (profile.full_name?.split(' ')[0] || '') ||
    nameParts.last !== (profile.full_name?.split(' ').slice(1).join(' ') || '') ||
    formData.phone !== (profile.phone || '')
  ) : false;

  const handleUpdateProfile = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    // Reconstruct full_name
    const full_name = `${nameParts.first} ${nameParts.last}`.trim();
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name,
          phone: formData.phone
        })
        .eq('id', user.id)
        .select();

      if (error) throw error;
      
      console.log('AdminProfile: Perfil actualizado correctamente', data);
      
      // Sincronizar el estado global
      if (user?.id) await refreshProfile(user.id);
      
      toast.success('Perfil actualizado con éxito');
    } catch (error) {
      console.error('AdminProfile: Error en actualización', error);
      toast.error('Error al actualizar perfil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Debes seleccionar una imagen para cargar.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Sincronizar el estado global
      if (user?.id) await refreshProfile(user.id);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success('Foto de perfil actualizada');
    } catch (error) {
      toast.error('Error al cargar imagen: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-full p-4 lg:p-8 flex justify-center bg-[#fdfdfd]">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
          .profile-container { font-family: 'Outfit', sans-serif; }
          .glass-panel {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05);
          }
          .input-focus:focus {
            ring: 2px solid #1A2421;
            border-color: #1A2421;
          }
        `}
      </style>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-7xl space-y-8 profile-container"
      >
        {/* HEADER & AVATAR SECTION */}
        <section className="flex flex-col md:flex-row items-center gap-8 bg-white/50 p-8 rounded-[2.5rem] glass-panel transition-all hover:shadow-xl">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#1A2421] to-[#2c3d38] p-1 shadow-2xl relative overflow-hidden">
              {formData.avatar_url ? (
                <img 
                  src={formData.avatar_url} 
                  alt="Avatar" 
                  className="w-full h-full rounded-full object-cover border-4 border-white"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-[#1A2421] flex items-center justify-center text-white text-4xl font-bold border-4 border-white">
                  {nameParts.first?.[0] || 'A'}
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-10 h-10 bg-[#1A2421] text-white rounded-full flex items-center justify-center cursor-pointer border-4 border-[#fdfdfd] hover:scale-110 transition-transform shadow-lg group-hover:bg-[#E6B05C]">
              <Camera size={18} />
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
            </label>
          </div>

          <div className="flex-1 text-center md:text-left space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#1A2421]">Mi Perfil</h1>
            <p className="text-gray-500 font-medium">Gestiona tu identidad y seguridad en la plataforma Aluna.</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
              <span className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-xs font-bold border border-green-100 shadow-sm">
                <ShieldCheck size={14} /> Dueño / Administrador
              </span>
              <span className="flex items-center gap-2 bg-gray-50 text-gray-600 px-4 py-1.5 rounded-full text-xs font-bold border border-gray-100">
                <Mail size={14} /> {user?.email}
              </span>
              {isGoogleConnected ? (
                <span className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-bold border border-blue-100">
                  <Chrome size={14} /> Conectado con Google
                </span>
              ) : (
                <span className="flex items-center gap-2 bg-gray-50 text-gray-400 px-4 py-1.5 rounded-full text-xs font-bold border border-gray-100">
                  <Chrome size={14} /> Sin Google vinculado
                </span>
              )}
            </div>
          </div>
        </section>

        <div className="space-y-8">
          {/* FORMULARIO DE DATOS */}
          <section className="space-y-6">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-black/5 space-y-8">
              <div className="flex items-center gap-3 border-b border-black/5 pb-4">
                <div className="w-10 h-10 rounded-xl bg-[#1A2421]/5 flex items-center justify-center text-[#1A2421]">
                  <User size={20} />
                </div>
                <h2 className="text-xl font-bold text-[#1A2421]">Datos Personales</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    Nombre
                    {!nameParts.first && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>}
                  </label>
                  <input 
                    type="text" 
                    value={nameParts.first}
                    onChange={(e) => setNameParts(prev => ({ ...prev, first: e.target.value }))}
                    className={`w-full bg-[#f9f9f9] border ${!nameParts.first ? 'border-red-500 ring-1 ring-red-500' : 'border-black/5'} rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-[#1A2421] focus:border-[#1A2421] transition-all outline-none`}
                    placeholder="Ej. Roberto"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    Apellidos
                    {!nameParts.last && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>}
                  </label>
                  <input 
                    type="text" 
                    value={nameParts.last}
                    onChange={(e) => setNameParts(prev => ({ ...prev, last: e.target.value }))}
                    className={`w-full bg-[#f9f9f9] border ${!nameParts.last ? 'border-red-500 ring-1 ring-red-500' : 'border-black/5'} rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-[#1A2421] focus:border-[#1A2421] transition-all outline-none`}
                    placeholder="Ej. García"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    Teléfono Móvil
                    {!formData.phone && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>}
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Phone size={16} /></div>
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className={`w-full bg-[#f9f9f9] border ${!formData.phone ? 'border-red-500 ring-1 ring-red-500' : 'border-black/5'} rounded-2xl p-4 pl-12 text-sm font-medium focus:ring-2 focus:ring-[#1A2421] focus:border-[#1A2421] transition-all outline-none`}
                      placeholder="+57 300 000 0000"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleUpdateProfile}
                disabled={loading}
                className="w-full bg-[#1A2421] text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-bold hover:bg-[#2c3d38] transition-all hover:shadow-lg disabled:opacity-50"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                Guardar Cambios
              </button>
            </div>
          </section>

          {/* SECCIÓN DE SEGURIDAD */}
          <section className="space-y-6">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-black/5 space-y-8">
              <div className="flex items-center gap-3 border-b border-black/5 pb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                  <Lock size={20} />
                </div>
                <h2 className="text-xl font-bold text-[#1A2421]">Seguridad y Acceso</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Cambio de Contraseña — flujo seguro */}
                <div className="p-6 bg-gray-50 rounded-[2rem] space-y-4 border border-black/5">
                  <div className="flex items-center gap-3 border-b border-black/5 pb-2">
                    <ShieldCheck size={18} className="text-gray-400" />
                    <span className="text-sm font-bold text-[#1A2421]">Cambiar Contraseña</span>
                  </div>

                  {!isPasswordProvider ? (
                    <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
                      <Chrome size={16} className="text-blue-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-blue-600 font-medium leading-relaxed">
                        Tu cuenta usa Google como método de acceso. No tienes una contraseña local asignada.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[{ key: 'current', label: 'Contraseña actual', placeholder: '••••••••' },
                        { key: 'newPass', label: 'Nueva contraseña', placeholder: 'Mínimo 8 caracteres' },
                        { key: 'confirm', label: 'Confirmar nueva contraseña', placeholder: '••••••••' }
                      ].map(({ key, label, placeholder }) => (
                        <div key={key} className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</label>
                          <div className="relative">
                            <input
                              type={showPass[key] ? 'text' : 'password'}
                              placeholder={placeholder}
                              value={passForm[key]}
                              onChange={e => setPassForm(prev => ({ ...prev, [key]: e.target.value }))}
                              className="w-full bg-white border border-black/5 rounded-xl p-3 pr-10 text-sm focus:ring-2 focus:ring-[#1A2421] outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPass(prev => ({ ...prev, [key]: !prev[key] }))}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPass[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={async () => {
                          if (!passForm.current) { toast.error('Ingresa tu contraseña actual'); return; }
                          if (passForm.newPass.length < 8) { toast.error('La nueva contraseña debe tener al menos 8 caracteres'); return; }
                          if (passForm.newPass !== passForm.confirm) { toast.error('Las contraseñas no coinciden'); return; }
                          setLoading(true);
                          // Verificar contraseña actual
                          const { error: signInError } = await supabase.auth.signInWithPassword({
                            email: user.email,
                            password: passForm.current
                          });
                          if (signInError) {
                            toast.error('La contraseña actual es incorrecta');
                            setLoading(false);
                            return;
                          }
                          const { error } = await supabase.auth.updateUser({ password: passForm.newPass });
                          setLoading(false);
                          if (error) {
                            toast.error(error.message);
                          } else {
                            toast.success('Contraseña actualizada correctamente');
                            setPassForm({ current: '', newPass: '', confirm: '' });
                          }
                        }}
                        disabled={loading}
                        className="w-full py-2.5 bg-[#1A2421] text-white rounded-xl text-xs font-bold hover:bg-[#2c3d38] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                        Actualizar Contraseña
                      </button>
                    </div>
                  )}
                </div>

                {/* Cambio de Email — con re-autenticación */}
                <div className="p-6 bg-gray-50 rounded-[2rem] space-y-4 border border-black/5">
                  <div className="flex items-center gap-3 border-b border-black/5 pb-2">
                    <Mail size={18} className="text-gray-400" />
                    <span className="text-sm font-bold text-[#1A2421]">Cambiar Correo</span>
                  </div>

                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                      Se enviará un enlace de confirmación al <strong>nuevo correo</strong>. El cambio solo aplica después de que hagas clic en ese enlace.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Nuevo correo electrónico</label>
                      <input
                        type="email"
                        placeholder="nuevo@correo.com"
                        value={emailForm.newEmail}
                        onChange={e => setEmailForm(prev => ({ ...prev, newEmail: e.target.value }))}
                        className="w-full bg-white border border-black/5 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#1A2421] outline-none"
                      />
                    </div>
                    {isPasswordProvider && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Confirmar con tu contraseña</label>
                        <div className="relative">
                          <input
                            type={showEmailPass ? 'text' : 'password'}
                            placeholder="Tu contraseña actual"
                            value={emailForm.confirmPass}
                            onChange={e => setEmailForm(prev => ({ ...prev, confirmPass: e.target.value }))}
                            className="w-full bg-white border border-black/5 rounded-xl p-3 pr-10 text-sm focus:ring-2 focus:ring-[#1A2421] outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowEmailPass(p => !p)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showEmailPass ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={async () => {
                        if (!emailForm.newEmail || !emailForm.newEmail.includes('@')) {
                          toast.error('Ingresa un email válido');
                          return;
                        }
                        setLoading(true);
                        // Re-auth si tiene contraseña local
                        if (isPasswordProvider) {
                          if (!emailForm.confirmPass) { toast.error('Ingresa tu contraseña actual para confirmar'); setLoading(false); return; }
                          const { error: signInError } = await supabase.auth.signInWithPassword({
                            email: user.email,
                            password: emailForm.confirmPass
                          });
                          if (signInError) { toast.error('Contraseña incorrecta'); setLoading(false); return; }
                        }
                        const { error } = await supabase.auth.updateUser({ email: emailForm.newEmail });
                        setLoading(false);
                        if (error) {
                          toast.error(error.message);
                        } else {
                          toast.success('¡Revisa ' + emailForm.newEmail + ' y confirma el enlace para completar el cambio!');
                          setEmailForm({ newEmail: '', confirmPass: '' });
                        }
                      }}
                      disabled={loading}
                      className="w-full py-2.5 bg-[#1A2421] text-white rounded-xl text-xs font-bold hover:bg-[#2c3d38] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                      Enviar Confirmación
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 text-gray-400">
                <ShieldCheck size={14} />
                <p className="text-[10px] font-medium leading-relaxed">
                  Tus datos están protegidos bajo protocolos de encriptación de grado bancario por Supabase Auth.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={() => signOut()}
                className="flex items-center gap-2 px-8 py-4 text-red-500 font-bold bg-red-50 rounded-2xl hover:bg-red-100 transition-all border border-red-100"
              >
                <LogOut size={18} />
                Cerrar Sesión Propietario
              </button>
            </div>
          </section>
        </div>

        {/* BARRA FLOTANTE DE CAMBIOS SIN GUARDAR */}
        <AnimatePresence>
          {hasChanges && !loading && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-2xl"
            >
              <div className="bg-[#1A2421] text-white p-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 flex items-center justify-between gap-4 backdrop-blur-xl">
                <div className="flex items-center gap-3 pl-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-sm font-bold tracking-tight">Tienes cambios sin guardar</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      // Reset to profile data
                      if (profile) {
                         const name = profile.full_name || '';
                         const parts = name.split(' ');
                         setNameParts({ first: parts[0] || '', last: parts.slice(1).join(' ') || '' });
                         setFormData(prev => ({ ...prev, phone: profile.phone || '' }));
                      }
                    }}
                    className="px-4 py-2 text-xs font-bold text-white/50 hover:text-white transition-colors"
                  >
                    Descartar
                  </button>
                  <button 
                    onClick={handleUpdateProfile}
                    className="bg-[#E6B05C] text-[#1A2421] px-6 py-2 rounded-xl text-sm font-black shadow-lg hover:scale-105 active:scale-95 transition-all"
                  >
                    Guardar Ahora
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
