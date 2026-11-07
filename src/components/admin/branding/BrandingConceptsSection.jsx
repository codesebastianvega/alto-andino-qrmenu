import React from 'react';
import { FormField, TextInput, ImageGuidance } from '../ui';
import { Icon } from '@iconify/react';
import { getMaxImageSizeMB } from '../../../utils/images';

export default function BrandingConceptsSection({
  concepts = [],
  onAddConcept,
  onRemoveConcept,
  onUpdateConcept,
  activeBrand,
}) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
      <div className="p-6 sm:p-7">
        <div className="flex items-center justify-between mb-6 pb-5 border-b border-gray-100">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100/60">
              <Icon icon="solar:star-rainbow-bold" className="text-xl" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                Conceptos de Marca
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Sub-marcas o líneas de negocio (ej: Delicattesen)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onAddConcept}
            className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-100 transition-all border border-amber-200/60 cursor-pointer"
          >
            <Icon icon="solar:add-circle-bold" className="text-base" />
            <span>Nuevo Concepto</span>
          </button>
        </div>

        <div className="space-y-4">
          {concepts.length === 0 ? (
            <div className="py-12 px-6 border-2 border-dashed border-gray-100 rounded-2xl text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon
                  icon="solar:box-minimalistic-linear"
                  width="32"
                  className="text-gray-200"
                />
              </div>
              <p className="text-sm font-medium text-gray-400">No hay conceptos creados.</p>
              <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-widest font-bold">
                Empieza añadiendo uno para tu marca
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {concepts.map((concept) => (
                <div
                  key={concept.id}
                  className="p-5 bg-gray-50/60 rounded-xl border border-gray-200/80 relative group animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <button
                    type="button"
                    onClick={() => onRemoveConcept(concept.id)}
                    className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                  >
                    <Icon icon="solar:trash-bin-trash-bold" width="20" />
                  </button>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <FormField label="Nombre del Concepto">
                        <TextInput
                          value={concept.name}
                          onChange={(e) => onUpdateConcept(concept.id, 'name', e.target.value)}
                          placeholder="Ej: Delicattesen"
                        />
                      </FormField>
                      <FormField label="Descripción corta">
                        <TextInput
                          value={concept.description}
                          onChange={(e) =>
                            onUpdateConcept(concept.id, 'description', e.target.value)
                          }
                          placeholder="Línea de productos premium..."
                        />
                      </FormField>
                    </div>
                    <div className="space-y-4">
                      <FormField label="Color de Acento">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl border border-gray-200 shadow-inner shrink-0"
                            style={{ backgroundColor: concept.accent_color }}
                          />
                          <TextInput
                            value={concept.accent_color}
                            onChange={(e) =>
                              onUpdateConcept(concept.id, 'accent_color', e.target.value)
                            }
                            placeholder="#HEX"
                          />
                        </div>
                      </FormField>
                      <FormField label="URL de Imagen / Logo">
                        <TextInput
                          value={concept.image_url}
                          onChange={(e) =>
                            onUpdateConcept(concept.id, 'image_url', e.target.value)
                          }
                          placeholder="https://..."
                        />
                        <ImageGuidance maxMB={getMaxImageSizeMB(activeBrand?.plan_id)} />
                      </FormField>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
