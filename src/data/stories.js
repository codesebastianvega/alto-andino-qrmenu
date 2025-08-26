// Historias/recetas por productId. Usa IDs reales si existen; placeholder si no.
const FEAT = import.meta.env.VITE_FEATURED_ID;
const SEAS = import.meta.env.VITE_SEASONAL_ID;
const BAR = import.meta.env.VITE_BARISTA_ID;

export const productStories = {
  // Ejemplo para producto destacado
  [FEAT || "featured-placeholder"]: {
    title: "Origen y sabor — Producto del día",
    sections: [
      {
        heading: "Nuestra historia",
        image: "https://picsum.photos/seed/story1/960/540",
        body: "Este plato nace de ingredientes frescos de productores locales...",
      },
      {
        heading: "Curiosidades",
        image: null,
        body: "• Marida bien con bebidas frías cítricas.\n• Ideal como post-entreno.",
      },
      {
        heading: "Receta (en casa)",
        image: "https://picsum.photos/seed/recipe1/960/540",
        body: "1) Cocina la base...\n2) Adiciona toppings...\n3) Sirve con salsa al gusto.",
      },
    ],
  },
  [SEAS || "seasonal-placeholder"]: {
    title: "Temporada — Sabores que vuelven",
    sections: [
      {
        heading: "Ingredientes de temporada",
        image: "https://picsum.photos/seed/season1/960/540",
        body: "Usamos fruta de cosecha...",
      },
    ],
  },
  [BAR || "barista-placeholder"]: {
    title: "Barista Recomendado",
    sections: [
      {
        heading: "Perfil de taza",
        image: "https://picsum.photos/seed/coffee1/960/540",
        body: "Notas a cacao, panela y frutos rojos.",
      },
    ],
  },
};
