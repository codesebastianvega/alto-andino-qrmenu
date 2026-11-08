import React from 'react';
import { useKitchenStationLayout } from './kitchen-stations/hooks/useKitchenStationLayout';
import KitchenStationBanner from './kitchen-stations/subcomponents/KitchenStationBanner';
import KitchenBestPractices from './kitchen-stations/subcomponents/KitchenBestPractices';
import KitchenStationCard from './kitchen-stations/subcomponents/KitchenStationCard';
import KitchenZoneModal from './kitchen-stations/subcomponents/KitchenZoneModal';
import KitchenItemModal from './kitchen-stations/subcomponents/KitchenItemModal';

export function KitchenStationLayout({ onSelectIngredient = null }) {
  const {
    activeBrand,
    zones,
    activeZone,
    setActiveZone,
    loading,
    isSaving,
    hasChanges,
    filteredZones,

    // Zone Modal
    isZoneModalOpen,
    setIsZoneModalOpen,
    editingZoneIndex,
    zoneFormData,
    setZoneFormData,
    openNewZoneModal,
    openEditZoneModal,
    handleSaveZone,
    handleDeleteZone,
    handleMoveZone,

    // Item Modal
    isItemModalOpen,
    setIsItemModalOpen,
    editingItemIndex,
    itemFormData,
    setItemFormData,
    openNewItemModal,
    openEditItemModal,
    handleSaveItem,
    handleDeleteItem,

    // Global actions
    handleSaveToDatabase,
    handleResetToTemplate
  } = useKitchenStationLayout();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 text-sm font-medium">
        Cargando estaciones de cocina...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Banner Informativo Operativo & Acciones de Edición */}
      <KitchenStationBanner
        activeBrand={activeBrand}
        zones={zones}
        activeZone={activeZone}
        setActiveZone={setActiveZone}
        hasChanges={hasChanges}
        isSaving={isSaving}
        openNewZoneModal={openNewZoneModal}
        handleSaveToDatabase={handleSaveToDatabase}
        handleResetToTemplate={handleResetToTemplate}
      />

      {/* ── Regla de Oro / Buenas Prácticas */}
      <KitchenBestPractices />

      {/* ── Zonas Mapeadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredZones.map((zone) => {
          const originalIndex = zones.findIndex((z) => z.id === zone.id);
          return (
            <KitchenStationCard
              key={zone.id}
              zone={zone}
              originalIndex={originalIndex}
              totalZones={zones.length}
              onMoveZone={handleMoveZone}
              onEditZone={openEditZoneModal}
              onDeleteZone={handleDeleteZone}
              onNewItem={openNewItemModal}
              onEditItem={openEditItemModal}
              onDeleteItem={handleDeleteItem}
            />
          );
        })}
      </div>

      {/* ── MODAL: Crear / Editar Estación ── */}
      <KitchenZoneModal
        open={isZoneModalOpen}
        onClose={() => setIsZoneModalOpen(false)}
        editingZoneIndex={editingZoneIndex}
        zoneFormData={zoneFormData}
        setZoneFormData={setZoneFormData}
        onSaveZone={handleSaveZone}
      />

      {/* ── MODAL: Crear / Editar Item de Estación ── */}
      <KitchenItemModal
        open={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        editingItemIndex={editingItemIndex}
        itemFormData={itemFormData}
        setItemFormData={setItemFormData}
        onSaveItem={handleSaveItem}
      />
    </div>
  );
}

export default KitchenStationLayout;
