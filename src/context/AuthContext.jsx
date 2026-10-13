import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { safeStorage as localStorage } from '../utils/safeStorage';
import { withTimeout } from '../utils/withTimeout';

const AuthContext = createContext({});

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const AuthProvider = ({ children }) => {
  const [user, setUser]             = useState(null);
  const [profile, setProfile]       = useState(null);
  const [loading, setLoading]       = useState(true);
  // All brands the authenticated user owns or manages
  const [ownedBrands, setOwnedBrands] = useState([]);
  // The brand currently being managed in the admin panel
  // Stored in localStorage so it persists across refreshes
  const [activeBrand, setActiveBrandState] = useState(null);
  const [activeBrandFeatures, setActiveBrandFeatures] = useState([]);
  const [activePlan, setActivePlan]                   = useState(null);
  // true when a Google OAuth user signed in but has no business yet
  const [needsOnboarding, setNeedsOnboarding]         = useState(false);

  const fetchBrandFeatures = useCallback(async (brandId, planId) => {
    if (!brandId || !planId) return;
    try {
      // 1. Fetch Plan details
      const { data: plan } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();
      
      setActivePlan(plan);

      // 2. Fetch Features for this plan
      const { data: features } = await supabase
        .from('plan_features')
        .select('*')
        .eq('plan_id', planId);
      
      setActiveBrandFeatures(features || []);
    } catch (err) {
      console.error('Error fetching brand features:', err);
    }
  }, []);

  const fetchProfile = useCallback(async (userId) => {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // New signups can create the public profile right after SIGNED_IN fires.
        // Give that bootstrap flow a short window before treating the user as incomplete.
        const startedAt = Date.now();
        while (!data && Date.now() - startedAt < 5000) {
          await wait(250);

          const retry = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (retry.error) throw retry.error;
          data = retry.data;
        }
      }

      if (!data) {
        setProfile(null);
        setOwnedBrands([]);
        setActiveBrandState(null);
        setActiveBrandFeatures([]);
        setActivePlan(null);
        setNeedsOnboarding(true);
        return;
      }

      setProfile(data);

      // Fetch all brands this user owns or manages (superadmins see all brands)
      let brandsQuery = supabase
        .from('brands')
        .select(`
          id, name, slug, logo_url, business_type, plan_id, onboarding_completed, is_active,
          trial_end_date, has_ai_addon, has_kds_addon, has_bds_addon, payment_verified, ai_generation_limit, ai_generations_used, addon_ai_analytics, addon_ai_agent,
          plans (name),
          restaurant_settings (primary_color)
        `)
        .order('name');

      if (data.role !== 'superadmin') {
        brandsQuery = brandsQuery.eq('owner_id', userId);
      }

      const { data: brands } = await brandsQuery;
      let userBrands = brands || [];

      // If user has a brand_id assigned in profile that isn't already in userBrands, fetch and include it
      if (data.brand_id && !userBrands.some(b => b.id === data.brand_id)) {
        try {
          const { data: staffBrand } = await supabase
            .from('brands')
            .select(`
              id, name, slug, logo_url, business_type, plan_id, onboarding_completed, is_active,
              trial_end_date, has_ai_addon, has_kds_addon, has_bds_addon, payment_verified, ai_generation_limit, ai_generations_used, addon_ai_analytics, addon_ai_agent,
              plans (name),
              restaurant_settings (primary_color)
            `)
            .eq('id', data.brand_id)
            .single();

          if (staffBrand) {
            userBrands = [staffBrand, ...userBrands];
          }
        } catch (brandErr) {
          console.error('Error fetching assigned brand:', brandErr);
        }
      }

      setOwnedBrands(userBrands);

      // Check current URL for brand slug (e.g. /boku-bento/#admin)
      const pathSlug = window.location.pathname.split('/').filter(Boolean)[0];
      const brandFromUrl = pathSlug ? userBrands.find(b => b.slug === pathSlug) : null;

      // Restore last active brand from localStorage
      const stored = localStorage.getItem('aa_active_brand_id');
      const savedBrand = userBrands.find(b => b.id === stored);

      // Default from profile
      const profileBrand = userBrands.find(b => b.id === data.brand_id);

      // Selection priority: URL slug > stored preference > profile default > first available brand
      const selectedBrand = brandFromUrl || savedBrand || profileBrand || userBrands[0] || null;

      if (selectedBrand) {
        setActiveBrandState(selectedBrand);
        localStorage.setItem('aa_active_brand_id', selectedBrand.id);
        fetchBrandFeatures(selectedBrand.id, selectedBrand.plan_id);
        setNeedsOnboarding(false);
      } else {
        // Usuario autenticado (ej: via Google) pero sin negocio creado todavía
        setNeedsOnboarding(true);
      }

    } catch (err) {
      console.error('Error fetching profile:', err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchBrandFeatures]);

  const currentUserRef = React.useRef(user);
  useEffect(() => {
    currentUserRef.current = user;
  }, [user]);

  useEffect(() => {
    // Initial session check
    const checkSession = async () => {
      try {
        const { data: { session } } = await withTimeout(
          supabase.auth.getSession(),
          8000,
          'La verificación de sesión',
        );
        const initialUser = session?.user ?? null;
        setUser(initialUser);
        if (initialUser) {
          await withTimeout(fetchProfile(initialUser.id), 15000, 'La carga del perfil');
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Initial session check error:', err);
        setLoading(false);
      }
    };

    checkSession();
  }, [fetchProfile]);

  useEffect(() => {
    const pendingProfileTimers = new Set();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const newUser = session?.user ?? null;
      const prevUser = currentUserRef.current;

      // 1. Handle Sign Out strictly
      if (event === 'SIGNED_OUT' || !newUser) {
        setUser(null);
        setProfile(null);
        setOwnedBrands([]);
        setActiveBrandState(null);
        setActiveBrandFeatures([]);
        setActivePlan(null);
        setLoading(false);
        return;
      }

      // 2. Prevent redundant work on token refreshes/window focus
      // If the user ID is the same and we already have a profile, just update the user object (for token info) and STOP.
      if (newUser.id === prevUser?.id) {
        setUser(newUser); // Keep the session/user object fresh
        return;
      }

      // 3. New user or session transition
      setUser(newUser);
      setLoading(true);
      // Supabase recomienda no encadenar otras consultas dentro del callback de Auth.
      // Diferirlas evita bloquear el lock de inicialización de la sesión.
      const timer = window.setTimeout(() => {
        pendingProfileTimers.delete(timer);
        void withTimeout(fetchProfile(newUser.id), 15000, 'La carga del perfil')
          .catch((err) => {
            console.error('Auth profile refresh error:', err);
            setLoading(false);
          });
      }, 0);
      pendingProfileTimers.add(timer);
    });

    return () => {
      pendingProfileTimers.forEach((timer) => window.clearTimeout(timer));
      subscription.unsubscribe();
    };
  }, [fetchProfile]);


  // Switch the active brand being managed
  const switchBrand = useCallback(async (brand) => {
    // Clear current state immediately to prevent "feature leaks" during brand switch
    setActivePlan(null);
    setActiveBrandFeatures([]);
    
    // 1. Persist to DB so BrandContext redirect doesn't bounce us back
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ brand_id: brand.id })
        .eq('id', user.id);
      
      if (error) {
        console.error('[AuthContext] Error syncing brand to profile:', error);
        throw error; // Rethrow to let the UI (e.g., BrandSwitcher) handle it
      }
      
      // Update local profile state as well
      setProfile(prev => ({ ...prev, brand_id: brand.id }));
    }

    // 2. Local State
    setActiveBrandState(brand);
    localStorage.setItem('aa_active_brand_id', brand.id);
    fetchBrandFeatures(brand.id, brand.plan_id);
  }, [user, fetchBrandFeatures]);

  // Feature Gating Helpers
  const hasFeature = (featureKey) => {
    if (!activeBrandFeatures) return false;
    const feat = activeBrandFeatures.find(f => f.feature_key === featureKey);
    return feat?.is_included || false;
  };

  const isFeatureLocked = (featureKey) => !hasFeature(featureKey);

  const signIn  = (data) => supabase.auth.signInWithPassword(data);
  const signUp  = (data) => supabase.auth.signUp(data);
  const signOut = async () => {
    localStorage.removeItem('aa_active_brand_id');
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase signOut error:', err);
    }
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      needsOnboarding,
      ownedBrands,
      activeBrand,
      activePlan,
      activeBrandFeatures,
      hasFeature,
      isFeatureLocked,
      switchBrand,
      refreshProfile: fetchProfile,
      signIn,
      signUp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
