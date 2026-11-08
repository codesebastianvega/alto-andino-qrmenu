import {
  ShoppingBag,
  Users,
  Sparkles,
  Star,
  Flame,
  Bot,
  Globe,
  UtensilsCrossed,
  Wine,
  Printer,
  Store,
  Building2
} from 'lucide-react';

export const WHATSAPP_SUPPORT = '573222285900';

export const openWhatsApp = (msg) => {
  window.open(`https://wa.me/${WHATSAPP_SUPPORT}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
};

/* ── CATÁLOGO E-COMMERCE DE ALUNA ─────────────────────────────────── */

export const CATEGORIES = [
  { id: 'all', label: '🛍️ Todo el Catálogo' },
  { id: 'plans', label: '💳 Planes de Suscripción' },
  { id: 'marketing', label: '🔥 Inteligencia & Marketing' },
  { id: 'kitchen', label: '🍳 Operación & Cocina' },
  { id: 'enterprise', label: '🏢 Franquicias & Enterprise' },
];

export const STORE_PRODUCTS = [
  // ── PLANES BASE ──
  {
    id: 'plan_emprendedor',
    type: 'plan',
    category: 'plans',
    name: 'Plan Emprendedor',
    badge: 'Inicio Rápido',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: ShoppingBag,
    iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
    copMonthly: 29900,
    usdMonthly: 9,
    description: 'Digitaliza tu menú con código QR y recibe comandas en tu pantalla.',
    bullets: [
      'Menú QR Digital ultra rápido',
      'Panel Kanban de comandas en vivo',
      'Código QR con tu logo',
      'Hasta 80 pedidos / mes'
    ],
    slug: 'emprendedor'
  },
  {
    id: 'plan_esencial',
    type: 'plan',
    category: 'plans',
    name: 'Plan Esencial',
    badge: 'Salón & Meseros',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Users,
    iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
    copMonthly: 59900,
    usdMonthly: 18,
    description: 'Toma de pedidos móvil para meseros y pedidos directos a WhatsApp.',
    bullets: [
      'Todo lo de Emprendedor',
      'Toma de pedidos móvil para meseros',
      'Recepción de pedidos por WhatsApp',
      'Landing web propia y mesas con QR',
      'Hasta 250 pedidos / mes'
    ],
    slug: 'esencial'
  },
  {
    id: 'plan_profesional',
    type: 'plan',
    category: 'plans',
    name: 'Plan Profesional',
    badge: '🔥 Más Popular',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-black',
    isFeatured: true,
    icon: Sparkles,
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    copMonthly: 149900,
    usdMonthly: 45,
    description: 'El paquete completo para restaurantes con salón, cocina y barra activa.',
    bullets: [
      'Todo lo de Esencial',
      '🍳 Pantalla KDS Cocina Cloud incluida',
      '🍸 Pantalla BDS Barra & Tragos incluida',
      'Control de recetas, costos e inventario',
      'Hasta 800 pedidos / mes y 10 admins'
    ],
    slug: 'profesional'
  },
  {
    id: 'plan_premium',
    type: 'plan',
    category: 'plans',
    name: 'Plan Premium',
    badge: '👑 Máxima Potencia',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Star,
    iconBg: 'bg-purple-50 text-purple-600 border-purple-200',
    copMonthly: 249900,
    usdMonthly: 75,
    description: 'Para marcas consolidadas: pedidos ilimitados, mapas de calor y marca blanca.',
    bullets: [
      'Todo lo de Profesional',
      '🔥 Inteligencia Pro & Heatmaps incluida',
      '🖨️ Auto-Print para comandas incluido',
      '🌐 Dominio Propio & Marca Blanca incluida',
      'Pedidos ilimitados y soporte VIP 24/7'
    ],
    slug: 'premium'
  },

  // ── ADD-ONS MARKETING & CRECIMIENTO ──
  {
    id: 'addon_heatmaps',
    type: 'addon',
    category: 'marketing',
    name: 'Inteligencia Pro & Mapas de Calor',
    badge: 'Nuevo',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: Flame,
    iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
    copMonthly: 49000,
    usdMonthly: 15,
    description: 'Mapas de calor, grabaciones en video de comensales, carritos abandonados y medición de volantes callejeros.',
    bullets: [
      'Mapas de calor de clics y scroll en la carta',
      'Video de cómo navegan tus clientes',
      'Atribución de ventas por volantes y redes',
      'Alertas de carritos abandonados'
    ],
    includedIn: ['premium']
  },
  {
    id: 'addon_ai_waiter',
    type: 'addon',
    category: 'marketing',
    name: 'Aluna AI Waiter (Mesero con IA)',
    badge: 'Inteligencia Artificial',
    badgeColor: 'bg-violet-100 text-violet-800 border-violet-200',
    icon: Bot,
    iconBg: 'bg-violet-50 text-violet-600 border-violet-200',
    copMonthly: 59000,
    usdMonthly: 19,
    description: 'Asistente virtual 24/7 en WhatsApp y menú web. Resuelve dudas y recomienda maridajes para subir el ticket.',
    bullets: [
      'Respuestas automáticas inteligentes 24/7',
      'Sugerencias de maridaje y venta sugestiva',
      'Entrenado con tu carta e ingredientes',
      'Aumenta el ticket promedio hasta un 22%'
    ],
    includedIn: []
  },
  {
    id: 'addon_custom_domain',
    type: 'addon',
    category: 'marketing',
    name: 'Dominio Propio & Marca Blanca',
    badge: 'Branding',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    icon: Globe,
    iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
    copMonthly: 39000,
    usdMonthly: 10,
    description: 'Tu menú en tu propio dominio web (menu.tumarca.com) sin sellos ni menciones de Aluna.',
    bullets: [
      'Dominio propio personalizado',
      'Cero logos o enlaces de Aluna',
      'Certificado SSL de máxima seguridad',
      'SEO y posicionamiento directo en Google'
    ],
    includedIn: ['premium']
  },

  // ── ADD-ONS COCINA & OPERACIÓN ──
  {
    id: 'addon_kds_kitchen',
    type: 'addon',
    category: 'kitchen',
    name: 'Pantalla KDS Cocina Cloud',
    badge: 'Operación',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: UtensilsCrossed,
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    copMonthly: 45000,
    usdMonthly: 12,
    description: 'Comandero digital en tiempo real para cocineros. Semáforos de tiempo y alertas sonoras.',
    bullets: [
      'Despacho digital sin papeles perdidos',
      'Semáforos de retraso (Verde / Amarillo / Rojo)',
      'Timbres sonoros ante pedidos nuevos',
      'Agrupación por partidas de cocina'
    ],
    includedIn: ['profesional', 'premium']
  },
  {
    id: 'addon_bds_bar',
    type: 'addon',
    category: 'kitchen',
    name: 'Pantalla BDS Barra & Coctelería',
    badge: 'Operación',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    icon: Wine,
    iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    copMonthly: 45000,
    usdMonthly: 12,
    description: 'Estación exclusiva para bartenders: rondas de tragos, cafés y cocteles agrupados.',
    bullets: [
      'Control de bebidas separado de la cocina',
      'Agrupación inteligente de rondas',
      'Tiempos de despacho acelerados en salón',
      'Integración directa con los meseros'
    ],
    includedIn: ['profesional', 'premium']
  },
  {
    id: 'addon_thermal_print',
    type: 'addon',
    category: 'kitchen',
    name: 'Auto-Print Cloud (Comandera Térmica)',
    badge: 'Hardware',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
    icon: Printer,
    iconBg: 'bg-sky-50 text-sky-600 border-sky-200',
    copMonthly: 35000,
    usdMonthly: 10,
    description: 'Impresión automática a impresoras térmicas Epson/ESC/POS tan pronto entra un pedido.',
    bullets: [
      'Impresión directa vía WiFi o Bluetooth',
      'Cero clics manuales del cajero',
      'Tickets formateados y legibles para chef',
      'Compatible con impresoras de 58mm y 80mm'
    ],
    includedIn: ['premium']
  },

  // ── ESCALA & ENTERPRISE ──
  {
    id: 'addon_extra_location',
    type: 'addon',
    category: 'enterprise',
    name: 'Sede Adicional / Franquicias',
    badge: 'Crecimiento',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    icon: Store,
    iconBg: 'bg-teal-50 text-teal-600 border-teal-200',
    copMonthly: 60000,
    usdMonthly: 18,
    description: 'Abre y gestiona una segunda o tercera sede con inventario y mesas independientes.',
    bullets: [
      'Control multi-sucursal centralizado',
      'Cartas y precios diferenciados por sede',
      'Meseros y cajas asignadas por local',
      'Reportes de rentabilidad comparativos'
    ],
    includedIn: []
  },
  {
    id: 'enterprise_custom',
    type: 'enterprise',
    category: 'enterprise',
    name: 'Aluna Enterprise a Medida',
    badge: 'Corporativo',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 font-black',
    icon: Building2,
    iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
    copMonthly: 0,
    usdMonthly: 0,
    isCustomPricing: true,
    description: 'Para cadenas y grandes grupos gastronómicos. SLAs dedicados e integración con ERPs.',
    bullets: [
      'Infraestructura dedicada en la nube (99.9% SLA)',
      'Integraciones con POS locales (ICG, Oracle, etc.)',
      'Gerente de cuenta técnico asignado',
      'Capacitación presencial para el equipo'
    ],
    includedIn: []
  }
];
