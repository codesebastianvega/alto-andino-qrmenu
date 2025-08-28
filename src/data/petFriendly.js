// Cómo personalizar el modal de Cocoa (Pet Friendly):
// - Imagen principal: cambia `hero` por una ruta local como "/img/pet/cocoa-hero.jpg"
// - Texto: edita `philosophy`
// - Galería: agrega/quita objetos en `gallery` con `src` local (p. ej. "/img/pet/cocoa1.jpg")
export const cocoa = {
  name: "Cocoa",
  // Usa una ruta local y se ocultará si no existe hasta que la subas
  hero: import.meta.env.VITE_COCOA_IMAGE_URL || "/img/pet/cocoa.png",
  philosophy: "Somos Pet Friendly: respeto, cuidado y bienestar animal...",
  gallery: [
    { src: "/img/pet/cocoa1.jpg", alt: "Cocoa 1" },
    { src: "/img/pet/cocoa2.jpg", alt: "Cocoa 2" },
    { src: "/img/pet/cocoa3.jpg", alt: "Cocoa 3" },
  ],
};
