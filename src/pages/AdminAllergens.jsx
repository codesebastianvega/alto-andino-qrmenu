import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { toast as toastFn } from '../components/Toast';
import {
  Drawer, FormField, TextInput, PrimaryButton, SecondaryButton, BentoCard
} from '../components/admin/ui';
import { Icon } from '@iconify-icon/react';
import EmojiPicker from 'emoji-picker-react';

const toast = {
  success: (msg, opts) => toastFn.success(msg, { duration: 2500, ...opts }),
  error: (msg, opts) => toastFn.error(msg, { duration: 4000, ...opts }),
};

const CURATED_EMOJIS = [
  '🌱', '🥜', '🌾', '🥛', '🥚', '🦐', '🐟', '🥩', '🥦', '🌽', 
  '🍎', '🍓', '🌶️', '🍯', '🍞', '🧀', '🍗', '🍷', '🍺', '🍹'
];

export default function AdminAllergens() {
  const { activeBrand } = useAuth();
  const [allergens, setAllergens] = useState([]);
  const [loadingAllergens, setLoadingAllergens] = useState(false);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAllergen, setEditingAllergen] = useState(null);
  const [allergenForm, setAllergenForm] = useState({ name: '', emoji: '' });
  const [isSubmittingAllergen, setIsSubmittingAllergen] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);

  useEffect(() => {
    fetchAllergens();
  }, []);

  const fetchAllergens = async () => {
    setLoadingAllergens(true);
    try {
      if (!activeBrand) return;
      const { data, error } = await supabase
        .from('allergens')
        .select('*')
        .eq('brand_id', activeBrand.id)
        .order('name');
      if (error) throw error;
      setAllergens(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar alérgenos');
    } finally {
      setLoadingAllergens(false);
    }
  };

  const openCreate = () => {
    setEditingAllergen(null);
    setAllergenForm({ name: '', emoji: '🌱' });
    setIsFormOpen(true);
  };

  const openEdit = (allergen) => {
    setEditingAllergen(allergen);
    setAllergenForm({ name: allergen.name, emoji: allergen.emoji });
    setIsFormOpen(true);
  };

  const handleSaveAllergen = async (e) => {
    if (e) e.preventDefault();
    if (!allergenForm.name || !allergenForm.emoji) return toast.error('Rellena todos los campos');

    setIsSubmittingAllergen(true);
    try {
      if (editingAllergen) {
        const { error } = await supabase
          .from('allergens')
          .update({ name: allergenForm.name, emoji: allergenForm.emoji, updated_at: new Date() })
          .eq('id', editingAllergen.id);
        if (error) throw error;
        toast.success('Alérgeno actualizado');
      } else {
        const { error } = await supabase
          .from('allergens')
          .insert([{ 
            name: allergenForm.name, 
            emoji: allergenForm.emoji,
            brand_id: activeBrand.id 
          }]);
        if (error) throw error;
        toast.success('Alérgeno creado');
      }
      setIsFormOpen(false);
      setEditingAllergen(null);
      fetchAllergens();
    } catch (err) {
      console.error(err);
      toast.error('Error guardando alérgeno');
    } finally {
      setIsSubmittingAllergen(false);
    }
  };

  const handleDeleteAllergen = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este alérgeno?')) return;
    try {
      const { error } = await supabase.from('allergens').delete().eq('id', id);
      if (error) throw error;
      toast.success('Alérgeno eliminado');
      fetchAllergens();
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar');
    }
  };

  if (loadingAllergens) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">Cargando…</div>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header Bar — Premium Glass */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/60 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white shadow-xl shadow-gray-200/20 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-50 rounded-[1.5rem] flex items-center justify-center border border-amber-100/50 shadow-inner">
            <Icon icon="heroicons:tag" className="text-2xl text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 leading-tight tracking-tight">Dietas y Alérgenos</h3>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">Gestión visual de etiquetas para tus platos</p>
          </div>
        </div>
        <PrimaryButton onClick={openCreate} className="w-full sm:w-auto !px-8 !py-3.5 shadow-2xl shadow-[#2f4131]/20 hover:scale-[1.02] active:scale-[0.98]">
          <Icon icon="heroicons:plus-circle" className="inline mr-2 text-lg" />
          Nueva Etiqueta
        </PrimaryButton>
      </div>

      {/* Grid view — Bento Style */}
      {allergens.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-200 animate-in fade-in duration-700">
           <div className="p-6 bg-white rounded-[2rem] shadow-sm mb-6">
              <Icon icon="heroicons:archive-box" className="text-5xl text-gray-200" />
           </div>
           <p className="text-gray-400 font-bold text-lg">No hay etiquetas aún</p>
           <p className="text-gray-400 text-sm mt-1">Crea tu primera dieta o alérgeno para empezar.</p>
           <button onClick={openCreate} className="mt-8 text-[#2f4131] font-black text-sm hover:underline">
             + Añadir etiqueta ahora
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {allergens.map((allergen, idx) => (
            <div 
              key={allergen.id} 
              className="group relative bg-white rounded-[1.5rem] p-4 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 hover:-translate-y-1 transition-all duration-500 overflow-hidden"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Decorative Glow */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/50 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-amber-100/50 transition-colors" />

              {/* Icon Container */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-gray-50 rounded-[1.2rem] flex items-center justify-center mb-3 border border-gray-100 group-hover:scale-110 transition-all duration-500 shadow-inner">
                  <span className="text-3xl drop-shadow-sm">{allergen.emoji}</span>
                </div>
                
                <h4 className="text-[13px] font-black text-gray-900 tracking-tight mb-4 line-clamp-1">
                  {allergen.name}
                </h4>

                {/* Actions Overlay */}
                <div className="flex items-center gap-1.5 w-full">
                  <button 
                    onClick={() => openEdit(allergen)}
                    className="flex-1 px-2 py-1.5 bg-gray-50 text-blue-600 rounded-lg text-[10px] font-black hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                  >
                    Ver
                  </button>
                  <button 
                    onClick={() => handleDeleteAllergen(allergen.id)}
                    className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Icon icon="heroicons:trash" className="text-base" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Side Drawer Container */}
      <Drawer
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingAllergen ? 'Editar Etiqueta' : 'Nueva Etiqueta'}
        subtitle="Personaliza el icono y nombre de la dieta."
      >
        <div className="space-y-6">
          <BentoCard title="Identidad">
            <FormField label="Nombre">
              <TextInput
                value={allergenForm.name}
                onChange={(e) => setAllergenForm({ ...allergenForm, name: e.target.value })}
                placeholder="Ej. Vegano, Sin Lactosa..."
                className="!bg-white"
              />
            </FormField>
          </BentoCard>

          <BentoCard title="Selección de Icono">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4 p-5 bg-white rounded-[1.8rem] border border-gray-100 shadow-inner">
                <div className="text-5xl w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200 animate-pulse">
                  {allergenForm.emoji}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-black text-gray-900">Previsualización</p>
                  <p className="text-[11px] text-gray-500 font-medium">Este es el icono que verán tus clientes.</p>
                </div>
              </div>

              {/* Curated Grid */}
              <div className="grid grid-cols-5 gap-3">
                {CURATED_EMOJIS.map(em => (
                  <button
                    key={em}
                    onClick={() => setAllergenForm({ ...allergenForm, emoji: em })}
                    className={`h-14 text-3xl flex items-center justify-center rounded-2xl border transition-all duration-300 ${
                      allergenForm.emoji === em 
                        ? 'bg-[#2f4131] border-[#2f4131] scale-110 shadow-xl shadow-[#2f4131]/20 !text-white' 
                        : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50 active:scale-95'
                    }`}
                  >
                    {em}
                  </button>
                ))}
                <button
                  onClick={() => setShowFullPicker(!showFullPicker)}
                  className={`h-14 flex items-center justify-center rounded-2xl border transition-all duration-300 ${
                    showFullPicker ? 'bg-amber-100 border-amber-200 ring-2 ring-amber-100' : 'bg-white border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <Icon icon="heroicons:face-smile" className={`text-2xl ${showFullPicker ? 'text-amber-600' : 'text-gray-400'}`} />
                </button>
              </div>

              {showFullPicker && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-4 duration-500">
                  <EmojiPicker 
                    onEmojiClick={(e) => {
                      setAllergenForm({...allergenForm, emoji: e.emoji});
                      setShowFullPicker(false);
                    }}
                    width="100%"
                    height={350}
                    previewConfig={{ showPreview: false }}
                    searchPlaceHolder="Buscar emoji..."
                  />
                </div>
              )}
            </div>
          </BentoCard>

          <div className="flex gap-4 pt-8">
            <SecondaryButton 
              onClick={() => setIsFormOpen(false)}
              className="flex-1 !py-4"
            >
              Cancelar
            </SecondaryButton>
            <PrimaryButton 
              onClick={handleSaveAllergen}
              disabled={isSubmittingAllergen}
              className="flex-1 !py-4"
            >
              {isSubmittingAllergen ? (
                <Icon icon="line-md:loading-twotone-loop" className="text-xl" />
              ) : editingAllergen ? 'Guardar Cambios' : 'Crear Etiqueta'}
            </PrimaryButton>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
