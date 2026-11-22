import { resolveConversationProduct } from './alunaConversation.js';
const normalize = (text) => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const isOtherOperation = (text) => /\b(horarios?|recetas?|ingredientes?|pagos?|impresion|domicilios?|propina|whatsapp|mesas?)\b/.test(text) && !/\b(producto|menu|plato|bebida)\b/.test(text);
export function visibilityIntent(message) {
  const text = normalize(message);
  if (isOtherOperation(text)) return null;
  if (/\bno\s+(?:lo\s+)?(?:ocult|desactiv|reactiv|activ|muestr|vuelv)/.test(text)) return null;
  if (/\b(oculta\w*|esconde\w*|desactiva\w*)\b|\bquita\w*.*\bmenu\b/.test(text)) return false;
  if (/\b(reactiva\w*|activa\w*|muestralo|mostrarlo)\b|(?:vuelve|volver).*mostrar|(?:hazlo|hacerlo) visible|vuelva a aparecer/.test(text)) return true;
  return null;
}
export function isVisibilityConversation(message, previous) {
  if (isOtherOperation(normalize(message))) return false;
  if (visibilityIntent(message) !== null) return true;
  return previous?.operation === 'visibility' && !/\b(receta|precio|horario|consulta|crear|compra)\w*/.test(normalize(message));
}
export function beginVisibilityTurn({ message, previous, products, locations, statuses, selectedLocationId, scope, turnId }) {
  const prior = previous?.scope === scope && previous.operation === 'visibility' ? previous : null;
  const text = normalize(message);
  const intent = visibilityIntent(message);
  if (/\bno\s+(?:lo\s+)?(?:ocult|desactiv|reactiv|activ|muestr|vuelv)/.test(text)) return { scope, turnId, operation: 'visibility', product: null, candidates: [], locations, missing: ['intent'], ready: false };
  const candidates = resolveConversationProduct(message, products);
  const mayContinue = intent === null || /ocultalo|reactivalo|activalo|escondelo|desactivalo|\b(lo|mismo|otra vez)\b/.test(text);
  const product = candidates.length === 1 ? candidates[0] : !candidates.length && mayContinue ? products.find((item) => item.id === prior?.product?.id) : null;
  const target = intent !== null ? intent : prior?.target;
  const all = /todas las sedes|todo el negocio|catalogo completo/.test(text);
  const matches = locations.filter((item) => text.includes(normalize(item.name)));
  const unknownLocation = /\bsede\s+(?!actual\b|seleccionada\b)/.test(text) && !matches.length && !all;
  const location = all ? null : matches.length === 1 ? matches[0] : matches.length > 1 || unknownLocation ? null : prior?.location || locations.find((item) => item.id === selectedLocationId) || null;
  const global = all || (!matches.length && !unknownLocation && prior?.global === true);
  const status = product && location ? statuses.find((item) => item.product_id === product.id && item.location_id === location.id) : null;
  const missing = [];
  if (!product) missing.push('product');
  if (typeof target !== 'boolean') missing.push('intent');
  if (!global && !location) missing.push('scope');
  if (product && location && !status) missing.push('link');
  if (target === true && product?.is_active === false && !global) missing.push('globalInactive');
  const before = global ? product?.is_active : status?.is_active;
  const recoveringExecuted = /\b(recuper|retom)\w*/.test(text) && ['executed', 'dismissed', 'unconfirmed'].includes(prior?.status);
  return { scope, turnId, operation: 'visibility', product, candidates, target, global, location, status, locations, before, missing,
    ready: !missing.length && before !== target && !recoveringExecuted,
    completed: recoveringExecuted, unchanged: !missing.length && before === target, idempotencyKey: crypto.randomUUID() };
}
export function visibilityConversationReply(task) {
  if (task.completed) return { reply: 'Esa propuesta ya terminó o dejó de estar disponible. Dime qué producto y sede necesitas revisar para preparar una nueva.', card: null };
  if (task.missing.length) {
    const reason = task.missing[0];
    const reply = reason === 'product' ? `¿Qué producto quieres ocultar o volver a mostrar?${task.candidates.length ? ` Encontré: ${task.candidates.map((item) => item.name).join(', ')}.` : ''}`
      : reason === 'intent' ? '¿Quieres ocultarlo o volver a mostrarlo?'
      : reason === 'scope' ? `Conservé el cambio para ${task.product.name}. ¿En qué sede lo aplico: ${task.locations.map((item) => item.name).join(', ')}? También puedes decir «todas las sedes».`
      : reason === 'globalInactive' ? `${task.product.name} está desactivado en todo el negocio. No puedo reactivarlo únicamente en esta sede. Si quieres cambiar su estado general, dime «reactívalo en todas las sedes»; después te mostraré la propuesta.`
      : 'Este producto no tiene una configuración de visibilidad vinculada a esa sede. No crearé una asociación nueva al ocultarlo o reactivarlo.';
    return { reply: `${reply} No he guardado cambios.`, card: null };
  }
  const place = task.global ? 'Todas las sedes del negocio' : task.location.name;
  if (task.unchanged) return { reply: `${task.product.name} ya está ${task.target ? 'activo' : 'oculto'} en ${place}. No he hecho cambios.`, card: null };
  return { reply: `Revisa qué cambiará para ${task.product.name}. Se aplicará únicamente si pulsas «${task.target ? 'Aprobar reactivación' : 'Aprobar ocultar producto'}».`, card: {
    type: 'proposal', title: `${task.target ? 'Reactivar' : 'Ocultar'} ${task.product.name}`, summary: `Alcance: ${place}. Los demás productos conservarán su estado.${task.target ? ' Volverá a aparecer cuando su categoría, sede y disponibilidad lo permitan.' : ' No aparecerá en la carta de este alcance ni estará disponible para añadir desde Boki.'}`,
    beforeAfter: [{ label: 'Producto', before: task.product.name, after: task.product.name }, { label: 'Sede', before: place, after: place }, { label: 'Estado', before: task.before ? 'Activo' : 'Oculto', after: task.target ? 'Activo' : 'Oculto' }],
    action: 'change_product_visibility', riskLevel: 'medium', approveLabel: task.target ? 'Aprobar reactivación' : 'Aprobar ocultar producto', visibilityTask: { ...task },
    approvalNote: task.global ? undefined : 'La visibilidad se guardará únicamente en la sede indicada.',
    turnId: task.turnId, binding: { scope: task.scope, operation: 'visibility', productId: task.product.id },
  } };
}
export function assertVisibilityTask(task) {
  if (!task?.ready || task.missing.length || !task.product?.id || typeof task.target !== 'boolean' || task.before === task.target || (!task.global && (!task.location?.id || !task.status?.id))) throw new Error('La propuesta de visibilidad está incompleta o ya no está vigente.');
}
export function buildLocationVisibilityUpdate(task, updatedAt) {
  assertVisibilityTask(task);
  if (task.global || task.status.product_id !== task.product.id || task.status.location_id !== task.location.id) throw new Error('El vínculo de la sede no corresponde al producto.');
  return { changes: { is_active: task.target, updated_at: updatedAt }, id: task.status.id, location_id: task.location.id, product_id: task.product.id, before: task.before, updated_at: task.status.updated_at };
}
export function buildGlobalVisibilityBody(task, brandId) {
  assertVisibilityTask(task);
  if (!task.global) throw new Error('Se requiere una propuesta para todas las sedes.');
  return { brand_id: brandId, action: 'update_product', approved: true, idempotency_key: task.idempotencyKey,
    proposal: { entity_id: task.product.id, changes: { is_active: task.target }, expected_updated_at: task.product.updated_at } };
}
export function isOrderableVisibility(product, status) {
  return Boolean(product && product.is_active === true && product.stock_status !== 'out' && status?.is_active !== false && status?.stock_status !== 'out');
}
export function getVisibilityLocationId(activeLocationId, currentLocationId, isAdmin) {
  return activeLocationId && activeLocationId !== 'all' ? activeLocationId : isAdmin ? null : currentLocationId || null;
}
