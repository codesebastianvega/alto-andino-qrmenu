import React from 'react';
import { Icon } from '@iconify-icon/react';
import { PrimaryButton, SecondaryButton, FormField, TextInput } from '../ui';

export default function ModifierGroupModal({
  isOpen,
  isEditing,
  groupForm,
  setGroupForm,
  onSaveGroup,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/80 flex items-end md:items-start justify-center z-[100] p-0 md:p-4 overflow-hidden backdrop-blur-sm">
      <div className="bg-white rounded-t-[2rem] md:rounded-[2rem] w-full max-w-2xl h-[90vh] md:h-auto md:max-h-[90vh] md:my-8 flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200">
        <div className="shrink-0 p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#2f4131]">
              {isEditing ? 'Editar Grupo' : 'Nuevo Grupo'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Establece las reglas y límites de este grupo de modificadores.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <Icon icon="heroicons:x-mark" className="text-xl" />
          </button>
        </div>

        <form onSubmit={onSaveGroup} className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
          <div className="p-6 space-y-5 flex-1">
            <FormField label="Nombre del Grupo">
              <TextInput
                required
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                placeholder="Ej. Elige tu término"
              />
            </FormField>
            <FormField label="Descripción / Instrucción (Opcional)">
              <TextInput
                value={groupForm.description}
                onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                placeholder="Ej. Escoge cómo quieres tu carne"
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="¿Es obligatorio?">
                <select
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2f4131] outline-none"
                  value={groupForm.is_required ? 'true' : 'false'}
                  onChange={(e) =>
                    setGroupForm({
                      ...groupForm,
                      is_required: e.target.value === 'true',
                      min_select:
                        e.target.value === 'true' ? Math.max(1, groupForm.min_select) : 0,
                    })
                  }
                >
                  <option value="false">No (Opcional)</option>
                  <option value="true">Sí (Obligatorio)</option>
                </select>
              </FormField>
              <FormField label="Cant. Máxima Total">
                <input
                  type="number"
                  required
                  min="1"
                  max="99"
                  value={groupForm.max_select}
                  onChange={(e) =>
                    setGroupForm({
                      ...groupForm,
                      max_select: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2f4131] outline-none"
                />
              </FormField>
              <FormField label="Cantidad mínima de opciones">
                <input type="number" min="0" max={groupForm.max_select || 99}
                  value={groupForm.min_select}
                  onChange={(e) => {
                    const minimum = Math.max(0, Number(e.target.value) || 0);
                    setGroupForm({ ...groupForm, min_select: minimum, is_required: minimum > 0 });
                  }}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
              </FormField>
            </div>

            {/* Reglas avanzadas de cantidad y porciones incluidas */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={groupForm.allow_quantity}
                  onChange={(e) =>
                    setGroupForm({ ...groupForm, allow_quantity: e.target.checked })
                  }
                  className="w-4 h-4 mt-0.5 rounded text-[#2f4131] focus:ring-[#2f4131] border-gray-300"
                />
                <div>
                  <span className="text-sm font-bold text-gray-800">
                    Permitir selector de cantidad por opción (+ / -)
                  </span>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Permite al comensal elegir 2 o más porciones de un mismo ingrediente dentro de la
                    tarjeta (ej. Doble Pollo, Doble Arroz).
                  </p>
                </div>
              </label>

              {(
                <FormField label="Porciones incluidas en el precio base del plato">
                  <input
                    type="number"
                    min="0"
                    max={groupForm.max_select || 99}
                    value={groupForm.included_quantity}
                    onChange={(e) =>
                      setGroupForm({
                        ...groupForm,
                        included_quantity: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2f4131] outline-none"
                    placeholder="Ej. 1 (1 proteína incluida), 4 (4 vegetales incluidos)"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    Las primeras N porciones seleccionadas (cuyo precio sea $0) están cubiertas por
                    el precio base. Cualquier porción por encima cobrará su precio extra.
                  </p>
                </FormField>
              )}
            </div>
          </div>

          <div className="shrink-0 p-4 md:p-6 bg-white border-t border-gray-100 flex flex-col sm:flex-row gap-3 mt-auto">
            <SecondaryButton
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto cursor-pointer"
            >
              Cancelar
            </SecondaryButton>
            <PrimaryButton type="submit" className="w-full sm:w-auto sm:ml-auto cursor-pointer">
              Guardar Grupo
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
