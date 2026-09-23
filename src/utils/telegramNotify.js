import { formatCOP } from './money';
import { supabase } from '../config/supabase';

/**
 * Escapes HTML entities to prevent Telegram parse errors.
 */
function escapeHtml(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Sends an automated order comanda to a Telegram Group / Channel.
 * Uses Telegram Bot API direct dispatch with HTML mode and plain-text fallback.
 * 
 * @param {Object} params
 * @param {Object} params.order
 * @param {Array} params.items
 * @param {Object} params.brand
 * @param {Object} params.location
 * @param {Object} [params.settings]
 * @param {string} params.paymentMethodSummary
 * @param {number} params.finalTotal
 * @param {string} params.fulfillmentType
 * @param {string} [params.mesa]
 * @param {string} [params.orderNote]
 * @param {string} [params.deliveryAddress]
 * @param {string} [params.deliveryNotes]
 */
export async function sendTelegramOrderNotification({
  order,
  items = [],
  brand = {},
  location = {},
  settings = {},
  paymentMethodSummary = '',
  finalTotal = 0,
  fulfillmentType = 'delivery',
  mesa = null,
  orderNote = '',
  deliveryAddress = '',
  deliveryNotes = ''
}) {
  try {
    let currentSettings = settings;

    let telegramConcept = Array.isArray(currentSettings?.brand_concepts)
      ? currentSettings.brand_concepts.find(c => c && c.id === 'telegram_dispatch')
      : null;

    let botToken = telegramConcept?.bot_token || location?.telegram_bot_token || currentSettings?.telegram_bot_token || import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    let chatId = telegramConcept?.chat_id || location?.telegram_chat_id || currentSettings?.telegram_chat_id || import.meta.env.VITE_TELEGRAM_CHAT_ID;

    // Fallback: If not found or incomplete in passed settings, query ALL restaurant_settings for this brand from Supabase
    const targetBrandId = brand?.id || currentSettings?.brand_id;
    if ((!botToken || !chatId) && targetBrandId) {
      try {
        const { data: allRS } = await supabase
          .from('restaurant_settings')
          .select('brand_concepts, business_name')
          .eq('brand_id', targetBrandId);

        if (Array.isArray(allRS)) {
          for (const row of allRS) {
            const concept = Array.isArray(row?.brand_concepts)
              ? row.brand_concepts.find(c => c && c.id === 'telegram_dispatch')
              : null;
            if (concept && concept.chat_id && concept.bot_token) {
              telegramConcept = concept;
              botToken = concept.bot_token;
              chatId = concept.chat_id;
              break;
            }
          }
        }
      } catch (e) {
        console.warn('⚠️ [Telegram] Error fetching fallback settings:', e);
      }
    }

    // Check if explicitly disabled in settings
    if (telegramConcept && telegramConcept.enabled === false) {
      console.info('ℹ️ [Telegram Notification] Notificaciones de Telegram desactivadas en Ajustes.');
      return { success: false, reason: 'disabled' };
    }

    if (!botToken || !chatId) {
      console.warn('⚠️ [Telegram Notification] No configurado (Bot Token o Chat ID ausentes). Token:', Boolean(botToken), 'ChatId:', Boolean(chatId));
      return { success: false, reason: 'unconfigured' };
    }

    console.log('🚀 [Telegram Notification] Despachando comanda a chat:', chatId);

    const orderCode = order?.id ? order.id.slice(-4).toUpperCase() : 'N/A';
    const brandName = brand?.name || currentSettings?.business_name || 'Restaurante';
    const isBoku = brandName.toLowerCase().includes('boku');
    const headerEmoji = isBoku ? '🍱' : '🍽️';

    const modalityText = fulfillmentType === 'delivery'
      ? '🛵 DOMICILIO'
      : fulfillmentType === 'takeaway'
        ? '🛍️ PARA LLEVAR'
        : '🍽️ EN MESA';

    const rawCustomerName = order?.customer_name || 'Cliente';
    const cleanCustomerName = rawCustomerName.split(' [Dir:')[0];
    const customerPhone = order?.customer_phone || '';
    const cleanPhone = customerPhone.replace(/\D/g, '');

    // Parse address if embedded or passed
    let address = deliveryAddress || '';
    if (!address && order?.customer_name && order.customer_name.includes('[Dir:')) {
      const match = order.customer_name.match(/\[Dir:\s*([^\]]+)\]/);
      if (match) address = match[1];
    }
    if (deliveryNotes && !address.includes(deliveryNotes)) {
      address = address ? `${address} (${deliveryNotes})` : deliveryNotes;
    }

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

    let message = `${headerEmoji} <b>NUEVA COMANDA #${escapeHtml(orderCode)}</b>\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🏷️ <b>Marca:</b> ${escapeHtml(brandName)}\n`;
    if (location?.name) {
      message += `🏪 <b>Sede:</b> ${escapeHtml(location.name)}\n`;
    }
    message += `⏰ <b>Hora:</b> ${escapeHtml(timeFormatted)}\n`;
    message += `📦 <b>Modalidad:</b> <b>${escapeHtml(modalityText)}</b>\n`;
    if (mesa && fulfillmentType === 'dine_in') {
      message += `🪑 <b>Mesa:</b> <b>MESA ${escapeHtml(mesa)}</b>\n`;
    }
    message += `\n`;

    message += `👤 <b>Cliente:</b> ${escapeHtml(cleanCustomerName)}\n`;
    if (customerPhone) {
      message += `📞 <b>Teléfono:</b> <code>${escapeHtml(customerPhone)}</code>\n`;
    }
    if (address) {
      message += `📍 <b>Dirección:</b> <b>${escapeHtml(address)}</b>\n`;
    }
    const finalNote = orderNote || order?.notes;
    if (finalNote) {
      message += `📝 <b>Nota del Pedido:</b> <i>"${escapeHtml(finalNote)}"</i>\n`;
    }

    message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📋 <b>DETALLE DEL PEDIDO:</b>\n`;
    items.forEach((it) => {
      const unitPrice = it.price || it.unit_price || 0;
      const qty = it.qty || 1;
      message += `• <b>${qty}x</b> ${escapeHtml(it.name)} — ${escapeHtml(formatCOP(unitPrice * qty))}\n`;
      if (it.options && Object.keys(it.options).length > 0) {
        const optList = Object.entries(it.options)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ');
        message += `  ↳ ⚙️ <i>${escapeHtml(optList)}</i>\n`;
      }
      if (it.note) {
        message += `  ↳ 📝 <i>Nota: ${escapeHtml(it.note)}</i>\n`;
      }
    });

    message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    message += `💰 <b>TOTAL:</b> <b>${escapeHtml(formatCOP(finalTotal))}</b>\n`;
    message += `💳 <b>MÉTODO DE PAGO:</b> <b>${escapeHtml(paymentMethodSummary || 'Por acordar')}</b>\n`;

    // Inline keyboard for instant WhatsApp / Maps (Only HTTPS allowed by Telegram API)
    const inlineKeyboard = [];
    const actionRow = [];

    if (cleanPhone) {
      const fullPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
      actionRow.push({
        text: '💬 WhatsApp Cliente',
        url: `https://wa.me/${fullPhone}`
      });
    }

    if (address) {
      actionRow.push({
        text: '🗺️ Abrir en Maps',
        url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      });
    }

    if (actionRow.length > 0) {
      inlineKeyboard.push(actionRow);
    }

    if (order?.id && typeof window !== 'undefined') {
      const adminUrl = `${window.location.origin}/${brand?.slug || ''}/#admin/orders`;
      inlineKeyboard.push([{
        text: '📋 Ver en Aluna Admin',
        url: adminUrl
      }]);
    }

    const cleanChatId = String(chatId).trim();
    const cleanBotToken = String(botToken).trim();

    const payload = {
      chat_id: cleanChatId,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: inlineKeyboard.length > 0 ? { inline_keyboard: inlineKeyboard } : undefined
    };

    let res = await fetch(`https://api.telegram.org/bot${cleanBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // Fallback: If HTML formatting triggers 400 Bad Request, retry as plain text immediately
    if (!res.ok && res.status === 400) {
      console.warn('⚠️ [Telegram] Error con parse_mode HTML. Reintentando como texto plano...');
      const plainPayload = {
        chat_id: cleanChatId,
        text: message.replace(/<[^>]*>/g, ''),
        disable_web_page_preview: true,
        reply_markup: inlineKeyboard.length > 0 ? { inline_keyboard: inlineKeyboard } : undefined
      };
      res = await fetch(`https://api.telegram.org/bot${cleanBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plainPayload)
      });
    }

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

/**
 * Sends a test simulated comanda to verify Telegram connection.
 * 
 * @param {Object} params
 * @param {string} params.chatId - The Telegram chat or group ID.
 * @param {string} [params.brandName] - Name of the restaurant.
 * @param {string} [params.botToken] - Optional custom bot token override.
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function sendTestTelegramNotification({
  chatId,
  brandName = 'Restaurante',
  botToken: customBotToken
}) {
  const botToken = customBotToken || import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return {
      success: false,
      error: 'Falta el Token del Bot. Ingresa tu Token de @BotFather para conectar tu marca.'
    };
  }
  if (!chatId) {
    return {
      success: false,
      error: 'Por favor ingresa el ID del Chat o Grupo de Telegram antes de probar.'
    };
  }

  const cleanChatId = String(chatId).trim();
  const cleanBotToken = String(botToken).trim();

  const testMessage = `⚡ <b>¡CONEXIÓN EXITOSA CON ALUNA!</b> 🍽️\n\n` +
    `🏷️ <b>Marca:</b> ${escapeHtml(brandName)}\n` +
    `👨‍🍳 <b>Canal de Cocina & Staff:</b> Notificaciones Activas\n\n` +
    `✅ <b>¡Excelente!</b> Este grupo de Telegram está sincronizado correctamente.\n\n` +
    `A partir de ahora, cuando un cliente confirme un pedido en tu menú digital, llegará de inmediato a este chat con lista de platos, notas de cocina, dirección y botones directos.\n\n` +
    `<i>Prueba enviada el ${escapeHtml(new Date().toLocaleTimeString('es-CO'))}</i>`;

  const payload = {
    chat_id: cleanChatId,
    text: testMessage,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  };

  try {
    const res = await fetch(`https://api.telegram.org/bot${cleanBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      let description = errText;
      try {
        const parsed = JSON.parse(errText);
        description = parsed.description || errText;
      } catch {}

      if (description.includes('chat not found')) {
        return { 
          success: false, 
          error: 'Chat no encontrado. Asegúrate de haber agregado al Bot a tu grupo de Telegram y que el ID empiece con - o -100.' 
        };
      }
      if (description.includes('bot was kicked') || description.includes('bot was blocked')) {
        return { 
          success: false, 
          error: 'El bot no tiene permisos o fue expulsado del grupo. Vuelve a agregarlo al grupo.' 
        };
      }
      if (description.includes('Unauthorized') || description.includes('Not Found')) {
        return { 
          success: false, 
          error: 'Token de Bot inválido. Verifica que hayas copiado el token completo de @BotFather sin espacios.' 
        };
      }
      return { success: false, error: description };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || 'Error de conexión con Telegram' };
  }
}

/**
 * Automatically detects the Telegram Chat ID for a given bot token
 * by querying the Telegram Bot API /getUpdates endpoint.
 *
 * @param {string} botToken
 * @returns {Promise<{ success: boolean, chatId?: string, chatTitle?: string, isPrivate?: boolean, error?: string }>}
 */
export async function detectTelegramChatId(botToken) {
  if (!botToken || !botToken.trim()) {
    return {
      success: false,
      error: 'Ingresa primero el Token de tu bot antes de detectar el grupo.'
    };
  }

  const cleanToken = botToken.trim();

  try {
    const res = await fetch(`https://api.telegram.org/bot${cleanToken}/getUpdates`);
    if (!res.ok) {
      const errText = await res.text();
      let msg = errText;
      try {
        const parsed = JSON.parse(errText);
        msg = parsed.description || errText;
      } catch {}
      return { success: false, error: msg };
    }

    const data = await res.json();
    const updates = Array.isArray(data?.result) ? data.result : [];

    if (updates.length === 0) {
      return {
        success: false,
        error: 'Aún no se detecta ningún mensaje. Abre tu grupo de Telegram, asegúrate de haber agregado a tu bot y envía un mensaje como "/start" o "hola" en el grupo. Luego vuelve a hacer clic aquí.'
      };
    }

    // 1. Prioritize groups or supergroups (from newest to oldest)
    for (let i = updates.length - 1; i >= 0; i--) {
      const u = updates[i];
      const chat = u.message?.chat || u.my_chat_member?.chat || u.channel_post?.chat;
      if (chat && (chat.type === 'group' || chat.type === 'supergroup')) {
        return {
          success: true,
          chatId: String(chat.id),
          chatTitle: chat.title || 'Grupo de Cocina',
          isPrivate: false
        };
      }
    }

    // 2. If no group found, check for private chat with the bot
    for (let i = updates.length - 1; i >= 0; i--) {
      const u = updates[i];
      const chat = u.message?.chat || u.my_chat_member?.chat;
      if (chat && chat.type === 'private') {
        return {
          success: true,
          chatId: String(chat.id),
          chatTitle: `Chat personal de ${chat.first_name || 'Admin'}`,
          isPrivate: true
        };
      }
    }

    return {
      success: false,
      error: 'No se encontró un grupo en los mensajes recientes. Agrega a tu bot al grupo de cocina y escribe cualquier mensaje en el grupo.'
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Error de conexión con Telegram al detectar el chat.'
    };
  }
}

