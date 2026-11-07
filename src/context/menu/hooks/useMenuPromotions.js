import { useMemo } from 'react';
import { getDefaultBrandCoupons } from '../../../utils/couponSecurity';

export function useMenuPromotions({ promotions = [], activeBrandId, currentLocation }) {
  const mergedPromotions = useMemo(() => {
    const dbList = promotions || [];
    if (!activeBrandId) return dbList;
    const defaults = getDefaultBrandCoupons(activeBrandId);
    const dbCodes = new Set(
      dbList.map((p) => (p.code || '').trim().toUpperCase()).filter(Boolean)
    );
    const missingDefaults = defaults.filter((d) => !dbCodes.has(d.code.toUpperCase()));
    return [...dbList, ...missingDefaults];
  }, [promotions, activeBrandId]);

  const activePromotions = useMemo(() => {
    if (!mergedPromotions || mergedPromotions.length === 0) return [];
    const now = new Date();
    return mergedPromotions.filter((p) => {
      if (!p.is_active) return false;
      if (p.location_id && currentLocation?.id && p.location_id !== currentLocation.id) {
        return false;
      }
      if (p.start_date && new Date(p.start_date) > now) return false;
      if (p.end_date && new Date(p.end_date) < now) return false;
      if (
        typeof p.usage_limit === 'number' &&
        p.usage_limit > 0 &&
        (p.usage_count || 0) >= p.usage_limit
      ) {
        return false;
      }
      return true;
    });
  }, [mergedPromotions, currentLocation]);

  const freeDeliveryPromo = useMemo(() => {
    return activePromotions.find((p) => p.type === 'free_delivery' && !p.code) || null;
  }, [activePromotions]);

  const activePromoBanner = useMemo(() => {
    return activePromotions.find((p) => p.show_banner && p.banner_message) || null;
  }, [activePromotions]);

  return {
    mergedPromotions,
    activePromotions,
    freeDeliveryPromo,
    activePromoBanner,
  };
}
