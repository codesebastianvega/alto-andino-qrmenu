export const cocoa = {
  name: "Cocoa",
  hero: import.meta.env.VITE_COCOA_IMAGE_URL || "https://picsum.photos/seed/cocoa/1024/600",
  philosophy: "Somos Pet Friendly: respeto, cuidado y bienestar animal...",
  gallery: [
    {
      src: import.meta.env.VITE_COCOA_IMAGE_URL || "https://picsum.photos/seed/cocoa1/800/600",
      alt: "Cocoa 1",
    },
    { src: "https://picsum.photos/seed/cocoa2/800/600", alt: "Cocoa 2" },
    { src: "https://picsum.photos/seed/cocoa3/800/600", alt: "Cocoa 3" },
  ],
};
