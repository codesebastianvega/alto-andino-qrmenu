export const KPIS = [
  {
    id: 'conversion',
    title: 'Conversión (Visitas a Pedido)',
    alto: {
      value: '34.8%',
      badge: '+145% Más Pedidos',
      label: 'Foto Real (Alto Andino)',
      desc: 'El comensal confía de inmediato al ver el plato exactamente como le llegará a la mesa. La duda de "¿será que si viene así?" desaparece.'
    },
    boku: {
      value: '14.2%',
      badge: 'Baja Confianza',
      label: 'Foto IA / Genérica (Boku)',
      desc: 'Con fotos sintéticas o cartas sin foto, el comensal duda de la porción real y pide solo lo básico que ya conoce con recelo.'
    },
    splitDesc: 'El comensal confía de inmediato cuando ve el plato exactamente como le llegará a la mesa. La duda de "¿será que si viene así?" desaparece.'
  },
  {
    id: 'ticket',
    title: 'Ticket Promedio por Mesa',
    alto: {
      value: '$36.200',
      badge: '+$14.700 COP / Mesa',
      label: 'Con Adiciones & Bebidas',
      desc: 'Las fotos reales de alta definición estimulan el apetito visual. 1 de cada 2 mesas agrega bebidas artesanales, entradas o postres que antes ni sabían que existían.'
    },
    boku: {
      value: '$21.500',
      badge: 'Consumo Mínimo',
      label: 'Plato Único Básico',
      desc: 'Sin fotos tentadoras de bebidas o postres, el 85% de las mesas pide únicamente el plato fuerte básico sin ninguna adición.'
    },
    splitDesc: 'Las fotos reales de alta definición estimulan el apetito visual. 1 de cada 2 mesas agrega bebidas artesanales, entradas o postres que antes ni sabían que existían.'
  },
  {
    id: 'crossSell',
    title: 'Venta de Bebidas & Postres',
    alto: {
      value: '54%',
      badge: 'Triplica el Antojo',
      label: '1 de cada 2 pide bebida/postre',
      desc: 'Una foto iluminada del pastel de tres leches o del café de origen cierra la venta cruzada antes de terminar el almuerzo.'
    },
    boku: {
      value: '18%',
      badge: 'Venta Casi Nula',
      label: 'Solo 1 de cada 5 pide',
      desc: 'Nadie lee un postre en una lista de texto plano en PDF. Pasan totalmente desapercibidos para el 82% de los comensales.'
    },
    splitDesc: 'Nadie lee un postre en una lista de texto en PDF. Pero una foto iluminada del pastel de tres leches o del café de origen cierra la venta antes de terminar el almuerzo.'
  },
  {
    id: 'bounce',
    title: 'Tasa de Abandono (Rebote)',
    alto: {
      value: '16.2%',
      badge: '-66% Menos Fugas',
      label: 'Navegación fluida Aluna',
      desc: 'Aluna carga en menos de 0.8 segundos con caché instantáneo en el celular. El cliente se queda y explora el menú completo.'
    },
    boku: {
      value: '48.5%',
      badge: '48.5% Abandono',
      label: 'Abandono con PDF lento',
      desc: 'Cargar un PDF de 25MB por WhatsApp gasta los datos del cliente, se traba y casi la mitad lo cierra sin llegar a ordenar.'
    },
    splitDesc: 'Cargar un PDF de 25MB por WhatsApp gasta los datos del cliente y se cierra. Aluna carga en menos de 0.8 segundos con caché instantáneo en el celular.'
  },
  {
    id: 'turnover',
    title: 'Tiempo de Espera y Rotación',
    alto: {
      value: '42 min',
      badge: '-23 Minutos por Mesa',
      label: 'Atención ágil digital',
      desc: 'El cliente escanea al sentarse, pide de inmediato y el mesero solo lleva los platos. Atiendes hasta un 35% más mesas en horas pico.'
    },
    boku: {
      value: '65 min',
      badge: 'Esperas Prolongadas',
      label: 'Esperando carta física',
      desc: 'El mesero debe ir 3 veces a la mesa a llevar cartas, responder dudas y tomar nota, colapsando el servicio en horas pico.'
    },
    splitDesc: 'El cliente escanea al sentarse, pide de inmediato y el mesero solo lleva el pedido. Atiendes hasta un 35% más mesas en horas pico de almuerzo.'
  },
  {
    id: 'commission',
    title: 'Comisión por Pedido Directo',
    alto: {
      value: '0%',
      badge: '100% Ganancia para ti',
      label: 'Canal Directo Aluna',
      desc: 'Con Aluna el dinero entra íntegro a tu cuenta bancaria sin regalar comisiones del 25% a plataformas intermediarias.'
    },
    boku: {
      value: '22% - 25%',
      badge: 'Pérdida en Comisiones',
      label: 'Comisión a Apps / Intermediarios',
      desc: 'Por cada $10.000.000 COP vendidos por apps tradicionales, el restaurante le regala hasta $2.500.000 COP a la plataforma.'
    },
    splitDesc: 'Por cada $10.000.000 COP vendidos por apps tradicionales, el restaurante le regala $2.500.000 COP a la plataforma intermediaria. Con Aluna el dinero entra íntegro a tu cuenta.'
  }
];

export const BOKU_GALLERY_ITEMS = [
  {
    img: '/img/boku/boku_salmon_fresh.png',
    fallback: '/poke1.png',
    alt: 'Boku IA Salmon',
    tag: 'Concepto IA • BOKU [僕] Salmón Teriyaki',
    title: 'Apariencia Sintética vs Realidad',
    desc: 'La textura de la salsa y el glaseado están computarizados. Si la porción real servida difiere, el cliente siente frustración inmediata.'
  },
  {
    img: '/img/boku/boku_gold_chicken.png',
    fallback: '/poke1.png',
    alt: 'Boku IA Chicken',
    tag: 'Concepto IA • BOKU [僕] Crispy Chicken',
    title: 'Desconexión con Google Maps',
    desc: 'Los clientes no etiquetan fotos de IA en redes ni las usan para reseñar el local en Google Maps, limitando el posicionamiento orgánico.'
  }
];

export const BOKU_FRICTION_POINTS = [
  {
    title: 'La Trampa de la Expectativa',
    desc: 'La IA añade ingredientes o proporciones imposibles de replicar con exactitud en cada servicio, aumentando el riesgo de reclamos.'
  },
  {
    title: 'Ticket Bajo ($21.500)',
    desc: 'Al no ver limonadas, cócteles ni postres reales, el comensal se abstiene de pedir adiciones y consume solo el plato básico.'
  },
  {
    title: 'Cero Antojo Emocional',
    desc: 'La comida entra por los ojos: el vapor real, la salsa derretida y el brillo auténtico son insustituibles para provocar hambre.'
  }
];

export const ALTO_GALLERY_ITEMS = [
  {
    img: '/img/products/sandwich-serrano.jpg',
    alt: 'Sándwich Serrano',
    tag: 'Foto Real • Sándwich Serrano',
    title: 'Apetito Visual Inmediato',
    desc: 'La textura crocante del pan artesanal y el jamón serrano provocan antojo antes de que el comensal decida.'
  },
  {
    img: '/img/products/bowl-poke-hawaiano.jpg',
    alt: 'Poke Bowl',
    tag: 'Foto Real • Poke Bowl Hawaiano',
    title: 'Certeza de Frescura',
    desc: 'Los colores reales del salmón, aguacate y ajonjolí transmiten frescura inmediata. Cero dudas al ordenar.'
  },
  {
    img: '/img/products/post-tres.jpg',
    alt: 'Postre Tres Leches',
    tag: 'Foto Real • Postre Tres Leches',
    title: 'Venta Cruzada (+54%)',
    desc: 'Los postres no se venden por texto, se venden por la foto de la crema y la canela. Triplica las ventas de cierre.'
  }
];

export const ALTO_SUCCESS_PILLARS = [
  {
    title: 'Reseñas 5★ en Google Maps',
    desc: 'Al recibir exactamente lo prometido, los comensales toman fotos reales y dejan calificaciones perfectas en tu ficha de negocio.'
  },
  {
    title: 'Ticket de $36.200 por Mesa',
    desc: '1 de cada 2 mesas suma entradas, bebidas de autor o postres atraídas por las fotos en alta definición.'
  },
  {
    title: '0% Comisiones a Terceros',
    desc: 'Tus clientes escanean el QR en mesa o piden por tu enlace directo: todo el dinero ingresa completo a tu caja registradora.'
  }
];

export const COMPARISON_ROWS = [
  {
    feature: 'Fotografía de cada plato',
    pdfMobile: '❌ Ninguna o stock',
    pdfDesktop: '❌ Ninguna o de stock genérico',
    bokuMobile: '⚠️ Artificial (IA)',
    bokuDesktop: '⚠️ Artificial / Puede diferir',
    altoMobile: '✅ 100% Real',
    altoDesktop: '✅ 100% Real, plato por plato'
  },
  {
    feature: 'Tiempo de Carga en Móvil',
    pdfMobile: 'Lento (PDF 20MB)',
    pdfDesktop: 'Lento (PDF de 20MB)',
    bokuMobile: 'Rápido (< 1.5s)',
    bokuDesktop: 'Rápido (< 1.5s)',
    altoMobile: '⚡ Instantáneo',
    altoDesktop: 'Instantáneo (Caché local PWA)'
  },
  {
    feature: 'Editar Precios / Platos Agotados',
    pdfMobile: 'Reimprimir / rehacer',
    pdfDesktop: 'Reimprimir o rehacer PDF',
    bokuMobile: 'Panel en tiempo real',
    bokuDesktop: 'Panel en tiempo real',
    altoMobile: 'Panel desde celular',
    altoDesktop: 'Panel Admin desde tu celular'
  },
  {
    feature: 'Comisión por Venta',
    pdfMobile: '0% manual',
    pdfDesktop: '0% pero sin automatización',
    bokuMobile: '0%',
    bokuDesktop: '0%',
    altoMobile: '0% directa',
    altoDesktop: '0% (Venta 100% directa)'
  },
  {
    feature: 'Conexión con Google Maps',
    pdfMobile: '❌ Desconectado',
    pdfDesktop: '❌ Desconectado',
    bokuMobile: 'Enlace básico',
    bokuDesktop: 'Enlace básico',
    altoMobile: '✅ Reseñas 5★',
    altoDesktop: '✅ Integración directa para reseñas 5★'
  },
  {
    feature: 'Montaje y Configuración',
    pdfMobile: 'Tedioso (Dueño)',
    pdfDesktop: 'Tedioso por cuenta del dueño',
    bokuMobile: 'Requiere prompts',
    bokuDesktop: 'Requiere diseño de prompts',
    altoMobile: '✨ Llave en mano',
    altoDesktop: '✨ Llave en mano (Te lo dejamos listo)'
  }
];
