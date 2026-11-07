export const isBarItem = (item) => {
  if (!item) return false;
  const prod = item.products;
  if (!prod) return false;
  const station = (prod.station || '').toLowerCase();
  if (station === 'bar') return true;
  if (station === 'kitchen' || station === 'none') return false;
  const name = (prod.name || '').toLowerCase();
  const desc = (prod.description || '').toLowerCase();
  const barKeywords = [
    'café', 'cafe', 'tinto', 'latte', 'capuchino', 'espresso', 'bebida', 
    'smoothie', 'jugo', 'coctel', 'cóctel', 'cocktail', 'gin', 'trago', 
    'cerveza', 'beer', 'vino', 'licor', 'soda', 'agua', 'hatsu', 'gaseosa', 
    'aromatica', 'aromática', 'té', 'coca-cola', 'refajo', 'cold brew', 
    'chai', 'milo', 'schweppes'
  ];
  return barKeywords.some(kw => name.includes(kw) || desc.includes(kw));
};

export const isKitchenItem = (item) => {
  if (!item) return false;
  const prod = item.products;
  if (!prod) return false;
  const station = (prod.station || '').toLowerCase();
  if (station === 'kitchen') return true;
  if (station === 'bar' || station === 'none') return false;
  if (prod.requires_kitchen === false) return false;
  return !isBarItem(item);
};
