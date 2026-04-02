import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../hooks/useAuth';
import { toast as toastFn } from '../components/Toast';
import { PrimaryButton, FormField, TextInput } from '../components/admin/ui';
import { Icon } from '@iconify-icon/react';
import AdminBranding from './AdminBranding';

const toast = {
  success: (msg) => toastFn(msg, { duration: 2000 }),
  error: (msg) => toastFn(msg, { duration: 3000 }),
};

export default function AdminWebContent() {
  const { activeBrand } = useAuth();
  const getInitialTab = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'inicio';
  };

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState(getInitialTab);

  // Sync tab with URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') !== activeTab) {
      params.set('tab', activeTab);
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}${window.location.hash}`);
    }
  }, [activeTab]);
  const [data, setData] = useState({
    hero_h1: '',
    hero_subtitle: '',
    hero_emojis: '',
    featured_items: [],
    reviews: [],
    featured_items_title: '',
    experiences_h1: '',
    experiences_subtitle: '',
    experiences_img: '',
    experiences_tag: '',
    concierge_h1: '',
    concierge_subtitle: '',
    concierge_prompt_template: '',
    concierge_img: '',
    concierge_bg_color: '',
    event_planner_prompt_template: '',
    event_planner_h1: '',
    event_planner_subtitle: '',
    event_planner_img: '',
    event_planner_bg_color: '',
    menu_banner_title: '',
    menu_banner_subtitle: '',
    menu_banner_tag: '',
    menu_banner_img: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [dismissedHeroInfo, setDismissedHeroInfo] = useState(false);

  useEffect(() => {
    if (activeBrand?.id) {
      fetchHomeSettings();
      fetchProducts();
    }
  }, [activeBrand?.id]);

  const fetchHomeSettings = async () => {
    if (!activeBrand?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('home_settings')
        .select('*')
        .eq('brand_id', activeBrand.id)
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setData(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar ajustes de la landing');
    } finally {
      setLoading(false);
    }
  };

  const [allProducts, setAllProducts] = useState([]);
  const fetchProducts = async () => {
    if (!activeBrand?.id) return;
    try {
      const { data: products } = await supabase
        .from('products')
        .select('id, name, image_url, price, category_id, categories(name)')
        .eq('brand_id', activeBrand.id)
        .eq('is_active', true)
        .order('name');
      setAllProducts(products || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const payload = {
        hero_h1: data.hero_h1 || null,
        hero_subtitle: data.hero_subtitle || null,
        hero_emojis: data.hero_emojis || null,
        featured_items: data.featured_items || [],
        reviews: data.reviews || [],
        featured_items_title: data.featured_items_title || null,
        experiences_h1: data.experiences_h1 || null,
        experiences_subtitle: data.experiences_subtitle || null,
        experiences_img: data.experiences_img || null,
        experiences_tag: data.experiences_tag || null,
        concierge_h1: data.concierge_h1 || null,
        concierge_subtitle: data.concierge_subtitle || null,
        concierge_prompt_template: data.concierge_prompt_template || null,
        concierge_img: data.concierge_img || null,
        concierge_bg_color: data.concierge_bg_color || null,
        event_planner_prompt_template: data.event_planner_prompt_template || null,
        event_planner_h1: data.event_planner_h1 || null,
        event_planner_subtitle: data.event_planner_subtitle || null,
        event_planner_img: data.event_planner_img || null,
        event_planner_bg_color: data.event_planner_bg_color || null,
        menu_banner_title: data.menu_banner_title || null,
        menu_banner_subtitle: data.menu_banner_subtitle || null,
        menu_banner_tag: data.menu_banner_tag || null,
        menu_banner_img: data.menu_banner_img || null,
        updated_at: new Date().toISOString()
      };
      const { error } = await supabase.from('home_settings')
        .update({
          ...payload,
          brand_id: activeBrand.id
        })
        .eq('id', data.id);
      if (error) throw error;
      toast.success('Ajustes web guardados');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
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

  if (loading) return <div className="p-8 text-center text-gray-400 font-medium">Cargando ajustes web...</div>;

  const handleImageUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `landing_images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setData(prev => ({ ...prev, [field]: publicData.publicUrl }));
      toast.success('Imagen subida correctamente');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error subiendo imagen');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const tabs = [
    { id: 'inicio', label: 'Inicio', icon: 'heroicons:home' },
    { id: 'menu', label: 'Menú', icon: 'heroicons:book-open' },
    { id: 'ai', label: 'Asistentes AI', icon: 'heroicons:cpu-chip' },
    { id: 'experiences', label: 'Experiencias', icon: 'heroicons:sparkles' },
    { id: 'branding', label: 'Branding', icon: 'heroicons:paint-brush' }
  ];

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 p-5 lg:p-6">
      
      {/* Tabs Menu */}
      <div className="flex space-x-2 bg-gray-100 p-1.5 rounded-2xl w-max">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            <Icon icon={tab.icon} className="text-lg" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {/* TAB 1: INICIO (HERO + COMUNIDAD) */}
        {activeTab === 'inicio' && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight italic">Configuración Home Hero</h3>
              <p className="text-[11px] text-gray-500 mt-0.5 font-medium">Textos e imagen principal de la portada.</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Título Principal (H1)" subtitle="Enter para separar líneas.">
                  <textarea 
                    value={data.hero_h1 || ''} 
                    onChange={(e) => setData({ ...data, hero_h1: e.target.value })} 
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#2f4131]/10 resize-none h-16 font-bold"
                    placeholder={`Descubre tus\nplatos favoritos`}
                  />
                </FormField>
                <FormField label="Subtítulo / Copy">
                  <textarea 
                    value={data.hero_subtitle || ''} 
                    onChange={(e) => setData({ ...data, hero_subtitle: e.target.value })} 
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#2f4131]/10 resize-none h-16"
                    placeholder="Ej. Explora una experiencia gastronómica andina..."
                  />
                </FormField>
              </div>
              <FormField label="Emojis Flotantes" subtitle="Máx. 4 emojis.">
                {(() => {
                  const EMOJI_OPTIONS = ['🥑','🌿','🍃','🌱','☕','🍵','🫖','🥣','🍞','🥐','🧁','🍓','🫐','🍊','🥝','🍋','✨','🔥','💚','⭐','🌮','🥗','🍕','🧀','🍰','🎉','🌸','🍂'];
                  const selected = (data.hero_emojis || '').split(',').map(e => e.trim()).filter(Boolean);
                  
                  const toggle = (emoji) => {
                    let next;
                    if (selected.includes(emoji)) {
                      next = selected.filter(e => e !== emoji);
                    } else {
                      if (selected.length >= 4) return;
                      next = [...selected, emoji];
                    }
                    setData({ ...data, hero_emojis: next.join(',') });
                  };

                  return (
                    <div className="space-y-2">
                      {/* Selected emojis + toggle button */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {selected.length > 0 ? selected.map((em, i) => (
                          <button key={i} type="button" onClick={() => toggle(em)}
                            className="flex items-center gap-1 bg-[#2f4131]/10 hover:bg-red-100 rounded-full px-2.5 py-1 text-base transition-colors group">
                            <span>{em}</span>
                            <span className="text-[10px] text-gray-400 group-hover:text-red-500">✕</span>
                          </button>
                        )) : <span className="text-xs text-gray-400 italic">Ninguno</span>}
                        <button 
                          type="button" 
                          onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                          className="text-xs font-medium text-[#2f4131] hover:text-[#1a2418] flex items-center gap-1 ml-1"
                        >
                          <Icon icon={emojiPickerOpen ? "heroicons:chevron-up" : "heroicons:plus-circle"} className="text-sm" />
                          {emojiPickerOpen ? 'Cerrar' : 'Cambiar'}
                        </button>
                      </div>
                      {/* Collapsible emoji grid */}
                      {emojiPickerOpen && (
                        <div className="flex flex-wrap gap-1 p-3 bg-gray-50 rounded-xl border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                          {EMOJI_OPTIONS.map(em => (
                            <button key={em} type="button" onClick={() => toggle(em)}
                              className={`w-8 h-8 flex items-center justify-center text-lg rounded-lg transition-all hover:scale-110 ${
                                selected.includes(em) 
                                  ? 'bg-[#2f4131] ring-2 ring-[#2f4131] scale-110' 
                                  : 'hover:bg-gray-200'
                              }`}>
                              {em}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </FormField>
              
              <div className="p-4 bg-[#7db87a]/10 border border-[#7db87a]/20 rounded-2xl flex gap-3 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#7db87a]/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="w-10 h-10 rounded-xl bg-[#2f4131] flex items-center justify-center shrink-0 shadow-lg shadow-[#2f4131]/20">
                  <Icon icon="heroicons:sparkles" className="text-white text-xl" />
                </div>
                <div className="relative z-10">
                  <h4 className="text-[13px] font-black text-[#2f4131] uppercase tracking-tight italic flex items-center gap-2">
                    Gestión del Slider Principal
                  </h4>
                  <p className="text-[11px] text-gray-600 mt-1 font-medium leading-relaxed">
                    Para elegir qué platos aparecen en el carrusel de la página de inicio, ve a la sección de 
                    <button 
                      onClick={() => window.location.search = '?admin_page=categories'}
                      className="text-[#2f4131] font-bold border-b border-[#2f4131]/20 hover:border-[#2f4131] transition-all px-0.5 mx-0.5 bg-white/50 rounded"
                    >
                      Categorías
                    </button>
                    y activa la opción <strong>"Configuración Home Hero"</strong> en cada una. 
                    ¡Asegúrate de que tengan un Producto Estrella seleccionado!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONTINUACIÓN TABS INICIO: COMUNIDAD */}
        {activeTab === 'inicio' && (
          <div className="space-y-5 mt-5">
            {/* FAVORITOS DE LA COMUNIDAD */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <div className="shrink-0">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight italic">Favoritos de la Comunidad</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5 font-medium">Carrusel con platos imperdibles.</p>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase shrink-0">Título:</span>
                  <input
                    value={data.featured_items_title || ''}
                    onChange={(e) => setData({ ...data, featured_items_title: e.target.value })}
                    placeholder="Ej. Must Try"
                    className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#2f4131]/10"
                  />
                </div>
                <button 
                  onClick={() => handleAddItem('featured_items', { name: '', img: '', price: '$0k', product_id: '' })}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2f4131] text-white rounded-xl text-xs font-bold hover:bg-[#243420] transition-colors shrink-0"
                >
                  <Icon icon="heroicons:plus" /> Agregar Item
                </button>
              </div>

              <div className="p-5 space-y-3">
                {data.featured_items?.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Icon icon="heroicons:photo" className="text-4xl mb-2" />
                    <p className="text-sm font-medium">No hay favoritos aún. Agrega productos de tu carta.</p>
                  </div>
                )}
                {data.featured_items?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    {/* Thumbnail preview */}
                    <div className="w-14 h-14 rounded-xl bg-gray-200 overflow-hidden shrink-0">
                      {item.img && <img src={item.img} alt="" className="w-full h-full object-cover" />}
                    </div>
                    {/* Product picker */}
                    <div className="flex-1">
                      <select
                        value={item.product_id || ''}
                        onChange={(e) => {
                          const prod = allProducts.find(p => p.id === e.target.value);
                          if (prod) {
                            const newList = [...data.featured_items];
                            newList[idx] = {
                              product_id: prod.id,
                              name: prod.name,
                              img: prod.image_url || '',
                              price: `$${(prod.price / 1000).toFixed(0)}k`
                            };
                            setData({ ...data, featured_items: newList });
                          }
                        }}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2f4131]/10"
                      >
                        <option value="">Selecciona un producto...</option>
                        {allProducts.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} — {p.categories?.name || ''} — ${(p.price / 1000).toFixed(0)}k
                          </option>
                        ))}
                      </select>
                      {item.name && <p className="text-xs text-gray-500 mt-1 font-medium">{item.name} · {item.price}</p>}
                    </div>
                    <button onClick={() => handleRemoveItem('featured_items', idx)} className="text-red-400 p-2 hover:text-red-600 transition-colors">
                      <Icon icon="heroicons:trash" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* TESTIMONIOS */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight italic">Voces de la Comunidad</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5 font-medium">Reseñas y testimonios de tus clientes.</p>
                </div>
                <button 
                  onClick={() => handleAddItem('reviews', { name: '', role: '', text: '', rating: 5, img: '' })}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2f4131] text-white rounded-xl text-xs font-bold hover:bg-[#243420] transition-colors"
                >
                  <Icon icon="heroicons:plus" /> Agregar Reseña
                </button>
              </div>
              <div className="p-5 grid grid-cols-1 gap-4">
                {data.reviews?.length === 0 && (
                  <div className="text-center py-6 text-gray-400">
                    <Icon icon="heroicons:chat-bubble-left-right" className="text-3xl mb-1" />
                    <p className="text-xs font-medium">No hay reseñas aún.</p>
                  </div>
                )}
                {data.reviews?.map((rev, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-[#2f4131]/10 overflow-hidden shrink-0 flex items-center justify-center text-sm font-bold text-[#2f4131]">
                        {rev.img ? (
                          <img src={rev.img} alt="" className="w-full h-full object-cover" />
                        ) : (
                          rev.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
                        )}
                      </div>
                      {/* Main content */}
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Name + Role row */}
                        <div className="grid grid-cols-2 gap-2">
                          <input value={rev.name} onChange={(e) => handleChangeItem('reviews', idx, 'name', e.target.value)} placeholder="Nombre" className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#2f4131]/10" />
                          <input value={rev.role} onChange={(e) => handleChangeItem('reviews', idx, 'role', e.target.value)} placeholder="Rol (ej. Foodie)" className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#2f4131]/10" />
                        </div>
                        {/* Text */}
                        <textarea 
                          value={rev.text} 
                          onChange={(e) => handleChangeItem('reviews', idx, 'text', e.target.value)} 
                          className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#2f4131]/10 resize-none"
                          placeholder="Testimonio..."
                          rows={1}
                        />
                        {/* Bottom row: rating + avatar URL + delete */}
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button 
                                key={star} type="button"
                                onClick={() => handleChangeItem('reviews', idx, 'rating', star)}
                                className={`text-base transition-colors ${star <= (rev.rating || 5) ? 'text-[#E6B05C]' : 'text-gray-300'}`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                          <input 
                            value={rev.img} 
                            onChange={(e) => handleChangeItem('reviews', idx, 'img', e.target.value)} 
                            placeholder="URL avatar (opcional)" 
                            className="flex-1 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-[#2f4131]/10"
                          />
                          <button onClick={() => handleRemoveItem('reviews', idx)} className="text-red-400 hover:text-red-600 transition-colors shrink-0">
                            <Icon icon="heroicons:trash" className="text-sm" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* TAB 2: MENÚ */}
        {activeTab === 'menu' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm p-5">
              <div className="space-y-1 mb-5 border-b border-gray-100 pb-4">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight italic">Banner del Menú</h3>
                <p className="text-[11px] text-gray-500 font-medium">Textos e imagen principal de la carta.</p>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Título Principal (H1)">
                    <TextInput 
                      value={data.menu_banner_title || ''} 
                      onChange={(e) => setData({ ...data, menu_banner_title: e.target.value })} 
                      placeholder="Ej. Menú Principal" 
                    />
                  </FormField>
                  <FormField label="Texto del Tag (Chip)">
                    <TextInput 
                      value={data.menu_banner_tag || ''} 
                      onChange={(e) => setData({ ...data, menu_banner_tag: e.target.value })} 
                      placeholder="Ej. Carta Principal" 
                    />
                  </FormField>
                </div>
                
                <FormField label="Subtítulo / Copy">
                  <textarea 
                    value={data.menu_banner_subtitle || ''} 
                    onChange={(e) => setData({ ...data, menu_banner_subtitle: e.target.value })} 
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#2f4131]/10 resize-none h-16"
                    placeholder="Ej. Auténtica gastronomía de altura..."
                  />
                </FormField>
                
                <FormField label="Imagen de Fondo (Banner)">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <TextInput 
                        value={data.menu_banner_img || ''} 
                        onChange={(e) => setData({ ...data, menu_banner_img: e.target.value })} 
                        placeholder="https://... o sube una imagen" 
                        type="url"
                      />
                      <label className={`shrink-0 cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${uploadingImage ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                        <Icon icon={uploadingImage ? "heroicons:arrow-path" : "heroicons:arrow-up-tray"} className={uploadingImage ? "animate-spin" : ""} />
                        <span>Subir Foto</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleImageUpload(e, 'menu_banner_img')}
                          disabled={uploadingImage}
                        />
                      </label>
                    </div>
                    {data.menu_banner_img && (
                      <div className="w-full h-28 rounded-xl overflow-hidden border border-gray-200 relative">
                         <img src={data.menu_banner_img} alt="Menu banner preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </FormField>
              </div>
            </div>
          </div>
        )}
        {/* TAB 3: EXPERIENCIAS */}
        {activeTab === 'experiences' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm p-5">
              <div className="space-y-1 mb-5 border-b border-gray-100 pb-4">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight italic">Página de Experiencias (Hero)</h3>
                <p className="text-[11px] text-gray-500 font-medium">Textos e imagen de la página de Experiencias.</p>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Título Principal (H1)">
                    <TextInput 
                      value={data.experiences_h1 || ''} 
                      onChange={(e) => setData({ ...data, experiences_h1: e.target.value })} 
                      placeholder="Ej. Vive momentos inolvidables" 
                    />
                  </FormField>
                  <FormField label="Texto del Tag (Chip)">
                    <TextInput 
                      value={data.experiences_tag || ''} 
                      onChange={(e) => setData({ ...data, experiences_tag: e.target.value })} 
                      placeholder="Ej. Exclusivo" 
                    />
                  </FormField>
                </div>
                <FormField label="Subtítulo / Copy">
                  <textarea 
                    value={data.experiences_subtitle || ''} 
                    onChange={(e) => setData({ ...data, experiences_subtitle: e.target.value })} 
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#2f4131]/10 resize-none h-16"
                    placeholder="Ej. Eventos únicos, catas de café..."
                  />
                </FormField>
                
                <FormField label="Imagen de Fondo (Hero)">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <TextInput 
                        value={data.experiences_img || ''} 
                        onChange={(e) => setData({ ...data, experiences_img: e.target.value })} 
                        placeholder="https://... o sube una imagen" 
                        type="url"
                      />
                      <label className={`shrink-0 cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${uploadingImage ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                        <Icon icon={uploadingImage ? "heroicons:arrow-path" : "heroicons:arrow-up-tray"} className={uploadingImage ? "animate-spin" : ""} />
                        <span>Subir Foto</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleImageUpload(e, 'experiences_img')}
                          disabled={uploadingImage}
                        />
                      </label>
                    </div>
                    {data.experiences_img && (
                      <div className="w-full h-28 rounded-xl overflow-hidden border border-gray-200 relative">
                         <img src={data.experiences_img} alt="Experiencia preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </FormField>
              </div>
            </div>
          </div>
        )}
        {/* TAB 4: ASISTENTES AI */}
        {activeTab === 'ai' && (
          <div className="space-y-5">
            <div className="bg-[#1A2421] rounded-2xl overflow-hidden shadow-lg p-5 relative">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#E6B05C]/10 rounded-full blur-[80px]" />
              <div className="relative z-10 space-y-1 mb-5 border-b border-white/10 pb-4">
                <div className="inline-flex items-center gap-2 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10 w-max mb-1">
                  <Icon icon="heroicons:sparkles" className="text-[#E6B05C] text-sm" />
                  <span className="text-[9px] font-bold text-white uppercase tracking-widest">Powered by Gemini AI</span>
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-tight italic">Conserje Gastronómico</h3>
                <p className="text-[11px] text-white/50 font-medium">Textos y comportamiento del asistente inteligente.</p>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label={<span className="text-white/80">Título (H1)</span>}>
                    <TextInput 
                      value={data.concierge_h1 || ''} 
                      onChange={(e) => setData({ ...data, concierge_h1: e.target.value })} 
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      placeholder="Ej. Taste the Best that Surprise you" 
                    />
                  </FormField>
                  <FormField label={<span className="text-white/80">Color de Fondo</span>}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color"
                        value={data.concierge_bg_color || '#1A2421'}
                        onChange={(e) => setData({ ...data, concierge_bg_color: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                      />
                      <TextInput 
                        value={data.concierge_bg_color || ''} 
                        onChange={(e) => setData({ ...data, concierge_bg_color: e.target.value })} 
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 flex-1"
                        placeholder="Ej. #1A2421" 
                      />
                    </div>
                  </FormField>
                </div>
                
                <FormField label={<span className="text-white/80">Subtítulo</span>}>
                  <textarea 
                    value={data.concierge_subtitle || ''} 
                    onChange={(e) => setData({ ...data, concierge_subtitle: e.target.value })} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-[#E6B05C]/30 resize-none h-16"
                    placeholder="Ej. Nuestro Conserje Gastronómico analiza tu antojo..."
                  />
                </FormField>
                <FormField label={<span className="text-white/80">Imagen del Conserje</span>}>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <TextInput 
                        value={data.concierge_img || ''} 
                        onChange={(e) => setData({ ...data, concierge_img: e.target.value })} 
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                        placeholder="https://... o sube una imagen" 
                        type="url"
                      />
                      <label className={`shrink-0 cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${uploadingImage ? 'bg-white/10 text-white/40' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
                        <Icon icon={uploadingImage ? "heroicons:arrow-path" : "heroicons:arrow-up-tray"} className={uploadingImage ? "animate-spin" : ""} />
                        <span>Subir</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleImageUpload(e, 'concierge_img')}
                          disabled={uploadingImage}
                        />
                      </label>
                    </div>
                    {data.concierge_img && (
                      <div className="w-full h-28 rounded-xl overflow-hidden border border-white/10 relative">
                         <img src={data.concierge_img} alt="Concierge preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </FormField>
                <FormField label={<span className="text-white/80">Prompt del Sistema</span>} subtitle={<span className="text-white/50">Usa {'{{query}}'} para la pregunta del cliente.</span>}>
                  <textarea 
                    value={data.concierge_prompt_template || ''}
                    onChange={(e) => setData({ ...data, concierge_prompt_template: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-mono text-[#E6B05C] h-24 focus:ring-2 focus:ring-[#E6B05C]/30 outline-none"
                    placeholder="Eres un conserje gastronómico..."
                  />
                </FormField>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm p-5">
              <div className="space-y-1 mb-5 border-b border-gray-100 pb-4">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight italic">Curador de Eventos / Experiencias</h3>
                <p className="text-[11px] text-gray-500 font-medium">Textos, imagen y comportamiento del diseñador de eventos AI.</p>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Título (H1)">
                    <TextInput 
                      value={data.event_planner_h1 || ''} 
                      onChange={(e) => setData({ ...data, event_planner_h1: e.target.value })} 
                      placeholder="Ej. ¿Buscas algo más Privado?" 
                    />
                  </FormField>
                  <FormField label="Color de Fondo">
                    <div className="flex items-center gap-3">
                      <input 
                        type="color"
                        value={data.event_planner_bg_color || '#ffffff'}
                        onChange={(e) => setData({ ...data, event_planner_bg_color: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                      />
                      <TextInput 
                        value={data.event_planner_bg_color || ''} 
                        onChange={(e) => setData({ ...data, event_planner_bg_color: e.target.value })} 
                        placeholder="Ej. #ffffff" 
                        className="flex-1"
                      />
                    </div>
                  </FormField>
                </div>
                <FormField label="Subtítulo / Copy">
                  <textarea 
                    value={data.event_planner_subtitle || ''} 
                    onChange={(e) => setData({ ...data, event_planner_subtitle: e.target.value })} 
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#2f4131]/10 resize-none h-16"
                    placeholder="Ej. Describe la experiencia que tienes en mente..."
                  />
                </FormField>
                
                <FormField label="Imagen de Fondo">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <TextInput 
                        value={data.event_planner_img || ''} 
                        onChange={(e) => setData({ ...data, event_planner_img: e.target.value })} 
                        placeholder="https://... o sube una imagen" 
                        type="url"
                      />
                      <label className={`shrink-0 cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${uploadingImage ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                        <Icon icon={uploadingImage ? "heroicons:arrow-path" : "heroicons:arrow-up-tray"} className={uploadingImage ? "animate-spin" : ""} />
                        <span>Subir</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleImageUpload(e, 'event_planner_img')}
                          disabled={uploadingImage}
                        />
                      </label>
                    </div>
                    {data.event_planner_img && (
                      <div className="w-full h-28 rounded-xl overflow-hidden border border-gray-200 relative">
                         <img src={data.event_planner_img} alt="Planificador AI preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </FormField>

                <FormField label="Prompt del Sistema" subtitle="Configura cómo responde la AI para eventos.">
                  <textarea 
                    value={data.event_planner_prompt_template || ''}
                    onChange={(e) => setData({ ...data, event_planner_prompt_template: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-mono h-24 focus:ring-2 focus:ring-[#2f4131]/10 outline-none"
                    placeholder="Eres un planificador de eventos experto..."
                  />
                </FormField>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BRANDING & BANNERS */}
        {activeTab === 'branding' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <AdminBranding isEmbedded={true} />
          </div>
        )}
      </div>

      {/* BOTÓN FLOTANTE DE GUARDADO */}
      <div className="fixed bottom-8 right-8 z-50">
        <PrimaryButton 
          onClick={handleSave} 
          disabled={submitting}
          className={`shadow-2xl px-10 py-4 scale-110 flex items-center gap-2 ${saved ? '!bg-green-600' : ''}`}
        >
          {saved ? (
            <><Icon icon="heroicons:check-circle-solid" className="text-lg" /> ¡Guardado!</>
          ) : submitting ? 'Guardando...' : 'Guardar Todos los Cambios'}
        </PrimaryButton>
      </div>

    </div>
  );
}
