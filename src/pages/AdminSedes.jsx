import React from 'react';
import { Loader2 } from 'lucide-react';
import { Icon } from '@iconify/react';
import { useAdminSedesData } from '../hooks/sedes/useAdminSedesData';
import SedesListGrid from '../components/admin/sedes/SedesListGrid';
import SedeFormModal from '../components/admin/sedes/SedeFormModal';
import SedeLocationQrModal from '../components/admin/sedes/SedeLocationQrModal';

export default function AdminSedes({ isEmbedded = false }) {
  const {
    locations,
    loading,
    isModalOpen,
    setIsModalOpen,
    isSubmitting,
    editingLocation,
    qrLocation,
    setQrLocation,
    activeTab,
    setActiveTab,
    hours,
    loadingHours,
    form,
    setForm,
    canAddMore,
    handleOpenModal,
    handleCaptureSedeGPS,
    handleUpdateHour,
    handleSubmit,
    handleDelete,
    getLocationUrl,
    handleCopyLocationUrl,
    handleDownloadLocationQr,
    handleAddSedeClick
  } = useAdminSedesData();

  if (loading && locations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando sedes...
      </div>
    );
  }

  return (
    <div className={isEmbedded ? "animate-fadeUp space-y-6" : "p-4 sm:p-10 max-w-[1600px] mx-auto space-y-8"}>
      {/* ── Header Independiente ── */}
      {!isEmbedded && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100 animate-fadeUp">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                Infraestructura
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Sedes y Locales</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Gestiona las ubicaciones físicas de tu marca y centraliza tu operación.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={handleAddSedeClick} 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Icon icon={canAddMore ? "solar:shop-2-bold" : "solar:lock-bold"} className="text-base" />
              <span>Nueva Sede</span>
              {!canAddMore && <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Pro</span>}
            </button>
          </div>
        </div>
      )}

      {/* ── Header Embebido (Settings) ── */}
      {isEmbedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">Puntos de Venta y Sedes</h3>
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                {locations.length} {locations.length === 1 ? 'sede' : 'sedes'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Controla la información de contacto, cobertura de domicilios y horarios de cada sede.</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button 
              type="button"
              onClick={handleAddSedeClick} 
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Icon icon={canAddMore ? "solar:add-circle-bold" : "solar:lock-bold"} className="text-base" />
              <span>Añadir Sede</span>
              {!canAddMore && <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Pro</span>}
            </button>
          </div>
        </div>
      )}

      {/* ── Grid de Sedes ── */}
      <SedesListGrid
        locations={locations}
        handleOpenModal={handleOpenModal}
        setQrLocation={setQrLocation}
        handleDelete={handleDelete}
      />

      {/* ── Modal de Creación / Edición de Sede ── */}
      <SedeFormModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        editingLocation={editingLocation}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        form={form}
        setForm={setForm}
        hours={hours}
        loadingHours={loadingHours}
        handleUpdateHour={handleUpdateHour}
        handleCaptureSedeGPS={handleCaptureSedeGPS}
        handleSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      {/* ── Modal de QR Individual de la Sede ── */}
      <SedeLocationQrModal
        qrLocation={qrLocation}
        setQrLocation={setQrLocation}
        getLocationUrl={getLocationUrl}
        handleDownloadLocationQr={handleDownloadLocationQr}
        handleCopyLocationUrl={handleCopyLocationUrl}
      />
    </div>
  );
}
