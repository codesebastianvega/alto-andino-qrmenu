import AdminStaff from '../../../pages/AdminStaff';
import { Icon } from '@iconify/react';

export function StaffSettingsTab({ isFeatureLocked }) {
  const isLocked = isFeatureLocked('staff');

  return (
    <div className="relative animate-fadeUp" style={{ animationDelay: '200ms' }}>
      <div className={`bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-xs ${isLocked ? 'blur-sm pointer-events-none grayscale-[0.5] opacity-40' : ''}`}>
        <AdminStaff isEmbedded={true} />
      </div>

      {isLocked && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white/95 backdrop-blur-xl p-8 sm:p-10 rounded-2xl border border-gray-200 shadow-xl flex flex-col items-center max-w-md ring-1 ring-black/[0.04]">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mb-6 border border-amber-200/60 shadow-sm relative">
              <Icon icon="solar:lock-bold-duotone" className="text-3xl" />
              <div className="absolute -top-2.5 -right-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md uppercase tracking-wider">
                Plan Esencial
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">
              Módulo Bloqueado
            </h3>
            <p className="text-xs text-gray-500 mb-6 font-medium leading-relaxed">
              Añade meseros y personal de cocina con accesos controlados para mayor seguridad.
            </p>
            <button
              onClick={() => window.open('https://wa.me/573214815152?text=Hola!%20Deseo%20mejorar%20mi%20plan%20en%20Aluna', '_blank')}
              className="bg-gray-900 text-white font-semibold py-3 px-8 rounded-xl shadow-md hover:bg-gray-800 transition-all text-xs flex items-center gap-2 cursor-pointer"
            >
              <Icon icon="solar:stars-line-duotone" className="text-base" />
              Desbloquear Función
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
