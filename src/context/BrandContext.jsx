import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

const BrandContext = createContext({});

export const BrandProvider = ({ children }) => {
  const [brand, setBrand] = useState(null);
  const [features, setFeatures] = useState([]);
  const [loadingBrand, setLoadingBrand] = useState(true);

  useEffect(() => {
    // 1. Obtener el slug desde la URL (o contexto global, pero aquí vemos como lo extraemos)
    // Para rutas tipo /:slug/menu, pero usando react-router sería `useParams`
    // Dado que la app usa Hash por ahora o dominios personalizados, intentemos sacarlo de los datos configurados, 
    // o podemos simplemente depender de "la sesión de owner" cuando se edita un brand en el Admin.

    // Por ahora, asumamos que si el usuario tiene una sesión, y es Owner, cargamos 'su' brand.
    // Si la visita es de un comensal, la vista la resuleve LandingPage o la ruta, PERO 
    // necesitamos una forma limpia.
    // Vamos a escuchar a la sesión de Supabase local o lo que se defina.
    
    // Dejamos un hook temporal para resolver esto de manera general.
    resolveCurrentBrand();
  }, []);

  const resolveCurrentBrand = async () => {
    try {
      setLoadingBrand(true);
      // a) Intenta buscar un id de negocio en sesión
      // (si es que la URL ya resolvió o estamos logueados)
      const { data: { session } } = await supabase.auth.getSession();
      
      let targetBrandId = null;

      if (session?.user) {
        // Obtenemos el perfil para saber de qué negocio es dueño o staff
        const { data: profile } = await supabase
          .from('profiles')
          .select('brand_id, role')
          .eq('id', session.user.id)
          .single();
          
        if (profile?.brand_id) {
          targetBrandId = profile.brand_id;
        }
      }

      // Si no pudimos determinarlo, dejamos el por defecto de Alto Andino 
      // (para que no se caiga la app vieja)
      if (!targetBrandId) {
        // En producción intentarías cogerlo de la URL o el dominio.
        const { data: defaultBrand } = await supabase
          .from('brands')
          .select('id')
          .eq('slug', 'alto-andino')
          .single();
        targetBrandId = defaultBrand?.id;
      }

      if (targetBrandId) {
        // Cargar detalles del brand
        const { data: brandData, error } = await supabase
          .from('brands')
          .select('*, plans(id, name)')
          .eq('id', targetBrandId)
          .single();

        if (!error && brandData) {
          setBrand(brandData);

          // Cargar las features asignadas a su plan
          if (brandData.plan_id) {
            const { data: featuresData } = await supabase
              .from('plan_features')
              .select('*')
              .eq('plan_id', brandData.plan_id)
              .eq('is_included', true);
            
            setFeatures(featuresData || []);
          }
        }
      }
    } catch (error) {
      console.error('Error resolving brand:', error);
    } finally {
      setLoadingBrand(false);
    }
  };

  const hasFeature = (featureKey) => {
    if (!features || features.length === 0) return false;
    return features.some((f) => f.feature_key === featureKey);
  };

  const value = {
    brand,
    features,
    loadingBrand,
    hasFeature
  };

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
};

export const useBrand = () => {
  return useContext(BrandContext);
};
