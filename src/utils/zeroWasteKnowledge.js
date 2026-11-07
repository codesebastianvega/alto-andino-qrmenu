// Base de conocimiento culinario Zero-Waste para rescate de mermas y tallos
export const ZERO_WASTE_KNOWLEDGE = [
  {
    keywords: ['brócoli', 'brocoli'],
    badge: 'Tallos & Tronco',
    suggestion: 'El tallo representa ~35% del peso. Pélalo y córtalo en julianas o rodajas finas para encurtido japonés (Asazuke), salteados wok o puré de base.',
    potentialSaving: '35% de merma rescatable'
  },
  {
    keywords: ['cebolla larga', 'cebollín', 'cebollin'],
    badge: 'Tallo Verde & Raíz',
    suggestion: 'Usa las partes verdes para aceite aromatizado de cebollín o guarnición fresca. Las raíces limpias aportan umami profundo a caldos y fondos.',
    potentialSaving: '20% de merma rescatable'
  },
  {
    keywords: ['cebolla morada', 'cebolla cabezona', 'cebolla blanca'],
    badge: 'Cáscaras & Puntas',
    suggestion: 'Usa los cortes externos para encurtidos rápidos con vinagre de arroz y remolacha, o resérvalos para fondo de caldos base.',
    potentialSaving: '15% de merma rescatable'
  },
  {
    keywords: ['zanahoria'],
    badge: 'Puntas & Piel',
    suggestion: 'Lávala con cepillo para no pelarla (cero merma). Los recortes van a caldo vegetal aromático o deshidratados en chips de sal marina.',
    potentialSaving: '18% de merma rescatable'
  },
  {
    keywords: ['cilantro'],
    badge: 'Tallos Bajos',
    suggestion: '¡No descartes los tallos! Tienen más aroma que las hojas; tritúralos para marinados asiáticos, pasta de curry o aderezo de la casa.',
    potentialSaving: '25% de merma rescatable'
  },
  {
    keywords: ['pepino', 'pepino cohombro'],
    badge: 'Semillas & Piel',
    suggestion: 'Piel y semillas son ideales para infusionar agua aromática de cortesía o emulsionar aderezo refrescante de sésamo y pepino.',
    potentialSaving: '20% de merma rescatable'
  },
  {
    keywords: ['mango'],
    badge: 'Semilla & Pulpa residual',
    suggestion: 'Hervir la semilla y recortes con panela/azúcar y vinagre para crear salsa Sweet & Sour agridulce artesanal o reducción para postres.',
    potentialSaving: '30% de merma rescatable'
  },
  {
    keywords: ['aguacate', 'palta'],
    badge: 'Rendimiento y Maduración',
    suggestion: 'Porciones muy blandas pueden emulsionarse con limón y aceite de sésamo para una mayo-aguacate sin huevo con 0 desperdicio.',
    potentialSaving: '15% de merma rescatable'
  },
  {
    keywords: ['papa', 'papas'],
    badge: 'Cáscaras Limpias',
    suggestion: 'Cáscaras bien lavadas fritas a 180°C con sal marina y togarashi quedan como crocantes gourmet de cortesía para el bento.',
    potentialSaving: '12% de merma rescatable'
  },
  {
    keywords: ['pollo', 'pechuga', 'muslo'],
    badge: 'Huesos & Pieles',
    suggestion: 'Huesos para fondo Tori Paitan (caldo ramen concentrado). Piel crocante frita (Torikawa) para topping crocante en ensaladas.',
    potentialSaving: '25% de merma rescatable'
  }
];

export function getZeroWasteSuggestion(name) {
  if (!name) return null;
  const lower = name.toLowerCase();

  // Productos procesados o congelados no tienen merma de huesos/pieles
  if (lower.includes('nugget') || lower.includes('empanada') || lower.includes('salchicha')) {
    return null;
  }

  for (const item of ZERO_WASTE_KNOWLEDGE) {
    if (item.keywords.some(k => lower.includes(k))) {
      return item;
    }
  }
  return null;
}
