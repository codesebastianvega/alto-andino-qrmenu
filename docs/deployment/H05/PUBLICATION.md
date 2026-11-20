# H05.1 — Publicación aislada de precios por sede

Preparado el 20 de noviembre de 2026. Base exacta: `main` en `1034e4e7f967e84a3057e6c2646ec7f044793eae`. Rama: `codex/h05-1-public-prices`. Se creó un worktree desde ese commit; no se fusionó ni se copió el árbol completo de `develop`. #222 permanece independiente.

## Comportamiento

La carta mostraba la sede principal por defecto pero tomaba el precio base cuando la selección administrativa era `all`. Ahora el catálogo público, Boki, QuickView y carrito comparten una sede efectiva y el precio resuelto para ella.

Precedencia: sede activa válida en URL (`loc`, `location_id`, `sede_id`) → sede principal activa → primera sede activa. El público no hereda la sede de la sesión administrativa. Para esa sede, `location_product_prices.price` no nulo prevalece sobre `products.price`, incluido un override cero. Las promociones existentes de Especial del Día conservan su precedencia posterior. Sin sedes activas se comunica la ausencia de sede disponible y no se ofrecen productos.

En la configuración consultada de Café Bruma, el café conserva precio base $5.500 y precio de Sede Principal $5.000; el valor efectivo en esa sede es $5.000. No se cambian precios almacenados.

QuickView y las sugerencias previas de Boki se resuelven por ID contra el catálogo actual; el carrito conserva cantidades, notas y extras al cambiar de sede. Se preservan los metadatos locales de planes. Las líneas personalizadas sin una base identificable se conservan sin repricing especulativo.

## Archivos de aplicación incluidos

| Grupo | Archivos | Motivo |
| --- | --- | --- |
| Resolución de precios | `src/utils/menuPricing.js`, `src/context/MenuDataContext.jsx`, `src/context/CartContext.jsx` | Una sede y un precio efectivo compartidos; preservar extras y overrides. |
| Superficies públicas | `src/App.jsx`, `src/components/ProductQuickView.jsx`, `src/pages/AIChatWaiterPage.jsx` | Estado sin sede y actualización de productos guardados en memoria. |
| Dependencia pública H09 | `src/utils/productVisibility.js`, `src/services/productAvailability.js`, `src/components/DIYProductModal.jsx` | No habilitar productos ocultos a través de recomendaciones antiguas o el armador; consultas exclusivamente de lectura. |
| Fotos/placeholders requeridos | `src/utils/images.js`, `src/utils/productPlaceholder.js`, `src/components/ui/AAImage.jsx`, `src/components/ProductCard.jsx`, `src/components/CartModal.jsx` | Misma imagen y fallback en carta, Boki, detalle y carrito. También conexiones puntuales en MenuDataContext/QuickView/Boki. |
| Recursos | `public/img/products/cafe-americano.jpg`, `public/img/products/croissant.jpg`, `public/img/products/PHOTO_CREDITS.md` | Fotos reales de referencia locales, revisadas visualmente; no fotografías propias del negocio. |

Las imágenes son la parte previamente registrada como H05.2 que el alcance de este PR exige conservar. No se introduce un rediseño ni una dependencia de paquete. Se mantiene la prioridad de imágenes locales mapeadas; productos sin fotografía usan ilustración por categoría. Ante una URL fallida se muestra el placeholder, y el fallo se asocia a esa URL, no a futuras imágenes del componente.

## Dependencia exacta de H09

Se extrajeron únicamente `isOrderableVisibility` y `getVisibilityLocationId` del helper local H09 hacia `productVisibility.js`, sin cambiar sus cuerpos; se comprobó igualdad literal de ambas funciones. No se importa `alunaVisibility.js`, porque arrastraría interpretación conversacional, propuestas y dependencias de Lumi.

El servicio `canOrderProductNow` hace `SELECT` del producto filtrado por ID y negocio y del estado filtrado por producto y sede. Un error o un producto global inactivo/agotado o estado local oculto/agotado impide añadir. Boki conserva sus controles de adición concurrente, rechaza productos inventados por el LLM y comprueba disponibilidad antes de añadir/abrir detalle. QuickView y DIY respetan el callback `beforeAdd`. En DIY solo cambian ese prop y la espera antes de añadir; no se cambian recetas, configuración o cálculo del armador.

No se incluyen creación/ocultamiento conversacional de productos, operaciones de Lumi, suscripción, compras, inventario, H02/H03, migraciones o despliegues de Edge Functions. Los hotfixes y otras funcionalidades ya presentes en `main` permanecen como base, sin nuevos cambios en esos módulos.

## Validación del paquete aislado

```powershell
npm run build
npm run preview -- --host 127.0.0.1 --port 4182 --strictPort
node --test tests/menuPricing.test.mjs tests/productVisibility.test.mjs tests/menuPricingSelector.test.mjs tests/diy.test.mjs tests/diyImages.test.mjs
node tests/menuPricing.preview.mjs
```

- Build aprobado, exit 0, 54,33 s. Avisos informativos de Browserslist/timing de plugins; no se actualizaron dependencias. [Log](evidence/H05.1/build.txt).
- **23 pruebas aprobadas** en esta rama. Incluyen el selector real de MenuDataContext: sede $5.000/$6.500, base sin override, administración agregada, promociones, exclusión de productos globalmente inactivos/agotados, ocultos por sede y adiciones. El servicio de disponibilidad real se ejecuta con Supabase simulado y se verifica que limita sus lecturas a producto/negocio/sede. Incluye regresiones de DIY e imágenes existentes. [Resultados](evidence/H05.1/unit-tests.txt).
- Smoke del build real: escritorio y móvil 390×844; carta, Boki, QuickView y carrito; recarga; segunda sede simulada; cambios de contexto con conversación/detalle abiertos; fotografía fallida; sede ausente y visibilidad. El precio unitario del carrito se comprueba separado del total por cantidad. [Resultados](evidence/H05.1/preview-results.json).
- Los GET iniciales usan datos públicos de Café Bruma. Después se interceptan todas las solicitudes del navegador al backend: cualquier escritura se resuelve localmente y el LLM es simulado por IDs. Sede adicional, ocultamiento y errores de imagen solo existen en el test. Cero escrituras remotas y ningún pedido confirmado.
- Diff revisado contra la base exacta y sin errores de whitespace. Solo archivos enumerados de H05.1, dependencias públicas e imágenes, pruebas y evidencias. `.env.local` y `dist` excluidos de Git. Sin modificaciones de `main`, `develop` remoto o #222.

El test requiere configuración anónima local en `.env.local`; nunca se incluye ese archivo en el PR. El puerto puede cambiarse mediante `H051_PREVIEW_PORT`. La opción `--visual-only` actualiza solo capturas enfocadas y conserva el resultado del smoke completo.

## Checklist y límites

| Hallazgo | Estado |
| --- | --- |
| H05 | 🔄 En progreso — pendiente de versión publicada en Vercel |
| H05.1 | 🔄 En progreso — implementación y paquete aislado probados localmente, falta producción |

`main` aún no tiene `docs/ALUNA_FIX_CHECKLIST.md`; ese archivo pertenece al PR #222. Para no incorporar sus otros hallazgos ni generar un conflicto de alta/alta, este PR registra solo H05/H05.1 aquí. El checklist completo del workspace `develop` mantiene las 25 filas y sus estados intactos.

Esta validación no certifica todos los proveedores LLM reales, cada combinación histórica de planes/armadores ni una compra real. El bloqueo previo de la confirmación «Vaciar carrito» está fuera del paquete; no se corrigió ni se forzó en las pruebas.

## Verificación en Vercel después de autorización de producción

1. Comprobar que el deployment Production / Current corresponde al commit resultante autorizado de este PR y que el dominio canónico apunta a él. Un preview no cierra H05.
2. Abrir sin sesión `https://aluna-qrmenu.vercel.app/caf-bruma-prueba-ux-14-nov-mwgj65c1/#menu`; comprobar sede mostrada, categoría Desayunos UX, café y croissant con descripciones correctas.
3. Repetir con `?loc=58f1d5d4-5eb3-4509-8584-ab7ea13d6db4#menu`. Según la configuración actual, ambas rutas deben mostrar café $5.000 y croissant $7.000. Si la configuración cambia, contrastar los valores vigentes antes de concluir.
4. En escritorio y móvil, recargar, abrir QuickView, añadir localmente al carrito y consultar Boki. Comparar precio unitario, cantidades, total e imagen; no confirmar un pedido para esta comprobación.
5. Con otra sede ya autorizada, comprobar que conserva sus propios precios. No crear sedes ni modificar precios para fabricar la prueba.
6. Verificar un producto ya inactivo/oculto y un control activo; no cambiar productos reales. Revisar consola y carga de fotografías/placeholders.
7. Registrar URL, SHA, sedes, datos contrastados y capturas. Solo entonces marcar H05 ✅ en el checklist que esté vigente; si falla algo, conservar 🔄 y documentar el bloqueo.

No se fusiona ni se despliega producción en esta tarea. El usuario autorizó exclusivamente el preview automático asociado al PR.
