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
