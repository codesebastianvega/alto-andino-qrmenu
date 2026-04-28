import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useLocations as useLocationsHook } from '../hooks/useLocations';

const LocationContext = createContext({});

export const LocationProvider = ({ children }) => {
  const { activeBrand } = useAuth();
  const { locations, loading: locationsLoading } = useLocationsHook();
  
  // Helper to get location from URL
  const getUrlLocationId = () => {
    const params = new URLSearchParams(window.location.search);
    // Support both location_id and sede_id as aliases
    return params.get('location_id') || params.get('sede_id') || null;
  };

  // State for the active location ID (either a UUID or 'all')
  const [activeLocationId, setActiveLocationId] = useState(() => {
    // 1. Check URL first (Priority)
    const urlLoc = getUrlLocationId();
    if (urlLoc) return urlLoc;

    // 2. Check LocalStorage
    if (!activeBrand) return 'all';
    return localStorage.getItem(`aa_active_loc_${activeBrand.id}`) || 'all';
  });

  // Sync state when activeBrand changes or URL changes
  useEffect(() => {
    const urlLoc = getUrlLocationId();
    if (urlLoc) {
      setActiveLocationId(urlLoc);
      if (activeBrand) {
        localStorage.setItem(`aa_active_loc_${activeBrand.id}`, urlLoc);
      }
      return;
    }

    if (activeBrand) {
      const stored = localStorage.getItem(`aa_active_loc_${activeBrand.id}`);
      setActiveLocationId(stored || 'all');
    } else {
      setActiveLocationId('all');
    }
  }, [activeBrand]);

  // Handle URL parameter changes specifically
  useEffect(() => {
    const handleUrlChange = () => {
      const urlLoc = getUrlLocationId();
      if (urlLoc && urlLoc !== activeLocationId) {
        setActiveLocationId(urlLoc);
        if (activeBrand) {
          localStorage.setItem(`aa_active_loc_${activeBrand.id}`, urlLoc);
        }
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    // Also check on hash changes as some navigations might happen there
    window.addEventListener('hashchange', handleUrlChange);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, [activeBrand, activeLocationId]);

  const switchLocation = useCallback((id) => {
    setActiveLocationId(id);
    if (activeBrand) {
      localStorage.setItem(`aa_active_loc_${activeBrand.id}`, id);
    }

    // Sync with URL
    const params = new URLSearchParams(window.location.search);
    if (id === 'all') {
      params.delete('location_id');
      params.delete('sede_id');
    } else {
      params.set('location_id', id);
    }
    
    const newPath = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
    window.history.replaceState(null, '', newPath);
  }, [activeBrand]);

  // Derive the active location object
  const activeLocation = useMemo(() => {
    if (activeLocationId === 'all') return null;
    return locations.find(loc => loc.id === activeLocationId) || null;
  }, [activeLocationId, locations]);

  // Loading state (only true if we are waiting for initial locations)
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

// Alias to support plural naming used in standard admin pages
export const useLocations = useLocation;
