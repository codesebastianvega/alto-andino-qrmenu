export const banners = (env) => {
  const u = (k, fb) => env?.[k] || fb;

  const items = [
    {
      id: "featured",
      type: "product",
      title: "Producto del día",
      subtitle: env?.VITE_FEATURED_DESC || "Sabor destacado de hoy.",
      productId: env?.VITE_FEATURED_ID || null,
      bgColor: "#2f4131",
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
      bgColor: "#5f8a74",
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
      bgColor: "#a39a8e",
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
      bgColor: "#243326",
      ctas: { primary: { label: "Conocer", action: "modal:petfriendly" } },
      alt: "Cocoa, perrita pitbull bonsái",
    },
    {
      id: "news",
      type: "info",
      title: "Noticias",
      subtitle: u("VITE_NEWS_DESC", "Novedades del Alto Andino"),
      productId: "news",
      bgColor: "#8a5f6d",
      ctas: { primary: { label: u("VITE_NEWS_LABEL", "Noticias"), action: "story" } },
      alt: "Noticias Alto Andino",
    },
    {
      id: "recipes",
      type: "info",
      title: "Recetas",
      subtitle: u("VITE_RECIPES_DESC", "Ideas para preparar en casa"),
      productId: "recipes",
      bgColor: "#5f8a87",
      ctas: { primary: { label: u("VITE_RECIPES_LABEL", "Recetas"), action: "story" } },
      alt: "Recetas Alto Andino",
    },
    {
      id: "reviews",
      type: "info",
      title: "Reseñas",
      subtitle: "¿Te gustó? Cuéntalo en Google ⭐⭐⭐⭐⭐.",
      bgColor: "#8a745f",
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
