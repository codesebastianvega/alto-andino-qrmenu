import { DEFAULT_COPY } from './flyerModel.js';

export function draftKey(brandId, userId) {
  return brandId && userId ? `aluna:boku-flyer:v1:${brandId}:${userId}` : null;
}

// Persist design choices only. Prices, images and product records always come from the live catalog.
export function parseDraft(raw) {
  try {
    const value = JSON.parse(raw);
    if (value?.version !== 1) return null;
    const ids = key => Array.isArray(value[key]) ? [...new Set(value[key].filter(id => typeof id === 'string'))].slice(0, 100) : [];
    const textMap = (source, max) => Object.fromEntries(Object.entries(source && typeof source === 'object' && !Array.isArray(source) ? source : {}).filter(([, text]) => typeof text === 'string').slice(0, 100).map(([key, text]) => [key, text.slice(0, max)]));
    const copy = { ...DEFAULT_COPY };
    for (const key of Object.keys(copy)) if (typeof value.copy?.[key] === 'string') copy[key] = value.copy[key].slice(0, key === 'includes' || key === 'footer' ? 100 : 40);
    const flags = {};
    for (const key of ['showExtras', 'showDescriptions', 'showIncludes', 'showFooter', 'showStartingPrice']) if (typeof value[key] === 'boolean') flags[key] = value[key];
    return { dailyIds: ids('dailyIds').slice(0, 2), otherIds: ids('otherIds'), extraIds: ids('extraIds'), copy, names: textMap(value.names, 56), descriptions: textMap(value.descriptions, 55), ...flags };
  } catch { return null; }
}
