// Utilidad para resolver imagen de un producto con fallback placeholder.
import { productImages } from "../data/images";

function slug(s = "") {
  return s
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getProductImage(product) {
  const pid = product?.id || slug(product?.name || product?.title || "producto");
  if (product?.image) return product.image;
  const mapped = productImages[pid] || productImages[slug(product?.name || product?.title || "")];
  return mapped || `https://picsum.photos/seed/${encodeURIComponent(pid)}/640/640`;
}
