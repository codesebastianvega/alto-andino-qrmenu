import { useState, useEffect, useImperativeHandle } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { useMenuData } from '../../context/MenuDataContext';
import { toast as toastFn } from '../../components/Toast';
import { validateImageSize, compressAndWebp } from '../../utils/images';

const toast = {
  success: (msg, opts) => toastFn.success(msg, { duration: 2500, ...opts }),
  error: (msg, opts) => toastFn.error(msg, { duration: 4000, ...opts }),
};

export const FONT_OPTIONS = [
  { label: 'Inter (Sans Serif)', value: 'Inter' },
  { label: 'Roboto (Moderno)', value: 'Roboto' },
  { label: 'Outfit (Premium)', value: 'Outfit' },
  { label: 'Playfair Display (Elegante)', value: 'Playfair Display' },
  { label: 'Montserrat (Geométrico)', value: 'Montserrat' },
];

export const DEFAULT_BRANDING_FORM = {
  business_name: '',
  primary_color: '#7db87a',
  logo_url: '',
  theme_secondary: '#E6B05C',
  theme_background: '#FAFAFA',
  theme_card_bg: '#FFFFFF',
  theme_text: '#1A1A1A',
  theme_footer_bg: '#1A2421',
  favicon_url: '',
  font_family: 'Inter',
  brand_concepts: [],
};

export function useAdminBrandingData(ref) {
  const { activeBrand, activePlan, isFeatureLocked, refreshProfile, user } = useAuth();
  const { refetchMenuData } = useMenuData();

  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState(DEFAULT_BRANDING_FORM);
  const [isSubmittingSettings, setIsSubmittingSettings] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  useEffect(() => {
    if (activeBrand?.id) {
      fetchSettings();
    }
  }, [activeBrand?.id]);

  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const [settingsRes, brandRes] = await Promise.all([
        supabase
          .from('restaurant_settings')
          .select('*')
          .eq('brand_id', activeBrand.id)
          .order('location_id', { ascending: true, nullsFirst: true })
          .limit(1)
          .maybeSingle(),
        supabase.from('brands').select('name, logo_url').eq('id', activeBrand.id).single(),
      ]);

      if (settingsRes.error) throw settingsRes.error;

      const data = settingsRes.data;

      if (data) {
        setSettings(data);
        setSettingsForm({
          business_name: data.business_name || activeBrand.name || '',
          primary_color: data.primary_color || '#7db87a',
          logo_url: data.logo_url || activeBrand.logo_url || '',
          theme_secondary: data.theme_secondary || '#E6B05C',
          theme_background: data.theme_background || '#FAFAFA',
          theme_card_bg: data.theme_card_bg || '#FFFFFF',
          theme_text: data.theme_text || '#1A1A1A',
          theme_footer_bg: data.theme_footer_bg || '#1A2421',
          favicon_url: data.favicon_url || '',
          font_family: data.font_family || 'Inter',
          brand_concepts: (data.brand_concepts || []).filter(
            (c) =>
              c &&
              c.id !== 'operations_model' &&
              c.id !== 'telegram_dispatch' &&
              !c.fulfillment_modes &&
              !c.bot_token
          ),
        });
      } else {
        setSettingsForm((prev) => ({
          ...prev,
          business_name: activeBrand.name || '',
          logo_url: activeBrand.logo_url || '',
        }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar configuración de branding');
    } finally {
      setLoadingSettings(false);
    }
  };

  const addConcept = () => {
    const newConcept = {
      id: crypto.randomUUID(),
      name: 'Nuevo Concepto',
      description: '',
      image_url: '',
      accent_color: settingsForm.primary_color,
    };
    setSettingsForm((prev) => ({
      ...prev,
      brand_concepts: [...(prev.brand_concepts || []), newConcept],
    }));
  };

  const removeConcept = (id) => {
    setSettingsForm((prev) => ({
      ...prev,
      brand_concepts: prev.brand_concepts.filter((c) => c.id !== id),
    }));
  };

  const updateConcept = (id, field, value) => {
    setSettingsForm((prev) => ({
      ...prev,
      brand_concepts: prev.brand_concepts.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    }));
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    if (!activeBrand?.id) return;

    setIsSubmittingSettings(true);
    try {
      const existingConcepts = Array.isArray(settings?.brand_concepts)
        ? settings.brand_concepts
        : [];
      const systemConcepts = existingConcepts.filter(
        (c) =>
          c &&
          (c.id === 'operations_model' ||
            c.id === 'telegram_dispatch' ||
            c.fulfillment_modes ||
            c.bot_token)
      );

      const payload = {
        brand_id: activeBrand.id,
        location_id: null,
        business_name: settingsForm.business_name,
        primary_color: settingsForm.primary_color,
        logo_url: settingsForm.logo_url,
        theme_secondary: settingsForm.theme_secondary,
        theme_background: settingsForm.theme_background,
        theme_card_bg: settingsForm.theme_card_bg,
        theme_text: settingsForm.theme_text,
        theme_footer_bg: settingsForm.theme_footer_bg,
        favicon_url: settingsForm.favicon_url,
        font_family: settingsForm.font_family,
        brand_concepts: [...systemConcepts, ...(settingsForm.brand_concepts || [])],
        updated_at: new Date(),
      };

      const brandPayload = {
        name: settingsForm.business_name,
        logo_url: settingsForm.logo_url || null,
      };

      const settingsQuery = settings?.id
        ? supabase
            .from('restaurant_settings')
            .update(payload)
            .eq('id', settings.id)
            .select()
            .single()
        : supabase.from('restaurant_settings').insert(payload).select().single();

      const [settingsRes, brandRes] = await Promise.all([
        settingsQuery,
        supabase.from('brands').update(brandPayload).eq('id', activeBrand.id),
      ]);

      if (settingsRes.error) throw settingsRes.error;
      if (brandRes.error) throw brandRes.error;

      if (settingsRes.data) setSettings(settingsRes.data);

      const faviconUrl = settingsRes.data?.favicon_url || '/favicon.png';
      document.querySelectorAll("link[rel~='icon']").forEach((link) => {
        link.href = faviconUrl;
      });

      toast.success('¡Branding y perfil guardados correctamente!');
      if (user) refreshProfile(user.id);
      await refetchMenuData?.();
    } catch (err) {
      console.error('Error saving branding:', err);
      toast.error('Error guardando configuración de branding');
    } finally {
      setIsSubmittingSettings(false);
    }
  };

  useImperativeHandle(
    ref,
    () => ({
      save: handleSaveSettings,
    }),
    [activeBrand, settingsForm, user]
  );

  const isLocked = isFeatureLocked('branding');
  const isEmprendedor = activePlan?.name === 'Emprendedor';
  const isAdvancedLocked = isEmprendedor;

  const handleFileUpload = async (e, type) => {
    if (type === 'favicon' && isAdvancedLocked) {
      toast.error('Actualiza tu plan para personalizar el favicon');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateImageSize(file, toast, activeBrand?.plan_id)) return;

    if (type === 'logo') setUploadingLogo(true);
    else setUploadingFavicon(true);

    try {
      const compressedFile = await compressAndWebp(file, { maxWidthOrHeight: 800, maxSizeMB: 0.1 });
      const fileName = `${activeBrand.id}/${type}_${Date.now()}.webp`;
      const filePath = `branding/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, compressedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setSettingsForm((prev) => ({ ...prev, [`${type}_url`]: publicData.publicUrl }));
      toast.success(`${type === 'logo' ? 'Logo' : 'Favicon'} subido correctamente`);
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      toast.error(`Error subiendo ${type}`);
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingFavicon(false);
      if (e.target) e.target.value = '';
    }
  };

  return {
    activeBrand,
    activePlan,
    settings,
    loadingSettings,
    settingsForm,
    setSettingsForm,
    isSubmittingSettings,
    uploadingLogo,
    uploadingFavicon,
    isLocked,
    isAdvancedLocked,
    addConcept,
    removeConcept,
    updateConcept,
    handleSaveSettings,
    handleFileUpload,
  };
}
