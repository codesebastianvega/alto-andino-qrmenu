import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { useMenuData } from '../context/MenuDataContext';
import { toast as toastFn } from '../components/Toast';
import { PrimaryButton, SecondaryButton, FormField, TextInput, PageHeader, Switch } from '../components/admin/ui';
import { Icon } from '@iconify-icon/react';
import { Loader2, Sparkles, Home, BookOpen, Layers, Palette, Cpu, Settings, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import AdminBranding from './AdminBranding';

const toast = {
  success: (msg) => toastFn(msg, { duration: 2000 }),
  error: (msg) => toastFn(msg, { duration: 3000 }),
};

export default function AdminWebContent() {
  const { activeBrand } = useAuth();
  const { refetchMenuData } = useMenuData();
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
      const targetPath = activeBrand?.slug ? `/${activeBrand.slug}/` : window.location.pathname;
      window.history.replaceState(null, '', `${targetPath}?${params.toString()}${window.location.hash}`);
    }
  }, [activeTab, activeBrand]);

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
    menu_banner_img: '',
    welcome_bg_img: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [allCategories, setAllCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [editingHeroCategory, setEditingHeroCategory] = useState(null);

  useEffect(() => {
    if (activeBrand?.id) {
      fetchHomeSettings();
      fetchProducts();
      fetchCategories();
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
        setData(prev => ({
          ...prev,
          ...data,
          featured_items: data.featured_items || [],
          reviews: data.reviews || []
        }));
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

  const fetchCategories = async () => {
    if (!activeBrand?.id) return;
    setLoadingCategories(true);
    try {
      const { data: cats, error } = await supabase
        .from('categories')
        .select('*')
        .eq('brand_id', activeBrand.id)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      setAllCategories(cats || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      toast.error('Error al cargar categorías');
    } finally {
      setLoadingCategories(false);
    }
  };

  const toggleCategoryHero = async (category) => {
    const isCurrentlyActive = category.visibility_config?.show_in_hero;
    const activeCount = allCategories.filter(c => c.visibility_config?.show_in_hero).length;

    if (!isCurrentlyActive && activeCount >= 5) {
      toast.error('Límite de 5 categorías alcanzado. Desactiva una antes de agregar otra.');
      return;
    }

    try {
      const newConfig = {
        ...(category.visibility_config || {}),
        show_in_hero: !isCurrentlyActive
      };

      const { error } = await supabase
        .from('categories')
        .update({ visibility_config: newConfig })
        .eq('id', category.id);

      if (error) throw error;

      // Update local state
      setAllCategories(prev => prev.map(c => 
        c.id === category.id ? { ...c, visibility_config: newConfig } : c
      ));

      // Update local context for SPA synchronization
      if (refetchMenuData) refetchMenuData();

      toast.success(isCurrentlyActive ? `${category.name} removida del Hero` : `${category.name} añadida al Hero`);
    } catch (err) {
      console.error('Error updating category:', err);
      toast.error('Error al actualizar categoría');
    }
  };

  const setHeroFeaturedProduct = async (category, productId) => {
    try {
      const newConfig = {
        ...(category.visibility_config || {}),
        hero_featured_product_id: productId,
        // When setting a product, we clear the custom image to use the product image by default
        // unless the user specifies otherwise.
        hero_custom_image: null
      };

      const { error } = await supabase
        .from('categories')
        .update({ visibility_config: newConfig })
        .eq('id', category.id);

      if (error) throw error;

      setAllCategories(prev => prev.map(c => 
        c.id === category.id ? { ...c, visibility_config: newConfig } : c
      ));

      if (refetchMenuData) refetchMenuData();
      toast.success('Producto destacado actualizado');
      setEditingHeroCategory(null);
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar el producto');
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
        welcome_bg_img: data.welcome_bg_img || null,
        updated_at: new Date().toISOString()
      };
      const { error } = await supabase.from('home_settings')
        .upsert({
          ...payload,
          brand_id: activeBrand.id
        }, { 
          onConflict: 'brand_id' 
        });
      if (error) throw error;
      
      // Update local context for SPA synchronization
      if (refetchMenuData) refetchMenuData();

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

  // Search and Filter for Must Try
  const [mustTrySearch, setMustTrySearch] = useState('');
  const [mustTryCategory, setMustTryCategory] = useState('all');

  // Handle Must Try Product Toggle
  const toggleMustTryProduct = (product) => {
    if (!product?.id) return;
    const currentItems = data?.featured_items || [];
    const isSelected = currentItems.some(item => item?.product_id === product.id);

    if (isSelected) {
      // Remove it
      setData({
        ...data,
        featured_items: currentItems.filter(item => item?.product_id !== product.id)
      });
    } else {
      // Add it if limit not reached
      if (currentItems.length >= 8) {
        toast.error('Límite de 8 platos alcanzado. Elimina uno para agregar otro.');
        return;
      }
      
      const newItem = {
        product_id: product.id,
        name: product.name || 'Plato sin nombre',
        img: product.image_url || '',
        price: product.price || 0
      };
      
      setData({
        ...data,
        featured_items: [...currentItems, newItem]
      });
    }
  };

  const filteredProducts = allProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(mustTrySearch.toLowerCase());
    const matchesCategory = mustTryCategory === 'all' || p.category_id === mustTryCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddItem = (field, item) => {
    setData({ ...data, [field]: [...(data[field] || []), item] });
  };

  const handleRemoveItem = (key, index) => {
    const items = data[key] || [];
    const newList = [...items];
    newList.splice(index, 1);
    setData({ ...data, [key]: newList });
  };

  const handleChangeItem = (key, index, field, value) => {
    const items = data[key] || [];
    const newList = [...items];
    if (newList[index]) {
      newList[index] = { ...newList[index], [field]: value };
      setData({ ...data, [key]: newList });
    }
  };

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

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 text-gray-400 font-medium">
      <Loader2 className="w-8 h-8 animate-spin mb-3 text-brand-primary" />
      <span className="text-xs uppercase tracking-[0.2em] font-bold text-gray-500">Cargando experiencia digital...</span>
    </div>
  );

  const tabs = [
    { id: 'inicio', label: 'Portada', icon: 'solar:home-smile-bold-duotone', color: 'indigo' },
    { id: 'menu', label: 'Carta Digital', icon: 'solar:book-bookmark-bold-duotone', color: 'emerald' },
    { id: 'ai', label: 'Cerebro AI', icon: 'solar:cpu-bold-duotone', color: 'amber' },
    { id: 'experiences', label: 'Experiencias', icon: 'solar:star-fall-bold-duotone', color: 'purple' },
    { id: 'branding', label: 'Identidad', icon: 'solar:palette-bold-duotone', color: 'pink' }
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-32">
      <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <PageHeader 
          badge="Gestión de Contenido"
          title="Página Web & Landing"
          subtitle="Modifica el escaparate digital de tu negocio y la inteligencia de tus asistentes."
        >
           <div className="flex items-center gap-3">
              <SecondaryButton onClick={() => window.open(`/${activeBrand?.slug}`, '_blank')} className="rounded-2xl px-6 py-3 border-gray-100 bg-white shadow-sm flex items-center gap-2 group">
                 <Icon icon="solar:round-alt-arrow-right-bold" className="text-xl text-gray-400 group-hover:translate-x-1 transition-transform" />
                 Ver Web
              </SecondaryButton>
              <PrimaryButton onClick={handleSave} disabled={submitting} className="rounded-2xl px-8 py-3 shadow-xl">
                 {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon icon="solar:diskette-bold-duotone" className="text-xl" />}
                 {submitting ? 'Guardando...' : 'Publicar Cambios'}
              </PrimaryButton>
           </div>
        </PageHeader>

        {/* Tabs Menu */}
        <div className="flex flex-wrap gap-2 bg-gray-100/50 p-2 rounded-3xl w-max border border-gray-100 overflow-hidden shadow-inner">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-wider transition-all ${
                activeTab === tab.id 
                ? 'bg-white text-gray-900 shadow-xl shadow-gray-200/50 ring-1 ring-gray-100 scale-[1.02]' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
              }`}
            >
              <Icon icon={tab.icon} className={`text-xl transition-transform ${activeTab === tab.id ? 'scale-110' : ''}`} /> 
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: INICIO (HERO + COMUNIDAD) */}
        {activeTab === 'inicio' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
            {/* HERO SETTINGS */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-gray-200/20 transition-all duration-500">
              <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                    <Icon icon="solar:crown-bold-duotone" className="text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-1">Landing Experience</h3>
                    <h2 className="text-lg font-bold text-gray-900 leading-tight">Portada Principal (Hero)</h2>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <FormField 
                      label="Título de Alto Impacto (H1)" 
                      subtitle="Separa con un 'Enter' para crear saltos de línea elegantes."
                    >
                      <textarea 
                        value={data.hero_h1 || ''} 
                        onChange={(e) => setData({ ...data, hero_h1: e.target.value })} 
                        className="w-full bg-gray-50 border-2 border-gray-50 rounded-[1.5rem] p-5 text-lg font-bold text-gray-900 outline-none focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/50 transition-all placeholder:text-gray-300 min-h-[140px] shadow-inner"
                        placeholder={`Descubre tus\nplatos favoritos`}
                      />
                    </FormField>

                    <FormField label="Subtítulo Convencedor">
                      <textarea 
                        value={data.hero_subtitle || ''} 
                        onChange={(e) => setData({ ...data, hero_subtitle: e.target.value })} 
                        className="w-full bg-gray-50 border-2 border-gray-50 rounded-[1.5rem] p-5 text-sm font-medium text-gray-600 outline-none focus:bg-white focus:border-indigo-100 transition-all placeholder:text-gray-300 min-h-[100px] shadow-inner"
                        placeholder="Ej. Explora una experiencia gastronómica andina..."
                      />
                    </FormField>
                  </div>

                  <div className="space-y-8">
                    <div className="p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">Emojis Dinámicos</label>
                        <span className="text-[10px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full font-semibold">Máx. 4</span>
                      </div>
                      
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
                          <div className="space-y-4">
                            <div className="flex flex-wrap gap-2 min-h-[46px] p-2 bg-white rounded-xl border border-dashed border-gray-200">
                              {selected.length > 0 ? selected.map((em, i) => (
                                <button key={i} type="button" onClick={() => toggle(em)}
                                  className="flex items-center gap-2 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-lg px-3 py-1.5 transition-all group border border-gray-100 hover:border-red-100">
                                  <span className="text-lg">{em}</span>
                                  <Icon icon="solar:close-circle-bold-duotone" className="text-gray-300 group-hover:text-red-400" />
                                </button>
                              )) : <div className="flex items-center justify-center w-full text-[10px] text-gray-300 font-bold uppercase tracking-[0.1em] pt-2">Selecciona hasta 4 emojis</div>}
                            </div>
                            
                            <div className="flex flex-wrap gap-1.5 p-4 bg-white/50 rounded-2xl border border-gray-100">
                              {EMOJI_OPTIONS.map(em => (
                                <button key={em} type="button" onClick={() => toggle(em)}
                                  className={`w-10 h-10 flex items-center justify-center text-xl rounded-xl transition-all ${
                                    selected.includes(em) 
                                      ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-100' 
                                      : 'hover:bg-gray-100 text-gray-600 hover:scale-110'
                                  }`}>
                                  {em}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">Bienvenida Global (Ritual)</label>
                      <div className="group relative rounded-[2rem] overflow-hidden bg-gray-900 border-4 border-white shadow-2xl h-48 transition-all hover:scale-[1.02]">
                         {data.welcome_bg_img ? (
                            <img src={data.welcome_bg_img} alt="Welcome Ritual" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                         ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 gap-2">
                               <Icon icon="solar:gallery-wide-bold-duotone" className="text-4xl" />
                               <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Sin Imagen Definida</span>
                            </div>
                         )}
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-5">
                            <label className="flex items-center justify-center gap-3 w-full py-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-all">
                               {uploadingImage ? <Loader2 className="animate-spin" /> : <Icon icon="solar:upload-bold-duotone" className="text-lg" />}
                               {uploadingImage ? 'Procesando...' : 'Cambiar Imagen de Fondo'}
                               <input 
                                 type="file" 
                                 accept="image/*" 
                                 className="hidden" 
                                 onChange={(e) => handleImageUpload(e, 'welcome_bg_img')}
                                 disabled={uploadingImage}
                               />
                            </label>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* GESTIÓN DE CATEGORÍAS EN EL HERO (HERO CHIPS) */}
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                        <Icon icon="solar:stars-minimalistic-bold-duotone" className="text-indigo-600 text-xl" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Categorías Destacadas (Hero)</h4>
                        <p className="text-[11px] text-gray-500 font-medium">Selecciona las categorías que aparecerán en el carrusel principal.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                      <span className={`w-2 h-2 rounded-full ${allCategories.filter(c => c.visibility_config?.show_in_hero).length >= 5 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                      <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                        {allCategories.filter(c => c.visibility_config?.show_in_hero).length} / 5 Seleccionadas
                      </span>
                    </div>
                  </div>

                  {loadingCategories ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
                      <Loader2 className="w-8 h-8 text-indigo-200 animate-spin" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4">Cargando categorías...</span>
                    </div>
                  ) : allCategories.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
                      <Icon icon="solar:folder-error-bold-duotone" className="text-4xl text-gray-200" />
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-4">No se encontraron categorías</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {allCategories.map((category) => {
                        const isActive = category.visibility_config?.show_in_hero;
                        
                        // Check if category is currently active based on dayparting
                        const isScheduled = () => {
                          const now = new Date();
                          const currentDay = now.getDay();
                          const config = category.visibility_config || {};
                          const allowedDays = config.days || [0,1,2,3,4,5,6];
                          
                          if (!allowedDays.includes(currentDay)) return false;
                          if (!category.available_from && !category.available_to) return true;
                          
                          const currentMinutes = now.getHours() * 60 + now.getMinutes();
                          const parseTime = (t) => { if (!t) return null; const [h,m] = t.split(':').map(Number); return h*60+m; };
                          const from = parseTime(category.available_from);
                          const to = parseTime(category.available_to);
                          
                          if (from !== null && to !== null) {
                            return from < to ? (currentMinutes >= from && currentMinutes <= to) : (currentMinutes >= from || currentMinutes <= to);
                          }
                          if (from !== null) return currentMinutes >= from;
                          if (to !== null) return currentMinutes <= to;
                          return true;
                        };

                        const isCurrentlyVisible = isScheduled();
                        const vc = category.visibility_config || {};
                        const featuredProduct = allProducts.find(p => p.id === vc.hero_featured_product_id);
                        
                        // Priority: Custom Image > Featured Product Image > Fallback Category Product Image
                        const displayImg = vc.hero_custom_image 
                          || featuredProduct?.image_url 
                          || allProducts.find(p => p.category_id === category.id && p.image_url)?.image_url;

                        return (
                          <div
                            key={category.id}
                            className={`group relative bg-white rounded-[2rem] border-2 transition-all duration-300 overflow-hidden ${
                              isActive 
                                ? 'border-indigo-100 shadow-md ring-1 ring-indigo-50/50' 
                                : 'border-gray-50 hover:border-gray-100'
                            }`}
                          >
                            <div className="p-5 flex flex-col gap-4">
                              {/* Header: Icon/Img + Toggle */}
                              <div className="flex items-center justify-between">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all overflow-hidden shadow-sm ${
                                  isActive ? 'ring-2 ring-indigo-100 ring-offset-2' : 'bg-gray-50'
                                }`}>
                                  {displayImg ? (
                                    <img src={displayImg} className="w-full h-full object-cover" />
                                  ) : (
                                    <Icon icon="solar:plate-bold-duotone" className="text-2xl text-gray-300" />
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {isActive && (
                                    <button
                                      type="button"
                                      onClick={() => setEditingHeroCategory(editingHeroCategory === category.id ? null : category.id)}
                                      className={`p-2 rounded-xl transition-all ${
                                        editingHeroCategory === category.id 
                                          ? 'bg-indigo-600 text-white shadow-lg' 
                                          : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                                      }`}
                                      title="Configurar Chip"
                                    >
                                      <Settings className="w-4 h-4" />
                                    </button>
                                  )}
                                  <Switch 
                                    checked={!!isActive} 
                                    onChange={() => toggleCategoryHero(category)}
                                  />
                                </div>
                              </div>

                              {/* Content: Title + Status */}
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h5 className="text-sm font-bold text-gray-900 truncate flex-1">{category.name}</h5>
                                  {isActive && (
                                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                      isCurrentlyVisible ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                    }`}>
                                      {isCurrentlyVisible ? (
                                        <><div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Activo</>
                                      ) : (
                                        <><Calendar className="w-2.5 h-2.5" /> Programado</>
                                      )}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-gray-400 font-medium">
                                  {isActive ? 'Visible en el carrusel principal' : 'No se muestra en el Hero'}
                                </p>
                              </div>
                            </div>
                            
                            {/* Detailed Config Panel */}
                            {editingHeroCategory === category.id && (
                              <div className="border-t border-indigo-50 bg-indigo-50/20 p-5 space-y-4 animate-in slide-in-from-top-4 duration-300">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Plato Protagonista</label>
                                    <Icon icon="solar:magic-stick-3-bold-duotone" className="text-indigo-400" />
                                  </div>
                                  
                                  <div className="grid grid-cols-1 gap-1.5 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                                    {allProducts.filter(p => p.category_id === category.id).length === 0 ? (
                                      <div className="p-4 bg-white rounded-2xl border border-dashed border-gray-100 text-center">
                                        <AlertCircle className="w-5 h-5 text-gray-200 mx-auto mb-2" />
                                        <p className="text-[10px] text-gray-400 italic">Agrega platos a esta categoría primero</p>
                                      </div>
                                    ) : allProducts.filter(p => p.category_id === category.id).map(prod => (
                                      <button
                                        key={prod.id}
                                        onClick={() => setHeroFeaturedProduct(category, prod.id)}
                                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left border-2 ${
                                          category.visibility_config?.hero_featured_product_id === prod.id 
                                            ? 'bg-white border-indigo-600 shadow-sm' 
                                            : 'bg-white/50 border-transparent hover:border-gray-100 hover:bg-white'
                                        }`}
                                      >
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden shrink-0 shadow-sm">
                                          {prod.image_url ? (
                                            <img src={prod.image_url} className="w-full h-full object-cover" />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                              <Icon icon="solar:plate-line-duotone" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className={`text-[11px] font-bold truncate ${
                                            category.visibility_config?.hero_featured_product_id === prod.id ? 'text-indigo-600' : 'text-gray-700'
                                          }`}>{prod.name}</p>
                                          <p className="text-[9px] text-gray-400 font-medium">
                                            {prod.price ? `$${(prod.price / 1000).toFixed(0)}k` : 'Consultar'}
                                          </p>
                                        </div>
                                        {category.visibility_config?.hero_featured_product_id === prod.id && (
                                          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                  <div className="space-y-1.5 pt-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                      <Icon icon="solar:gallery-bold-duotone" className="text-indigo-400" />
                                      Imagen Personalizada (URL)
                                    </label>
                                    <input
                                      type="text"
                                      value={category.visibility_config?.hero_custom_image || ''}
                                      onChange={async (e) => {
                                        const val = e.target.value;
                                        const newConfig = { ...(category.visibility_config || {}), hero_custom_image: val };
                                        
                                        // Update state locally
                                        setAllCategories(prev => prev.map(c => c.id === category.id ? { ...c, visibility_config: newConfig } : c));
                                        
                                        // Save to DB
                                        const { error } = await supabase.from('categories').update({ visibility_config: newConfig }).eq('id', category.id);
                                        if (error) toast.error('Error al guardar imagen');
                                        if (refetchMenuData) refetchMenuData();
                                      }}
                                      placeholder="https://images.unsplash.com/..."
                                      className="w-full bg-white border border-indigo-100 rounded-xl px-3 py-2 text-[11px] outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
                                    />
                                    <p className="text-[9px] text-gray-400 italic">Si dejas esto vacío, usaremos la imagen del plato seleccionado arriba.</p>
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => setEditingHeroCategory(null)}
                                  className="w-full py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                                >
                                  Listo
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}


        {/* CONTINUACIÓN TABS INICIO: COMUNIDAD */}
        {activeTab === 'inicio' && (
          <div className="space-y-5 mt-5">
            {/* FAVORITOS DE LA COMUNIDAD (MUST TRY) */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Favoritos de la Comunidad</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        (data.featured_items?.length || 0) >= 8 ? 'bg-amber-100 text-amber-700' : 'bg-[#2f4131]/10 text-[#2f4131]'
                      }`}>
                        {data.featured_items?.length || 0} / 8 Seleccionados
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 font-medium">Gestiona los platos que aparecen en la sección destacada de la Landing Page.</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase whitespace-nowrap">Título Sección:</span>
                    <input
                      value={data.featured_items_title || ''}
                      onChange={(e) => setData({ ...data, featured_items_title: e.target.value })}
                      placeholder="Ej. Must Try"
                      className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#2f4131]/10 min-w-[120px]"
                    />
                  </div>
                </div>

                {/* Filters */}
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Icon icon="heroicons:magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input 
                      type="text"
                      placeholder="Buscar producto..."
                      value={mustTrySearch}
                      onChange={(e) => setMustTrySearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#2f4131]/10 placeholder:text-gray-400"
                    />
                  </div>
                  <select
                    value={mustTryCategory}
                    onChange={(e) => setMustTryCategory(e.target.value)}
                    className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#2f4131]/10 min-w-[150px]"
                  >
                    <option value="all">Todas las Categorías</option>
                    {allCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selected List - Horizontal Scroll */}
              {data.featured_items?.length > 0 && (
                <div className="bg-gray-50/30 border-b border-gray-100 p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Orden de Visualización:</p>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {data.featured_items.map((item, idx) => (
                      <div key={item.product_id} className="relative shrink-0 group">
                        <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-[#2f4131]/20 bg-white">
                          <img src={item.img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300&auto=format&fit=crop'} alt="" className="w-full h-full object-cover" />
                        </div>
                        <button 
                          onClick={() => toggleMustTryProduct({ id: item.product_id })}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Icon icon="heroicons:x-mark" className="text-[10px] block" />
                        </button>
                        <span className="absolute -bottom-1 -right-1 bg-[#2f4131] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                          {idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Grid for Selection */}
              <div className="p-5 overflow-y-auto max-h-[400px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-gray-400">
                    <Icon icon="heroicons:magnifying-glass" className="text-3xl mb-2 mx-auto" />
                    <p className="text-sm">No se encontraron productos con esos filtros.</p>
                  </div>
                ) : (
                  filteredProducts.map(prod => {
                    const isSelected = data.featured_items?.some(item => item.product_id === prod.id);
                    const isAtLimit = (data.featured_items?.length || 0) >= 8 && !isSelected;
                    
                    return (
                      <div 
                        key={prod.id} 
                        onClick={() => !isAtLimit && toggleMustTryProduct(prod)}
                        className={`group relative flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-[#2f4131]/5 border-[#2f4131] ring-1 ring-[#2f4131]' 
                            : isAtLimit 
                              ? 'bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed'
                              : 'bg-white border-gray-100 hover:border-[#2f4131]/30 hover:shadow-md'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                          <img src={prod.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300&auto=format&fit=crop'} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 truncate leading-tight">{prod.name}</h4>
                          <p className="text-[10px] text-gray-500 font-medium">${(prod.price / 1000).toFixed(0)}k · {prod.categories?.name}</p>
                        </div>
                        <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-[#2f4131] text-white' 
                            : 'bg-gray-100 text-gray-400 group-hover:bg-[#2f4131]/10 group-hover:text-[#2f4131]'
                        }`}>
                          <Icon icon={isSelected ? "heroicons:check-16-solid" : "heroicons:plus-16-solid"} className={isSelected ? "text-xs" : "text-sm"} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* TESTIMONIOS */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Voces de la Comunidad</h3>
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
        {/* TAB 2: MENÚ (CARTA DIGITAL) */}
        {activeTab === 'menu' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
            {/* HERO SETTINGS */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-gray-200/20 transition-all duration-500">
              <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
                    <Icon icon="solar:book-bookmark-bold-duotone" className="text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-1">Digital Menu Hero</h3>
                    <h2 className="text-lg font-bold text-gray-900 leading-tight">Portada de la Carta</h2>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Form Side */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                      <FormField label="Título del Banner">
                        <TextInput 
                          value={data.menu_banner_title || ''} 
                          onChange={(e) => setData({ ...data, menu_banner_title: e.target.value })} 
                          placeholder="Ej. Nuestra Carta" 
                          className="bg-gray-50 border-gray-50 focus:bg-white focus:border-emerald-100 rounded-2xl p-4"
                        />
                      </FormField>

                      <FormField label="Tag Superior (Chip)">
                        <TextInput 
                          value={data.menu_banner_tag || ''} 
                          onChange={(e) => setData({ ...data, menu_banner_tag: e.target.value })} 
                          placeholder="Ej. Selección de Temporada" 
                          className="bg-gray-50 border-gray-50 focus:bg-white focus:border-emerald-100 rounded-2xl p-4"
                        />
                      </FormField>
                    </div>

                    <FormField label="Descripción / Copy de Bienvenida">
                      <textarea 
                        value={data.menu_banner_subtitle || ''} 
                        onChange={(e) => setData({ ...data, menu_banner_subtitle: e.target.value })} 
                        className="w-full bg-gray-50 border-2 border-gray-50 rounded-[1.5rem] p-5 text-sm font-medium text-gray-600 outline-none focus:bg-white focus:border-emerald-100 transition-all placeholder:text-gray-300 min-h-[120px] shadow-inner resize-none"
                        placeholder="Describe brevemente la esencia de tu cocina..."
                      />
                    </FormField>
                  </div>

                  {/* Preview Side */}
                  <div className="space-y-6">
                    <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">Previsualización del Banner</label>
                    <div className="relative aspect-[16/9] rounded-[2.5rem] overflow-hidden bg-gray-100 shadow-2xl border-4 border-white group">
                      {data.menu_banner_img ? (
                        <img src={data.menu_banner_img} alt="Menu Banner" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-3 border-2 border-dashed border-gray-200 m-2 rounded-[2rem]">
                          <Icon icon="solar:gallery-upload-bold-duotone" className="text-4xl opacity-50" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Sube una imagen de fondo</span>
                        </div>
                      )}
                      
                      {/* Floating Badge (Preview of tag) */}
                      {data.menu_banner_tag && (
                        <div className="absolute top-6 left-6 px-4 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white text-[10px] font-bold uppercase tracking-wider shadow-lg">
                          {data.menu_banner_tag}
                        </div>
                      )}

                      {/* Content Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end p-8">
                        <h4 className="text-white text-2xl font-bold leading-tight mb-2 drop-shadow-md">
                          {data.menu_banner_title || 'Título del Menú'}
                        </h4>
                      </div>

                      {/* Upload Button */}
                      <div className="absolute top-4 right-4 group-hover:opacity-100 transition-opacity">
                        <label className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-xl cursor-pointer hover:bg-emerald-500 hover:text-white transition-all">
                          {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon icon="solar:camera-bold-duotone" className="text-xl" />}
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleImageUpload(e, 'menu_banner_img')}
                            disabled={uploadingImage}
                          />
                        </label>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 text-center font-medium italic">Recomendamos imágenes horizontales de 1920x1080px</p>
                  </div>
                </div>

                {/* HELP CARD MENU */}
                <div className="mt-12 p-6 bg-emerald-50/50 border-2 border-emerald-50 rounded-[2rem] flex flex-col sm:flex-row gap-6 items-center relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/20 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-emerald-200/30 transition-colors" />
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
                    <Icon icon="solar:lightbulb-bold-duotone" className="text-white text-3xl" />
                  </div>
                  <div className="relative z-10 flex-1">
                    <h4 className="text-[14px] font-bold text-emerald-900 uppercase tracking-tight">Consejo de Diseño Digital</h4>
                    <p className="text-[11px] text-emerald-700/80 mt-1 font-bold leading-relaxed">
                      "Menos es más". Usa un título corto y directo. Una imagen limpia de tu local o un plano detalle de un plato genera más confianza y apetito visual.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'experiences' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
            {/* HERO SETTINGS */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-gray-200/20 transition-all duration-500">
              <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm">
                    <Icon icon="solar:star-fall-bold-duotone" className="text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-1">Momentos & Eventos</h3>
                    <h2 className="text-lg font-bold text-gray-900 leading-tight">Módulo de Experiencias</h2>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Form Side */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                      <FormField label="Título Inspirador (H1)">
                        <TextInput 
                          value={data.experiences_h1 || ''} 
                          onChange={(e) => setData({ ...data, experiences_h1: e.target.value })} 
                          placeholder="Ej. Momentos Únicos" 
                          className="bg-gray-50 border-gray-50 focus:bg-white focus:border-purple-100 rounded-2xl p-4"
                        />
                      </FormField>

                      <FormField label="Tag de Exclusividad">
                        <TextInput 
                          value={data.experiences_tag || ''} 
                          onChange={(e) => setData({ ...data, experiences_tag: e.target.value })} 
                          placeholder="Ej. Edición Limitada" 
                          className="bg-gray-50 border-gray-50 focus:bg-white focus:border-purple-100 rounded-2xl p-4"
                        />
                      </FormField>
                    </div>

                    <FormField label="Copy Redaccional">
                      <textarea 
                        value={data.experiences_subtitle || ''} 
                        onChange={(e) => setData({ ...data, experiences_subtitle: e.target.value })} 
                        className="w-full bg-gray-50 border-2 border-gray-50 rounded-[1.5rem] p-5 text-sm font-medium text-gray-600 outline-none focus:bg-white focus:border-purple-100 transition-all placeholder:text-gray-300 min-h-[120px] shadow-inner resize-none"
                        placeholder="Invita a tus clientes a descubrir tus eventos..."
                      />
                    </FormField>
                  </div>

                  {/* Preview Side */}
                  <div className="space-y-6">
                    <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">Preview de Sección</label>
                    <div className="relative aspect-[16/9] rounded-[2.5rem] overflow-hidden bg-gray-100 shadow-2xl border-4 border-white group">
                      {data.experiences_img ? (
                        <img src={data.experiences_img} alt="Experience Hero" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-3 border-2 border-dashed border-gray-200 m-2 rounded-[2rem]">
                          <Icon icon="solar:video-library-bold-duotone" className="text-4xl opacity-50" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Sube una imagen épica</span>
                        </div>
                      )}
                      
                      {/* Floating Badge */}
                      {data.experiences_tag && (
                        <div className="absolute top-6 left-6 px-4 py-1.5 bg-purple-600/20 backdrop-blur-md border border-purple-400/30 rounded-full text-white text-[10px] font-bold uppercase tracking-wider shadow-lg">
                          {data.experiences_tag}
                        </div>
                      )}

                      {/* Content Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-950/60 via-transparent to-transparent flex flex-col justify-end p-8">
                        <h4 className="text-white text-2xl font-bold leading-tight mb-2 drop-shadow-md">
                          {data.experiences_h1 || 'Título de Experiencia'}
                        </h4>
                      </div>

                      {/* Upload Button */}
                      <div className="absolute top-4 right-4 group-hover:opacity-100 transition-opacity">
                        <label className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-xl cursor-pointer hover:bg-purple-600 hover:text-white transition-all">
                          {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon icon="solar:camera-bold-duotone" className="text-xl" />}
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleImageUpload(e, 'experiences_img')}
                            disabled={uploadingImage}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* TAB 4: ASISTENTES AI (BRAIN) */}
        {activeTab === 'ai' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* AI BRAIN HUB */}
            <div className="bg-slate-950 rounded-[3rem] overflow-hidden shadow-2xl relative border border-white/5 group">
              {/* Dynamic Glows */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse" />
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[100px] -ml-48 -mb-48" />
              
              <div className="relative z-10 p-10 lg:p-14 space-y-12">
                {/* Header AI */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full">
                      <div className="relative">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping absolute inset-0" />
                        <div className="w-2 h-2 bg-emerald-500 rounded-full relative" />
                      </div>
                      <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Neural Engine Active</span>
                    </div>
                    <h2 className="text-4xl font-bold text-white tracking-tight">Cerebro Digital <span className="text-emerald-400">Gemini</span></h2>
                    <p className="text-slate-400 text-sm max-w-xl font-medium leading-relaxed">
                      Configura la personalidad y el conocimiento de tus asistentes virtuales. Estos parámetros dictan cómo la inteligencia artificial interactúa con tus clientes.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500 border-2 border-slate-950 flex items-center justify-center shadow-xl">
                        <Icon icon="solar:cpu-bold" className="text-white text-lg" />
                      </div>
                      <div className="w-10 h-10 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center shadow-xl">
                        <Icon icon="solar:sparkles-bold" className="text-white text-lg" />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">Dual Model Config</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                  {/* CONCIERGE BLOCK */}
                  <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-[2.5rem] p-8 space-y-8 hover:bg-white/[0.05] transition-colors duration-500">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-900/40">
                        <Icon icon="solar:chef-hat-heart-bold-duotone" className="text-white text-3xl" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">Conserje Gastronómico</h3>
                        <p className="text-emerald-400/60 text-[10px] font-bold uppercase tracking-wider">Módulo de Atención & Ventas</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label={<span className="text-slate-400">Título UI</span>}>
                          <TextInput 
                            value={data.concierge_h1 || ''} 
                            onChange={(e) => setData({ ...data, concierge_h1: e.target.value })} 
                            className="bg-white/5 border-white/10 text-white focus:ring-emerald-500/20 rounded-xl"
                            placeholder="Ej. Tu Asistente Personal" 
                          />
                        </FormField>
                        <FormField label={<span className="text-slate-400">Color Marca</span>}>
                          <div className="flex items-center gap-2">
                             <input type="color" value={data.concierge_bg_color || '#000'} onChange={(e) => setData({...data, concierge_bg_color: e.target.value})} className="w-10 h-10 rounded-lg overflow-hidden bg-transparent border-none cursor-pointer" />
                             <TextInput value={data.concierge_bg_color || ''} onChange={(e) => setData({...data, concierge_bg_color: e.target.value})} className="bg-white/5 border-white/10 text-white focus:ring-emerald-500/20 rounded-xl flex-1" />
                          </div>
                        </FormField>
                      </div>

                      <FormField label={<span className="text-slate-400">Instrucciones del Sistema (System Prompt)</span>}>
                        <div className="relative group">
                           <div className="absolute -inset-px bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                           <textarea 
                             value={data.concierge_prompt_template || ''}
                             onChange={(e) => setData({ ...data, concierge_prompt_template: e.target.value })}
                             className="relative w-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 text-xs font-mono text-emerald-400 h-40 focus:ring-2 focus:ring-emerald-500/40 outline-none scrollbar-thin resize-none"
                             placeholder="Eres un sumiller experto y conocedor de la carta de Alto Andino..."
                           />
                        </div>
                      </FormField>

                      <div className="p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex items-start gap-3">
                         <Icon icon="solar:info-circle-bold-duotone" className="text-emerald-500 text-xl shrink-0 mt-0.5" />
                         <p className="text-[10px] text-emerald-400 font-medium leading-relaxed italic">
                           TIP: Define aquí el tono de voz (formal, jovial, experto) y las reglas de oro (no hablar de política, recomendar platos maridados, etc).
                         </p>
                      </div>
                    </div>
                  </div>

                  {/* EVENT PLANNER BLOCK */}
                  <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-[2.5rem] p-8 space-y-8 hover:bg-white/[0.05] transition-colors duration-500">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-900/40">
                        <Icon icon="solar:magic-stick-3-bold-duotone" className="text-white text-3xl" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">Planner de Eventos</h3>
                        <p className="text-indigo-400/60 text-[10px] font-bold uppercase tracking-wider">Módulo de Reservas & Social</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label={<span className="text-slate-400">Título UI</span>}>
                          <TextInput 
                            value={data.event_planner_h1 || ''} 
                            onChange={(e) => setData({ ...data, event_planner_h1: e.target.value })} 
                            className="bg-white/5 border-white/10 text-white focus:ring-indigo-500/20 rounded-xl"
                            placeholder="Ej. Planea tu Noche" 
                          />
                        </FormField>
                        <FormField label={<span className="text-slate-400">Color Marca</span>}>
                          <div className="flex items-center gap-2">
                             <input type="color" value={data.event_planner_bg_color || '#000'} onChange={(e) => setData({...data, event_planner_bg_color: e.target.value})} className="w-10 h-10 rounded-lg overflow-hidden bg-transparent border-none cursor-pointer" />
                             <TextInput value={data.event_planner_bg_color || ''} onChange={(e) => setData({...data, event_planner_bg_color: e.target.value})} className="bg-white/5 border-white/10 text-white focus:ring-indigo-500/20 rounded-xl flex-1" />
                          </div>
                        </FormField>
                      </div>

                      <FormField label={<span className="text-slate-400">Lógica Personalizada (System Prompt)</span>}>
                        <div className="relative group">
                           <div className="absolute -inset-px bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                           <textarea 
                             value={data.event_planner_prompt_template || ''}
                             onChange={(e) => setData({ ...data, event_planner_prompt_template: e.target.value })}
                             className="relative w-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 text-xs font-mono text-indigo-400 h-40 focus:ring-2 focus:ring-indigo-500/40 outline-none scrollbar-thin resize-none"
                             placeholder="Tu misión es diseñar eventos memorables..."
                           />
                        </div>
                      </FormField>

                      <div className="p-5 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 flex items-start gap-3">
                         <Icon icon="solar:notification-lines-remove-bold-duotone" className="text-indigo-500 text-xl shrink-0 mt-0.5" />
                         <p className="text-[10px] text-indigo-400 font-medium leading-relaxed italic">
                           TIP: Configúralo para que sea proactivo preguntando el número de personas, el motivo y si requieren decoración especial.
                         </p>
                      </div>
                    </div>
                  </div>
                </div>
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
