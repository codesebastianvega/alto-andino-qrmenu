// src/utils/images.js
// ⬇⬇⬇ INSTRUCCIONES PARA IMÁGENES ⬇⬇⬇
//
// 1) Pon tus imágenes en: /public/img/products/
//    Ej.: /public/img/products/coffee-capuccino.jpg
// 2) Mapea aquí debajo en IMAGE_MAP usando un id o un slug manual.
// 3) Si no hay match, se intentará /img/products/<slug>.jpg; si tampoco existe,
//    usa PLACEHOLDER (crea /public/img/products/placeholder.jpg).

function slugify(s = "") {
  return String(s)
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const IMAGE_MAP = {
  // === COFFEE ===
  "coffee:capuccino": "/img/products/coffee-capuccino.jpg",
  "coffee:latte": "/img/products/coffee-latte.jpg",

  // === SANDWICHES ===
  "sandwich:pollo": "/img/products/sandwich-pollo.jpg",

  // === BOWLS ===
  "bowl:prearmado": "/img/products/bowl-prearmado.jpg",

  // Agrega tus claves aquí:
  // "<productId-o-slug>": "/img/products/mi-foto.jpg",
};

export const PLACEHOLDER = "/img/products/placeholder.jpg";

/**
 * Dado un producto { id?, name? }, devuelve una ruta de imagen.
 * 1) Busca en IMAGE_MAP por id o slug(name)
 * 2) Si no, intenta /img/products/<slug>.jpg
 * 3) Si no, PLACEHOLDER
 */
export function getProductImage(product) {
  if (!product) return PLACEHOLDER;
  const key = product.id || (product.name ? slugify(product.name) : "");
  if (key && IMAGE_MAP[key]) return IMAGE_MAP[key];
  if (key) return `/img/products/${key}.jpg`;
  return PLACEHOLDER;
}
