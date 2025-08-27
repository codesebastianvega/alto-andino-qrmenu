// src/utils/images.js
// ⬇⬇⬇ INSTRUCCIONES PARA IMÁGENES ⬇⬇⬇
//
// 1) Coloca tus archivos en: /public/img/products/
//    (Ejemplos sugeridos)
//      /public/img/products/coffee-capuccino.jpg
//      /public/img/products/sandwich-pollo.jpg
//      /public/img/products/bowl-prearmado.jpg
//
// 2) Edita el mapa IMAGE_MAP de abajo. La clave puede ser:
//    - el product.id (si existe), o
//    - un "slug" del nombre (por ejemplo: "coffee:capuccino", "sandwich:pollo").
//
// 3) Si no hay coincidencia en IMAGE_MAP, se intentará automáticamente
//    cargar /img/products/<slug>.jpg como fallback. Si tampoco existe,
//    se usa /img/products/placeholder.jpg (créalo en /public si no lo tienes).
//
// Nota: en Vite, todo lo que esté en /public se sirve desde la raíz.
//       Por eso los src empiezan con /img/...

import { slugify } from "@/utils/stock"; // o tu utilidad de slug, si no existe, usa una propia

const IMAGE_MAP = {
  // === COFFEE ===
  "coffee:capuccino": "/img/products/coffee-capuccino.jpg",
  "coffee:latte": "/img/products/coffee-latte.jpg",

  // === SANDWICHES ===
  "sandwich:pollo": "/img/products/sandwich-pollo.jpg",

  // === BOWLS ===
  "bowl:prearmado": "/img/products/bowl-prearmado.jpg",

  // Agrega tus claves aquí ↴
  // "<productId-o-slug>": "/img/products/mi-foto.jpg",
};

const PLACEHOLDER = "/img/products/placeholder.jpg";
  if (!product) return PLACEHOLDER;
  // intenta por id, si no, por slug del nombre
  const key = product.id || (product.name ? slugify(product.name) : "");
  if (!key) return PLACEHOLDER;

  // Mapa explícito
  if (IMAGE_MAP[key]) return IMAGE_MAP[key];

  // Fallback predictivo: /img/products/<slug>.jpg
  const predicted = `/img/products/${key}.jpg`;
  return predicted;

