// Cómo personalizar los banners:
// - Imagen por banner: cambia la propiedad `image` a una ruta local (p. ej. "/img/banners/news.png")
// - Títulos, subtítulos y CTAs: edita `title`, `subtitle` y `ctas`.
// - Para mostrar una historia/receta, usa `productId` y asegúrate de tener una entrada en `src/data/stories.js` con la misma clave.
export const banners = (env) => {
  const u = (k, fb) => env?.[k] || fb;
  const local = (envKey, path) => env?.[envKey] || path; // Sube imágenes a /public/img/banners

  const items = [
    {
      id: "featured",
      type: "product",
      title: "Producto del día",
      subtitle: env?.VITE_FEATURED_DESC || "Sabor destacado de hoy.",
      productId: env?.VITE_FEATURED_ID || null,
      image: local("VITE_FEATURED_IMAGE_URL", "https://placehold.co/600x400/243326/FFFFFF/png?text=Producto+del+Día"),
      ctas: {
        primary: { label: "Agregar", action: "add" },
        secondary: { label: "Ver", action: "quickview" },
      },
      alt: "Producto del día",
    },
    {
      id: "seasonal",
      type: "product",
      title: "Producto de temporada",
      subtitle: env?.VITE_SEASONAL_DESC || "Sabores frescos de estación.",
      productId: env?.VITE_SEASONAL_ID || null,
      image: local("VITE_SEASONAL_IMAGE_URL", "https://placehold.co/600x400/243326/FFFFFF/png?text=De+Temporada"),
      ctas: {
        primary: { label: "Agregar", action: "add" },
        secondary: { label: "Ver", action: "quickview" },
      },
      alt: "Producto de temporada",
    },
    {
      id: "barista",
      type: "product",
      title: "Recomendado del barista",
      subtitle: u("VITE_BARISTA_DESC", "Capuchino de origen, notas a cacao."),
      productId: env?.VITE_BARISTA_ID || null,
      image: local("VITE_BARISTA_IMAGE_URL", "https://placehold.co/600x400/243326/FFFFFF/png?text=Recomendado+del+Barista"),
      ctas: {
        primary: { label: "Agregar", action: "add" },
        secondary: { label: "Ver café", action: "quickview" },
      },
      alt: "Capuchino recomendado por el barista",
    },
    {
      id: "pet",
      type: "info",
      title: "Pet Friendly 🐾",
      subtitle: "Conoce a Cocoa, nuestra pitbull bonsái.",
      image: local("VITE_COCOA_IMAGE_URL", "https://placehold.co/600x400/243326/FFFFFF/png?text=Pet+Friendly"),
      ctas: { primary: { label: "Conocer", action: "modal:petfriendly" } },
      alt: "Cocoa, perrita pitbull bonsái",
    },
    // Noticias y Recetas (usa StoryModal con productStories)
    {
      id: "news",
      type: "info",
      title: "Noticias",
      subtitle: u("VITE_NEWS_DESC", "Novedades del Alto Andino"),
      productId: "news",
      image: local("VITE_NEWS_IMAGE_URL", "https://placehold.co/600x400/243326/FFFFFF/png?text=Noticias"),
      ctas: { primary: { label: u("VITE_NEWS_LABEL", "Noticias"), action: "story" } },
      alt: "Noticias Alto Andino",
    },
    {
      id: "recipes",
      type: "info",
      title: "Recetas",
      subtitle: u("VITE_RECIPES_DESC", "Ideas para preparar en casa"),
      productId: "recipes",
      image: local("VITE_RECIPES_IMAGE_URL", "https://placehold.co/600x400/243326/FFFFFF/png?text=Recetas"),
      ctas: { primary: { label: u("VITE_RECIPES_LABEL", "Recetas"), action: "story" } },
      alt: "Recetas Alto Andino",
    },
    {
      id: "reviews",
      type: "info",
      title: "Reseñas",
      subtitle: "¿Te gustó? Cuéntalo en Google ⭐⭐⭐⭐⭐.",
      image: local("VITE_REVIEWS_IMAGE_URL", "https://placehold.co/600x400/243326/FFFFFF/png?text=Déjanos+tu+Reseña"),
      ctas: { primary: { label: "Dejar reseña", action: "link:reviews" } },
      alt: "Reseñas de clientes",
    },
  ];

  return items.map((banner) => {
    if (banner.type === "product" && !banner.productId) {
      banner.type = "info";
      if (banner.ctas) {
        delete banner.ctas.primary;
        delete banner.ctas.secondary;
      }
    }
    return banner;
  });
};