// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_ROLES = new Set(['owner', 'admin', 'manager', 'encargado', 'superadmin']);
const MAX_INGREDIENTS = 50;
const MAX_MONEY = 1_000_000_000;
const MAX_QUANTITY = 1_000_000;

type JsonObject = Record<string, unknown>;

class HttpError extends Error {
  status: number;
  details?: JsonObject;

  constructor(status: number, message: string, details?: JsonObject) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const jsonResponse = (body: JsonObject, status = 200) => new Response(
  JSON.stringify(body),
  { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
);

const cleanText = (value: unknown, maxLength: number) =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

const finitePositive = (value: unknown, max: number) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 && number <= max ? number : null;
};

const finiteNonNegative = (value: unknown, max: number) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= max ? number : null;
};

const normalizeName = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('es')
  .replace(/\s+/g, ' ')
  .trim();

const slugify = (value: string) => normalizeName(value)
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .slice(0, 60) || 'categoria';

const nearlyEqual = (left: number, right: number) => {
  const scale = Math.max(1, Math.abs(left), Math.abs(right));
  return Math.abs(left - right) <= scale * 0.0001;
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  let admin: ReturnType<typeof createClient> | null = null;
  let changeSetId: string | null = null;
  let actorId: string | null = null;
  let brandId: string | null = null;
  let locationId: string | null = null;
  const created = {
    productId: null as string | null,
    recipeId: null as string | null,
    ingredientIds: [] as string[],
    categoryId: null as string | null,
    linkRows: [] as Array<{ table: string; id: string }>,
    reactivatedCategoryLinkIds: [] as string[],
  };

  try {
    const authorization = req.headers.get('Authorization');
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new HttpError(401, 'Authentication required');

    const body = await req.json();
    brandId = cleanText(body.brand_id, 36);
    locationId = body.location_id == null || body.location_id === 'all'
      ? null
      : cleanText(body.location_id, 36);

    if (!UUID_PATTERN.test(brandId) || (locationId && !UUID_PATTERN.test(locationId))) {
      throw new HttpError(400, 'Invalid brand or location');
    }
    if (body.action !== 'create_costed_product' || body.approved !== true) {
      throw new HttpError(400, 'Invalid or unapproved action');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !anonKey || !serviceKey) throw new Error('Supabase environment is incomplete');

    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await caller.auth.getUser(token);
    if (userError || !userData.user) throw new HttpError(401, 'Invalid session');
    actorId = userData.user.id;

    const [{ data: brand, error: brandError }, { data: profile, error: profileError }] = await Promise.all([
      admin.from('brands').select('id,name,owner_id').eq('id', brandId).maybeSingle(),
      admin.from('profiles').select('id,brand_id,role').eq('id', actorId).maybeSingle(),
    ]);
    if (brandError || profileError) throw brandError || profileError;
    if (!brand) throw new HttpError(404, 'Brand not found');
    const canManage = brand.owner_id === actorId
      || profile?.role === 'superadmin'
      || (profile?.brand_id === brandId && ALLOWED_ROLES.has(profile?.role));
    if (!canManage) throw new HttpError(403, 'Forbidden for this brand');

    const proposal = body.proposal && typeof body.proposal === 'object' ? body.proposal : {};
    const categoryName = cleanText(proposal.category_name, 100);
    const productInput = proposal.product && typeof proposal.product === 'object' ? proposal.product : {};
    const recipeInput = proposal.recipe && typeof proposal.recipe === 'object' ? proposal.recipe : {};
    const productName = cleanText(productInput.name, 120);
    const productDescription = cleanText(productInput.description, 800);
    const productPrice = finitePositive(productInput.price, MAX_MONEY);
    const productTags = Array.isArray(productInput.tags)
      ? [...new Set(productInput.tags
        .filter((tag: unknown) => typeof tag === 'string')
        .map((tag: string) => tag.trim().slice(0, 40))
        .filter(Boolean))].slice(0, 15)
      : [];
    const recipeName = cleanText(recipeInput.name, 120);
    const yieldQuantity = finitePositive(recipeInput.yield_quantity, MAX_QUANTITY);
    const yieldUnit = cleanText(recipeInput.yield_unit, 40);
    const servings = finitePositive(recipeInput.servings, 10_000);
    const rawIngredients = Array.isArray(proposal.ingredients)
      ? proposal.ingredients.slice(0, MAX_INGREDIENTS)
      : [];

    if (!categoryName || !productName || !productDescription || productPrice == null) {
      throw new HttpError(400, 'Complete category and product data are required');
    }
    if (!recipeName || yieldQuantity == null || !yieldUnit || servings == null || !Number.isInteger(servings)) {
      throw new HttpError(400, 'Recipe yield and an integer serving count are required');
    }
    if (rawIngredients.length === 0 || rawIngredients.length > MAX_INGREDIENTS) {
      throw new HttpError(400, `Between 1 and ${MAX_INGREDIENTS} ingredients are required`);
    }

    const ingredientsInput = rawIngredients.map((raw: JsonObject, index: number) => {
      const name = cleanText(raw?.name, 120);
      const purchasePrice = finitePositive(raw?.purchase_price, MAX_MONEY);
      const purchaseQuantity = finitePositive(raw?.purchase_quantity, MAX_QUANTITY);
      const purchaseUnit = cleanText(raw?.purchase_unit, 40);
      const usageUnit = cleanText(raw?.usage_unit, 40);
      const recipeQuantity = finitePositive(raw?.recipe_quantity, MAX_QUANTITY);
      if (!name || purchasePrice == null || purchaseQuantity == null || !purchaseUnit || !usageUnit || recipeQuantity == null) {
        throw new HttpError(400, `Ingredient ${index + 1} has incomplete cost, unit, or recipe data`);
      }
      return {
        name,
        normalizedName: normalizeName(name),
        description: cleanText(raw?.description, 500) || null,
        purchasePrice,
        purchaseQuantity,
        purchaseUnit,
        usageUnit,
        recipeQuantity,
        unitCost: purchasePrice / purchaseQuantity,
        perServingQuantity: recipeQuantity / servings,
        stockCurrent: finiteNonNegative(raw?.stock_current, MAX_QUANTITY) ?? 0,
        stockMin: finiteNonNegative(raw?.stock_min, MAX_QUANTITY) ?? 0,
      };
    });
    if (new Set(ingredientsInput.map((item) => item.normalizedName)).size !== ingredientsInput.length) {
      throw new HttpError(400, 'The proposal contains duplicate ingredient names');
    }

    let locationsQuery = admin.from('locations').select('id,name').eq('brand_id', brandId).eq('is_active', true);
    if (locationId) locationsQuery = locationsQuery.eq('id', locationId);
    const { data: targetLocations, error: locationsError } = await locationsQuery;
    if (locationsError) throw locationsError;
    if (!targetLocations?.length) {
      throw new HttpError(409, locationId ? 'The selected location is inactive or belongs to another brand' : 'At least one active location is required');
    }

    const [{ data: brandCategories, error: categoriesError }, { data: brandIngredients, error: ingredientsError }] = await Promise.all([
      admin.from('categories').select('id,name,slug,is_active').eq('brand_id', brandId),
      admin.from('ingredients').select('id,name,purchase_price,purchase_quantity,purchase_unit,usage_unit,unit_cost,is_active').eq('brand_id', brandId),
    ]);
    if (categoriesError || ingredientsError) throw categoriesError || ingredientsError;

    const matchingCategories = (brandCategories || []).filter((category) => normalizeName(category.name || '') === normalizeName(categoryName));
    if (matchingCategories.length > 1) {
      throw new HttpError(409, 'There is more than one matching category; consolidate duplicates before continuing', {
        category_ids: matchingCategories.map((category) => category.id),
      });
    }
    const existingCategory = matchingCategories[0] || null;
    if (existingCategory && !existingCategory.is_active) {
      throw new HttpError(409, `Category ${categoryName} exists but is inactive; restore it before reuse`);
    }

    const resolvedIngredients = ingredientsInput.map((input) => {
      const matches = (brandIngredients || []).filter((ingredient) => normalizeName(ingredient.name || '') === input.normalizedName);
      if (matches.length > 1) {
        throw new HttpError(409, `There is more than one ingredient named ${input.name}; consolidate duplicates first`, {
          ingredient_ids: matches.map((ingredient) => ingredient.id),
        });
      }
      const existing = matches[0] || null;
      if (!existing) return { input, existing: null };
      const existingUnitCost = Number(existing.unit_cost);
      if (!existing.is_active) throw new HttpError(409, `Ingredient ${input.name} exists but is inactive`);
      if (normalizeName(existing.usage_unit || '') !== normalizeName(input.usageUnit)) {
        throw new HttpError(409, `Ingredient ${input.name} uses ${existing.usage_unit || 'an undefined unit'}, not ${input.usageUnit}`);
      }
      if (!Number.isFinite(existingUnitCost) || existingUnitCost <= 0) {
        throw new HttpError(409, `Ingredient ${input.name} exists without a valid unit cost; update it before reuse`);
      }
      if (!nearlyEqual(existingUnitCost, input.unitCost)) {
        throw new HttpError(409, `The approved cost for ${input.name} does not match its current catalog cost`, {
          current_unit_cost: existingUnitCost,
          proposed_unit_cost: input.unitCost,
        });
      }
      return { input, existing };
    });

    const totalCost = resolvedIngredients.reduce(
      (sum, item) => sum + item.input.perServingQuantity * item.input.unitCost,
      0,
    );
    const packagingFee = finiteNonNegative(productInput.packaging_fee, MAX_MONEY) ?? 0;
    const fullCost = totalCost + packagingFee;
    const margin = productPrice > 0 ? ((productPrice - fullCost) / productPrice) * 100 : 0;
    if (!Number.isFinite(totalCost) || totalCost <= 0) throw new HttpError(400, 'The calculated recipe cost must be positive');

    const approvedAt = new Date().toISOString();
    const approvalSnapshot = {
      approved: true,
      approved_at: approvedAt,
      category_name: categoryName,
      category_reused: Boolean(existingCategory),
      product: {
        name: productName,
        description: productDescription,
        price: productPrice,
        tags: productTags,
        requires_kitchen: productInput.requires_kitchen !== false,
        packaging_fee: packagingFee,
      },
      recipe: {
        name: recipeName,
        description: cleanText(recipeInput.description, 800) || null,
        yield_quantity: yieldQuantity,
        yield_unit: yieldUnit,
        servings,
        cost_per_serving: totalCost,
      },
      ingredients: resolvedIngredients.map(({ input, existing }) => ({
        name: input.name,
        existing_ingredient_id: existing?.id || null,
        purchase_price: input.purchasePrice,
        purchase_quantity: input.purchaseQuantity,
        purchase_unit: input.purchaseUnit,
        usage_unit: input.usageUnit,
        recipe_quantity: input.recipeQuantity,
        quantity_per_serving: input.perServingQuantity,
        unit_cost: input.unitCost,
        cost_per_serving: input.perServingQuantity * input.unitCost,
      })),
      target_location_ids: targetLocations.map((location) => location.id),
      totals: { recipe_cost_per_serving: totalCost, packaging_fee: packagingFee, product_cost: fullCost, margin },
    };

    const proposedActions = [
      { tool: existingCategory ? 'reuse_category' : 'create_category', data: { name: categoryName, existing_id: existingCategory?.id || null } },
      ...resolvedIngredients.map(({ input, existing }) => ({
        tool: existing ? 'reuse_ingredient' : 'create_ingredient',
        data: { name: input.name, existing_id: existing?.id || null, unit_cost: input.unitCost },
      })),
      { tool: 'create_recipe', data: { name: recipeName, total_cost: totalCost, servings } },
      { tool: 'create_product', data: { name: productName, price: productPrice, cost: fullCost, margin } },
    ];

    const { data: changeSet, error: changeSetError } = await admin.from('agent_change_sets').insert({
      brand_id: brandId,
      location_id: locationId,
      created_by: actorId,
      approved_by: actorId,
      approved_at: approvedAt,
      title: `Crear ${productName} con receta y costo real`,
      summary: `Aluna configurará ingredientes, receta, costo por porción y producto para ${brand.name}.`,
      status: 'executing',
      risk_level: 'medium',
      proposed_actions: proposedActions,
      approval_snapshot: approvalSnapshot,
    }).select('id').single();
    if (changeSetError) throw changeSetError;
    changeSetId = changeSet.id;

    const actionSpecs = proposedActions.map((action, index) => ({
      change_set_id: changeSet.id,
      brand_id: brandId,
      location_id: locationId,
      sequence: index + 1,
      tool_name: action.tool,
      entity_type: index === 0 ? 'category' : index <= resolvedIngredients.length ? 'ingredient' : index === resolvedIngredients.length + 1 ? 'recipe' : 'product',
      operation: action.tool.startsWith('reuse_') ? 'update' : 'create',
      status: 'executing',
      proposed_data: action.data,
    }));
    const { data: actionRows, error: actionsError } = await admin.from('agent_actions').insert(actionSpecs).select('id,sequence,tool_name');
    if (actionsError) throw actionsError;
    const actionBySequence = new Map((actionRows || []).map((action) => [action.sequence, action]));

    const { error: approvedAuditError } = await admin.from('agent_audit_log').insert([
      { brand_id: brandId, location_id: locationId, change_set_id: changeSet.id, actor_id: actorId, event_type: 'approved', event_data: approvalSnapshot },
      { brand_id: brandId, location_id: locationId, change_set_id: changeSet.id, actor_id: actorId, event_type: 'execution_started', event_data: { action_count: proposedActions.length } },
    ]);
    if (approvedAuditError) throw approvedAuditError;

    let category = existingCategory;
    if (!category) {
      const categoryPayload = {
        brand_id: brandId,
        name: categoryName,
        slug: `${slugify(categoryName)}-${crypto.randomUUID().slice(0, 8)}`,
        icon: '🍽️',
        is_active: true,
      };
      const { data, error } = await admin.from('categories').insert(categoryPayload).select('id,name,slug,is_active').single();
      if (error) throw error;
      category = data;
      created.categoryId = data.id;
    }

    const ingredientRecords = [];
    for (const { input, existing } of resolvedIngredients) {
      if (existing) {
        ingredientRecords.push(existing);
        continue;
      }
      const { data, error } = await admin.from('ingredients').insert({
        brand_id: brandId,
        name: input.name,
        description: input.description,
        purchase_price: input.purchasePrice,
        purchase_quantity: input.purchaseQuantity,
        purchase_unit: input.purchaseUnit,
        usage_unit: input.usageUnit,
        unit_cost: input.unitCost,
        stock_current: input.stockCurrent,
        stock_min: input.stockMin,
        is_active: true,
        is_modifier: false,
        selling_price: 0,
      }).select('id,name,purchase_price,purchase_quantity,purchase_unit,usage_unit,unit_cost,is_active').single();
      if (error) throw error;
      ingredientRecords.push(data);
      created.ingredientIds.push(data.id);
    }

    const recipeDescription = cleanText(recipeInput.description, 800) || productDescription;
    const { data: recipe, error: recipeError } = await admin.from('recipes').insert({
      brand_id: brandId,
      name: recipeName,
      description: recipeDescription,
      total_cost: totalCost,
      target_price: productPrice,
    }).select('id,name,description,total_cost,target_price').single();
    if (recipeError) throw recipeError;
    created.recipeId = recipe.id;

    const recipeIngredientPayload = ingredientRecords.map((ingredient, index) => ({
      recipe_id: recipe.id,
      ingredient_id: ingredient.id,
      quantity: resolvedIngredients[index].input.perServingQuantity,
    }));
    const { error: recipeIngredientsError } = await admin.from('recipe_ingredients').insert(recipeIngredientPayload);
    if (recipeIngredientsError) throw recipeIngredientsError;

    const { data: product, error: productError } = await admin.from('products').insert({
      brand_id: brandId,
      category_id: category.id,
      recipe_id: recipe.id,
      name: productName,
      description: productDescription,
      price: productPrice,
      cost: fullCost,
      margin,
      stock_status: 'in',
      tags: productTags,
      is_active: true,
      is_addon: false,
      requires_kitchen: productInput.requires_kitchen !== false,
      packaging_fee: packagingFee,
      variants: [],
      modifier_groups: [],
      config_options: {},
    }).select('id,name,description,price,cost,margin,category_id,recipe_id,tags,is_active,requires_kitchen,packaging_fee').single();
    if (productError) throw productError;
    created.productId = product.id;

    const targetLocationIds = targetLocations.map((location) => location.id);
    const [{ data: existingCategoryLinks }, { data: existingIngredientLinks }] = await Promise.all([
      admin.from('location_categories').select('id,location_id,is_active').eq('category_id', category.id).in('location_id', targetLocationIds),
      admin.from('location_inventory').select('location_id,ingredient_id').in('ingredient_id', ingredientRecords.map((ingredient) => ingredient.id)).in('location_id', targetLocationIds),
    ]);
    const categoryLinkSet = new Set((existingCategoryLinks || []).map((link) => link.location_id));
    const inventoryLinkSet = new Set((existingIngredientLinks || []).map((link) => `${link.location_id}:${link.ingredient_id}`));
    const missingCategoryLinks = targetLocationIds.filter((id) => !categoryLinkSet.has(id)).map((id) => ({ location_id: id, category_id: category.id, is_active: true }));
    const inactiveCategoryLinkIds = (existingCategoryLinks || []).filter((link) => link.is_active === false).map((link) => link.id);
    const missingInventoryLinks = targetLocationIds.flatMap((id) => ingredientRecords
      .filter((ingredient) => !inventoryLinkSet.has(`${id}:${ingredient.id}`))
      .map((ingredient) => {
        const resolvedIndex = ingredientRecords.findIndex((record) => record.id === ingredient.id);
        const input = resolvedIngredients[resolvedIndex].input;
        return { location_id: id, ingredient_id: ingredient.id, stock_quantity: input.stockCurrent, min_stock: input.stockMin };
      }));

    const linkOperations = [
      ...(missingCategoryLinks.length ? [{ table: 'location_categories', rows: missingCategoryLinks }] : []),
      ...(missingInventoryLinks.length ? [{ table: 'location_inventory', rows: missingInventoryLinks }] : []),
      { table: 'location_recipes', rows: targetLocationIds.map((id) => ({ location_id: id, recipe_id: recipe.id, is_active: true })) },
      { table: 'location_product_status', rows: targetLocationIds.map((id) => ({ location_id: id, product_id: product.id, is_active: true, stock_status: 'in' })) },
      { table: 'location_product_prices', rows: targetLocationIds.map((id) => ({ location_id: id, product_id: product.id, price: productPrice })) },
    ];
    if (inactiveCategoryLinkIds.length) {
      const { error } = await admin.from('location_categories').update({ is_active: true }).in('id', inactiveCategoryLinkIds);
      if (error) throw error;
      created.reactivatedCategoryLinkIds.push(...inactiveCategoryLinkIds);
    }
    for (const operation of linkOperations) {
      const { data: insertedLinks, error } = await admin.from(operation.table).insert(operation.rows).select('id');
      if (error) throw error;
      created.linkRows.push(...(insertedLinks || []).map((link) => ({ table: operation.table, id: link.id })));
    }

    const executedAt = new Date().toISOString();
    const entities = [category, ...ingredientRecords, recipe, product];
    for (let index = 0; index < entities.length; index += 1) {
      const action = actionBySequence.get(index + 1);
      if (!action) continue;
      const { error } = await admin.from('agent_actions').update({
        status: 'completed',
        entity_id: entities[index].id,
        result_data: {
          entity: entities[index],
          reused: action.tool_name.startsWith('reuse_'),
          linked_location_ids: targetLocationIds,
        },
        executed_at: executedAt,
      }).eq('id', action.id);
      if (error) throw error;
    }
    const { error: completeSetError } = await admin.from('agent_change_sets').update({ status: 'completed', executed_at: executedAt }).eq('id', changeSet.id);
    if (completeSetError) throw completeSetError;
    const { error: completedAuditError } = await admin.from('agent_audit_log').insert({
      brand_id: brandId,
      location_id: locationId,
      change_set_id: changeSet.id,
      actor_id: actorId,
      event_type: 'completed',
      event_data: {
        category_id: category.id,
        category_reused: Boolean(existingCategory),
        ingredient_ids: ingredientRecords.map((ingredient) => ingredient.id),
        reused_ingredient_ids: resolvedIngredients.map((item, index) => item.existing ? ingredientRecords[index].id : null).filter(Boolean),
        recipe_id: recipe.id,
        product_id: product.id,
        linked_location_ids: targetLocationIds,
        recipe_cost_per_serving: totalCost,
        product_cost: fullCost,
        margin,
      },
    });
    if (completedAuditError) throw completedAuditError;

    return jsonResponse({
      success: true,
      change_set_id: changeSet.id,
      category,
      category_reused: Boolean(existingCategory),
      ingredients: ingredientRecords,
      reused_ingredient_ids: resolvedIngredients.map((item, index) => item.existing ? ingredientRecords[index].id : null).filter(Boolean),
      recipe,
      product,
      costing: {
        recipe_cost_per_serving: totalCost,
        packaging_fee: packagingFee,
        product_cost: fullCost,
        price: productPrice,
        gross_profit: productPrice - fullCost,
        margin_percentage: margin,
      },
      linked_location_ids: targetLocationIds,
    });
  } catch (error) {
    console.error('aluna-kitchen-action error', error instanceof Error ? error.message : error);

    if (admin && changeSetId) {
      const rollbackErrors: string[] = [];
      const rollback = async (table: string, id: string | null) => {
        if (!id) return;
        const { error: rollbackError } = await admin!.from(table).delete().eq('id', id);
        if (rollbackError) rollbackErrors.push(`${table}: ${rollbackError.message}`);
      };
      for (const link of [...created.linkRows].reverse()) await rollback(link.table, link.id);
      if (created.reactivatedCategoryLinkIds.length) {
        const { error: restoreLinkError } = await admin.from('location_categories').update({ is_active: false }).in('id', created.reactivatedCategoryLinkIds);
        if (restoreLinkError) rollbackErrors.push(`location_categories: ${restoreLinkError.message}`);
      }
      await rollback('products', created.productId);
      await rollback('recipes', created.recipeId);
      for (const ingredientId of [...created.ingredientIds].reverse()) {
        const referenceChecks = await Promise.all([
          admin.from('recipe_ingredients').select('id', { count: 'exact', head: true }).eq('ingredient_id', ingredientId),
          admin.from('product_ingredients').select('id', { count: 'exact', head: true }).eq('ingredient_id', ingredientId),
          admin.from('modifier_options').select('id', { count: 'exact', head: true }).eq('ingredient_id', ingredientId),
        ]);
        const referenceError = referenceChecks.find((result) => result.error)?.error;
        const referenceCount = referenceChecks.reduce((sum, result) => sum + (result.count || 0), 0);
        if (referenceError || referenceCount > 0) {
          rollbackErrors.push(`ingredients: ${ingredientId} was retained because safe deletion could not be confirmed`);
        } else {
          await rollback('ingredients', ingredientId);
        }
      }
      if (created.categoryId) {
        const { count: categoryProductCount, error: categoryReferenceError } = await admin
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('category_id', created.categoryId);
        if (categoryReferenceError || (categoryProductCount || 0) > 0) {
          rollbackErrors.push(`categories: ${created.categoryId} was retained because safe deletion could not be confirmed`);
        } else {
          await rollback('categories', created.categoryId);
        }
      }

      const failedAt = new Date().toISOString();
      const message = error instanceof Error ? error.message : 'Unknown execution error';
      await Promise.all([
        admin.from('agent_actions').update({ status: 'failed', error_message: message, executed_at: failedAt }).eq('change_set_id', changeSetId),
        admin.from('agent_change_sets').update({ status: rollbackErrors.length ? 'partially_failed' : 'failed', executed_at: failedAt }).eq('id', changeSetId),
        admin.from('agent_audit_log').insert({
          brand_id: brandId,
          location_id: locationId,
          change_set_id: changeSetId,
          actor_id: actorId,
          event_type: 'action_failed',
          event_data: { message, compensation_attempted: true, rollback_errors: rollbackErrors },
        }),
      ]);
    }

    if (error instanceof HttpError) {
      return jsonResponse({ error: error.message, ...(error.details ? { details: error.details } : {}) }, error.status);
    }
    return jsonResponse({ error: 'No fue posible crear el producto con receta y costos' }, 500);
  }
});
