/**
 * Configuración central de Cuotas y Límites de IA para Aluna Copilot
 * 
 * Reglas por plan:
 * - Emprendedor: 30 consultas/mes · Solo Camino 1 (Guía manual)
 * - Esencial: 100 consultas/mes · Caminos 1 y 2 (Guía manual y Agéntico básico)
 * - Profesional: 300 consultas/mes · Caminos 1, 2 y 3 (Acceso total)
 * - Premium: 1.000 consultas/mes · Acceso total ilimitado
 */

export const AI_QUOTAS = {
  plan_emprendedor: {
    monthly_limit: 30,
    caminos: [1],
    label: 'Emprendedor',
    features: {
      guidance: true,
      agentic_actions: false,
      deep_links: false,
      recipe_costing: false,
    }
  },
  plan_esencial: {
    monthly_limit: 100,
    caminos: [1, 2],
    label: 'Esencial',
    features: {
      guidance: true,
      agentic_actions: true,
      deep_links: false,
      recipe_costing: false,
    }
  },
  plan_profesional: {
    monthly_limit: 300,
    caminos: [1, 2, 3],
    label: 'Profesional',
    features: {
      guidance: true,
      agentic_actions: true,
      deep_links: true,
      recipe_costing: true,
    }
  },
  plan_premium: {
    monthly_limit: 1000,
    caminos: [1, 2, 3],
    label: 'Premium',
    features: {
      guidance: true,
      agentic_actions: true,
      deep_links: true,
      recipe_costing: true,
    }
  },
};

/**
 * Obtiene la configuración de cuota para un plan dado.
 * @param {string} planId 
 * @returns {typeof AI_QUOTAS.plan_esencial}
 */
export function getPlanQuota(planId) {
  if (!planId) return AI_QUOTAS.plan_esencial;
  return AI_QUOTAS[planId] || AI_QUOTAS.plan_esencial;
}

/**
 * Verifica si un camino específico (1, 2 o 3) está habilitado para el plan.
 * @param {string} planId 
 * @param {number} caminoId 
 * @returns {boolean}
 */
export function isCaminoAllowed(planId, caminoId) {
  const quota = getPlanQuota(planId);
  return quota.caminos.includes(caminoId);
}
