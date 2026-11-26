import { formatCOP } from '../../../utils/money.js';
export const FLYER = { width: 1080, height: 1350, pixelRatio: 2, quality: 0.95, dailyPrice: 19000 };
export const priceLabel = formatCOP;
export const DEFAULT_COPY = { title: 'Hoy en Boku', dailyTitle: 'Bentos del día', includes: 'Incluyen sopa del día + jugo', menuTitle: 'También se antoja…', extrasTitle: 'Pokes y más', footer: 'Empaque kraft biodegradable · Hecho con cariño en Boku' };
export function cleanText(value = '') { return String(value).replace(/\\n/g, ' ').replace(/<[^>]*>/g, '').replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '').replace(/\s+/g, ' ').trim(); }
export function flyerName(product) { return cleanText(product.name).replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim(); }
export function shortDescription(product) {
  const parenthetical = cleanText(product.name).match(/\(([^)]+)\)/)?.[1];
  const text = parenthetical && !/especial del d[ií]a/i.test(parenthetical) ? parenthetical : cleanText(product.description || product.desc).split(/[.!;,]/)[0];
  if (text.length <= 49) return text;
  const brief = text.split(/ con /i)[0]; return brief.length <= 49 ? brief : '';
}
export function getFlyerCatalog(products) {
  const unique = new Map();
  for (const p of products) {
    if (!p.id || p.is_active === false || p.is_addon) continue;
    if (!unique.has(p.id) || p.categorySlug === 'boku-bentos') unique.set(p.id, p);
  }
  const all = [...unique.values()].map(p => ({ ...p, flyerName: flyerName(p), photo: p.image_url || p.image || '', basePrice: [p.original_price, p._supabase?.price, p.price].map(Number).find(n => n > 0) || 0, currentPrice: Number(p.price), shortDescription: shortDescription(p) }));
  const bentos = all.filter(p => p.categorySlug === 'boku-bentos');
  const pokes = all.filter(p => p.categorySlug === 'boku-bowls' && !/^arma tu /i.test(p.flyerName) && p.currentPrice > 0);
  return { eligible: bentos, otherCandidates: all, pokes, pokePrice: minimumPrice(pokes) };
}
export function minimumPrice(products) { const priced = products.filter(p => Number.isFinite(p.currentPrice) && p.currentPrice > 0); return priced.length ? Math.min(...priced.map(p => p.currentPrice)) : null; }
export function initialFlyerSelection(eligible, all = eligible, pokes = []) {
  const ordered = [...eligible].sort((a,b) => Number(Boolean(b.is_daily_special || b.is_bento_del_dia)) - Number(Boolean(a.is_daily_special || a.is_bento_del_dia)));
  const dailyIds = ordered.slice(0,2).map(p => p.id);
  const otherIds = ordered.slice(2).map(p => p.id);
  // Fill the first six gallery places with existing main dishes, without duplicating promos or bowls.
  for (const p of all) if (otherIds.length < 6 && /pastas|ramen/.test(p.categorySlug || '') && !dailyIds.includes(p.id) && !otherIds.includes(p.id)) otherIds.push(p.id);
  return { dailyIds, otherIds, extraIds: pokes.filter(p => !dailyIds.includes(p.id) && !otherIds.includes(p.id)).slice(0,3).map(p => p.id) };
}
export function getFlyerLayout(count, extraCount = 0, showIncludes = true, showFooter = true) {
  const columns = count <= 2 ? 2 : 3;
  const rows = Math.max(1, Math.ceil(count / columns));
  const extraColumns = extraCount <= 3 ? Math.max(1, extraCount) : 4;
  const extraRows = Math.max(1, Math.ceil(extraCount / extraColumns));
  const featuredHeight = count ? 326 : extraCount ? 650 : 1000;
  const extrasHeight = extraCount ? 36 + 8 + extraRows * 202 + (extraRows - 1) * 12 : 0;
  const sectionCount = 2 + Number(count > 0) + Number(extraCount > 0) + Number(showFooter);
  const gridHeight = 1350 - 56 - 62 - (36 + (showIncludes ? 28 : 0) + 8 + featuredHeight) - extrasHeight - (showFooter ? 36 : 0) - (sectionCount - 1) * 16 - (count ? 44 : 0);
  const rowHeight = (gridHeight - (rows - 1) * 12) / rows;
  return { columns, rows, featuredHeight, extraColumns, extraRows, extrasHeight, fits: (!count || rowHeight >= 190) && extrasHeight <= 500 };
}
export function validateSelection(catalog, dailyIds, otherIds, extraIds = []) {
  if (dailyIds.length !== 2 || new Set(dailyIds).size !== 2) return 'Selecciona exactamente dos Bentos del Día.';
  const available = new Set(catalog.otherCandidates.map(p => p.id));
  const dailyAvailable = new Set(catalog.eligible.map(p => p.id));
  const ids = [...dailyIds, ...otherIds, ...extraIds];
  if (dailyIds.some(id => !dailyAvailable.has(id)) || ids.some(id => !available.has(id))) return 'El catálogo cambió. Revisa los platos seleccionados.';
  if (new Set(ids).size !== ids.length) return 'Un plato no puede aparecer a la vez en dos secciones.';
  if (ids.some(id => !(catalog.otherCandidates.find(p => p.id === id)?.currentPrice > 0))) return 'Hay un plato sin precio vigente. Revisa el catálogo.';
  return '';
}
