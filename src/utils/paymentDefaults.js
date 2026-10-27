/**
 * paymentDefaults.js
 * 
 * Centraliza la creación de medios de pago por defecto para nuevos negocios.
 * Todo negocio nuevo debe tener al menos 'Efectivo' (Cash) activo de inmediato.
 * Si se dispone de número telefónico/WhatsApp, se crea también 'Nequi / Daviplata'.
 */

export function buildDefaultPaymentMethods(brandId, { phone = null } = {}) {
  const methods = [
    {
      brand_id: brandId,
      name: 'Efectivo',
      type: 'cash',
      icon: 'solar:bill-check-bold',
      is_active: true,
      details: {
        instructions: 'Pagas al recibir tu pedido en efectivo o directamente en caja.'
      }
    }
  ];

  if (phone && phone.trim()) {
    const cleanPhone = phone.trim().replace(/[^0-9+]/g, '');
    if (cleanPhone.length >= 7) {
      methods.push({
        brand_id: brandId,
        name: 'Transferencia Nequi / Daviplata',
        type: 'digital_wallet',
        icon: 'solar:wallet-bold',
        is_active: true,
        details: {
          bank_name: 'Nequi / Daviplata',
          account_number: cleanPhone,
          instructions: `Transfiere al número ${cleanPhone} y envía el comprobante por WhatsApp.`
        }
      });
    }
  }

  return methods;
}
