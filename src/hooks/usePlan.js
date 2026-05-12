import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { useMenuData } from '../context/MenuDataContext';

/**
 * PLAN_HIERARCHY — defines the order of plans.
 */
const PLAN_HIERARCHY = {
  'emprendedor': 0,
  'esencial': 1,
  'profesional': 2,
  'premium': 3,
  'enterprise': 4
};

/**
 * FEATURE_MIN_LEVEL — Hardcoded fallback for features if DB table plan_features is missing entries.
 */
const FEATURE_MIN_LEVEL = {
  // Esencial features
  'landing_page': 'esencial',
  'staff_panel': 'esencial',
  'analytics_basic': 'esencial',
  
  // Profesional features
  'table_management': 'profesional',
  'kitchen_display': 'profesional',
  'inventory': 'profesional',
  'advanced_analytics': 'profesional',
  'experiences': 'profesional',
  
  // Premium features
  'crm': 'premium',
  'loyalty': 'premium',
  'multi_sede': 'premium'
};

/**
 * usePlan — returns the current brand's plan details and feature flags.
 * Supports both Admin (via useAuth) and Customer (via useMenuData or manual brandId).
 */
export function usePlan(manualBrandId = null) {
  const { profile, activeBrand } = useAuth();
  const menuData = useMenuData();
  
  // Resolve brandId: Priority Manual > Active Brand Session > Auth Profile > Menu Data
  const brandId = manualBrandId || activeBrand?.id || profile?.brand_id || menuData?.activeBrandId;

  const [plan, setPlan] = useState(null);
  const [features, setFeatures] = useState({});
  const [ordersThisMonth, setOrdersThisMonth] = useState(0);
  const [productsCount, setProductsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!brandId) { 
      if (!manualBrandId && !profile?.brand_id && !activeBrand?.id && !menuData?.loading) {
        setLoading(false);
      }
      return; 
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // Clear state on brand change to avoid "ghost" permissions
        setPlan(null);
        setFeatures({});
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
  }, [brandId, manualBrandId, profile?.brand_id, activeBrand?.id, menuData?.loading]);

  /**
   * isTrialActive — returns true if the current date is before trial_ends_at.
   */
  const isTrialActive = useMemo(() => {
    if (!plan?.trial_ends_at) return false;
    return new Date(plan.trial_ends_at) > new Date();
  }, [plan?.trial_ends_at]);

  /**
   * can('feature_key') — returns true if the plan includes the feature or trial is active.
   * Includes hierarchy fallback for resilience.
   */
  const can = useCallback((featureKey) => {
    // 1. REGLA DE ORO: Si la prueba está activa, acceso total
    if (isTrialActive) return true;
    
    // 2. Custom Pricing tiene acceso total
    if (plan?.is_custom_pricing) return true;

    // 3. Obtener el slug actual (default a emprendedor si no hay plan)
    const currentSlug = plan?.slug || 'emprendedor';
    const currentLevel = PLAN_HIERARCHY[currentSlug] ?? 0;

    // 4. Verificación en mapa de base de datos
    if (features[featureKey]) return true;

    // 5. Verificación por Jerarquía (Fallback en código)
    const minRequiredSlug = FEATURE_MIN_LEVEL[featureKey];
    if (minRequiredSlug) {
      const minLevel = PLAN_HIERARCHY[minRequiredSlug];
      if (currentLevel >= minLevel) return true;
    }

    return false;
  }, [isTrialActive, plan, features]);

  /**
   * withinLimit('max_products', currentCount) — checks count-based limits.
   */
  const withinLimit = useCallback((limitKey, currentCount) => {
    if (isTrialActive) return true;
    if (!plan) return true;
    if (plan.is_custom_pricing) return true;
    const limit = plan[limitKey];
    if (limit === null || limit === undefined || limit === -1) return true;
    return currentCount < limit;
  }, [isTrialActive, plan]);

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
    /**
     * startTrial — activates a 21-day trial for the current brand.
     */
    startTrial: async () => {
      if (!brandId) return { error: 'No brand active' };
      
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 21);

      const { error } = await supabase
        .from('brands')
        .update({ trial_ends_at: trialEndsAt.toISOString() })
        .eq('id', brandId);

      if (!error) {
        // Refresh plan data
        setPlan(prev => prev ? { ...prev, trial_ends_at: trialEndsAt.toISOString() } : null);
      }

      return { error };
    }
  };
}

