// src/utils/images.js
// ⬇⬇⬇ INSTRUCCIONES PARA IMÁGENES ⬇⬇⬇
//
// 1) Coloca tus archivos en: /public/img/products/
// 2) Edita el mapa IMAGE_MAP de abajo o usa la convención /img/products/<slug>.jpg
// 3) Si no hay match, se devuelve el path predicho; crea un placeholder si quieres.

/* eslint-disable import/no-unresolved */
import { slugify } from "@/utils/stock";

export const IMAGE_MAP = {
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

export const PLACEHOLDER = "/img/products/placeholder.jpg";

/**
 * Devuelve la ruta de imagen para un producto.
 * Busca por id; si no, por slug del nombre. Si no hay match en IMAGE_MAP,
 * retorna /img/products/<slug>.jpg como convención.
 */
export function getProductImage(product) {
  if (!product) return PLACEHOLDER;

  // intenta usar id; si no, un slug del nombre (ej: "coffee:capuccino")
  const key = product.id || (product.name ? slugify(product.name) : "");
  if (!key) return PLACEHOLDER;

  if (IMAGE_MAP[key]) return IMAGE_MAP[key];

  // Fallback predictivo: coloca el archivo en /public/img/products/<key>.jpg
  return `/img/products/${key}.jpg`;
}
