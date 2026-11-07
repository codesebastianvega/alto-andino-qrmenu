import React from 'react';
import { Icon } from '@iconify-icon/react';
import { useAdminExperiencesData } from '../hooks/experiences/useAdminExperiencesData';
import ExperiencesHeader from '../components/admin/experiences/ExperiencesHeader';
import ExperiencesCardsGrid from '../components/admin/experiences/ExperiencesCardsGrid';
import ExperiencesLeadsTable from '../components/admin/experiences/ExperiencesLeadsTable';
import ExperienceFormModal from '../components/admin/experiences/ExperienceFormModal';
import ExperienceBookingsDrawer from '../components/admin/experiences/ExperienceBookingsDrawer';

export default function AdminExperiences() {
  const {
    isLocked,
    loading,
    experiences,
    activeTab,
    setActiveTab,
    allLeads,
    loadingAllLeads,
    isModalOpen,
    editingExp,
    form,
    setForm,
    saving,
    includeInput,
    setIncludeInput,
    stepInput,
    setStepInput,
    uploadingExpImage,
    dateInput,
    setDateInput,
    selectedExpId,
    bookings,
    loadingBookings,
    openModal,
    closeModal,
    addStep,
    removeStep,
    handleExpImageUpload,
    addInclude,
    removeInclude,
    addDate,
    removeDate,
    handleSubmit,
    handleDelete,
    openBookings,
    closeBookings,
    togglePaymentStatus,
    toggleActive,
  } = useAdminExperiencesData();

  if (isLocked) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-center">
        <div className="max-w-md">
          <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Icon icon="heroicons:lock-closed" className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Módulo Restringido</h2>
          <p className="text-zinc-500">
            Tu plan actual no incluye el módulo de Experiencias. Por favor, contacta a soporte o actualiza tu plan para acceder.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2f4131]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto min-h-screen">
      <ExperiencesHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewExperience={() => openModal()}
      />

      {activeTab === 'leads' ? (
        <ExperiencesLeadsTable
          leads={allLeads}
          loading={loadingAllLeads}
          onTogglePaymentStatus={togglePaymentStatus}
        />
      ) : (
        <ExperiencesCardsGrid
          experiences={experiences}
          onOpenBookings={openBookings}
          onEditExperience={openModal}
          onToggleActive={toggleActive}
          onDeleteExperience={handleDelete}
        />
      )}

      <ExperienceFormModal
        isOpen={isModalOpen}
        isEditing={Boolean(editingExp)}
        form={form}
        setForm={setForm}
        saving={saving}
        includeInput={includeInput}
        setIncludeInput={setIncludeInput}
        onAddInclude={addInclude}
        onRemoveInclude={removeInclude}
        stepInput={stepInput}
        setStepInput={setStepInput}
        onAddStep={addStep}
        onRemoveStep={removeStep}
        uploadingImage={uploadingExpImage}
        onUploadImage={handleExpImageUpload}
        dateInput={dateInput}
        setDateInput={setDateInput}
        onAddDate={addDate}
        onRemoveDate={removeDate}
        onSubmit={handleSubmit}
        onClose={closeModal}
      />

      <ExperienceBookingsDrawer
        isOpen={Boolean(selectedExpId)}
        bookings={bookings}
        loading={loadingBookings}
        onClose={closeBookings}
        onTogglePaymentStatus={togglePaymentStatus}
      />
    </div>
  );
}
