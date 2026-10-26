export const translateGroup = (k) => {
  const map = {
    // Bowl groups
    "bowl-base": "Base",
    "bowl-protein": "Proteína",
    "bowl-mixins": "Mix-ins",
    "bowl-sauce": "Salsa",
    "bowl-topping": "Toppings",
    "bowl-extras": "Extras",
    // Sandwich groups
    "sandwich-bread": "Pan",
    "sandwich-cheese": "Queso",
    "sandwich-protein": "Proteína",
    "sandwich-veggies": "Vegetales",
    "sandwich-sauce": "Salsa",
    "sandwich-extras": "Extras",
    // Generic terms
    "protein": "Proteína",
    "base": "Base",
    "sauce": "Salsa",
    "toppings": "Topping",
    "extras": "Extra"
  };
  
  if (map[k]) return map[k];
  
  // Fallback: remove prefix and capitalize
  return k.replace(/^.*?-/, '').replace(/^[a-z]/, c => c.toUpperCase());
};

export const formatOrderType = (type) => {
  const map = {
    'dine_in': 'En Mesa',
    'takeaway': 'Para Llevar',
    'delivery': 'Domicilio',
    'scheduled': 'Programado',
    'table': 'En Mesa',
    'whatsapp': 'WhatsApp'
  };
  return map[type] || type;
};

export const cleanAssistantName = (name, fallback = "Boki") => {
  if (!name || typeof name !== "string") return fallback;
  const cleaned = name.replace(/concierge/gi, "").trim();
  if (!cleaned) return fallback;
  if (cleaned.toLowerCase() === "boku" || cleaned.toLowerCase() === "boki") return "Boki";
  return cleaned;
};

/**
 * Normalizes a Colombian / International phone number for WhatsApp links.
 * Adds Colombian country code (57) if 10 digits starting with 3.
 * 
 * @param {string|number} rawPhone 
 * @returns {string}
 */
export const normalizeWhatsAppNumber = (rawPhone) => {
  if (!rawPhone) return "";
  const clean = String(rawPhone).replace(/\D/g, "");
  if (!clean) return "";
  // Colombian 10-digit mobile number starting with 3 (e.g., 3244402642 -> 573244402642)
  if (clean.length === 10 && clean.startsWith("3")) {
    return `57${clean}`;
  }
  return clean;
};

/**
 * Retorna la URL de navegación de Google Maps para una dirección.
 */
export const getGoogleMapsUrl = (address) => {
  if (!address) return '#';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
};

/**
 * Retorna la URL de navegación de Waze para una dirección.
 */
export const getWazeUrl = (address) => {
  if (!address) return '#';
  return `https://waze.com/ul?q=${encodeURIComponent(address.trim())}`;
};

/**
 * Parsea y clasifica el método de pago guardado para mostrarlo en un chip visual
 * con icono, colores temáticos e información relevante (paga con, cambio, etc.).
 */
export const parsePaymentMethod = (methodStr, paymentStatus = 'pending') => {
  const raw = String(methodStr || '').trim();
  const lower = raw.toLowerCase();

  if (!raw) {
    return {
      label: 'Por acordar',
      shortLabel: 'Por acordar',
      detail: null,
      tendered: null,
      change: null,
      icon: 'heroicons:question-mark-circle',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      type: 'pending'
    };
  }

  // 1. Efectivo / Cash
  if (lower.includes('efectivo') || lower.includes('cash')) {
    const cambioMatch = raw.match(/cambio:\s*(\$?[0-9.,]+)/i);
    const pagaConMatch = raw.match(/paga con:\s*(\$?[0-9.,]+)/i);
    const exactMatch = lower.includes('pago exacto');

    let detail = null;
    let shortLabel = 'Efectivo';
    let tendered = pagaConMatch ? pagaConMatch[1] : null;
    let change = cambioMatch ? cambioMatch[1] : null;

    if (pagaConMatch && cambioMatch) {
      detail = `Paga con ${tendered} · Cambio: ${change}`;
      shortLabel = `Efectivo (Cambio: ${change})`;
    } else if (exactMatch) {
      detail = 'Pago exacto';
      shortLabel = 'Efectivo (Exacto)';
    }

    return {
      label: shortLabel,
      shortLabel,
      fullText: raw,
      detail,
      tendered,
      change,
      icon: 'heroicons:banknotes',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      type: 'cash'
    };
  }

  // 2. Transferencia / Nequi / Bre-B / Daviplata / Bancolombia
  if (
    lower.includes('nequi') ||
    lower.includes('transferencia') ||
    lower.includes('bre-b') ||
    lower.includes('daviplata') ||
    lower.includes('bancolombia') ||
    lower.includes('transfer')
  ) {
    let shortLabel = 'Nequi / Bre-B';
    if (lower.includes('daviplata')) shortLabel = 'Daviplata';
    else if (lower.includes('bancolombia')) shortLabel = 'Bancolombia';
    else if (!lower.includes('bre-b') && lower.includes('nequi')) shortLabel = 'Nequi';

    return {
      label: shortLabel,
      shortLabel,
      fullText: raw,
      detail: raw !== shortLabel ? raw : null,
      tendered: null,
      change: null,
      icon: 'heroicons:device-phone-mobile',
      bg: 'bg-purple-50',
      text: 'text-purple-800',
      border: 'border-purple-200',
      type: 'transfer'
    };
  }

  // 3. Datáfono / Tarjeta / Card / POS
  if (lower.includes('datáfono') || lower.includes('datafono') || lower.includes('tarjeta') || lower.includes('card')) {
    return {
      label: 'Datáfono',
      shortLabel: 'Datáfono',
      fullText: raw,
      detail: 'Llevar datáfono',
      tendered: null,
      change: null,
      icon: 'heroicons:credit-card',
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-200',
      type: 'card'
    };
  }

  // 4. Caja / POS local
  if (lower.includes('caja')) {
    return {
      label: raw,
      shortLabel: raw,
      fullText: raw,
      detail: null,
      tendered: null,
      change: null,
      icon: 'solar:calculator-bold',
      bg: 'bg-slate-100',
      text: 'text-slate-800',
      border: 'border-slate-300',
      type: 'pos'
    };
  }

  // 5. Default
  return {
    label: raw,
    shortLabel: raw.length > 20 ? `${raw.slice(0, 18)}...` : raw,
    fullText: raw,
    detail: null,
    tendered: null,
    change: null,
    icon: 'heroicons:credit-card',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    type: 'other'
  };
};
