export const SYSTEM_CONCEPT_IDS = new Set(['operations_model', 'telegram_dispatch']);

export const normalizeBrandConcepts = (concepts = []) => {
  if (!Array.isArray(concepts)) return [];
  return concepts
    .filter((concept) => {
      if (!concept) return false;
      if (typeof concept === 'string') return concept.trim().length > 0;
      if (typeof concept === 'object') {
        if (SYSTEM_CONCEPT_IDS.has(concept.id)) return false;
        if (concept.fulfillment_modes || concept.bot_token) return false;
        return Boolean(concept.name || concept.label);
      }
      return false;
    })
    .map((concept) => {
      if (typeof concept === 'string') {
        return { value: concept, label: concept };
      }
      const label = concept.name || concept.label;
      return { value: label, label };
    });
};

export const isUnsplashPageLink = (url) => {
  if (!url) return false;
  return /unsplash\.com\/(photos|es\/fotos)\//i.test(url) && !/images\.unsplash\.com/i.test(url);
};

export const getSubGroupsForGroup = (group, subGroups = []) => {
  const opts = group?.modifier_options || group?.options || [];
  if (opts.length === 0) return [];
  const nestedIds = opts.map((o) => o.nested_group_id).filter(Boolean);
  return subGroups.filter((sg) => nestedIds.includes(sg.id));
};

export const getOrphanSubGroups = (mainGroups = [], subGroups = []) => {
  const associatedIds = new Set();
  mainGroups.forEach((g) => {
    const opts = g.modifier_options || g.options || [];
    opts.forEach((o) => {
      if (o.nested_group_id) associatedIds.add(o.nested_group_id);
    });
  });
  return subGroups.filter((sg) => !associatedIds.has(sg.id));
};

export const calculateFinancialMetrics = ({
  price = 0,
  cost = 0,
  packagingFee = 0,
  targetMargin = 35
}) => {
  const priceNum = parseFloat(price) || 0;
  const costNum = parseFloat(cost) || 0;
  const packFee = parseFloat(packagingFee) || 0;
  const totalCOGS = costNum + packFee;
  const profit = priceNum - totalCOGS;
  const margin = priceNum > 0 ? (profit / priceNum) * 100 : 0;
  const suggested = totalCOGS > 0 ? Math.round(totalCOGS / (1 - targetMargin / 100)) : 0;
  const marginDiff = margin - targetMargin;

  return {
    priceNum,
    costNum,
    packFee,
    totalCOGS,
    profit,
    margin,
    suggested,
    marginDiff
  };
};
