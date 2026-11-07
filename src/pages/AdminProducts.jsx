import { useAdminProductsPageData } from '../hooks/products/useAdminProductsPageData';
import ProductsHeader from '../components/admin/products/ProductsHeader';
import ProductsFilterToolbar from '../components/admin/products/ProductsFilterToolbar';
import ProductsTable from '../components/admin/products/ProductsTable';
import ProductsMobileCards from '../components/admin/products/ProductsMobileCards';
import ProductsReorderView from '../components/admin/products/ProductsReorderView';
import ProductForm from '../components/admin/ProductForm';
import BulkCostEditor from '../components/admin/BulkCostEditor';
import { LinkCatalogModal } from '../components/admin/LinkCatalogModal';
import DailySpecialModal from '../components/admin/DailySpecialModal';

export default function AdminProducts() {
  const p = useAdminProductsPageData();

  if (p.isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">
        Cargando productos…
      </div>
    );
  }

  /* ─── Reorder mode UI ─── */
  if (p.reorderMode) {
    return (
      <ProductsReorderView
        categories={p.categories}
        catFilter={p.catFilter}
        orderedList={p.orderedList}
        dragIdx={p.dragIdx}
        overIdx={p.overIdx}
        handleDragStart={p.handleDragStart}
        handleDragEnter={p.handleDragEnter}
        handleDragEnd={p.handleDragEnd}
        exitReorderMode={p.exitReorderMode}
        saveOrder={p.saveOrder}
      />
    );
  }

  /* ─── Normal mode UI ─── */
  return (
    <div className="p-4 sm:p-8 max-w-[1700px] mx-auto space-y-6">
      <ProductsHeader
        productsCount={p.products.length}
        maxProducts={p.maxProducts}
        isAtLimit={p.isAtLimit}
        isTrialActive={p.isTrialActive}
        isWithinProductLimit={!p.isAtLimit}
        planName={p.planName}
        onOpenDailySpecial={() => p.setIsDailySpecialOpen(true)}
        onCreateProduct={p.handleCreate}
      />

      <ProductsFilterToolbar
        search={p.search}
        setSearch={p.setSearch}
        isFiltersOpen={p.isFiltersOpen}
        setIsFiltersOpen={p.setIsFiltersOpen}
        hasActiveFilters={p.hasActiveFilters}
        catFilter={p.catFilter}
        setCatFilter={p.setCatFilter}
        categories={p.categories}
        brandConceptOptions={p.brandConceptOptions}
        brandFilter={p.brandFilter}
        setBrandFilter={p.setBrandFilter}
        locationFilter={p.locationFilter}
        setLocationFilter={p.setLocationFilter}
        locations={p.locations}
        setShowUnassigned={p.setShowUnassigned}
        attrFilter={p.attrFilter}
        setAttrFilter={p.setAttrFilter}
        marginFilter={p.marginFilter}
        setMarginFilter={p.setMarginFilter}
        onEnterReorderMode={p.enterReorderMode}
        onOpenBulkEditor={() => p.setIsBulkEditorOpen(true)}
        onOpenLinkModal={() => p.setIsLinkModalOpen(true)}
      />

      <ProductsTable
        filtered={p.filtered}
        recipes={p.recipes}
        locationFilter={p.locationFilter}
        confirmDelete={p.confirmDelete}
        setConfirmDelete={p.setConfirmDelete}
        handleDelete={p.handleDelete}
        handleEdit={p.handleEdit}
        toggleStock={p.toggleStock}
        toggleActive={p.toggleActive}
        getVisibilityStatus={p.getVisibilityStatus}
        search={p.search}
        catFilter={p.catFilter}
        attrFilter={p.attrFilter}
        marginFilter={p.marginFilter}
      />

      <ProductsMobileCards
        filtered={p.filtered}
        confirmDelete={p.confirmDelete}
        setConfirmDelete={p.setConfirmDelete}
        handleDelete={p.handleDelete}
        handleEdit={p.handleEdit}
        toggleStock={p.toggleStock}
        toggleActive={p.toggleActive}
      />

      {p.isFormOpen && (
        <ProductForm
          product={p.editingProduct}
          categories={p.categories}
          recipes={p.recipes}
          ingredients={p.ingredients}
          modifierGroups={p.modifierGroups}
          allergens={p.allergens}
          onSave={p.handleSave}
          onCancel={() => { p.setIsFormOpen(false); p.setEditingProduct(null); }}
        />
      )}

      {p.isBulkEditorOpen && (
        <BulkCostEditor 
          products={p.products.filter(item => !item.is_addon)}
          onSave={async (updates) => {
            const ok = await p.bulkUpdateCosts(updates);
            if (ok) p.setIsBulkEditorOpen(false);
          }}
          onCancel={() => p.setIsBulkEditorOpen(false)}
        />
      )}

      <LinkCatalogModal 
        isOpen={p.isLinkModalOpen}
        onClose={() => {
          p.setIsLinkModalOpen(false);
          p.fetchProducts(p.activeLocationId);
          if (p.refetchMenuData) p.refetchMenuData();
        }}
        type="product"
        locationId={p.activeLocationId}
        locationName={p.activeLocation?.name || 'Sede'}
      />

      <DailySpecialModal
        isOpen={p.isDailySpecialOpen}
        onClose={() => p.setIsDailySpecialOpen(false)}
        onSaved={p.refetchMenuData}
      />
    </div>
  );
}
