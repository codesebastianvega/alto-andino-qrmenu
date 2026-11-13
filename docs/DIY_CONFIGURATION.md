# Configurar un producto DIY

1. En Modificadores, crea los grupos que serán pasos. Define mínimo, máximo,
   porciones incluidas y si se permite repetir una opción.
2. Crea las opciones. Cada una tiene nombre, imagen inicial, precio adicional,
   precio de porción extra y disponibilidad. Un cero explícito significa gratis.
3. Para una elección dependiente, crea otro grupo con sus opciones y vincúlalo
   desde «Desplegar sub-opciones». El enlace determina la relación; el nombre
   no cambia el comportamiento ni el precio. No se permiten enlaces circulares.
4. En cada subopción configura la imagen del resultado final y su recargo.
   Esa foto reemplaza la imagen inicial al elegir la subopción. Sin foto final
   se conserva la imagen del ingrediente. Cada porción tiene su propia elección.
5. En Productos, activa «Arma tu Propio (DIY)», asigna y ordena los grupos
   principales. No es necesario asignar los grupos dependientes como pasos.

## Imágenes y alojamiento

El campo admite una URL HTTP(S) o una ruta estática del sitio como
`/img/ingredients/raw-chicken.webp`. No carga archivos: el archivo debe existir
en el alojamiento indicado. Comprimirlo antes de publicarlo reduce transferencia.
Una ruta estática se sirve desde el alojamiento de la aplicación, no Supabase.
Una URL de Supabase Storage sí consume transferencia de ese servicio.

La biblioteca local de BOKU está en `src/data/diyImageLibrary.json`, separada del
motor, con imágenes por marca y ID de opción. Una imagen explícita guardada por
el administrador tiene prioridad. No se deducen fotos a partir de nombres.
Los archivos nuevos deben publicarse junto con la aplicación; por eso no se
escriben rutas de archivos aún no publicados en la base de datos de producción.

## Precio y pedido

El precio final es el precio del producto más los recargos configurados.
Las porciones incluidas usan el precio adicional de la opción (por ejemplo una
opción premium). Las repetidas o que exceden las incluidas usan el precio extra;
si está vacío, heredan el precio adicional. No hay recargos automáticos por nombre.
Las subopciones se cobran por su instancia: una elección por cada porción padre.

El resumen cuenta las porciones principales, no sus preparaciones. El carrito
y los tickets reciben cada ingrediente junto con sus elecciones dependientes,
por ejemplo «Pollo · Teriyaki». Dos porciones con estilos distintos conservan
sus elecciones y recargos por separado. Quitar una porción también quita sus
dependencias y conserva las de las porciones restantes.
