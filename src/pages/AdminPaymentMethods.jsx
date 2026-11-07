import React from 'react';
import { Loader2 } from 'lucide-react';
import { Icon } from '@iconify/react';
import { useAdminPaymentMethodsData } from '../hooks/paymentmethods/useAdminPaymentMethodsData';
import PaymentContextSwitcher from '../components/admin/paymentmethods/PaymentContextSwitcher';
import { PaymentMethodCard, EmptyState } from '../components/admin/paymentmethods/PaymentMethodCard';
import LocationPaymentsPanel from '../components/admin/paymentmethods/LocationPaymentsPanel';
import PaymentMethodModal from '../components/admin/paymentmethods/PaymentMethodModal';

export default function AdminPaymentMethods() {
  const p = useAdminPaymentMethodsData();

  if (p.isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando medios de pago...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Context Switcher (Segmented Control) */}
      <PaymentContextSwitcher
        activeContext={p.activeContext}
        setActiveContext={p.setActiveContext}
        locations={p.locations}
      />

      {/* Content Area */}
      <div>
        {/* Brand Context */}
        {p.activeContext === 'brand' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900 tracking-tight">Catálogo Global de Pagos</h3>
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                    {p.brandMethods.length} {p.brandMethods.length === 1 ? 'método' : 'métodos'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Configura los medios de pago disponibles para toda la marca.</p>
              </div>
              <button
                type="button"
                onClick={() => p.openModal()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
              >
                <Icon icon="solar:add-circle-bold" className="text-base" />
                <span>Añadir Medio</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {p.brandMethods.map((method) => (
                <PaymentMethodCard 
                  key={method.id}
                  method={method}
                  onEdit={() => p.openModal(method)}
                  onDelete={() => p.handleDelete(method.id, method.name)}
                  onToggle={() => p.toggleBrandStatus(method)}
                />
              ))}
              
              {p.brandMethods.length === 0 && <EmptyState onAdd={() => p.openModal()} />}
            </div>
          </div>
        )}

        {/* Location Context */}
        {p.activeContext !== 'brand' && p.selectedLocation && (
          <LocationPaymentsPanel
            selectedLocation={p.selectedLocation}
            isChangingIsolation={p.isChangingIsolation}
            onToggleIsolation={p.handleToggleIsolation}
            brandMethods={p.brandMethods}
            locationPayments={p.locationPayments}
            loadingLocPayments={p.loadingLocPayments}
            onToggleLocStatus={p.handleToggleLocStatus}
          />
        )}
      </div>

      {/* Modal: Añadir / Editar Medio */}
      <PaymentMethodModal
        isOpen={p.isModalOpen}
        onClose={() => p.setIsModalOpen(false)}
        editingMethod={p.editingMethod}
        formData={p.formData}
        setFormData={p.setFormData}
        onTypeChange={p.handleTypeChange}
        onSubmit={p.handleSubmit}
        isSaving={p.isSaving}
      />
    </div>
  );
}
