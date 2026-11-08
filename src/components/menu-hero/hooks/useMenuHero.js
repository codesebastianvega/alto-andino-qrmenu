import { useState, useMemo, useCallback } from 'react';
import { useMenuData } from '../../../context/MenuDataContext';
import { useAuth } from '../../../context/AuthContext';
import { useLogoContrast } from '../../../hooks/useLogoContrast';
import { getTimeContext } from '../data/heroGuideData';
import { useHeroFoodGuide } from './useHeroFoodGuide';

export function useMenuHero({ categories = [], setActiveCategory }) {
  const { label: greeting } = getTimeContext();
  const [user] = useState({ name: 'Invitado', isLogged: false });
  const {
    homeSettings,
    restaurantSettings,
    categories: activeCategories = [],
    productsByCategory = {},
    currentLocation,
    locations,
    getAllProducts,
    brand: menuBrand,
    storeStatusInfo
  } = useMenuData();

  const { activeBrand } = useAuth();

  const effectiveBrand = menuBrand || (activeBrand?.id === restaurantSettings?.brand_id ? activeBrand : null);
  const brandName = restaurantSettings?.business_name || effectiveBrand?.name || 'Aluna';
  const rawLogo = restaurantSettings?.logo_url?.trim() || effectiveBrand?.logo_url?.trim() || null;
  const logoUrl = rawLogo && rawLogo.length > 0 ? rawLogo : null;
  const logoContrast = useLogoContrast(logoUrl, 'light');
  const isLightLogo = logoContrast === 'light';
  const primaryColor = restaurantSettings?.primary_color || '#4A7856';
  const accentColor = restaurantSettings?.theme_secondary || '#E6B05C';
  const heroBg = restaurantSettings?.theme_background || '#F5F5F7';
  const displayLocation = currentLocation || locations?.find((loc) => loc.is_main) || locations?.[0];
  const locationLabel = displayLocation?.name || brandName;
  const locationHint = storeStatusInfo?.isOpen === false ? 'Modo Vitrina' : (displayLocation?.city || displayLocation?.address || 'Listo para ordenar');
  
  const [menuBannerError, setMenuBannerError] = useState(false);

  const bannerProduct = useMemo(() => {
    if (!homeSettings?.menu_banner_product_id || typeof getAllProducts !== 'function') return null;
    return getAllProducts()?.find((p) => p.id === homeSettings.menu_banner_product_id) || null;
  }, [homeSettings?.menu_banner_product_id, getAllProducts]);

  const handleBannerClick = useCallback(() => {
    if (bannerProduct) {
      window.dispatchEvent(new CustomEvent('aa:quickview', { detail: bannerProduct }));
      return;
    }

    if (
      homeSettings?.menu_banner_tag?.toLowerCase().includes('asistente') ||
      homeSettings?.menu_banner_tag?.toLowerCase().includes('mesero') ||
      homeSettings?.menu_banner_tag?.toLowerCase().includes('ia')
    ) {
      window.location.hash = '#asistente';
      return;
    }

    const el = document.getElementById('menu-categories') || document.querySelector('.category-tabs') || document.querySelector('main');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [bannerProduct, homeSettings?.menu_banner_tag]);

  const featuredTargetSlug = useMemo(() => {
    const conceptConfig = (restaurantSettings?.brand_concepts || []).find(
      (c) => c && (c.id === 'featured_cta_config' || c.id === 'bento_del_dia_config' || c.id === 'daily_special_config')
    );
    if (conceptConfig?.target_category_slug) return conceptConfig.target_category_slug;
    if (homeSettings?.hero_cta_target) return homeSettings.hero_cta_target;
    if (restaurantSettings?.featured_category_slug) return restaurantSettings.featured_category_slug;
    if (effectiveBrand?.slug === 'boku-bento') return 'boku-bentos';
    return categories?.[0]?.slug || 'todos';
  }, [restaurantSettings?.brand_concepts, restaurantSettings?.featured_category_slug, homeSettings?.hero_cta_target, effectiveBrand?.slug, categories]);

  const featuredButtonLabel = useMemo(() => {
    const conceptConfig = (restaurantSettings?.brand_concepts || []).find(
      (c) => c && (c.id === 'featured_cta_config' || c.id === 'bento_del_dia_config' || c.id === 'daily_special_config')
    );
    if (conceptConfig?.button_label) return conceptConfig.button_label;
    if (homeSettings?.hero_cta_label) return homeSettings.hero_cta_label;
    if (effectiveBrand?.slug === 'boku-bento') return 'Ver Pokes del Día ($22.000)';
    return 'Ver Especial del Día';
  }, [restaurantSettings?.brand_concepts, homeSettings?.hero_cta_label, effectiveBrand?.slug]);

  const handleScrollToFeatured = useCallback(() => {
    const targetId = `section-${featuredTargetSlug}`;
    const targetEl = document.getElementById(targetId) || document.getElementById(featuredTargetSlug);
    if (targetEl) {
      const headerOffset = 76;
      const elementPosition = targetEl.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      if (typeof setActiveCategory === 'function') {
        setActiveCategory(featuredTargetSlug);
      }
    } else {
      const catalogEl = document.getElementById('catalog-content') || document.querySelector('section');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [featuredTargetSlug, setActiveCategory]);

  const foodGuide = useHeroFoodGuide({
    activeCategories,
    productsByCategory
  });

  return {
    user,
    greeting,
    homeSettings,
    storeStatusInfo,
    effectiveBrand,
    brandName,
    logoUrl,
    isLightLogo,
    primaryColor,
    accentColor,
    heroBg,
    locationLabel,
    locationHint,
    menuBannerError,
    setMenuBannerError,
    bannerProduct,
    handleBannerClick,
    featuredButtonLabel,
    handleScrollToFeatured,
    foodGuide
  };
}
