export const banners = (env) => {
  const u = (k, fb) => env?.[k] || fb;
  const local = (envKey, path) => env?.[envKey] || path;

  const items = [
    {
      id: "featured",
      type: "product",
      title: "Producto del día",
      subtitle: env?.VITE_FEATURED_DESC || "Sabor destacado de hoy.",
      productId: env?.VITE_FEATURED_ID || null,
      image: env?.VITE_FEATURED_IMAGE_URL || "/especial1.png",
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
      image: local("VITE_SEASONAL_IMAGE_URL", "/temporada1.png"),
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
      image: local("VITE_BARISTA_IMAGE_URL", "/barista.png"),
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
      image: local("VITE_COCOA_IMAGE_URL", "/cocoa.png"),
      ctas: { primary: { label: "Conocer", action: "modal:petfriendly" } },
      alt: "Cocoa, perrita pitbull bonsái",
    },
    {
      id: "reviews",
      type: "info",
      title: "Reseñas",
      subtitle: "¿Te gustó? Cuéntalo en Google ⭐⭐⭐⭐⭐.",
      image: local("VITE_REVIEWS_IMAGE_URL", "/reseña.png"),
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
