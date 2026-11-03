import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify-icon/react';
import { useGooglePlaces } from '@/hooks/useGooglePlaces';
import { estimateRoadDistance, calculateDynamicDeliveryFee } from '@/utils/geoDistance';
import { formatCOP } from '@/utils/money';
import CustomerRouteMap from '@/components/maps/CustomerRouteMap';

export default function AddressInputWithMap({
  value,
  onChange,
  onLocationSelect,
  currentLocation,
  orderSubtotal = 0,
  freeDeliveryPromo = null,
  initialCoords = null,
  placeholder = "Ej: Calle 4 # 5-20, Barrio Paso Ancho"
}) {
  const inputRef = useRef(null);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [calculatedDistance, setCalculatedDistance] = useState(null);
  const [feeDetails, setFeeDetails] = useState(null);
  const [userCoords, setUserCoords] = useState(() =>
    initialCoords?.lat && initialCoords?.lng ? { lat: Number(initialCoords.lat), lng: Number(initialCoords.lng) } : null
  );
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [openPinModal, setOpenPinModal] = useState(false);

  const { isLoaded: isGoogleLoaded, attachAutocomplete } = useGooglePlaces();

  const sedeLat = Number(currentLocation?.latitude);
  const sedeLng = Number(currentLocation?.longitude);
  const hasSedeCoords = Boolean(sedeLat && sedeLng);

  useEffect(() => {
    if (initialCoords?.lat && initialCoords?.lng) {
      const lat = Number(initialCoords.lat);
      const lng = Number(initialCoords.lng);
      setUserCoords({ lat, lng });
      if (hasSedeCoords) {
        setCalculatedDistance(estimateRoadDistance(sedeLat, sedeLng, lat, lng));
      }
    }
  }, [initialCoords?.lat, initialCoords?.lng, hasSedeCoords, sedeLat, sedeLng]);

  // Recalculate fee whenever distance, location settings, or subtotal changes
  useEffect(() => {
    const details = currentLocation
      ? calculateDynamicDeliveryFee({
          distanceKm: calculatedDistance,
          maxRadiusKm: currentLocation.delivery_radius_km || 8,
          baseDistanceKm: currentLocation.base_delivery_distance_km || 3,
          baseFee: currentLocation.delivery_fee || 0,
          extraKmFee: currentLocation.extra_km_fee || 1000,
          freeDeliveryThreshold: currentLocation.free_delivery_threshold || 0,
          orderSubtotal
        })
      : { isCovered: true, fee: 0, message: 'Punto GPS fijado' };

    if (freeDeliveryPromo && (!freeDeliveryPromo.min_order_amount || orderSubtotal >= Number(freeDeliveryPromo.min_order_amount))) {
      details.fee = 0;
      details.isPromoFree = true;
      details.message = `¡Campaña activa: ${freeDeliveryPromo.name}! Domicilio $0 COP`;
    }

    setFeeDetails(details);
    onLocationSelect?.({
      address: value,
      coords: userCoords,
      googleMapsUrl: userCoords ? `https://www.google.com/maps?q=${userCoords.lat},${userCoords.lng}` : null,
      distanceKm: calculatedDistance,
      isCovered: details.isCovered,
      fee: details.fee,
      feeDetails: details
    });
  }, [calculatedDistance, currentLocation, orderSubtotal, value, freeDeliveryPromo, userCoords?.lat, userCoords?.lng]);

  // Attach Google Places Autocomplete when Google script is ready
  useEffect(() => {
    if (!isGoogleLoaded || !inputRef.current) return;

    attachAutocomplete(inputRef.current, (selectedPlace) => {
      onChange(selectedPlace.address);

      if (selectedPlace.lat && selectedPlace.lng) {
        setUserCoords({ lat: selectedPlace.lat, lng: selectedPlace.lng });
        if (hasSedeCoords) {
          const roadDist = estimateRoadDistance(sedeLat, sedeLng, selectedPlace.lat, selectedPlace.lng);
          setCalculatedDistance(roadDist);
        }
      }
    });
  }, [isGoogleLoaded, attachAutocomplete, hasSedeCoords, sedeLat, sedeLng, onChange]);

  const reverseGeocodeAndSync = async (lat, lng, overwriteAddressIfEmpty = false) => {
    setUserCoords({ lat, lng });
    if (hasSedeCoords) {
      const roadDist = estimateRoadDistance(sedeLat, sedeLng, lat, lng);
      setCalculatedDistance(roadDist);
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'es' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.display_name) {
          const road = data.address?.road || data.address?.pedestrian || '';
          const houseNumber = data.address?.house_number || '';
          const neighbourhood = data.address?.neighbourhood || data.address?.suburb || '';
          const city = data.address?.city || data.address?.town || data.address?.village || '';
          const formatted = road
            ? `${road} ${houseNumber ? `# ${houseNumber}` : ''}${neighbourhood ? `, ${neighbourhood}` : ''}${city ? ` (${city})` : ''}`.trim()
            : data.display_name.split(',').slice(0, 3).join(', ');

          if (overwriteAddressIfEmpty || !value || value.startsWith('Ubicación GPS')) {
            onChange(formatted);
          }
        }
      }
    } catch (revErr) {
      if (overwriteAddressIfEmpty && !value) {
        onChange(`Ubicación GPS (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
      }
    }
  };

  // Native Browser GPS Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("La geolocalización no es compatible con este navegador.");
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        await reverseGeocodeAndSync(userLat, userLng, true);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setGeoError("Permiso GPS denegado. Usa el botón 'Mapa' para marcar tu casa manualmente.");
        } else {
          setGeoError("No se pudo obtener el GPS. Usa el botón 'Mapa' para fijar el pin.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleOpenManualPinPicker = async () => {
    setGeoError(null);
    // Si aún no hay coordenadas pero escribió texto (ej. "Paso Ancho"), intentar geocodificar con Nominatim para centrar el mapa cerca
    if (!userCoords && value && value.trim().length > 2) {
      try {
        const query = encodeURIComponent(`${value.trim()}, Zipaquirá, Colombia`);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
        if (res.ok) {
          const list = await res.json();
          if (list?.[0]?.lat && list?.[0]?.lon) {
            const lat = Number(list[0].lat);
            const lng = Number(list[0].lon);
            setUserCoords({ lat, lng });
            if (hasSedeCoords) {
              setCalculatedDistance(estimateRoadDistance(sedeLat, sedeLng, lat, lng));
            }
            setOpenPinModal(true);
            return;
          }
        }
      } catch {}
    }

    if (!userCoords) {
      const defaultLat = hasSedeCoords ? sedeLat : 5.0224;
      const defaultLng = hasSedeCoords ? sedeLng : -74.0018;
      setUserCoords({ lat: defaultLat, lng: defaultLng });
    }
    setOpenPinModal(true);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-neutral-400 pointer-events-none">
          <Icon icon="solar:map-point-wave-bold" className="text-lg text-emerald-600" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-40 py-3 text-xs sm:text-sm font-semibold text-neutral-800 bg-white hover:bg-neutral-50/50 focus:bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all placeholder:text-stone-400 placeholder:font-normal"
        />

        {/* Botones Rápidos: Mi GPS + Fijar Pin en Mapa */}
        <div className="absolute right-1.5 flex items-center gap-1">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            title="Detectar mi ubicación actual por GPS"
            className="px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isLocating ? (
              <Icon icon="eos-icons:loading" className="animate-spin text-xs" />
            ) : (
              <Icon icon="solar:gps-bold" className="text-xs text-emerald-600" />
            )}
            <span>{isLocating ? "..." : "GPS"}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenManualPinPicker}
            title="Abrir mapa para marcar el punto exacto con un pin"
            className="px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Icon icon="solar:map-point-bold" className="text-xs text-emerald-400" />
            <span>Mapa</span>
          </button>
        </div>
      </div>

      {/* Geolocation feedback / error message */}
      {geoError && (
        <p className="text-[11px] font-medium text-amber-600 flex items-center gap-1 pl-1">
          <Icon icon="solar:info-circle-bold" />
          {geoError}
        </p>
      )}

      {/* GPS Coords Confirmation Bar */}
      {userCoords && (
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Icon icon="solar:check-circle-bold" className="text-emerald-600 text-sm shrink-0" />
            <span className="font-bold text-emerald-950 truncate">
              Pin GPS exacto fijado {calculatedDistance !== null ? `(${calculatedDistance} km)` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`https://www.google.com/maps?q=${userCoords.lat},${userCoords.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-black text-emerald-700 hover:underline"
            >
              Ver en Google Maps ↗
            </a>
            <button
              type="button"
              onClick={() => setShowMiniMap(prev => !prev)}
              className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold cursor-pointer"
            >
              {showMiniMap ? 'Ocultar mapa' : 'Ver mapa'}
            </button>
          </div>
        </div>
      )}

      {/* Mini Interactive Route Map + Modal Pin Picker */}
      {(userCoords || openPinModal) && showMiniMap && (
        <CustomerRouteMap
          sedeCoords={hasSedeCoords ? [sedeLat, sedeLng] : [5.0224, -74.0018]}
          customerCoords={
            userCoords
              ? [userCoords.lat, userCoords.lng]
              : hasSedeCoords
              ? [sedeLat, sedeLng]
              : [5.0224, -74.0018]
          }
          isCovered={feeDetails?.isCovered ?? true}
          radiusKm={currentLocation?.delivery_radius_km || 6}
          distanceKm={calculatedDistance}
          externalModalOpen={openPinModal}
          onExternalModalClose={() => setOpenPinModal(false)}
          onCoordsChange={(newCoords) => {
            reverseGeocodeAndSync(newCoords.lat, newCoords.lng, false);
          }}
        />
      )}
    </div>
  );
}
