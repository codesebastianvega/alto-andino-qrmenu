import React from 'react';
import { useAdminDeliveryDriversData } from '../hooks/delivery/useAdminDeliveryDriversData';
import DriversHeaderAndKpis from '../components/admin/delivery/DriversHeaderAndKpis';
import DriversFleetTab from '../components/admin/delivery/DriversFleetTab';
import DeliveriesMonitorTab from '../components/admin/delivery/DeliveriesMonitorTab';
import DriverFormModal from '../components/admin/delivery/DriverFormModal';

export default function AdminDeliveryDrivers() {
  const d = useAdminDeliveryDriversData();

  return (
    <div className="p-4 sm:p-8 max-w-[1500px] mx-auto space-y-6 animate-fadeUp">
      <DriversHeaderAndKpis
        loadingOrders={d.loadingOrders}
        onRefreshOrders={d.loadTodayDeliveryOrders}
        onOpenCreateModal={d.handleOpenCreateModal}
        totalDrivers={d.totalDrivers}
        activeDrivers={d.activeDrivers}
        inRouteOrders={d.inRouteOrders}
        deliveredOrders={d.deliveredOrders}
        activeDeliveryOrdersCount={d.activeDeliveryOrders.length}
        activeTab={d.activeTab}
        setActiveTab={d.setActiveTab}
      />

      {/* TAB 1: FLOTA DE REPARTIDORES */}
      {d.activeTab === 'fleet' && (
        <DriversFleetTab
          loading={d.loading}
          drivers={d.drivers}
          onOpenCreateModal={d.handleOpenCreateModal}
          onOpenEditModal={d.handleOpenEditModal}
          onDeleteDriver={d.handleDeleteDriver}
          onToggleActive={d.handleToggleActive}
        />
      )}

      {/* TAB 2: MONITOR DE ENTREGAS HOY */}
      {d.activeTab === 'deliveries' && (
        <DeliveriesMonitorTab
          loadingOrders={d.loadingOrders}
          deliveryOrders={d.deliveryOrders}
          activeDeliveryOrders={d.activeDeliveryOrders}
          cancelledDeliveryOrders={d.cancelledDeliveryOrders}
          showCancelledDeliveries={d.showCancelledDeliveries}
          setShowCancelledDeliveries={d.setShowCancelledDeliveries}
          drivers={d.drivers}
          selectedDriverForDispatch={d.selectedDriverForDispatch}
          setSelectedDriverForDispatch={d.setSelectedDriverForDispatch}
          onDispatchOrder={d.handleDispatchOrder}
          onMarkOrderDelivered={d.handleMarkOrderDelivered}
          onCancelDeliveryOrder={d.handleCancelDeliveryOrder}
          onSendCustomerApologyWhatsApp={d.handleSendCustomerApologyWhatsApp}
        />
      )}

      {/* MODAL CREAR / EDITAR DOMICILIARIO */}
      <DriverFormModal
        isOpen={d.isModalOpen}
        onClose={() => d.setIsModalOpen(false)}
        editingDriver={d.editingDriver}
        formData={d.formData}
        setFormData={d.setFormData}
        onSubmit={d.handleSaveDriver}
        saving={d.saving}
      />
    </div>
  );
}
