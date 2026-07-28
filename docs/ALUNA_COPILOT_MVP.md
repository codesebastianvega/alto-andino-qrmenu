# Copiloto Aluna — Especificación funcional del MVP

## 1. Objetivo

Copiloto Aluna ayuda al dueño o administrador a configurar y operar su negocio mediante conversación. Puede consultar datos, preparar propuestas y ejecutar cambios únicamente después de una autorización humana explícita.

El MVP modifica datos operativos de Aluna. No modifica código fuente, despliegues ni infraestructura.

## 2. Aislamiento multi-marca

El agente siempre trabaja dentro de un contexto compuesto por:

- `user_id`: usuario autenticado.
- `brand_id`: marca activa en el panel.
- `location_id`: sede activa, cuando corresponda.
- `role`: rol efectivo del usuario en esa marca o sede.

Reglas obligatorias:

1. El navegador puede informar la marca seleccionada, pero nunca autorizarla.
2. Cada Edge Function valida la sesión y la relación del usuario con `brand_id`.
3. Cada herramienta vuelve a aplicar `brand_id` y, cuando corresponda, `location_id`.
4. Ninguna escritura acepta un identificador de marca generado por el modelo.
5. El agente no conserva contexto de una marca al cambiar a otra.
6. Superadmin e impersonación deben quedar registrados explícitamente.

Resultado esperado:

- En Alto Andino, el agente solo consulta y modifica Alto Andino.
- En Boku Bento, el agente solo consulta y modifica Boku Bento.
- Un usuario sin acceso a una marca recibe `403`, incluso si manipula la solicitud.

## 3. Usuarios y visibilidad

El botón se muestra únicamente dentro del panel administrativo a:

- `owner`: todas las herramientas de la marca.
- `manager`: herramientas autorizadas para su sede.
- `staff`: fuera del MVP; posteriormente podrá acceder a ayuda operativa sin configuración sensible.
- `superadmin`: solo con contexto de marca explícito y auditoría de impersonación.

No aparece en el menú público, checkout, seguimiento de pedidos ni KDS para clientes.

## 4. Ubicación e interfaz

### Escritorio

- Botón flotante en la esquina inferior derecha: `Pregúntale a Aluna`.
- Abre un panel lateral de 440 a 480 px.
- Muestra una etiqueta persistente con la marca y sede activas.

### Móvil

- Botón situado por encima de la navegación inferior.
- Abre una vista completa o bottom sheet alto.
- Nunca cubre acciones críticas del POS.

### Centro de cambios

Se añade `Cambios de Aluna` al panel administrativo. Incluye propuestas pendientes, ejecuciones, errores, acciones revertidas y actor que autorizó.

## 5. Flujo de una acción

1. El usuario escribe una solicitud.
2. El coordinador consulta datos reales mediante herramientas de lectura.
3. Gemini prepara un plan estructurado; no escribe directamente.
4. El backend valida campos, permisos, relaciones y alcance.
5. Se crea un `change_set` con estado `draft`.
6. La interfaz muestra diferencias antes/después e impacto.
7. El usuario puede editar, aprobar o descartar.
8. Al aprobar, el backend revalida sesión, permisos y estado actual.
9. Las acciones se ejecutan de forma idempotente.
10. El sistema verifica el resultado y registra auditoría.

## 6. Estados

Un conjunto de cambios puede estar en:

- `draft`
- `awaiting_approval`
- `approved`
- `executing`
- `completed`
- `partially_failed`
- `failed`
- `rejected`
- `reverted`

Una aprobación expira si los datos afectados cambiaron desde que se creó la propuesta.

## 7. Política de autorización

- Las lecturas no requieren una segunda confirmación.
- Toda creación, edición, publicación o desactivación requiere aprobación.
- Una aprobación cubre únicamente el `change_set` visible y su versión exacta.
- Agregar acciones después de aprobar invalida la autorización.
- Acciones masivas muestran cantidad, alcance y advertencias.
- Eliminación definitiva requiere una confirmación independiente.

## 8. Política de borrado

El MVP prioriza operaciones recuperables:

- Producto: `is_active = false`.
- Categoría: ocultar; bloquear si dejaría relaciones inconsistentes.
- Promoción o contenido: despublicar.
- Imagen: no eliminar automáticamente del Storage.

La eliminación definitiva queda fuera de las herramientas iniciales. Se incorporará después con análisis de dependencias y retención.

## 9. Herramientas iniciales

### Lectura

- `get_business_snapshot`
- `audit_opening_readiness`
- `list_categories`
- `list_products`
- `get_product`
- `list_locations`
- `get_branding_settings`
- `get_web_content`

### Propuestas y escritura con aprobación

- `propose_category_create`
- `propose_product_create`
- `propose_product_update`
- `propose_product_deactivate`
- `propose_price_update`
- `propose_branding_update`
- `propose_web_content_update`
- `execute_change_set`
- `revert_change_set`

Las herramientas `propose_*` no escriben en tablas operativas. Solo construyen el cambio pendiente.

## 10. Primer flujo: preparar Boku Bento para abrir

Solicitud ejemplo:

> Ayúdame a dejar Boku Bento listo para abrir.

El agente revisa:

- Identidad y datos comerciales.
- Sedes y horarios.
- Categorías y productos activos.
- Fotos, precios, descripciones y disponibilidad.
- Recetas, costos, margen, etiquetas y alérgenos.
- Modificadores.
- Métodos de pago.
- Impresión y KDS.
- Contenido web y canales de contacto.

El resultado es un diagnóstico con evidencia, prioridad y acciones aprobables. No rellena datos faltantes sin indicarlo.

## 11. Persistencia propuesta

### `agent_conversations`

Conversación por usuario, marca y sede. Guarda estado y metadatos, no secretos.

### `agent_messages`

Mensajes, llamadas a herramientas y resultados resumidos.

### `agent_change_sets`

Propuesta versionada, alcance, estado, riesgo, autor, aprobador y fechas.

### `agent_actions`

Cada operación individual con `before_data`, `proposed_data`, resultado, error e idempotency key.

### `agent_audit_log`

Registro inmutable de propuesta, aprobación, ejecución, reversión e impersonación.

Todas las tablas expuestas tendrán RLS y políticas por marca. Las escrituras operativas se realizarán mediante funciones controladas, no mediante SQL generado por el modelo.

## 12. Reglas del modelo

- Gemini conversa, clasifica intención y prepara argumentos estructurados.
- Gemini no recibe `service_role` ni ejecuta SQL.
- IDs, precios y relaciones se resuelven desde Supabase.
- Los esquemas de herramientas rechazan campos desconocidos.
- El backend valida semánticamente toda salida estructurada.
- Si falta información, el agente pregunta o crea un borrador incompleto claramente marcado.

## 13. Reversión

Cada acción reversible guarda una copia mínima de `before_data`. La reversión:

1. Requiere autorización.
2. Comprueba que el registro no haya cambiado posteriormente.
3. Crea una nueva acción auditada; nunca borra el historial.
4. Puede quedar bloqueada si existen dependencias nuevas.

## 14. Entregas del MVP

### Fase 1 — Base segura

- Migraciones y RLS.
- Contratos de herramientas.
- Coordinador de lectura.
- Auditor de apertura.

### Fase 2 — Experiencia

- Botón flotante.
- Panel conversacional.
- Tarjetas de propuesta y diferencias.
- Centro de cambios.

### Fase 3 — Escrituras

- Crear categoría.
- Crear y editar producto.
- Actualizar precio.
- Desactivar producto.
- Verificación y reversión.

### Fuera del MVP inicial

- Cambios autónomos sin aprobación.
- SQL libre.
- Modificación de código fuente.
- Despliegues automáticos.
- Eliminación física masiva.
- Integraciones Rappi y contables ejecutadas por el agente.

## 15. Criterios de aceptación

1. Ninguna acción cruza marcas o sedes.
2. Ninguna escritura ocurre sin aprobación válida.
3. La vista previa muestra todos los registros afectados.
4. Los valores ejecutados coinciden con los aprobados.
5. Reintentar una ejecución no duplica registros.
6. Toda ejecución tiene actor, marca, fecha y resultado.
7. Los fallos parciales son visibles y recuperables.
8. El agente funciona desde móvil y escritorio.
9. Boku Bento puede completar una auditoría de apertura sin inventar información.
