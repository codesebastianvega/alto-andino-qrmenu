import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function EmergencyPauseModal({
  showEmergencyModal,
  setShowEmergencyModal,
  emergencyAction,
  handleEmergencyMenuToggle
}) {
  if (!showEmergencyModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-gray-100 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className={`w-11 h-11 rounded-2xl mx-auto flex items-center justify-center ${
          emergencyAction === 'pause' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
        }`}>
          <ShieldAlert className="w-5 h-5" />
        </div>
        
        <h3 className="text-sm font-black text-gray-900 mt-3">
          {emergencyAction === 'pause' ? '¿Pausar toda la carta?' : '¿Reactivar toda la carta?'}
        </h3>
        
        <p className="text-xs text-gray-500 font-semibold mt-1">
          {emergencyAction === 'pause' 
            ? 'Todos los platos quedarán marcados como "Agotados por hoy" temporalmente.'
            : 'Todos los platos activos volverán a estar disponibles inmediatamente.'
          }
        </p>

        <div className="mt-4 space-y-2">
          <button
            onClick={handleEmergencyMenuToggle}
            className={`w-full py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider text-white shadow-md transition-transform active:scale-98 cursor-pointer ${
              emergencyAction === 'pause' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {emergencyAction === 'pause' ? 'Confirmar Pausa Total' : 'Confirmar Reactivación Total'}
          </button>

          <button
            onClick={() => setShowEmergencyModal(false)}
            className="w-full py-2 rounded-2xl text-xs font-black uppercase tracking-wider bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
