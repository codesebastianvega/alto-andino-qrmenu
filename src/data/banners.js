export const banners = (env) => {
  const u = (k, fb) => env?.[k] || fb;
  const img = (envKey, query, fb) =>
    env?.[envKey] ||
    fb ||
    `https://source.unsplash.com/1200x800/?${encodeURIComponent(query)}`;
  return [
    { id:'featured', type:'product',
      title:'Especial del día',
      subtitle:u('VITE_FEATURED_DESC','Sándwich de cerdo al horno — casero y saludable.'),
      productId: env?.VITE_FEATURED_ID || null,
      image: img('VITE_FEATURED_IMAGE_URL','sandwich, deli, baguette','https://images.unsplash.com/photo-1604908177076-4964a58a9f9a'),
      ctas:{ primary:{label:'Agregar', action:'add'}, secondary:{label:'Ver', action:'quickview'} },
      alt: 'Sándwich especial del día'
    },
    { id:'seasonal', type:'product',
      title:'Producto de temporada',
      subtitle: env?.VITE_SEASONAL_DESC || 'Sabores frescos de estación.',
      productId: env?.VITE_SEASONAL_ID || null,
      image: img('VITE_SEASONAL_IMAGE_URL','seasonal produce, heirloom tomato, basil','https://images.unsplash.com/photo-1501004318641-b39e6451bec6'),
      ctas:{ primary:{label:'Agregar', action:'add'}, secondary:{label:'Ver', action:'quickview'} },
      alt:'Producto de temporada'
    },
    { id:'barista', type:'product',
      title:'Recomendado del barista',
      subtitle:u('VITE_BARISTA_DESC','Capuchino de origen, notas a cacao.'),
      productId: env?.VITE_BARISTA_ID || null,
      image: img('VITE_BARISTA_IMAGE_URL','cappuccino, espresso, latte','https://images.unsplash.com/photo-1495474472287-4d71bcdd2085'),
      ctas:{ primary:{label:'Agregar', action:'add'}, secondary:{label:'Ver café', action:'quickview'} },
      alt: 'Capuchino recomendado'
    },
    { id:'pet', type:'info',
      title:'Pet Friendly 🐾',
      subtitle:'Conoce a Cocoa, nuestra pitbull bonsái. Pide tazón de agua y premios.',
      image: img('VITE_COCOA_IMAGE_URL','friendly dog indoor, pitbull','https://images.unsplash.com/photo-1619983081563-430f63602796'),
      ctas:{ primary:{label:'Conocer', action:'modal:petfriendly'} },
      alt: 'Cocoa, perrita pitbull bonsái'
    },
    { id:'reviews', type:'info',
      title:'Reseñas',
      subtitle:'¿Te gustó? Cuéntalo en Google ⭐⭐⭐⭐⭐.',
      image: img('VITE_REVIEWS_IMAGE_URL','rating, 5 stars, feedback','https://images.unsplash.com/photo-1504674900247-0877df9cc836'),
      ctas:{ primary:{label:'Dejar reseña', action:'link:reviews'} },
      alt: 'Dejar reseña en Google'
    },
  ];
};
