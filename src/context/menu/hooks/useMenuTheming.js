import { useEffect } from 'react';

export function useMenuTheming({ restaurantSettings, brand, homeSettings }) {
  // Inject CSS Variables for Dynamic Theming & Favicon
  useEffect(() => {
    if (!restaurantSettings) return;
    try {
      const root = document.documentElement;
      const isBoku =
        brand?.slug === 'boku-bento' ||
        (restaurantSettings?.business_name || '').toLowerCase().includes('boku');
      const defaultPrimary = isBoku ? '#bc0e0e' : '#2f4131';
      const colors = {
        '--color-brand-primary': restaurantSettings.primary_color || defaultPrimary,
        '--color-brand-secondary':
          restaurantSettings.theme_secondary || (isBoku ? '#8a0a0a' : '#7db87a'),
        '--color-brand-bg': restaurantSettings.theme_background || (isBoku ? '#fdfcfc' : '#f9f8f6'),
        '--color-brand-card': restaurantSettings.theme_card_bg || '#ffffff',
        '--color-brand-text': restaurantSettings.theme_text || (isBoku ? '#1c1917' : '#2c3e2d'),
        '--color-brand-footer':
          restaurantSettings.theme_footer_bg || (isBoku ? '#1a0505' : '#2f4131'),
      };
      Object.entries(colors).forEach(([k, v]) => root.style.setProperty(k, v));

      const faviconUrl = isBoku
        ? '/boku-favicon.png'
        : restaurantSettings.favicon_url || '/favicon.png';
      const iconLinks = document.querySelectorAll("link[rel~='icon']");
      if (iconLinks.length > 0) {
        iconLinks.forEach((link) => {
          link.href = faviconUrl;
        });
      } else {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = faviconUrl;
        document.head.appendChild(link);
      }
    } catch (err) {
      console.error('Error applying theme/favicon:', err);
    }
  }, [restaurantSettings, brand]);

  // Inject Meta and OpenGraph tags
  useEffect(() => {
    if (!brand) return;
    const bName = restaurantSettings?.business_name || brand?.name || 'Boku Bento';
    const bDesc =
      homeSettings?.hero_subtitle || brand?.description || 'Menú Digital Interactivo';
    const bShareImage =
      homeSettings?.menu_banner_img ||
      homeSettings?.welcome_bg_img ||
      restaurantSettings?.logo_url ||
      brand?.logo_url;

    document.title = `${bName} | Menú Digital`;

    const setMeta = (attrName, attrVal, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('property', 'og:title', `${bName} | Menú Digital`);
    setMeta('property', 'og:description', bDesc);
    if (bShareImage) {
      setMeta('property', 'og:image', bShareImage);
      setMeta('property', 'og:image:secure_url', bShareImage);
      setMeta('name', 'twitter:image', bShareImage);
    }
    setMeta('property', 'og:url', window.location.href);
    setMeta('property', 'og:type', 'website');
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', `${bName} | Menú Digital`);
    setMeta('name', 'twitter:description', bDesc);
  }, [brand, restaurantSettings, homeSettings]);
}
