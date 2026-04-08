import { useState, useEffect } from 'react';
import { useAdminModifierGroups } from '../hooks/useAdminModifierGroups';
import { useAdminIngredients } from '../hooks/useAdminIngredients';
import { useIngredientCategories } from '../hooks/useIngredientCategories';
import { PageHeader, PrimaryButton, SecondaryButton, Modal, ModalHeader, FormField, TextInput } from '../components/admin/ui';
import { Icon } from '@iconify-icon/react';

export default function AdminModifierGroups() {
  const { modifierGroups, fetchModifierGroups, createGroup, updateGroup, deleteGroup, createOption, updateOption, deleteOption } = useAdminModifierGroups();
  const { ingredients, fetchIngredients } = useAdminIngredients();
  const { categories } = useIngredientCategories();
  
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupForm, setGroupForm] = useState({ name: '', description: '', is_required: false, min_select: 0, max_select: 1, is_submodifier: false });
  const [activeTab, setActiveTab] = useState('main');

  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [editingOption, setEditingOption] = useState(null);
  const [optionForm, setOptionForm] = useState({ name: '', price: '', ingredient_id: '', nested_group_id: '', emoji: '', image_url: '' });
  const [filterCategory, setFilterCategory] = useState('');
  
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  useEffect(() => {
    fetchModifierGroups();
    fetchIngredients();
  }, [fetchModifierGroups, fetchIngredients]);

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
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="bg-white rounded-[2rem] p-8 mt-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#2f4131]">Extras y Modificadores</h2>
            <p className="text-sm text-gray-500 mt-1">
              Configura las opciones que complementan o alteran tus platos.
            </p>
          </div>
          <PrimaryButton onClick={() => handleOpenGroup()}>
            + Crear Grupo
          </PrimaryButton>
        </div>

        <div className="flex bg-gray-100 p-1 mb-8 rounded-xl w-fit mx-auto border border-gray-200">
          <button
            onClick={() => setActiveTab('main')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'main' ? 'bg-white text-[#2f4131] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Modificadores Principales
          </button>
          <button
            onClick={() => setActiveTab('sub')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'sub' ? 'bg-white text-[#2f4131] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Sub-Modificadores (Atributos)
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modifierGroups
            .filter(group => activeTab === 'sub' ? group.is_submodifier : !group.is_submodifier)
            .map((group) => (
            <div key={group.id} className="border border-gray-100 rounded-2xl p-6 bg-gray-50 flex flex-col h-full shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{group.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{group.description}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenGroup(group)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors">
                    <Icon icon="heroicons:pencil-square" className="text-lg" />
                  </button>
                  <button onClick={() => deleteGroup(group.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                    <Icon icon="heroicons:trash" className="text-lg" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${group.is_required ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  {group.is_required ? 'Obligatorio' : 'Opcional'}
                </span>
                <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                  Min {group.min_select} · Max {group.max_select}
                </span>
              </div>

              <div className="flex-1 space-y-2 mt-2 border-t border-gray-200 pt-4">
                <button 
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-gray-600 transition-colors">
                    Opciones ({group.options?.length || 0})
                  </p>
                  <Icon 
                    icon="heroicons:chevron-down" 
                    className={`text-gray-400 transition-transform ${expandedGroups[group.id] ? 'rotate-180' : ''}`} 
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
      </div>

      {isGroupModalOpen && (
        <Modal onClose={() => setIsGroupModalOpen(false)}>
          <ModalHeader title={editingGroup ? "Editar Grupo" : "Nuevo Grupo"} onClose={() => setIsGroupModalOpen(false)} />
          <form onSubmit={handleSaveGroup} className="p-6 space-y-4">
            <FormField label="Nombre del Grupo">
              <TextInput required value={groupForm.name} onChange={e => setGroupForm({...groupForm, name: e.target.value})} placeholder="Ej. Elige tu término" />
            </FormField>
            <FormField label="Descripción / Instrucción (Opcional)">
              <TextInput value={groupForm.description} onChange={e => setGroupForm({...groupForm, description: e.target.value})} placeholder="Ej. Escoge cómo quieres tu carne" />
            </FormField>
            
            <div className="grid grid-cols-2 gap-4">
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

            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-100">
              <SecondaryButton type="button" onClick={() => setIsGroupModalOpen(false)}>Cancelar</SecondaryButton>
              <PrimaryButton type="submit">Guardar Grupo</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {isOptionModalOpen && (
        <Modal onClose={() => setIsOptionModalOpen(false)}>
          <ModalHeader title={editingOption ? "Editar Opción" : "Agregar Opción al Grupo"} onClose={() => setIsOptionModalOpen(false)} />
          <form onSubmit={handleSaveOption} className="p-6 space-y-4">
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
              <div className="col-span-1">
                <FormField label="Emoji">
                  <TextInput value={optionForm.emoji} onChange={e => setOptionForm({...optionForm, emoji: e.target.value})} placeholder="🍔" />
                  <div className="flex flex-wrap gap-1 mt-1.5 h-12 overflow-y-auto w-full hide-scrollbar">
                    {['🍔','🍟','🍕','🌭','🥪','🌮','🌯','🥗','🥩','🍗','🥓','🥚','🧀','🍤','🍜','🍲','🍝','🍣','🍱','🍚','🥟','🥤','🍺','🥂','🍷','☕','🍰','🍦','🌶️','🍅','🧅','🍄','🥑','🥑','🌽','🥕','🥦','🥒','🍆','🍉','🍊','🍓','🍇','🍎'].map(em => (
                      <button type="button" key={em} onClick={() => setOptionForm({...optionForm, emoji: em})} className="text-sm hover:scale-125 transition-transform">{em}</button>
                    ))}
                  </div>
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

            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-100">
              <SecondaryButton type="button" onClick={() => setIsOptionModalOpen(false)}>Cancelar</SecondaryButton>
              <PrimaryButton type="submit">{editingOption ? "Guardar Cambios" : "Agregar Opción"}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
