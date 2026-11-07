export const SHARED_SOUP_GROUP = {
  id: 'b0000b20-0000-4000-a000-000000000002',
  name: '🥣 Entrada Incluida',
  min_select: 1,
  max_select: 1,
  is_required: true,
  options: [
    { id: 'opt-bento-sopa-dia', name: 'Sopita del día casera (16 oz)', price: 0, is_default: true },
    { id: 'opt-bento-fruta', name: 'Porción de Fruta fresca picada', price: 0 },
    { id: 'opt-bento-nosoup', name: 'Sin sopa ni fruta', price: 0 },
  ],
};

export const SHARED_DRINK_GROUP = {
  id: 'b0000b20-0000-4000-a000-000000000001',
  name: '🥤 Bebida del Día Incluida',
  min_select: 1,
  max_select: 1,
  is_required: true,
  options: [
    { id: 'opt-bento-jugo-dia', name: 'Jugo del día refrescante (5 oz)', price: 0, is_default: true },
    { id: 'opt-bento-hatsu-caja', name: 'Cambiar por Té Hatsu en Caja (200 ml)', price: 2000 },
    { id: 'opt-bento-hatsu-lata', name: 'Cambiar por Té Hatsu en Lata (250 ml)', price: 4000 },
    { id: 'opt-bento-nodrink', name: 'Sin bebida', price: 0 },
  ],
};

export const SALMON_PREP_GROUP = {
  id: 'mg-salmon-prep',
  name: '🍣 Término del Salmón',
  min_select: 1,
  max_select: 1,
  is_required: true,
  options: [
    { id: 'opt-salmon-fresco', name: 'Salmón Fresco (Estilo Poke Crudo Marinado)', price: 0, is_default: true },
    { id: 'opt-salmon-salteado', name: 'Salmón Salteado al Wok (Sellado Caliente)', price: 0 },
  ],
};

export const TORI_SAUCE_GROUP = {
  id: 'mg-tori-sauce',
  name: '🥢 Salsa Tonkatsu',
  min_select: 1,
  max_select: 1,
  is_required: true,
  options: [
    { id: 'opt-tori-sauce-on', name: 'Tonkatsu bañada sobre la pechuga crocante', price: 0, is_default: true },
    { id: 'opt-tori-sauce-side', name: 'Tonkatsu en envase aparte', price: 0 },
  ],
};

export function createPokeToriKatsu(isStorePausedForPublic) {
  return {
    id: 'b0000b25-0000-4000-a000-000000000025',
    productId: 'b0000b25-0000-4000-a000-000000000025',
    name: 'Poke Tori Katsu (Pechuga Crocante)',
    price: 22000,
    original_price: 28000,
    is_bento_del_dia: true,
    is_daily_special: true,
    daily_special_label: '🔥 Línea Poke Premium ($22.000)',
    subcategory: 'Línea Poke Premium',
    categorySlug: 'boku-bentos',
    categoryId: 'b0000c01-0000-4000-a000-000000000001',
    categoryName: 'BOKU Bentos Caseros',
    desc: 'Pechuga apanada crocante en tiras con salsa tonkatsu, arroz, maíz sofrito, repollo morado, queso en cubos, tomates cherry, alga nori y verde de cebollín. 🥣 ¡Combo completo! Incluye: Sopita del día o Fruta + 🥤 Jugo del día (5 oz).',
    description:
      'Pechuga apanada crocante en tiras con salsa tonkatsu, arroz, maíz sofrito, repollo morado, queso en cubos, tomates cherry, alga nori y verde de cebollín. 🥣 ¡Combo completo! Incluye: Sopita del día o Fruta + 🥤 Jugo del día (5 oz).',
    image: '/img/products/boku-tori-katsu.webp',
    image_url: '/img/products/boku-tori-katsu.webp',
    recipe_id: null,
    stock_status: 'in',
    available_portions: 50,
    is_schedule_available: !isStorePausedForPublic,
    schedule_label: isStorePausedForPublic ? '🔒 Cocina en Pausa' : 'Disponible de 11:00 AM a 5:00 PM',
    modifierGroups: [TORI_SAUCE_GROUP, SHARED_SOUP_GROUP, SHARED_DRINK_GROUP],
  };
}

export function createPokeSalmonFresh(salmonRaw, isStorePausedForPublic) {
  return {
    ...(salmonRaw || {}),
    id: 'd07007ec-761b-4f40-bad5-799c1154b9ab',
    productId: 'd07007ec-761b-4f40-bad5-799c1154b9ab',
    name: 'Poke Salmón Fresh (Fresco o Salteado)',
    price: 22000,
    original_price: 34000,
    is_bento_del_dia: true,
    is_daily_special: true,
    daily_special_label: '🔥 Línea Poke Premium ($22.000)',
    subcategory: 'Línea Poke Premium',
    categorySlug: 'boku-bentos',
    categoryId: 'b0000c01-0000-4000-a000-000000000001',
    categoryName: 'BOKU Bentos Caseros',
    desc: 'Cubos de salmón fresco magro (100g), arroz, láminas de rábano al limón, mango dulce, pepino, ajonjolí, semillas de girasol y ponzu cítrico. 👉 Término a elección: Fresco estilo Poke o Salteado al Wok. 🥣 ¡Combo completo! Incluye: Sopita del día o Fruta + 🥤 Jugo del día (5 oz).',
    description:
      'Cubos de salmón fresco magro (100g), arroz, láminas de rábano al limón, mango dulce, pepino, ajonjolí, semillas de girasol y ponzu cítrico. 👉 Término a elección: Fresco estilo Poke o Salteado al Wok. 🥣 ¡Combo completo! Incluye: Sopita del día o Fruta + 🥤 Jugo del día (5 oz).',
    image:
      salmonRaw?.image_url ||
      'https://gqjfjtzsdpslwffbqqyw.supabase.co/storage/v1/object/public/products/5nby4hb4t2_1791998655434.webp',
    image_url:
      salmonRaw?.image_url ||
      'https://gqjfjtzsdpslwffbqqyw.supabase.co/storage/v1/object/public/products/5nby4hb4t2_1791998655434.webp',
    recipe_id: salmonRaw?.recipe_id || 'ba000012-0000-4000-a000-000000000001',
    stock_status: 'in',
    available_portions: 50,
    is_schedule_available: !isStorePausedForPublic,
    schedule_label: isStorePausedForPublic ? '🔒 Cocina en Pausa' : 'Disponible de 11:00 AM a 5:00 PM',
    modifierGroups: [SALMON_PREP_GROUP, SHARED_SOUP_GROUP, SHARED_DRINK_GROUP],
  };
}

export function createBentoMediterraneo(isStorePausedForPublic) {
  return {
    id: 'b0000b18-0000-4000-a000-000000000018',
    productId: 'b0000b18-0000-4000-a000-000000000018',
    name: 'Bento Mediterráneo (Fresco y Balanceado)',
    price: 19000,
    original_price: 22000,
    is_bento_del_dia: true,
    is_daily_special: true,
    daily_special_label: 'Nuevo Especial',
    subcategory: 'Bentos Caseros',
    categorySlug: 'boku-bentos',
    categoryId: 'b0000c01-0000-4000-a000-000000000001',
    categoryName: 'BOKU Bentos Caseros',
    desc: 'Arroz blanco con perejil, hummus casero cremoso de garbanzo con aceite y páprika, champiñones al ajillo, pepino fresco, tomates cherry y rábano crocante. 👉 Proteína a elección (al limón): Filete de merluza dorada o pechuga de pollo al wok. 🥣 Combo completo: Sopa de apio casera (16 oz) o Fruta + 🥤 Limonada Verde Antioxidante (5 oz).',
    description:
      'Arroz blanco con perejil, hummus casero cremoso de garbanzo con aceite y páprika, champiñones al ajillo, pepino fresco, tomates cherry y rábano crocante. 👉 Proteína a elección (al limón): Filete de merluza dorada o pechuga de pollo al wok. 🥣 Combo completo: Sopa de apio casera (16 oz) o Fruta + 🥤 Limonada Verde Antioxidante (5 oz).',
    image: '/bento-mediterraneo.jpg',
    image_url: '/bento-mediterraneo.jpg',
    recipe_id: null,
    stock_status: 'in',
    available_portions: 50,
    is_schedule_available: !isStorePausedForPublic,
    schedule_label: isStorePausedForPublic ? '🔒 Cocina en Pausa' : 'Disponible de 11:00 AM a 5:00 PM',
    modifierGroups: [
      {
        id: 'mg-medit-protein',
        name: '🐟 Proteína al Limón',
        min_select: 1,
        max_select: 2,
        included_count: 1,
        extra_price: 8000,
        options: [
          {
            id: 'opt-medit-merluza',
            name: 'Filete de merluza dorada',
            price: 0,
            extra_price: 8000,
            is_default: true,
          },
          {
            id: 'opt-medit-pollo',
            name: 'Pechuga de pollo al wok',
            price: 0,
            extra_price: 7000,
          },
        ],
      },
      SHARED_SOUP_GROUP,
      SHARED_DRINK_GROUP,
    ],
  };
}

export function createBentoCriollo(criolloRaw, isStorePausedForPublic) {
  return {
    ...(criolloRaw || {}),
    id: 'b0000b11-0000-4000-a000-000000000001',
    productId: 'b0000b11-0000-4000-a000-000000000001',
    name: 'Bento Criollo Antioqueño (La Paisa)',
    price: 19000,
    original_price: 22000,
    is_bento_del_dia: true,
    is_daily_special: true,
    daily_special_label: 'Favorito de la Casa',
    subcategory: 'Bentos Caseros',
    categorySlug: 'boku-bentos',
    categoryId: 'b0000c01-0000-4000-a000-000000000001',
    categoryName: 'BOKU Bentos Caseros',
    desc: 'La bandeja paisa de siempre, pero en el bowl de la casa: arroz blanco, fríjoles a elección (rojos o negros), carne a elección (molida, cerdo o pollo al wok), chorizo y morcilla, huevo frito, aguacate y maduritos melosos. 🥣 Combo completo: Sopa de apio casera (16 oz) o Fruta + 🥤 Limonada Verde Antioxidante (5 oz).',
    description:
      'La bandeja paisa de siempre, pero en el bowl de la casa: arroz blanco, fríjoles a elección (rojos o negros), carne a elección (molida, cerdo o pollo al wok), chorizo y morcilla, huevo frito, aguacate y maduritos melosos. 🥣 Combo completo: Sopa de apio casera (16 oz) o Fruta + 🥤 Limonada Verde Antioxidante (5 oz).',
    image:
      criolloRaw?.image_url ||
      'https://gqjfjtzsdpslwffbqqyw.supabase.co/storage/v1/object/public/products/4l57b6hx21n_1792011029842.webp',
    image_url:
      criolloRaw?.image_url ||
      'https://gqjfjtzsdpslwffbqqyw.supabase.co/storage/v1/object/public/products/4l57b6hx21n_1792011029842.webp',
    recipe_id: 'ba000010-0000-4000-a000-000000000001',
    stock_status: 'in',
    available_portions: 50,
    is_schedule_available: !isStorePausedForPublic,
    schedule_label: isStorePausedForPublic ? '🔒 Cocina en Pausa' : 'Disponible de 11:00 AM a 5:00 PM',
    modifierGroups: [
      {
        id: 'mg-criollo-frijol',
        name: '🍲 Tu Fríjol',
        min_select: 1,
        max_select: 2,
        included_count: 1,
        extra_price: 4000,
        options: [
          {
            id: 'opt-criollo-frijol-rojo',
            name: 'Fríjoles rojos calados',
            price: 0,
            extra_price: 4000,
            is_default: true,
          },
          { id: 'opt-criollo-frijol-negro', name: 'Fríjoles negros', price: 0, extra_price: 4000 },
        ],
      },
      {
        id: 'mg-criollo-protein',
        name: '🥩 Tu Proteína Criolla',
        min_select: 1,
        max_select: 3,
        included_count: 1,
        extra_price: 7000,
        options: [
          {
            id: 'opt-criollo-molida',
            name: 'Carne molida sazonada',
            price: 0,
            extra_price: 7000,
            is_default: true,
          },
          { id: 'opt-criollo-cerdo', name: 'Cerdo al wok en cubos', price: 0, extra_price: 7000 },
          { id: 'opt-criollo-pollo', name: 'Pollo al wok en cubos', price: 0, extra_price: 7000 },
        ],
      },
      SHARED_SOUP_GROUP,
      SHARED_DRINK_GROUP,
    ],
  };
}
