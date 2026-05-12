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
    }
  }
};
