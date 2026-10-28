import React, { useState, useRef } from 'react';
import { Icon } from '@iconify-icon/react';
import { X, Upload, Camera, Loader2, Sparkles, Plus, AlertCircle, Check } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { validateImageSize, compressAndWebp } from '../../utils/images';
import { useAdminModalBack } from '../../hooks/useAdminModalBack';
import { toast } from '../Toast';
import { slugify } from '../../utils/stock';

export default function QuickProductModal({
  product = null,
  categories = [],
  onSave,
  onCancel,
  onSwitchToAdvanced,
  onCategoryCreated
}) {
  const { activeBrand } = useAuth();
  const fileInputRef = useRef(null);

  // Intercept physical / browser "Back" button so it closes the modal instead of kicking user out of admin
  useAdminModalBack(true, onCancel);

  const [formData, setFormData] = useState({
    name: product?.name || '',
    price: product?.price !== undefined ? String(product.price) : '',
    category_id: product?.category_id || (categories.length > 0 ? categories[0].id : ''),
    description: product?.description || '',
    image_url: product?.image_url || '',
    is_active: product?.is_active ?? true,
    stock_status: product?.stock_status || 'in'
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Inline category creation state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateImageSize(file, toast, activeBrand?.plan_id)) return;

    setIsUploading(true);
    try {
      const compressedFile = await compressAndWebp(file, activeBrand?.plan_id);
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.webp`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(fileName, compressedFile, {
          cacheControl: '31536000',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('products').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
      toast.success('Imagen cargada correctamente');
    } catch (err) {
      console.error('Error subiendo imagen:', err);
      toast.error('No se pudo subir la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateCategory = async () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    if (!activeBrand?.id) {
      toast.error('No hay marca activa');
      return;
    }

    setIsCreatingCat(true);
    try {
      const slug = slugify(trimmed) || `cat-${Date.now()}`;
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          brand_id: activeBrand.id,
          name: trimmed,
          slug,
          sort_order: categories.length,
          is_active: true,
          icon: '🍽️'
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success(`Categoría "${trimmed}" creada`);
      if (onCategoryCreated) onCategoryCreated(data);
      setFormData(prev => ({ ...prev, category_id: data.id }));
      setNewCatName('');
      setIsAddingCategory(false);
    } catch (err) {
      console.error('Error creando categoría:', err);
      toast.error('No se pudo crear la categoría');
    } finally {
      setIsCreatingCat(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Por favor escribe el nombre del producto');
      return;
    }

    const priceNum = parseFloat(String(formData.price).replace(/[^0-9.]/g, ''));
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('Por favor ingresa un precio válido');
      return;
    }

    if (!formData.category_id) {
      toast.error('Por favor selecciona o crea una categoría');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        price: priceNum,
        category_id: formData.category_id,
        description: formData.description.trim(),
        image_url: formData.image_url,
        is_active: formData.is_active,
        stock_status: formData.stock_status,
        requires_kitchen: product?.requires_kitchen ?? true,
        station: product?.station || 'kitchen'
      };

      await onSave(payload);
    } catch (err) {
      console.error('Error guardando producto:', err);
      toast.error('Error al guardar el producto');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
              <Icon icon="solar:bag-heart-bold-duotone" className="text-lg" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900 leading-tight">
                {product ? 'Editar Producto' : 'Crear Producto'}
              </h2>
              <p className="text-[11px] font-semibold text-gray-400">
                Modo Rápido • 4 datos esenciales
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-gray-200/60 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-all cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          
          {/* 1. Foto del Producto */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              1. Foto del producto
            </label>
            <div className="flex items-center gap-3">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-dashed border-gray-200 hover:border-emerald-500 bg-gray-50 hover:bg-emerald-50/30 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all shrink-0 group relative"
              >
                {formData.image_url ? (
                  <>
                    <img 
                      src={formData.image_url} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                      Cambiar
                    </div>
                  </>
                ) : isUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-gray-400 group-hover:text-emerald-600 transition-colors mb-1" />
                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-emerald-700">Subir foto</span>
                  </>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-600 mb-1">
                  {formData.image_url ? 'Foto cargada con éxito' : 'Sube una foto clara y antojosa'}
                </p>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Desde tu galería o tómala directo con la cámara de tu celular. Se comprime automáticamente.
                </p>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="hidden" 
                />
              </div>
            </div>
          </div>

          {/* 2. Nombre */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              2. Nombre del producto *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej. Buñuelo Tradicional, Café con Leche, Empanada..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-gray-50/50 focus:bg-white transition-all"
            />
          </div>

          {/* 3. Precio */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              3. Precio de venta ($ COP) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">$</span>
              <input
                type="number"
                step="50"
                min="0"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="2500"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-base font-extrabold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-gray-50/50 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* 4. Categoría */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                4. Categoría en la carta *
              </label>
              {!isAddingCategory && (
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(true)}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} />
                  <span>+ Nueva categoría</span>
                </button>
              )}
            </div>

            {isAddingCategory ? (
              <div className="flex gap-2 items-center p-2 rounded-xl bg-emerald-50/60 border border-emerald-200 animate-in fade-in duration-150">
                <input
                  type="text"
                  autoFocus
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateCategory();
                    } else if (e.key === 'Escape') {
                      setIsAddingCategory(false);
                    }
                  }}
                  placeholder="Nombre de categoría (ej. Amasijos)"
                  className="flex-1 px-3 py-1.5 text-xs font-semibold bg-white border border-emerald-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  disabled={isCreatingCat || !newCatName.trim()}
                  onClick={handleCreateCategory}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isCreatingCat ? <Loader2 size={13} className="animate-spin" /> : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={() => { setIsAddingCategory(false); setNewCatName(''); }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-gray-50/50 focus:bg-white transition-all"
              >
                <option value="" disabled>Selecciona una categoría...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon || '🍽️'} {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Descripción (opcional) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Descripción breve <span className="text-gray-400 font-normal lowercase">(opcional)</span>
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Crujiente por fuera, suave por dentro, recién horneado..."
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-gray-50/50 focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Switch a Opciones Avanzadas */}
          {onSwitchToAdvanced && (
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-400 font-medium">
                ¿Necesitas escandallos, recetas o modificadores?
              </span>
              <button
                type="button"
                onClick={() => onSwitchToAdvanced(formData)}
                className="text-xs font-bold text-gray-700 hover:text-gray-950 underline flex items-center gap-1 cursor-pointer"
              >
                <Icon icon="solar:tuning-square-bold-duotone" className="text-sm text-emerald-600" />
                <span>Modo Avanzado Pro</span>
              </button>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Guardar Producto</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
