import { useState, useEffect } from 'react';

export default function CategoryForm({ category, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: '🍽️',
    sort_order: 0,
    is_active: true,
    banner_image_url: '',
    banner_title: '',
    banner_description: '',
    accent_color: '#2f4131'
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        slug: category.slug || '',
        icon: category.icon || '🍽️',
        sort_order: category.sort_order || 0,
        is_active: category.is_active !== false,
        banner_image_url: category.banner_image_url || '',
        banner_title: category.banner_title || '',
        banner_description: category.banner_description || '',
        accent_color: category.accent_color || '#2f4131'
      });
    }
  }, [category]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      sort_order: parseInt(formData.sort_order) || 0
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[40px] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center px-10 py-8 border-b border-gray-100 bg-[#2f4131] text-white">
          <div>
            <h2 className="text-2xl font-black tracking-tight">
              {category ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>
            <p className="text-white/60 text-sm font-medium">Personaliza la apariencia de esta sección en el menú.</p>
          </div>
          <button onClick={onCancel} className="text-white/40 hover:text-white text-2xl transition-all">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Información Básica</h3>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Nombre</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-[#2f4131]"
                  placeholder="Ej: Desayunos"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Slug (Identificador único)</label>
                <input
                  type="text"
                  name="slug"
                  required
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-[#2f4131]"
                  placeholder="Ej: desayunos"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Icono</label>
                  <input
                    type="text"
                    name="icon"
                    value={formData.icon}
                    onChange={handleChange}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-[#2f4131] text-center text-xl"
                    placeholder="🍽️"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Orden</label>
                  <input
                    type="number"
                    name="sort_order"
                    value={formData.sort_order}
                    onChange={handleChange}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-[#2f4131]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Personalización Visual</h3>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">URL Imagen de Banner</label>
                <input
                  type="text"
                  name="banner_image_url"
                  value={formData.banner_image_url}
                  onChange={handleChange}
                  className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-[#2f4131]"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Título del Banner</label>
                <input
                  type="text"
                  name="banner_title"
                  value={formData.banner_title}
                  onChange={handleChange}
                  className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-[#2f4131]"
                  placeholder="Ej: Combos Especiales"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Descripción del Banner</label>
                <textarea
                  name="banner_description"
                  rows="2"
                  value={formData.banner_description}
                  onChange={handleChange}
                  className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-[#2f4131] resize-none"
                  placeholder="Texto llamativo para el banner..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Color de Acento</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    name="accent_color"
                    value={formData.accent_color}
                    onChange={handleChange}
                    className="w-12 h-12 rounded-xl border-none cursor-pointer"
                  />
                  <input
                    type="text"
                    name="accent_color"
                    value={formData.accent_color}
                    onChange={handleChange}
                    className="flex-1 px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-[#2f4131]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 py-4 bg-gray-50 p-6 rounded-3xl">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-6 h-6 text-[#2f4131] focus:ring-[#2f4131] border-gray-300 rounded-lg"
            />
            <div>
              <label htmlFor="is_active" className="block text-sm font-black text-gray-900">
                Categoría Activa
              </label>
              <p className="text-[10px] text-gray-500 font-medium">Si se desactiva, no aparecerá en el menú público.</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              {category ? 'Guardar Cambios' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
