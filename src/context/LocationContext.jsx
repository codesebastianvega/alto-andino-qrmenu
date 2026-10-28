import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation as useRouterLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useLocations as useLocationsHook } from '../hooks/useLocations';
import { safeStorage as localStorage } from '../utils/safeStorage';
import { supabase } from '../config/supabase';

const LocationContext = createContext({});

export const LocationProvider = ({ children }) => {
  const { activeBrand } = useAuth();
  const { 
    locations, 
    loading: locationsLoading,
    refresh: refreshLocations,
    createLocation,
    updateLocation,
    deleteLocation
  } = useLocationsHook();
  const routerLocation = useRouterLocation();
  
  // Helper to get location from URL
  const getUrlLocationId = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    // Support 'loc' used in QR links and 'location_id' used in admin/other links
    return params.get('loc') || params.get('location_id') || params.get('sede_id') || null;
  }, []);

  // State for the active location ID (either a UUID or 'all')
  const [activeLocationId, setActiveLocationId] = useState(() => {
    // 1. Check URL first (Highest Priority for QR/Direct links)
    const urlLoc = new URLSearchParams(window.location.search).get('loc') || 
                   new URLSearchParams(window.location.search).get('location_id');
    if (urlLoc) return urlLoc;

    // 2. Check LocalStorage (User preference / Session persistence)
    const sessionLoc = localStorage.getItem("aa_current_location_id");
    if (sessionLoc) return sessionLoc;

    // 3. Check LocalStorage (User preference)
    if (activeBrand) {
      return localStorage.getItem(`aa_active_loc_${activeBrand.id}`) || 'all';
    }
    
    return 'all';
  });

  // Sync state with URL and Storage
  useEffect(() => {
    const urlLoc = getUrlLocationId();
    
    if (urlLoc && urlLoc !== activeLocationId) {
      setActiveLocationId(urlLoc);
      localStorage.setItem("aa_current_location_id", urlLoc);
      if (activeBrand) {
        localStorage.setItem(`aa_active_loc_${activeBrand.id}`, urlLoc);
      }
    } else if (!urlLoc && activeBrand) {
      // If no URL param, but we have a brand, check if we need to restore from storage
      const stored = localStorage.getItem(`aa_active_loc_${activeBrand.id}`);
      const session = localStorage.getItem("aa_current_location_id");
      const target = session || stored || 'all';
      
      if (target !== activeLocationId) {
        setActiveLocationId(target);
      }
    }
  }, [activeBrand, getUrlLocationId, routerLocation.search, routerLocation.hash]);

  // Handle manual location switching
  const switchLocation = useCallback((id) => {
    setActiveLocationId(id);
    
    // Update Storages
    if (id === 'all') {
      localStorage.removeItem("aa_current_location_id");
    } else {
      localStorage.setItem("aa_current_location_id", id);
    }

    if (activeBrand) {
      localStorage.setItem(`aa_active_loc_${activeBrand.id}`, id);
    }

    // Update URL to keep it in sync
    const params = new URLSearchParams(window.location.search);
    if (id === 'all') {
      params.delete('location_id');
      params.delete('loc');
    } else {
      params.set('location_id', id);
    }
    
    const newPath = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
    window.history.replaceState(null, '', newPath);
  }, [activeBrand]);

  // Listen for storage changes (e.g. if another tab or component updates storage)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "aa_current_location_id" && e.newValue !== activeLocationId) {
        setActiveLocationId(e.newValue || 'all');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [activeLocationId]);

  // Ensure that activeLocationId actually belongs to the current brand's locations
  useEffect(() => {
    if (!locationsLoading && locations.length > 0 && activeLocationId && activeLocationId !== 'all') {
      const isValid = locations.some(loc => loc.id === activeLocationId);
      if (!isValid) {
        console.warn(`[LocationContext] Sede ${activeLocationId} no pertenece a ${activeBrand?.name}. Reseteando a 'all'.`);
        setActiveLocationId('all');
        localStorage.removeItem("aa_current_location_id");
        if (activeBrand) {
          localStorage.setItem(`aa_active_loc_${activeBrand.id}`, 'all');
        }
      }
    }
  }, [locations, locationsLoading, activeLocationId, activeBrand]);

  // Derive the active location object
  const activeLocation = useMemo(() => {
    if (!activeLocationId || activeLocationId === 'all') return null;
    return locations.find(loc => loc.id === activeLocationId) || null;
  }, [activeLocationId, locations]);

  // Loading state
  const loading = activeBrand ? locationsLoading : false;

  // Supabase Realtime on locations table for active brand
  useEffect(() => {
    if (!activeBrand?.id) return;
    const channel = supabase
      .channel(`locations-sync-${activeBrand.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'locations', filter: `brand_id=eq.${activeBrand.id}` },
        () => {
          refreshLocations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeBrand?.id, refreshLocations]);

  const value = {
    activeLocationId,
    activeLocation,
    locations,
    loading,
    switchLocation,
    isAllLocations: activeLocationId === 'all',
    createLocation,
    updateLocation,
    deleteLocation,
    refreshLocations
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const useLocations = useLocation;

