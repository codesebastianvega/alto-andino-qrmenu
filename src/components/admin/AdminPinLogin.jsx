import { useState, useEffect } from 'react';
import { useStaff } from '../../hooks/useStaff';

const RoleColors = {
  admin: 'bg-[#4a6741] text-white',
  waiter: 'bg-blue-600 text-white',
  kitchen: 'bg-orange-600 text-white',
  cashier: 'bg-purple-600 text-white',
};

const RoleNames = {
  admin: 'Admin',
  waiter: 'Mesero',
  kitchen: 'Cocina',
  cashier: 'Caja',
};

export default function AdminPinLogin({ onLogin }) {
  const { staffList, loading, error } = useStaff();
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-login con sessionStorage si existe
  useEffect(() => {
    const savedSession = sessionStorage.getItem('aa_admin_session');
    if (savedSession) {
      try {
        const user = JSON.parse(savedSession);
        onLogin(user);
      } catch (e) {
        sessionStorage.removeItem('aa_admin_session');
      }
    }
  }, [onLogin]);

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
    e.preventDefault();
    if (!selectedUser) return;

    if (pin === selectedUser.pin) {
      sessionStorage.setItem('aa_admin_session', JSON.stringify(selectedUser));
      onLogin(selectedUser);
    } else {
      setErrorMsg('PIN incorrecto');
      setPin('');
    }
  };

  const handleKeypadClick = (num) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setErrorMsg('');
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  if (!selectedUser) {
    return (
      <div className="min-h-screen bg-[#F4F4F2] flex flex-col items-center justify-center p-6">
        <h1 className="text-2xl font-bold text-[#1C2B1E] mb-8 text-center">¿Quién eres?</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 max-w-4xl w-full">
          {staffList.map((user) => (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-white/60 transition-colors focus:outline-none focus:ring-4 focus:ring-[#7db87a]/30"
            >
              <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-md ${RoleColors[user.role] || 'bg-gray-500 text-white'}`}>
                <span className="text-2xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-center">
                <p className="font-semibold text-[#1C2B1E]">{user.name}</p>
                <p className="text-xs text-gray-500 font-medium">{RoleNames[user.role]}</p>
              </div>
            </button>
          ))}
        </div>
        {staffList.length === 0 && (
          <div className="text-center text-gray-500 bg-white p-6 rounded-lg shadow-sm border border-orange-200">
            <p className="font-medium text-orange-600">No hay personal configurado.</p>
            <p className="text-sm">Por favor ejecuta la migración SQL `v2_phase5_analytics_schema.sql` en Supabase.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F2] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-[#1C2B1E] p-6 text-center relative">
          <button 
            onClick={() => { setSelectedUser(null); setPin(''); setErrorMsg(''); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-lg mb-3 ${RoleColors[selectedUser.role] || 'bg-gray-500 text-white'}`}>
            <span className="text-xl font-bold">
              {selectedUser.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <h2 className="text-white text-lg font-medium">Hola, {selectedUser.name}</h2>
          <p className="text-white/50 text-sm">Ingresa tu PIN para acceder</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handlePinSubmit} className="flex flex-col items-center">
            {/* PIN Dots */}
            <div className="flex gap-4 mb-8">
              {[0, 1, 2, 3].map(index => (
                <div 
                  key={index} 
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    pin.length > index ? 'bg-[#2f4131] scale-100' : 'bg-gray-200 scale-90'
                  }`}
                />
              ))}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-x-8 gap-y-4 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  type="button"
                  key={num}
                  onClick={() => handleKeypadClick(num.toString())}
                  className="w-16 h-16 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-xl font-medium text-gray-700 active:bg-gray-200 transition-colors"
                >
                  {num}
                </button>
              ))}
              <div /> {/* Espacio vacío */}
              <button
                type="button"
                onClick={() => handleKeypadClick('0')}
                className="w-16 h-16 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-xl font-medium text-gray-700 active:bg-gray-200 transition-colors"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="w-16 h-16 rounded-full text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors active:scale-95"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
                  <line x1="18" y1="9" x2="12" y2="15"/>
                  <line x1="12" y1="9" x2="18" y2="15"/>
                </svg>
              </button>
            </div>

            {errorMsg && (
              <p className="text-red-500 font-medium text-sm animate-pulse">{errorMsg}</p>
            )}

            {pin.length === 4 && (
              <button type="submit" className="mt-4 w-full py-3 bg-[#4a6741] hover:bg-[#3d5536] text-white font-medium rounded-xl transition-colors shadow-md">
                Ingresar
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
