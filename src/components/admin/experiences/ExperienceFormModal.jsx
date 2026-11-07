import React from 'react';
import { Icon } from '@iconify-icon/react';
import { Loader2 } from 'lucide-react';
import { TYPE_LABELS } from '../../../hooks/experiences/useAdminExperiencesData';

export default function ExperienceFormModal({
  isOpen,
  isEditing,
  form,
  setForm,
  saving,
  includeInput,
  setIncludeInput,
  onAddInclude,
  onRemoveInclude,
  stepInput,
  setStepInput,
  onAddStep,
  onRemoveStep,
  uploadingImage,
  onUploadImage,
  dateInput,
  setDateInput,
  onAddDate,
  onRemoveDate,
  onSubmit,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-[2rem] p-6 max-w-lg w-full shadow-2xl my-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-gray-900">
            {isEditing ? 'Editar' : 'Nueva'} Experiencia
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 cursor-pointer"
          >
            <Icon icon="heroicons:x-mark" className="text-2xl" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
              Título
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#7db87a]/30 font-medium text-gray-700"
            />
          </div>

          {/* Short description */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
              Descripción Corta
            </label>
            <input
              type="text"
              value={form.short_description}
              onChange={(e) => setForm({ ...form, short_description: e.target.value })}
              placeholder="Una línea para la tarjeta"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#7db87a]/30 font-medium text-gray-700"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
              Descripción Completa
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#7db87a]/30 font-medium text-gray-700 resize-none"
            />
          </div>

          {/* Type + Price row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                Tipo
              </label>
              <select
                value={form.type}
                onChange={(e) => {
                  const newType = e.target.value;
                  const autoPrivate = ['private', 'omakase', 'catering'].includes(newType);
                  setForm((f) => ({
                    ...f,
                    type: newType,
                    is_private_booking: autoPrivate ? true : f.is_private_booking,
                  }));
                }}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#7db87a]/30 font-medium text-gray-700"
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                Precio (COP)
              </label>
              <input
                type="number"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#7db87a]/30 font-medium text-gray-700"
              />
            </div>
          </div>

          {/* Capacity + Duration row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                Capacidad
              </label>
              <input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#7db87a]/30 font-medium text-gray-700"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                Duración (min)
              </label>
              <input
                type="number"
                min={15}
                step={15}
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#7db87a]/30 font-medium text-gray-700"
              />
            </div>
          </div>

          {/* Location + Image Upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                Ubicación
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Ej: Terraza 2do piso / A domicilio"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#7db87a]/30 font-medium text-gray-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                Imagen de la Experiencia
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="URL o sube un archivo..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#7db87a]/30 font-medium text-gray-700 text-xs min-w-0"
                />

                <label className="flex items-center gap-1.5 bg-[#4a6741] hover:bg-[#3b5334] text-white px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0 shadow-sm">
                  {uploadingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icon icon="heroicons:arrow-up-tray" className="text-base" />
                  )}
                  <span>{uploadingImage ? 'Subiendo...' : 'Subir Imagen'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onUploadImage}
                    disabled={uploadingImage}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Image Preview Thumbnail */}
          {form.image_url && (
            <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-gray-200 bg-gray-900 group shadow-inner">
              <img
                src={form.image_url}
                alt="Vista previa"
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-between p-3">
                <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-emerald-600/80 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Icon icon="heroicons:sparkles" /> WebP Optimizado
                </span>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, image_url: '' })}
                  className="text-white/80 hover:text-red-400 text-xs font-bold bg-black/50 hover:bg-black/80 px-2 py-1 rounded-lg backdrop-blur-md transition-colors cursor-pointer"
                >
                  Remover
                </button>
              </div>
            </div>
          )}

          {/* Includes */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
              ¿Qué Incluye?
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={includeInput}
                onChange={(e) => setIncludeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAddInclude();
                  }
                }}
                placeholder="Ej: Copa de bienvenida"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-[#7db87a]/30 font-medium text-gray-700 text-sm"
              />
              <button
                type="button"
                onClick={onAddInclude}
                className="bg-[#7db87a] text-white px-3.5 rounded-xl font-bold text-sm hover:bg-[#6aa669] cursor-pointer"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.includes.map((item, i) => (
                <span
                  key={i}
                  className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-emerald-100"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => onRemoveInclude(i)}
                    className="text-emerald-400 hover:text-red-500 text-sm font-bold cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Pasos / Menú Degustación Paso a Paso */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Icon icon="heroicons:list-bullet" className="text-[#4a6741] text-base" />
                Pasos / Menú Degustación (Paso por Paso)
              </label>
              <span className="text-[10px] font-bold uppercase bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-full">
                {(form.steps || []).length} Pasos Creados
              </span>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={stepInput.title}
                onChange={(e) => setStepInput({ ...stepInput, title: e.target.value })}
                placeholder="Título del paso (ej: Paso 1: Esferificación de Maracuyá & Sake)"
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-[#7db87a]/30 font-medium text-gray-800"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={stepInput.description}
                  onChange={(e) => setStepInput({ ...stepInput, description: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onAddStep();
                    }
                  }}
                  placeholder="Detalle del paso (ej: Esfera translúcida en cuchara de cerámica...)"
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-[#7db87a]/30 font-medium text-gray-800"
                />
                <button
                  type="button"
                  onClick={onAddStep}
                  className="bg-[#4a6741] text-white px-3.5 rounded-xl font-bold text-xs hover:bg-[#3b5334] transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <span>+ Agregar Paso</span>
                </button>
              </div>
            </div>

            {/* Renders Added Steps */}
            <div className="space-y-2 pt-1 max-h-48 overflow-y-auto pr-1">
              {(form.steps || []).map((st, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-xs gap-3"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="bg-[#4a6741]/10 text-[#4a6741] text-[10px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 mt-0.5">
                      Paso {i + 1}
                    </span>
                    <div>
                      <p className="font-bold text-gray-900">{st.title}</p>
                      {st.description && (
                        <p className="text-gray-500 text-[11px] mt-0.5 leading-relaxed">
                          {st.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveStep(i)}
                    className="text-gray-400 hover:text-red-500 p-1 text-base leading-none transition-colors cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Mode Selector */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <Icon icon="heroicons:sparkles" className="text-amber-600 text-base" />
                Modalidad de Agenda
              </label>
              <span className="text-[10px] font-bold uppercase bg-amber-200/60 text-amber-900 px-2.5 py-0.5 rounded-full">
                {form.is_private_booking ? 'Bajo Reserva Privada' : 'Evento con Fecha Fija'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setForm({ ...form, is_private_booking: true })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  form.is_private_booking
                    ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-400/30'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="font-extrabold text-xs sm:text-sm mb-0.5">🥂 Reserva Privada</div>
                <div className="text-[10px] opacity-90 font-medium">
                  Cotización / Fecha flexible por WhatsApp o IA.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, is_private_booking: false })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  !form.is_private_booking
                    ? 'bg-[#4a6741] text-white border-[#4a6741] shadow-md ring-2 ring-[#4a6741]/30'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="font-extrabold text-xs sm:text-sm mb-0.5">📅 Fecha Fija</div>
                <div className="text-[10px] opacity-90 font-medium">
                  Día y hora programada en calendario público.
                </div>
              </button>
            </div>
          </div>

          {/* Dates or Private Info */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
              {form.is_private_booking ? 'Programación de Fechas (Opcional)' : 'Fechas Programadas'}
            </label>

            {form.is_private_booking && (
              <div className="mb-3 bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 text-xs text-emerald-800 font-medium flex items-center gap-2">
                <Icon
                  icon="heroicons:check-circle"
                  className="text-emerald-600 text-lg shrink-0"
                />
                <span>
                  Experiencia en modalidad <strong>Reserva Privada</strong>. Los clientes solicitarán
                  su fecha de forma personalizada.
                </span>
              </div>
            )}

            <div className="flex gap-2 mb-2">
              <input
                type="date"
                value={dateInput.date}
                onChange={(e) => setDateInput({ ...dateInput, date: e.target.value })}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none font-medium text-gray-700 text-sm"
              />
              <input
                type="time"
                value={dateInput.start_time}
                onChange={(e) => setDateInput({ ...dateInput, start_time: e.target.value })}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none font-medium text-gray-700 text-sm w-28"
              />
              <input
                type="time"
                value={dateInput.end_time}
                onChange={(e) => setDateInput({ ...dateInput, end_time: e.target.value })}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none font-medium text-gray-700 text-sm w-28"
              />
              <button
                type="button"
                onClick={onAddDate}
                className="bg-[#7db87a] text-white px-3 rounded-xl font-bold text-sm hover:bg-[#6aa669] cursor-pointer"
              >
                +
              </button>
            </div>
            <div className="space-y-1">
              {form.dates.map((d, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-xl text-sm"
                >
                  <span className="font-medium text-gray-700">
                    <Icon icon="heroicons:calendar" className="mr-1 text-[#7db87a]" />
                    {d.date} · {d.start_time} – {d.end_time}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveDate(i)}
                    className="text-gray-400 hover:text-red-500 text-lg cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#4a6741] text-white font-bold py-3 rounded-xl disabled:opacity-50 hover:bg-[#3d5536] transition-colors cursor-pointer"
            >
              {saving ? 'Guardando...' : 'Guardar Experiencia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
