import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useOperations } from '../hooks/useOperations';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { supabase } from '../config/supabase';
import { toast } from '../components/Toast';
import { printThermalShiftReport } from '../utils/thermalPrint';

import ShiftCashSummary from '../components/admin/ShiftCashSummary';
import TableMap from '../components/admin/TableMap';
import KitchenStats from '../components/admin/KitchenStats';
import ActiveStaff from '../components/admin/ActiveStaff';
import OpenShiftModal from '../components/admin/OpenShiftModal';
import CloseShiftModal from '../components/admin/CloseShiftModal';

export default function AdminOperations() {
  const { activeBrand } = useAuth();
  const { activeLocationId, isAllLocations, activeLocation } = useLocation();

  const {
    orders,
    metrics,
    tablesWithStatus,
    areas,
    liveEvents,
    loading,
    refresh,
    updateTablePhysicalStatus,
    activeShift,
    openCashShift,
    closeCashShift,
    settings
  } = useOperations();

  const [staffList, setStaffList] = useState([]);
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);

  // Cargar lista de staff activo para asignar cajeros/responsables
  useEffect(() => {
    async function loadStaff() {
      if (!activeBrand?.id) return;
      try {
        let query = supabase
          .from('staff')
          .select('id, name, role, location_id')
          .eq('brand_id', activeBrand.id)
          .eq('is_active', true);

        if (!isAllLocations && activeLocationId) {
          query = query.eq('location_id', activeLocationId);
        }

        const { data, error } = await query;
        if (error) throw error;
        setStaffList(data || []);
      } catch (err) {
        console.error('Error cargando staff:', err);
      }
    }
    loadStaff();
  }, [activeBrand?.id, activeLocationId, isAllLocations]);

  // Pop-up automático de preconfiguración diaria si la sede no tiene turno abierto
  useEffect(() => {
    if (loading) return;
    const skipKey = `skip_open_shift_${activeBrand?.id}_${activeLocationId || 'all'}`;
    const wasDismissed = sessionStorage.getItem(skipKey);

    if (!activeShift && !wasDismissed) {
      setIsOpenShiftModalOpen(true);
    }
  }, [loading, activeShift, activeBrand?.id, activeLocationId]);

  const handleDismissOpenShift = () => {
    const skipKey = `skip_open_shift_${activeBrand?.id}_${activeLocationId || 'all'}`;
    sessionStorage.setItem(skipKey, 'true');
    setIsOpenShiftModalOpen(false);
  };

  const handlePrintReportX = () => {
    if (!activeShift) return;
    try {
      printThermalShiftReport({
        shift: activeShift,
        metrics,
        type: 'X',
        width: settings?.thermal_paper_width || '80',
        businessName: activeBrand?.name || 'Aluna',
        business: activeBrand
      });
      toast.success('Reporte X enviado a impresión térmica');
    } catch (err) {
      console.error(err);
      toast.error('Error al generar Reporte X');
    }
  };

  const currentLocationName = activeLocation?.name || (isAllLocations ? 'Todas las Sedes' : 'Sede Principal');

  return (
    <div className="p-4 md:p-8 pb-28 max-w-[1700px] mx-auto min-h-screen">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-8 bg-[#2f4131] rounded-full" />
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight">
              Centro de Operaciones
            </h1>
          </div>
          <p className="text-gray-400 text-xs md:text-sm font-medium mt-1 pl-4 flex items-center gap-2">
            <span>Visión en vivo del turno activo</span>
            <span>•</span>
            <span className="text-emerald-700 font-bold">{currentLocationName}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            disabled={loading}
            className="p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 text-gray-700 transition-colors shadow-2xs flex items-center gap-2 font-bold text-xs md:text-sm disabled:opacity-50"
          >
            <Icon icon="solar:restart-bold" className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2f4131]" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* ── 3.2 Caja del Turno ──────────────────────────────────────── */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <ShiftCashSummary
              metrics={metrics}
              orders={orders}
              activeShift={activeShift}
              onOpenShift={() => setIsOpenShiftModalOpen(true)}
              onCloseShift={() => setIsCloseShiftModalOpen(true)}
              onPrintReportX={handlePrintReportX}
            />
          </div>

          {/* ── 3.3 Mapa de Mesas ────────────────────────────────────────── */}
          <div className="bg-[#0F170F] rounded-3xl border border-white/5 shadow-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/50">
                <Icon icon="solar:chair-2-bold" width="18" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Mapa de Mesas</h2>
                <p className="text-[10px] text-white/30 font-medium">Estado en tiempo real</p>
              </div>
              {/* Pulso live */}
              <div className="ml-auto flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Live</span>
              </div>
            </div>
            <TableMap 
              tablesWithStatus={tablesWithStatus} 
              areas={areas} 
              loading={loading} 
              onUpdateTableStatus={updateTablePhysicalStatus}
            />
          </div>

          {/* ── 3.4 Inteligencia de Cocina + Feed ────────────────────────── */}
          <KitchenStats orders={orders} liveEvents={liveEvents} loading={loading} />

          {/* 3.5 Active Staff */}
          <div className="h-full">
            <ActiveStaff orders={orders} />
          </div>
        </div>
      )}

      {/* ── Modales de Turno ──────────────────────────────────────────────── */}
      <OpenShiftModal
        isOpen={isOpenShiftModalOpen}
        onClose={handleDismissOpenShift}
        onOpenShift={openCashShift}
        staffList={staffList}
        currentLocationName={currentLocationName}
      />

      <CloseShiftModal
        isOpen={isCloseShiftModalOpen}
        onClose={() => setIsCloseShiftModalOpen(false)}
        shift={activeShift}
        metrics={metrics}
        onConfirmClose={closeCashShift}
        business={activeBrand}
        restaurantSettings={settings}
      />
    </div>
  );
}
