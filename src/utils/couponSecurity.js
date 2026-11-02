import { safeStorage as localStorage } from './safeStorage';

const DEVICE_FP_KEY = 'aa_device_fp';
const SESSION_KEY = 'aluna_session_id';

/**
 * Generates or retrieves a unique persistent fingerprint for the current device.
 */
export function getDeviceFingerprint() {
  try {
    const existing = localStorage.getItem(DEVICE_FP_KEY);
    if (existing) return existing;

    const sessionId = localStorage.getItem(SESSION_KEY) || crypto.randomUUID();
    const screenPart = typeof window !== 'undefined' && window.screen
      ? `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth || 24}`
      : '0x0';
    const tzPart = typeof Intl !== 'undefined'
      ? (Intl.DateTimeFormat().resolvedOptions().timeZone || 'tz')
      : 'tz';
    const langPart = typeof navigator !== 'undefined' ? (navigator.language || 'es') : 'es';

    const raw = `${sessionId}_${screenPart}_${tzPart}_${langPart}`;
    localStorage.setItem(DEVICE_FP_KEY, raw);
    if (!localStorage.getItem(SESSION_KEY)) {
      localStorage.setItem(SESSION_KEY, sessionId);
    }
    return raw;
  } catch {
    return 'unknown-device';
  }
}

/**
 * Stamps the current device when a user claims a compensation coupon while the store is paused.
 */
export function claimPauseCoupon(code, brandId) {
  if (!code || !brandId) return false;
  try {
    const cleanCode = code.trim().toUpperCase();
    const storageKey = `aa_pause_claims_${brandId}`;
    const raw = localStorage.getItem(storageKey);
    const claims = raw ? JSON.parse(raw) : {};

    // If already used on this device, do not re-enable
    if (hasDeviceUsedCoupon(cleanCode, brandId)) {
      return { ok: false, reason: 'already_used' };
    }

    claims[cleanCode] = {
      code: cleanCode,
      claimedAt: new Date().toISOString(),
      deviceFp: getDeviceFingerprint(),
      used: false
    };

    localStorage.setItem(storageKey, JSON.stringify(claims));
    localStorage.setItem(`aa_pending_pause_coupon_${brandId}`, cleanCode);
    return { ok: true, claim: claims[cleanCode] };
  } catch (err) {
    console.warn('Error claiming pause coupon:', err);
    return { ok: false, reason: 'error' };
  }
}

/**
 * Checks if the current device has a valid stamp for a pause-only coupon (e.g., VOLVER10).
 */
export function hasValidPauseClaim(code, brandId) {
  if (!code || !brandId) return false;
  try {
    const cleanCode = code.trim().toUpperCase();
    const storageKey = `aa_pause_claims_${brandId}`;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return false;

    const claims = JSON.parse(raw);
    const claim = claims?.[cleanCode];
    if (!claim) return false;
    if (claim.used) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Retrieves any pending pause coupon claimed on this device so the Cart can offer/apply it.
 */
export function getPendingPauseCoupon(brandId) {
  if (!brandId) return null;
  try {
    const code = localStorage.getItem(`aa_pending_pause_coupon_${brandId}`);
    if (!code) return null;
    if (hasDeviceUsedCoupon(code, brandId)) {
      localStorage.removeItem(`aa_pending_pause_coupon_${brandId}`);
      return null;
    }
    return code;
  } catch {
    return null;
  }
}

/**
 * Records a digital authorization stamp when a customer enters from a CRM Recovery WhatsApp link (?src=recuperacion).
 */
export function recordCrmRecoveryVisit(brandId) {
  if (!brandId) return;
  try {
    const storageKey = `aa_crm_recovery_${brandId}`;
    localStorage.setItem(storageKey, JSON.stringify({
      authorizedAt: new Date().toISOString(),
      deviceFp: getDeviceFingerprint()
    }));
  } catch {}
}

/**
 * Checks if the device has the CRM recovery stamp.
 */
export function hasCrmRecoveryStamp(brandId) {
  if (!brandId) return false;
  try {
    const raw = localStorage.getItem(`aa_crm_recovery_${brandId}`);
    return Boolean(raw);
  } catch {
    return false;
  }
}

/**
 * Checks if this device has already redeemed a specific coupon code.
 */
export function hasDeviceUsedCoupon(code, brandId) {
  if (!code || !brandId) return false;
  try {
    const cleanCode = code.trim().toUpperCase();
    const raw = localStorage.getItem(`aa_used_coupons_${brandId}`);
    const usedList = raw ? JSON.parse(raw) : [];
    return Array.isArray(usedList) && usedList.some(u => u.code === cleanCode);
  } catch {
    return false;
  }
}

/**
 * Marks a coupon code as used on this device after an order is completed.
 */
export function markCouponUsedOnDevice(code, brandId, phone = '') {
  if (!code || !brandId) return;
  try {
    const cleanCode = code.trim().toUpperCase();
    const storageKey = `aa_used_coupons_${brandId}`;
    const raw = localStorage.getItem(storageKey);
    const usedList = raw ? JSON.parse(raw) : [];

    if (!usedList.some(u => u.code === cleanCode)) {
      usedList.push({
        code: cleanCode,
        usedAt: new Date().toISOString(),
        deviceFp: getDeviceFingerprint(),
        phone: phone || ''
      });
      localStorage.setItem(storageKey, JSON.stringify(usedList));
    }

    // Mark pause claim as used if applicable
    const pauseKey = `aa_pause_claims_${brandId}`;
    const rawClaims = localStorage.getItem(pauseKey);
    if (rawClaims) {
      const claims = JSON.parse(rawClaims);
      if (claims[cleanCode]) {
        claims[cleanCode].used = true;
        localStorage.setItem(pauseKey, JSON.stringify(claims));
      }
    }

    // Remove pending auto-coupon
    const pending = localStorage.getItem(`aa_pending_pause_coupon_${brandId}`);
    if (pending === cleanCode) {
      localStorage.removeItem(`aa_pending_pause_coupon_${brandId}`);
    }
  } catch (err) {
    console.warn('Error marking coupon used:', err);
  }
}

/**
 * Default Starter Coupons for Boku Bento / Brands
 * These work out-of-the-box and can also be managed in Campañas & Descuentos.
 */
export function getDefaultBrandCoupons(brandId) {
  const disabledRaw = typeof window !== 'undefined'
    ? localStorage.getItem(`aa_disabled_default_coupons_${brandId}`)
    : null;
  const disabledCodes = disabledRaw ? JSON.parse(disabledRaw) : [];

  const defaults = [
    {
      id: `default-domigratis-${brandId}`,
      brand_id: brandId,
      name: 'Domicilio 100% Gratis (Cupón de Carrito)',
      code: 'DOMIGRATIS',
      type: 'free_delivery',
      target: 'delivery',
      value: 0,
      min_order_amount: 25000,
      is_active: !disabledCodes.includes('DOMIGRATIS'),
      show_banner: false,
      coupon_scope: 'general',
      description: 'Envío gratis en pedidos desde $25.000 (1 uso por cliente)',
      is_default_template: true
    },
    {
      id: `default-boku10-${brandId}`,
      brand_id: brandId,
      name: '10% de Descuento en toda la Carta',
      code: 'BOKU10',
      type: 'percentage_discount',
      target: 'all',
      value: 10,
      min_order_amount: 20000,
      is_active: !disabledCodes.includes('BOKU10'),
      show_banner: false,
      coupon_scope: 'general',
      description: '10% OFF en compras desde $20.000 (1 uso por cliente)',
      is_default_template: true
    },
    {
      id: `default-disculpaboku-${brandId}`,
      brand_id: brandId,
      name: '15% OFF Compensación Clientes (CRM)',
      code: 'DISCULPABOKU',
      type: 'percentage_discount',
      target: 'all',
      value: 15,
      min_order_amount: 0,
      is_active: !disabledCodes.includes('DISCULPABOKU'),
      show_banner: false,
      coupon_scope: 'crm_recovery',
      description: 'Exclusivo para clientes con pedido cancelado o link de recuperación',
      is_default_template: true
    },
    {
      id: `default-volver10-${brandId}`,
      brand_id: brandId,
      name: '10% OFF Por Espera (Tienda en Pausa)',
      code: 'VOLVER10',
      type: 'percentage_discount',
      target: 'all',
      value: 10,
      min_order_amount: 0,
      is_active: !disabledCodes.includes('VOLVER10'),
      show_banner: false,
      coupon_scope: 'pause_only',
      description: 'Solo se activa en celulares que entraron mientras la tienda estaba cerrada',
      is_default_template: true
    }
  ];

  return defaults;
}
