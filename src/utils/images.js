// Utilidad para resolver imagen de un producto con fallback placeholder.
import { productImages } from "../data/images";

function slug(s="") {
  return s
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** getProductImage(product)
 * Prioridad: product.image -> productImages[id/slug] -> placeholder (picsum).
 */
export function getProductImage(product) {
  const pid =
    product?.id ||
    product?.productId ||
    slug(product?.name || product?.title || "producto");
  const explicit = product?.image;
  const mapped =
    productImages[pid] ||
    productImages[slug(product?.name || product?.title || "")];
  if (explicit) return explicit;
  if (mapped) return mapped;
  // Placeholder determinista por semilla:
  return `https://picsum.photos/seed/${encodeURIComponent(pid)}/640/480`;
}
