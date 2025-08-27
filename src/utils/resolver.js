import * as data from "../data/menuItems";

export function resolveProductById(id) {
  if (!id) return null;
  try {
    const sections = Object.values(data);
    for (const section of sections) {
      const list = Array.isArray(section)
        ? section
        : Array.isArray(section?.items)
          ? section.items
          : null;
      if (!Array.isArray(list)) continue;
      const p = list.find((x) => x?.id === id);
      if (p) return p;
    }
  } catch {}
  return null;
}