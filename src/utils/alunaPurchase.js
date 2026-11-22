import { normalizeInventoryName, normalizePurchase } from '../../supabase/functions/_shared/alunaInventoryRules.js';
export function isPurchaseConversation(message, previous) {
  const text = normalizeInventoryName(message);
  return /\b(compre|compramos|compra|llegaron insumos|recibi|registrar.*inventario)\b/.test(text)
    || (previous?.operation === 'purchase' && (/recuper|retom|reintent|inventario general|sede|pague|costo|total|se llama/.test(text) || /^\$?\d/.test(text) || text === normalizeInventoryName(previous.data?.ingredient_name)
      || (Boolean(previous.missing) && !/\b(receta|precio|horario|oculta|reactiva|producto|ventas?|vendi|pedidos?|domicilio|mesas?|plan)\b/.test(text))));
}
export function parsePurchase(message) {
  const text = String(message || '');
  const match = text.match(/\b(un|una|\d+(?:[.,]\d+)?)\s*(kilogramos?|kilos?|kg|gramos?|g|mililitros?|ml|litros?|l|unidades?|und)\b\s*(?:de\s+)?(.+?)(?=\s+(?:por|a|costó|costo|me costó|en total)\s|[.;\n]|$)/i);
  const quantity = match || text.match(/\b(un|una|\d+(?:[.,]\d+)?)\s*(kilogramos?|kilos?|kg|gramos?|g|mililitros?|ml|litros?|l|unidades?|und)\b/i);
  const money = text.match(/(?:por|costó|costo|total|pagué)\s*[:=]?\s*\$?\s*(\d+(?:[.,]\d+)*)/i)?.[1];
  const unitMap = { kilogramo: 'kg', kilogramos: 'kg', kilo: 'kg', kilos: 'kg', kg: 'kg', gramo: 'g', gramos: 'g', g: 'g', mililitro: 'ml', mililitros: 'ml', ml: 'ml', litro: 'l', litros: 'l', l: 'l', unidad: 'und', unidades: 'und', und: 'und' };
  const amount = money ? Number(/^\d{1,3}(?:[.,]\d{3})+$/.test(money) ? money.replace(/[.,]/g, '') : money.replace(',', '.')) : null;
  return { ingredient_name: match?.[3]?.trim() || '', purchase_quantity: quantity ? (/^un[ao]?$/.test(quantity[1].toLowerCase()) ? 1 : Number(quantity[1].replace(',', '.'))) : null,
    purchase_unit: quantity ? unitMap[quantity[2].toLowerCase()] : null, total_cost: Number.isFinite(amount) && amount > 0 ? amount : null };
}
export function beginPurchaseTurn({ message, previous, capability, executorReady, ingredients = [], locations = [], inventory = [], selectedLocationId, scope, turnId }) {
  const prior = previous?.scope === scope && previous.operation === 'purchase' ? previous : null;
  const text = normalizeInventoryName(message);
  const parsed = parsePurchase(message);
  const differentPurchase = /otra compra|compra distinta/.test(text) || (parsed.ingredient_name && prior?.data?.ingredient_name && normalizeInventoryName(parsed.ingredient_name) !== normalizeInventoryName(prior.data.ingredient_name));
  const data = { ...(!differentPurchase ? prior?.data || {} : {}) };
  Object.entries(parsed).forEach(([key, value]) => { if (value !== null && value !== '') data[key] = value; });
  if (prior?.missing === 'cost' && /^\s*\$?\s*\d+(?:[.,]\d+)*\s*$/.test(message)) data.total_cost = parsePurchase(`Pagué ${message}`).total_cost;
  if (/(?:por|cost[oó]|total|pagu[eé])\s*[:=]?\s*\$?\s*(?:-\s*\d|0(?:[.,]0+)?(?:\D|$))/i.test(message)) data.total_cost = null;
  if (/-\s*\d+(?:[.,]\d+)?\s*(?:kg|kilos?|gramos?|g|ml|litros?|l|und|unidades?)\b/i.test(message)) data.purchase_quantity = null;
  const named = ingredients.filter((item) => normalizeInventoryName(item.name) === text.replace(/^(?:el insumo )?se llama /, '').replace(/[.]$/, ''));
  if (named.length === 1) data.ingredient_name = named[0].name;
  const same = prior && JSON.stringify(data) === JSON.stringify(prior.data) && !differentPurchase;
  const terminal = prior && !differentPurchase && ['executed', 'unconfirmed', 'dismissed'].includes(prior.status);
  const task = { scope, turnId, operation: 'purchase', product: null, data, capability, executorReady, idempotencyKey: same || terminal ? prior.idempotencyKey : crypto.randomUUID(), status: same || terminal ? prior.status : undefined, locations, ready: false };
  if (!capability.allowed || !executorReady || ['executed', 'unconfirmed', 'dismissed'].includes(task.status)) return task;
  const candidates = ingredients.filter((ingredient) => normalizeInventoryName(ingredient.name) === normalizeInventoryName(data.ingredient_name));
  task.ingredient = candidates.length === 1 ? candidates[0] : null;
  const matches = locations.filter((location) => text.includes(normalizeInventoryName(location.name)));
  task.global = /inventario general/.test(text) || (prior?.global && !matches.length);
  task.location = task.global || matches.length > 1 || (/\bsede\b/.test(text) && !matches.length) ? null : matches.length === 1 ? matches[0] : locations.find((location) => location.id === (prior?.location?.id || selectedLocationId)) || null;
  task.locationStock = task.location && task.ingredient ? inventory.find((row) => row.location_id === task.location.id && row.ingredient_id === task.ingredient.id) : null;
  const multiple = [...String(message).matchAll(/\b(?:un|una|\d+(?:[.,]\d+)?)\s*(?:kilogramos?|kilos?|kg|gramos?|g|mililitros?|ml|litros?|l|unidades?|und)\b/gi)].length > 1;
  task.multiple = multiple || (prior?.multiple && !parsed.ingredient_name);
  if (task.multiple) task.data = {}; // Keep the full request in chat, never assign a combined cost to the first ingredient.
  task.missing = task.multiple ? 'single' : !data.purchase_quantity || !data.purchase_unit ? 'quantity' : !data.total_cost ? 'cost' : !task.ingredient ? 'ingredient' : !task.location && !task.global ? 'location' : task.location && !task.locationStock ? 'link' : null;
  if (!task.missing) {
    try { task.normalized = normalizePurchase(data, task.ingredient); task.ready = true; }
    catch { task.missing = 'unit'; }
  }
  return task;
}
export function purchaseSummary(task) {
  const { data } = task;
  return `Insumo: ${data.ingredient_name || 'pendiente'}. Cantidad: ${data.purchase_quantity ?? 'pendiente'} ${data.purchase_unit || ''}. Total: ${data.total_cost ? `$${data.total_cost.toLocaleString('es-CO')}` : 'pendiente'}.`;
}
export function purchaseConversationReply(task) {
  const note = purchaseSummary(task);
  if (task.capability.reason === 'permission') return { reply: `${note}\nTu usuario no tiene permisos para registrar esta compra. Conservé la nota sin guardar movimientos; puedes compartir este resumen con el responsable del inventario.`, card: null };
  if (!task.capability.allowed) return { reply: `${note}\nTu plan ${task.capability.label} ${task.capability.reason === 'unknown' ? 'todavía no se pudo comprobar' : 'no permite registrar esta compra en inventario'}. Conservé tu nota sin guardar movimientos. Puedes copiar este resumen a tu registro externo o revisar las opciones de tu plan en «Mi Plan / Upgrade». No cambié tu suscripción.`, card: null };
  if (!task.executorReady) return { reply: `${note}\nTu plan ${task.capability.label} incluye inventario, pero el registro de compras no está disponible en este momento. Conservé la nota; no la registré ni puedo ofrecer aprobarla todavía. Puedes usar este resumen en tu registro externo y retomar la compra cuando el servicio esté disponible.`, card: null };
  if (task.status === 'executed') return { reply: `${note}\nEsta compra ya se registró. No volveré a sumarla. Si se trata de otra compra distinta, indícamelo.`, card: null };
  if (['unconfirmed', 'dismissed'].includes(task.status)) return { reply: `${note}\nLa propuesta anterior no se puede volver a aprobar. Revisa el resultado de esa compra antes de iniciar otra; no sumaré el stock a ciegas.`, card: null };
  if (!task.ready) {
    const question = { single: 'Revisemos un insumo a la vez. ¿Cuál compraste, en qué cantidad y cuánto pagaste por ese insumo?', quantity: '¿Qué cantidad compraste y en qué unidad?', cost: '¿Cuánto pagaste en total?', ingredient: '¿Cómo se llama ese insumo en tu inventario? No crearé uno nuevo ni elegiré otro parecido sin confirmarlo.', location: `¿En qué sede recibiste la compra: ${task.locations.map((item) => item.name).join(', ')}? Si no corresponde a una sede, indica «inventario general».`, link: 'Este insumo no tiene inventario vinculado a esa sede. Necesito que exista ese vínculo antes de registrar la compra.', unit: 'La unidad de compra no coincide con la unidad del insumo. ¿Qué cantidad equivale en la unidad que usas en tu inventario?' }[task.missing];
    return { reply: `${note}\n${question} No he guardado movimientos.`, card: null };
  }
  const before = Number(task.ingredient.stock_current || 0);
  const unit = task.ingredient.usage_unit;
  const changes = [{ label: 'Compra', before: 'Sin registrar', after: note }, { label: 'Stock general', before: `${before} ${unit}`, after: `${before + task.normalized.added} ${unit}` }];
  if (task.locationStock) changes.push({ label: `Stock en ${task.location.name}`, before: `${task.locationStock.stock_quantity} ${unit}`, after: `${Number(task.locationStock.stock_quantity) + task.normalized.added} ${unit}` });
  return { reply: 'Revisa la compra y el stock antes de aprobar. Todavía no he guardado nada.', card: { type: 'proposal', title: `Registrar compra de ${task.ingredient.name}`, summary: `Plan ${task.capability.label}. Alcance: ${task.location?.name || 'inventario general'}. Cantidad y costo confirmados por ti.`, beforeAfter: changes,
    action: 'register_inventory_purchase', approveLabel: 'Aprobar compra de insumo', riskLevel: 'medium', purchaseTask: { ...task }, turnId: task.turnId, binding: { scope: task.scope, operation: 'purchase', productId: null } } };
}
export function buildPurchaseBody(task, brandId) {
  if (!task.ready || !task.capability.allowed || !task.executorReady || task.status || !task.ingredient?.id) throw new Error('La compra no se puede aprobar.');
  return { brand_id: brandId, location_id: task.location?.id || null, action: 'batch_stock_entry', approved: true, idempotency_key: task.idempotencyKey,
    proposal: { entries: [{ ingredient_id: task.ingredient.id, purchase_quantity: task.data.purchase_quantity, purchase_unit: task.data.purchase_unit, total_cost: task.data.total_cost, expected_stock: Number(task.ingredient.stock_current || 0), expected_location_stock: task.locationStock ? Number(task.locationStock.stock_quantity) : null }] } };
}
