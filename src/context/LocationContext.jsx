import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation as useRouterLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useLocations as useLocationsHook } from '../hooks/useLocations';

const LocationContext = createContext({});

export const LocationProvider = ({ children }) => {
  const { activeBrand } = useAuth();
  const { locations, loading: locationsLoading } = useLocationsHook();
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

    // 2. Check SessionStorage (Session priority, like from Waiter view)
    const sessionLoc = sessionStorage.getItem("aa_current_location_id");
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
      sessionStorage.setItem("aa_current_location_id", urlLoc);
      if (activeBrand) {
        localStorage.setItem(`aa_active_loc_${activeBrand.id}`, urlLoc);
      }
    } else if (!urlLoc && activeBrand) {
      // If no URL param, but we have a brand, check if we need to restore from storage
      const stored = localStorage.getItem(`aa_active_loc_${activeBrand.id}`);
      const session = sessionStorage.getItem("aa_current_location_id");
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
      sessionStorage.removeItem("aa_current_location_id");
    } else {
      sessionStorage.setItem("aa_current_location_id", id);
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

  // Derive the active location object
  const activeLocation = useMemo(() => {
    if (!activeLocationId || activeLocationId === 'all') return null;
    return locations.find(loc => loc.id === activeLocationId) || null;
  }, [activeLocationId, locations]);

  // Loading state
  const loading = activeBrand ? locationsLoading : false;

  const value = {
    activeLocationId,
    activeLocation,
    locations,
    loading,
    switchLocation,
    isAllLocations: activeLocationId === 'all'
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

