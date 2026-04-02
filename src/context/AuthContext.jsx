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
        .select('id, name, slug, logo_url, business_type, plan_id')
        .eq('owner_id', userId)
        .eq('is_active', true)
        .order('name');

      const userBrands = brands || [];
      setOwnedBrands(userBrands);

      // Restore last active brand from localStorage
      const stored = localStorage.getItem('aa_active_brand_id');
      const savedBrand = userBrands.find(b => b.id === stored);

      if (savedBrand) {
        setActiveBrandState(savedBrand);
      } else if (userBrands.length > 0) {
        // Default: the brand matching the profile's brand_id
        const profileBrand = userBrands.find(b => b.id === data.brand_id) || userBrands[0];
        setActiveBrandState(profileBrand);
        localStorage.setItem('aa_active_brand_id', profileBrand.id);
      }

    } catch (err) {
      console.error('Error fetching profile:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setOwnedBrands([]);
        setActiveBrandState(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // Switch the active brand being managed
  const switchBrand = useCallback((brand) => {
    setActiveBrandState(brand);
    localStorage.setItem('aa_active_brand_id', brand.id);
  }, []);

  const signIn  = (data) => supabase.auth.signInWithPassword(data);
  const signUp  = (data) => supabase.auth.signUp(data);
  const signOut = async () => {
    localStorage.removeItem('aa_active_brand_id');
    return supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      ownedBrands,
      activeBrand,   // the brand currently being managed in admin
      switchBrand,   // (brand) => void
      signIn,
      signUp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
