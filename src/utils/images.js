// src/utils/images.js
import imageCompression from 'browser-image-compression';
import { PLAN_LIMITS_BY_ID } from '../config/plans';

/**
 * Obtiene las opciones de compresión según el plan.
 */
export const getCompressionOptions = (planId) => {
  const planLimits = PLAN_LIMITS_BY_ID[planId] || { image_max_mb: 0.1, max_width: 800 };
  
  return {
    maxSizeMB: planLimits.image_max_mb || 0.1, // Peso final objetivo WebP
    maxWidthOrHeight: planLimits.max_width || 800, // Resolución máxima
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: planLimits.image_max_mb > 0.5 ? 0.85 : 0.75, // Mejor calidad para planes altos
  };
};

/**
 * Obtiene el límite en MB según el plan_id para mostrar en la interfaz.
 */
export const getMaxImageSizeMB = (planId) => {
  const planLimits = PLAN_LIMITS_BY_ID[planId] || { image_max_mb: 0.1 };
  return planLimits.image_max_mb || 0.1;
};

/**
 * Comprime una imagen y la convierte a formato WebP.
 * @param {File} file El archivo original
 * @param {string} planId El ID del plan del usuario
 * @returns {Promise<File>} El archivo comprimido en formato WebP
 */
export const compressAndWebp = async (file, planIdOrOptions = null, customOptions = null) => {
  let planId = null;
  let options = null;

  if (planIdOrOptions && typeof planIdOrOptions === 'object') {
    options = planIdOrOptions;
  } else {
    planId = planIdOrOptions;
    options = customOptions;
  }

  const finalOptions = options || getCompressionOptions(planId);

  try {
    const compressedFile = await imageCompression(file, finalOptions);
    // Asegurarnos de que el nombre termine en .webp
    const fileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    return new File([compressedFile], `${fileName}.webp`, { type: 'image/webp' });
  } catch (error) {
    console.error('Error comprimiendo imagen:', error);
    return file; // Si falla, devolvemos el original
  }
};

// Guía para subir y enlazar imágenes de producto...
// (Comentarios originales)
function slugify(s = "") {
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Máximo tamaño permitido inicial en el navegador (10MB) para no crashear la memoria antes de comprimir
export const MAX_INITIAL_FILE_MB = 10;

/**
 * Verifica si una URL es externa (Unsplash, Google, etc.)
 */
export const isExternalUrl = (url) => {
  if (!url) return false;
  return url.startsWith('http') || url.startsWith('https');
};

/**
 * Convierte un link de Google Drive (compartir) a un link directo de imagen.
 */
export const convertDriveLink = (url) => {
  if (!url) return url;
  
  const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
  }
  
  const driveOpenMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
  if (url.includes('drive.google.com') && driveOpenMatch && driveOpenMatch[1]) {
    return `https://drive.google.com/uc?export=view&id=${driveOpenMatch[1]}`;
  }

  return url;
};

/**
 * Valida si el archivo de imagen excede el límite de memoria del navegador antes de comprimir.
 */
export const getSafeImageUrl = (url, fallback = null) => {
  if (!url || typeof url !== 'string') return fallback;

  const value = url.trim();
  if (!value) return fallback;

  try {
    const imageUrl = new URL(value);
    const currentSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const currentSupabaseHost = currentSupabaseUrl ? new URL(currentSupabaseUrl).host : null;
    const isSupabaseStorage = imageUrl.hostname.endsWith('.supabase.co') && imageUrl.pathname.includes('/storage/');

    if (isSupabaseStorage && currentSupabaseHost && imageUrl.host !== currentSupabaseHost) {
      return fallback;
    }
  } catch {
    // Relative paths are valid image sources.
  }

  return value;
};

export const validateImageSize = (file, toast = null) => {
  if (!file) return false;
  
  const maxBytes = MAX_INITIAL_FILE_MB * 1024 * 1024;

  if (file.size > maxBytes) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const errorMsg = `La imagen original es demasiado grande (${sizeMB}MB). Por favor selecciona una imagen de menos de ${MAX_INITIAL_FILE_MB}MB.`;
    
    if (toast && typeof toast.error === 'function') {
      toast.error(errorMsg);
    } else {
      alert(errorMsg);
    }
    return false;
  }
  return true;
};


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
  const directUrl = getSafeImageUrl(product.image_url || product.image || product.img || product.imageUrl);
  
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
