import { useAdminInsumosData } from '../../../hooks/inventory/useAdminInsumosData';
import { InsumosKpis } from './InsumosKpis';
import { InsumosToolbar } from './InsumosToolbar';
import { InsumosTable } from './InsumosTable';
import { InsumosCards } from './InsumosCards';
import { InsumoFormModal } from './InsumoFormModal';
import { LinkCatalogModal } from '../LinkCatalogModal';
import { BatchProductionModal } from '../BatchProductionModal';

export function InsumosTab({ activeLocationId }) {
  const {
    ingredients,
    loading,
    categories,
    providers,
    locations,
    activeLocation,
    isAllLocations,
    isOpen,
    setIsOpen,
    editing,
    search,
    setSearch,
    catFilter,
    setCatFilter,
    providerFilter,
    setProviderFilter,
    showZeroOnly,
    setShowZeroOnly,
    showZeroWasteOnly,
    setShowZeroWasteOnly,
    typeFilter,
    setTypeFilter,
    sortBy,
    setSortBy,
    batchModalItem,
    setBatchModalItem,
    inlineEdit,
    setInlineEdit,
    confirmDelete,
    setConfirmDelete,
    isLinkModalOpen,
    setIsLinkModalOpen,
    showInvTip,
    dismissInvTip,
    locationInventory,
    setLocationInventory,
    form,
    unitCost,
    inlineUnitCost,
    zeroCostCount,
    totalInventoryValue,
    outOfStockCount,
    lowStockCount,
    zeroWasteCount,
    rawCount,
    subrecipeCount,
    expiringSoonCount,
    filtered,
    openCreate,
    openEdit,
    openInlineEdit,
    saveInlineCost,
    handleSave,
    handleUnlinkIngredient,
    deleteIngredient,
    toggleIngredientStatus,
    fetchIngredients,
    f,
    fi,
    handlePurchaseUnitChange
  } = useAdminInsumosData(activeLocationId);

  if (loading && !ingredients.length) {
    return <div className="py-16 text-center text-sm text-gray-400 font-medium">Cargando…</div>;
  }

  return (
    <>
      <InsumosKpis
        ingredientsCount={ingredients.length}
        outOfStockCount={outOfStockCount}
        lowStockCount={lowStockCount}
        totalInventoryValue={totalInventoryValue}
        zeroCostCount={zeroCostCount}
        zeroWasteCount={zeroWasteCount}
        showZeroOnly={showZeroOnly}
        showZeroWasteOnly={showZeroWasteOnly}
        onSelectTotal={() => {
          setSearch('');
          setCatFilter('all');
          setShowZeroOnly(false);
          setShowZeroWasteOnly(false);
        }}
        onSelectStockAlerts={() => {
          if (outOfStockCount > 0 || lowStockCount > 0) {
            setSearch('stock_bajo');
            setShowZeroOnly(false);
            setShowZeroWasteOnly(false);
          }
        }}
        onSelectHighValue={() => {
          setSearch('high_value');
          setShowZeroOnly(false);
          setShowZeroWasteOnly(false);
        }}
        onToggleZeroCost={() => {
          if (zeroCostCount > 0) {
            setShowZeroOnly(!showZeroOnly);
            setShowZeroWasteOnly(false);
            setSearch('');
          }
        }}
        onToggleZeroWaste={() => {
          setShowZeroWasteOnly(!showZeroWasteOnly);
          setShowZeroOnly(false);
          setSearch('');
        }}
      />

      <InsumosToolbar
        showInvTip={showInvTip}
        dismissInvTip={dismissInvTip}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        ingredientsCount={ingredients.length}
        rawCount={rawCount}
        subrecipeCount={subrecipeCount}
        expiringSoonCount={expiringSoonCount}
        search={search}
        setSearch={setSearch}
        catFilter={catFilter}
        setCatFilter={setCatFilter}
        categories={categories}
        providerFilter={providerFilter}
        setProviderFilter={setProviderFilter}
        providers={providers}
        sortBy={sortBy}
        setSortBy={setSortBy}
        isAllLocations={isAllLocations}
        onOpenLinkModal={() => setIsLinkModalOpen(true)}
        onOpenBatchModal={() => setBatchModalItem({ is_subrecipe: true })}
        onOpenCreate={openCreate}
      />

      <InsumosTable
        filtered={filtered}
        categories={categories}
        providers={providers}
        inlineEdit={inlineEdit}
        setInlineEdit={setInlineEdit}
        fi={fi}
        saveInlineCost={saveInlineCost}
        inlineUnitCost={inlineUnitCost}
        confirmDelete={confirmDelete}
        setConfirmDelete={setConfirmDelete}
        isAllLocations={isAllLocations}
        deleteIngredient={deleteIngredient}
        toggleIngredientStatus={toggleIngredientStatus}
        openEdit={openEdit}
        openInlineEdit={openInlineEdit}
        handleUnlinkIngredient={handleUnlinkIngredient}
        setBatchModalItem={setBatchModalItem}
        showZeroOnly={showZeroOnly}
        search={search}
      />

      <InsumosCards
        filtered={filtered}
        categories={categories}
        providers={providers}
        inlineEdit={inlineEdit}
        setInlineEdit={setInlineEdit}
        fi={fi}
        saveInlineCost={saveInlineCost}
        inlineUnitCost={inlineUnitCost}
        confirmDelete={confirmDelete}
        setConfirmDelete={setConfirmDelete}
        isAllLocations={isAllLocations}
        deleteIngredient={deleteIngredient}
        toggleIngredientStatus={toggleIngredientStatus}
        openEdit={openEdit}
        openInlineEdit={openInlineEdit}
        handleUnlinkIngredient={handleUnlinkIngredient}
        setBatchModalItem={setBatchModalItem}
      />

      <InsumoFormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        editing={editing}
        form={form}
        f={f}
        handlePurchaseUnitChange={handlePurchaseUnitChange}
        handleSave={handleSave}
        unitCost={unitCost}
        categories={categories}
        providers={providers}
        locations={locations}
        locationInventory={locationInventory}
        setLocationInventory={setLocationInventory}
      />

      {/* Catalog Link Modal */}
      <LinkCatalogModal
        isOpen={isLinkModalOpen}
        onClose={() => {
          setIsLinkModalOpen(false);
          fetchIngredients(activeLocationId);
        }}
        type="inventory"
        locationId={activeLocationId}
        locationName={activeLocation?.name || 'Sede'}
      />

      {/* Batch Production Modal for Subrecipes */}
      <BatchProductionModal
        isOpen={Boolean(batchModalItem)}
        onClose={() => setBatchModalItem(null)}
        targetItem={batchModalItem}
        activeLocationId={activeLocationId}
        onProduced={() => fetchIngredients(activeLocationId)}
      />
    </>
  );
}
