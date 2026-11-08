import { useMemo, useEffect, useRef } from "react";

const MILK_OPTIONS_ID = '1ec830c8-301a-4d98-a25f-bf34f0e4febe';

export function useProductModifierGroups({
  isOpen,
  product,
  menuData,
  selections,
  setSelections,
  scrollContainerRef
}) {
  const prevGroupsLength = useRef(0);
  const initialRenderDone = useRef(false);

  const modifierGroupsData = menuData?.modifiers || {};
  const getModifiers = (groupName) =>
    menuData?.getModifiers
      ? menuData.getModifiers(groupName)
      : (modifierGroupsData[groupName] || []);

  const assignedGroups = product?.modifierGroups || product?.modifier_groups || [];
  const rawModifierGroups = menuData?.rawModifierGroups || [];
  const isCafe = product?.categorySlug === 'cafe';

  const effectiveGroups = (assignedGroups.length === 0 && isCafe)
    ? [MILK_OPTIONS_ID]
    : assignedGroups;

  const modifierConfig =
    product?.configOptions?.modifier_config ||
    product?.config_options?.modifier_config ||
    {};

  const groups = useMemo(() => {
    let result = [];
    const addedIds = new Set();
    const triggeredMap = {}; // group.id -> array of triggered sub_group_ids

    // 1. Determine all triggered sub-groups based on current selections
    Object.entries(selections).forEach(([selGroupName, selIds]) => {
      const g = rawModifierGroups.find(x => x.name === selGroupName || x.id === selGroupName);
      if (!g) return;
      const opts = g.modifier_options || g.options || [];
      (selIds || []).forEach(id => {
        const opt = opts.find(o => o.id === id);
        if (opt && opt.nested_group_id) {
          if (!triggeredMap[g.id]) triggeredMap[g.id] = [];
          triggeredMap[g.id].push(opt.nested_group_id);
        }
      });
    });

    // Helper to add a group and its triggered sub-groups recursively
    const addGroup = (groupItem) => {
      // Direct group object with embedded options
      if (groupItem && typeof groupItem === 'object' && Array.isArray(groupItem.options)) {
        const groupKey = groupItem.id || groupItem.name;
        if (addedIds.has(groupKey)) return;
        addedIds.add(groupKey);
        if (groupItem.id) addedIds.add(groupItem.id);
        if (groupItem.name) addedIds.add(groupItem.name);

        const displayName = groupItem.name;
        const config = modifierConfig[groupKey] || modifierConfig[displayName];
        let min = groupItem?.min_select ?? (groupItem?.is_required ? 1 : 0);
        let max = groupItem?.max_select ?? (min > 0 ? 1 : 999);
        let isRequired = groupItem?.is_required ?? (min > 0);

        if (config === 'required') { min = 1; max = 1; isRequired = true; }
        else if (config === 'optional') { min = 0; max = 999; isRequired = false; }
        else if (typeof config === 'object') { min = config.min || 0; max = config.max || 999; isRequired = min > 0; }

        const items = groupItem.options.map(opt => ({
          ...opt,
          id: opt.id,
          name: opt.name,
          price: opt.price || 0,
          extra_price: opt.extra_price !== undefined ? opt.extra_price : (opt.price || 0),
          selling_price: opt.price || 0,
          is_default: Boolean(opt.is_default),
          is_out: opt.is_out || opt.stock_status === 'out'
        }));

        result.push({
          key: groupKey,
          name: displayName,
          type: config || (isRequired ? 'required' : 'optional'),
          min,
          max,
          isRequired,
          included_count: groupItem.included_count !== undefined ? groupItem.included_count : null,
          allow_quantity: Boolean(groupItem.allow_quantity || (!isRequired && max > 1)),
          items,
        });
        return;
      }

      // String key / UUID referencing rawModifierGroups
      const groupKey = typeof groupItem === 'string' ? groupItem : (groupItem?.id || groupItem?.name);
      if (!groupKey || addedIds.has(groupKey)) return;

      const groupMeta = rawModifierGroups.find(g => g.id === groupKey || g.name === groupKey);
      if (!groupMeta) return;

      // If it's a submodifier, it MUST be triggered or explicitly assigned to this product
      const productGroupIds = product?.modifierGroups || product?.modifier_groups || [];
      const isDirectlyAssigned = productGroupIds.some(pg => {
        const id = typeof pg === 'string' ? pg : (pg?.id || pg?.name);
        return id === groupMeta.id || id === groupMeta.name;
      });
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

      // Override with product-level config if present
      if (config === 'required') { min = 1; max = 1; isRequired = true; }
      else if (config === 'optional') { min = 0; max = 999; isRequired = false; }
      else if (typeof config === 'object') { min = config.min || 0; max = config.max || 999; isRequired = min > 0; }

      const items = getModifiers(groupKey);
      if (items.length > 0) {
        result.push({
          key: groupKey,
          name: displayName,
          type: config || (isRequired ? 'required' : 'optional'),
          min,
          max,
          isRequired,
          included_count: groupMeta.included_count !== undefined ? groupMeta.included_count : null,
          allow_quantity: Boolean(groupMeta?.allow_quantity || (!isRequired && max > 1)),
          items,
        });

        // Insert triggered sub-groups immediately after 
        if (triggeredMap[groupMeta.id]) {
          triggeredMap[groupMeta.id].forEach(subGroupId => addGroup(subGroupId));
        }
      }
    };

    effectiveGroups.forEach(addGroup);

    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveGroups.map(g => (typeof g === 'object' ? (g.id || g.name) : g)).join(","), JSON.stringify(modifierConfig), modifierGroupsData, rawModifierGroups, selections]);

  // Reset scroll and refs when product changes
  useEffect(() => {
    initialRenderDone.current = false;
    prevGroupsLength.current = 0;
  }, [product?.id, isOpen]);

  // Smooth scroll down when sub-groups are added
  useEffect(() => {
    if (!isOpen) return;
    if (!initialRenderDone.current) {
      initialRenderDone.current = true;
      prevGroupsLength.current = groups.length;
      return;
    }
    if (groups.length > prevGroupsLength.current && prevGroupsLength.current > 0) {
      setTimeout(() => {
        if (scrollContainerRef?.current) {
          scrollContainerRef.current.scrollBy({
            top: 180,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
    prevGroupsLength.current = groups.length;
  }, [groups.length, isOpen, scrollContainerRef]);

  // Auto-initialize default selections for groups
  useEffect(() => {
    if (!isOpen || groups.length === 0) return;
    setSelections(prev => {
      let changed = false;
      const next = { ...prev };
      groups.forEach(g => {
        if (!next[g.name] || next[g.name].length === 0) {
          const defaults = g.items.filter(it => it.is_default && !it.is_out).map(it => it.id);
          if (defaults.length > 0) {
            next[g.name] = defaults.slice(0, g.max);
            changed = true;
          }
        }
      });
      return changed ? next : prev;
    });
  }, [isOpen, groups, setSelections]);

  return { groups };
}
