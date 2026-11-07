export const isValidUUID = (id) =>
  typeof id === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export const getSharedSoupGroup = (soupName = '🥣 Crema de plátano colicero (16 oz)') => ({
  name: '🥣 Entrada Incluida',
  min: 1,
  max: 1,
  options: [
    { id: 'opt-bento-soup-today', name: soupName, extra: 0, is_default: true },
    { id: 'opt-bento-fruta', name: '🍍 Porción de Fruta fresca picada', extra: 0 },
    { id: 'opt-bento-nosoup', name: '🚫 Sin sopa ni fruta', extra: 0 }
  ]
});

export const getSharedDrinkGroup = (drinkName = '🥤 Jugo del Día (5 oz)') => ({
  name: '🥤 Bebida de la Casa Incluida',
  min: 1,
  max: 1,
  options: [
    { id: 'opt-bento-drink-today', name: drinkName, extra: 0, is_default: true },
    { id: 'opt-bento-hatsu-caja', name: '🧃 Té Hatsu en Caja (200 ml)', extra: 2000 },
    { id: 'opt-bento-hatsu-lata', name: '🥫 Té Hatsu en Lata (250 ml)', extra: 4000 },
    { id: 'opt-bento-nodrink', name: '🚫 Sin bebida', extra: 0 }
  ]
});

/**
 * Resolves modifier groups and initial selected modifiers for a product.
 * Returns { groups, initialModifiers } or null if product has no special modifiers.
 */
export function resolveProductModifierConfig(product, dailySpecialData, rawModifierGroups = [], getModifiers) {
  const currentSoupName = dailySpecialData?.soupName || '🥣 Crema de plátano colicero (16 oz)';
  const currentDrinkName = dailySpecialData?.drinkName || '🥤 Jugo del Día (5 oz)';
  const sharedSoupGroup = getSharedSoupGroup(currentSoupName);
  const sharedDrinkGroup = getSharedDrinkGroup(currentDrinkName);

  // 1. Tori Katsu
  const isToriKatsu = product.id === 'b0000b25-0000-4000-a000-000000000025' || /tori\s*katsu/i.test(product.name);
  if (isToriKatsu) {
    const groups = [
      {
        name: '🥢 Salsa Tonkatsu',
        min: 1,
        max: 1,
        included_count: 1,
        options: [
          { id: 'opt-tori-sauce-on', name: 'Tonkatsu bañada sobre la pechuga crocante', extra: 0, is_default: true },
          { id: 'opt-tori-sauce-side', name: 'Tonkatsu en envase aparte', extra: 0 }
        ]
      },
      sharedSoupGroup,
      sharedDrinkGroup
    ];
    const initialModifiers = {
      '🥢 Salsa Tonkatsu': ['Tonkatsu bañada sobre la pechuga crocante'],
      '🥣 Entrada Incluida': [currentSoupName],
      '🥤 Bebida de la Casa Incluida': [currentDrinkName]
    };
    return { groups, initialModifiers };
  }

  // 2. Salmón Fresh
  const isSalmon = product.id === 'd07007ec-761b-4f40-bad5-799c1154b9ab' || /salm[oó]n/i.test(product.name);
  if (isSalmon) {
    const groups = [
      {
        name: '🍣 Término del Salmón',
        min: 1,
        max: 1,
        included_count: 1,
        options: [
          { id: 'opt-salmon-fresco', name: 'Salmón Fresco (Estilo Poke Crudo Marinado)', extra: 0, is_default: true },
          { id: 'opt-salmon-salteado', name: 'Salmón Salteado al Wok (Sellado Caliente)', extra: 0 }
        ]
      },
      sharedSoupGroup,
      sharedDrinkGroup
    ];
    const initialModifiers = {
      '🍣 Término del Salmón': ['Salmón Fresco (Estilo Poke Crudo Marinado)'],
      '🥣 Entrada Incluida': [currentSoupName],
      '🥤 Bebida de la Casa Incluida': [currentDrinkName]
    };
    return { groups, initialModifiers };
  }

  // 3. Modificadores canónicos resueltos (Objetos o UUIDs)
  let rawGroups = product.modifierGroups || product.modifier_groups;
  if ((!rawGroups || rawGroups.length === 0) && typeof getModifiers === 'function') {
    try {
      rawGroups = getModifiers(product.id);
    } catch (e) {
      console.warn('Error fetching modifiers:', e);
    }
  }

  if (rawGroups && Array.isArray(rawGroups) && rawGroups.length > 0) {
    const normalizedGroups = rawGroups.map(g => {
      if (!g) return null;
      if (typeof g === 'object' && Array.isArray(g.options) && g.options.length > 0) {
        return {
          name: g.name || 'Opciones',
          min: g.min_select !== undefined ? g.min_select : (g.min || 0),
          max: g.max_select !== undefined ? g.max_select : (g.max || 1),
          included_count: g.included_count !== undefined ? g.included_count : (g.max_select === 1 || g.max === 1 ? 1 : 0),
          options: g.options.map(opt => ({
            id: opt.id || opt.name,
            name: opt.name,
            extra: opt.extra !== undefined ? opt.extra : (opt.extra_price !== undefined ? opt.extra_price : (opt.price || 0)),
            is_default: Boolean(opt.is_default)
          }))
        };
      }
      const gKey = typeof g === 'string' ? g : (g.id || g.name);
      if (gKey === 'b0000b20-0000-4000-a000-000000000002') return sharedSoupGroup;
      if (gKey === 'b0000b20-0000-4000-a000-000000000001') return sharedDrinkGroup;
      const foundMeta = (rawModifierGroups || []).find(x => x.id === gKey || x.name === gKey);
      const opts = foundMeta?.options || foundMeta?.modifier_options || [];
      if (opts.length > 0) {
        return {
          name: foundMeta.name || 'Opciones',
          min: foundMeta.min_select || 0,
          max: foundMeta.max_select || 1,
          included_count: foundMeta.max_select === 1 ? 1 : 0,
          options: opts.map(o => ({
            id: o.id || o.name,
            name: o.name,
            extra: o.price || o.extra_price || 0,
            is_default: Boolean(o.is_default)
          }))
        };
      }
      return null;
    }).filter(Boolean);

    if (normalizedGroups.length > 0) {
      const initialModifiers = {};
      normalizedGroups.forEach(g => {
        const defaultOpts = g.options.filter(o => o.is_default).map(o => o.name);
        if (defaultOpts.length > 0) {
          initialModifiers[g.name] = defaultOpts.slice(0, g.max);
        } else if (g.min > 0 && g.options.length > 0) {
          initialModifiers[g.name] = [g.options[0].name];
        } else {
          initialModifiers[g.name] = [];
        }
      });
      return { groups: normalizedGroups, initialModifiers };
    }
  }

  // 4. Mediterráneo
  const isMediterraneo = product.id === 'b0000b18-0000-4000-a000-000000000018' || /mediterr[aá]neo/i.test(product.name);
  if (isMediterraneo) {
    const groups = [
      {
        name: '🐟 Proteína al Limón',
        min: 1,
        max: 2,
        included_count: 1,
        options: [
          { id: 'opt-medit-merluza', name: 'Filete de merluza dorada', extra: 8000 },
          { id: 'opt-medit-pollo', name: 'Pechuga de pollo al wok', extra: 7000 }
        ]
      },
      sharedSoupGroup,
      sharedDrinkGroup
    ];
    const initialModifiers = {
      '🐟 Proteína al Limón': ['Filete de merluza dorada'],
      '🥣 Entrada Incluida': [currentSoupName],
      '🥤 Bebida de la Casa Incluida': [currentDrinkName]
    };
    return { groups, initialModifiers };
  }

  // 5. Criollo
  const isCriollo = product.id === 'b0000b11-0000-4000-a000-000000000001' || /criollo|la paisa/i.test(product.name);
  if (isCriollo) {
    const groups = [
      {
        name: '🍲 Tu Fríjol',
        min: 1,
        max: 2,
        included_count: 1,
        options: [
          { id: 'opt-criollo-frijol-rojo', name: 'Fríjoles rojos calados', extra: 4000 },
          { id: 'opt-criollo-frijol-negro', name: 'Fríjoles negros', extra: 4000 }
        ]
      },
      {
        name: '🥩 Tu Proteína Criolla',
        min: 1,
        max: 3,
        included_count: 1,
        options: [
          { id: 'opt-criollo-molida', name: 'Carne molida sazonada', extra: 7000 },
          { id: 'opt-criollo-cerdo', name: 'Cerdo al wok en cubos', extra: 7000 },
          { id: 'opt-criollo-pollo', name: 'Pollo al wok en cubos', extra: 7000 }
        ]
      },
      sharedSoupGroup,
      sharedDrinkGroup
    ];
    const initialModifiers = {
      '🍲 Tu Fríjol': ['Fríjoles rojos calados'],
      '🥩 Tu Proteína Criolla': ['Carne molida sazonada'],
      '🥣 Entrada Incluida': [currentSoupName],
      '🥤 Bebida de la Casa Incluida': [currentDrinkName]
    };
    return { groups, initialModifiers };
  }

  // 6. Mazorcada
  const isMazorcada = product.id === 'b0000b22-0000-4000-a000-000000000022' || /mazorcada/i.test(product.name);
  if (isMazorcada) {
    const groups = [
      {
        name: '🍗 Proteína a elección',
        min: 1,
        max: 2,
        included_count: 1,
        options: [
          { id: 'opt-mazor-pollo', name: 'Pollo salteado al wok', extra: 7000 },
          { id: 'opt-mazor-cerdo', name: 'Cerdo salteado al wok', extra: 7000 }
        ]
      },
      {
        name: '🍯 Salsa a elección',
        min: 1,
        max: 2,
        options: [
          { id: 'opt-mazor-bbq', name: 'Salsa BBQ de la casa', extra: 0 },
          { id: 'opt-mazor-tartara', name: 'Salsa Tártara cremosa', extra: 0 }
        ]
      },
      {
        name: '🫑 Toque de Pimentón',
        min: 0,
        max: 1,
        options: [
          { id: 'opt-pimenton-si', name: 'Con pimentón salteado', extra: 0 },
          { id: 'opt-pimenton-no', name: '🚫 Sin pimentón', extra: 0 }
        ]
      },
      {
        name: '🌽 Toppings & Exclusiones',
        min: 0,
        max: 4,
        options: [
          { id: 'opt-sin-papita', name: '🚫 Sin papita cabello de ángel', extra: 0 },
          { id: 'opt-sin-jamon', name: '🚫 Sin jamón', extra: 0 },
          { id: 'opt-sin-salchicha', name: '🚫 Sin salchicha', extra: 0 },
          { id: 'opt-sin-queso', name: '🚫 Sin queso fundido', extra: 0 }
        ]
      },
      sharedSoupGroup,
      sharedDrinkGroup
    ];
    const initialModifiers = {
      '🍗 Proteína a elección': ['Pollo salteado al wok'],
      '🍯 Salsa a elección': ['Salsa BBQ de la casa'],
      '🫑 Toque de Pimentón': ['Con pimentón salteado'],
      '🥣 Entrada Incluida': [currentSoupName],
      '🥤 Bebida de la Casa Incluida': [currentDrinkName]
    };
    return { groups, initialModifiers };
  }

  // 7. Mestizo
  const isMestizo = product.id === 'b0000b14-0000-4000-a000-000000000004' || /mestizo/i.test(product.name);
  if (isMestizo) {
    const groups = [
      {
        name: '🍗 Tu Proteína',
        min: 1,
        max: 2,
        included_count: 1,
        options: [
          { id: 'opt-mestizo-pollo', name: 'Pollo al curry dorado', extra: 7000 },
          { id: 'opt-mestizo-cerdo', name: 'Cerdo teriyaki', extra: 7000 }
        ]
      },
      {
        name: '🍲 Tu Principio Casero',
        min: 1,
        max: 2,
        included_count: 1,
        options: [
          { id: 'opt-mestizo-garbanzos', name: 'Garbanzos caseros', extra: 4000 },
          { id: 'opt-mestizo-maduritos', name: 'Maduritos melosos en panela', extra: 4000 },
          { id: 'opt-mestizo-mitad', name: 'Mitad garbanzos y mitad maduritos', extra: 0 },
          { id: 'opt-mestizo-sin-principio', name: '🚫 Sin principio', extra: 0 }
        ]
      },
      {
        name: '🥗 Ensalada & Vegetales',
        min: 0,
        max: 5,
        options: [
          { id: 'opt-ensalada-normal', name: 'Ensalada cremosa de remolacha (normal)', extra: 0 },
          { id: 'opt-ensalada-aparte', name: 'Ensalada en recipiente aparte', extra: 0 },
          { id: 'opt-sin-ensalada', name: '🚫 Sin ensalada de remolacha', extra: 0 },
          { id: 'opt-sin-champinones', name: '🚫 Sin champiñones al ajillo', extra: 0 },
          { id: 'opt-sin-brocoli', name: '🚫 Sin brócoli al vapor', extra: 0 },
          { id: 'opt-sin-tomates', name: '🚫 Sin tomates cherry', extra: 0 }
        ]
      },
      sharedSoupGroup,
      sharedDrinkGroup
    ];
    const initialModifiers = {
      '🍗 Tu Proteína': ['Pollo al curry dorado'],
      '🍲 Tu Principio Casero': ['Garbanzos caseros'],
      '🥣 Entrada Incluida': [currentSoupName],
      '🥤 Bebida de la Casa Incluida': [currentDrinkName]
    };
    return { groups, initialModifiers };
  }

  // 8. Genérico Bento o Especial del Día
  const isGenericBentoOrSpecial = Boolean(
    product.id === dailySpecialData?.activeSpecialId ||
    dailySpecialData?.activeSecondaryIds?.includes(product.id) ||
    /bento|almuerzo|especial/i.test(product.name) ||
    /bento/i.test(product.subcategory || '') ||
    product.category_id === 'b0000c01-0000-4000-a000-000000000001'
  );

  if (isGenericBentoOrSpecial) {
    const groups = [sharedSoupGroup, sharedDrinkGroup];
    const initialModifiers = {
      '🥣 Entrada Incluida': [currentSoupName],
      '🥤 Bebida de la Casa Incluida': [currentDrinkName]
    };
    return { groups, initialModifiers };
  }

  return null;
}

/**
 * Calculates extra modifier price given groups and currently selected options.
 */
export function calculateProductExtraPrice(groups = [], selectedModifiers = {}) {
  let extra = 0;
  groups.forEach(g => {
    const selected = selectedModifiers[g.name] || [];
    const included = g.included_count !== undefined && g.included_count !== null
      ? g.included_count
      : (g.max === 1 ? 1 : 0);

    selected.forEach((optName, idx) => {
      if (idx >= included) {
        const optObj = g.options?.find(o => o.name === optName);
        extra += (optObj?.extra || 0);
      }
    });
  });
  return extra;
}

/**
 * Calculates live price for a dish being configured in the wizard.
 */
export function calculateModalDishLivePrice(configuringProduct, selectedModifiers = {}) {
  if (!configuringProduct) return 0;
  const base = Number(configuringProduct.product?.price) || 0;
  const extra = calculateProductExtraPrice(configuringProduct.groups, selectedModifiers);
  return base + extra;
}
