/**
 * Geographic distance calculations and delivery pricing engine for Aluna QR Menu.
 */

/**
 * Calculates the great-circle distance between two points on the Earth (in km)
 * using the Haversine formula.
 * 
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in kilometers
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  
  const R = 6371; // Earth's mean radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Estimates actual road travel distance in kilometers by applying 
 * an urban street routing factor (typically 1.25x straight-line).
 * 
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Estimated road distance in kilometers
 */
export function estimateRoadDistance(lat1, lon1, lat2, lon2) {
  const straightLine = haversineDistance(lat1, lon1, lat2, lon2);
  if (straightLine === null) return null;
  // Factor for urban grid / street curves in Latin American cities
  const roadFactor = 1.25;
  return Math.round(straightLine * roadFactor * 10) / 10;
}

/**
 * Computes dynamic delivery fee based on location settings, distance, and subtotal.
 * 
 * @param {Object} params
 * @param {number} params.distanceKm - Distance between sede and customer
 * @param {number} params.maxRadiusKm - Maximum allowed delivery radius
 * @param {number} params.baseDistanceKm - Distance covered by base fee (default 3km)
 * @param {number} params.baseFee - Flat fee for base distance
 * @param {number} params.extraKmFee - Price per km beyond baseDistanceKm
 * @param {number} params.freeDeliveryThreshold - Minimum order subtotal for free delivery (0 = disabled)
 * @param {number} params.orderSubtotal - Total cost of food items in cart
 * 
 * @returns {Object} { fee, isCovered, isFree, extraKm, message }
 */
export function calculateDynamicDeliveryFee({
  distanceKm,
  maxRadiusKm = 5,
  baseDistanceKm = 3,
  baseFee = 4000,
  extraKmFee = 1000,
  freeDeliveryThreshold = 0,
  orderSubtotal = 0
}) {
  const parsedDistance = Number(distanceKm);
  const parsedMaxRadius = Number(maxRadiusKm) || 5;
  const parsedBaseDist = Number(baseDistanceKm) || 3;
  const parsedBaseFee = Number(baseFee) || 0;
  const parsedExtraKmFee = Number(extraKmFee) || 0;
  const parsedFreeThreshold = Number(freeDeliveryThreshold) || 0;
  const parsedSubtotal = Number(orderSubtotal) || 0;

  // If no distance calculated yet, fallback to base fee
  if (distanceKm === null || distanceKm === undefined || isNaN(parsedDistance)) {
    const isFree = parsedFreeThreshold > 0 && parsedSubtotal >= parsedFreeThreshold;
    return {
      fee: isFree ? 0 : parsedBaseFee,
      isCovered: true,
      isFree,
      extraKm: 0,
      distanceKm: null,
      message: isFree ? '¡Envío gratis por monto de compra!' : ''
    };
  }

  // Check coverage radius
  const isCovered = parsedDistance <= parsedMaxRadius;
  if (!isCovered) {
    return {
      fee: parsedBaseFee,
      isCovered: false,
      isFree: false,
      extraKm: Math.round((parsedDistance - parsedMaxRadius) * 10) / 10,
      distanceKm: parsedDistance,
      message: `Tu ubicación está a ${parsedDistance} km. Nuestro radio de cobertura máximo es de ${parsedMaxRadius} km.`
    };
  }

  // Check free delivery threshold
  if (parsedFreeThreshold > 0 && parsedSubtotal >= parsedFreeThreshold) {
    return {
      fee: 0,
      isCovered: true,
      isFree: true,
      extraKm: 0,
      distanceKm: parsedDistance,
      message: '¡Felicitaciones! Tu pedido califica para envío gratis.'
    };
  }

  // Calculate base + extra km
  if (parsedDistance <= parsedBaseDist) {
    return {
      fee: parsedBaseFee,
      isCovered: true,
      isFree: parsedBaseFee === 0,
      extraKm: 0,
      distanceKm: parsedDistance,
      message: `Tarifa estándar (hasta ${parsedBaseDist} km)`
    };
  }

  const extraKm = Math.ceil(parsedDistance - parsedBaseDist);
  const calculatedFee = parsedBaseFee + (extraKm * parsedExtraKmFee);

  return {
    fee: calculatedFee,
    isCovered: true,
    isFree: false,
    extraKm,
    distanceKm: parsedDistance,
    message: `Tarifa base + ${extraKm} km adicional${extraKm > 1 ? 'es' : ''}`
  };
}
