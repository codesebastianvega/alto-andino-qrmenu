import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { useMenuData } from '../../context/MenuDataContext';
import { toast as toastFn } from '../../components/Toast';
import { validateImageSize, compressAndWebp } from '../../utils/images';

const toast = {
  success: (msg) => toastFn(msg, { duration: 2000 }),
  error: (msg) => toastFn(msg, { duration: 3000 }),
};

export function useAdminWebContentData() {
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
  const brandingRef = useRef(null);

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
    footer_thanks_message: '',
    footer_greeting_morning: '',
    footer_greeting_afternoon: '',
    footer_greeting_night: '',
    footer_tagline: '',
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
    welcome_bg_img: '',
    show_menu_banner: true,
    menu_banner_product_id: ''
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [allCategories, setAllCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [editingHeroCategory, setEditingHeroCategory] = useState(null);
  const [allProducts, setAllProducts] = useState([]);

  // Search and Filter for Must Try
  const [mustTrySearch, setMustTrySearch] = useState('');
  const [mustTryCategory, setMustTryCategory] = useState('all');

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
        let morning = '';
        let afternoon = '';
        let night = '';
        if (data.footer_thanks_message) {
          try {
            if (data.footer_thanks_message.startsWith('{')) {
              const parsed = JSON.parse(data.footer_thanks_message);
              morning = parsed.morning || '';
              afternoon = parsed.afternoon || '';
              night = parsed.night || '';
            } else {
              night = data.footer_thanks_message;
            }
          } catch {
            night = data.footer_thanks_message;
          }
        }
        setData(prev => ({
          ...prev,
          ...data,
          footer_greeting_morning: morning,
          footer_greeting_afternoon: afternoon,
          footer_greeting_night: night,
          show_menu_banner: data.show_menu_banner !== false,
          menu_banner_product_id: data.menu_banner_product_id || '',
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

      setAllCategories(prev => prev.map(c =>
        c.id === category.id ? { ...c, visibility_config: newConfig } : c
      ));

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
      if (activeTab === 'branding') {
        if (brandingRef.current?.save) {
          await brandingRef.current.save();
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        return;
      }

      const thanksPayload = JSON.stringify({
        morning: data.footer_greeting_morning || '',
        afternoon: data.footer_greeting_afternoon || '',
        night: data.footer_greeting_night || ''
      });

      const payload = {
        hero_h1: data.hero_h1 || null,
        hero_subtitle: data.hero_subtitle || null,
        hero_emojis: data.hero_emojis || null,
        footer_thanks_message: thanksPayload,
        footer_tagline: data.footer_tagline || null,
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
        show_menu_banner: data.show_menu_banner !== false,
        updated_at: new Date().toISOString()
      };

      let saveError = null;
      let savedRecordId = data.id;

      if (!savedRecordId) {
        const { data: existingRecord } = await supabase
          .from('home_settings')
          .select('id')
          .eq('brand_id', activeBrand.id)
          .maybeSingle();

        if (existingRecord?.id) {
          savedRecordId = existingRecord.id;
        }
      }

      if (savedRecordId) {
        const { error } = await supabase
          .from('home_settings')
          .update({
            ...payload,
            brand_id: activeBrand.id
          })
          .eq('id', savedRecordId);
        saveError = error;
      } else {
        const { data: inserted, error } = await supabase
          .from('home_settings')
          .insert([{
            ...payload,
            brand_id: activeBrand.id
          }])
          .select('id')
          .single();
        saveError = error;
        if (inserted?.id) {
          savedRecordId = inserted.id;
        }
      }

      if (saveError) throw saveError;
      if (savedRecordId && savedRecordId !== data.id) {
        setData(prev => ({ ...prev, id: savedRecordId }));
      }

      if (data.footer_tagline && activeBrand?.id) {
        await supabase.from('brands')
          .update({ description: data.footer_tagline })
          .eq('id', activeBrand.id);
      }

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

  const toggleMustTryProduct = (product) => {
    if (!product?.id) return;
    const currentItems = data?.featured_items || [];
    const isSelected = currentItems.some(item => item?.product_id === product.id);

    if (isSelected) {
      setData({
        ...data,
        featured_items: currentItems.filter(item => item?.product_id !== product.id)
      });
    } else {
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

    if (!validateImageSize(file, toast)) return;

    setUploadingImage(true);
    try {
      const compressedFile = await compressAndWebp(file, { maxWidthOrHeight: 1600, maxSizeMB: 0.3 });
      const fileName = `${activeBrand.id}/landing_${field}_${Date.now()}.webp`;
      const filePath = `branding/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, compressedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setData(prev => ({ ...prev, [field]: publicData.publicUrl }));
      toast.success('Imagen subida correctamente');
    } catch (error) {
      console.error(error);
      toast.error('Error al subir imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  return {
    activeBrand,
    activeTab,
    setActiveTab,
    brandingRef,
    loading,
    submitting,
    saved,
    data,
    setData,
    allCategories,
    loadingCategories,
    editingHeroCategory,
    setEditingHeroCategory,
    allProducts,
    mustTrySearch,
    setMustTrySearch,
    mustTryCategory,
    setMustTryCategory,
    filteredProducts,
    uploadingImage,
    emojiPickerOpen,
    setEmojiPickerOpen,
    toggleCategoryHero,
    setHeroFeaturedProduct,
    toggleMustTryProduct,
    handleAddItem,
    handleRemoveItem,
    handleChangeItem,
    handleImageUpload,
    handleSave
  };
}
