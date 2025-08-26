import * as data from "../data/menuItems";

/**
 * Find a product by its id within all menu sections.
 * Each section can be an array or an object containing an `items` array.
 *
 * @param {string} id - Product identifier to search for.
 * @returns {object|null} The matching product, or null if not found.
 */
export function resolveProductById(id) {
  if (!id) return null;

  for (const section of Object.values(data)) {
    let items;
    if (Array.isArray(section)) {
      items = section;
    } else if (section && typeof section === "object" && Array.isArray(section.items)) {
      items = section.items;
    } else {
      continue;
    }

    for (const product of items) {
      if (product && product.id === id) {
        return product;
      }
    }
  }

  return null;
}

