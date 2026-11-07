import { Icon } from '@iconify-icon/react';

export default function DriversHeaderAndKpis({
  loadingOrders,
  onRefreshOrders,
  onOpenCreateModal,
  totalDrivers,
  activeDrivers,
  inRouteOrders,
  deliveredOrders,
  activeDeliveryOrdersCount,
  activeTab,
  setActiveTab
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black tracking-widest uppercase bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
              <Icon icon="solar:scooter-bold-duotone" className="text-sm" />
              Operaciones de Entrega
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Gestión de Domiciliarios
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Administra tus repartidores, envía despachos en 1 clic y monitorea las entregas del día.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefreshOrders}
            className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
            title="Recargar entregas de hoy"
          >
            <Icon icon="solar:refresh-bold" className={`text-base ${loadingOrders ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <Icon icon="solar:user-plus-bold" className="text-base text-emerald-400" />
            <span>+ Registrar Domiciliario</span>
          </button>
        </div>
      </div>

      {/* Barra de KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Flota Total</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-gray-900">{totalDrivers}</span>
            <span className="text-xs text-gray-500 font-bold">repartidores</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-2xs">
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block mb-1">En Turno / Activos</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-700">{activeDrivers}</span>
            <span className="text-xs text-emerald-600 font-bold">disponibles</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-100 bg-purple-50/20 shadow-2xs">
          <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider block mb-1">En Ruta Ahora (Hoy)</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-700">{inRouteOrders}</span>
            <span className="text-xs text-purple-600 font-bold">en camino</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Entregados Hoy</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-gray-900">{deliveredOrders}</span>
            <span className="text-xs text-gray-500 font-bold">finalizados</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('fleet')}
          className={`pb-3 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'fleet'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Icon icon="solar:users-group-two-rounded-bold" className="text-base" />
          <span>Flota de Repartidores ({totalDrivers})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('deliveries')}
          className={`pb-3 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'deliveries'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Icon icon="solar:scooter-bold-duotone" className="text-base" />
          <span>Monitor de Entregas Hoy ({activeDeliveryOrdersCount})</span>
          {inRouteOrders > 0 && (
            <span className="h-2 w-2 rounded-full bg-purple-600 animate-ping"></span>
          )}
        </button>
      </div>
    </div>
  );
}
