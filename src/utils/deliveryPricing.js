export const DELIVERY_RULES_VERSION = 2;

export function defaultDeliveryRules() {
  return { version: 2, enabled: false, freeDistanceM: 500, baseDistanceM: 3000, baseFee: 5000, extraKmFee: 1500, extraKmMode: 'started', maxDistanceM: 0 };
}
export function getDeliveryRules(location = {}) {
  const stored = location?.delivery_pricing_rules;
  return { ...defaultDeliveryRules(), ...(stored?.version === 2 ? stored : {}) };
}
export function hasActiveDeliveryRules(location) {
  return location?.delivery_pricing_rules?.version === 2 && location.delivery_pricing_rules.enabled === true;
}
export function validateDeliveryRules(rules) {
  const errors = [];
  const names = { freeDistanceM: 'Distancia gratis', baseDistanceM: 'Distancia base', baseFee: 'Tarifa base', extraKmFee: 'Kilómetro adicional', maxDistanceM: 'Distancia máxima' };
  for (const key of Object.keys(names)) if (typeof rules[key] !== 'number' || !Number.isFinite(rules[key]) || rules[key] < 0) errors.push(`${names[key]} debe ser un número no negativo.`);
  if (rules.version !== 2 || typeof rules.enabled !== 'boolean') errors.push('La configuración de domicilios no es válida.');
  if (!['started', 'proportional'].includes(rules.extraKmMode)) errors.push('Selecciona cómo cobrar los kilómetros adicionales.');
  if (!(rules.baseDistanceM > 0)) errors.push('La distancia base debe ser mayor que cero.');
  if (rules.freeDistanceM > rules.baseDistanceM) errors.push('La distancia gratis no puede superar la distancia base.');
  if (rules.maxDistanceM > 0 && rules.maxDistanceM < rules.baseDistanceM) errors.push('La distancia máxima debe cubrir al menos la distancia base.');
  if (!Number.isInteger(rules.baseFee) || !Number.isInteger(rules.extraKmFee)) errors.push('Los precios deben ser pesos enteros.');
  return errors;
}
export function calculateDeliveryTariff(rules, distanceM) {
  const errors = validateDeliveryRules(rules);
  if (errors.length) return { status: 'invalid_rules', ready: false, fee: null, isCovered: false, message: errors[0] };
  if (typeof distanceM !== 'number' || !Number.isFinite(distanceM) || distanceM < 0) return { status: 'needs_pin', ready: false, fee: null, isCovered: false, message: 'Confirma el punto de entrega en el mapa para calcular el domicilio.' };
  if (rules.maxDistanceM > 0 && distanceM > rules.maxDistanceM) return { status: 'outside_coverage', ready: false, fee: null, isCovered: false, message: 'El destino supera la distancia máxima configurada. Contacta al negocio para acordar la entrega.' };
  const isFree = distanceM <= rules.freeDistanceM;
  const extraKm = Math.max(0, distanceM - rules.baseDistanceM) / 1000;
  const billedExtraKm = rules.extraKmMode === 'started' ? Math.ceil(extraKm) : extraKm;
  const baseFee = isFree ? 0 : rules.baseFee;
  const extraFee = isFree ? 0 : Math.round(billedExtraKm * rules.extraKmFee);
  return { status: 'quoted', ready: true, isCovered: true, isFree, fee: baseFee + extraFee, distanceM, distanceKm: distanceM / 1000, breakdown: { baseFee, extraFee, billedExtraKm }, source: 'pin_estimate', message: isFree ? 'Gratis por cercanía al local' : 'Tarifa calculada con la distancia estimada del pin' };
}
export function validCoordinates(coords) {
  return coords != null && coords.lat !== null && coords.lng !== null && coords.lat !== '' && coords.lng !== '' && Number.isFinite(Number(coords.lat)) && Number.isFinite(Number(coords.lng)) && Math.abs(Number(coords.lat)) <= 90 && Math.abs(Number(coords.lng)) <= 180;
}
// Keep all precision for tariff boundaries. Round only the displayed distance.
export function estimateDistanceMeters(origin, destination) {
  if (!validCoordinates(origin) || !validCoordinates(destination)) return null;
  const rad = degrees => degrees * Math.PI / 180;
  const dLat = rad(Number(destination.lat) - Number(origin.lat));
  const dLng = rad(Number(destination.lng) - Number(origin.lng));
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(Number(origin.lat))) * Math.cos(rad(Number(destination.lat))) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a))) * 1.25;
}

export function deliveryCoverageLimitMeters(location) {
  const rulesLimit = hasActiveDeliveryRules(location) ? Number(getDeliveryRules(location).maxDistanceM) : 0;
  const radiusLimit = Number(location?.delivery_radius_km) * 1000;
  return [rulesLimit, radiusLimit].filter(value => Number.isFinite(value) && value > 0)
    .reduce((limit, value) => Math.min(limit, value), Infinity);
}

export function checkDeliveryCoverage(location, destination) {
  const rejected = (status, message) => ({ status, message, ready: false, isCovered: false, fee: null });
  const origin = { lat: location?.latitude, lng: location?.longitude };
  if (!validCoordinates(origin)) return rejected('needs_origin', 'La sede necesita configurar su ubicación para entregar a domicilio.');
  const limit = deliveryCoverageLimitMeters(location);
  if (!Number.isFinite(limit)) return rejected('needs_coverage', 'La sede necesita configurar su cobertura de domicilios.');
  const distanceM = estimateDistanceMeters(origin, destination);
  if (distanceM === null) return rejected('needs_pin', 'Confirma el punto de entrega en el mapa.');
  if (distanceM > limit) return rejected('outside_coverage', 'Esta dirección queda fuera de cobertura. Puedes cambiar la dirección o recoger en la sede, si está disponible.');
  return { ready: true, isCovered: true, distanceM, distanceKm: distanceM / 1000 };
}
export function quoteDeliveryFromPins(location, destination, subtotal = 0) {
  const origin = { lat: location?.latitude, lng: location?.longitude };
  const distanceM = estimateDistanceMeters(origin, destination);
  const result = calculateDeliveryTariff(getDeliveryRules(location), distanceM);
  if (!validCoordinates(origin)) return { ...result, ready: false, fee: null, status: 'needs_origin', message: 'El negocio necesita configurar la ubicación de esta sede.' };
  const threshold = Number(location?.free_delivery_threshold ?? 0);
  if (result.ready && threshold > 0 && subtotal >= threshold) return { ...result, fee: 0, isFree: true, message: 'Envío gratis por monto de compra' };
  return result;
}
