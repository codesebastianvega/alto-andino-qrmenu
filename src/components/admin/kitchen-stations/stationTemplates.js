export const DEFAULT_STATIONS_TEMPLATE = [
  {
    id: 'assembly',
    title: 'Mesa de Ensamble & Báscula',
    subtitle: 'Zona Central (Montaje, Pesaje & Despacho)',
    icon: 'heroicons:squares-plus',
    accentColor: 'indigo',
    badge: 'Estación Crítica',
    temp: 'Ambiente (20-22°C)',
    description: 'Donde se realiza el pesaje exacto en gramera, colocación de bases tibias, toppings frescos y sellado para despacho.',
    items: [
      {
        name: 'Gramera Digital de Precisión',
        location: 'Centro del Mesón',
        purpose: 'Pesaje gramo a gramo. Regla: siempre tarar en 0g con el empaque puesto.',
        critical: true,
        icon: 'heroicons:scale'
      },
      {
        name: 'Termo / Calentador de Base',
        location: 'Extremo Izquierdo',
        purpose: 'Mantener la base caliente o tibia lista para servir. Mantener cerrado.',
        critical: true,
        icon: 'heroicons:fire'
      },
      {
        name: 'Empaques Primarios & Tapas',
        location: 'Fila Trasera de Ensamble',
        purpose: 'Empaque primario. Asegurar el sellado hermético antes de rotular.',
        critical: false,
        icon: 'heroicons:archive-box'
      },
      {
        name: 'Dispensadores de Toppings & Crunch',
        location: 'Frente Derecho',
        purpose: 'Semillas, frutos secos y guarniciones secas dosificadas.',
        critical: false,
        icon: 'heroicons:sparkles'
      },
      {
        name: 'Zona de Despacho & Bolsas',
        location: 'Extremo Derecho',
        purpose: 'Bolsas con fuelle, kits de cubiertos biodegradables y stickers de comanda.',
        critical: false,
        icon: 'heroicons:check-badge'
      }
    ]
  },
  {
    id: 'fridge1',
    title: 'Nevera 1: Proteínas & Congelador',
    subtitle: 'Zona Fría de Carnes & Porcionado Crudo',
    icon: 'heroicons:cube-transparent',
    accentColor: 'rose',
    badge: 'Cadena de Frío',
    temp: '2°C a 4°C / -18°C Congelador',
    description: 'Exclusiva para proteínas crudas y porcionadas. Evita al 100% la contaminación cruzada con vegetales listos para comer.',
    items: [
      {
        name: 'Proteínas Marinadas (Mise en Place)',
        location: 'Bandeja Media - Insertos GN con Tapa',
        purpose: 'Porciones estándar rotuladas con fecha y hora de preparación. Vida útil máx: 3 días refrigerado.',
        critical: true,
        icon: 'heroicons:tag'
      },
      {
        name: 'Stock Porcionado Congelado',
        location: 'Congelador Superior (-18°C)',
        purpose: 'Stock de seguridad porcionado al vacío o en bolsa sellada. Bajar a refrigeración con 12h de anticipación.',
        critical: false,
        icon: 'heroicons:inbox-stack'
      },
      {
        name: 'Materia Prima Cruda de Reserva',
        location: 'Cajón Inferior Frío Máximo',
        purpose: 'Materia prima para corte diario en tabla roja (carnes crudas).',
        critical: true,
        icon: 'heroicons:shield-exclamation'
      }
    ]
  },
  {
    id: 'fridge2',
    title: 'Nevera 2: Vegetales & Biberones de Salsa',
    subtitle: 'Zona Fría de Frescos Listos para Consumo',
    icon: 'heroicons:beaker',
    accentColor: 'emerald',
    badge: 'Listos para Consumo',
    temp: '4°C a 6°C',
    description: 'Insumos que van directo al plato sin cocción posterior, más salsas caseras dosificadas.',
    items: [
      {
        name: 'Biberones de Salsas de la Casa',
        location: 'Puerta Nevera / Estante Medio',
        purpose: 'Dosificadores con pico limpio y rotulado. Agitar siempre antes de dosificar.',
        critical: true,
        icon: 'heroicons:beaker'
      },
      {
        name: 'Insertos de Vegetales Frescos Picados',
        location: 'Bandeja Media - Recipientes Sellados',
        purpose: 'Vegetales limpios y sanitizados listos para servicio. Mantener escurridos sin agua estancada.',
        critical: true,
        icon: 'heroicons:leaf'
      },
      {
        name: 'Hierbas Frescas & Toppings Verdes',
        location: 'Bandeja Superior con Papel Secante',
        purpose: 'Topping final fresco. El papel secante absorbe humedad y alarga frescura.',
        critical: false,
        icon: 'heroicons:sparkles'
      }
    ]
  },
  {
    id: 'hot',
    title: 'Zona Caliente: Cocción, Plancha & Fuego',
    subtitle: 'Cocción Rápida y Sellado',
    icon: 'heroicons:fire',
    accentColor: 'amber',
    badge: 'Fuego Alto',
    temp: 'Alta Potencia (> 180°C)',
    description: 'Donde las proteínas y salteados pasan por cocción rápida al fuego para sellado y glaseado final.',
    items: [
      {
        name: 'Plancha / Sartén / Wok Principal',
        location: 'Quemador Principal',
        purpose: 'Precalentar antes de poner la porción. No sobrecargar para sellado parejo.',
        critical: true,
        icon: 'heroicons:fire'
      },
      {
        name: 'Dosificador de Grasa / Aceite',
        location: 'Costado del Quemador',
        purpose: 'Cantidad exacta por tanda. Solo lo justo para lubricar y dorar sin engrasar de más.',
        critical: false,
        icon: 'heroicons:beaker'
      },
      {
        name: 'Pinzas de Cocina & Espátulas',
        location: 'Porta-utensilios Caliente',
        purpose: 'Uso exclusivo para voltear alimentos calientes y transferir al mesón de ensamble.',
        critical: false,
        icon: 'heroicons:wrench-screwdriver'
      }
    ]
  }
];

export const ACCENT_COLORS = [
  { id: 'indigo', label: 'Índigo', bg: 'bg-indigo-600', light: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'rose', label: 'Rosa / Rojo', bg: 'bg-rose-600', light: 'bg-rose-50 text-rose-700 border-rose-200' },
  { id: 'emerald', label: 'Esmeralda', bg: 'bg-emerald-600', light: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'amber', label: 'Ámbar / Naranja', bg: 'bg-amber-600', light: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'purple', label: 'Púrpura', bg: 'bg-purple-600', light: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'blue', label: 'Azul', bg: 'bg-blue-600', light: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'slate', label: 'Gris Neutro', bg: 'bg-slate-700', light: 'bg-slate-100 text-slate-700 border-slate-200' }
];

export const ICON_OPTIONS = [
  { id: 'heroicons:squares-plus', label: 'Ensamble / Mesón' },
  { id: 'heroicons:fire', label: 'Fuego / Caliente' },
  { id: 'heroicons:cube-transparent', label: 'Frío / Congelador' },
  { id: 'heroicons:beaker', label: 'Salsas / Líquidos' },
  { id: 'heroicons:scale', label: 'Báscula / Pesaje' },
  { id: 'heroicons:archive-box', label: 'Empaques / Almacén' },
  { id: 'heroicons:sparkles', label: 'Toppings / Especial' },
  { id: 'heroicons:leaf', label: 'Vegetales / Frescos' },
  { id: 'heroicons:shield-exclamation', label: 'Inocuidad / Alerta' },
  { id: 'heroicons:wrench-screwdriver', label: 'Utensilios' },
  { id: 'heroicons:tag', label: 'Rotulado' },
  { id: 'heroicons:check-badge', label: 'Despacho' }
];
