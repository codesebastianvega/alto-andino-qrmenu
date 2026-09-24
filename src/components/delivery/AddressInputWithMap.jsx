import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify-icon/react';
import { useGooglePlaces } from '@/hooks/useGooglePlaces';
import { estimateRoadDistance, calculateDynamicDeliveryFee } from '@/utils/geoDistance';
import { formatCOP } from '@/utils/money';

export default function AddressInputWithMap({
  value,
  onChange,
  onLocationSelect,
  currentLocation,
  orderSubtotal = 0,
  placeholder = "Ej: Calle 4 # 5-20, Barrio San Pablo"
}) {
  const inputRef = useRef(null);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [calculatedDistance, setCalculatedDistance] = useState(null);
  const [feeDetails, setFeeDetails] = useState(null);

  const { isLoaded: isGoogleLoaded, attachAutocomplete } = useGooglePlaces();

  const sedeLat = Number(currentLocation?.latitude);
  const sedeLng = Number(currentLocation?.longitude);
  const hasSedeCoords = Boolean(sedeLat && sedeLng);

  // Recalculate fee whenever distance, location settings, or subtotal changes
  useEffect(() => {
    if (!currentLocation) return;

    const details = calculateDynamicDeliveryFee({
      distanceKm: calculatedDistance,
      maxRadiusKm: currentLocation.delivery_radius_km || 5,
      baseDistanceKm: currentLocation.base_delivery_distance_km || 3,
      baseFee: currentLocation.delivery_fee || 0,
      extraKmFee: currentLocation.extra_km_fee || 1000,
      freeDeliveryThreshold: currentLocation.free_delivery_threshold || 0,
      orderSubtotal
    });

    setFeeDetails(details);
    onLocationSelect?.({
      address: value,
      distanceKm: calculatedDistance,
      isCovered: details.isCovered,
      fee: details.fee,
      feeDetails: details
    });
  }, [calculatedDistance, currentLocation, orderSubtotal, value]);

  // Attach Google Places Autocomplete when Google script is ready
  useEffect(() => {
    if (!isGoogleLoaded || !inputRef.current) return;

    attachAutocomplete(inputRef.current, (selectedPlace) => {
      onChange(selectedPlace.address);

      if (hasSedeCoords && selectedPlace.lat && selectedPlace.lng) {
        const roadDist = estimateRoadDistance(sedeLat, sedeLng, selectedPlace.lat, selectedPlace.lng);
        setCalculatedDistance(roadDist);
      }
    });
  }, [isGoogleLoaded, attachAutocomplete, hasSedeCoords, sedeLat, sedeLng, onChange]);

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

        let detectedAddress = `Ubicación GPS (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`;

        // Reverse Geocoding with OpenStreetMap Nominatim (Free, no API key needed)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'es' } }
          );
          if (res.ok) {
            const data = await res.json();
            if (data.display_name) {
              const road = data.address?.road || data.address?.pedestrian || '';
              const houseNumber = data.address?.house_number || '';
              const neighbourhood = data.address?.neighbourhood || data.address?.suburb || '';
              const city = data.address?.city || data.address?.town || data.address?.village || '';
              
              if (road) {
                detectedAddress = `${road} ${houseNumber ? `# ${houseNumber}` : ''}${neighbourhood ? `, ${neighbourhood}` : ''}${city ? ` (${city})` : ''}`.trim();
              } else {
                detectedAddress = data.display_name.split(',').slice(0, 3).join(', ');
              }
            }
          }
        } catch (revErr) {
          console.warn("Reverse geocode fallback used:", revErr);
        }

        onChange(detectedAddress);
        setIsLocating(false);

        if (hasSedeCoords) {
          const roadDist = estimateRoadDistance(sedeLat, sedeLng, userLat, userLng);
          setCalculatedDistance(roadDist);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setGeoError("Permiso de ubicación denegado. Puedes escribir tu dirección manualmente.");
        } else {
          setGeoError("No se pudo obtener la ubicación actual.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
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
            // Reset distance if manual typing changes significantly
            if (!e.target.value) setCalculatedDistance(null);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-28 py-3 text-xs sm:text-sm font-semibold text-neutral-800 bg-neutral-50/80 hover:bg-neutral-50 focus:bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all placeholder:text-neutral-400 placeholder:font-normal"
        />

        {/* GPS Location Button */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          title="Detectar mi ubicación actual por GPS"
          className="absolute right-2 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          {isLocating ? (
            <Icon icon="eos-icons:loading" className="animate-spin text-xs" />
          ) : (
            <Icon icon="solar:gps-bold" className="text-xs text-emerald-600" />
          )}
          <span>{isLocating ? "Localizando..." : "Mi GPS"}</span>
        </button>
      </div>

      {/* Geolocation feedback / error message */}
      {geoError && (
        <p className="text-[11px] font-medium text-amber-600 flex items-center gap-1 pl-1">
          <Icon icon="solar:info-circle-bold" />
          {geoError}
        </p>
      )}

      {/* Distance and Coverage Indicator */}
      {feeDetails && calculatedDistance !== null && (
        <div
          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all ${
            feeDetails.isCovered
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-800 animate-pulse'
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon
              icon={feeDetails.isCovered ? "solar:routing-2-bold" : "solar:danger-triangle-bold"}
              className={`text-base ${feeDetails.isCovered ? 'text-emerald-600' : 'text-rose-600'}`}
            />
            <div>
              <span className="block leading-tight">
                {feeDetails.isCovered
                  ? `Aprox. ${calculatedDistance} km de la sede`
                  : `Fuera de cobertura: ${calculatedDistance} km`}
              </span>
              <span className="text-[10px] font-medium opacity-75">
                {feeDetails.message}
              </span>
            </div>
          </div>

          <div className="text-right shrink-0">
            {feeDetails.isCovered ? (
              <span className="text-xs font-black">
                {feeDetails.isFree ? 'GRATIS' : formatCOP(feeDetails.fee)}
              </span>
            ) : (
              <span className="text-[10px] uppercase font-black text-rose-600">
                No disponible
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
