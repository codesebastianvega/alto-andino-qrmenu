# Constructor de Flyer Diario — Boku Bento

## Alcance y acceso

Rama `codex/boku-daily-flyer`, worktree `.temp/boku-daily-flyer`, preparada para publicación autorizada.
Aluna → Boku → Administración de Carta → Flyer Diario Boku.
URL local: http://127.0.0.1:5250/boku-bento/?admin_page=boku_flyer#admin
Catálogo vivo de MenuDataContext, imágenes mediante getProductImage, importes con formatCOP.
Exclusivo de Boku; no modifica catálogo, pedidos, autenticación, checkout ni inventario.

## Composición revisada

Lienzo 1080 × 1350 px, Inter, rojo Boku, fondo neutro, fotos y tarjetas de la identidad del menú.
Encabezado compacto sin tarjeta de gran tamaño. Dos promociones a $19.000 con precio normal
real tachado y mensaje editable «Incluyen sopa del día + jugo» junto al encabezado de promociones.
Galería principal de tres columnas: seis platos en dos filas en la propuesta inicial.
Galería inferior independiente para pokes, entradas u otros productos seleccionados.
Todos los productos llevan fotografía, nombre y precio; no existen filas publicitarias sin foto.
El espacio se redistribuye al ocultar extras y la exportación bloquea desbordamientos y fotos faltantes.

La propuesta inicial elige los dos destacados actuales, los demás bentos y completa seis plazas
centrales con las pastas existentes. Añade hasta tres pokes disponibles como extras. No duplica
productos ni inventa bentos si el catálogo no tiene seis adicionales.
Se permiten más selecciones mientras quepan con fotos y texto legibles.

## Panel

Tres pasos: Platos, Textos y Descargar. Miniaturas reales para elegir, buscador y controles de orden.
Panel con desplazamiento propio en escritorio y botón de descarga siempre accesible.
Vista previa completa ajustada a altura y anchura disponibles, sin cambiar dimensiones de exportación.
En pantallas pequeñas el panel y la vista previa se apilan.
Títulos, mensaje de sopa y jugo, pie, nombres y descripciones se editan solo para el flyer.
Se pueden ocultar extras, mensaje de incluidos, descripciones, nota al pie y precio «desde».

## Precios dinámicos

Las tarjetas muestran el precio vigente normalizado por MenuDataContext; el precio normal tachado
se conserva si es mayor. Las promociones del flyer conservan el importe solicitado de $19.000.
«Desde» se calcula con el mínimo **vigente** de los extras seleccionados y visibles, no con su
precio base anterior. El panel de Textos identifica el producto que determina ese mínimo.
Cambiar un extra o su precio en el catálogo cambia el mínimo; no se fija $28.000 o $30.000.
No se altera la configuración de precios del negocio para hacer coincidir un valor esperado.

## Exportación y validación

html-to-image.toJpeg con quality 0.95, pixelRatio 2: JPG 2160 × 2700.
Fotografías y logo preparados mediante CORS y URLs de datos, con decodificación verificada.
Fuente Inter local con licencia OFL e incrustada en el JPG. Controles fuera del nodo exportable.
Sin fixtures, fotografías inventadas ni catálogo duplicado para las pruebas visuales.

Validación del 26 de noviembre de 2026:
- `node --test tests/bokuFlyer.test.mjs`: siete pruebas aprobadas (precios vigentes, alias,
  duplicados entre galerías, propuesta inicial y capacidad del lienzo).
- `npm run build`: aprobado; preview en 127.0.0.1:5250.
- Microsoft Edge con sesión administrativa real de Boku.
- Once platos distintos: dos destacados, seis centrales y tres extras; todas las fotos cargadas,
  lienzo 1080 × 1350, cero controles internos y cero desbordamientos observados.
- Edición del mensaje de sopa/jugo y activación de descripciones verificadas en la vista previa.
- Ocultar extras deja ocho fotografías y redistribuye el espacio sin desbordamientos.
- Seleccionar una sola promoción desactiva la descarga hasta volver a completar dos.

Las evidencias de esta revisión se guardan en `.temp/flyer-evidence/` (ignorado por Git).

Exportación final revisada: `.temp/flyer-evidence/boku-once-platos.jpg`, 2160 × 2700,
1279335 bytes, once fotos presentes, sin controles ni textos cortados.
Captura del panel y composición: `.temp/flyer-evidence/boku-constructor-v2.jpg`.
En el catálogo vivo consultado, los tres pokes seleccionados tienen $31.000, $30.000 y
$32.000: el mínimo de esa selección es $30.000. El producto de $28.000 visible en la
galería principal es Conchiglie Rosso Fusión. Esta revisión no cambia precios remotos.

## Preparación para publicación

Se añadió guardado automático local, separado por usuario y negocio. Conserva selección, orden,
textos y visibilidad al recargar en el mismo navegador y origen. No sincroniza entre equipos.
No guarda fotografías, precios ni registros del catálogo: se actualizan desde la fuente vigente.
Si un producto guardado deja de existir, se pide revisar la selección antes de exportar.
Errores de almacenamiento se informan sin impedir la edición y descarga.
Las pruebas incluyen borradores inválidos, aislamiento de cuentas y restauración sin precios congelados.
