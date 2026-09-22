import { formatCOP } from './money';

/**
 * Sends an automated order comanda to a Telegram Group / Channel.
 * Can use a Supabase Edge Function or direct Telegram Bot API if configured.
 * 
 * @param {Object} params
 * @param {Object} params.order
 * @param {Array} params.items
 * @param {Object} params.brand
 * @param {Object} params.location
 * @param {string} params.paymentMethodSummary
 * @param {number} params.finalTotal
 * @param {string} params.fulfillmentType
 */
export async function sendTelegramOrderNotification({
  order,
  items = [],
  brand = {},
  location = {},
  paymentMethodSummary = '',
  finalTotal = 0,
  fulfillmentType = 'delivery'
}) {
  try {
    const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || location?.telegram_bot_token;
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID || location?.telegram_chat_id;

    if (!botToken || !chatId) {
      console.info('ℹ️ [Telegram Notification] No configurado (VITE_TELEGRAM_BOT_TOKEN / VITE_TELEGRAM_CHAT_ID ausentes).');
      return { success: false, reason: 'unconfigured' };
    }

    const orderCode = order?.id ? order.id.slice(-4).toUpperCase() : 'N/A';
    const brandName = brand?.name || 'Restaurante';
    const isBoku = brandName.toLowerCase().includes('boku');
    const headerEmoji = isBoku ? '🍱' : '🍽️';

    const modalityText = fulfillmentType === 'delivery'
      ? '🛵 DOMICILIO'
      : fulfillmentType === 'takeaway'
        ? '🛍️ PARA LLEVAR'
        : '🍽️ EN MESA';

    const customerName = order?.customer_name || 'Cliente';
    const customerPhone = order?.customer_phone || '';
    const cleanPhone = customerPhone.replace(/\D/g, '');

    // Parse address if embedded or passed
    let address = '';
    if (order?.customer_name && order.customer_name.includes('[Dir:')) {
      const match = order.customer_name.match(/\[Dir:\s*([^\]]+)\]/);
      if (match) address = match[1];
    }

    let message = `${headerEmoji} *NUEVO PEDIDO #${orderCode}*\n`;
    message += `🏷️ *Marca:* ${brandName}\n`;
    message += `📦 *Modalidad:* ${modalityText}\n\n`;

    message += `👤 *Cliente:* ${customerName.split(' [Dir:')[0]}\n`;
    if (customerPhone) {
      message += `📞 *Teléfono:* [${customerPhone}](tel:${cleanPhone})\n`;
    }
    if (address) {
      message += `📍 *Dirección:* ${address}\n`;
    }

    message += `\n🍱 *PRODUCTOS:*\n`;
    items.forEach((it) => {
      const unitPrice = it.price || it.unit_price || 0;
      const qty = it.qty || 1;
      message += `• *${qty}x* ${it.name} — ${formatCOP(unitPrice * qty)}\n`;
      if (it.note) {
        message += `  ↳ 📝 _Nota: ${it.note}_\n`;
      }
      if (it.options && Object.keys(it.options).length > 0) {
        const optList = Object.entries(it.options)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ');
        message += `  ↳ ⚙️ _${optList}_\n`;
      }
    });

    message += `\n💰 *TOTAL:* *${formatCOP(finalTotal)}*\n`;
    message += `💳 *MÉTODO DE PAGO:* *${paymentMethodSummary || 'Por acordar'}*\n`;

    if (order?.id) {
      const adminUrl = `${window.location.origin}/${brand?.slug || ''}/#admin/orders`;
      message += `\n🔗 [Ver en Sistema Aluna Admin](${adminUrl})`;
    }

    // Inline keyboard for instant calling / WhatsApp / Maps
    const inlineKeyboard = [];
    const contactRow = [];

    if (cleanPhone) {
      contactRow.push({
        text: '💬 WhatsApp',
        url: `https://wa.me/${cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`}`
      });
      contactRow.push({
        text: '📞 Llamar',
        url: `tel:${cleanPhone}`
      });
    }

    if (address) {
      contactRow.push({
        text: '🗺️ Mapa',
        url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      });
    }

    if (contactRow.length > 0) {
      inlineKeyboard.push(contactRow);
    }

    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      reply_markup: inlineKeyboard.length > 0 ? { inline_keyboard: inlineKeyboard } : undefined
    };

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('⚠️ [Telegram Notification] Error al enviar:', errText);
      return { success: false, error: errText };
    }

    console.log('✅ [Telegram Notification] Comanda enviada a Telegram con éxito.');
    return { success: true };
  } catch (err) {
    console.error('❌ [Telegram Notification] Error inesperado:', err);
    return { success: false, error: err };
  }
}
