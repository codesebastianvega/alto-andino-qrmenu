export const banners = (env) => {
  const u = (k, fb) => env?.[k] || fb;
  return [
    { id:'featured', type:'product',
      title:'Especial del día',
      subtitle:u('VITE_FEATURED_DESC','Sándwich de cerdo al horno — casero y saludable.'),
      productId: env?.VITE_FEATURED_ID || null,
      image: u('VITE_FEATURED_IMAGE_URL','https://images.unsplash.com/photo-1504754524776-8f4f37790ca0'),
      ctas:{ primary:{label:'Agregar', action:'add'}, secondary:{label:'Ver', action:'quickview'} },
      alt: 'Especial del día'
    },
    { id:'barista', type:'product',
      title:'Recomendado del barista',
      subtitle:u('VITE_BARISTA_DESC','Capuchino de origen, notas a cacao.'),
      productId: env?.VITE_BARISTA_ID || null,
      image: u('VITE_BARISTA_IMAGE_URL','https://images.unsplash.com/photo-1504754524776-8f4f37790ca0'),
      ctas:{ primary:{label:'Agregar', action:'add'}, secondary:{label:'Ver café', action:'quickview'} },
      alt: 'Café recomendado del barista'
    },
    { id:'pet', type:'info',
      title:'Pet Friendly 🐾',
      subtitle:'Conoce a Cocoa, nuestra pitbull bonsái. Pide tazón de agua y premios.',
      image: u('VITE_COCOA_IMAGE_URL','https://images.unsplash.com/photo-1619983081563-430f63602796'),
      ctas:{ primary:{label:'Conocer', action:'modal:petfriendly'} },
      alt: 'Cocoa, perrita pitbull bonsái'
    },
    { id:'reviews', type:'info',
      title:'Reseñas',
      subtitle:'¿Te gustó? Cuéntalo en Google ⭐⭐⭐⭐⭐.',
      image: u('VITE_REVIEWS_IMAGE_URL','https://images.unsplash.com/photo-1504674900247-0877df9cc836'),
      ctas:{ primary:{label:'Dejar reseña', action:'link:reviews'} },
      alt: 'Dejar reseña en Google'
    },
  ];
};
