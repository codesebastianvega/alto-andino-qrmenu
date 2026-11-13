export const cleanDIYLabel = value => String(value || '').replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u200D\u20E3]/gu, '').trim();
export const isDIYOptionAvailable = item => item.is_active !== false && item.stock_status !== 'out' && !item.is_out && (item.available_portions == null || Number(item.available_portions) > 0);
const keyOf = value => typeof value === 'string' ? value : value?.id || value?.name;

// Each selected portion owns an independent instance of its linked group.
// IDs, links, images and prices come from the catalog, never from ingredient names.
export function buildDIYGroups({ assignedGroups, rawGroups, modifiers, config = {}, selections = {}, resolveImage = option => option.image_url || option.ingredients?.image_url || null }) {
  const find = key => rawGroups.find(group => group.id === keyOf(key) || group.name === keyOf(key));
  const nested = new Set();
  const scan = (key, visited = new Set()) => {
    const group = find(key);
    if (!group || visited.has(group.id)) return;
    visited.add(group.id);
    (group.modifier_options || group.options || []).forEach(item => {
      if (item.nested_group_id) { nested.add(item.nested_group_id); scan(item.nested_group_id, visited); }
    });
  };
  assignedGroups.forEach(key => scan(key));
  const groups = [];
  const seen = new Set();
  function add(key, owner = null, ancestors = new Set()) {
    const meta = find(key);
    if (!meta || ancestors.has(meta.id) || (!owner && nested.has(meta.id))) return;
    const selectionKey = owner ? `${owner.key}/${owner.item.id}/${owner.index}/${meta.id}` : meta.id;
    if (seen.has(selectionKey)) return;
    seen.add(selectionKey);
    const override = config[keyOf(key)] ?? config[meta.id] ?? config[meta.name];
    let min = meta.is_required ? Number(meta.min_select ?? 1) : 0;
    let max = Number(meta.max_select ?? 1);
    if (override === 'required') { min = 1; max = 1; }
    if (override === 'optional') { min = 0; }
    if (override && typeof override === 'object') {
      min = Number(override.min ?? min); max = Number(override.max ?? max);
    }
    const raw = meta.modifier_options || meta.options || [];
    const source = modifiers[meta.id] ?? modifiers[meta.name] ?? raw;
    const items = source.filter(isDIYOptionAvailable).map(item => {
      const rawOption = raw.find(option => String(option.id) === String(item.id));
      return {
      ...rawOption, ...item,
      image_url: resolveImage(rawOption ? { ...item, image_url: rawOption.image_url } : item, meta.brand_id),
      price: Number(item.price ?? 0),
      extra_price: item.extra_price == null ? Number(item.price ?? 0) : Number(item.extra_price),
    }; });
    const group = {
      ...meta, key: keyOf(key), selectionKey, min, max, items, isRequired: min > 0,
      allow_quantity: Boolean(meta.allow_quantity),
      included_quantity: Number((typeof override === 'object' ? override?.included : undefined) ?? meta.included_quantity ?? (min > 0 ? min : 0)),
      parentId: owner?.key ?? null, parentItemId: owner?.item.id ?? null,
      portionIndex: owner?.index ?? null, parentLabel: owner?.item.name ?? null,
      is_submodifier: Boolean(owner),
    };
    groups.push(group);
    const path = new Set([...ancestors, meta.id]);
    const counts = {};
    (selections[selectionKey] || []).forEach(id => {
      const item = items.find(option => String(option.id) === String(id));
      if (!item) return;
      const index = counts[id] || 0; counts[id] = index + 1;
      if (item.nested_group_id) add(item.nested_group_id, { key: selectionKey, item, index }, path);
    });
  }
  assignedGroups.forEach(key => add(key));
  return groups;
}

export function pruneDIYSelections(groups, selections) {
  const next = {};
  groups.forEach(group => {
    const valid = (selections[group.selectionKey] || []).filter(id => group.items.some(item => String(item.id) === String(id))).slice(0, group.max);
    if (valid.length) next[group.selectionKey] = valid;
  });
  return JSON.stringify(next) === JSON.stringify(selections) ? selections : next;
}

export function removeDIYPortion(selections, groupKey, itemId, portionIndex) {
  const ids = selections[groupKey] || [];
  const positions = ids.flatMap((id, index) => String(id) === String(itemId) ? [index] : []);
  const index = portionIndex ?? positions.length - 1;
  if (positions[index] == null) return selections;
  const remaining = [...ids]; remaining.splice(positions[index], 1);
  const prefix = `${groupKey}/${itemId}/`;
  const next = {};
  Object.entries(selections).forEach(([key, value]) => {
    if (!key.startsWith(prefix)) { next[key] = value; return; }
    const [number, ...suffix] = key.slice(prefix.length).split('/');
    const portion = Number(number);
    if (portion === index) return;
    next[`${prefix}${portion > index ? portion - 1 : portion}/${suffix.join('/')}`] = value;
  });
  next[groupKey] = remaining;
  return next;
}

export function wouldCreateDIYCycle(groups, parentId, childId) {
  const visited = new Set();
  function reaches(id) {
    if (id === parentId) return true;
    if (!id || visited.has(id)) return false;
    visited.add(id);
    const group = groups.find(group => group.id === id);
    return (group?.options || group?.modifier_options || []).some(option => reaches(option.nested_group_id));
  }
  return reaches(childId);
}

export function calculateDIYGroupPrice(group, ids = []) {
  const counts = new Map();
  ids.forEach(id => counts.set(String(id), (counts.get(String(id)) || 0) + 1));
  const entries = [...counts].map(([id, qty]) => ({ item: group.items.find(item => String(item.id) === id), qty })).filter(entry => entry.item);
  entries.sort((a, b) => Number(a.item.price ?? 0) - Number(b.item.price ?? 0));
  let included = group.included_quantity;
  let total = 0;
  for (const { item, qty } of entries) for (let i = 0; i < qty; i++) {
    const base = Number(item.price ?? 0);
    if (i === 0 && included > 0) { total += base; included--; }
    else total += Number(item.extra_price ?? base);
  }
  return total;
}

export function getDIYPortions(group, item, groups, selections) {
  const count = (selections[group.selectionKey] || []).filter(id => String(id) === String(item.id)).length;
  return Array.from({ length: count }, (_, index) => {
    const children = groups.filter(child => child.parentId === group.selectionKey && String(child.parentItemId) === String(item.id) && child.portionIndex === index);
    const details = children.flatMap(child => [...new Set(selections[child.selectionKey] || [])].flatMap(id => {
      const option = child.items.find(candidate => String(candidate.id) === String(id));
      return option ? getDIYPortions(child, option, groups, selections) : [];
    }));
    return {
      id: item.id, groupName: group.selectionKey, portionIndex: index,
      label: cleanDIYLabel(item.name),
      details: details.map(detail => detail.name).join(' · '),
      name: [cleanDIYLabel(item.name), ...details.map(detail => detail.name)].join(' · '),
      image_url: [...details].reverse().find(detail => detail.image_url)?.image_url || item.image_url || item.ingredients?.image_url || null,
    };
  });
}

export function getDIYSummary(groups, selections) {
  return groups.filter(group => !group.parentId).flatMap(group => group.items.flatMap(item => getDIYPortions(group, item, groups, selections)));
}

export function getDIYOrderOptions(groups, selections) {
  return Object.fromEntries(groups.filter(group => !group.parentId).map(group => {
    const rows = group.items.flatMap(item => getDIYPortions(group, item, groups, selections)).map(row => row.name);
    return [cleanDIYLabel(group.name), group.max === 1 && !group.allow_quantity ? rows[0] : rows];
  }).filter(([, value]) => Array.isArray(value) ? value.length : Boolean(value)));
}
