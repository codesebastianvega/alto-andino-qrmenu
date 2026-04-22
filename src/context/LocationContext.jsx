import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useLocations as useLocationsHook } from '../hooks/useLocations';

const LocationContext = createContext({});

export const LocationProvider = ({ children }) => {
  const { activeBrand } = useAuth();
  const { locations, loading: locationsLoading } = useLocationsHook();
  
  // State for the active location ID (either a UUID or 'all')
  const [activeLocationId, setActiveLocationId] = useState(() => {
    if (!activeBrand) return 'all';
    return localStorage.getItem(`aa_active_loc_${activeBrand.id}`) || 'all';
  });

  // Sync state when activeBrand changes
  useEffect(() => {
    if (activeBrand) {
      const stored = localStorage.getItem(`aa_active_loc_${activeBrand.id}`);
      setActiveLocationId(stored || 'all');
    } else {
      setActiveLocationId('all');
    }
  }, [activeBrand]);

  const switchLocation = useCallback((id) => {
    setActiveLocationId(id);
    if (activeBrand) {
      localStorage.setItem(`aa_active_loc_${activeBrand.id}`, id);
    }
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
