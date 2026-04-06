import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../config/supabase';

const BrandContext = createContext({});

export const BrandProvider = ({ children }) => {
  const [brand, setBrand] = useState(null);
  const [features, setFeatures] = useState([]);
  const [loadingBrand, setLoadingBrand] = useState(true);
  const { brand_slug } = useParams();

  const resolveCurrentBrand = useCallback(async () => {
    try {
      setLoadingBrand(true);
      let targetBrandId = null;

      // 1. PRIORIDAD: Si hay un slug en la URL, resolvemos por slug
      if (brand_slug) {
        const { data: brandBySlug, error: slugError } = await supabase
          .from('brands')
          .select('id')
          .eq('slug', brand_slug)
          .eq('is_active', true)
          .maybeSingle();
        
        if (brandBySlug) {
          targetBrandId = brandBySlug.id;
        } else {
          console.warn(`No se encontró marca activa para el slug: ${brand_slug}`);
        }
      }

      // 2. FALLBACK ADMIN: Si no hay slug pero hay sesión (panel admin), usamos el brand del perfil
      if (!targetBrandId) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('brand_id')
            .eq('id', session.user.id)
            .maybeSingle();
            
          if (profile?.brand_id) {
            targetBrandId = profile.brand_id;
          }
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
  }, [brand_slug]);

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

