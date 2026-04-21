import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext({});

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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Corrupted session (no profile) — sign out to clean up
        await supabase.auth.signOut();
        setProfile(null);
        setUser(null);
        return;
      }

      setProfile(data);

      // Fetch all brands this user owns (owner_id = user.id)
      const { data: brands } = await supabase
        .from('brands')
        .select(`
          id, name, slug, logo_url, business_type, plan_id, onboarding_completed,
          plans (name)
        `)
        .eq('owner_id', userId)
        .eq('is_active', true)
        .order('name');

      const userBrands = brands || [];
      setOwnedBrands(userBrands);

      // Restore last active brand from localStorage
      const stored = localStorage.getItem('aa_active_brand_id');
      let savedBrand = userBrands.find(b => b.id === stored);

      // CRITICAL FIX: If user is not the owner (e.g. waiter), they won't have the brand in ownedBrands.
      // We must fetch it explicitly using data.brand_id from their profile.
      if (!savedBrand && !userBrands.length && data.brand_id) {
        try {
          const { data: staffBrand } = await supabase
            .from('brands')
            .select(`
              id, name, slug, logo_url, business_type, plan_id, onboarding_completed,
              plans (name)
            `)
            .eq('id', data.brand_id)
            .single();
          
          if (staffBrand) {
            savedBrand = staffBrand;
          }
        } catch (brandErr) {
          console.error('Error fetching staff brand:', brandErr);
        }
      }

      if (savedBrand) {
        setActiveBrandState(savedBrand);
        fetchBrandFeatures(savedBrand.id, savedBrand.plan_id);
        setNeedsOnboarding(false);
      } else if (userBrands.length > 0) {
        // Default: the brand matching the profile's brand_id
        const profileBrand = userBrands.find(b => b.id === data.brand_id) || userBrands[0];
        setActiveBrandState(profileBrand);
        localStorage.setItem('aa_active_brand_id', profileBrand.id);
        fetchBrandFeatures(profileBrand.id, profileBrand.plan_id);
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUser = session?.user ?? null;
      
      // If the user hasn't changed, don't trigger a full reload/re-fetch
      // This prevents the "flash" when Supabase refreshes the token on window focus
      if (newUser?.id === user?.id && event !== 'SIGNED_OUT') {
        setUser(newUser);
        return;
      }

      setUser(newUser);
      if (newUser) {
        setLoading(true);
        fetchProfile(newUser.id);
      } else {
        setProfile(null);
        setOwnedBrands([]);
        setActiveBrandState(null);
        setActiveBrandFeatures([]);
        setActivePlan(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
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
      
      if (!error) {
        // Update local profile state as well
        setProfile(prev => ({ ...prev, brand_id: brand.id }));
      }
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
    await supabase.auth.signOut();
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
