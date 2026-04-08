import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../config/supabase';

const BrandContext = createContext({});

export const BrandProvider = ({ children }) => {
  const [brand, setBrand] = useState(null);
  const [features, setFeatures] = useState([]);
  const [loadingBrand, setLoadingBrand] = useState(true);
  const { brand_slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const resolveCurrentBrand = useCallback(async () => {
    try {
      setLoadingBrand(true);
      // 1. Resolvemos por slug de URL si está presente
      let brandBySlug = null;
      let targetBrandId = null;
      if (brand_slug) {
        const { data } = await supabase
          .from('brands')
          .select('id, slug, name')
          .eq('slug', brand_slug)
          .maybeSingle();
        brandBySlug = data;
      }

      // 2. Modo Admin: Verificamos perfil
      const is_admin_view = location.hash.includes('#admin');
      if (is_admin_view) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('brand_id, brand:brands(id, slug, name)')
            .eq('id', session.user.id)
            .maybeSingle();
            
          if (profile?.brand_id) {
            // Sincronización: Si el slug URL no coincide con el perfil, redirigimos
            if (brandBySlug && brandBySlug.id !== profile.brand_id) {
              console.warn(`Mismatch: URL=${brand_slug} Profile=${profile.brand?.slug}. Redirigiendo...`);
              if (profile.brand?.slug) {
                const newPath = `/${profile.brand.slug}/${location.search}${location.hash}`;
                navigate(newPath, { replace: true });
                return; // Evitar carga doble
              }
            }
            targetBrandId = profile.brand_id;
          }
        }
      }

      // 3. Fallback Público
      if (!targetBrandId && brandBySlug) {
        targetBrandId = brandBySlug.id;
      }

      if (targetBrandId) {
        const { data: brandData, error } = await supabase
          .from('brands')
          .select('*, plans(id, name)')
          .eq('id', targetBrandId)
          .single();

        if (!error && brandData) {
          setBrand(brandData);

          if (brandData.plan_id) {
            const { data: featuresData } = await supabase
              .from('plan_features')
              .select('*')
              .eq('plan_id', brandData.plan_id)
              .eq('is_included', true);
            
            setFeatures(featuresData || []);
          }
        }
      } else {
        setBrand(null);
        setFeatures([]);
      }
    } catch (error) {
      console.error('Error resolving brand:', error);
    } finally {
      setLoadingBrand(false);
    }
  }, [brand_slug, location.hash, location.search, navigate]);

  useEffect(() => {
    resolveCurrentBrand();
  }, [resolveCurrentBrand]);

  const hasFeature = (featureKey) => {
    if (!features || features.length === 0) return false;
    return features.some((f) => f.feature_key === featureKey);
  };

  const value = {
    brand,
    features,
    loadingBrand,
    hasFeature,
    refreshBrand: resolveCurrentBrand
  };

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
};

export const useBrand = () => {
  return useContext(BrandContext);
};

