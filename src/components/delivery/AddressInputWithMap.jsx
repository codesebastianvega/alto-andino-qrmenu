import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@iconify-icon/react';
import { useGooglePlaces } from '@/hooks/useGooglePlaces';
import { calculateDynamicDeliveryFee } from '@/utils/geoDistance';
import { checkDeliveryCoverage, deliveryCoverageLimitMeters, estimateDistanceMeters, hasActiveDeliveryRules, quoteDeliveryFromPins, validCoordinates } from '@/utils/deliveryPricing';
import { formatCOP } from '@/utils/money';
import CustomerRouteMap from '@/components/maps/CustomerRouteMap';

export default function AddressInputWithMap({ value, onChange, onLocationSelect, currentLocation, orderSubtotal = 0, freeDeliveryPromo = null, initialCoords = null, placeholder = 'Dirección de entrega' }) {
  const inputRef = useRef(null);
  const callbackRef = useRef(onLocationSelect);
  callbackRef.current = onLocationSelect;
  const requestRef = useRef(0);
  const [userCoords, setUserCoords] = useState(() => validCoordinates(initialCoords) ? initialCoords : null);
  const [selection, setSelection] = useState(() => validCoordinates(initialCoords) ? { coords: initialCoords, address: value } : null);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [openPinModal, setOpenPinModal] = useState(false);
  const { isLoaded: isGoogleLoaded, attachAutocomplete } = useGooglePlaces();
  const activeRules = hasActiveDeliveryRules(currentLocation);
  const origin = { lat: currentLocation?.latitude, lng: currentLocation?.longitude };
  const hasOrigin = validCoordinates(origin);
  const confirmedCoords = selection?.address === value ? selection.coords : null;
  const distanceM = estimateDistanceMeters(origin, confirmedCoords);
  const distanceKm = distanceM == null ? null : distanceM / 1000;

  useEffect(() => {
    if (validCoordinates(initialCoords)) {
      setUserCoords(initialCoords);
      setSelection({ coords: initialCoords, address: value });
    }
  }, [initialCoords?.lat, initialCoords?.lng]);
  useEffect(() => { requestRef.current += 1; }, [value, currentLocation?.id]);
  useEffect(() => () => { requestRef.current += 1; }, []);

  const details = useMemo(() => {
    const coverage = checkDeliveryCoverage(currentLocation, confirmedCoords);
    if (!coverage.ready) return coverage;
    const result = activeRules ? quoteDeliveryFromPins(currentLocation, confirmedCoords, orderSubtotal)
      : { ...calculateDynamicDeliveryFee({ distanceKm, maxRadiusKm: deliveryCoverageLimitMeters(currentLocation) / 1000, baseDistanceKm: currentLocation.base_delivery_distance_km ?? 3, baseFee: currentLocation.delivery_fee ?? 0, extraKmFee: currentLocation.extra_km_fee ?? 1000, freeDeliveryThreshold: currentLocation.free_delivery_threshold ?? 0, orderSubtotal }), ready: true };
    if (result.ready && result.isCovered && freeDeliveryPromo && (!freeDeliveryPromo.min_order_amount || orderSubtotal >= Number(freeDeliveryPromo.min_order_amount))) {
      return { ...result, fee: 0, isFree: true, isPromoFree: true, message: `Domicilio gratis por ${freeDeliveryPromo.name}` };
    }
    return result;
  }, [activeRules, currentLocation, confirmedCoords?.lat, confirmedCoords?.lng, distanceM, orderSubtotal, freeDeliveryPromo]);

  useEffect(() => {
    callbackRef.current?.({ address: value, locationId: currentLocation?.id, coords: confirmedCoords, distanceKm, ready: details.ready, isCovered: details.isCovered, fee: details.fee, feeDetails: details, googleMapsUrl: confirmedCoords ? `https://www.google.com/maps?q=${confirmedCoords.lat},${confirmedCoords.lng}` : null });
  }, [value, currentLocation?.id, confirmedCoords?.lat, confirmedCoords?.lng, distanceKm, details]);

  const syncPin = async (lat, lng, replaceAddress = false) => {
    const coords = { lat: Number(lat), lng: Number(lng) };
    if (!validCoordinates(coords)) return;
    setUserCoords(coords);
    setSelection({ coords, address: value });
    setGeoError(null);
    const request = ++requestRef.current;
    if (!replaceAddress && value?.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, { headers: { 'Accept-Language': 'es' } });
      const data = res.ok ? await res.json() : null;
      if (request !== requestRef.current) return;
      const address = data?.display_name?.split(',').slice(0, 4).join(', ') || `Ubicación GPS (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`;
      setSelection({ coords, address });
      onChange(address);
    } catch {
      if (request !== requestRef.current) return;
      const address = `Ubicación GPS (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`;
      setSelection({ coords, address });
      onChange(address);
    }
  };
  useEffect(() => {
    if (!isGoogleLoaded || !inputRef.current) return;
    attachAutocomplete(inputRef.current, place => {
      const coords = { lat: place.lat, lng: place.lng };
      if (!validCoordinates(coords)) return;
      requestRef.current += 1;
      setUserCoords(coords);
      setSelection({ coords, address: place.address });
      onChange(place.address);
    });
  }, [isGoogleLoaded, attachAutocomplete]);
  const useGPS = () => {
    if (!navigator.geolocation) { setGeoError('Usa el mapa para confirmar el punto de entrega.'); return; }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async pos => { await syncPin(pos.coords.latitude, pos.coords.longitude, true); setIsLocating(false); }, () => { setGeoError('No se pudo obtener el GPS. Marca el destino en el mapa.'); setIsLocating(false); }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  };
  const sedeCoords = hasOrigin ? [Number(origin.lat), Number(origin.lng)] : null;
  const mapCoords = userCoords ? [Number(userCoords.lat), Number(userCoords.lng)] : sedeCoords || [4.65, -74.1];
  return <div className="flex flex-col gap-2">
    <input ref={inputRef} type="text" aria-label="Dirección de entrega" value={value} onChange={e => { requestRef.current += 1; setSelection(null); onChange(e.target.value); }} placeholder={placeholder} className="w-full p-3 text-xs sm:text-sm font-semibold text-neutral-800 bg-white border border-stone-300 rounded-xl" />
    <div className="flex gap-2">
      <button type="button" disabled={isLocating} onClick={useGPS} className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold"><Icon icon="solar:gps-bold" className="inline mr-1" />{isLocating ? 'Localizando…' : 'Usar mi GPS'}</button>
      <button type="button" onClick={() => { setShowMiniMap(true); setOpenPinModal(true); }} className="px-3 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold">Confirmar pin en mapa</button>
    </div>
    {geoError && <p role="alert" className="text-xs text-amber-700">{geoError}</p>}
    {confirmedCoords && <p className="text-xs font-semibold text-emerald-800">Pin confirmado{distanceKm == null ? '' : ` · Distancia estimada: ${distanceKm.toFixed(2)} km`}</p>}
    <div role="status" className={`rounded-xl border p-3 text-xs ${details.ready ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
      <p className="font-bold">{details.ready ? `Domicilio: ${details.fee === 0 ? 'Gratis' : formatCOP(details.fee)}` : 'Domicilio por calcular'}</p>
      <p className="mt-1">{details.message}. Distancia aproximada desde el pin; no es una ruta por calles.</p>
    </div>
    {(userCoords || openPinModal) && showMiniMap && <>
      <button type="button" onClick={() => setShowMiniMap(false)} className="self-start text-xs text-neutral-600">Ocultar mapa</button>
      <CustomerRouteMap sedeCoords={sedeCoords} customerCoords={mapCoords} isCovered={details.isCovered} radiusKm={Number.isFinite(deliveryCoverageLimitMeters(currentLocation)) ? deliveryCoverageLimitMeters(currentLocation) / 1250 : 0} distanceKm={distanceKm == null ? null : Number(distanceKm.toFixed(2))} externalModalOpen={openPinModal} onExternalModalClose={() => setOpenPinModal(false)} onCoordsChange={coords => syncPin(coords.lat, coords.lng)} onConfirmPoint={coords => syncPin(coords.lat, coords.lng)} />
    </>}
  </div>;
}
