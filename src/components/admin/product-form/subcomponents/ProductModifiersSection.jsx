import React from 'react';
import { Icon } from '@iconify-icon/react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getSubGroupsForGroup } from '../helpers/productFormHelpers';

export default function ProductModifiersSection({
  formData,
  setFormData,
  rawModifierGroups = [],
  mainGroups = [],
  subGroups = [],
  toggleModifierGroup,
  onDragEnd,
  allergens = [],
  toggleTag
}) {
  return (
    <div className="space-y-6">
      {/* Estación de Preparación (Enrutamiento KDS) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
            Enrutamiento KDS (Cocina / Barra)
          </span>
          <p className="text-[10px] text-slate-600 mt-0.5">
            Define qué pantalla de comanda recibe la orden al momento de cobro.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Cocina */}
          <button
            type="button"
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                station: 'kitchen',
                requires_kitchen: true
              }))
            }
            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
              formData.station === 'kitchen' ||
              (!formData.station && formData.requires_kitchen !== false)
                ? 'bg-orange-50 border-orange-400 text-orange-950 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="text-xl block mb-1">🍳</span>
            <span className="text-xs font-bold block">Cocina</span>
            <span className="text-[9px] text-slate-600 block">Platos / Bowls</span>
          </button>

          {/* Barra */}
          <button
            type="button"
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                station: 'bar',
                requires_kitchen: true
              }))
            }
            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
              formData.station === 'bar'
                ? 'bg-cyan-50 border-cyan-400 text-cyan-950 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="text-xl block mb-1">🍸</span>
            <span className="text-xs font-bold block">Barra BDS</span>
            <span className="text-[9px] text-slate-600 block">Bebidas / Café</span>
          </button>

          {/* Directo */}
          <button
            type="button"
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                station: 'none',
                requires_kitchen: false
              }))
            }
            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
              formData.station === 'none' ||
              (!formData.station && formData.requires_kitchen === false)
                ? 'bg-slate-200 border-slate-400 text-slate-900 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="text-xl block mb-1">⚡</span>
            <span className="text-xs font-bold block">Directo</span>
            <span className="text-[9px] text-slate-600 block">Snacks / Latas</span>
          </button>
        </div>

        {/* Modal Comensal: QuickView vs DIY */}
        <div className="pt-3 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Experiencia del Comensal al Hacer Clic
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  config_options: { ...prev.config_options, is_diy: false }
                }))
              }
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                !formData.config_options?.is_diy
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <span className="text-xs block">⚡ QuickView Rápido</span>
              <span className="text-[9px] text-slate-600 block font-normal mt-0.5">
                Para platos estándar
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  config_options: { ...prev.config_options, is_diy: true }
                }))
              }
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                formData.config_options?.is_diy
                  ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <span className="text-xs block">🧩 Arma tu Propio (DIY)</span>
              <span className="text-[9px] text-slate-600 block font-normal mt-0.5">
                Paso a paso por etapas
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Grupos de Modificadores & Personalizaciones */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
              Modificadores & Extras
            </span>
            <p className="text-[10px] text-slate-600 mt-0.5">
              Opciones que el cliente puede elegir (bases, salsas, proteínas adicionales).
            </p>
          </div>
          {(formData.modifier_groups || []).length > 0 && (
            <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
              {(formData.modifier_groups || []).length} Activos
            </span>
          )}
        </div>

        {/* Modificadores Activos con Drag & Drop */}
        {(formData.modifier_groups || []).length > 0 ? (
          <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200">
            <p className="text-[10px] font-bold text-purple-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Icon icon="heroicons:bars-arrow-down" className="text-xs" />
              Orden en Menú (Arrastra para reordenar)
            </p>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="selected-modifiers">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-1.5"
                  >
                    {(formData.modifier_groups || []).map((id, index) => {
                      const g = rawModifierGroups.find((x) => x.id === id);
                      if (!g) return null;
                      return (
                        <Draggable key={id} draggableId={id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-purple-200 shadow-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Icon
                                  icon="heroicons:bars-2"
                                  className="text-purple-400 cursor-grab text-xs"
                                />
                                <span className="text-xs font-bold text-purple-950 truncate">
                                  {g.name}
                                </span>
                                {g.is_submodifier && (
                                  <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-black">
                                    Sub
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleModifierGroup(id)}
                                className="text-purple-300 hover:text-red-500 transition-colors p-0.5 cursor-pointer"
                              >
                                <Icon icon="heroicons:x-mark" className="text-sm" />
                              </button>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <p className="text-xs font-semibold text-slate-500">Sin modificadores asignados</p>
            <p className="text-[10px] text-slate-600 mt-0.5">
              Selecciona los grupos disponibles abajo.
            </p>
          </div>
        )}

        {/* Selector de Grupos Disponibles */}
        <div className="pt-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-2">
            Grupos de Modificadores Disponibles
          </span>
          {mainGroups.length > 0 ? (
            <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1.5 border border-slate-200 rounded-xl p-2">
              {mainGroups.map((group) => {
                const isSelected = (formData.modifier_groups || []).includes(group.id);
                const associatedSubGroups = getSubGroupsForGroup(group, subGroups);

                return (
                  <div key={group.id} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => toggleModifierGroup(group.id)}
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-100/70 border-purple-300 text-purple-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{group.name}</span>
                      <span
                        className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-purple-600 border-purple-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Icon icon="heroicons:check" className="text-[10px]" />}
                      </span>
                    </button>

                    {/* Subgroups if selected */}
                    {isSelected && associatedSubGroups.length > 0 && (
                      <div className="pl-3 border-l-2 border-purple-200 ml-2 space-y-1 py-1">
                        {associatedSubGroups.map((sg) => {
                          const isSubSelected = (formData.modifier_groups || []).includes(sg.id);
                          return (
                            <button
                              key={sg.id}
                              type="button"
                              onClick={() => toggleModifierGroup(sg.id)}
                              className={`w-full px-2 py-1 rounded text-left text-[11px] font-medium flex items-center justify-between border cursor-pointer ${
                                isSubSelected
                                  ? 'bg-purple-50 border-purple-200 text-purple-800 font-bold'
                                  : 'bg-white border-slate-200 text-slate-500'
                              }`}
                            >
                              <span className="truncate">↳ {sg.name}</span>
                              {isSubSelected && (
                                <Icon icon="heroicons:check" className="text-purple-600 text-xs" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No hay grupos configurados en la carta.</p>
          )}
        </div>
      </div>

      {/* Dietas y Alérgenos */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        {/* Dietas */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-2">
            Dietas & Estilos de Vida
          </span>
          <div className="flex flex-wrap gap-1.5">
            {allergens
              .filter((a) => a.type === 'diet')
              .map((diet) => {
                const isSelected = formData.tags?.includes(diet.name);
                return (
                  <button
                    key={diet.id}
                    type="button"
                    onClick={() => toggleTag(diet.name)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{diet.emoji}</span>
                    <span>{diet.name}</span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Alérgenos */}
        <div className="pt-3 border-t border-slate-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-2">
            Alérgenos Notificables
          </span>
          <div className="flex flex-wrap gap-1.5">
            {allergens
              .filter((a) => a.type !== 'diet')
              .map((allergen) => {
                const isSelected = formData.tags?.includes(allergen.name);
                return (
                  <button
                    key={allergen.id}
                    type="button"
                    onClick={() => toggleTag(allergen.name)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-red-100 border-red-300 text-red-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{allergen.emoji}</span>
                    <span>{allergen.name}</span>
                  </button>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
