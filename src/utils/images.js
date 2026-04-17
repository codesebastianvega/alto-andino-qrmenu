// src/utils/images.js
// Guía para subir y enlazar imágenes de producto
//
// Dónde subirlas
// - Carpeta: /public/img/products/
// - Ruta pública: /img/products/<archivo>
//
// Cómo enlazarlas
// - Opción A (recomendada): agrega una línea en IMAGE_MAP con el id del
//   producto y la ruta del archivo. Solo quita "//" para activarla.
// - Opción B (automática): si NO hay línea en IMAGE_MAP, se probará
//   /img/products/<id>.png y luego /img/products/<id>.jpg. Si el producto no
//   tiene id, se usa slug(name).
//
// Recomendaciones
// - Usa el id cuando sea simple (ej.: des-sendero.jpg).
// - Para ids con ":" o espacios (smoothies), usa nombre de archivo slug y
//   mapea explícitamente (ej.: smoothie-brisas-tropicales.jpg).
//
// Checklist
// 1) Copia la foto a /public/img/products
// 2) Descomenta la línea correspondiente en IMAGE_MAP
// 3) Guarda y recarga; debería mostrarse en las cards/QuickView

function slugify(s = "") {
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const IMAGE_MAP = {
  // === Desayunos ===
  "des-sendero": "/img/products/des-sendero.jpg", // Sendero Matinal
  // "des-cumbre": "/img/products/des-cumbre.jpg", // Cumbre Energética
  // "des-huevos": "/img/products/des-huevos.jpg", // Huevos al Gusto
  "des-caldo": "/img/products/des-caldo.jpg", // Caldo de Costilla de Res
  "des-amanecer": "/img/products/des-amanecer.jpg", // Bowl Amanecer Andino

  // === Bowls (Prearmado) ===
  "bowl-poke-hawaiano": "/img/products/bowl-poke-hawaiano.jpg",

  // === Platos Fuertes ===
  // "main-salmon": "/img/products/main-salmon.jpg", // Salmón Andino 200 gr
  // "main-trucha": "/img/products/main-trucha.jpg", // Trucha del Páramo 450 gr
  // "main-bolo": "/img/products/main-bolo.jpg", // Spaghetti a la Boloñesa
  // "main-champi": "/img/products/main-champi.jpg", // Champiñones a la Madrileña
  "main-ceviche": "/img/products/main-ceviche.jpg", // Ceviche de Camarón
  // "main-burger": "/img/products/main-burger.jpg", // Burger Andina (Pavo 150 gr)

  // === Sándwiches ===
  // Update: Base products use slug(name) like 'serrano-di-bufala' or 'sandwich-de-cerdo'
  // "sandwich-de-pollo": "/img/products/sandwich-pollo.jpg",
  // "sandwich-de-pavo": "/img/products/sandwich-pavo.jpg",
  "serrano-di-bufala": "/img/products/sandwich-serrano.jpg",
  // "cosecha-del-huerto": "/img/products/sandwich-cosecha.jpg",
  "sandwich-de-cerdo": "/img/products/sancerdo1.png", // ya existente
  
  // Mantener las viejas por si acaso
  "sandwich:serrano": "/img/products/sandwich-serrano.jpg",
  "sandwich:cerdo": "/img/products/sancerdo1.png",

  // === Smoothies ===
  // Usa un nombre de archivo slug y mapea explícitamente (ids traen ":")
  // "smoothie:Brisas Tropicales": "/img/products/smoothie-brisas-tropicales.jpg",
  // "smoothie:El Nectar Andino": "/img/products/smoothie-el-nectar-andino.jpg",
  // "smoothie:Verde Amanecer de la Sabana": "/img/products/smoothie-verde-amanecer-de-la-sabana.jpg",
  // "smoothie:Elixir del Condor (Detox)": "/img/products/smoothie-elixir-del-condor-detox.jpg",
  // "smoothie:Guardian de la Montaña": "/img/products/smoothie-guardian-de-la-montana.jpg",
  // "smoothie:Aurora Proteica": "/img/products/smoothie-aurora-proteica.jpg",

  // === Café e infusiones ===
  // "cof-espresso": "/img/products/cof-espresso.jpg",
  // "cof-americano": "/img/products/cof-americano.jpg",
  // "cof-tinto": "/img/products/cof-tinto.jpg",
  // "cof-capuchino": "/img/products/cof-capuchino.jpg",
  // "cof-latte": "/img/products/cof-latte.jpg",
  // "cof-flat": "/img/products/cof-flat.jpg",
  // "cof-moca": "/img/products/cof-moca.jpg",
  // "cof-choco": "/img/products/cof-choco.jpg",
  // "aro-fresa": "/img/products/aro-fresa.jpg",
  // "inf-chai": "/img/products/inf-chai.jpg",

  // === Bebidas frías (sodas y otros) ===
  // "soda-zen": "/img/products/soda-zen.jpg",
  // "coca-250": "/img/products/coca-250.jpg",
  // "coca-400": "/img/products/coca-400.jpg",
  // "soda-manantial-400": "/img/products/soda-manantial-400.jpg",
  // "agua-manantial-500": "/img/products/agua-manantial-500.jpg",
  // "hatsu-rosas-frambuesa-lata": "/img/products/hatsu-rosas-frambuesa-lata.jpg",
  // "hatsu-uva-romero-lata": "/img/products/hatsu-uva-romero-lata.jpg",
  // "hatsu-uva-romero-botella": "/img/products/hatsu-uva-romero-botella.jpg",
  // "hatsu-albahaca-botella": "/img/products/hatsu-albahaca-botella.jpg",
  // "hatsu-yerbabuena-botella": "/img/products/hatsu-yerbabuena-botella.jpg",
  // "te-hatsu-400": "/img/products/te-hatsu-400.jpg",
  // "te-hatsu-caja-200": "/img/products/te-hatsu-caja-200.jpg",
  // "saviloe-250": "/img/products/saviloe-250.jpg",
  // "savifruit": "/img/products/savifruit.jpg",
  // "electrolit": "/img/products/electrolit.jpg",
  // "go-aloe-sparkling": "/img/products/go-aloe-sparkling.jpg",
  // "cool-drink": "/img/products/cool-drink.jpg",

  // === Postres ===
  // "post-red": "/img/products/post-red.jpg", // Red Velvet
  "post-tres": "/img/products/post-tres.jpg", // Tres Leches (saludable)
  "post-tira": "/img/products/post-tira.jpg", // Tiramisú (saludable)
  // "post-amap": "/img/products/post-amap.jpg", // Torta de Amapola
  // "post-vasca": "/img/products/post-vasca.jpg", // Torta Vasca de Limón
  // "post-fresas": "/img/products/post-fresas.jpg", // Fresas con Crema

  // === Cumbre Andino (postres fríos) ===
  // Ids en runtime: "cumbre:<sabor>"
  "cumbre:rojos": "/img/products/cumbre-rojos.jpg",
  "cumbre:amarillos": "/img/products/cumbre-amarillos.jpg",
  // "cumbre:blancos": "/img/products/cumbre-blancos.jpg",
   "cumbre:choco": "/img/products/cumbre-choco.png",

  // === Veggie (nuevo) ===
  // Descomenta la(s) línea(s) cuando subas las fotos a /public/img/products
  // "veg-tostada-primavera": "/img/products/veg-tostada-primavera.jpg",
  // "veg-cosecha-huerto": "/img/products/veg-cosecha-huerto.jpg",
  // "veg-alfredo-bosque": "/img/products/veg-alfredo-bosque.jpg",
  // "veg-ensalada-jardin-altura": "/img/products/veg-ensalada-jardin-altura.jpg",
  // "veg-pasta-bolonesa": "/img/products/veg-pasta-bolonesa.jpg",
};

export function getProductImage(product) {
  if (!product) return null;

  // 1) Intentar buscar en el mapa local (IMAGE_MAP) PRIMERO (Overrides)
  // Por slug de nombre
  const slugKey = product.name ? slugify(product.name) : null;
  if (slugKey && IMAGE_MAP[slugKey]) return IMAGE_MAP[slugKey];

  // Por ID
  const idKey = product.id || product.productId || product.itemId;
  if (idKey && IMAGE_MAP[idKey]) return IMAGE_MAP[idKey];

  // 2) Buscar en las propiedades de imagen del objeto (Database/AI)
  const directUrl = product.image_url || product.image || product.img || product.imageUrl;
  
  if (directUrl && typeof directUrl === 'string' && directUrl.trim() !== '') {
    // Si es una URL completa o una ruta absoluta
    if (directUrl.startsWith('http') || directUrl.startsWith('/')) {
      return directUrl;
    }
    // Si es una ruta relativa que empieza por img/ o assets/, le ponemos el / inicial
    if (directUrl.startsWith('img/') || directUrl.startsWith('assets/')) {
      return '/' + directUrl;
    }
    // Si parece ser un nombre de archivo en la carpeta de productos por defecto
    if (directUrl.includes('.') && !directUrl.includes('/')) {
      return '/img/products/' + directUrl;
    }
    // En cualquier otro caso, si no es vacío, lo devolvemos tal cual (comportamiento original)
    return directUrl;
  }

  // 3) Fallback automático si no hay URL directa: intentar por ID/Slug en la carpeta img/products
  // Solo si el ID/Slug parece razonable y no es un UUID aleatorio largo
  const key = idKey || slugKey;
  if (key && typeof key === 'string' && key.length < 40 && !key.includes(':')) {
    // No devolvemos nada aquí para evitar falsos positivos de 404, 
    // pero dejamos la lógica lista por si se requiere reactivar.
  }

  return null;
}
