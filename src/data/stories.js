// Historias/recetas por productId.
// Cómo editar:
// - Agrega una clave que coincida con el `productId` del banner.
// - Personaliza `title` y las `sections` (cada sección puede tener `heading`, `image` y `body`).
// - Las imágenes pueden ser locales, p. ej.: "/img/stories/mi-foto.jpg".

const FEAT = import.meta.env.VITE_FEATURED_ID;
const SEAS = import.meta.env.VITE_SEASONAL_ID;
const BAR = import.meta.env.VITE_BARISTA_ID;

export const productStories = {
  // Producto destacado (usa el ID configurado o placeholder)
  [FEAT || "featured-placeholder"]: {
    title: "Origen y sabor — Producto del día",
    sections: [
      {
        heading: "Nuestra historia",
        image: "/img/stories/featured-1.jpg",
        body: "Este plato nace de ingredientes frescos de productores locales...",
      },
      {
        heading: "Curiosidades",
        image: null,
        body: "• Marida bien con bebidas frías cítricas.\n• Ideal como post-entreno.",
      },
      {
        heading: "Receta (en casa)",
        image: "/img/stories/recipe-1.jpg",
        body: "1) Cocina la base...\n2) Adiciona toppings...\n3) Sirve con salsa al gusto.",
      },
    ],
  },

  // Producto de temporada
  [SEAS || "seasonal-placeholder"]: {
    title: "Temporada — Sabores que vuelven",
    sections: [
      {
        heading: "Ingredientes de temporada",
        image: "/img/stories/seasonal-1.jpg",
        body: "Usamos fruta de cosecha...",
      },
    ],
  },

  // Recomendado del barista
  [BAR || "barista-placeholder"]: {
    title: "Barista Recomendado",
    sections: [
      {
        heading: "Perfil de taza",
        image: "/img/stories/coffee-barista.jpg",
        body: "Notas a cacao, panela y frutos rojos.",
      },
    ],
  },

  // Noticias generales del local
  news: {
    ctaLabel: "Noticias",
    title: "Noticias Alto Andino",
    sections: [
      {
        heading: "Nueva carta",
        image: "/img/stories/news-1.jpg",
        body: "Estrenamos platos y bebidas de temporada. Ven a probarlos y cuéntanos qué te parecen.",
      },
      {
        heading: "Eventos",
        image: null,
        body: "Próximo concierto acústico el viernes a las 7 p.m. Reservas por DM.",
      },
    ],
  },

  // Recetas o tips
  recipes: {
    ctaLabel: "Recetas",
    title: "Recetas Alto Andino",
    sections: [
      {
        heading: "Vinagreta de la casa",
        image: "/img/stories/recipe-vinagreta.jpg",
        body: "1) Mezcla aceite de oliva y balsámico 2) Agrega mostaza Dijon 3) Sal y pimienta al gusto.",
      },
      {
        heading: "Cold Brew fácil",
        image: "/img/stories/coffee-coldbrew.jpg",
        body: "Usa molienda gruesa, 1:8 café/agua en frío por 12–16h. Sirve con hielo.",
      },
    ],
  },
};

