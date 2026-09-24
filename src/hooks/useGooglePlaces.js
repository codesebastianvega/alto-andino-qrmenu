import { useState, useEffect, useRef, useCallback } from 'react';

let isScriptLoading = false;
let isScriptLoaded = false;
const callbacks = [];

/**
 * Hook to asynchronously load Google Places API script only once
 * and attach autocomplete to address inputs.
 */
export function useGooglePlaces() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [isLoaded, setIsLoaded] = useState(Boolean(window.google?.maps?.places));
  const [loadError, setLoadError] = useState(!apiKey ? 'No Google Maps API Key provided' : null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    if (!apiKey) {
      setLoadError('No Google Maps API Key provided');
      return;
    }

    if (window.google?.maps?.places) {
      setIsLoaded(true);
      return;
    }

    if (isScriptLoaded) {
      setIsLoaded(true);
      return;
    }

    if (isScriptLoading) {
      callbacks.push(() => setIsLoaded(true));
      return;
    }

    isScriptLoading = true;
    const script = document.createElement('script');
    script.id = 'google-maps-places-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=es&region=CO`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isScriptLoading = false;
      isScriptLoaded = true;
      setIsLoaded(true);
      callbacks.forEach(cb => cb());
      callbacks.length = 0;
    };

    script.onerror = (err) => {
      isScriptLoading = false;
      setLoadError('Failed to load Google Maps script');
      console.warn('⚠️ [Google Places] Error loading Google Maps script:', err);
    };

    document.head.appendChild(script);
  }, [apiKey]);

  const attachAutocomplete = useCallback((inputEl, onSelect) => {
    if (!inputEl || !window.google?.maps?.places) return null;

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(inputEl, {
        componentRestrictions: { country: 'co' },
        fields: ['address_components', 'geometry', 'formatted_address', 'name']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place || !place.geometry) return;

        const lat = place.geometry.location?.lat();
        const lng = place.geometry.location?.lng();
        const formattedAddress = place.formatted_address || place.name || inputEl.value;

        onSelect?.({
          address: formattedAddress,
          lat,
          lng,
          place
        });
      });

      autocompleteRef.current = autocomplete;
      return autocomplete;
    } catch (e) {
      console.warn('⚠️ [Google Places] Failed to initialize Autocomplete:', e);
      return null;
    }
  }, []);

  return {
    isLoaded,
    loadError,
    attachAutocomplete
  };
}
