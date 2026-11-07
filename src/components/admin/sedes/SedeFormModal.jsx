import React from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { Loader2 } from 'lucide-react';
import { usePaymentMethods } from '../../../hooks/usePaymentMethods';
import { useLocationPayments } from '../../../hooks/useLocationPayments';
import SedeInfoTab from './SedeInfoTab';
import SedeHoursTab from './SedeHoursTab';
import SedeOpsDeliveryTab from './SedeOpsDeliveryTab';
import SedePaymentsTab from './SedePaymentsTab';

const MODAL_TABS = [
  { id: 'info', label: 'Información', icon: 'solar:info-circle-bold' },
  { id: 'hours', label: 'Horarios', icon: 'solar:clock-circle-bold' },
  { id: 'ops', label: 'Operación & Delivery', icon: 'solar:delivery-bold' },
  { id: 'payments', label: 'Pagos', icon: 'solar:card-2-bold' }
];

export default function SedeFormModal({
  isModalOpen,
  setIsModalOpen,
  editingLocation,
  activeTab,
  setActiveTab,
  form,
  setForm,
  hours,
  loadingHours,
  handleUpdateHour,
  handleCaptureSedeGPS,
  handleSubmit,
  isSubmitting
}) {
  const { paymentMethods: brandPaymentMethods } = usePaymentMethods();
  const { 
    locationPayments, 
    togglePaymentMethod 
  } = useLocationPayments(editingLocation?.id);

  if (!isModalOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[9999] animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 sm:px-8 py-4.5 border-b border-gray-100 bg-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2f4131]/10 text-[#2f4131] flex items-center justify-center shrink-0">
              <Icon icon="solar:shop-2-bold" className="text-xl" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                  {editingLocation ? 'Gestionar Sede' : 'Nueva Sede'}
                </h3>
                {editingLocation?.is_main && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-200/60 uppercase tracking-wider">
                    Principal
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Configuración de contacto, horarios y logística de entrega por punto de venta.
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setIsModalOpen(false)} 
            className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center cursor-pointer"
          >
            <Icon icon="solar:close-circle-bold" className="text-xl" />
          </button>
        </div>

        {/* Tabs Navigation (Segmented Control) */}
        <div className="px-6 sm:px-8 py-2.5 border-b border-gray-100 bg-gray-50/70 shrink-0">
          <div className="inline-flex gap-1 p-1 bg-gray-200/60 rounded-xl max-w-full overflow-x-auto custom-scrollbar">
            {MODAL_TABS.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive 
                      ? 'bg-white text-gray-900 shadow-xs' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <Icon icon={tab.icon} className="text-sm" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form noValidate onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar pb-8">
            {activeTab === 'info' && (
              <SedeInfoTab form={form} setForm={setForm} />
            )}

            {activeTab === 'hours' && (
              <SedeHoursTab 
                hours={hours}
                loadingHours={loadingHours}
                handleUpdateHour={handleUpdateHour}
              />
            )}

            {activeTab === 'ops' && (
              <SedeOpsDeliveryTab 
                form={form}
                setForm={setForm}
                handleCaptureSedeGPS={handleCaptureSedeGPS}
              />
            )}

            {activeTab === 'payments' && (
              <SedePaymentsTab 
                form={form}
                setForm={setForm}
                brandPaymentMethods={brandPaymentMethods}
                locationPayments={locationPayments}
                togglePaymentMethod={togglePaymentMethod}
              />
            )}
          </div>

          {/* Footer Sticky */}
          <div className="px-6 sm:px-8 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 shrink-0">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)} 
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#2f4131] hover:bg-[#253527] text-white text-xs font-semibold shadow-md shadow-[#2f4131]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Icon icon="solar:diskette-bold-duotone" className="text-base" />
                  <span>{editingLocation ? 'Guardar Cambios' : 'Crear Sede'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
