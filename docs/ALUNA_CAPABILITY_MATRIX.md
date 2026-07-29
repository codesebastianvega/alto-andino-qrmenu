# Matriz integral de capacidades de Aluna

## 1. Propósito

Este documento compara lo que el panel administrativo ya permite hacer con lo que Aluna puede ejecutar hoy y define el orden para convertirla en una administradora transversal de la app.

La regla de producto es: **Aluna consulta datos reales, propone un cambio estructurado, muestra impacto y diferencias, solicita aprobación y solo entonces ejecuta y verifica**. Ninguna herramienta puede cruzar la `brand_id` o `location_id` activa.

## 2. Escala de riesgo y aprobación

| Nivel | Tipo de acción | Aprobación requerida |
|---|---|---|
| R0 — Lectura | Consultas, diagnósticos, cálculos y recomendaciones | Sin segunda confirmación |
| R1 — Reversible | Crear o editar datos comerciales y operativos recuperables | Una aprobación con vista previa |
| R2 — Sensible | Precios, costos, inventario, pagos, caja, horarios, disponibilidad y publicación | Una aprobación destacada, alcance por marca/sede y revalidación del estado |
| R3 — Crítico | Borrado, permisos, cierres de caja, pedidos cobrados, facturación e integraciones externas | Confirmación reforzada; para lotes o efectos externos, doble confirmación |

Estados usados en la columna **Aluna hoy**:

- **Ejecuta**: existe una herramienta con aprobación y escritura.
- **Lee**: puede diagnosticar o usar el dato como contexto, pero no modificarlo.
- **Navega**: abre el módulo para que el usuario lo resuelva.
- **No disponible**: no existe herramienta agentiva.
- **Producto pendiente**: la app tampoco tiene aún la capacidad completa.

## 3. Flujo gastronómico canónico

Cuando la marca tenga habilitada la función `inventory`, Aluna no debe comenzar por crear un producto aislado. Debe ofrecer dos caminos:

1. **Producto con costo real — recomendado**
   1. Resolver o crear categoría.
   2. Resolver ingredientes existentes por nombre, unidad y marca.
   3. Proponer ingredientes faltantes, proveedor y presentación de compra.
   4. Definir conversión entre unidad de compra y unidad de uso.
   5. Registrar costo unitario y existencias iniciales por sede.
   6. Crear receta, porciones y cantidades.
   7. Calcular costo total y por porción.
   8. Proponer precio y margen, sin inventar objetivos comerciales.
   9. Crear el producto vinculado a la receta.
   10. Configurar alérgenos, dietas, modificadores y disponibilidad por sede.
   11. Mostrar una sola propuesta compuesta y ejecutar en orden transaccional.
2. **Producto comercial rápido**
   - Permitido cuando el usuario lo elige o el plan no incluye inventario.
   - Debe advertir que el producto quedará sin receta ni costo real.
   - Debe crear una tarea pendiente para completar producción después.

La propuesta compuesta debe ser atómica cuando sea posible. Si una etapa falla, no se debe publicar un producto parcialmente configurado sin advertencia explícita.

## 4. Matriz de capacidades

| Dominio / página | Tablas y recursos principales | CRUD que Aluna debe cubrir | Riesgo | Aluna hoy | Dependencias y plan |
|---|---|---|---|---|---|
| Apertura / FAB Aluna | `brands`, `locations`, `business_hours`, `categories`, `products`, `recipes`, `payment_methods`, `restaurant_settings`, `home_settings` | Leer preparación, explicar bloqueantes, iniciar la herramienta adecuada y volver a auditar | R0 | **Ejecuta** auditoría; las cards navegan o abren los pocos flujos disponibles | Convertir cada hallazgo en `capability_id`; mostrar prerequisitos y resultado verificado |
| Identidad comercial / `AdminBusinessProfile` | `brands`, `restaurant_settings` | Leer y editar nombre, slug, tipo, contacto, dirección, descripción y datos comerciales | R1; slug R2 | **Lee/Navega** | Herramientas `get_business_profile`, `propose_business_profile_update`; validar slug único y URLs |
| Branding / `AdminBranding` | `brands`, `restaurant_settings`, Storage (`products` actualmente) | Logo, favicon, colores y activos; reemplazar sin perder el archivo anterior | R1; eliminación Storage R3 | **Lee/Navega** | Carga firmada, compresión WebP, rutas por marca, previsualización y limpieza diferida |
| Sedes / `AdminSedes` | `locations`, `business_hours` | Listar, crear, editar, activar/desactivar y configurar horarios por sede | R1/R2; borrado R3 | **Ejecuta** creación con horario inicial; no edita ni desactiva | Añadir update, horarios específicos, validación de dependencias y soft delete |
| Horarios / `AdminSettings`, `AdminSedes` | `business_hours` | Crear, copiar, editar, cerrar días y aplicar excepciones por sede | R2 | **Solo creación predeterminada** dentro de sede | Resolver zona horaria, traslapes y alcance; previsualizar semana completa |
| Categorías / `AdminCategories` | `categories`, `location_categories` | Crear, editar, ordenar, publicar, vincular por sede, consolidar y desactivar | R1/R2; borrado R3 | **Ejecuta** crear/reutilizar y consolidar/desactivar duplicada | Añadir edición, orden y disponibilidad; unicidad normalizada por marca; rollback de consolidación |
| Productos / `AdminProducts` | `products`, `location_product_status`, `location_product_prices`, Storage | Crear, leer, editar, ordenar, precio, stock, publicación, sede, imagen, receta, etiquetas y desactivar | R1/R2; borrado R3 | **Ejecuta** creación básica; no edita; no completa flujo gastronómico | Separar borrador comercial de publicación; tool schema completo; idempotencia; media y vínculos |
| Ingredientes / Inventario | `ingredients`, `ingredient_categories`, `location_inventory` | CRUD, categorías, unidades, conversión, costo de compra/uso, proveedor, stock inicial y mínimos por sede | R2; borrado R3 | **No disponible** | Primera prioridad. Reutilizar ingredientes por coincidencia segura; catálogo de unidades; impedir duplicados ambiguos |
| Proveedores / Inventario | `providers`, `ingredients` | CRUD proveedor, contacto, asociación a ingredientes y preparación de lista de compra | R1/R2; enviar pedido R3 | **No disponible** | No enviar WhatsApp/email sin confirmación final; historial de cotización/compra aún no existe |
| Recetas y costos / `AdminRecipes` | `recipes`, `recipe_ingredients`, `location_recipes`, `products` | CRUD receta, porción/rendimiento, ingredientes y cantidades; vincular producto; recalcular costo y margen | R2; borrado R3 | **Lee/Navega** | Segunda prioridad. Backend único para cálculo; transacción; versionar receta/costo para trazabilidad |
| Inventario por sede / `AdminModifiers` | `location_inventory`, `ingredients` | Ajustar conteos, mínimos, entradas, salidas y alertas; explicar variaciones | R2; ajuste masivo R3 | **Navega** | La tabla actual guarda saldo, no un kardex completo; crear movimientos antes de automatizar consumos o auditorías |
| Modificadores / `AdminModifierGroups` | `modifier_groups`, `modifier_options`, `location_modifier_groups`, relación con `products` | CRUD grupos/opciones, requeridos, límites, precios, orden, productos y sedes | R1/R2 | **Navega** | Tool compuesto con validación min/max y compatibilidad; no duplicar opciones/grupos existentes |
| Dietas y alérgenos / `AdminAllergens`, productos | `allergens`, campos/relaciones de producto | CRUD alérgenos; asignar dietas y alérgenos; inferir sugerencias desde ingredientes pero pedir validación | R1; seguridad alimentaria R2 | **Lee/Navega** | Nunca declarar “libre de” solo por IA; mostrar evidencia por ingrediente y confirmación humana |
| Precios y disponibilidad por sede | `location_product_prices`, `location_product_status`, `location_categories` | Cambiar precio, stock y publicación por sede o masivamente | R2 | **Solo crea vínculos iniciales** | Resolución explícita de “todas las sedes”; vista previa tabular y protección contra precios cero |
| Métodos de pago / `AdminPaymentMethods` | `payment_methods`, `location_payment_methods` | CRUD, activar por sede, tipo, instrucciones y orden | R2; eliminación R3 | **Lee/Navega** | Validar que no se deje una sede operativa sin método; no confundir configuración con conciliación |
| Ajustes e impresión / `AdminSettings` | `restaurant_settings` | Activar comanda/recibo, ancho 80/50 mm, datos impresos y preferencia KDS | R2 | **Lee/Navega** | Tool de configuración; prueba de impresión obligatoria. Impresión silenciosa requiere puente local ESC/POS |
| Comandas, recibos y KDS / `AdminOrders`, `AdminKitchen` | `orders`, `order_items`, `restaurant_settings`; `thermalPrint.js` | Recomendar/reimprimir documento, seleccionar tipo/ancho, gestionar estados de cocina | Lectura R0; imprimir/cambiar estado R2 | **No disponible** | El navegador imprime; el agente debe solicitar dispositivo y orden. KDS sigue siendo flujo principal |
| Pedidos / `AdminOrders` | `orders`, `order_items`, `order_payments`, `customers` | Buscar, resumir, cambiar estado, descuentos, fusionar, cancelar, reasignar, cobrar y reimprimir | R2; descuentos/cancelación/cobro R3 | **No disponible** | Diseñar máquina de estados y permisos; jamás editar totales libres; bloquear mutaciones de pedidos facturados |
| Mesero / `AdminWaiter` | `orders`, `order_items`, `restaurant_tables`, `table_areas` | Crear pedido, agregar/quitar ítems, notas, mesa, cliente y envío a cocina | R2; quitar ítems enviados R3 | **No disponible** | Tool transaccional de pedido con snapshot de precios; respetar modo offline e idempotencia |
| Cocina / `AdminKitchen` | `orders`, `order_items`, `product_ingredients` | Priorizar y cambiar estados, leer notas, reportar falta de insumos y tiempos | R2 | **No disponible** | Permisos de rol kitchen; eventos Realtime; no permitir saltos inválidos de estado |
| Turno y caja / `AdminOperations` | `orders`, `order_payments`, `restaurant_tables`, `table_areas`, `restaurant_settings` | Resumen, abrir/cerrar turno, caja esperada, diferencias, ocupación y estados físicos de mesa | R2; cierre/corrección R3 | **No disponible** | El cierre debe ser inmutable/auditable; revisar si falta persistencia formal de cierres de caja |
| Mesas y QR / `AdminTables` | `table_areas`, `restaurant_tables` | CRUD áreas/mesas, activar, asignar sede, capacidad/posición y generar QR | R1/R2; borrar con pedidos R3 | **Navega** | Análisis de dependencias; QR/URL se genera en cliente; soft delete recomendado |
| Staff / `AdminStaff` | `staff`, `shifts`, `profiles`, asignación de sedes | CRUD staff, rol, PIN, acceso a sedes, activar, entrada/salida | R2; rol/PIN/borrado R3 | **No disponible** | Separar identidad Auth de staff operativo; nunca exponer PIN; matriz de permisos y doble confirmación para privilegios |
| Web / `AdminWebContent` | `home_settings`, `categories`, `products`, Storage | Editar hero, copys, CTA, destacados, “must try”, visibilidad, banners e imágenes; publicar/despublicar | R1/R2 | **Lee/Navega** | Preview antes de publicar; límites de imágenes/egress; historial y rollback de contenido |
| Experiencias / `AdminExperiences` | `experiences`, `experience_bookings` | CRUD experiencia, fechas/cupos/incluye/precio; gestionar estado de reserva/pago | R1/R2; pago/cancelación R3 | **No disponible** | Feature `experiences`; evitar sobreventa; separar contenido de transacción de reserva |
| Analítica / `AdminAnalytics` | `orders`, `order_items`, `order_payments`, `products`, `leads`, `analytics_events`; RPC `analytics_*` | Consultar, explicar métricas, detectar anomalías, pronosticar, exportar; proponer costos sin aplicarlos automáticamente | R0; costos/leads R2; borrar lead R3 | **No disponible** | Herramientas de lectura agregada, rangos y sede; controlar alucinaciones y citar período/fuente |
| CRM y clientes | `orders`, `leads`, `customers` | Buscar/segmentar, actualizar lead, notas y seguimiento; preparar campañas | R1/R2; contacto externo/borrado R3 | **No disponible** | Consentimiento, PII, canal autorizado y confirmación antes de enviar mensajes |
| Offline / PWA | IndexedDB (`catalogCache`, `pendingOrders`), `orders.client_order_id`, RPC `create_order_idempotent`, Service Worker | Informar estado, pendientes, reintentar sincronización y diagnosticar caché; no fingir que la IA funciona offline | R0/R2 | **No disponible para Aluna**; app tiene base offline | Herramientas locales, telemetría de cola y UX. Sin internet Aluna/Gemini no opera; nunca borrar cola sin confirmación R3 |
| Egress y medios | Supabase Storage, imágenes de productos/branding, caché local | Auditar peso/uso, encontrar duplicados, recomendar/ejecutar compresión y migración controlada | R0; reemplazo R2; borrado/migración R3 | **No disponible** | Métricas por Storage/DB/Realtime; lazy-load y WebP; Cloudflare R2 solo tras evidencia |
| Factura electrónica | No existe integración fiscal completa; recibo interno no es factura | Datos fiscales, emitir, consultar DIAN, CUFE, XML/PDF, notas crédito, contingencia | R3 | **Producto pendiente**; UI “próximamente” | Elegir proveedor tecnológico DIAN, modelo fiscal y webhooks. Aluna solo podrá operar sobre API certificada, nunca improvisar documentos |
| Rappi / delivery externo | No existe conector ni modelo de sincronización completo | Importar pedidos, mapear menú/modificadores/precios, disponibilidad, estados, conciliación y errores | R3 | **Producto pendiente** | Contrato/API y credenciales Rappi, webhooks idempotentes, mapeos por marca/sede y cola de reintentos |
| Superadmin / planes | `brands`, `profiles`, `plans`, `plan_features`, leads de venta | Consultar salud, gestionar planes/marcas/usuarios y soporte con impersonación explícita | R2/R3 | **Fuera del agente de marca** | Crear agente superadmin separado; nunca heredar herramientas del dueño sin registro de impersonación |

## 5. Capacidades transversales que faltan antes de afirmar “gestiona toda la app”

1. **Registro único de herramientas**: cada capacidad debe declarar esquema de entrada/salida, nivel de riesgo, roles, feature del plan, tablas afectadas, precondiciones, método de verificación y compensación.
2. **Orquestador con dependencias**: debe ordenar acciones; por ejemplo, ingrediente antes de receta y receta antes de producto publicado.
3. **Resolución de entidades**: reutilizar categorías, productos, ingredientes, proveedores, sedes y métodos existentes; si hay ambigüedad, preguntar en lugar de duplicar.
4. **Propuestas persistentes**: conversación, borrador y `change_set` deben sobrevivir recargas y cambios de dispositivo.
5. **Centro de cambios**: pendientes, aprobadas, en ejecución, parciales, fallidas y revertidas, con actor, marca, sede y diferencias.
6. **Idempotencia universal**: una repetición o timeout no puede duplicar categorías, productos, recetas, pagos o pedidos.
7. **Transacciones y compensación**: los flujos compuestos deben ejecutarse en una función SQL transaccional o tener rollback/compensación segura.
8. **Control optimista**: guardar versión o hash de `before_data`; rechazar una aprobación si el registro cambió desde la propuesta.
9. **Verificación posterior**: releer los registros y reportar exactamente qué se aplicó; después, actualizar la auditoría.
10. **Permisos por herramienta**: owner/admin/manager/kitchen/waiter no deben compartir el mismo alcance. La autorización se valida en backend.
11. **Plan y feature awareness**: Aluna debe detectar `inventory`, `kitchen_display`, `table_management`, `landing_page`, `experiences`, etc., y ofrecer solo herramientas disponibles.
12. **Política de borrado recuperable**: priorizar `is_active = false`; borrado físico solo con análisis de relaciones y confirmación reforzada.
13. **Observabilidad**: logs por tool call, latencia, tokens, errores, registros afectados, costo y correlation id; sin secretos ni PII innecesaria.
14. **Evaluaciones**: pruebas multi-marca, permisos, no duplicación, datos ambiguos, reintentos, fallos parciales y prompts adversariales.

## 6. Orden de implementación recomendado

### Fase 0 — Plataforma agentiva común

- Registro de herramientas, esquemas y permisos.
- Persistencia real de conversación y borradores.
- Centro de cambios básico.
- Idempotencia, control optimista, verificación y reversión.
- Unificar la ejecución actual de sedes/catálogo/consolidación bajo el mismo contrato.

### Fase 1 — Núcleo gastronómico

1. Ingredientes, categorías de ingrediente, unidades y proveedores.
2. Inventario inicial y mínimos por sede.
3. Recetas, rendimientos y cantidades.
4. Motor único de costo y margen.
5. Producto vinculado a receta, categoría y sedes.
6. Dietas, alérgenos y modificadores.

**Criterio de salida:** Aluna puede crear un plato completo sin duplicar entidades, calcula el costo desde ingredientes reales y no publica nada sin aprobación.

### Fase 2 — Configuración integral del local

- Editar sedes y horarios.
- Métodos de pago por sede.
- Impresión 80/50 mm, comanda/recibo y preferencia KDS.
- Branding, perfil comercial y contenido web.
- Mesas, áreas y QR.
- Staff y permisos, con seguridad reforzada.

### Fase 3 — Operación diaria

- Pedidos, mesero y KDS con máquina de estados.
- Pagos, descuentos, cancelaciones e impresión.
- Turnos, caja y diferencias.
- Movimientos de inventario y alertas.
- Experiencias y reservas.

### Fase 4 — Inteligencia y automatización supervisada

- Analítica conversacional con evidencia.
- Diagnóstico de rentabilidad, demanda, inventario y egress.
- CRM y campañas preparadas, siempre con aprobación antes del contacto.
- Listas de compra y comunicación a proveedores supervisada.

### Fase 5 — Ecosistema externo

- Conector Rappi/iFood con webhooks e idempotencia.
- Proveedor tecnológico de factura electrónica DIAN.
- ERP/contabilidad y canales de mensajería.

Estas integraciones no deben implementarse como herramientas de Aluna hasta que exista primero una capa de integración determinista y auditable.

## 7. Definición de “Aluna gestiona toda la app”

La meta se considera cumplida cuando:

- Cada acción administrativa visible tiene una herramienta equivalente o una razón documentada para excluirla.
- Aluna conoce marca, sede, rol, plan y estado actual antes de proponer.
- Todos los cambios muestran vista previa, alcance, riesgo y aprobación.
- Los flujos compuestos respetan dependencias y son atómicos o compensables.
- No duplica entidades ante variaciones de mayúsculas, tildes, espacios o reintentos.
- Toda ejecución se verifica y aparece en el Centro de cambios.
- Las acciones críticas tienen confirmación reforzada y las externas son idempotentes.
- Las funciones todavía inexistentes en el producto —Rappi y factura electrónica— aparecen como dependencias, no como capacidades ficticias del agente.

## 8. Evidencia revisada

- Navegación y módulos: `src/components/admin/AdminLayout.jsx`.
- Herramientas actuales: `src/components/admin/AlunaCopilot.jsx`, `src/services/alunaCopilot.js`, `supabase/functions/aluna-agent-chat/index.ts`, `supabase/functions/aluna-agent-action/index.ts`.
- CRUD del panel: hooks `useAdmin*`, `useCategories`, `useLocations`, `useStaff`, `usePaymentMethods`, `useOperations` y páginas `Admin*`.
- Offline e impresión: `src/utils/offlineDb.js`, `src/services/orderSync.js`, `src/utils/thermalPrint.js` y migraciones de julio de 2026.
- Alcance previsto y límites: `docs/ALUNA_COPILOT_MVP.md`, `docs/PLAN_OPERATIVO_OFFLINE_IMPRESION_EGRESS.md` y `docs/ROADMAP_PRODUCTO.md`.

## 9. Avance implementado en la rama `codex/aluna-copilot`

### Con interfaz, propuesta y aprobación

- Auditoría de apertura y cards accionables.
- Crear sedes y catálogo comercial rápido.
- Consolidar categorías sin borrar productos.
- Crear producto costeado en el orden ingrediente → receta → costo por porción → producto.
- Configurar horarios, métodos de pago, impresión 50/80 mm y grupos de modificadores.
- Consultar el historial real de cambios por marca.

### Herramientas backend listas para la siguiente integración visual

- Editar perfil comercial, URLs de branding y contenido web.
- Editar productos, categorías e ingredientes; ajustar inventario por sede.
- Crear áreas y mesas, editar mesas y activar/desactivar staff sin tocar PIN o privilegios.

### Aún no debe presentarse como disponible

- Pedidos, caja, KDS, impresión física automática, analítica, CRM y experiencias requieren herramientas específicas adicionales.
- Rappi necesita contrato/API y webhooks reales.
- Factura electrónica necesita proveedor tecnológico autorizado por DIAN.
- Las funciones nuevas requieren despliegue y prueba integrada contra Supabase antes de habilitarlas en producción.
