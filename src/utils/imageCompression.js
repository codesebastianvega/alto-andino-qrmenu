/**
 * Comprime y redimensiona una imagen localmente en el navegador, 
 * devolviendo un archivo WebP altamente optimizado.
 *
 * @param {File} file - El archivo de imagen original (JPEG, PNG, etc).
 * @param {Object} options - Opciones de compresión.
 * @param {number} options.maxWidth - Ancho máximo permitido (ej. 800).
 * @param {number} options.maxHeight - Alto máximo permitido (ej. 800).
 * @param {number} options.quality - Calidad de compresión WebP de 0 a 1 (ej. 0.75).
 * @returns {Promise<File>} Una promesa que resuelve al nuevo archivo de imagen (.webp).
 */
export async function compressImage(file, options = {}) {
  const { 
    maxWidth = 800, 
    maxHeight = 800, 
    quality = 0.75 
  } = options;

  // Si no es un archivo o no es una imagen, lo devolvemos tal cual
  if (!file || !file.type.startsWith('image/')) {
    return file;
  }

  // Si ya es un webp y es muy liviano, podríamos saltarnos, pero mejor
  // siempre pasarlo por el canvas para forzar la reducción de resolución y asegurar la máxima compresión.
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcular nueva resolución manteniendo relación de aspecto
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        // Crear canvas para el dibujado
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        
        // Fondo transparente o blanco si la imagen original no tenía transparencia 
        // (pero webp soporta transparencia, así que podemos borrar el lienzo simplemente)
        ctx.clearRect(0, 0, width, height);
        
        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a blob WebP
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error("Error al convertir la imagen a WebP."));
            }
            // Generar nuevo nombre con extensión webp
            const originalNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            const newFileName = `${originalNameWithoutExt}.webp`;
            
            // Devolver como objeto File
            const compressedFile = new File([blob], newFileName, {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/webp',
          quality
        );
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}
