import { useState, useEffect, useMemo } from 'react';
import { useAdminModifierGroups } from '../hooks/useAdminModifierGroups';
import { useAdminIngredients } from '../hooks/useAdminIngredients';
import { useIngredientCategories } from '../hooks/useIngredientCategories';
import { PageHeader, PrimaryButton, SecondaryButton, FormField, TextInput } from '../components/admin/ui';
import { Icon } from '@iconify-icon/react';
import EmojiPicker from 'emoji-picker-react';
import { toast } from '../components/Toast';
import { useLocation } from '../context/LocationContext';
import { LinkCatalogModal } from '../components/admin/LinkCatalogModal';
import { Link as LinkIcon, AlertTriangle, CheckCircle } from 'lucide-react';

export default function AdminModifierGroups() {
  const { activeLocationId, isAllLocations, activeLocation } = useLocation();
  const { modifierGroups, fetchModifierGroups, createGroup, updateGroup, deleteGroup, duplicateGroup, createOption, updateOption, deleteOption } = useAdminModifierGroups(activeLocationId);
  const { ingredients, fetchIngredients } = useAdminIngredients();
  const { categories } = useIngredientCategories();
  
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupForm, setGroupForm] = useState({ name: '', description: '', is_required: false, min_select: 0, max_select: 1, is_submodifier: false });
  const [activeTab, setActiveTab] = useState('main');
  const [searchTerm, setSearchTerm] = useState('');

  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [editingOption, setEditingOption] = useState(null);
  const [optionForm, setOptionForm] = useState({ name: '', price: '', ingredient_id: '', nested_group_id: '', emoji: '', image_url: '' });
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
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
        is_submodifier: group.is_submodifier || false
      });
    } else {
      setEditingGroup(null);
      setGroupForm({ name: '', description: '', is_required: false, min_select: 0, max_select: 1, is_submodifier: activeTab === 'sub' });
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
        ingredient_id: option.ingredient_id || '',
        nested_group_id: option.nested_group_id || '',
        emoji: option.emoji || '',
        image_url: option.image_url || ''
      });
    } else {
      setEditingOption(null);
      setOptionForm({ name: '', price: '', ingredient_id: '', nested_group_id: '', emoji: '', image_url: '' });
    }
    setIsOptionModalOpen(true);
  };

  const handleSaveOption = async (e) => {
    e.preventDefault();
    const payload = {
      group_id: activeGroupId,
      name: optionForm.name,
      price: optionForm.price ? parseFloat(optionForm.price) : 0,
      ingredient_id: optionForm.ingredient_id || null,
      nested_group_id: optionForm.nested_group_id || null,
      emoji: optionForm.emoji || null,
      image_url: optionForm.image_url || null
    };
    if (editingOption) {
      await updateOption(editingOption.id, payload);
    } else {
      await createOption(payload);
    }
    setIsOptionModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 md:space-y-8 animate-fade-in overflow-x-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#2f4131]/10 rounded-2xl flex items-center justify-center text-[#2f4131]">
              <Icon icon="heroicons:sparkles" className="text-2xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#2f4131]">Extras y Modificadores</h2>
              <p className="text-sm text-gray-500 mt-1">
                Configura las opciones que complementan o alteran tus platos.
              </p>
            </div>
          </div>
          
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {!isAllLocations && (
                <button
                  onClick={() => setIsLinkModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 h-[42px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-bold transition-all border border-indigo-100 shadow-sm w-full sm:w-auto"
                >
                  <LinkIcon size={18} />
                  Vincular del Catálogo
                </button>
              )}
              <PrimaryButton onClick={() => handleOpenGroup()} className="h-[42px] px-6">
                <Icon icon="heroicons:plus-circle" className="text-xl" />
                Crear Grupo
              </PrimaryButton>
            </div>
        </div>
      <div className="flex flex-row overflow-x-auto no-scrollbar bg-gray-50 p-1.5 rounded-2xl w-full sm:w-fit mx-auto border border-gray-100">
          <button
            onClick={() => setActiveTab('main')}
            className={`whitespace-nowrap shrink-0 px-4 sm:px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'main' ? 'bg-white text-[#2f4131] shadow-md border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Icon icon="heroicons:list-bullet" className={activeTab === 'main' ? 'text-[#2f4131]' : 'text-gray-400'} />
            Modificadores Principales
          </button>
          <button
            onClick={() => setActiveTab('sub')}
            className={`whitespace-nowrap shrink-0 px-4 sm:px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'sub' ? 'bg-white text-[#2f4131] shadow-md border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Icon icon="heroicons:tag" className={activeTab === 'sub' ? 'text-[#2f4131]' : 'text-gray-400'} />
            Sub-Modificadores (Atributos)
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {modifierGroups
            .filter(group => activeTab === 'sub' ? group.is_submodifier : !group.is_submodifier)
            .filter(group => group.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((group) => (
            <div key={group.id} className="group relative border border-gray-100/80 rounded-3xl p-6 bg-white shadow-sm flex flex-col h-full hover:shadow-xl hover:shadow-[#2f4131]/5 transition-all duration-300 border-b-4 hover:border-b-[#2f4131]/30">
              <div className="flex justify-between items-start mb-4 gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-gray-900 text-lg truncate group-hover:text-[#2f4131] transition-colors">{group.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{group.description || 'Sin descripción'}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => duplicateGroup(group)} 
                    className="p-1.5 bg-white text-gray-400 hover:text-emerald-600 rounded-lg shadow-sm border border-gray-100 transition-all hover:scale-110"
                    title="Duplicar Grupo"
                  >
                    <Icon icon="heroicons:document-duplicate" className="text-lg" />
                  </button>
                  <button 
                    onClick={() => handleOpenGroup(group)} 
                    className="p-1.5 bg-white text-gray-400 hover:text-blue-600 rounded-lg shadow-sm border border-gray-100 transition-all hover:scale-110"
                    title="Editar Grupo"
                  >
                    <Icon icon="heroicons:pencil-square" className="text-lg" />
                  </button>
                  <button 
                    onClick={() => deleteGroup(group.id)} 
                    className="p-1.5 bg-white text-gray-400 hover:text-red-600 rounded-lg shadow-sm border border-gray-100 transition-all hover:scale-110"
                    title="Eliminar Grupo"
                  >
                    <Icon icon="heroicons:trash" className="text-lg" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border shadow-sm ${group.is_required ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                  {group.is_required ? 'Obligatorio' : 'Opcional'}
                </span>
                <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                  Min {group.min_select} · Max {group.max_select}
                </span>
                {group.usage_count > 0 && (
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-violet-50 text-violet-600 border border-violet-100 shadow-sm flex items-center gap-1">
                    <Icon icon="heroicons:shopping-bag" />
                    {group.usage_count} {group.usage_count === 1 ? 'Producto' : 'Productos'}
                  </span>
                )}
                {/* Location-specific visibility helper */}
                {!isAllLocations && (
                  group.linked_usage_count > 0 ? (
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm flex items-center gap-1">
                      <CheckCircle size={12} />
                      En uso
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-amber-50 text-amber-600 border border-amber-100 shadow-sm flex items-center gap-1">
                      <AlertTriangle size={12} />
                      Sin uso en sede
                    </span>
                  )
                )}
              </div>

              <div className="flex-1 space-y-2 mt-2 border-t border-gray-100 pt-5">
                {!expandedGroups[group.id] && group.options?.length > 0 && (
                  <div className="mb-4 space-y-1.5 animate-slide-up">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Vista previa opciones</p>
                    {group.options.slice(0, 3).map(opt => (
                      <div key={opt.id} className="flex items-center gap-2 text-[11px] text-gray-600 px-2 py-1 bg-white/40 rounded-lg border border-gray-50">
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span className="font-medium truncate">{opt.name}</span>
                        <span className="ml-auto font-black text-[#2f4131]/40">${opt.price || 0}</span>
                      </div>
                    ))}
                    {group.options.length > 3 && (
                      <p className="text-[10px] text-[#2f4131] font-bold mt-1 ml-2">+ {group.options.length - 3} opciones más...</p>
                    )}
                  </div>
                )}

                <button 
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center justify-between text-left p-2 rounded-xl transition-all ${expandedGroups[group.id] ? 'bg-[#2f4131] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest ml-1">
                    Gestionar Opciones ({group.options?.length || 0})
                  </p>
                  <Icon 
                    icon="heroicons:chevron-down" 
                    className={`text-lg transition-transform ${expandedGroups[group.id] ? 'rotate-180' : ''}`} 
                  />
                </button>
                
                {expandedGroups[group.id] && (
                  <div className="space-y-2 mt-3 animate-fade-in">
                    {group.options?.map(opt => (
                      <div key={opt.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl text-sm border border-gray-100">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800">{opt.name}</span>
                          <div className="flex gap-2">
                            {opt.ingredient_id && (
                              <span className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5">
                                <Icon icon="heroicons:link" /> Usa Insumo
                              </span>
                            )}
                            {opt.nested_group_id && modifierGroups.find(g => g.id === opt.nested_group_id) && (
                              <span className="text-[10px] text-blue-600 flex items-center gap-1 mt-0.5">
                                <Icon icon="heroicons:arrow-right-circle" /> Despliega: {modifierGroups.find(g => g.id === opt.nested_group_id).name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-gray-500 text-xs">+{opt.price ? `$${opt.price}` : '$0'}</span>
                          <button onClick={() => handleOpenOption(group.id, opt)} className="text-gray-400 hover:text-blue-600">
                            <Icon icon="heroicons:pencil-square" />
                          </button>
                          <button onClick={() => deleteOption(opt.id)} className="text-gray-400 hover:text-red-600">
                            <Icon icon="heroicons:x-mark" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => handleOpenOption(group.id)}
                      className="mt-4 w-full py-2.5 rounded-xl border border-dashed border-gray-300 text-sm font-semibold text-gray-500 hover:text-gray-800 hover:border-gray-400 hover:bg-gray-100 transition-all"
                    >
                      + Agregar Opción
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {modifierGroups.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-3xl">
              <Icon icon="heroicons:squares-plus" className="text-4xl text-gray-300 mb-2" />
              <p className="text-gray-500 font-medium">Aún no has creado grupos de opciones</p>
              <button onClick={() => handleOpenGroup()} className="mt-2 text-sm text-[#2f4131] font-bold hover:underline">
                Crea tu primer grupo aquí
              </button>
            </div>
          )}
        </div>

      {isGroupModalOpen && (
        <div className="fixed inset-0 bg-gray-900/80 flex items-end md:items-start justify-center z-[100] p-0 md:p-4 overflow-hidden backdrop-blur-sm">
          <div className="bg-white rounded-t-[2rem] md:rounded-[2rem] w-full max-w-2xl h-[90vh] md:h-auto md:max-h-[90vh] md:my-8 flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200">
            <div className="shrink-0 p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#2f4131]">{editingGroup ? "Editar Grupo" : "Nuevo Grupo"}</h3>
                <p className="text-xs text-gray-500 mt-1">Establece las reglas y límites de este grupo de modificadores.</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsGroupModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icon icon="heroicons:x-mark" className="text-xl" />
              </button>
            </div>
            
            <form onSubmit={handleSaveGroup} className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
              <div className="p-6 space-y-5 flex-1">
                <FormField label="Nombre del Grupo">
                  <TextInput required value={groupForm.name} onChange={e => setGroupForm({...groupForm, name: e.target.value})} placeholder="Ej. Elige tu término" />
                </FormField>
                <FormField label="Descripción / Instrucción (Opcional)">
                  <TextInput value={groupForm.description} onChange={e => setGroupForm({...groupForm, description: e.target.value})} placeholder="Ej. Escoge cómo quieres tu carne" />
                </FormField>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="¿Es obligatorio?">
                    <select 
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2f4131] outline-none"
                      value={groupForm.is_required ? 'true' : 'false'}
                      onChange={e => setGroupForm({...groupForm, is_required: e.target.value === 'true', min_select: e.target.value === 'true' ? Math.max(1, groupForm.min_select) : 0})}
                    >
                      <option value="false">No (Opcional)</option>
                      <option value="true">Sí (Obligatorio)</option>
                    </select>
                  </FormField>
                  <FormField label="Cant. Máxima">
                    <input type="number" required min="1" max="99" value={groupForm.max_select} onChange={e => setGroupForm({...groupForm, max_select: parseInt(e.target.value)})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2f4131] outline-none" />
                  </FormField>
                </div>
              </div>

              <div className="shrink-0 p-4 md:p-6 bg-white border-t border-gray-100 flex flex-col sm:flex-row gap-3 mt-auto">
                <SecondaryButton type="button" onClick={() => setIsGroupModalOpen(false)} className="w-full sm:w-auto">Cancelar</SecondaryButton>
                <PrimaryButton type="submit" className="w-full sm:w-auto sm:ml-auto">Guardar Grupo</PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {isOptionModalOpen && (
        <div className="fixed inset-0 bg-gray-900/80 flex items-end md:items-start justify-center z-[100] p-0 md:p-4 overflow-hidden backdrop-blur-sm">
          <div className="bg-white rounded-t-[2rem] md:rounded-[2rem] w-full max-w-2xl h-[95vh] md:h-auto md:max-h-[90vh] md:my-8 flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200">
            <div className="shrink-0 p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#2f4131]">{editingOption ? "Editar Opción" : "Agregar Opción al Grupo"}</h3>
                <p className="text-xs text-gray-500 mt-1">Define el precio, vinculación a inventario y sub-opciones para este modificador.</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsOptionModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icon icon="heroicons:x-mark" className="text-xl" />
              </button>
            </div>
            
            <form onSubmit={handleSaveOption} className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
              <div className="p-6 space-y-5 flex-1">
                <FormField label="Vincular a inventario (Opcional)">
                  <div className="mb-2">
                    <select 
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#2f4131]/20 text-gray-600 font-medium"
                      value={filterCategory}
                      onChange={e => setFilterCategory(e.target.value)}
                    >
                      <option value="">-- Todas las Categorías --</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <select 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2f4131] outline-none"
                    value={optionForm.ingredient_id}
                    onChange={e => {
                      const val = e.target.value;
                      const ing = ingredients.find(i => i.id === val);
                      setOptionForm({
                        ...optionForm, 
                        ingredient_id: val,
                        name: ing ? ing.name : optionForm.name,
                        price: ing ? (ing.selling_price || 0) : optionForm.price
                      });
                    }}
                  >
                    <option value="">-- Sin vincular (Solo texto) --</option>
                    <optgroup label={filterCategory ? "Insumos Filtrados" : "Tus Insumos"}>
                      {ingredients
                        .filter(ing => !filterCategory || ing.category_id === filterCategory)
                        .map(ing => (
                          <option key={ing.id} value={ing.id}>{ing.name}</option>
                      ))}
                    </optgroup>
                  </select>
                  <p className="text-[10px] text-gray-500 mt-1">Si vinculas un insumo, el sistema descontará inventario cuando un cliente pida esta opción.</p>
                </FormField>

                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-1 relative">
                    <FormField label="Emoji">
                      <div 
                        className={`flex items-center justify-center h-12 w-full border-2 border-dashed rounded-2xl cursor-pointer transition-colors text-2xl ${
                          emojiPickerOpen ? 'border-[#2f4131] bg-neutral-50' : 'border-neutral-200 hover:border-[#2f4131] hover:bg-neutral-50'
                        }`}
                        onClick={() => setEmojiPickerOpen(p => !p)}
                      >
                        {optionForm.emoji || <span className="text-sm text-neutral-400 font-bold">Icono</span>}
                      </div>
                      {emojiPickerOpen && (
                        <div className="absolute top-full left-0 z-50 mt-2 shadow-2xl rounded-2xl overflow-hidden border border-neutral-100">
                          <div className="bg-white p-2 border-b border-neutral-100 flex justify-between items-center">
                            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Elige tu Emoji</span>
                            <button type="button" onClick={() => setEmojiPickerOpen(false)} className="text-neutral-400 hover:text-black">
                               <Icon icon="heroicons:x-mark" className="text-xl" />
                            </button>
                          </div>
                          <EmojiPicker 
                            onEmojiClick={(pickerOut) => {
                              setOptionForm({...optionForm, emoji: pickerOut.emoji});
                              setEmojiPickerOpen(false);
                            }}
                            autoFocusSearch={false}
                            searchDisabled={false}
                            skinTonesDisabled={true}
                            width={300}
                            height={350}
                          />
                        </div>
                      )}
                    </FormField>
                  </div>
                  <div className="col-span-3">
                    <FormField label="Nombre de la opción *">
                      <TextInput required value={optionForm.name} onChange={e => setOptionForm({...optionForm, name: e.target.value})} placeholder="Ej. Bien cocido" />
                    </FormField>
                  </div>
                </div>

                <FormField label="URL de Imagen (Menú DIY)">
                  <div className="flex gap-4 items-start">
                    <div className="flex-1">
                      <TextInput value={optionForm.image_url} onChange={e => setOptionForm({...optionForm, image_url: e.target.value})} placeholder="https://..." />
                      <p className="text-[10px] text-gray-500 mt-1">Se muestra como miniatura en el modal interactivo de Arma tu Plato.</p>
                    </div>
                    {optionForm.image_url && (
                      <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                        <img src={optionForm.image_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                        <span className="hidden text-xl text-gray-300">🖼️</span>
                      </div>
                    )}
                  </div>
                </FormField>

                <FormField label="Precio Adicional ($)">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                    <input
                      type="number"
                      min="0"
                      className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2f4131] outline-none"
                      value={optionForm.price}
                      onChange={e => setOptionForm({...optionForm, price: e.target.value})}
                      placeholder="Ej. 1500"
                    />
                  </div>
                  {(() => {
                    const selectedIng = ingredients.find(i => i.id === optionForm.ingredient_id);
                    if (selectedIng && selectedIng.unit_cost > 0 && optionForm.price) {
                      const cost = selectedIng.unit_cost;
                      const price = parseFloat(optionForm.price) || 0;
                      const margin = price - cost;
                      const marginPercent = price > 0 ? Math.round((margin / price) * 100) : 0;
                      return (
                        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <span className="text-gray-500 block mb-0.5">Costo en Receta:</span>
                            <span className="font-bold text-gray-800">${cost.toLocaleString()}</span> <span className="text-gray-400">/{selectedIng.usage_unit || 'u'}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-gray-500 block mb-0.5">Margen Generado:</span>
                            <span className={`font-bold ${marginPercent >= 50 ? 'text-emerald-700' : marginPercent > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                              ${margin.toLocaleString()} ({marginPercent}%)
                            </span>
                          </div>
                        </div>
                      );
                    } else if (selectedIng && selectedIng.unit_cost > 0) {
                      return (
                        <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-xl border border-amber-100">
                          <Icon icon="heroicons:information-circle" className="text-base" /> 
                          <span>Costo base del insumo: <b>${selectedIng.unit_cost.toLocaleString()}</b>. Asígnale un precio para ver tu margen.</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </FormField>

                <FormField label="¿Desplegar sub-opciones? (Opcional)">
                  <div className="relative">
                    <select 
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2f4131] outline-none"
                      value={optionForm.nested_group_id}
                      onChange={e => setOptionForm({...optionForm, nested_group_id: e.target.value})}
                    >
                      <option value="">-- Sin sub-opciones --</option>
                      <optgroup label="Selecciona una Condición">
                        {modifierGroups
                          .filter(g => g.is_submodifier && g.id !== activeGroupId)
                          .map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Ej: Si esta opción es "Carne", aquí podrías vincular el grupo "Términos de Carne".</p>
                </FormField>
              </div>

              <div className="shrink-0 p-4 md:p-6 bg-white border-t border-gray-100 flex flex-col sm:flex-row gap-3 mt-auto">
                <SecondaryButton type="button" onClick={() => setIsOptionModalOpen(false)} className="w-full sm:w-auto">Cancelar</SecondaryButton>
                <PrimaryButton type="submit" className="w-full sm:w-auto sm:ml-auto">{editingOption ? "Guardar Cambios" : "Agregar Opción"}</PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
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
