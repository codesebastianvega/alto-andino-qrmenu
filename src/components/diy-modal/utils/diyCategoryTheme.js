export const getCategoryTheme = (groupName = '') => {
  const s = groupName.toLowerCase();
  if (s.includes('entrada') || s.includes('sopa')) {
    return { bg: 'from-orange-500/10 to-amber-500/5', border: 'hover:border-orange-400', badge: 'bg-orange-100 text-orange-900', icon: '🥣' };
  }
  if (s.includes('base')) {
    return { bg: 'from-amber-500/10 to-orange-500/5', border: 'hover:border-amber-400', badge: 'bg-amber-100 text-amber-900', icon: '🍚' };
  }
  if (s.includes('prote')) {
    return { bg: 'from-rose-500/10 to-red-500/5', border: 'hover:border-rose-400', badge: 'bg-rose-100 text-rose-900', icon: '🍗' };
  }
  if (s.includes('veg') || s.includes('fresc')) {
    return { bg: 'from-emerald-500/10 to-teal-500/5', border: 'hover:border-emerald-400', badge: 'bg-emerald-100 text-emerald-900', icon: '🥗' };
  }
  if (s.includes('salsa') || s.includes('aderez')) {
    return { bg: 'from-amber-500/10 to-yellow-500/5', border: 'hover:border-amber-400', badge: 'bg-amber-100 text-amber-900', icon: '🥢' };
  }
  if (s.includes('crunch') || s.includes('semill')) {
    return { bg: 'from-lime-500/10 to-emerald-500/5', border: 'hover:border-lime-400', badge: 'bg-lime-100 text-lime-900', icon: '🍙' };
  }
  return { bg: 'from-neutral-500/10 to-neutral-500/5', border: 'hover:border-neutral-400', badge: 'bg-neutral-100 text-neutral-800', icon: '🍲' };
};

export const getDefaultExtraPrice = (groupName = '', itemPrice = 0) => {
  const s = (groupName || '').toLowerCase();
  if (s.includes('base')) return 3000;
  if (s.includes('prote')) return 6000;
  if (s.includes('veg') || s.includes('topp') || s.includes('fresc')) return 1500;
  if (s.includes('crunch') || s.includes('semill')) return 1000;
  return Number(itemPrice || 0);
};
