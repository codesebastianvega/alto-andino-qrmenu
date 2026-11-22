// Explicit creation data belongs to the user's request, not to provider prose.
const key = (text) => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export function catalogPrice(value) {
  const raw = String(value ?? '').trim().replace(/^\$\s*/, '').replace(/\s*(COP|pesos)$/i, '');
  const normalized = /^\d{1,3}(?:[.,]\d{3})+$/.test(raw) ? raw.replace(/[.,]/g, '') : raw;
  const price = Number(normalized);
  return Number.isFinite(price) && price > 0 && price <= 1_000_000_000 ? price : '';
}

export function extractCatalogRequest(message) {
  const text = String(message || '').trim();
  // Deliberately bounded grammar: do not reinterpret price updates or recipes.
  const start = text.match(/^(?:quiero\s+)?(?:crear|crea|agregar|agrega|vender|ofrecer)\s+(.+)$/is);
  if (!start || /\b(receta|ingredientes)\b/i.test(text)) return null;
  const category = start[1].match(/\s+en (?:la )?categor[ií]a\s+([^.!?\n]+)(?:[.!?]|$)/i);
  const list = (category ? start[1].slice(0, category.index) : start[1].split(/[.!?]\s+(?=[A-ZÁÉÍÓÚ])/)[0]).trim();
  // Keep conjunctions and separators inside quoted descriptions intact.
  const parts = list.split(/\s+y\s+(?=(?:[^"“”]*["“][^"“”]*["”])*[^"“”]*$)|;(?=(?:[^"“”]*["“][^"“”]*["”])*[^"“”]*$)|\n/);
  const products = parts.map((part) => {
    const match = part.trim().match(/^(.+?)(?:\s+(?:a|por)\s+(\$?\s*-?\d[\d.,]*(?:\s*(?:COP|pesos))?))?(?:\s*,?\s*descripci[oó]n\s*:\s*["“](.*?)["”])?$/i);
    if (!match) return null;
    return { name: match[1].trim().replace(/^["“]|["”]$/g, ''), price: catalogPrice(match[2]), description: match[3] || '', tags: [], requires_kitchen: true };
  });
  if (!products.length || products.some((product) => !product?.name)) return null;
  return { category_name: category?.[1].trim() || '', products };
}

export function continueCatalogRequest(message, previous) {
  if (!previous?.products || /\b(crea|crear|vender|receta|oculta|cambia|actualiza|horario|compra)\b/i.test(message)) return null;
  const target = previous.products.filter((product) => key(message).includes(key(product.name)));
  const amount = String(message).match(/(?:a|cuesta|precio(?: es)?|vale)\s*:?\s*(\$?\s*-?\d[\d.,]*)/i);
  if (target.length !== 1 || !amount) return null;
  return { ...previous, products: previous.products.map((product) => product === target[0] ? { ...product, price: catalogPrice(amount[1]) } : product) };
}

export function syncCatalogDraft(message, draft, previous = {}) {
  const explicit = extractCatalogRequest(message);
  if (explicit) return explicit;
  const name = draft?.product_name || previous.product_name || '';
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const namedAmount = name && String(message).match(new RegExp(`${escapedName}\\s+(?:a|por|cuesta)\\s*(\\$?\\s*-?\\d[\\d.,]*)`, 'i'));
  // A provider may normalize formatting, but cannot supply an unmentioned price.
  const price = catalogPrice(draft?.price);
  const mentioned = [...String(message).matchAll(/\$\s*(\d[\d.,]*)/g)].map((match) => catalogPrice(match[1]));
  return { ...previous, ...draft, product_name: name, category_name: draft?.category_name || previous.category_name || '', description: draft?.description || previous.description || '', price: namedAmount ? catalogPrice(namedAmount[1]) : mentioned.length === 1 && mentioned.includes(price) ? price : catalogPrice(previous.price) };
}

export function catalogFormProducts(draft) {
  const products = Array.isArray(draft?.products) ? draft.products : [{ name: draft?.product_name, ...draft }];
  return products.map((product) => ({ name: product.name || product.product_name || '', description: product.description || '', price: catalogPrice(product.price), tags: Array.isArray(product.tags) ? product.tags.join(', ') : '', requires_kitchen: product.requires_kitchen !== false }));
}

export function catalogDraftReply(draft) {
  const products = catalogFormProducts(draft);
  const missing = products.filter((product) => !product.price).map((product) => product.name);
  return `Conservé ${products.map((product) => `${product.name || 'nombre pendiente'}: ${product.price ? `$${product.price.toLocaleString('es-CO')}` : 'precio pendiente'}`).join('; ')}. Categoría: ${draft.category_name || 'pendiente'}. ${missing.length ? `¿Qué precio tendrá ${missing.map((product) => product || 'el producto').join(' y ')}? ` : ''}${products.some((product) => !product.description) ? 'Falta completar las descripciones. ' : ''}Revisa los datos y completa lo que falta antes de aprobar. Puedo crear hasta 10 productos por vez en una misma categoría; conservé todos en este borrador. Todavía no he guardado nada.`;
}
