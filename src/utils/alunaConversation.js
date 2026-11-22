import { getRequestedPrice } from './alunaPriceUpdate.js';

// Operational context belongs to the application, never to an LLM's memory.
const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const CREATE = /\b(crea|crear|agrega|agregar|nuevo producto|nueva bebida|nuevo plato)\b/;
const RECIPE = /\b(receta|ingredientes)\b/;
const RECOVER = /\b(recuper\w*|retom\w*)\b|\b(continu|seguir|volver).*(trabajo|anterior|receta|donde|antes)|\b(intenta de nuevo|reintentar)\b/;

export function resolveConversationProduct(message, products) {
  // Ingredients can name other menu items. Resolve the subject before the list.
  const subject = normalize(String(message).split(/\b(?:lleva|ingredientes|contiene)\b/i)[0]);
  const exact = products.filter((product) => subject.includes(normalize(product.name)));
  if (exact.length) return exact;
  const target = subject.match(/(?:receta (?:de|para)|precio (?:de|del)|mi)\s+(?:mi |el |la |del )?(.+)/)?.[1] || subject;
  const words = target.split(' ').filter((word) => word.length > 2 && !['quiero', 'preparar', 'consultar', 'consulta', 'muestrame', 'producto', 'receta', 'del', 'para', 'una', 'con', 'precio'].includes(word));
  return products.filter((product) => words.some((word) => normalize(product.name).split(' ').includes(word)));
}

export function extractRecipeQuantities(message) {
  const units = { gramo: 'g', gramos: 'g', g: 'g', kilogramo: 'kg', kilogramos: 'kg', kg: 'kg', mililitro: 'ml', mililitros: 'ml', ml: 'ml', litro: 'l', litros: 'l', l: 'l', unidad: 'und', unidades: 'und', und: 'und' };
  return [...String(message).matchAll(/(\d+(?:[.,]\d+)?)\s*(kilogramos?|kg|gramos?|g|mililitros?|ml|litros?|l|unidades?|und)\b\s+(?:de\s+)?(.+?)(?=\s+y\s+\d|[,.;\n]|$)/gi)].map((match) => ({
    name: match[3].trim(), recipe_quantity: Number(match[1].replace(',', '.')), usage_unit: units[match[2].toLowerCase()],
    // Unknown is not zero, and a model estimate is not a purchase price.
    purchase_price: '', purchase_quantity: '', purchase_unit: units[match[2].toLowerCase()],
  })).filter((ingredient) => ingredient.name && Number.isFinite(ingredient.recipe_quantity) && ingredient.recipe_quantity > 0);
}

export function beginConversationTurn({ message, previous, products, scope, turnId }) {
  const prior = previous?.scope === scope ? previous : null;
  const text = normalize(message);
  if (RECOVER.test(text)) {
    return prior ? { ...prior, turnId, recovering: true } : { scope, turnId, operation: 'clarify', reply: 'No tengo un trabajo pendiente en esta conversación. ¿Qué necesitas preparar?' };
  }
  const ingredients = extractRecipeQuantities(message);
  const ingredientContinuation = prior?.operation === 'recipe' && !prior.needsProduct && ingredients.length > 0 && !RECIPE.test(text) && !/\b(?:receta de|receta para|mi producto)\b/.test(text);
  let candidates = ingredientContinuation ? [] : resolveConversationProduct(message, products);
  const ordinal = text.match(/^(?:el|la) (primero|primera|segundo|segunda)$/)?.[1];
  if (prior?.needsProduct && ordinal) candidates = [prior.candidates?.[/primer/.test(ordinal) ? 0 : 1]].filter(Boolean);
  const recipe = RECIPE.test(text) || (prior?.operation === 'recipe' && !/\b(precio|crear|crea|horario|domicilio)\b/.test(text) && (ingredients.length > 0 || prior.needsProduct || /\b(cost|cuest|revis|no se|no lo se|todavia|guardar)\w*/.test(text) || /^(si|no|ok|vale|listo|de acuerdo)$/.test(text)));
  const continuingCreation = prior?.operation === 'create' && !candidates.length && !/\b(como|cuanto|donde|consulta|horario|compra|audita|ayuda)\b/.test(text);
  const operation = recipe ? 'recipe' : /\bprecio\b/.test(text) || (prior?.operation === 'price' && getRequestedPrice(message) !== null) ? 'price' : CREATE.test(text) || continuingCreation ? 'create' : candidates.length ? 'lookup' : 'other';
  const continuing = prior?.operation === operation && candidates.length === 0 && !/\b(?:mi|del|de mi)\b/.test(text);
  const product = candidates.length === 1 ? candidates[0] : continuing ? prior.product : null;
  const sameProduct = product?.id && product.id === prior?.product?.id;
  const previousIngredients = recipe && (sameProduct || prior?.needsProduct) ? prior?.ingredients || [] : [];
  const retainedIngredients = ingredients.length && ingredientContinuation
    ? [...new Map([...previousIngredients, ...ingredients].map((ingredient) => [normalize(ingredient.name), ingredient])).values()]
    : ingredients.length ? ingredients : previousIngredients;
  return {
    scope, turnId, operation, product, candidates, needsProduct: (recipe && !product) || candidates.length > 1,
    ingredients: retainedIngredients,
    sourceMessage: message, recovering: false,
    // Only explicit continuation of the same operation/entity may carry a draft.
    draft: continuing || (sameProduct && prior?.operation === operation) ? prior?.draft || {} : {},
  };
}

export function conversationDraft(task) {
  if (task.operation === 'recipe') return {
    existing_product: task.product || undefined,
    product_name: task.product?.name || '',
    recipe_draft: { ingredients: task.ingredients },
  };
  return { ...task.draft, ...(task.product ? { existing_product: task.product } : {}) };
}

export function recipeConversationReply(task, { failed = false } = {}) {
  if (task.operation === 'clarify') return { reply: task.reply, card: null };
  if (task.operation !== 'recipe') return null;
  const prefix = failed ? 'No pude completar la respuesta, pero conservé lo que me contaste. ' : task.recovering ? 'Retomemos tu receta. ' : '';
  if (!task.product) {
    const options = task.candidates?.length ? ` Encontré: ${task.candidates.map((product) => product.name).join(', ')}.` : '';
    return { reply: `${prefix}Conservé las cantidades que me diste.${options} ¿Para qué producto es la receta? Dime su nombre como aparece en tu carta. No he guardado ni creado ningún producto.`, card: null };
  }
  const quantities = task.ingredients.map((ingredient) => `${ingredient.recipe_quantity} ${ingredient.usage_unit} de ${ingredient.name}`);
  const reply = `${prefix}Estamos preparando la receta de ${task.product.name}, que ya existe en tu carta. ${quantities.length ? `Conservé: ${quantities.join(' y ')}.` : '¿Qué ingredientes lleva y qué cantidad usas de cada uno?'} Los costos siguen pendientes; no los voy a suponer. ${quantities.length ? 'Cuando los tengas, dime cuánto pagas y qué cantidad compras de cada ingrediente. Si aún no lo sabes, podemos retomar este borrador después.' : ''} Todavía no he guardado cambios. Antes de guardar la receta te mostraré los datos para que los revises y apruebes; no crearé otro producto.`;
  return { reply, card: quantities.length ? { type: 'guidance', plainLanguage: true, title: `Borrador de receta: ${task.product.name}`, steps: [...quantities, 'Costos de compra pendientes. Sin cambios guardados.'], tip: 'Este borrador se conserva mientras mantengas esta conversación abierta.' } : null };
}

export function validateConversationResponse(task, response) {
  if (!response || typeof response !== 'object') return false;
  if (['update_business_hours', 'batch_stock_entry'].includes(response.intent)) return false; // Only verified local flows can propose these operations.
  if (task.operation === 'recipe') return false; // Render the verified local recipe, not model actions.
  if (response.matched_product?.id && task.product?.id !== response.matched_product.id) return false;
  // H04's deterministic price proposal takes precedence over a misclassified intent.
  if (task.operation === 'price' && task.product && getRequestedPrice(task.sourceMessage) !== null) return true;
  if (['lookup', 'price'].includes(task.operation) && response.intent !== 'general') return false;
  if (task.operation === 'create' && !['general', 'create_catalog', 'create_costed_product'].includes(response.intent)) return false;
  if (['create_catalog', 'create_costed_product'].includes(response.intent)) {
    if (task.operation !== 'create') return false;
    const proposedName = normalize(response.catalog_draft?.product_name);
    if (proposedName && !normalize(task.sourceMessage).includes(proposedName) && proposedName !== normalize(task.draft?.product_name)) return false;
  }
  return true;
}

export function invalidateConversationProposals(messages, reason = 'replaced') {
  return messages.map((message) => message.card?.type === 'proposal' ? { ...message, card: { ...message.card, obsolete: true, obsoleteReason: message.card.obsoleteReason || reason } } : message);
}

export function canApproveConversationCard(card, activeTurnId, task) {
  if (!card || !activeTurnId || !card.turnId || card.obsolete || card.turnId !== activeTurnId) return false;
  if (task && ['executed', 'dismissed', 'unconfirmed'].includes(task.status)) return false;
  if (task && (card.binding?.scope !== task.scope || card.binding?.operation !== task.operation || card.binding?.productId !== (task.product?.id || null))) return false;
  return true;
}
