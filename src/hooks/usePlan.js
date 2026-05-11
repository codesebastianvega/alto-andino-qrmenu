import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { useMenuData } from '../context/MenuDataContext';

/**
 * usePlan — returns the current brand's plan details and feature flags.
 * Supports both Admin (via useAuth) and Customer (via useMenuData or manual brandId).
 *
 * Usage:
 *   const { plan, can, isWithinOrderLimit } = usePlan();
 *   if (!can('analytics')) return <UpgradePrompt />;
 */
export function usePlan(manualBrandId = null) {
  const { profile } = useAuth();
  const menuData = useMenuData();
  
  // Resolve brandId: Priority Manual > Auth Profile > Menu Data
  const brandId = manualBrandId || profile?.brand_id || menuData?.activeBrandId;

  const [plan, setPlan] = useState(null);
  const [features, setFeatures] = useState({});
  const [ordersThisMonth, setOrdersThisMonth] = useState(0);
  const [productsCount, setProductsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!brandId) { 
      if (!manualBrandId && !profile?.brand_id && !menuData?.loading) {
        setLoading(false);
      }
      return; 
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Get brand's plan, order count, and product count in parallel
        const [brandRes, orderCountRes, productCountRes] = await Promise.all([
          supabase
            .from('brands')
            .select('plan_id, has_ai_addon, trial_ends_at, plans(*)')
            .eq('id', brandId)
            .maybeSingle(),
          supabase.rpc('get_monthly_order_count', { p_brand_id: brandId }),
          supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('brand_id', brandId)
            .eq('is_addon', false)
        ]);

        const brand = brandRes.data;
        const orderCount = orderCountRes.data || 0;
        const productCount = productCountRes.count || 0;

        setOrdersThisMonth(orderCount);
        setProductsCount(productCount);

        if (!brand?.plans) { 
          setLoading(false); 
          return; 
        }

        const planData = brand.plans;
        setPlan({ 
          ...planData, 
          has_ai_addon: brand.has_ai_addon,
          trial_ends_at: brand.trial_ends_at 
        });

        // 2. Get plan features
        const { data: featureRows } = await supabase
          .from('plan_features')
          .select('feature_key, is_included')
          .eq('plan_id', planData.id);

        const featureMap = {};
        (featureRows || []).forEach(f => {
          featureMap[f.feature_key] = f.is_included;
        });
        setFeatures(featureMap);

      } catch (err) {
        console.error('Error loading plan or order count:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [brandId, manualBrandId]);

  /**
   * isTrialActive — returns true if the current date is before trial_ends_at.
   */
  const isTrialActive = plan?.trial_ends_at ? new Date(plan.trial_ends_at) > new Date() : false;

  /**
   * can('feature_key') — returns true if the plan includes the feature or trial is active.
   */
  const can = (featureKey) => {
    // REGLA DE ORO: Si la prueba está activa, acceso total (Reverse Trial)
    if (isTrialActive) return true;
    
    if (!plan) return false;
    if (plan.is_custom_pricing) return true;
    return features[featureKey] ?? false;
  };

  /**
   * withinLimit('max_products', currentCount) — checks count-based limits.
   */
  const withinLimit = (limitKey, currentCount) => {
    if (isTrialActive) return true;
    if (!plan) return true;
    if (plan.is_custom_pricing) return true;
    const limit = plan[limitKey];
    if (limit === null || limit === undefined || limit === -1) return true;
    return currentCount < limit;
  };

  // Order limit logic: Allow unlimited if null, undefined, -1, or trial is active.
  const isWithinOrderLimit = isTrialActive || (plan?.max_orders_per_month === null || plan?.max_orders_per_month === undefined || plan?.max_orders_per_month === -1)
    ? true
    : ordersThisMonth < plan.max_orders_per_month;

  return {
    plan,
    features,
    can,
    withinLimit,
    loading,
    ordersThisMonth,
    productsCount,
    isWithinOrderLimit,
    isWithinProductLimit: isTrialActive || (plan?.max_products === null || plan?.max_products === undefined || plan?.max_products === -1)
      ? true
      : productsCount < plan.max_products,
    hasAiAddon: plan?.has_ai_addon ?? false,
    isTrialActive,
    trialEndsAt: plan?.trial_ends_at || null,
    planName: plan?.name || 'Emprendedor',
    planSlug: plan?.slug || 'emprendedor',
    maxOrders: plan?.max_orders_per_month || null,
    maxProducts: plan?.max_products ?? null,
    maxCategories: plan?.max_categories ?? null,
    maxAdmins: plan?.max_admins ?? 1,
  };
}
