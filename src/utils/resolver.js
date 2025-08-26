import {
  breakfastItems,
  mainDishes,
  dessertBaseItems,
  preBowl,
  smoothies,
  funcionales,
  coffees,
  infusions,
  sodas,
  otherDrinks,
  sandwichItems,
  sandwichPriceByItem,
} from "../data/menuItems";

const productMap = (() => {
  const collections = [
    breakfastItems,
    mainDishes,
    dessertBaseItems,
    [preBowl],
    smoothies,
    funcionales,
    coffees,
    infusions,
    sodas,
    otherDrinks,
  ];
  if (sandwichItems && sandwichPriceByItem) {
    const mapped = sandwichItems.map((it) => {
      const mapping = sandwichPriceByItem[it.key];
      const price = mapping?.unico ?? mapping?.clasico ?? mapping?.grande;
      return { id: "sandwich:" + it.key, name: it.name, price, desc: it.desc };
    });
    collections.push(mapped);
  }
  const map = {};
  for (const col of collections) {
    if (!Array.isArray(col)) continue;
    for (const p of col) {
      const pid = p.id || p.productId;
      if (!pid) continue;
      const prod = {
        ...p,
        id: pid,
        productId: pid,
        name: p.name || p.title,
        title: p.title || p.name,
        subtitle: p.desc || p.subtitle,
        price: p.price,
        image: p.image,
      };
      const ids = [p.id, p.productId].filter(Boolean);
      if (ids.length === 0) ids.push(pid);
      for (const ident of ids) {
        map[ident] = prod;
      }
    }
  }
  return map;
})();

export function resolveProductById(id) {
  if (!id) return null;
  return productMap[id] || null;
}
