/**
 * Utilidad de atribución de canales y campañas para Aluna QR Menu.
 * Captura fuentes como ?src=volante, ?src=instagram, ?mesa=3, etc.
 * Persiste los datos durante la sesión para atribuir eventos y pedidos.
 */

export function getAttribution() {
  if (typeof window === 'undefined') {
    return { source: 'direct', campaign: null, mesa: null };
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const urlSource = params.get('src') || params.get('source') || params.get('utm_source');
    const urlCamp = params.get('camp') || params.get('campaign') || params.get('utm_campaign');
    const urlMesa = params.get('mesa');

    // Si viene en la URL actual, guardarlo en sessionStorage para toda la navegación
    if (urlSource) sessionStorage.setItem('aa_attr_source', urlSource);
    if (urlCamp) sessionStorage.setItem('aa_attr_campaign', urlCamp);
    if (urlMesa) {
      sessionStorage.setItem('aa_attr_mesa', urlMesa);
      localStorage.setItem('aa_current_mesa', urlMesa);
    }

    const savedSource = sessionStorage.getItem('aa_attr_source');
    const savedCamp = sessionStorage.getItem('aa_attr_campaign');
    const savedMesa = sessionStorage.getItem('aa_attr_mesa') || localStorage.getItem('aa_current_mesa');

    return {
      source: savedSource || (savedMesa ? 'qr_mesa' : 'direct'),
      campaign: savedCamp || null,
      mesa: savedMesa || null,
    };
  } catch (e) {
    return { source: 'direct', campaign: null, mesa: null };
  }
}

/**
 * Genera la URL con parámetros de atribución para un canal o campaña específica
 */
export function buildCampaignUrl({ baseUrl = window.location.origin, brandSlug, channel, campaignName, mesa }) {
  const url = new URL(`${baseUrl}/${brandSlug || ''}`.replace(/\/+$/, '/'));
  
  if (channel) {
    url.searchParams.set('src', channel);
  }
  if (campaignName) {
    url.searchParams.set('camp', campaignName);
  }
  if (mesa) {
    url.searchParams.set('mesa', mesa);
  }

  return url.toString();
}
