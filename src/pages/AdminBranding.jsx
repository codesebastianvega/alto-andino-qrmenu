import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useAdminBrandingData } from '../hooks/branding/useAdminBrandingData';
import BrandingHeader from '../components/admin/branding/BrandingHeader';
import BrandingIdentitySection from '../components/admin/branding/BrandingIdentitySection';
import BrandingColorsSection from '../components/admin/branding/BrandingColorsSection';
import BrandingConceptsSection from '../components/admin/branding/BrandingConceptsSection';
import BrandingLiveMobilePreview from '../components/admin/branding/BrandingLiveMobilePreview';

const AdminBranding = forwardRef(function AdminBranding({ isEmbedded = false }, ref) {
  const {
    activeBrand,
    loadingSettings,
    settingsForm,
    setSettingsForm,
    isSubmittingSettings,
    uploadingLogo,
    uploadingFavicon,
    isAdvancedLocked,
    addConcept,
    removeConcept,
    updateConcept,
    handleSaveSettings,
    handleFileUpload,
  } = useAdminBrandingData(ref);

  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Cargando configuración...
      </div>
    );
  }

  return (
    <div
      className={
        isEmbedded
          ? ''
          : 'min-h-screen bg-[#FDFDFB] text-gray-900 selection:bg-indigo-100 italic-none p-4 sm:p-10 max-w-[1600px] mx-auto space-y-10 animate-fadeUp'
      }
    >
      {!isEmbedded && (
        <BrandingHeader
          activeBrand={activeBrand}
          onSave={handleSaveSettings}
          isSubmitting={isSubmittingSettings}
        />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Column: Forms */}
        <div className="xl:col-span-8 space-y-6">
          <BrandingIdentitySection
            settingsForm={settingsForm}
            setSettingsForm={setSettingsForm}
            isAdvancedLocked={isAdvancedLocked}
            activeBrand={activeBrand}
            uploadingFavicon={uploadingFavicon}
            uploadingLogo={uploadingLogo}
            onFileUpload={handleFileUpload}
          />

          <BrandingColorsSection
            settingsForm={settingsForm}
            setSettingsForm={setSettingsForm}
            isAdvancedLocked={isAdvancedLocked}
          />

          <BrandingConceptsSection
            concepts={settingsForm.brand_concepts}
            onAddConcept={addConcept}
            onRemoveConcept={removeConcept}
            onUpdateConcept={updateConcept}
            activeBrand={activeBrand}
          />
        </div>

        {/* Right Column: Previsualización */}
        <BrandingLiveMobilePreview settingsForm={settingsForm} />
      </div>
    </div>
  );
});

export default AdminBranding;
