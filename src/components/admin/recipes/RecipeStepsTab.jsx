import React from 'react';
import { Icon } from '@iconify-icon/react';

export default function RecipeStepsTab({
  formData,
  setFormData,
  isGeneratingSteps,
  handleGenerateStepsAI,
  handleAddStep,
  draggedStepIndex,
  setDraggedStepIndex,
  handleUpdateStep,
  handleMoveStep,
  handleRemoveStep
}) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header de Paso a Paso */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
        <div>
          <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
            <Icon icon="heroicons:clipboard-document-list" className="text-base text-indigo-600" />
            Procedimiento Operativo Estandarizado (SOP)
          </h4>
          <p className="text-[11px] text-indigo-900/70 mt-0.5">
            Pasos numerados que el personal de cocina verá y tachará en pantalla durante el turno.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-white border border-indigo-200 rounded-lg px-2.5 py-1 shadow-2xs">
            <Icon icon="heroicons:clock" className="text-indigo-600 text-xs" />
            <span className="text-[11px] font-bold text-slate-700">Tiempo:</span>
            <input 
              type="number" 
              min="0"
              value={formData.prep_time_minutes} 
              onChange={e => setFormData(prev => ({ ...prev, prep_time_minutes: e.target.value }))}
              placeholder="Ej: 8" 
              className="w-12 h-6 px-1 text-center font-bold text-xs text-indigo-950 bg-indigo-50/40 border border-indigo-200 rounded outline-none focus:bg-white"
            />
            <span className="text-[11px] text-slate-500 font-medium">min</span>
          </div>

          <button
            type="button"
            onClick={handleGenerateStepsAI}
            disabled={isGeneratingSteps}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-2xs transition-all disabled:opacity-50"
          >
            <Icon icon={isGeneratingSteps ? "lucide:loader-2" : "heroicons:sparkles"} className={`text-xs ${isGeneratingSteps ? 'animate-spin' : ''}`} />
            <span>{isGeneratingSteps ? 'Generando...' : 'Sugerir con IA ✨'}</span>
          </button>

          <button
            type="button"
            onClick={handleAddStep}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-all"
          >
            <Icon icon="heroicons:plus" className="text-xs" />
            <span>+ Agregar Paso</span>
          </button>
        </div>
      </div>

      {/* Lista de Pasos con Drag & Drop */}
      {(formData.step_by_step || []).length > 0 ? (
        <div className="space-y-3">
          {(formData.step_by_step || []).map((step, idx) => (
            <div 
              key={idx} 
              draggable
              onDragStart={() => setDraggedStepIndex(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggedStepIndex === null || draggedStepIndex === idx) return;
                setFormData(prev => {
                  const list = [...(prev.step_by_step || [])];
                  const [removed] = list.splice(draggedStepIndex, 1);
                  list.splice(idx, 0, removed);
                  return {
                    ...prev,
                    step_by_step: list.map((s, i) => ({ ...s, step: i + 1 }))
                  };
                });
                setDraggedStepIndex(null);
              }}
              className={`p-4 bg-white border rounded-xl shadow-2xs transition-all space-y-2.5 ${
                draggedStepIndex === idx 
                  ? 'opacity-40 border-indigo-400 scale-[0.99]' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                    title="Arrastra para reordenar paso"
                  >
                    <Icon icon="heroicons:bars-3" className="text-base" />
                  </div>
                  <span className="w-6 h-6 rounded-md bg-indigo-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                    {step.step || idx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-800">Paso {step.step || idx + 1}</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Estación Selector */}
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-500 font-medium">Estación:</span>
                    <select
                      value={step.station || (formData.is_subrecipe ? 'Mise en Place' : 'Cocina')}
                      onChange={e => handleUpdateStep(idx, 'station', e.target.value)}
                      className="text-xs font-semibold px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-indigo-500"
                    >
                      <option value="Cocina">🍳 Cocina (General)</option>
                      <option value="Ensamble">🥗 Ensamble / Fríos</option>
                      <option value="Parrilla">🥩 Parrilla / Plancha</option>
                      <option value="Fritura">🍟 Fritura / Calientes</option>
                      <option value="Barra">🍸 Barra / Bebidas</option>
                      <option value="Mise en Place">🔪 Mise en Place (Pre-turno)</option>
                    </select>
                  </div>

                  {/* Mover y Borrar */}
                  <div className="flex items-center gap-0.5 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveStep(idx, -1)}
                      className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-all"
                      title="Subir paso"
                    >
                      <Icon icon="heroicons:chevron-up" className="text-xs" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === (formData.step_by_step.length - 1)}
                      onClick={() => handleMoveStep(idx, 1)}
                      className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-all"
                      title="Bajar paso"
                    >
                      <Icon icon="heroicons:chevron-down" className="text-xs" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveStep(idx)}
                    className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="Eliminar paso"
                  >
                    <Icon icon="heroicons:trash" className="text-sm" />
                  </button>
                </div>
              </div>

              <div>
                <input
                  type="text"
                  value={step.title || ''}
                  onChange={e => handleUpdateStep(idx, 'title', e.target.value)}
                  placeholder="Título corto del paso (Ej. Pesar arroz sushi y base de bowl)"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div>
                <textarea
                  value={step.desc || ''}
                  onChange={e => handleUpdateStep(idx, 'desc', e.target.value)}
                  placeholder="Instrucción detallada de preparación, gramaje exacto a verificar en gramera, temperatura o técnica..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddStep}
            className="w-full py-2.5 border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-xl text-xs font-bold text-indigo-700 flex items-center justify-center gap-1.5 transition-all"
          >
            <Icon icon="heroicons:plus" className="text-sm" />
            <span>+ Agregar Siguiente Paso</span>
          </button>
        </div>
      ) : (
        <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50 p-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-100/70 text-indigo-600 flex items-center justify-center mb-3">
            <Icon icon="heroicons:clipboard-document-list" className="text-2xl" />
          </div>
          <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Sin pasos operativos registrados aún</h5>
          <p className="text-xs text-slate-500 max-w-md mt-1 mb-4 leading-relaxed">
            Estandariza cómo se elabora este plato para que cualquier cocinero o auxiliar opere con la calidad exacta en su pantalla de producción.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAddStep}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all"
            >
              + Agregar Primer Paso
            </button>
            <button
              type="button"
              onClick={handleGenerateStepsAI}
              disabled={isGeneratingSteps}
              className="px-4 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold transition-all disabled:opacity-50"
            >
              {isGeneratingSteps ? 'Generando...' : '✨ Sugerir con IA'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
