/**
 * plans.js
 * 
 * Centralización de los IDs de planes de suscripción de Aluna.
 * Estos IDs deben coincidir con los de la tabla 'plans' en Supabase.
 */

export const PLAN_IDS = {
  emprendedor: 'c782ae70-f342-448a-81f2-05a5cfd3ed83',
  esencial:    '64b69a3f-cba9-4569-84ea-4154f9fe1e95',
  profesional: 'ed869093-1a43-4bc1-94d6-ed773e1af1df',
  premium:     '3b641b96-602a-4633-912c-2d7e9a4e1d76',
  enterprise:  '282dc250-c791-4a7d-a4ab-d0d107fc2550',
};

export const PLAN_LABELS = {
  emprendedor: { 
    name: 'Emprendedor',     
    color: '#6B7280',
    price: '49.900',
    desc: 'Validar mercado',
    icon: 'zap',
    features: [
      'Menú Digital Premium',
      '20 Productos',
      'Panel Kanban Básico',
      'Hasta 100 Pedidos/mes',
      '1 Usuario (Dueño)'
    ]
  },
  esencial: { 
    name: 'Esencial',        
    color: '#2D6A4F',
    price: '99.900',
    desc: 'Operación regular',
    icon: 'star',
    features: [
      '50 Productos',
      'Hasta 300 Pedidos/mes',
      'Panel para Meseros',
      '3 Usuarios / 1 Sede',
      'Landing Page Propia'
    ]
  },
  profesional: { 
    name: 'Profesional ⭐',  
    color: '#1d4ed8',
    price: '149.900',
    desc: 'En crecimiento',
    icon: 'crown',
    features: [
      '150 Productos / 50 Recetas',
      'Hasta 1.000 Pedidos/mes',
      'Pantalla KDS Cocina',
      'Mesas QR / 10 Usuarios',
      'Hasta 3 Sedes'
    ]
  },
  premium: { 
    name: 'Premium 💎',         
    color: '#fbbf24',
    price: '249.900',
    desc: 'Alto volumen',
    icon: 'crown',
    features: [
      '300 Productos / 200 Recetas',
      'Hasta 3.000 Pedidos/mes',
      '25 Usuarios',
      'Hasta 5 Sedes',
      'CRM y Fidelización'
    ]
  },
  enterprise: { 
    name: 'Enterprise',      
    color: '#7c3aed',
    price: 'Custom',
    desc: 'Cadenas y franquicias',
    icon: 'building-2',
    features: [
      'Pedidos Ilimitados',
      'Sedes Ilimitadas',
      'Usuarios Ilimitados',
      'Infraestructura Dedicada',
      'Integración ERP/POS'
    ]
  },
};

export const DEFAULT_PLAN_SLUG = 'esencial';

export const PLAN_HIERARCHY = {
  'emprendedor': 0,
  'esencial': 1,
  'profesional': 2,
  'premium': 3,
  'enterprise': 4
};

export const FEATURE_MIN_LEVEL = {
  // Esencial features
  'landing_page': 'esencial',
  'staff_panel': 'esencial',
  'analytics_basic': 'esencial',
  
  // Profesional features
  'table_management': 'profesional',
  'kitchen_display': 'profesional',
  'inventory': 'profesional',
  'advanced_analytics': 'profesional',
  'experiences': 'profesional',
  
  // Premium features
  'crm': 'premium',
  'loyalty': 'premium',
  'multi_sede': 'premium'
};

/**
 * Retorna el ID del plan basado en su slug.
 * @param {string} slug 
 * @returns {string} planId
 */
export const getPlanIdBySlug = (slug) => {
  return PLAN_IDS[slug] || PLAN_IDS[DEFAULT_PLAN_SLUG];
};
