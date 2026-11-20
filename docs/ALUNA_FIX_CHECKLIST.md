# Checklist de fixes de Aluna

Fuente: tabla H01–H25 de la auditoría UX local del 14 de noviembre de 2026, sección 5. El informe completo (`docs/ux-audit-aluna-2026-11-14/INFORME-UX-ALUNA.md`) queda fuera del PR de estos fixes. No se encontró `Texto pegado.txt` en el workspace; se conserva la tabla del informe de esta conversación.

Estados: ⬜ Pendiente · 🔄 En progreso · ✅ Verificado.

Las prioridades y descripciones se conservan literalmente. Un hallazgo pasa a ✅ Verificado solo después de superar sus validaciones. Los demás estados no se modifican al cerrar un fix.

| ID | Prioridad | Descripción | Impacto principal | Casos | Estado |
|---|---|---|---|---|---|
| H01 | Crítica | Recuperación de receta afirma café, prepara creación de croissant. | Riesgo de aprobar una entidad y operación equivocadas. | J14 | ⬜ Pendiente |
| H02 | Alta | Finalizar onboarding muestra función no definida. | Impide completar el camino normal de activación. | J03 | ✅ Verificado |
| H03 | Alta | Omitir devuelve al onboarding; se necesitó recargar para entrar. | Recuperación oculta y estado de guardado incierto. | J03 | ✅ Verificado |
| H04 | Alta | Cambio de precio pierde $5.500 y falla con campos no admitidos. | Tarea operativa central no completada. | J12 | ⬜ Pendiente |
| H05 | Alta | Carta pública vacía con productos/categoría activos en administración. | El negocio no ve publicada su oferta por esa ruta. | J11, J17 | 🔄 En progreso |
| H06 | Alta | Condiciones comerciales contradicen comisión, gratuidad y mensualidad. | Decisión de compra sin información consistente. | J01 | ⬜ Pendiente |
| H07 | Alta | Promete adjuntar archivo; el CTA probado solo envía texto y falla. | Importación no iniciable por el camino ofrecido. | J08 | ⬜ Pendiente |
| H08 | Alta | Texto afirma precio corregido; borrador mantiene precio vacío. | Repetición de trabajo y pérdida de confianza. | J06, J07 | ⬜ Pendiente |
| H09 | Alta | Ocultar promete propuesta pero no crea una acción de aprobación nueva. | Conversación sin continuidad ejecutable. | J13 | ⬜ Pendiente |
| H10 | Alta | Compra aprobada falla; menú inventario exige otro plan. | Acción ofrecida sin aclarar disponibilidad y sin resultado comprobable. | J15 | ⬜ Pendiente |
| H11 | Alta | Horarios incompletos producen tarjeta aprobable sin detalle de cambio. | Usuario no puede revisar qué autoriza. | J20 | ⬜ Pendiente |
| H12 | Media | Chat se reinicia al volver de Lab. | Contexto y trabajo pendiente no se recuperan visiblemente. | J16 | ⬜ Pendiente |
| H13 | Media | Auditoría marca contenido listo con cero productos y puntúa 68/100. | Sensación de preparación sin evidencia suficiente. | J09 | ⬜ Pendiente |
| H14 | Media | Campos de contacto marcados obligatorios admiten avance vacíos. | Reglas del formulario poco confiables. | J03 | ⬜ Pendiente |
| H15 | Media | Lab accesible en cuenta nueva pese al alcance exclusivo indicado. | Experimento entra en el recorrido comercial general. | J21 | ⬜ Pendiente |
| H16 | Media | Copy de cocina andina, Boki y escape literal en cafetería nueva. | Identidad del negocio contaminada por defaults. | J17 | ⬜ Pendiente |
| H17 | Media | Cards de Lumi dicen sin descripción, aunque existe. | Datos contradictorios entre superficies. | J11 | ⬜ Pendiente |
| H18 | Media | Chat declara un producto por vez; asistente acepta diez. | Capacidad difícil de descubrir y explicación incorrecta. | J06, J10 | ⬜ Pendiente |
| H19 | Media | Propuestas viejas siguen con controles después de cambiar de intención. | Dudas sobre qué operación se aprobará. | J07, J13 | ⬜ Pendiente |
| H20 | Media | Contadores de consultas cambian de forma difícil de reconciliar. | Incertidumbre sobre consumo y límites. | J16, J20 | ⬜ Pendiente |
| H21 | Media | Costos desconocidos aparecen como $0 en Lab. | Interpretación económica incorrecta. | J21 | ⬜ Pendiente |
| H22 | Media | Aprobar y Ejecutar abre otro formulario de aprobación. | La etiqueta no describe su resultado; trabajo duplicado. | J12 | ⬜ Pendiente |
| H23 | Media | Errores técnicos en inglés sin explicación ni recuperación. | Cliente no sabe si reintentar o verificar cambios. | J03, J08, J12, J14, J15 | ⬜ Pendiente |
| H24 | Media | Plan Premium en portal de Boku y Esencial en Lumi. | Restricciones y beneficios poco comprensibles. | J01, J04 | ⬜ Pendiente |
| H25 | Baja | “MVP”, “BD”, “products”, “medium” e identificadores técnicos. | Carga de interpretación ajena al trabajo del restaurante. | Varios | ⬜ Pendiente |

## Validación de H02 — 14 de noviembre de 2026

- Rama: `develop` local, creada desde el checkout inicial porque no existía ni localmente ni en el remoto. `main` no se modifica. Sin commit, PR, push ni despliegue.
- Causa raíz: `AdminOnboarding.jsx` usaba `buildDefaultPaymentMethods` sin importarlo. La función ya está definida y exportada en `src/utils/paymentDefaults.js`.
- Cambio de aplicación: una línea de import en `src/pages/AdminOnboarding.jsx`. Sin cambios a diseño, copy, planes, validaciones, consultas de guardado ni lógica de Omitir.
- `npm run build`: aprobado, salida 0, 3283 módulos transformados. Avisos informativos de Browserslist desactualizado y tiempo de plugins; no impidieron compilar.
- `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort`: iniciado correctamente; build probado en Edge en `http://127.0.0.1:4173/`.
- Smoke visual con la cuenta de prueba existente: crear marca `Smoke Onboarding H02 1411`, avanzar Identidad → Contacto → Legal → Estilo, seleccionar color y pulsar Completar Configuración. Se salió a `?admin_page=checkout#admin` sin el ReferenceError ni errores/avisos capturados en consola.
- Persistencia real: Perfil Comercial mostró nombre/slug, `Ciudad de prueba H02`, `Colombia` y `Dirección ficticia smoke H02`; esos campos siguieron presentes después de recargar.
- Regresión aislada: se ejecutó el `handleSubmit` del archivo real con el helper real y almacenamiento Supabase simulado. El código anterior reprodujo `buildDefaultPaymentMethods is not defined`; el código corregido pasó tres escenarios: sin métodos ni teléfono, sin métodos con teléfono y con un método existente. Se comprobaron marca completada, datos de marca, color/razón social de ajustes, creación de sede, métodos esperados, refresco y navegación.
- Límite: el smoke visual de Nueva Marca parte de métodos sembrados por el portal; la rama sin métodos se verificó adicionalmente con el ensayo aislado, no borrando métodos reales. El color y la razón social se verificaron en el payload del ensayo aislado; no se afirma una lectura directa de esos dos campos en la base real.
- La marca de smoke queda disponible en la cuenta de prueba. No se contrató una suscripción ni se confirmó un pedido.
- H03 y todos los demás hallazgos permanecen pendientes; esta validación no los cierra.

Evidencias:

- [Salida del onboarding en preview](ux-audit-aluna-2026-11-14/evidencias/H02-preview-completado.png).
- [Perfil con datos guardados](ux-audit-aluna-2026-11-14/evidencias/H02-perfil-guardado.png).
- [Estado textual del perfil](ux-audit-aluna-2026-11-14/evidencias/H02-perfil-guardado.txt).

## Validación de H03 — 14 de noviembre de 2026

- Rama: `develop`. Sin commit, PR, push ni despliegue; `main` permanece intacta.
- Causa raíz: `handleSkip` construía `/#admin?admin_page=orders`, dejando la consulta dentro del fragmento, en lugar del formato `/?admin_page=orders#admin` que usa el panel. También priorizaba el slug editable de un borrador no guardado sobre el slug persistido de la marca.
- Corrección: únicamente las dos URLs de `navigate` dentro de `handleSkip` (salida normal y fallback) usan la consulta antes del fragmento y el slug persistido como primera opción. Se mantienen las escrituras existentes, el refresco de perfil y `replace: true`.
- El import de `buildDefaultPaymentMethods` de H02 y el cuerpo de `handleSubmit` no se modificaron. Sin cambios a diseño, copy, validaciones, navegación global ni persistencia de los pasos.
- `npm run build`: aprobado, salida 0; 3283 módulos transformados. Avisos informativos de Browserslist y tiempos de plugins.
- `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort`: iniciado correctamente y smoke ejecutado en Edge sobre el build actualizado.
- Identidad: marca `Smoke H03 Identidad`; se editó el slug a `slug-sin-guardar-h03`, se pulsó el botón superior Omitir y se llegó a Pedidos por el slug persistido `smoke-h03-identidad-mwgoq1b7`, sin recargar.
- Contacto: marca `Smoke H03 Contacto`, slug `smoke-h03-contacto-mwgord5y`; se escribió un borrador de ciudad y se omitió. Se llegó directamente a Pedidos, sin recargar ni ejecutar el guardado completo de los pasos.
- Legal: marca `Smoke H03 Legal`, slug `smoke-h03-legal-mwgosrtg`; omitir desde el tercer paso llevó directamente a Pedidos sin recargar.
- Estilo: marca `Smoke H03 Estilo`, slug `smoke-h03-estilo-mwgou284`; omitir desde el cuarto paso llevó directamente a Pedidos sin recargar.
- En las cuatro salidas se observó `?admin_page=orders#admin` y el encabezado Pedidos, sin el formulario de onboarding. Ambos botones Omitir existentes comparten el mismo handler; el smoke visual usó el botón superior solicitado.
- Retorno/persistencia de la omisión: desde el caso Estilo se navegó a Carta Principal, se volvió a Pedidos y luego se recargó. Continuó en Pedidos y no reapareció el onboarding.
- Regresión H02: una quinta marca, `Smoke H03 Regresion H02` (`smoke-h03-regresion-h02-mwgovb8p`), recorrió los cuatro pasos y completó normalmente. No apareció el ReferenceError; Perfil Comercial mostró la ciudad guardada `Regresion H02 tras H03`.
- Consola: no se capturaron errores ni avisos en los controles realizados tras la omisión de Estilo y la finalización normal de H02.
- Las cinco marcas de smoke quedan identificadas en la cuenta de prueba. No se confirmó ningún pedido ni se contrató una suscripción.
- Único cambio de estado en esta intervención: H03 → ✅ Verificado. H02 conserva su estado y los demás hallazgos no cambian.

Evidencias:

- [Omitir desde Identidad](ux-audit-aluna-2026-11-14/evidencias/H03-identidad.png).
- [Omitir desde Contacto](ux-audit-aluna-2026-11-14/evidencias/H03-contacto.png).
- [Omitir desde Legal](ux-audit-aluna-2026-11-14/evidencias/H03-legal.png).
- [Omitir desde Estilo](ux-audit-aluna-2026-11-14/evidencias/H03-estilo.png).
- [Panel después de navegar y recargar](ux-audit-aluna-2026-11-14/evidencias/H03-persistencia.txt).
- [Regresión de finalización H02](ux-audit-aluna-2026-11-14/evidencias/H03-regresion-H02.txt).
- [Datos guardados por finalización normal](ux-audit-aluna-2026-11-14/evidencias/H03-H02-persistencia.txt).

## Avance de H05 — 14 de noviembre de 2026

**Estado: 🔄 En progreso. Fix verificado en el menú público de preview; pendiente despliegue y retest en la URL alojada.** No se marca ✅ Verificado porque la versión publicada todavía reproduce el problema.

### Causa raíz comprobada antes de editar

- Proyecto Supabase identificado desde la configuración local: `gqjfjtzsdpslwffbqqyw`. Marca de referencia: Café Bruma, `d10ff259-3b11-408c-99fe-174f278e50f1`.
- La consulta de datos confirmó Desayunos UX activa, ambos productos activos con stock `in`, categoría correcta y vínculos activos de categoría y productos a Sede Principal (`58f1d5d4-5eb3-4509-8584-ab7ea13d6db4`). Precios: 5000 y 7000 COP; las descripciones coinciden con administración.
- Se inspeccionaron las políticas SELECT y se ejecutaron consultas de lectura con rol `anon` dentro de una transacción revertida: se pudieron leer productos/categoría y sus vínculos activos. RLS no era la causa del menú vacío. No se cambiaron políticas, permisos ni esquema.
- La carga de red de `MenuDataContext.jsx` recibía `catsRes.data`, pero no llamaba a `setAllCategories` en la ruta de éxito. Sí almacenaba los productos. La carta itera las categorías del contexto; al quedar vacías, no renderizaba las secciones aunque los productos existieran.
- La hidratación de caché sí asignaba categorías, pero estaba condicionada a un esquema de modificadores válido. Café Bruma no tiene modificadores, por lo que esa ruta no disimulaba la omisión. No se cambió la política de caché.

### Cambio mínimo

- `src/context/MenuDataContext.jsx`: se añadió únicamente `setAllCategories(catsRes.data || []);` en la ruta de éxito, junto a las asignaciones de ajustes/productos.
- Sin cambios a consultas, filtros de marca, disponibilidad, sede, categoría, precios, componentes visuales ni RLS.
- `src/pages/AdminOnboarding.jsx` no se editó en esta intervención: H02 y H03 se conservan.

### Validación realizada

- `npm run build`: salida 0, 3283 módulos transformados; avisos informativos de Browserslist y tiempos de plugins.
- `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort`: iniciado y probado con el build corregido.
- Menú público en preview: `http://127.0.0.1:4173/caf-bruma-prueba-ux-14-nov-mwgj65c1/`. Se observó Desayunos UX con Café americano UX ($5.000) y Croissant UX ($7.000), sus descripciones originales y botones Agregar. No se crearon pedidos.
- Recarga de escritorio: se mantuvieron la categoría y los dos productos. Las tarjetas usan `content-visibility`; se desplazó la vista hacia su sección para comprobarlas, sin modificar esa optimización.
- Sede explícita: la misma ruta con `?loc=58f1d5d4-5eb3-4509-8584-ab7ea13d6db4` mostró ambos productos vinculados.
- Móvil: emulación solicitada a 390 × 844; la medición efectiva reportada por Edge fue 433 × 937. Se verificaron ambos productos después de recargar y el detalle del croissant con descripción y $7.000. Se restauró el viewport al terminar.
- Prueba real reversible: se desactivó temporalmente solo Croissant UX (`is_active=false`), se recargó preview y desapareció mientras Café americano UX permaneció. Después se restauró `is_active=true` y ambos volvieron a aparecer. La consulta final confirmó ambos activos y con stock `in` tanto en producto como en sede.
- La revisión automática rechazó una escritura adicional de prueba que habría cambiado la visibilidad por sede a false. No se reintentó ni se eludió ese rechazo; el vínculo de sede quedó activo. La prueba negativa específica por sede se cubrió de forma aislada, sin otra escritura remota.
- Ensayo aislado: se ejecutaron los callbacks reales `productsByCategory` y `categories` del archivo contra fixtures. Se conservaron precios/descripciones de activos y se excluyeron inactivo global, agotado global, oculto por sede, agotado por sede, adición, categoría inactiva y categoría oculta por sede. Sin cambios al código de esos filtros.
- Comprobación adicional de negocio: `http://127.0.0.1:4173/boku-bento/` mostró sus propias categorías/productos (por ejemplo Pollito Crazy), sin Café americano UX ni Croissant UX. Las consultas mantienen el filtro `brand_id`; esto no sustituye una auditoría exhaustiva de aislamiento de toda la plataforma.
- Durante una recarga aparecieron avisos/AbortError del bloqueo de sesión de Supabase entre pestañas. No se modificó Auth para resolverlos; la carga del catálogo pudo completarse y verificarse. No se atribuye ese aviso al setter añadido.

### Comprobación de la URL alojada y trabajo pendiente

- Se abrió y recargó `https://aluna-qrmenu.vercel.app/caf-bruma-prueba-ux-14-nov-mwgj65c1/`: la versión alojada todavía no muestra Desayunos UX ni los productos, porque no contiene el cambio local.
- Pendiente: desplegar este fix desde el flujo autorizado y volver a comprobar esa URL en escritorio/móvil, recarga y controles de ocultamiento. No se hizo commit, PR, push ni despliegue automático.
- H05 se mantiene 🔄 En progreso; ningún otro estado del checklist se modifica.

Evidencias:

- [Preview de escritorio](ux-audit-aluna-2026-11-14/evidencias/H05-preview-escritorio.png).
- [Menú móvil con categoría](ux-audit-aluna-2026-11-14/evidencias/H05-preview-movil.png).
- [Detalle móvil con descripción y precio](ux-audit-aluna-2026-11-14/evidencias/H05-preview-movil-productos.png).
- [Estado textual móvil](ux-audit-aluna-2026-11-14/evidencias/H05-preview-movil.txt).
- [Catálogo separado de Boku](ux-audit-aluna-2026-11-14/evidencias/H05-otro-negocio.txt).
- [Estado de la versión publicada pendiente](ux-audit-aluna-2026-11-14/evidencias/H05-publicado-pendiente.txt).

## Verificación de H05 después del despliegue autorizado

El PR agrupa H02, H03 y H05 desde `develop` hacia `main`. Se permiten previews automáticos del PR; la fusión y el despliegue de producción requieren intervención posterior. H05 permanece 🔄 En progreso hasta comprobar la versión publicada. Los registros anteriores corresponden a cada intervención y no implican que el PR ya estuviera creado en esas fechas de validación.

1. En Vercel, confirmar que el deployment publicado contiene el commit del PR y no un build anterior. Si hay caché de navegador/PWA, usar también una ventana privada nueva; no cambiar datos para forzar la aparición del catálogo.
2. Abrir la [carta pública de Café Bruma](https://aluna-qrmenu.vercel.app/caf-bruma-prueba-ux-14-nov-mwgj65c1/) sin sesión administrativa. Comprobar que aparece Desayunos UX con Café americano UX a $5.000 y Croissant UX a $7.000.
3. Contrastar las descripciones con administración: “Café negro caliente de prueba para auditoría UX.” y “Croissant de mantequilla de prueba para auditoría UX.”
4. Recargar y repetir con la [sede explícita](https://aluna-qrmenu.vercel.app/caf-bruma-prueba-ux-14-nov-mwgj65c1/?loc=58f1d5d4-5eb3-4509-8584-ab7ea13d6db4). Comprobar los mismos productos, precios y descripciones.
5. Repetir en escritorio y móvil (incluida una recarga). Desplazarse hasta las tarjetas, que usan `content-visibility`, y revisar también el detalle de cada producto.
6. En la cuenta/negocio de prueba, usar los controles administrativos normales para desactivar temporalmente un producto de prueba. Confirmar que no aparece en la carta después de recargar y que el otro permanece. Restaurar inmediatamente el estado original y comprobar su reaparición. No usar un negocio real ni modificar RLS para esta prueba. Si no hay autorización para cambiar ese dato de prueba, dejar esta comprobación pendiente.
7. Comprobar otro negocio (por ejemplo Boku) sin productos de Café Bruma y revisar errores de carga del menú en consola. No interpretar este smoke como una auditoría exhaustiva de seguridad.
8. Registrar URL del deployment, commit, fecha, dispositivos/vistas, resultado de recarga y capturas. Solo si pasan las comprobaciones, cambiar únicamente H05 a ✅ Verificado. Si falla alguna, conservar 🔄 En progreso y anotar el bloqueo; H02/H03 y los otros estados no cambian.

### Preparación del PR develop → main

- Revisión final: dos archivos de aplicación, únicamente H02/H03 en `AdminOnboarding.jsx` y H05 en `MenuDataContext.jsx`, más este checklist y sus 16 evidencias enlazadas. Los vídeos, el informe de auditoría completo y las evidencias de otros hallazgos quedan fuera del PR.
- Build repetido: `npm run build` aprobado, salida 0, 3283 módulos transformados. Preview reiniciado con `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort` y carta pública local comprobada nuevamente con Desayunos UX, ambos precios y ambas descripciones.
- El usuario autorizó el preview automático del PR, manteniendo prohibidos la fusión y el despliegue automático de producción. No se cambia configuración de Vercel ni de CI.
- Estados conservados: H02/H03 ✅ Verificado; H05 🔄 En progreso. La validación local y un preview de rama no sustituyen la comprobación publicada descrita arriba.
