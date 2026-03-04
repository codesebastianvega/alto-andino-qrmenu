import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { toast as toastFn } from '../components/Toast';
import { PrimaryButton, FormField, TextInput } from '../components/admin/ui';
import { Icon } from '@iconify-icon/react';

const toast = {
  success: (msg) => toastFn(msg, { duration: 2000 }),
  error: (msg) => toastFn(msg, { duration: 3000 }),
};

export default function AdminLanding() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState({
    hero_images: [],
    featured_items: [],
    reviews: [],
    concierge_prompt_template: '',
    event_planner_prompt_template: ''
  });

  useEffect(() => {
    fetchHomeSettings();
  }, []);

  const fetchHomeSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('home_settings').select('*').limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setData(data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar ajustes de la landing');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from('home_settings')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);
      if (error) throw error;
      toast.success('Ajustes de landing guardados');
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar ajustes');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddItem = (key, defaultObj) => {
    setData({ ...data, [key]: [...(data[key] || []), defaultObj] });
  };

  const handleRemoveItem = (key, index) => {
    const newList = [...data[key]];
    newList.splice(index, 1);
    setData({ ...data, [key]: newList });
  };

  const handleChangeItem = (key, index, field, value) => {
    const newList = [...data[key]];
    newList[index] = { ...newList[index], [field]: value };
    setData({ ...data, [key]: newList });
  };

  if (loading) return <div className="p-8 text-center text-gray-400 font-medium">Cargando ajustes de landing...</div>;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* SECCIÓN HERO */}
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div>
            <h3 className="text-base font-black text-gray-900 uppercase tracking-tight italic">Platos Destacados (Hero)</h3>
            <p className="text-[12px] text-gray-500 mt-1 font-medium">Estos platos rotan en la portada principal.</p>
          </div>
          <button 
            onClick={() => handleAddItem('hero_images', { name: '', category: '', img: '', rating: '5.0', prepTime: '15 mins' })}
            className="flex items-center gap-2 px-4 py-2 bg-[#2f4131] text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all"
          >
            <Icon icon="heroicons:plus" /> Agregar Plato
          </button>
        </div>
        
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.hero_images?.map((item, idx) => (
            <div key={idx} className="relative p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4 group">
              <button 
                onClick={() => handleRemoveItem('hero_images', idx)}
                className="absolute top-4 right-4 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Icon icon="heroicons:trash" />
              </button>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Nombre">
                  <TextInput value={item.name} onChange={(e) => handleChangeItem('hero_images', idx, 'name', e.target.value)} placeholder="Ej. Poke Andino" />
                </FormField>
                <FormField label="Categoría">
                  <TextInput value={item.category} onChange={(e) => handleChangeItem('hero_images', idx, 'category', e.target.value)} placeholder="Pokes" />
                </FormField>
              </div>
              <FormField label="URL Imagen">
                <TextInput value={item.img} onChange={(e) => handleChangeItem('hero_images', idx, 'img', e.target.value)} placeholder="https://..." />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Rating">
                  <TextInput value={item.rating} onChange={(e) => handleChangeItem('hero_images', idx, 'rating', e.target.value)} />
                </FormField>
                <FormField label="Tiempo Prep">
                  <TextInput value={item.prepTime} onChange={(e) => handleChangeItem('hero_images', idx, 'prepTime', e.target.value)} />
                </FormField>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN MUST TRY (Carousel) */}
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div>
            <h3 className="text-base font-black text-gray-900 uppercase tracking-tight italic">Favoritos de la Comunidad</h3>
            <p className="text-[12px] text-gray-500 mt-1 font-medium">Carrusel intermedio con platos imperdibles.</p>
          </div>
          <button 
            onClick={() => handleAddItem('featured_items', { name: '', img: '', price: '$0k' })}
            className="flex items-center gap-2 px-4 py-2 bg-[#2f4131] text-white rounded-xl text-xs font-bold"
          >
            <Icon icon="heroicons:plus" /> Agregar Item
          </button>
        </div>
        <div className="p-8 space-y-4">
          {data.featured_items?.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex-1 grid grid-cols-3 gap-4">
                <TextInput value={item.name} onChange={(e) => handleChangeItem('featured_items', idx, 'name', e.target.value)} placeholder="Nombre" />
                <TextInput value={item.img} onChange={(e) => handleChangeItem('featured_items', idx, 'img', e.target.value)} placeholder="URL Imagen" />
                <TextInput value={item.price} onChange={(e) => handleChangeItem('featured_items', idx, 'price', e.target.value)} placeholder="Precio (ej. $28k)" />
              </div>
              <button onClick={() => handleRemoveItem('featured_items', idx)} className="text-red-400 p-2"><Icon icon="heroicons:trash" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* TESTIMONIOS */}
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div>
            <h3 className="text-base font-black text-gray-900 uppercase tracking-tight italic">Reseñas y Testimonios</h3>
            <p className="text-[12px] text-gray-500 mt-1 font-medium">Lo que dicen tus clientes.</p>
          </div>
          <button 
            onClick={() => handleAddItem('reviews', { name: '', role: '', text: '', rating: 5, img: '' })}
            className="flex items-center gap-2 px-4 py-2 bg-[#2f4131] text-white rounded-xl text-xs font-bold"
          >
            <Icon icon="heroicons:plus" /> Agregar Reseña
          </button>
        </div>
        <div className="p-8 grid grid-cols-1 gap-6">
          {data.reviews?.map((rev, idx) => (
            <div key={idx} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <TextInput value={rev.name} onChange={(e) => handleChangeItem('reviews', idx, 'name', e.target.value)} placeholder="Nombre Cliente" />
                <TextInput value={rev.role} onChange={(e) => handleChangeItem('reviews', idx, 'role', e.target.value)} placeholder="Rol (ej. Foodie)" />
              </div>
              <textarea 
                value={rev.text} 
                onChange={(e) => handleChangeItem('reviews', idx, 'text', e.target.value)} 
                className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-[#2f4131]/10"
                placeholder="Escibe el testimonio aquí..."
              />
              <div className="grid grid-cols-2 gap-4">
                <TextInput value={rev.img} onChange={(e) => handleChangeItem('reviews', idx, 'img', e.target.value)} placeholder="URL Avatar" />
                <TextInput type="number" value={rev.rating} onChange={(e) => handleChangeItem('reviews', idx, 'rating', parseInt(e.target.value))} placeholder="Estrellas (1-5)" />
              </div>
              <div className="flex justify-end">
                <button onClick={() => handleRemoveItem('reviews', idx)} className="text-red-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <Icon icon="heroicons:trash" /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI PROMPTS */}
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-100">
          <h3 className="text-base font-black text-gray-900 uppercase tracking-tight italic">Inteligencia Artificial (Gemini)</h3>
          <p className="text-[12px] text-gray-500 mt-1 font-medium">Configura la "personalidad" de tus asistentes digitales.</p>
        </div>
        <div className="p-8 space-y-8">
          <FormField label="Prompt: Conserje Gastronómico" subtitle="Usa {{query}} para representar la pregunta del cliente.">
            <textarea 
              value={data.concierge_prompt_template}
              onChange={(e) => setData({ ...data, concierge_prompt_template: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-mono h-32 focus:ring-2 focus:ring-[#2f4131]/10 outline-none"
            />
          </FormField>
          <FormField label="Prompt: Curador de Eventos" subtitle="Configura cómo responde el planificador de eventos.">
            <textarea 
              value={data.event_planner_prompt_template}
              onChange={(e) => setData({ ...data, event_planner_prompt_template: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-mono h-32 focus:ring-2 focus:ring-[#2f4131]/10 outline-none"
            />
          </FormField>
        </div>
      </div>

      {/* BOTÓN FLOTANTE DE GUARDADO */}
      <div className="fixed bottom-8 right-8 z-50">
        <PrimaryButton 
          onClick={handleSave} 
          disabled={submitting}
          className="shadow-2xl px-10 py-4 scale-110"
        >
          {submitting ? 'Guardando...' : 'Guardar Todos los Cambios'}
        </PrimaryButton>
      </div>

    </div>
  );
}
