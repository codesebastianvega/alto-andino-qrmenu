import { useState, useEffect, useRef } from 'react';
import { useStaff } from '../../hooks/useStaff';
import { useLocations } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import { safeSessionStorage as sessionStorage, safeStorage as localStorage } from '../../utils/safeStorage';
import { Eye, EyeOff, Lock, ShieldAlert, ArrowLeft, Delete } from 'lucide-react';

const RoleColors = {
  admin: 'bg-[#4a6741] text-white',
  waiter: 'bg-blue-600 text-white',
  kitchen: 'bg-orange-600 text-white',
  bar: 'bg-cyan-600 text-white',
  cashier: 'bg-purple-600 text-white',
  promoter: 'bg-rose-500 text-white',
};

const RoleNames = {
  admin: 'Admin',
  waiter: 'Mesero',
  kitchen: 'Cocina',
  bar: 'Barra',
  cashier: 'Caja',
  promoter: 'Impulsador',
};

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

export default function AdminPinLogin({ onLogin }) {
  const { staffList, loading, error, clockIn } = useStaff();
  const { activeLocationId, isAllLocations } = useLocations();
  const { fetchBrandById } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  const inputRef = useRef(null);

  // Auto-login con sessionStorage si existe
  useEffect(() => {
    const savedSession = sessionStorage.getItem('aa_admin_session');
    if (savedSession) {
      try {
        const user = JSON.parse(savedSession);
        if (user?.brand_id) {
          localStorage.setItem('aa_active_brand_id', user.brand_id);
          if (typeof fetchBrandById === 'function') fetchBrandById(user.brand_id);
        }
        onLogin(user);
      } catch (e) {
        sessionStorage.removeItem('aa_admin_session');
      }
    }
  }, [onLogin, fetchBrandById]);

  // Manejo de cuenta regresiva de bloqueo por intentos fallidos
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimer((prev) => {
        if (prev <= 1) {
          setErrorMsg('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  // Auto-focus en el input de clave cuando se selecciona un colaborador
  useEffect(() => {
    if (selectedUser && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F4F2]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2f4131]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F4F2]">
        <div className="text-red-500 text-center">
          <p>Error cargando perfiles.</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const handlePinSubmit = (e) => {
    if (e) e.preventDefault();
    if (!selectedUser || lockoutTimer > 0) return;

    const entered = pin.trim().toUpperCase();
    const expected = (selectedUser.pin || '').trim().toUpperCase();

    if (entered && entered === expected) {
      // Éxito: registrar inicio de turno y resetear intentos
      setFailedAttempts(0);
      setErrorMsg('');

      const targetLocationId = (!isAllLocations && activeLocationId) 
        ? activeLocationId 
        : (selectedUser.location_ids?.[0] || null);

      clockIn(selectedUser.id, targetLocationId);
      sessionStorage.setItem('aa_admin_session', JSON.stringify(selectedUser));
      if (selectedUser.brand_id) {
        localStorage.setItem('aa_active_brand_id', selectedUser.brand_id);
        if (typeof fetchBrandById === 'function') fetchBrandById(selectedUser.brand_id);
      }
      onLogin(selectedUser);
    } else {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);

      if (nextAttempts >= MAX_ATTEMPTS) {
        setLockoutTimer(LOCKOUT_SECONDS);
        setErrorMsg(`Bloqueado por seguridad: ${LOCKOUT_SECONDS}s`);
      } else {
        const remaining = MAX_ATTEMPTS - nextAttempts;
        setErrorMsg(`Clave incorrecta (${remaining} ${remaining === 1 ? 'intento restante' : 'intentos restantes'})`);
      }
      setPin('');
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleKeypadClick = (char) => {
    if (lockoutTimer > 0) return;
    if (pin.length < 12) {
      setPin((prev) => (prev + char).toUpperCase());
      setErrorMsg('');
    }
  };

  const handleDelete = () => {
    if (lockoutTimer > 0) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  if (!selectedUser) {
    return (
      <div className="min-h-screen bg-[#F4F4F2] flex flex-col items-center justify-center p-6">
        <h1 className="text-2xl font-bold text-[#1C2B1E] mb-2 text-center">¿Quién eres?</h1>
        <p className="text-xs text-gray-500 font-medium mb-8 text-center max-w-sm">
          Selecciona tu perfil e ingresa tu clave de seguridad para acceder a tu área de trabajo.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 max-w-4xl w-full">
          {staffList.map((user) => (
            <button
              key={user.id}
              onClick={() => {
                setSelectedUser(user);
                setPin('');
                setErrorMsg('');
              }}
              className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-white/60 transition-colors focus:outline-none focus:ring-4 focus:ring-[#7db87a]/30 cursor-pointer"
            >
              <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-md ${RoleColors[user.role] || 'bg-gray-500 text-white'}`}>
                <span className="text-2xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-center">
                <p className="font-semibold text-[#1C2B1E]">{user.name}</p>
                <p className="text-xs text-gray-500 font-medium">{RoleNames[user.role] || user.role}</p>
              </div>
            </button>
          ))}
        </div>

        {staffList.length === 0 ? (
          <div className="text-center text-gray-500 bg-white p-8 rounded-2xl shadow-sm border border-orange-100 max-w-sm">
            <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <p className="font-semibold text-gray-900 mb-1">No hay personal configurado</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              El administrador principal debe configurar el personal desde el panel de control.
            </p>
          </div>
        ) : null}

        {/* Link to Aluna Owner Login */}
        <div className="mt-12 pt-8 border-t border-gray-200 w-full max-w-sm text-center">
          <p className="text-sm text-gray-500 mb-4">¿Eres el dueño del negocio?</p>
          <button 
            onClick={() => window.location.hash = '#login'}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all shadow-sm cursor-pointer"
          >
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Ingresar con Correo / Google</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F2] flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-[#1C2B1E] p-6 text-center relative">
          <button 
            type="button"
            onClick={() => { setSelectedUser(null); setPin(''); setErrorMsg(''); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-lg mb-2 ${RoleColors[selectedUser.role] || 'bg-gray-500 text-white'}`}>
            <span className="text-xl font-bold">
              {selectedUser.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <h2 className="text-white text-lg font-bold">Hola, {selectedUser.name}</h2>
          <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">{RoleNames[selectedUser.role] || selectedUser.role}</p>
        </div>
        
        <div className="p-6 sm:p-8">
          <form onSubmit={handlePinSubmit} className="flex flex-col items-center">
            {/* Input alfanumérico interactivo (teclado táctil de tablet/móvil o físico) */}
            <div className="w-full relative mb-5">
              <input 
                ref={inputRef}
                type={showPin ? "text" : "password"}
                value={pin}
                disabled={lockoutTimer > 0}
                onChange={(e) => {
                  setPin(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase());
                  setErrorMsg('');
                }}
                placeholder="Ingresa clave o PIN"
                maxLength={12}
                className="w-full text-center text-xl font-mono tracking-[0.3em] font-bold py-3.5 px-12 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#2f4131] outline-none transition-all uppercase placeholder:text-gray-300 placeholder:text-sm placeholder:tracking-normal placeholder:font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                aria-label={showPin ? "Ocultar clave" : "Mostrar clave"}
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Teclado numérico táctil para ingresar dígitos rápidamente en pantalla */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  type="button"
                  key={num}
                  disabled={lockoutTimer > 0}
                  onClick={() => handleKeypadClick(num.toString())}
                  className="h-14 rounded-2xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-700 active:bg-gray-200 transition-all active:scale-95 border border-gray-100 shadow-2xs cursor-pointer disabled:opacity-40"
                >
                  {num}
                </button>
              ))}
              <div />
              <button
                type="button"
                disabled={lockoutTimer > 0}
                onClick={() => handleKeypadClick('0')}
                className="h-14 rounded-2xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-700 active:bg-gray-200 transition-all active:scale-95 border border-gray-100 shadow-2xs cursor-pointer disabled:opacity-40"
              >
                0
              </button>
              <button
                type="button"
                disabled={lockoutTimer > 0}
                onClick={handleDelete}
                className="h-14 rounded-2xl bg-rose-50/60 hover:bg-rose-100/70 text-rose-700 flex items-center justify-center transition-all active:scale-95 border border-rose-100 cursor-pointer disabled:opacity-40"
                aria-label="Borrar"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Mensajes de error o bloqueo */}
            {lockoutTimer > 0 ? (
              <div className="w-full p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center mb-4 flex items-center justify-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Bloqueo temporal contra intentos repetidos: <strong>{lockoutTimer}s</strong></span>
              </div>
            ) : errorMsg ? (
              <p className="text-rose-600 font-bold text-xs mb-3 text-center">{errorMsg}</p>
            ) : (
              <p className="text-[11px] text-gray-400 font-medium mb-3 text-center">
                Puedes teclear letras y números desde la pantalla o el teclado de tu tablet.
              </p>
            )}

            <button 
              type="submit" 
              disabled={pin.length < 4 || lockoutTimer > 0}
              className="w-full py-3.5 bg-[#2f4131] hover:bg-[#233124] disabled:opacity-30 disabled:pointer-events-none text-white font-bold rounded-2xl transition-all shadow-md text-sm uppercase tracking-wider cursor-pointer"
            >
              Ingresar al Turno
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
