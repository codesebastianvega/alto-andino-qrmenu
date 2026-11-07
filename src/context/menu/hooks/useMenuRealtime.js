import { useEffect } from 'react';
import { supabase } from '../../../config/supabase';

export function useMenuRealtime({
  activeBrandId,
  fetchMenuData,
  setRestaurantSettings,
  setHomeSettings,
}) {
  useEffect(() => {
    if (!activeBrandId) return;

    // Listen for branding and settings changes
    const settingsChannel = supabase
      .channel(`settings-changes-${activeBrandId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurant_settings',
          filter: `brand_id=eq.${activeBrandId}`,
        },
        (payload) => {
          if (payload.new) setRestaurantSettings(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'home_settings',
          filter: `brand_id=eq.${activeBrandId}`,
        },
        (payload) => {
          if (payload.new) setHomeSettings(payload.new);
        }
      )
      .subscribe();

    // Listen for menu content changes
    const menuChannel = supabase
      .channel(`menu-changes-${activeBrandId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `brand_id=eq.${activeBrandId}`,
        },
        () => fetchMenuData(activeBrandId, { force: true })
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'locations',
          filter: `brand_id=eq.${activeBrandId}`,
        },
        () => fetchMenuData(activeBrandId, { force: true })
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `brand_id=eq.${activeBrandId}`,
        },
        () => fetchMenuData(activeBrandId, { force: true })
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'modifier_groups',
          filter: `brand_id=eq.${activeBrandId}`,
        },
        () => fetchMenuData(activeBrandId, { force: true })
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'modifier_options',
        },
        () => fetchMenuData(activeBrandId, { force: true })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'location_product_prices' },
        () => fetchMenuData(activeBrandId, { force: true })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'location_product_status' },
        () => fetchMenuData(activeBrandId, { force: true })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'location_categories' },
        () => fetchMenuData(activeBrandId, { force: true })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'location_modifier_groups' },
        () => fetchMenuData(activeBrandId, { force: true })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'brands', filter: `id=eq.${activeBrandId}` },
        () => fetchMenuData(activeBrandId, { force: true })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'promotions', filter: `brand_id=eq.${activeBrandId}` },
        () => fetchMenuData(activeBrandId, { force: true })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(menuChannel);
    };
  }, [activeBrandId, fetchMenuData, setRestaurantSettings, setHomeSettings]);
}
