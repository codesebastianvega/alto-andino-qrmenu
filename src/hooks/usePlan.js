import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

/**
 * usePlan — returns the current brand's plan details and feature flags.
 *
 * Usage:
 *   const { plan, can, loading } = usePlan();
 *   if (!can('analytics')) return <UpgradePrompt />;
 */
export function usePlan() {
  const { profile } = useAuth();
  const [plan, setPlan] = useState(null);
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.brand_id) { setLoading(false); return; }

    const fetchPlan = async () => {
      try {
        // Get brand's plan
        const { data: brand } = await supabase
          .from('brands')
          .select('plan_id, plans(*)')
          .eq('id', profile.brand_id)
          .maybeSingle();

        if (!brand?.plans) { setLoading(false); return; }

        const planData = brand.plans;
        setPlan(planData);

        // Get plan features
        const { data: featureRows } = await supabase
          .from('plan_features')
          .select('feature_key, is_included')
          .eq('plan_id', planData.id);

        // Build a map: { analytics: true, web_management: false, ... }
        const featureMap = {};
        (featureRows || []).forEach(f => {
          featureMap[f.feature_key] = f.is_included;
        });
        setFeatures(featureMap);

      } catch (err) {
        console.error('Error loading plan:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [profile?.brand_id]);

  /**
   * can('feature_key') — returns true if the plan includes the feature.
   * Superadmins and owners always have full access.
   */
  const can = (featureKey) => {
    if (!plan) return false;
    // Unlimited access for custom/enterprise plans
    if (plan.is_custom_pricing) return true;
    return features[featureKey] ?? false;
  };

  /**
   * withinLimit('max_products', currentCount) — checks count-based limits.
   * Returns true if the user is still within their plan limit.
   * null = unlimited.
   */
  const withinLimit = (limitKey, currentCount) => {
    if (!plan) return true;
    if (plan.is_custom_pricing) return true;
    const limit = plan[limitKey];
    if (limit === null || limit === undefined || limit === -1) return true;
    return currentCount < limit;
  };

  return {
    plan,
    features,
    can,
    withinLimit,
    loading,
    planName: plan?.name || 'Emprendedor',
    planSlug: plan?.slug || 'emprendedor',
    maxProducts: plan?.max_products ?? null,
    maxAdmins: plan?.max_admins ?? 1,
  };
}
