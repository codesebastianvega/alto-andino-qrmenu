import { useMemo } from 'react';

export function useDIYModifierSteps({
  product,
  menuData,
  selections,
  currentStep
}) {
  const modifierGroupsData = menuData?.modifiers || {};
  const getModifiers = (groupName) =>
    menuData?.getModifiers
      ? menuData.getModifiers(groupName)
      : (modifierGroupsData[groupName] || []);

  const assignedGroups = product?.modifierGroups || product?.modifier_groups || [];
  const rawModifierGroups = menuData?.rawModifierGroups || [];

  const modifierConfig =
    product?.configOptions?.modifier_config ||
    product?.config_options?.modifier_config ||
    {};

  const groups = useMemo(() => {
    let result = [];
    const addedIds = new Set();
    const triggeredMap = {}; // group.id -> array of triggered sub_group_ids

    // 1. Determine triggered sub-groups based on current selections
    Object.entries(selections).forEach(([selGroupName, selIds]) => {
      const g = rawModifierGroups.find((x) => x.name === selGroupName || x.id === selGroupName);
      if (!g) return;
      const opts = g.modifier_options || g.options || [];
      (selIds || []).forEach((id) => {
        const opt = opts.find((o) => o.id === id);
        if (opt && opt.nested_group_id) {
          if (!triggeredMap[g.id]) triggeredMap[g.id] = [];
          triggeredMap[g.id].push(opt.nested_group_id);
        }
      });
    });

    const addGroup = (groupKey) => {
      if (addedIds.has(groupKey)) return;

      const groupMeta = rawModifierGroups.find((g) => g.id === groupKey || g.name === groupKey);
      if (!groupMeta) return;

      const isDirectlyAssigned = assignedGroups.includes(groupMeta.id) || assignedGroups.includes(groupMeta.name);
      const isTriggered = Object.values(triggeredMap).flat().includes(groupMeta.id);
      if (groupMeta.is_submodifier && !isTriggered && !isDirectlyAssigned) return;

      addedIds.add(groupKey);
      addedIds.add(groupMeta.id);
      addedIds.add(groupMeta.name);

      const displayName = groupMeta.name;
      const config = modifierConfig[groupKey] || modifierConfig[displayName];
      let min = groupMeta?.min_select ?? 0;
      let max = groupMeta?.max_select ?? 999;
      let isRequired = groupMeta?.is_required ?? false;
      const allowQuantity = Boolean(groupMeta?.allow_quantity || max > 1);
      const includedQuantity =
        typeof config === 'object' && config?.included !== undefined
          ? config.included
          : groupMeta?.included_quantity ?? (isRequired ? min : 0);

      if (config === 'required') {
        min = 1;
        max = 1;
        isRequired = true;
      } else if (config === 'optional') {
        min = 0;
        max = 999;
        isRequired = false;
      } else if (typeof config === 'object') {
        min = config.min || 0;
        max = config.max || 999;
        isRequired = min > 0;
      } else if (!isRequired) {
        min = 0;
      }

      const rawOpts = groupMeta.modifier_options || groupMeta.options || [];
      const itemsFromContext = getModifiers(groupKey);
      const items =
        itemsFromContext && itemsFromContext.length > 0
          ? itemsFromContext.map((it) => {
              const raw = rawOpts.find((r) => String(r.id) === String(it.id));
              const rawExtra = raw?.extra_price ?? it.extra_price;
              return {
                ...it,
                price: Number(it.price || 0),
                extra_price: rawExtra !== null && rawExtra !== undefined ? Number(rawExtra) : Number(it.price || 0)
              };
            })
          : rawOpts.map((opt) => ({
              ...opt,
              id: opt.id,
              name: opt.name,
              price: Number(opt.price || 0),
              extra_price:
                opt.extra_price !== null && opt.extra_price !== undefined
                  ? Number(opt.extra_price)
                  : Number(opt.price || 0),
              emoji: opt.emoji,
              image_url: opt.image_url || opt.ingredients?.image_url || null,
              group: displayName,
              groupId: groupMeta.id
            }));

      if (items.length > 0) {
        result.push({
          key: groupKey,
          id: groupMeta.id,
          name: displayName,
          type: config || (isRequired ? 'required' : 'optional'),
          min,
          max,
          isRequired,
          allow_quantity: allowQuantity,
          included_quantity: includedQuantity,
          items,
          is_submodifier: groupMeta.is_submodifier
        });

        if (triggeredMap[groupMeta.id]) {
          triggeredMap[groupMeta.id].forEach((subGroupId) => addGroup(subGroupId));
        }
      }
    };

    assignedGroups.forEach(addGroup);
    return result;
  }, [assignedGroups, JSON.stringify(modifierConfig), modifierGroupsData, rawModifierGroups, selections]);

  // Group into steps: each main group starts a step, followed by its active sub-groups
  const steps = useMemo(() => {
    const res = [];
    groups.forEach((g) => {
      if (!g.is_submodifier || res.length === 0) {
        res.push([g]);
      } else {
        res[res.length - 1].push(g);
      }
    });
    return res;
  }, [groups]);

  const currentStepGroups = steps[currentStep] || [];
  const nextStepGroup = steps[currentStep + 1]?.[0];
  const currentProgressPercent = steps.length > 0 ? Math.round(((currentStep + 1) / steps.length) * 100) : 0;

  return {
    groups,
    steps,
    currentStepGroups,
    nextStepGroup,
    currentProgressPercent
  };
}
