/**
 * Centralized WhatsApp numbers and messages for Aluna.
 */
export const WHATSAPP_CONFIG = {
  // Main sales and activation contact
  MAIN_CONTACT: '573222285900',
  
  // Format for display
  DISPLAY_NUMBER: '+57 322 228 5900',

  // Messages templates
  templates: {
    activatePlan: (planName, businessName, userName, email, phone) => {
      return `¡Hola Aluna! 👋 Quiero activar el Plan ${planName} para ${businessName || 'mi negocio'}.

Mis datos:
- Nombre: ${userName}
- Email: ${email}
- WhatsApp: ${phone}
- Plan: ${planName}`;
    },
    support: (businessName) => {
      return `Hola Aluna, necesito soporte para mi negocio ${businessName || ''}.`;
    },
    growthPlan1: () => {
      return `¡Hola Sebastián! 👋 Vi la propuesta de la Alianza Uxio × Aluna y quiero activar el *Plan Despegue Llave en Mano* ($150.000 setup fotos + $29.900/mes).

Quiero digitalizar mi menú y hacer la sesión de fotos de mis platos estrella.

🍽️ Mi restaurante: [Escribe el nombre de tu negocio]
📍 Ubicado en: [Ciudad o Municipio]
👤 Mi nombre: [Tu nombre]`;
    },
    growthPlan2: () => {
      return `¡Hola Sebastián! 👋 Me interesa el *Plan Growth: Crecimiento & Contenido* ($790.000 COP/mes).

Quiero que Uxio produzca los 2 Videos Reels mensuales y fotos de mi carta, con la plataforma Aluna Profesional incluida para cocina y meseros.

🍽️ Restaurante: [Nombre del negocio]
📍 Ubicación: [Ciudad / Municipio]
📱 Instagram actual: [@turestaurante]
👤 Mi nombre: [Tu nombre]`;
    },
    growthPlan3: () => {
      return `¡Hola Sebastián! 👑 Quiero postular mi restaurante al *Plan Dominio Gastronómico VIP* ($1.490.000 COP/mes).

Nos interesa la producción semanal de Reels (4 videos/mes), fotografía continua y Aluna Premium multisede.

🍽️ Restaurante / Gastrobar: [Nombre del negocio]
📍 Sedes y Ciudad: [Ubicación]
👤 Contacto: [Nombre y Cargo]`;
    },
    saasSoftwareOnly: () => {
      return `¡Hola Aluna! 👋 Ya contamos con fotógrafo y redes en mi restaurante. Quiero contratar únicamente la plataforma de software *Aluna SaaS* para recibir pedidos directos sin comisiones.

🍽️ Restaurante: [Nombre del negocio]
📍 Ciudad: [Ciudad / Municipio]`;
    }
  },

  getLink: (text) => {
    return `https://wa.me/573222285900?text=${encodeURIComponent(text)}`;
  }
};
