# Release acotada de Aluna — menú QR y onboarding

25 de noviembre de 2026. Rama codex/release-menu-onboarding-20261125, worktree aislado .temp/release-menu-onboarding. Candidato preparado para PR y preview; no se autoriza ni ejecuta fusión o publicación de producción.

## Producción identificada y PR existentes

Vercel muestra Production / Current / Ready para dpl_HJ2ZkpPuvTyyQTeWEXWp5F5fqWEM, commit 007fa21c54310a1825f6e6da300399817c51c5dd, rama main, dominio aluna-qrmenu.vercel.app. Se comprobó en la página visible del deployment, además del estado GitHub Vercel success: https://vercel.com/sebastians-projects-32273a16/aluna-qrmenu/HJ2ZkpPuvTyyQTeWEXWp5F5fqWEM . El main remoto consultado coincide. La referencia main local está atrasada; no se usó como base ni se modificó.

#222 está cerrado/fusionado desde el 22 de noviembre, pero no certifica las correcciones presentes hoy: AdminOnboarding del SHA publicado carece del import de paymentDefaults y conserva la URL defectuosa de omisión. Se portan únicamente sus tres líneas corregidas, sin fusionar su historia ni documentación antigua. #223 permanece abierto, head b0c14d48252f634e70c292a5bd09987fc322fec9, sin modificaciones por esta tarea. Ese head no contiene H05.3 y no debe fusionarse como sustituto de esta release sin revisión posterior.

## Incluido y comprobado

| Hallazgo | Causa / comportamiento de esta release | Dependencias |
| --- | --- | --- |
| H02 | Import del helper existente buildDefaultPaymentMethods; completar conserva los guardados del flujo. | paymentDefaults ya está en main; no nueva API ni medio de pago. |
| H03 | Omitir usa el slug persistido y /?admin_page=orders#admin, también en fallback. | Ninguna migración; no cambia validaciones/copy/diseño. |
| H05 básico | setAllCategories ya existe en main y se conserva; no se reimplementa. | Hotfix ya publicado. |
| H05.1 | Sede válida de URL → principal activa → primera activa; precio específico de sede precede al base, incluido cero. Carta/Boki/QuickView/carrito comparten contexto y conservan extras. | SELECT existentes de configuración y catálogo. |
| H05.2 | Fotografías locales café/croissant, créditos y placeholder por categoría; fallback de foto rota. | Sin dependencias nuevas ni rediseño; fotos de referencia, no propias del negocio. |
| H05.3 | Configuración y promociones por negocio/sede; alcance global solo explícito, actividad/vigencia/usos; cupón anterior de otra sede no se aplica. | Cache nuevo v15 sobre v14 de main; mantiene los especiales actuales. |
| Dependencia pública H09 | Helpers de visibilidad y consultas de lectura; Boki no añade IDs inventados ni recomendaciones ocultadas entre consulta y adición; detalle usa catálogo vigente. | No incorpora Lumi ni operaciones administrativas de ocultar. DIY ya tiene beforeAdd en main y se conserva sin cambiar. |

Las nueve fronteras de producción preservadas constan en evidence/preserved-production-files.json. Los cambios recientes de especial del día/Frijolada y las funciones de programación, recogida, perfil/finanzas no se revierten. No se copiaron archivos completos desde develop ni desde el worktree sucio de #223. Se aplicó el diff público original y los hunks independientes de H05.3, adaptando únicamente la generación de caché a v15.

## Exclusiones expresas

No hay nuevos archivos ni cambios en supabase/, api/, package.json, package-lock.json, órdenes POS/KDS, recetas, inventario, Lumi o planes. Ninguna migración, Edge Function o instrucción de despliegue de backend es requisito de este PR. Las migraciones que main ya contiene siguen como base; no se afirma que se hayan certificado ni se ejecutan.

Quedan fuera H05.4/H05.6/H05.7, C01–C04, SEC01/SEC02 y H10. No se copian sus wrappers RPC, permisos, triggers, propuestas ni los cambios del checkout. El handler handleConfirmOrder conserva exactamente sus 28.107 caracteres (normalizando LF), hash 850f627e789606113a752aee6146cecccc16d1275643d259c6b7d6ce9aad2742. La selección de cupón fuera del handler sí se limita por sede para corregir H05.3. El checkout online sigue usando los INSERT orders/order_items de producción; el offline conserva su RPC existente. No se presenta esa ruta como atómica o segura por haber pasado un mock.

## Validación final

- npm run build: PASS, 1 min 8 s. evidence/build.txt. Avisos de Browserslist y tiempos de plugins, sin actualizar paquetes.
- npm run preview -- --host 127.0.0.1 --port 4207 --strictPort: iniciado sobre el build de esta release.
- 55 pruebas unitarias/regresión PASS: precios, promociones, selector real, visibilidad, DIY/imágenes, programación/tiempos de pedidos y saldos por marca. evidence/unit-tests.txt.
- 11 escenarios de menú en escritorio/móvil: default, URL, recarga, overrides, cambio en Boki/detalle abiertos, carrito, fotos/placeholder, ocultamiento y ausencia de sede.
- 10 escenarios H05.3: Norte 6000, Principal 4500, global 5200, global desactivado, sin herencia local, caché/reload v15 y cupón ineligible.
- 10 escenarios onboarding: omitir desde cuatro pasos y completar con helper/payloads correctos, escritorio y móvil. Se compila el componente real con Auth/Supabase/navigation sintéticos; no certifica Auth real ni persistencia remota ni render del panel completo.
- 2 escenarios checkout online de producción: escritorio/móvil; captura de sede Principal, precio 5000, artículo/total, éxito simulado y carrito vacío. Todos los INSERT interceptados, ningún pedido real. Las solicitudes de prueba previas fallaron por inicialización/estado del navegador o Toast; los resultados finales están en evidence/checkout.
- Total navegador: 33 escenarios finales, cero excepciones JS capturadas. Boki usa una respuesta LLM simulada; no certifica todos los proveedores. Los GET iniciales son públicos; TODAS las escrituras del navegador se resuelven localmente.

Pruebas reproducibles:

    node --test tests/menuPricing.test.mjs tests/menuPromotions.test.mjs tests/productVisibility.test.mjs tests/menuPricingSelector.test.mjs tests/diy.test.mjs tests/diyImages.test.mjs tests/orderScheduling.test.mjs tests/orderTiming.test.mjs tests/customerAccount.test.mjs
    node tests/releaseOnboarding.preview.mjs
    H051_PREVIEW_PORT=4207 H051_EVIDENCE_DIR=<directorio> node tests/menuPricing.preview.mjs
    H051_PREVIEW_PORT=4207 H051_EVIDENCE_DIR=<directorio> node tests/menuPricing.preview.mjs --promotions
    H051_PREVIEW_PORT=4207 H051_EVIDENCE_DIR=<directorio> node tests/menuPricing.preview.mjs --orders

En PowerShell definir las variables mediante $env:. El runner de menú requiere .env.local con configuración pública, nunca versionada. Por defecto usa Edge de pruebas; PLAYWRIGHT_CHANNEL puede seleccionar otro navegador instalado.

## Riesgos y requisitos para autorizar publicación

1. Certificar el preview del nuevo PR y su SHA, no el preview antiguo de #223. Login real y onboarding contra una cuenta/sede de staging autorizada requieren escrituras adicionales expresamente autorizadas. No se crearon negocios para esta tarea.
2. La publicación de este frontend no resuelve las vulnerabilidades anteriores de lectura anónima, precios/totales autoritativos ni disponibilidad al confirmar productos ya guardados en carrito. SEC01/SEC02/H05.4 siguen fuera; si la exigencia de publicación incluye certificar esos controles, son BLOQUEANTES y esta release no es certificación de seguridad integral. No fusionar migraciones no certificadas para ocultar esa limitación.
3. Toast preexistente puede interceptar el centro de un botón móvil aun tras ocultarse visualmente. El smoke final de checkout usa el extremo visible del botón, sin force ni DOM modificado; documentar esta fricción en la revisión móvil. No se rediseña ni corrige Toast en este alcance.
4. Sin pruebas reales de pedido ni cargas POS/KDS/remotas: el handler preservado y los mocks muestran no regresión del camino probado, no atomicidad remota ni concurrencia. Funciones/planes/recetas existentes no se certifican nuevamente.
5. H05 y su certificación publicada continúan en progreso. El checklist canónico en develop no se modifica ni se incluye en esta release. No se mezclan los 25 fixes o su recuperación documental con el producto.

## Procedimiento de publicación y verificación, todavía sin ejecutar

1. Revisar diff del PR contra main vigente. Confirmar que ningún cambio posterior de main exige rebase/nueva validación y que no aparecen supabase/, módulos ajenos o paquetes.
2. Probar el preview en escritorio/móvil: Café Bruma con/sin loc Principal, otra sede simulada, precios en las cuatro superficies, fotos y fallback; completar/omitir onboarding usando el entorno autorizado. Con datos existentes no mutables confirmar el catálogo público anónimo. No cambiar precios/productos reales para fabricar casos.
3. Resolver explícitamente los límites de seguridad y Toast antes de autorizar producción según el alcance comercial aceptado. PR en borrador hasta esa revisión.
4. Solo con autorización posterior, fusionar el PR; la conexión Vercel de main publicará producción. Comprobar el nuevo deployment como Production / Current y el SHA resultante, recargar sin sesión y repetir smoke. No marcar H05 verificado antes.
5. Reversión frontend: revertir únicamente el commit de esta release mediante un PR separado o promover el deployment anterior verificado con autorización. No revertir main completo ni tocar datos o migraciones Supabase. Este PR no requiere rollback SQL.

No se fusionó, se desplegó producción ni se hicieron escrituras remotas Supabase. La publicación de rama/PR puede generar un preview automático. Se conservan las ramas y worktrees anteriores.
