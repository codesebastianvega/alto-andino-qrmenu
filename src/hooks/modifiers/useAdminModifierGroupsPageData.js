import { useState, useEffect } from 'react';
import { useAdminModifierGroups } from '../useAdminModifierGroups';
import { useAdminIngredients } from '../useAdminIngredients';
import { useAdminRecipes } from '../useAdminRecipes';
import { useAdminProducts } from '../useAdminProducts';
import { useIngredientCategories } from '../useIngredientCategories';
import { useLocation } from '../../context/LocationContext';

const DEFAULT_GROUP_FORM = {
  name: '',
  description: '',
  is_required: false,
  min_select: 0,
  max_select: 1,
  is_submodifier: false,
  allow_quantity: false,
  included_quantity: 0,
};

const DEFAULT_OPTION_FORM = {
  name: '',
  price: '',
  extra_price: '',
  ingredient_id: '',
  recipe_id: '',
  nested_group_id: '',
  emoji: '',
  image_url: '',
  is_active: true,
};

export function useAdminModifierGroupsPageData() {
  const { activeLocationId, isAllLocations, activeLocation } = useLocation();
  const {
    modifierGroups,
    fetchModifierGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    duplicateGroup,
    createOption,
    updateOption,
    deleteOption,
  } = useAdminModifierGroups(activeLocationId);

  const { ingredients, fetchIngredients } = useAdminIngredients();
  const { recipes } = useAdminRecipes();
  const { products: menuProducts } = useAdminProducts();
  const { categories } = useIngredientCategories();

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupForm, setGroupForm] = useState(DEFAULT_GROUP_FORM);
  const [activeTab, setActiveTab] = useState('main'); // 'main' | 'sub'
  const [searchTerm, setSearchTerm] = useState('');

  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [editingOption, setEditingOption] = useState(null);
  const [optionForm, setOptionForm] = useState(DEFAULT_OPTION_FORM);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');

  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  useEffect(() => {
    fetchModifierGroups();
    fetchIngredients(activeLocationId);
  }, [fetchModifierGroups, fetchIngredients, activeLocationId]);

  useEffect(() => {
    if (isGroupModalOpen || isOptionModalOpen || isLinkModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isGroupModalOpen, isOptionModalOpen, isLinkModalOpen]);

  const handleOpenGroup = (group = null) => {
    if (group) {
      setEditingGroup(group);
      setGroupForm({
        name: group.name,
        description: group.description || '',
        is_required: group.is_required,
        min_select: group.min_select,
        max_select: group.max_select,
        is_submodifier: group.is_submodifier || false,
        allow_quantity: group.allow_quantity || false,
        included_quantity: group.included_quantity || 0,
      });
    } else {
      setEditingGroup(null);
      setGroupForm({
        name: '',
        description: '',
        is_required: false,
        min_select: 0,
        max_select: 1,
        is_submodifier: activeTab === 'sub',
        allow_quantity: false,
        included_quantity: 0,
      });
    }
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async (e) => {
    e.preventDefault();
    if (editingGroup) {
      await updateGroup(editingGroup.id, groupForm);
    } else {
      await createGroup(groupForm);
    }
    setIsGroupModalOpen(false);
  };

  const handleOpenOption = (groupId, option = null) => {
    setActiveGroupId(groupId);
    setFilterCategory('');
    if (option) {
      setEditingOption(option);
      setOptionForm({
        name: option.name,
        price: option.price || '',
        extra_price:
          option.extra_price !== null && option.extra_price !== undefined
            ? String(option.extra_price)
            : '',
        ingredient_id: option.ingredient_id || '',
        recipe_id: option.recipe_id || '',
        nested_group_id: option.nested_group_id || '',
        emoji: option.emoji || '',
        image_url: option.image_url || '',
        is_active: option.is_active !== false,
      });
    } else {
      setEditingOption(null);
      setOptionForm(DEFAULT_OPTION_FORM);
    }
    setIsOptionModalOpen(true);
  };

  const handleSaveOption = async (e) => {
    e.preventDefault();
    const payload = {
      group_id: activeGroupId,
      name: optionForm.name,
      price: optionForm.price ? parseFloat(optionForm.price) : 0,
      extra_price:
        optionForm.extra_price !== '' &&
        optionForm.extra_price !== null &&
        optionForm.extra_price !== undefined
          ? parseFloat(optionForm.extra_price)
          : null,
      ingredient_id: optionForm.ingredient_id || null,
      recipe_id: optionForm.recipe_id || null,
      nested_group_id: optionForm.nested_group_id || null,
      emoji: optionForm.emoji || null,
      image_url: optionForm.image_url || null,
      is_active: optionForm.is_active !== false,
    };
    if (editingOption) {
      await updateOption(editingOption.id, payload);
    } else {
      await createOption(payload);
    }
    setIsOptionModalOpen(false);
  };

  const filteredGroups = modifierGroups
    .filter((group) => (activeTab === 'sub' ? group.is_submodifier : !group.is_submodifier))
    .filter((group) => group.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return {
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
    searchTerm,
    setSearchTerm,
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
  };
}
