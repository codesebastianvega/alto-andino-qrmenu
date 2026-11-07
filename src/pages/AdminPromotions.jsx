import React from 'react';
import MealPlansAdminSection from '../components/admin/MealPlansAdminSection';
import { useAdminPromotionsData } from '../hooks/promotions/useAdminPromotionsData';
import PromotionsHeader from '../components/admin/promotions/PromotionsHeader';
import PromotionsTemplatesBar from '../components/admin/promotions/PromotionsTemplatesBar';
import PromotionsList from '../components/admin/promotions/PromotionsList';
import PromotionFormModal from '../components/admin/promotions/PromotionFormModal';

export default function AdminPromotions() {
  const p = useAdminPromotionsData();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <PromotionsHeader
        activeCount={p.activeCount}
        promotions={p.promotions}
        onOpenCouponModal={() => {
          p.setEditingPromo(null);
          p.setFormData({
            ...p.initialFormState,
            name: 'Cupón Personalizado',
            type: 'percentage_discount',
            target: 'all',
            value: 10,
            code: 'BOKU10',
            min_order_amount: 20000,
            show_banner: false
          });
          p.setIsModalOpen(true);
        }}
        onOpenNewPromoModal={() => {
          p.setEditingPromo(null);
          p.setFormData(p.initialFormState);
          p.setIsModalOpen(true);
        }}
      />

      {/* Planes & Tiqueteras Digitales BOKU Fit */}
      <MealPlansAdminSection
        brandId={p.activeBrandId}
        brandSlug={p.activeBrand?.slug || p.brandFromContext?.slug || 'boku-bento'}
        allProducts={p.allProducts}
        currentLocation={p.locations?.find(l => l.is_main) || p.locations?.[0] || null}
      />

      {/* 1-Click Launch Templates (Rappi Ads Style) */}
      <PromotionsTemplatesBar onApplyTemplate={p.applyTemplate} />

      {/* Campaigns List */}
      <PromotionsList
        promotions={p.promotions}
        loading={p.loading}
        onRefresh={p.fetchPromotions}
        onToggleActive={p.handleToggleActive}
        onEditPromo={p.handleEditPromo}
        onDeletePromo={p.handleDeletePromo}
        getPromoStatus={p.getPromoStatus}
      />

      {/* Modal Creación / Edición */}
      <PromotionFormModal
        isOpen={p.isModalOpen}
        onClose={() => p.setIsModalOpen(false)}
        editingPromo={p.editingPromo}
        formData={p.formData}
        setFormData={p.setFormData}
        onSubmit={p.handleSavePromo}
        isSaving={p.isSaving}
      />
    </div>
  );
}
