// Modelos de negocio soportados y sus configuraciones recomendadas
export const BUSINESS_TYPES = [
  {
    id: 'dark_kitchen',
    name: 'Dark Kitchen / Cocina Oculta',
    description: 'Solo despachos a domicilio. Sin mesas físicas ni atención en mostrador.',
    icon: 'heroicons:truck',
    badge: 'Solo Domicilios',
    defaults: {
      allow_delivery: true,
      allow_takeaway: false,
      allow_dine_in: false,
      allow_scheduled: true,
    }
  },
  {
    id: 'restaurant',
    name: 'Restaurante Tradicional',
    description: 'Servicio completo con mesas físicas, pedidos para llevar y despachos a domicilio.',
    icon: 'heroicons:building-storefront',
    badge: 'Híbrido Completo',
    defaults: {
      allow_delivery: true,
      allow_takeaway: true,
      allow_dine_in: true,
      allow_scheduled: true,
    }
  },
  {
    id: 'cafe_bakery',
    name: 'Cafetería / Pastelería / Mostrador',
    description: 'Pedidos para llevar y consumo rápido en barra o pequeñas mesas.',
    icon: 'heroicons:cake',
    badge: 'Para Llevar & Barra',
    defaults: {
      allow_delivery: true,
      allow_takeaway: true,
      allow_dine_in: true,
      allow_scheduled: false,
    }
  },
  {
    id: 'bar_lounge',
    name: 'Bar / Gastrobar / Discoteca',
    description: 'Atención directa en mesa o barra con servicio nocturno y coctelería.',
    icon: 'heroicons:sparkles',
    badge: 'En Mesa & Barra',
    defaults: {
      allow_delivery: false,
      allow_takeaway: false,
      allow_dine_in: true,
      allow_scheduled: true,
    }
  },
  {
    id: 'food_truck',
    name: 'Food Truck / Puesto Callejero',
    description: 'Despacho rápido para llevar o consumir al paso sin mesas asignadas.',
    icon: 'heroicons:fire',
    badge: 'Al Paso & Llevar',
    defaults: {
      allow_delivery: true,
      allow_takeaway: true,
      allow_dine_in: false,
      allow_scheduled: false,
    }
  }
];

export const getFulfillmentModes = (settings) => {
  if (!settings) {
    const defaultType = BUSINESS_TYPES[1]; // restaurant
    return {
      delivery: defaultType.defaults.allow_delivery,
      takeaway: defaultType.defaults.allow_takeaway,
      dine_in: defaultType.defaults.allow_dine_in,
      scheduled: defaultType.defaults.allow_scheduled,
      allow_delivery: defaultType.defaults.allow_delivery,
      allow_takeaway: defaultType.defaults.allow_takeaway,
      allow_dine_in: defaultType.defaults.allow_dine_in,
      allow_scheduled: defaultType.defaults.allow_scheduled,
      business_type: defaultType.id,
      operations_model: 'dine_in_takeaway'
    };
  }

  // 1. Direct fulfillment_modes if available
  let modes = settings.fulfillment_modes;

  // 2. Check brand_concepts array in restaurant_settings
  if (!modes && Array.isArray(settings.brand_concepts)) {
    const foundOp = settings.brand_concepts.find(c => c && (c.id === 'operations_model' || c.business_type || c.fulfillment_modes));
    if (foundOp) {
      modes = foundOp.fulfillment_modes || foundOp;
    }
  }

  const opModel = settings.operations_model;
  let type = settings.business_type || (opModel === 'dark_kitchen' ? 'dark_kitchen' : null);

  if (modes && typeof modes === 'object') {
    const resolvedType = modes.business_type || type || (modes.operations_model === 'dark_kitchen' ? 'dark_kitchen' : 'restaurant');
    const allowDelivery = Boolean(modes.allow_delivery ?? modes.delivery ?? true);
    const allowTakeaway = Boolean(modes.allow_takeaway ?? modes.takeaway ?? false);
    const allowDineIn = Boolean(modes.allow_dine_in ?? modes.dine_in ?? false);
    const allowScheduled = Boolean(modes.allow_scheduled ?? modes.scheduled ?? true);

    return {
      delivery: allowDelivery,
      takeaway: allowTakeaway,
      dine_in: allowDineIn,
      scheduled: allowScheduled,
      allow_delivery: allowDelivery,
      allow_takeaway: allowTakeaway,
      allow_dine_in: allowDineIn,
      allow_scheduled: allowScheduled,
      business_type: resolvedType,
      operations_model: modes.operations_model || (resolvedType === 'dark_kitchen' ? 'dark_kitchen' : 'dine_in_takeaway')
    };
  }

  // 3. Fallback based on business_type or brand name (e.g. Boku)
  if (!type) {
    if (settings.business_name && /boku/i.test(settings.business_name)) {
      type = 'dark_kitchen';
    } else {
      type = 'restaurant';
    }
  }
  const found = BUSINESS_TYPES.find(b => b.id === type) || BUSINESS_TYPES[1];
  return {
    delivery: found.defaults.allow_delivery,
    takeaway: found.defaults.allow_takeaway,
    dine_in: found.defaults.allow_dine_in,
    scheduled: found.defaults.allow_scheduled,
    allow_delivery: found.defaults.allow_delivery,
    allow_takeaway: found.defaults.allow_takeaway,
    allow_dine_in: found.defaults.allow_dine_in,
    allow_scheduled: found.defaults.allow_scheduled,
    business_type: type,
    operations_model: type === 'dark_kitchen' ? 'dark_kitchen' : 'dine_in_takeaway'
  };
};
