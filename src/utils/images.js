// src/utils/images.js
// ⬇⬇⬇ INSTRUCCIONES PARA IMÁGENES ⬇⬇⬇
//
// 1) Pon tus imágenes en: /public/img/products/
//    Ej.: /public/img/products/coffee-capuccino.jpg
// 2) Mapea aquí debajo en IMAGE_MAP usando un id o un slug manual.
// 3) Si no hay match, se intentará /img/products/<slug> con las extensiones
//    .png y .jpg. Si tampoco existe, retornará null.

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
  "sandwich:cerdo": "/img/products/sancerdo1.png",

  // === BOWLS ===
  "bowl:prearmado": "/img/products/bowl-prearmado.jpg",

  // Agrega tus claves aquí:
  // "<productId-o-slug>": "/img/products/mi-foto.jpg",
};

/**
 * Dado un producto { id?, name? }, devuelve una ruta de imagen.
 * 1) Busca en IMAGE_MAP por id o slug(name)
 * 2) Si no, intenta /img/products/<slug>.png o .jpg
 * 3) Si no, retorna null
 */
export function getProductImage(product) {
  if (!product) return null;
  const key = product.id || (product.name ? slugify(product.name) : "");
  if (key && IMAGE_MAP[key]) return IMAGE_MAP[key];

  for (const ext of ["png", "jpg"]) {
    const url = `/img/products/${key}.${ext}`;
    const req = new XMLHttpRequest();
    try {
      req.open("HEAD", url, false);
      req.send();
      if (req.status >= 200 && req.status < 400) return url;
    } catch {}
  }

  return null;
}
