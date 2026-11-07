import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useBrand } from '../BrandContext';
import { useLocation as useAppLocation } from '../LocationContext';
import { catalogCache } from '../../utils/offlineDb';
import { withTimeout } from '../../utils/withTimeout';
import { useDynamicPWA } from '../../hooks/useDynamicPWA';
import { useClarity } from '../../hooks/useClarity';
import {
  enrichModifierGroups,
  resolveBestRestaurantSettings,
  fetchBrandMenuData,
  fetchLocationOverrides,
} from './helpers/menuFetchHelpers';
import {
  transformModifiers,
  transformProductsByCategory,
  filterAndScheduleCategories,
} from './helpers/menuTransformHelpers';
import { useMenuRealtime } from './hooks/useMenuRealtime';
import { useMenuTheming } from './hooks/useMenuTheming';
import { useStoreStatusTracker } from './hooks/useStoreStatusTracker';
import { useMenuPromotions } from './hooks/useMenuPromotions';

export function useMenuDataProvider() {
  const { activeLocationId } = useAppLocation();
  const [allCategories, setAllCategories] = useState([]);
  const [rawProducts, setRawProducts] = useState([]);
  const [locationPrices, setLocationPrices] = useState([]);
  const [locationStatus, setLocationStatus] = useState([]);
  const [locationCategories, setLocationCategories] = useState([]);
  const [locationModLinks, setLocationModLinks] = useState([]);
  const [rawModifierGroups, setRawModifierGroups] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [banners, setBanners] = useState([]);
  const [allergens, setAllergens] = useState([]);
  const [homeSettings, setHomeSettings] = useState(null);
  const [locations, setLocations] = useState([]);
  const [businessHours, setBusinessHours] = useState([]);
  const [restaurantSettings, setRestaurantSettings] = useState(null);
  const [brand, setBrand] = useState(null);
  const [planFeatures, setPlanFeatures] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentLoadedBrandIdRef = useRef(null);

  const { brand: currentBrand, loadingBrand } = useBrand();
  const activeBrandId = currentBrand?.id ?? null;

  // Inyectar PWA manifest dinámico por marca
  useDynamicPWA({ brand: brand || currentBrand, restaurantSettings });

  // Expose current location object
  const currentLocation = useMemo(() => {
    if (!locations || locations.length === 0) return null;
    if (activeLocationId && activeLocationId !== 'all') {
      const match = locations.find((l) => l.id === activeLocationId);
      if (match) return match;
    }
    return locations.find((l) => l.is_main) || locations[0] || null;
  }, [locations, activeLocationId]);

  // Inyectar Microsoft Clarity en marcas autorizadas
  useClarity({ brand: brand || currentBrand, currentLocation });

  // Fetch menu data for a given brand
  const fetchMenuData = useCallback(
    async (brandId, { force = false } = {}) => {
      if (!brandId) {
        setLoading(false);
        return true;
      }
      const isDifferentBrand = currentLoadedBrandIdRef.current !== brandId;

      if (isDifferentBrand) {
        setLoading(true);
        setAllCategories([]);
        setRawProducts([]);
        setLocationPrices([]);
        setLocationStatus([]);
        setLocationModLinks([]);
        setRawModifierGroups([]);
        setExperiences([]);
        setBanners([]);
        setAllergens([]);
        setHomeSettings(null);
        setRestaurantSettings(null);
        setBrand(null);
        setPlanFeatures([]);
        setLocations([]);
        setBusinessHours([]);
        setPromotions([]);
      }

      try {
        const cacheKey = `menu:v10:${brandId}`;
        let recentCache = null;
        if (!force) {
          try {
            recentCache = await withTimeout(
              catalogCache.get(cacheKey),
              2500,
              'La lectura del catálogo local'
            );
          } catch (cacheReadError) {
            console.warn(
              'MenuData: se omitió el caché local y se consultará Supabase.',
              cacheReadError
            );
          }
        }

        const hasValidModifierSchema = recentCache?.value?.modifierGroups?.some(
          (g) =>
            g.allow_quantity !== undefined ||
            g.included_quantity !== undefined ||
            g.modifier_options?.some((o) => o.extra_price !== undefined)
        );

        if (recentCache?.value && hasValidModifierSchema) {
          const data = recentCache.value;
          setAllCategories(data.categories);
          setRawProducts(data.products);
          setRawModifierGroups(data.modifierGroups);
          setExperiences(data.experiences);
          setAllergens(data.allergens);
          setLocations(data.locations);
          setBanners(data.banners);
          setHomeSettings(data.homeSettings);
          setRestaurantSettings(data.restaurantSettings);
          setBrand(data.brand);
          setPlanFeatures(data.brand?.plans?.plan_features || []);
          setBusinessHours(data.businessHours);
          setLocationPrices(data.locationPrices);
          setLocationStatus(data.locationStatus);
          setLocationCategories(data.locationCategories);
          setLocationModLinks(data.locationModLinks);
          setPromotions(data.promotions || []);
          setLoading(false);

          if (Date.now() - recentCache.cachedAt < 20 * 1000) {
            return true;
          }
        }

        if (!brandId) {
          setLoading(false);
          return true;
        }

        const [
          catsRes,
          modsRes,
          expRes,
          allgsRes,
          locsRes,
          bnrsRes,
          hSettRes,
          rSettRes,
          brandRes,
          prodsRes,
          hoursRes,
          promosRes,
        ] = await fetchBrandMenuData(brandId);

        if (modsRes?.error) console.error('MenuData modsRes error:', modsRes.error);
        const criticalError = [brandRes, catsRes, prodsRes, modsRes].find(
          (result) => result.error
        )?.error;
        if (criticalError) throw criticalError;

        if (brandRes.data) {
          setBrand(brandRes.data);
          const features = brandRes.data.plans?.plan_features || [];
          setPlanFeatures(features);
        }

        const enrichedModGroups = enrichModifierGroups(modsRes.data || []);
        setAllCategories(catsRes.data || []);
        setRawModifierGroups(enrichedModGroups);
        setExperiences(expRes.data || []);
        setAllergens(allgsRes.data || []);
        setLocations(locsRes.data || []);
        setBanners(bnrsRes.data || []);
        const rawHomeSettings = hSettRes.data?.[0] || null;
        setHomeSettings(rawHomeSettings);

        const bestRS = resolveBestRestaurantSettings(
          rSettRes.data || [],
          locsRes.data || [],
          activeLocationId,
          brandRes.data
        );
        setRestaurantSettings(bestRS);
        setRawProducts(prodsRes.data || []);
        setBusinessHours(hoursRes.data || []);
        setPromotions(promosRes?.data || []);

        let cachedLocationPrices = [];
        let cachedLocationStatus = [];
        let cachedLocationCategories = [];
        let cachedLocationModLinks = [];
        if (locsRes.data?.length > 0) {
          const locationIds = locsRes.data.map((l) => l.id);
          const [pricesData, statusData, catLinksData, modLinksData] =
            await fetchLocationOverrides(locationIds);

          setLocationPrices(pricesData);
          setLocationStatus(statusData);
          setLocationCategories(catLinksData);
          setLocationModLinks(modLinksData);
          cachedLocationPrices = pricesData;
          cachedLocationStatus = statusData;
          cachedLocationCategories = catLinksData;
          cachedLocationModLinks = modLinksData;
        }

        const cachePayload = {
          categories: catsRes.data || [],
          products: prodsRes.data || [],
          modifierGroups: modsRes.data || [],
          experiences: expRes.data || [],
          allergens: allgsRes.data || [],
          locations: locsRes.data || [],
          banners: bnrsRes.data || [],
          homeSettings: rawHomeSettings,
          restaurantSettings: bestRS,
          brand: brandRes.data || null,
          businessHours: hoursRes.data || [],
          locationPrices: cachedLocationPrices,
          locationStatus: cachedLocationStatus,
          locationCategories: cachedLocationCategories,
          locationModLinks: cachedLocationModLinks,
          promotions: promosRes?.data || [],
        };

        try {
          await withTimeout(
            catalogCache.put(cacheKey, cachePayload),
            2500,
            'La escritura del catálogo local'
          );
        } catch (cacheWriteError) {
          console.warn(
            'MenuData: el menú cargó, pero no se pudo actualizar el caché local.',
            cacheWriteError
          );
        }

        currentLoadedBrandIdRef.current = brandId;
        return true;
      } catch (err) {
        console.error('❌ MenuData Fetch Error:', err);
        let recoveredFromCache = false;
        try {
          const cached = await withTimeout(
            catalogCache.get(`menu:v10:${brandId}`),
            2500,
            'La recuperación del catálogo local'
          );
          if (cached?.value) {
            const data = cached.value;
            setAllCategories(data.categories);
            setRawProducts(data.products);
            setRawModifierGroups(data.modifierGroups);
            setExperiences(data.experiences);
            setAllergens(data.allergens);
            setLocations(data.locations);
            setBanners(data.banners);
            setHomeSettings(data.homeSettings);
            setRestaurantSettings(data.restaurantSettings);
            setBrand(data.brand);
            setPlanFeatures(data.brand?.plans?.plan_features || []);
            setBusinessHours(data.businessHours);
            setLocationPrices(data.locationPrices);
            setLocationStatus(data.locationStatus);
            setLocationCategories(data.locationCategories);
            setLocationModLinks(data.locationModLinks);
            currentLoadedBrandIdRef.current = brandId;
            recoveredFromCache = true;
          }
        } catch (cacheError) {
          console.error('No fue posible restaurar el catalogo local:', cacheError);
        }
        return recoveredFromCache;
      } finally {
        setLoading(false);
      }
    },
    [activeLocationId]
  );

  // Compute modifiers reactively
  const modifiers = useMemo(() => {
    return transformModifiers(rawModifierGroups, locationModLinks, activeLocationId);
  }, [rawModifierGroups, locationModLinks, activeLocationId]);

  // Current business hours for the active location
  const currentBusinessHours = useMemo(() => {
    let hours = [];
    if (activeLocationId && activeLocationId !== 'all') {
      hours = businessHours.filter((h) => h.location_id === activeLocationId);
    }
    if (!hours.length) {
      hours = businessHours.filter((h) => !h.location_id);
    }
    if (!hours.length && businessHours.length > 0) {
      hours = businessHours;
    }
    return hours;
  }, [businessHours, activeLocationId]);

  // Evaluador de apertura/cierre automático con estabilidad de referencia
  const { storeStatusInfo, isStorePausedForPublic } = useStoreStatusTracker({
    currentBusinessHours,
    brandConfig: brand?.config,
  });

  // Compute productsByCategory reactively
  const productsByCategory = useMemo(() => {
    return transformProductsByCategory({
      rawProducts,
      locationPrices,
      locationStatus,
      activeLocationId,
      restaurantSettings,
      allCategories,
      brand,
      isStorePausedForPublic,
    });
  }, [
    rawProducts,
    locationPrices,
    locationStatus,
    activeLocationId,
    restaurantSettings,
    allCategories,
    brand,
    isStorePausedForPublic,
  ]);

  // Compute categories reactively
  const categories = useMemo(() => {
    return filterAndScheduleCategories({
      allCategories,
      productsByCategory,
      activeLocationId,
      locationCategories,
      restaurantSettings,
      brand,
      isStorePausedForPublic,
    });
  }, [
    allCategories,
    productsByCategory,
    activeLocationId,
    locationCategories,
    restaurantSettings,
    brand,
    isStorePausedForPublic,
  ]);

  // Initial and reactive brand fetch
  const lastFetchedBrandRef = useRef(undefined);
  useEffect(() => {
    let isMounted = true;
    if (loadingBrand) return;

    if (activeBrandId === lastFetchedBrandRef.current) return;
    lastFetchedBrandRef.current = activeBrandId;

    const doFetch = async () => {
      const loaded = await fetchMenuData(activeBrandId);
      if (!loaded && isMounted) {
        console.warn('MenuData: primer intento fallido; se hará un reintento controlado.');
        await new Promise((resolve) => window.setTimeout(resolve, 1200));
        if (isMounted) await fetchMenuData(activeBrandId, { force: true });
      }
    };

    doFetch();
    return () => {
      isMounted = false;
    };
  }, [activeBrandId, loadingBrand, fetchMenuData]);

  // Real-time menu data updates
  useMenuRealtime({
    activeBrandId,
    fetchMenuData,
    setRestaurantSettings,
    setHomeSettings,
  });

  // Inject CSS Variables & SEO tags
  useMenuTheming({
    restaurantSettings,
    brand,
    homeSettings,
  });

  // Helpers
  const getProductsByCategory = useCallback(
    (slug) => productsByCategory[slug] || [],
    [productsByCategory]
  );
  const getModifiers = useCallback((group) => modifiers[group] || [], [modifiers]);
  const getAllProducts = useCallback(
    () => Object.values(productsByCategory).flat(),
    [productsByCategory]
  );

  // Promotions
  const { mergedPromotions, activePromotions, freeDeliveryPromo, activePromoBanner } =
    useMenuPromotions({
      promotions,
      activeBrandId,
      currentLocation,
    });

  return {
    categories,
    allCategories,
    productsByCategory,
    getProductsByCategory,
    getAllProducts,
    getModifiers,
    modifiers,
    rawModifierGroups,
    experiences,
    banners,
    allergens,
    homeSettings,
    restaurantSettings,
    brand,
    businessHours,
    currentBusinessHours,
    storeStatusInfo,
    planFeatures,
    locations,
    loading,
    activeBrandId,
    currentLocation,
    currentLocationId: activeLocationId,
    promotions: mergedPromotions,
    activePromotions,
    freeDeliveryPromo,
    activePromoBanner,
    refetchMenuData: () => fetchMenuData(activeBrandId, { force: true }),
    refetchPromotions: () => fetchMenuData(activeBrandId, { force: true }),
    hasFeature: (key) => planFeatures?.find((f) => f.feature_key === key)?.is_included ?? false,
  };
}
