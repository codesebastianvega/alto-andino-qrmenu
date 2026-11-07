import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export const STATUS_STYLES = {
  ready: { icon: CheckCircle2, label: 'Listo', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  warning: { icon: AlertTriangle, label: 'Por mejorar', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  blocked: { icon: XCircle, label: 'Bloqueante', className: 'bg-red-50 text-red-700 border-red-200' },
};

export const FINDING_PAGES = {
  business_identity: 'business_profile',
  business_hours: 'sedes',
  product_content: 'products',
  recipes_costs: 'recipes',
  dietary_data: 'categories',
  modifiers: 'modifier_groups',
  payment_methods: 'settings',
  printing: 'settings',
  web_presence: 'web',
};

export const KEYWORD_PAGES = {
  producto: 'products',
  plato: 'products',
  carta: 'products',
  precios: 'products',
  categoria: 'categories',
  categoría: 'categories',
  modificador: 'modifier_groups',
  extra: 'modifier_groups',
  opcion: 'modifier_groups',
  opción: 'modifier_groups',
  horario: 'settings',
  domicilio: 'settings',
  whatsapp: 'settings',
  propina: 'settings',
  impresion: 'settings',
  impresión: 'settings',
  pago: 'settings',
  receta: 'recipes',
  costo: 'recipes',
  costeo: 'recipes',
  inventario: 'inventory',
  stock: 'inventory',
  insumo: 'inventory',
  mesa: 'tables',
  mesas: 'tables',
  qr: 'tables',
  salon: 'tables',
  salón: 'tables',
  sede: 'sedes',
  sucursal: 'sedes',
  web: 'web',
  portada: 'web',
  banner: 'web',
  color: 'web',
  personal: 'staff',
  mesero: 'staff',
  turno: 'staff',
};

export const EMPTY_PRODUCT = {
  name: '',
  description: '',
  price: '',
  tags: '',
  requires_kitchen: true,
};

export function priceReplyFallback(text) {
  const matches = String(text || '').match(/(?:\$\s*)?\d{1,3}(?:[.,]\d{3})+(?:\s*COP)?/gi) || [];
  const values = [...new Set(matches.map((match) => Number(match.replace(/[^\d]/g, ''))).filter((value) => value >= 1000))].slice(0, 4);
  return values.map((value) => `Usar $ ${value.toLocaleString('es-CO')} COP`);
}

export function safeAssistantReply(reply) {
  const text = String(reply || '').trim();
  if (/procesad|propuesta\s+enviad[ao]|he\s+creado|se\s+ha\s+creado|fue\s+cread[ao]|registrad[ao]\s+correctamente/i.test(text)) {
    return 'La propuesta está lista, pero todavía no se ha guardado. Usa el botón de revisión para comprobar los datos y aprobar la creación real.';
  }
  return text || 'No pude interpretar esa solicitud con suficiente precisión.';
}

export function detectTargetPage(text) {
  const norm = String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  for (const [kw, page] of Object.entries(KEYWORD_PAGES)) {
    if (new RegExp(`\\b${kw}\\b`, 'i').test(norm)) return page;
  }
  return null;
}

export function parseStepsFromText(text) {
  const lines = String(text || '').split('\n');
  const steps = [];
  lines.forEach((line) => {
    const trimmed = line.trim();
    const match = trimmed.match(/^(?:(?:\d+[\.\)]\s*)|(?:paso\s*\d+[:\.]?\s*)|(?:[-•*]\s+))(.*)/i);
    if (match && match[1] && match[1].trim().length > 5) {
      steps.push(match[1].trim());
    }
  });
  return steps;
}

export function extractTipFromText(text) {
  const match = String(text || '').match(/(?:consejo|tip|recomendaci[oó]n|nota|recuerda):\s*([^\n\.]+[\.]?)/i);
  return match ? match[1].trim() : null;
}
