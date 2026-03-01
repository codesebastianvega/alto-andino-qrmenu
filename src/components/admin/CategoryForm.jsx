import { useState, useEffect } from 'react';
import { Modal, ModalHeader, FormField, TextInput, PrimaryButton, SecondaryButton } from './ui';

export default function CategoryForm({ category, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '', slug: '', icon: '🍽️', sort_order: 0, is_active: true,
    banner_image_url: '', banner_title: '', banner_description: '', accent_color: '#2f4131'
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '', slug: category.slug || '', icon: category.icon || '🍽️',
        sort_order: category.sort_order || 0, is_active: category.is_active !== false,
        banner_image_url: category.banner_image_url || '', banner_title: category.banner_title || '',
        banner_description: category.banner_description || '', accent_color: category.accent_color || '#2f4131'
      });
    }
  }, [category]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, sort_order: parseInt(formData.sort_order) || 0 });
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
