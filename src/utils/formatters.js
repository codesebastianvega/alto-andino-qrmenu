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
