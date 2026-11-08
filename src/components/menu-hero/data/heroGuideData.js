export const HERO_CATEGORY_ICONS = {
  todos: 'ph:squares-four',
  desayunos: 'ph:sun-horizon',
  panes: 'ph:bread',
  bowls: 'ph:bowl-food',
  platos: 'ph:fork-knife',
  sandwiches: 'ph:sandwich',
  smoothies: 'ph:drop',
  cafe: 'ph:coffee',
  veggie: 'ph:leaf',
  postres: 'ph:cake',
  bebidasfrias: 'ph:snowflake'
};

export const FALLBACK_CATEGORY_ICON = 'ph:fork-knife';
export const FAB_STORAGE_KEY = 'aluna_menu_guide_fab_position';

export const GUIDE_STEPS = {
  start: {
    id: 'kind',
    title: '¿Qué se te antoja?',
    options: [
      { value: 'comida', label: 'Comida' },
      { value: 'bebida', label: 'Bebida' },
      { value: 'ambas', label: 'Ambas' },
      { value: 'sorpresa', label: 'Sorpréndeme' }
    ]
  },
  comida: {
    id: 'foodMood',
    title: '¿Qué tipo de comida quieres?',
    options: [
      { value: 'fresca', label: 'Fresca / ligera', keywords: ['fresco', 'ensalada', 'poke', 'bowl', 'veggie', 'verde', 'ligero'] },
      { value: 'caliente', label: 'Caliente / reconfortante', keywords: ['caliente', 'horno', 'pan', 'plato', 'sopa'] },
      { value: 'salada', label: 'Salada / intensa', keywords: ['salado', 'queso', 'pollo', 'res', 'cerdo', 'sandwich', 'plato'] },
      { value: 'dulce', label: 'Algo dulce', keywords: ['postre', 'torta', 'cake', 'brownie', 'cookie', 'dulce', 'chocolate'] }
    ]
  },
  bebida: {
    id: 'drinkMood',
    title: '¿Cómo quieres la bebida?',
    options: [
      { value: 'caliente', label: 'Caliente', keywords: ['cafe', 'latte', 'te', 'caliente', 'infusion'] },
      { value: 'fria', label: 'Fría / refrescante', keywords: ['fria', 'ice', 'jugo', 'limonada', 'smoothie', 'bebida'] },
      { value: 'cremosa', label: 'Cremosa / especial', keywords: ['smoothie', 'latte', 'cremoso', 'especial'] },
      { value: 'cualquiera', label: 'Cualquiera', keywords: ['bebida', 'cafe', 'jugo', 'smoothie', 'limonada', 'latte'] }
    ]
  },
  ambas: {
    id: 'mixedMood',
    title: '¿Qué manda más ahora?',
    options: [
      { value: 'comer', label: 'Quiero comer', keywords: ['bowl', 'poke', 'plato', 'sandwich', 'pan', 'desayuno'] },
      { value: 'tomar', label: 'Tengo sed', keywords: ['bebida', 'cafe', 'jugo', 'smoothie', 'limonada', 'latte'] },
      { value: 'dulce', label: 'Algo dulce', keywords: ['postre', 'torta', 'cake', 'brownie', 'cookie', 'dulce'] },
      { value: 'sorpresa', label: 'Sorpréndeme', keywords: [] }
    ]
  }
};

export const THINKING_MESSAGES = [
  'Revisando lo disponible ahora...',
  'Cruzando tu antojo con la carta...',
  'Entrando a la despensa...',
  'Buscando una buena coincidencia...',
  'Afinando la recomendación...'
];

export function getTimeContext() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { label: 'Buenos días' };
  if (hour >= 12 && hour < 18) return { label: 'Buenas tardes' };
  return { label: 'Buenas noches' };
}

export function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function getOptionKeywords(stepId, value) {
  const steps = Object.values(GUIDE_STEPS);
  const option = steps
    .flatMap((step) => (step.id === stepId ? step.options : []))
    .find((item) => item.value === value);
  return option?.keywords || [];
}

export function scoreProduct(product, answers) {
  const text = normalizeText(`${product.name} ${product.desc} ${product.categoryName} ${product.categorySlug}`);
  let score = 0;

  Object.entries(answers).forEach(([stepId, optionValue]) => {
    getOptionKeywords(stepId, optionValue).forEach((keyword) => {
      if (text.includes(normalizeText(keyword))) score += 4;
    });
  });

  if (answers.kind === 'comida' && /bowl|poke|plato|sandwich|pan|desayuno|ensalada/.test(text)) score += 5;
  if (answers.kind === 'bebida' && /bebida|cafe|smoothie|jugo|limonada|fria|latte|te/.test(text)) score += 6;
  if (answers.kind === 'ambas') score += 1;
  if (answers.kind === 'sorpresa') score += product.name.length % 6;

  if (answers.foodMood === 'dulce' || answers.mixedMood === 'dulce') {
    if (/postre|torta|cake|brownie|cookie|dulce|chocolate/.test(text)) score += 8;
    if (/sandwich|bowl|poke|plato|cerdo|pollo|res|salado/.test(text)) score -= 5;
  }

  if (answers.drinkMood === 'caliente') {
    if (/cafe|latte|te|caliente|infusion/.test(text)) score += 8;
    if (/fria|ice|jugo|limonada|smoothie/.test(text)) score -= 6;
  }

  if (answers.drinkMood === 'fria') {
    if (/fria|ice|jugo|limonada|smoothie|bebida/.test(text)) score += 8;
    if (/caliente|horno|sopa/.test(text)) score -= 6;
  }

  if (answers.drinkMood === 'cremosa') {
    if (/smoothie|latte|cremoso|especial/.test(text)) score += 7;
  }

  if (answers.foodMood === 'fresca') {
    if (/fresco|ensalada|poke|bowl|veggie|verde|ligero/.test(text)) score += 6;
    if (/calent|horno|sopa/.test(text)) score -= 6;
  }

  if (answers.foodMood === 'caliente') {
    if (/caliente|horno|pan|plato|sopa/.test(text)) score += 6;
    if (/fria|ice|smoothie|jugo|limonada/.test(text)) score -= 5;
  }

  if (answers.foodMood === 'salada') {
    if (/salado|queso|pollo|res|cerdo|sandwich|plato|poke|bowl/.test(text)) score += 6;
    if (/postre|torta|cake|brownie|cookie|dulce|chocolate/.test(text)) score -= 6;
  }

  if (answers.kind === 'comida' && /bebida|cafe|smoothie|jugo|limonada|latte/.test(text)) score -= 6;
  if (answers.kind === 'bebida' && /sandwich|bowl|poke|plato|pan|cerdo|pollo|res/.test(text)) score -= 6;

  if (answers.mixedMood === 'comer' && /bowl|poke|plato|sandwich|pan|desayuno/.test(text)) score += 6;
  if (answers.mixedMood === 'tomar' && /bebida|cafe|jugo|smoothie|limonada|latte/.test(text)) score += 6;

  return score;
}

export function createMatchMessage(product, answers) {
  if (answers.kind === 'bebida' && answers.drinkMood === 'caliente') {
    return `Encontré ${product.name}: algo caliente para acompañar este momento.`;
  }
  if (answers.kind === 'bebida' && answers.drinkMood === 'fria') {
    return `Encontré ${product.name}: algo fresco para quitar la sed.`;
  }
  if (answers.kind === 'bebida') {
    return `Encontré ${product.name}: una bebida que encaja con tu antojo.`;
  }
  if (answers.foodMood === 'dulce' || answers.mixedMood === 'dulce') {
    return `Encontré ${product.name}: algo dulce para cerrar bien el antojo.`;
  }
  if (answers.foodMood === 'fresca') {
    return `Encontré ${product.name}: algo fresco y completo sin sentirse pesado.`;
  }
  if (answers.foodMood === 'caliente') {
    return `Encontré ${product.name}: algo caliente y reconfortante.`;
  }
  if (answers.foodMood === 'salada') {
    return `Encontré ${product.name}: una opción salada con buen carácter.`;
  }
  if (answers.mixedMood === 'tomar') {
    return `Encontré ${product.name}: algo para tomar y salir de la duda.`;
  }
  if (answers.kind === 'sorpresa' || answers.mixedMood === 'sorpresa') {
    return `Me fui por ${product.name}: una opción especial de la carta.`;
  }
  return `Encontré ${product.name}: buena opción para este momento.`;
}

export function clampFabPosition(position) {
  if (typeof window === 'undefined') return position;
  const maxX = Math.max(8, window.innerWidth - 92);
  const bottomReserved = window.innerWidth < 768 ? 188 : 130;
  const maxY = Math.max(96, window.innerHeight - bottomReserved);
  return {
    x: Math.min(Math.max(8, position.x), maxX),
    y: Math.min(Math.max(84, position.y), maxY)
  };
}

export function getInitialFabPosition() {
  if (typeof window === 'undefined') return { x: 280, y: 600 };
  try {
    const saved = JSON.parse(window.localStorage.getItem(FAB_STORAGE_KEY) || 'null');
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) return clampFabPosition(saved);
  } catch {
    // Ignore invalid local storage data.
  }
  return clampFabPosition({
    x: window.innerWidth - 104,
    y: window.innerHeight - 230
  });
}
