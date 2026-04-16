import { useState, useEffect, useMemo } from 'react';
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
  '🌱', '🥦', '🥑', '🌾', '🥛', '🥚', '🦐', '🐟', '🥩', '🥜', 
  '🌽', '🍎', '🍓', '🌶️', '🍯', '🍞', '🧀', '🍗', '🍷', '🍺'
];

const SUGGESTED_DIETS = [
  { name: 'Vegano', emoji: '🌱', type: 'diet' },
  { name: 'Vegetariano', emoji: '🥦', type: 'diet' },
  { name: 'Keto', emoji: '🥑', type: 'diet' },
  { name: 'Sin Gluten', emoji: '🌾', type: 'diet' },
  { name: 'Sin Lactosa', emoji: '🥛', type: 'diet' },
  { name: 'Plant-Based', emoji: '🌿', type: 'diet' },
  { name: 'Low Carb', emoji: '🥩', type: 'diet' },
];

export default function AdminAllergens() {
  const { activeBrand } = useAuth();
  const [allergens, setAllergens] = useState([]);
  const [loadingAllergens, setLoadingAllergens] = useState(false);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAllergen, setEditingAllergen] = useState(null);
  const [allergenForm, setAllergenForm] = useState({ name: '', emoji: '', type: 'allergen' });
  const [isSubmittingAllergen, setIsSubmittingAllergen] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);

  useEffect(() => {
    fetchAllergens();
  }, [activeBrand]);

  const fetchAllergens = async () => {
    if (!activeBrand) return;
    setLoadingAllergens(true);
    try {
      const { data, error } = await supabase
        .from('allergens')
        .select('*')
        .eq('brand_id', activeBrand.id)
        .order('name');
      if (error) throw error;
      setAllergens(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar etiquetas');
    } finally {
      setLoadingAllergens(false);
    }
  };

  const dietList = useMemo(() => allergens.filter(a => a.type === 'diet'), [allergens]);
  const allergenList = useMemo(() => allergens.filter(a => a.type !== 'diet'), [allergens]);

  const openCreate = (type = 'allergen') => {
    setEditingAllergen(null);
    setAllergenForm({ name: '', emoji: type === 'diet' ? '🌱' : '🥛', type });
    setIsFormOpen(true);
  };

  const openEdit = (allergen) => {
    setEditingAllergen(allergen);
    setAllergenForm({ 
      name: allergen.name, 
      emoji: allergen.emoji, 
      type: allergen.type || 'allergen' 
    });
    setIsFormOpen(true);
  };

  const handleQuickAdd = async (suggestion) => {
    if (!activeBrand) return;
    const exists = allergens.find(a => a.name.toLowerCase() === suggestion.name.toLowerCase());
    if (exists) return toast.error(`La etiqueta "${suggestion.name}" ya existe`);

    setIsSubmittingAllergen(true);
    try {
      const { error } = await supabase
        .from('allergens')
        .insert([{ 
          name: suggestion.name, 
          emoji: suggestion.emoji,
          type: suggestion.type,
          brand_id: activeBrand.id 
        }]);
      if (error) throw error;
      toast.success(`${suggestion.name} añadido`);
      fetchAllergens();
    } catch (err) {
      console.error(err);
      toast.error('Error al añadir sugerencia');
    } finally {
      setIsSubmittingAllergen(false);
    }
  };

  const handleSaveAllergen = async (e) => {
    if (e) e.preventDefault();
    if (!allergenForm.name || !allergenForm.emoji) return toast.error('Rellena todos los campos');

    setIsSubmittingAllergen(true);
    try {
      if (editingAllergen) {
        const { error } = await supabase
          .from('allergens')
          .update({ 
            name: allergenForm.name, 
            emoji: allergenForm.emoji, 
            type: allergenForm.type,
            updated_at: new Date() 
          })
          .eq('id', editingAllergen.id);
        if (error) throw error;
        toast.success('Etiqueta actualizada');
      } else {
        const { error } = await supabase
          .from('allergens')
          .insert([{ 
            name: allergenForm.name, 
            emoji: allergenForm.emoji,
            type: allergenForm.type,
            brand_id: activeBrand.id 
          }]);
        if (error) throw error;
        toast.success('Etiqueta creada');
      }
      setIsFormOpen(false);
      setEditingAllergen(null);
      fetchAllergens();
    } catch (err) {
      console.error(err);
      toast.error('Error guardando etiqueta');
    } finally {
      setIsSubmittingAllergen(false);
    }
  };

  const handleDeleteAllergen = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta etiqueta?')) return;
    try {
      const { error } = await supabase.from('allergens').delete().eq('id', id);
      if (error) throw error;
      toast.success('Eliminado correctamente');
      fetchAllergens();
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar');
    }
  };

  const TagGrid = ({ items, title, icon, colorClass, emptyMsg }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-2">
        <Icon icon={icon} className={`text-xl ${colorClass}`} />
        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">{title}</h3>
        <span className="ml-auto bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>
      
      {items.length === 0 ? (
        <div className="h-32 flex flex-col items-center justify-center bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100">
          <p className="text-gray-400 text-xs font-medium">{emptyMsg}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {items.map((item, idx) => (
            <div 
              key={item.id} 
              className={`group relative bg-white rounded-[1.5rem] p-4 border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden ${
                item.type === 'diet' ? 'hover:border-emerald-100' : 'hover:border-amber-100'
              }`}
            >
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity ${
                item.type === 'diet' ? 'bg-emerald-50' : 'bg-amber-50'
              }`} />

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-gray-50 rounded-[1.2rem] flex items-center justify-center mb-3 border border-gray-100 group-hover:scale-110 transition-all duration-500 shadow-inner">
                  <span className="text-3xl drop-shadow-sm">{item.emoji}</span>
                </div>
                
                <h4 className="text-[13px] font-black text-gray-900 tracking-tight mb-4 line-clamp-1">
                  {item.name}
                </h4>

                <div className="flex items-center gap-1.5 w-full">
                  <button 
                    onClick={() => openEdit(item)}
                    className="flex-1 px-2 py-1.5 bg-gray-50 text-blue-600 rounded-lg text-[10px] font-black hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                  >
                    Ver
                  </button>
                  <button 
                    onClick={() => handleDeleteAllergen(item.id)}
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
    </div>
  );

  if (loadingAllergens) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">Cargando…</div>
  );

  return (
    <div className="space-y-10 pb-12">
      {/* Header & Quick Actions */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/60 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white shadow-xl shadow-gray-200/20 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-50 rounded-[1.5rem] flex items-center justify-center border border-amber-100/50 shadow-inner">
              <Icon icon="heroicons:sparkles" className="text-2xl text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 leading-tight tracking-tight">Dietas y Alérgenos</h3>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">Define etiquetas visuales para tus platos</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <SecondaryButton onClick={() => openCreate('diet')} className="flex-1 sm:flex-initial !py-3.5 !px-6 border-emerald-100 text-emerald-700 hover:bg-emerald-50">
              + Nueva Dieta
            </SecondaryButton>
            <PrimaryButton onClick={() => openCreate('allergen')} className="flex-1 sm:flex-initial !py-3.5 !px-6 shadow-xl shadow-[#2f4131]/20">
              + Nuevo Alérgeno
            </PrimaryButton>
          </div>
        </div>

        {/* Quick Suggestions Bar */}
        <div className="bg-white/40 p-4 rounded-[2rem] border border-white/60 overflow-hidden">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Sugerencias Rápidas</p>
          <div className="flex gap-3 overflow-x-auto pb-2 px-1 no-scrollbar">
            {SUGGESTED_DIETS.map((diet) => (
              <button
                key={diet.name}
                onClick={() => handleQuickAdd(diet)}
                className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 hover:-translate-y-0.5 transition-all whitespace-nowrap group"
              >
                <span className="text-xl group-hover:scale-125 transition-transform">{diet.emoji}</span>
                <span className="text-xs font-bold text-gray-700">{diet.name}</span>
                <Icon icon="heroicons:plus-small" className="text-gray-300 group-hover:text-emerald-500" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grouped Lists */}
      <div className="space-y-12 animate-in fade-in duration-1000">
        <TagGrid 
          items={dietList} 
          title="Dietas y Preferencias" 
          icon="heroicons:heart"
          colorClass="text-emerald-500"
          emptyMsg="No hay dietas configuradas aún."
        />
        
        <TagGrid 
          items={allergenList} 
          title="Alérgenos e Intolerancias" 
          icon="heroicons:exclamation-triangle"
          colorClass="text-amber-500"
          emptyMsg="No hay alérgenos configurados aún."
        />
      </div>

      {/* Side Drawer Container */}
      <Drawer
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingAllergen ? 'Editar Etiqueta' : 'Nueva Etiqueta'}
        subtitle="Configura el nombre, icono y categoría."
      >
        <div className="space-y-6">
          <BentoCard title="Categorización">
             <div className="flex p-1 bg-gray-50 rounded-2xl border border-gray-100">
                <button 
                  onClick={() => setAllergenForm({...allergenForm, type: 'diet'})}
                  className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${
                    allergenForm.type === 'diet' 
                    ? 'bg-white shadow-sm text-emerald-600 ring-1 ring-black/5' 
                    : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  DIETA
                </button>
                <button 
                  onClick={() => setAllergenForm({...allergenForm, type: 'allergen'})}
                  className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${
                    allergenForm.type === 'allergen' 
                    ? 'bg-white shadow-sm text-amber-600 ring-1 ring-black/5' 
                    : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  ALÉRGENO
                </button>
             </div>
          </BentoCard>

          <BentoCard title="Identidad">
            <FormField label="Nombre de la etiqueta">
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
                <div className={`text-5xl w-20 h-20 rounded-2xl flex items-center justify-center border-2 border-dashed transition-colors ${
                  allergenForm.type === 'diet' ? 'bg-emerald-50/30 border-emerald-100' : 'bg-amber-50/30 border-amber-100'
                }`}>
                  {allergenForm.emoji}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-black text-gray-900">Previsualización</p>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed">Este icono aparecerá junto a tus platos en la carta digital.</p>
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
                        ? (allergenForm.type === 'diet' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-amber-600 border-amber-600 text-white') + ' scale-110 shadow-xl' 
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
