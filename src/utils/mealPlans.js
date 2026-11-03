import { safeStorage as localStorage } from './safeStorage';
import { getDeviceFingerprint } from './couponSecurity';

export const MEAL_PLAN_TEMPLATES = [
  {
    id: 'semanal_bowls',
    plan_type: 'semanal',
    label: 'Plan Semanal Fit (5 Bowls)',
    short_label: 'Semanal (5 Bowls)',
    total_credits: 5,
    plan_price: 80000,
    bowl_value: 17000,
    unit_price_display: 16000,
    includes_delivery: false,
    delivery_fee: 5000,
    badge: '5 Bowls ($16.000 c/u) + envío aparte',
    description: 'Base + 1 Proteína + 5 Toppings + Semillas + Salsa'
  },
  {
    id: 'semanal_full',
    plan_type: 'semanal_full',
    label: 'Plan Semanal Todo Incluido (5 Bowls + Domicilio)',
    short_label: 'Semanal Todo Incluido (5)',
    total_credits: 5,
    plan_price: 105000,
    bowl_value: 17000,
    unit_price_display: 21000,
    includes_delivery: true,
    delivery_fee: 0,
    badge: '5 Bowls + Domicilio incluido ($21.000/día)',
    description: 'Incluye los 5 Bowls armados a tu gusto + los 5 domicilios'
  },
  {
    id: 'quincenal_bowls',
    plan_type: 'quincenal',
    label: 'Plan Quincenal Fit (10 Bowls)',
    short_label: 'Quincenal (10 Bowls)',
    total_credits: 10,
    plan_price: 155000,
    bowl_value: 17000,
    unit_price_display: 15500,
    includes_delivery: false,
    delivery_fee: 5000,
    badge: '10 Bowls ($15.500 c/u) + envío aparte',
    description: 'Base + 1 Proteína + 5 Toppings + Semillas + Salsa'
  },
  {
    id: 'quincenal_full',
    plan_type: 'quincenal_full',
    label: 'Plan Quincenal Todo Incluido (10 Bowls + Domicilio)',
    short_label: 'Quincenal Todo Incluido (10)',
    total_credits: 10,
    plan_price: 205000,
    bowl_value: 17000,
    unit_price_display: 20500,
    includes_delivery: true,
    delivery_fee: 0,
    badge: '10 Bowls + Domicilio incluido ($20.500/día)',
    description: 'Incluye los 10 Bowls armados a tu gusto + los 10 domicilios'
  },
  {
    id: 'mensual_bowls',
    plan_type: 'mensual',
    label: 'Plan Mensual Fit (20 Bowls)',
    short_label: 'Mensual (20 Bowls)',
    total_credits: 20,
    plan_price: 300000,
    bowl_value: 17000,
    unit_price_display: 15000,
    includes_delivery: false,
    delivery_fee: 5000,
    badge: '20 Bowls ($15.000 c/u) + envío aparte',
    description: 'Base + 1 Proteína + 5 Toppings + Semillas + Salsa'
  },
  {
    id: 'mensual_full',
    plan_type: 'mensual_full',
    label: 'Plan Mensual Todo Incluido (20 Bowls + Domicilio)',
    short_label: 'Mensual Todo Incluido (20)',
    total_credits: 20,
    plan_price: 395000,
    bowl_value: 17000,
    unit_price_display: 19750,
    includes_delivery: true,
    delivery_fee: 0,
    badge: '20 Bowls + Domicilio incluido (Ahorras $65.000)',
    description: 'Incluye los 20 Bowls armados a tu gusto + los 20 domicilios'
  }
];

export const DEFAULT_ERIKA_PLAN = {
  id: 'plan-erika-pasoancho',
  code: 'ERIKA-BOKU',
  customer_name: 'Erika',
  customer_phone: '3125535583',
  customer_email: '',
  template_id: 'mensual_full',
  plan_label: 'Plan BOKU Fit (Sin Sopa)',
  total_credits: 20,
  manual_used_adjustment: 0,
  bowl_value: 17000,
  includes_delivery: true,
  delivery_fee: 0,
  default_address: 'Paso Ancho',
  default_time: '2:30 PM',
  dietary_notes: 'Sin sopa • Proteína + 5 Verduras/Toppings + 1 Base Carbohidrato + Semillas + Salsa',
  status: 'active',
  cycle_start_at: '2026-11-01T00:00:00.000Z',
  created_at: '2026-11-02T20:20:00.000Z'
};

export function normalizePhoneDigits(phone = '') {
  return String(phone || '').replace(/\D/g, '').slice(-10);
}

export function getConfiguredMealPlans(restaurantSettings) {
  const concepts = Array.isArray(restaurantSettings?.brand_concepts)
    ? restaurantSettings.brand_concepts
    : [];
  const configConcept = concepts.find(c => c && c.id === 'meal_plans_config');
  const savedPlans = Array.isArray(configConcept?.plans) ? configConcept.plans : [];

  // Si aún no se ha guardado la lista en base de datos, incluir el perfil base de Erika listo para usar/editar
  const hasErika = savedPlans.some(
    p =>
      normalizePhoneDigits(p.customer_phone) === '3125535583' ||
      String(p.code || '').toUpperCase() === 'ERIKA-BOKU'
  );

  if (!hasErika && configConcept?.exclude_default_erika !== true) {
    return [DEFAULT_ERIKA_PLAN, ...savedPlans];
  }
  return savedPlans;
}

export function findSubscriberPlan(plans = [], { code = '', phone = '', email = '' } = {}) {
  const activePlans = (plans || []).filter(p => p && p.status !== 'paused' && p.status !== 'cancelled');
  const cleanCode = String(code || '').trim().toUpperCase();
  const cleanPhone = normalizePhoneDigits(phone);
  const cleanEmail = String(email || '').trim().toLowerCase();

  return (
    activePlans.find(p => {
      const pCode = String(p.code || '').trim().toUpperCase();
      const pPhone = normalizePhoneDigits(p.customer_phone);
      const pEmail = String(p.customer_email || '').trim().toLowerCase();

      if (cleanCode && pCode && cleanCode === pCode) return true;
      // Si el usuario escribió su teléfono en el campo de código
      const inputAsPhone = normalizePhoneDigits(code);
      if (inputAsPhone.length >= 10 && pPhone && inputAsPhone === pPhone) return true;
      if (cleanPhone.length >= 10 && pPhone && cleanPhone === pPhone) return true;
      if (cleanEmail && pEmail && cleanEmail === pEmail) return true;
      return false;
    }) || null
  );
}

const SESSION_KEY_PREFIX = 'aa_active_meal_plan_';

export function saveActiveMemberSession(brandId, plan) {
  if (!brandId || !plan) return;
  try {
    const payload = {
      planCode: plan.code,
      customerPhone: plan.customer_phone,
      customerName: plan.customer_name,
      customerEmail: plan.customer_email || '',
      deviceFp: getDeviceFingerprint(),
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(`${SESSION_KEY_PREFIX}${brandId}`, JSON.stringify(payload));

    // Pre-llenar datos de entrega del cliente para que su checkout sea en 1 clic
    if (plan.customer_name) {
      localStorage.setItem('aa_customer_name', plan.customer_name);
    }
    if (plan.customer_phone) {
      localStorage.setItem('aa_customer_phone', plan.customer_phone);
    }
    if (plan.default_address) {
      localStorage.setItem('aa_delivery_address', plan.default_address);
    }
    if (plan.default_time || plan.dietary_notes) {
      const notesParts = [];
      if (plan.default_time) notesParts.push(`Hora programada: ${plan.default_time}`);
      if (plan.dietary_notes) notesParts.push(plan.dietary_notes);
      localStorage.setItem('aa_delivery_notes', notesParts.join(' • '));
    }
  } catch (e) {
    console.warn('No se pudo guardar la sesión de tiquetera:', e);
  }
}

export function getActiveMemberSession(brandId, configuredPlans = [], authUserEmail = '') {
  if (!brandId) return null;
  try {
    // 1. Si el usuario inició sesión con Google OAuth y su email coincide con un plan activo
    if (authUserEmail) {
      const byEmail = findSubscriberPlan(configuredPlans, { email: authUserEmail });
      if (byEmail) return byEmail;
    }

    // 2. Buscar sesión guardada en el dispositivo
    const raw = localStorage.getItem(`${SESSION_KEY_PREFIX}${brandId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed) return null;

    const matched = findSubscriberPlan(configuredPlans, {
      code: parsed.planCode,
      phone: parsed.customerPhone,
      email: parsed.customerEmail
    });
    return matched || null;
  } catch {
    return null;
  }
}

export function clearActiveMemberSession(brandId) {
  if (!brandId) return;
  try {
    localStorage.removeItem(`${SESSION_KEY_PREFIX}${brandId}`);
  } catch {}
}

export async function fetchPlanUsage(supabase, brandId, plan) {
  const totalCredits = Number(plan?.total_credits) || 5;
  const manualAdj = Number(plan?.manual_used_adjustment) || 0;
  if (!supabase || !brandId || !plan?.code) {
    const used = Math.max(0, manualAdj);
    return {
      totalCredits,
      usedCredits: used,
      remainingCredits: Math.max(0, totalCredits - used),
      ordersHistory: []
    };
  }

  try {
    const codeUpper = String(plan.code).trim().toUpperCase();
    let query = supabase
      .from('orders')
      .select('id, created_at, status, total_amount, discount_amount, discount_reason, customer_name')
      .eq('brand_id', brandId)
      .neq('status', 'cancelled')
      .ilike('discount_reason', `%${codeUpper}%`)
      .order('created_at', { ascending: false });

    if (plan.cycle_start_at) {
      query = query.gte('created_at', plan.cycle_start_at);
    }

    const { data, error } = await query;
    const validOrders = !error && Array.isArray(data) ? data : [];
    const usedCredits = Math.max(0, validOrders.length + manualAdj);
    const remainingCredits = Math.max(0, totalCredits - usedCredits);

    return {
      totalCredits,
      usedCredits,
      remainingCredits,
      ordersHistory: validOrders
    };
  } catch (err) {
    console.warn('Error consultando uso de tiquetera:', err);
    const used = Math.max(0, manualAdj);
    return {
      totalCredits,
      usedCredits: used,
      remainingCredits: Math.max(0, totalCredits - used),
      ordersHistory: []
    };
  }
}

export function buildPlanPromoObject(plan) {
  if (!plan) return null;
  const bowlValue = Number(plan.bowl_value) || 17000;
  return {
    id: `meal-plan-${plan.id || plan.code}`,
    code: String(plan.code || 'PLAN-BOKU').trim().toUpperCase(),
    name: `🎟️ Tiquetera ${plan.plan_label || 'Plan BOKU Fit'} (${plan.customer_name})`,
    type: 'fixed_discount',
    value: bowlValue,
    target: 'all',
    is_active: true,
    is_meal_plan: true,
    plan_id: plan.id,
    customer_name: plan.customer_name,
    customer_phone: plan.customer_phone,
    default_address: plan.default_address || '',
    default_time: plan.default_time || '',
    includes_delivery: Boolean(plan.includes_delivery),
    delivery_fee_override: plan.includes_delivery ? 0 : (Number(plan.delivery_fee) || 5000)
  };
}

export function buildPlanDIYBowlProduct(allProducts = [], plan = null) {
  const baseBowl =
    (allProducts || []).find(p => p.id === 'b0000d14-0000-4000-a000-000000000000') ||
    (allProducts || []).find(p => p.config_options?.is_diy || p.configOptions?.is_diy || /arma tu propio.*bowl/i.test(p.name || ''));

  const bowlPrice = Number(plan?.bowl_value) || 17000;

  if (!baseBowl) {
    return null;
  }

  return {
    ...baseBowl,
    id: baseBowl.id,
    productId: baseBowl.id,
    name: '🥗 Bowl BOKU Fit (Mi Plan Tiquetera)',
    title: '🥗 Arma tu Bowl BOKU Fit de Hoy',
    description:
      'Incluye 1 Base (Arroz, Verdes o 50/50) + 1 Proteína con tu preparación favorita + hasta 5 Toppings/Verduras + Semillas (Chía, Ajonjolí, Alga Nori) + Salsa de la casa. Cubierto por 1 crédito de tu Plan.',
    price: bowlPrice,
    is_plan_bowl: true,
    plan_code: plan?.code || 'PLAN-BOKU',
    config_options: {
      ...(baseBowl.config_options || {}),
      is_diy: true,
      creator_type: 'bowl',
      modifier_config: {
        ...(baseBowl.config_options?.modifier_config || {}),
        // 1 Base incluida
        'b0000d14-0000-4000-a000-000000000001': { min: 1, max: 2, included: 1 },
        // 1 Proteína incluida
        'b0000d14-0000-4000-a000-000000000003': { min: 1, max: 3, included: 1 },
        // Hasta 5 Vegetales / Toppings incluidos
        'b0000d14-0000-4000-a000-000000000004': { min: 1, max: 8, included: 5 },
        // Hasta 2 Semillas / Crunches incluidos
        'b0000d14-0000-4000-a000-000000000006': { min: 0, max: 4, included: 2 },
        // 1 Salsa incluida
        'b0000d14-0000-4000-a000-000000000005': { min: 0, max: 3, included: 1 }
      }
    }
  };
}
