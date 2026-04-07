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
      let targetBrandId = null;

      // 1. PRIORIDAD ADMIN: Si estamos en modo administración (#admin o #admin/onboarding), el brand viene del perfil
      const is_admin_view = location.hash.includes('#admin');
      
      if (is_admin_view) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('brand_id, brand:brands(slug)')
            .eq('id', session.user.id)
            .maybeSingle();
            
          if (profile?.brand_id) {
            targetBrandId = profile.brand_id;
            
            // Sincronizar URL si el slug no coincide con el brand real del admin
            if (brand_slug && profile.brand?.slug && brand_slug !== profile.brand.slug) {
              console.log(`Sincronizando slug URL: ${brand_slug} -> ${profile.brand.slug}`);
              const newPath = `/${profile.brand.slug}/${location.search}${location.hash}`;
              navigate(newPath, { replace: true });
            }
          }
        }
      }

      // 2. FALLBACK PUBLICO: Si hay un slug en la URL (y no estamos en admin o falló el admin), resolvemos por slug
      if (!targetBrandId && brand_slug) {
        const { data: brandBySlug } = await supabase
          .from('brands')
          .select('id')
          .eq('slug', brand_slug)
          .eq('is_active', true)
          .maybeSingle();
        
        if (brandBySlug) {
          targetBrandId = brandBySlug.id;
        }
      }

      // 3. ULTIMO RECURSO: Mantener compatibilidad si nada anterior funcionó (opcional)
      // if (!targetBrandId) targetBrandId = 'ID_HARDCODED_DEFAULT';

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

