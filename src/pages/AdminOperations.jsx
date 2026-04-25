import React from 'react';
import { Icon } from '@iconify-icon/react';
import { useOperations } from '../hooks/useOperations';
import ShiftCashSummary from '../components/admin/ShiftCashSummary';
import TableMap from '../components/admin/TableMap';
import KitchenStats from '../components/admin/KitchenStats';
import ActiveStaff from '../components/admin/ActiveStaff';

/**
 * AdminOperations — Centro de Operaciones
 * Bloque 3: Vista unificada del turno en tiempo real.
 * 3.1 useOperations hook ✅
 * 3.2 ShiftCashSummary ✅
 * 3.3 TableMap ✅
 * 3.4 KitchenStats + LiveEventFeed ✅
 * 3.5 ActiveStaff ✅
 * 3.6 Roles en sidebar (próximo)
 */
export default function AdminOperations() {
  const { orders, metrics, tablesWithStatus, areas, liveEvents, loading, refresh, updateTablePhysicalStatus } = useOperations();

  return (
    <div className="p-4 md:p-8 max-w-[1700px] mx-auto min-h-screen">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
            <span className="inline-block w-1.5 h-8 bg-[#2f4131] rounded-full" />
            Centro de Operaciones
          </h1>
          <p className="text-gray-400 text-sm font-medium mt-1 pl-5">
            Visión en tiempo real del turno activo
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 text-gray-600 transition-colors shadow-sm flex items-center gap-2 font-bold text-sm disabled:opacity-50"
        >
          <Icon icon="heroicons:arrow-path" className={`text-xl ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
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
              onCloseShift={() => {/* futuro: registrar cierre de turno */}}
            />
          </div>

          {/* ── 3.3 Mapa de Mesas ────────────────────────────────────────── */}
          <div className="bg-[#0F170F] rounded-3xl border border-white/5 shadow-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-white/50">
                  <rect x="4" y="3" width="16" height="4" rx="1"/><path d="M6 7v14M18 7v14M12 7v14M4 14h16"/>
                </svg>
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
    </div>
  );
}
