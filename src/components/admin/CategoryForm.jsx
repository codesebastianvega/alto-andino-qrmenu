import { useState, useEffect } from 'react';
import { Modal, ModalHeader, FormField, TextInput, PrimaryButton, SecondaryButton } from './ui';

export default function CategoryForm({ category, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '', slug: '', icon: '🍽️', sort_order: 0, is_active: true,
    banner_image_url: '', banner_title: '', banner_description: '', accent_color: '#2f4131',
    available_from: '', available_to: '',
    visibility_config: { days: [0,1,2,3,4,5,6], subcategories: [], section_type: 'standard' }
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '', slug: category.slug || '', icon: category.icon || '🍽️',
        sort_order: category.sort_order || 0, is_active: category.is_active !== false,
        banner_image_url: category.banner_image_url || '', banner_title: category.banner_title || '',
        banner_description: category.banner_description || '', accent_color: category.accent_color || '#2f4131',
        available_from: category.available_from || '', available_to: category.available_to || '',
        visibility_config: category.visibility_config || { days: [0,1,2,3,4,5,6], subcategories: [], section_type: 'standard' }
      });
    }
  }, [category]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSave = { ...formData, sort_order: parseInt(formData.sort_order) || 0 };
    // Convert empty strings to null for time fields so Postgres doesn't complain
    if (!dataToSave.available_from) dataToSave.available_from = null;
    if (!dataToSave.available_to) dataToSave.available_to = null;
    
    onSave(dataToSave);
  };

  const toggleDay = (dayIndex) => {
    setFormData(prev => {
      const days = prev.visibility_config?.days || [0,1,2,3,4,5,6];
      const newDays = days.includes(dayIndex) 
        ? days.filter(d => d !== dayIndex) 
        : [...days, dayIndex].sort();
      return {
        ...prev,
        visibility_config: { ...prev.visibility_config, days: newDays }
      };
    });
  };

  const handleAddSubManual = (value) => {
    if (!value) return;
    const currentSubs = formData.visibility_config?.subcategories || [];
    if (currentSubs.includes(value)) return;
    
    setFormData(prev => ({
      ...prev,
      visibility_config: {
        ...prev.visibility_config,
        subcategories: [...currentSubs, value]
      }
    }));
  };

  const addSubcategory = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubManual(e.target.value.trim());
      e.target.value = '';
    }
  };

  const removeSubcategory = (sub) => {
    setFormData(prev => ({
      ...prev,
      visibility_config: {
        ...prev.visibility_config,
        subcategories: prev.visibility_config.subcategories.filter(s => s !== sub)
      }
    }));
  };

  return (
    <Modal onClose={onCancel} wide>
      <ModalHeader
        title={category ? 'Editar categoría' : 'Nueva categoría'}
        subtitle="Personaliza la apariencia de esta sección en el menú."
        onClose={onCancel}
      />

      <form onSubmit={handleSubmit}>
        <div className="px-7 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Left: Basic info */}
          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 pb-1 border-b border-gray-100">
              Información básica
            </p>
            <FormField label="Nombre">
              <TextInput required name="name" value={formData.name} onChange={handleChange} placeholder="Ej. Desayunos" />
            </FormField>
            <FormField label="Slug (identificador)">
              <TextInput required name="slug" value={formData.slug} onChange={handleChange} placeholder="Ej. desayunos" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Ícono">
                <TextInput name="icon" value={formData.icon} onChange={handleChange} placeholder="🍽️" className="text-center text-xl" />
              </FormField>
              <FormField label="Orden">
                <TextInput type="number" name="sort_order" value={formData.sort_order} onChange={handleChange} />
              </FormField>
            </div>
            
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 pb-1 border-b border-gray-100 mt-6">
              Horario y Días de Disponibilidad
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Hora Inicio">
                <TextInput type="time" name="available_from" value={formData.available_from} onChange={handleChange} />
              </FormField>
              <FormField label="Hora Fin">
                <TextInput type="time" name="available_to" value={formData.available_to} onChange={handleChange} />
              </FormField>
            </div>
            <div className="space-y-2 mt-2">
              <p className="text-[11px] font-medium text-gray-500">Días activos</p>
              <div className="flex flex-wrap gap-1.5">
                {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day, i) => {
                  const isActive = formData.visibility_config?.days?.includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all ${
                        isActive ? 'bg-[#2f4131] text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Visual */}
          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 pb-1 border-b border-gray-100">
              Personalización visual
            </p>
            <FormField label="URL imagen de banner">
              <TextInput name="banner_image_url" value={formData.banner_image_url} onChange={handleChange} placeholder="https://…" />
            </FormField>
            <FormField label="Título del banner">
              <TextInput name="banner_title" value={formData.banner_title} onChange={handleChange} placeholder="Ej. Combos Especiales" />
            </FormField>
            <FormField label="Descripción del banner">
              <textarea name="banner_description" value={formData.banner_description} onChange={handleChange} rows={2}
                placeholder="Texto llamativo para el banner…"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#2f4131] outline-none resize-none" />
            </FormField>
            <FormField label="Color de acento">
              <div className="flex gap-2 items-center">
                <input type="color" name="accent_color" value={formData.accent_color} onChange={handleChange}
                  className="w-10 h-10 rounded-lg border-none cursor-pointer" />
                <TextInput name="accent_color" value={formData.accent_color} onChange={handleChange} />
              </div>
            </FormField>

            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 pb-1 border-b border-gray-100 mt-6">
              Organización Interna
            </p>
            <FormField label="Subcategorías (una por línea)">
              <div className="space-y-4">
                <textarea
                  value={formData.visibility_config?.subcategories?.join('\n') || ''}
                  onChange={(e) => {
                    const subs = e.target.value.split('\n').map(s => s.trim()).filter(Boolean);
                    setFormData({
                      ...formData,
                      visibility_config: { ...formData.visibility_config, subcategories: subs }
                    });
                  }}
                  placeholder="Ej:&#10;Clásicos&#10;Especiales&#10;Premium"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#7db87a]/30 transition-all min-h-[120px] outline-none"
                />
                
                <div className="flex flex-wrap gap-2">
                  {formData.visibility_config?.subcategories?.map(sub => (
                    <span key={sub} className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 text-violet-700 rounded-xl text-[11px] font-bold border border-violet-100">
                      {sub}
                      <button type="button" onClick={() => removeSubcategory(sub)} className="hover:text-violet-900 ml-1 opacity-60 hover:opacity-100">
                        <Icon icon="heroicons:x-mark" className="text-xs" />
                      </button>
                    </span>
                  ))}
                  {(!formData.visibility_config?.subcategories || formData.visibility_config.subcategories.length === 0) && (
                    <p className="text-[11px] text-gray-400 italic px-2">Escribe las subcategorías arriba para organizarlas.</p>
                  )}
                </div>
              </div>
            </FormField>
            <FormField label="Tipo de sección">
              <select 
                name="section_type" 
                value={formData.visibility_config?.section_type || 'standard'}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  visibility_config: { ...prev.visibility_config, section_type: e.target.value }
                }))}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#2f4131] outline-none"
              >
                <option value="standard">Estándar (Lista)</option>
                <option value="simple-list">Lista Compacta (Bebidas)</option>
                <option value="smoothies">Especial: Smoothies & Funcionales</option>
                <option value="grid">Cuadrícula (2 columnas)</option>
                <option value="wide-grid">Cuadrícula Amplia (Fotos grandes)</option>
              </select>
            </FormField> 
          </div>

          {/* Active toggle */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <p className="text-sm font-semibold text-gray-700">Categoría activa</p>
                <p className="text-[12px] text-gray-400 font-medium mt-0.5">Si se desactiva, no aparecerá en el menú público.</p>
              </div>
              <button type="button" onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                className={`w-10 h-5 rounded-full relative transition-all ${formData.is_active ? 'bg-[#2f4131]' : 'bg-gray-300'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${formData.is_active ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="px-7 py-5 border-t border-gray-100 flex gap-3">
          <SecondaryButton type="button" onClick={onCancel} className="flex-1">Cancelar</SecondaryButton>
          <PrimaryButton type="submit" className="flex-[2]">{category ? 'Guardar cambios' : 'Crear categoría'}</PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
