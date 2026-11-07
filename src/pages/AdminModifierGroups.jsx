import React from 'react';
import { Icon } from '@iconify-icon/react';
import { useAdminModifierGroupsPageData } from '../hooks/modifiers/useAdminModifierGroupsPageData';
import ModifierGroupsHeader from '../components/admin/modifiers/ModifierGroupsHeader';
import ModifierGroupCard from '../components/admin/modifiers/ModifierGroupCard';
import ModifierGroupModal from '../components/admin/modifiers/ModifierGroupModal';
import ModifierOptionModal from '../components/admin/modifiers/ModifierOptionModal';
import { LinkCatalogModal } from '../components/admin/LinkCatalogModal';

export default function AdminModifierGroups() {
  const {
    activeLocationId,
    isAllLocations,
    activeLocation,
    modifierGroups,
    filteredGroups,
    ingredients,
    recipes,
    menuProducts,
    categories,
    activeTab,
    setActiveTab,
    expandedGroups,
    toggleGroup,
    isGroupModalOpen,
    setIsGroupModalOpen,
    editingGroup,
    groupForm,
    setGroupForm,
    handleOpenGroup,
    handleSaveGroup,
    isOptionModalOpen,
    setIsOptionModalOpen,
    activeGroupId,
    editingOption,
    optionForm,
    setOptionForm,
    handleOpenOption,
    handleSaveOption,
    isLinkModalOpen,
    setIsLinkModalOpen,
    emojiPickerOpen,
    setEmojiPickerOpen,
    filterCategory,
    setFilterCategory,
    duplicateGroup,
    deleteGroup,
    updateOption,
    deleteOption,
  } = useAdminModifierGroupsPageData();

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 md:space-y-8 animate-fade-in overflow-x-hidden">
      <ModifierGroupsHeader
        isAllLocations={isAllLocations}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLinkModal={() => setIsLinkModalOpen(true)}
        onOpenCreateGroup={() => handleOpenGroup()}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {filteredGroups.map((group) => (
          <ModifierGroupCard
            key={group.id}
            group={group}
            allGroups={modifierGroups}
            isAllLocations={isAllLocations}
            isExpanded={Boolean(expandedGroups[group.id])}
            onToggleExpand={toggleGroup}
            onDuplicateGroup={duplicateGroup}
            onEditGroup={handleOpenGroup}
            onDeleteGroup={deleteGroup}
            onOpenOption={handleOpenOption}
            onToggleOptionActive={(optId, isActive) => updateOption(optId, { is_active: isActive })}
            onDeleteOption={deleteOption}
          />
        ))}

        {filteredGroups.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-3xl">
            <Icon icon="heroicons:squares-plus" className="text-4xl text-gray-300 mb-2" />
            <p className="text-gray-500 font-medium">Aún no has creado grupos de opciones</p>
            <button
              onClick={() => handleOpenGroup()}
              className="mt-2 text-sm text-[#2f4131] font-bold hover:underline cursor-pointer"
            >
              Crea tu primer grupo aquí
            </button>
          </div>
        )}
      </div>

      <ModifierGroupModal
        isOpen={isGroupModalOpen}
        isEditing={Boolean(editingGroup)}
        groupForm={groupForm}
        setGroupForm={setGroupForm}
        onSaveGroup={handleSaveGroup}
        onClose={() => setIsGroupModalOpen(false)}
      />

      <ModifierOptionModal
        isOpen={isOptionModalOpen}
        isEditing={Boolean(editingOption)}
        optionForm={optionForm}
        setOptionForm={setOptionForm}
        onSaveOption={handleSaveOption}
        onClose={() => setIsOptionModalOpen(false)}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        categories={categories}
        menuProducts={menuProducts}
        recipes={recipes}
        ingredients={ingredients}
        modifierGroups={modifierGroups}
        activeGroupId={activeGroupId}
        emojiPickerOpen={emojiPickerOpen}
        setEmojiPickerOpen={setEmojiPickerOpen}
      />

      {isLinkModalOpen && (
        <LinkCatalogModal
          isOpen={isLinkModalOpen}
          onClose={() => setIsLinkModalOpen(false)}
          type="modifier_group"
          locationId={activeLocationId}
          locationName={activeLocation?.name}
        />
      )}
    </div>
  );
}
