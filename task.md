# 🚀 Plan de Ejecución Aluna SaaS — Fase 2 (Ops & CRM)
**Estado:** 🟢 En progreso  
**Versión:** 2.2 · Incluye decisiones de arquitectura de navegación  
**Rama:** `feature/ops-crm-dashboard`

---

## ✅ COMPLETADO — Bloque 2: Integridad de Datos
- [x] Data Health Header: Banner con % productos sin costo y % clientes identificados
- [x] Sincronización de Márgenes: `useAdminProducts.js` calcula y persiste `margin` en create/update
- [x] Sincronización Recetas → Productos: `AdminRecipes.jsx` propaga costo/margen al guardar
- [x] Fix Recharts warnings: `ResponsiveContainer` con `width="100%" minWidth={1} minHeight={1}`

---

## 🟦 BLOQUE 3: Centro de Operaciones (Ops Center)
> Meta: Control total del turno y productividad en tiempo real.

### 3.1 Infraestructura de Datos — Hook Maestro
- [x] `useOperations.js`: Hook con suscripciones Realtime filtradas por `brand_id`
  - [x] `orders`: Solo del día actual (`created_at >= 00:00:00` UTC-5 Colombia)
  - [x] `restaurant_tables`: Estados de ocupación (fix: columna `capacity` no existe, eliminada)
  - [x] `order_payments`: Flujo de caja entrante

### 3.2 Caja del Turno — `ShiftCashSummary`
- [x] KPIs Financieros: Total cobrado, Propinas (`service_fee`), Ticket promedio, Cancelaciones
- [x] Desglose de Métodos: Cards Efectivo (verde), Tarjeta (azul), Transferencia (morado)
- [x] Botón "Cerrar Turno" con exportación rápida CSV
- [x] `AdminOperations.jsx` — página creada y registrada en sidebar y router
- [x] Sidebar: botón "Turno & Caja" visible en sección Operación (color violeta)
- [x] Sidebar: botón "Ops Center" → "Turno & Caja"

### 3.3 Mapa de Mesas Pro — `TableMap`
- [x] Grid dinámico: Tarjeta por mesa con número, mesero y total acumulado
- [x] Semáforo: 🟢 Libre · 🟡 Ocupada · 🔴 Lista para cobrar (`ready`/`waiting_payment`)
- [x] SLA Visual: Alerta naranja/roja si mesa sin actividad > 20/40 min
- [x] Filtros rápidos por estado (Todas / Libres / Ocupadas / Por cobrar)

### 3.4 Inteligencia de Cocina — `KitchenStats`
- [x] Backlog & SLA: Contador órdenes en preparación + tiempo promedio de despacho
- [x] Live Event Feed: Timeline lateral FIFO (nuevos pedidos, cambios de estado, pagos)

### 3.5 Personal Activo — `ActiveStaff`
- [x] Lista de meseros con conteo de pedidos activos
- [x] Badge de carga laboral: Ligero / Normal / Saturado

### 3.6 Roles & Visibilidad en Sidebar — AdminLayout ✅
> ⚡ Decisión tomada el 15-abr: ajustar visibilidad de pestañas por rol.
- [x] Renombrar botón sidebar: `Ops Center` → `Turno & Caja`
- [x] Restablecer visibilidad de pestañas para roles `owner`, `admin`, `superadmin` y `encargado`.
- [x] Verificar redirecciones automáticas por rol (`kitchen` y `waiter`).
- [x] Unificar listas de acceso bajo `ADMIN_ROLES`.

**Tabla de visibilidad final:**
| Pestaña | kitchen | waiter | admin | owner |
|---|:---:|:---:|:---:|:---:|
| Inteligencia (Analytics) | ❌ | ❌ | ✅ | ✅ |
| Pedidos (Kanban) | ❌ | ✅ | ✅ | ✅ |
| Cocina | ✅ | ❌ | ✅ | ✅ |
| Toma de Pedidos | ❌ | ✅ | ✅ | ✅ |
| Turno & Caja | ❌ | ❌ | ✅ | ✅ |
| Carta / Configuración | ❌ | ❌ | ✅ | ✅ |

---

- [x] **🛰️ BLOQUE 3.7: Dashboard de Inteligencia Operativa (Táctica)**
- [x] **Desarrollo de Componente Core:**
  - [x] Crear `src/components/admin/OperationsIntelligence.jsx`
  - [x] Integrar en el `TabSwitcher` de `AdminAnalytics` como pestaña "Operación"
- [x] **Métricas de Eficiencia (SLA):**
  - [x] Implementar cálculo de SLA (Cocina): Tiempo real vs. Objetivo (20 min)
  - [x] Gráfico de Pulso Operativo: Entrada (Recibidos) vs Salida (Despachados) con Backlog y Peak Tension
- [x] **Productividad de Staff:**
  - [x] Tabla de rendimiento por mesero: Pedidos servidos, ticket promedio, velocidad y propinas
- [x] **Optimización de Activos:**
  - [x] Análisis de Rentabilidad por Mesa: Rotación y participación de ingresos por ubicación física

---

## 🟡 BLOQUE 4: CRM Ligero (Gestión de Clientes) [/]
> Meta: Convertir el teléfono del POS en una base de datos accionable.

### 4.1 Directorio de Clientes — `useCRM.js` [/]
- [x] `useCRM.js`: Unificar órdenes por `customer_phone` (deduplicación)
- [x] Métricas por cliente: LTV, Frecuencia, Fecha última visita

### 4.2 Segmentación Automática
- [x] 🏆 Frecuente: ≥ 5 pedidos en el último mes
- [x] ⭐ Recurrente: 2–4 pedidos en el último mes
- [x] 🌱 Nuevo: 1 pedido en la última semana
- [x] 😴 Dormido: Sin pedidos en > 21 días
- [x] 👻 Perdido: Sin pedidos en > 45 días

### 4.3 Perfil & Marketing — `CustomerProfileModal`
- [x] Drawer de cliente: Historial de pedidos, ticket promedio, plato favorito
- [x] Messaging Center (WhatsApp via `wa.me`):
  - [x] Plantilla Feedback: "¿Qué tal estuvo tu visita hoy?"
  - [x] Plantilla Recuperación: "Te extrañamos, vuelve por un postre de cortesía."

---

## 🟣 BLOQUE 4.5: Ops & CRM integrados en Inteligencia (`AdminAnalytics`)
> ⚡ Decisión final (15-abr): Inteligencia = Centro de Decisiones Estratégico del Gerente.

### Diferenciación clara entre las dos vistas de operación:

| | 🟣 Turno & Caja (sidebar) | 🧠 Tab Operación en Inteligencia |
|---|---|---|
| **Alcance** | Solo HOY / turno actual | Amplio espectro: semanal, mensual, histórico |
| **Datos** | Caja en vivo, mesas activas, staff del turno | Tendencias operativas, SLA promedio, productividad |
| **Usuario** | Encargado en caja/tablet | Gerente tomando decisiones estratégicas |
| **Frecuencia** | Siempre abierto durante el turno | Consulta periódica |

### Estructura de tabs en `AdminAnalytics` (son 4, no 3):
```
[ 📄 Resumen ]   →  Tab actual (se conserva)
[ 📊 Analítica ]  →  KPIs históricos, gráficas de ventas
[ 🏪 Operación ]  →  Rendimiento operativo amplio (no solo hoy)
[ 👥 CRM ]        →  Clientes, fidelización, segmentación
```

- [x] Tab `Analítica`: contenido actual de `AdminAnalytics` (intacto)
- [x] Tab `Operación` (amplio espectro):
  - [x] Crear componente `OperationsIntelligence.jsx`
  - [x] Integrar en `AdminAnalytics.jsx` con tab switcher
  - [x] Gráfico de flujo (Received vs Dispatched) y SLA line
  - [x] Mesa más rentable, horario pico (Peak Tension), mesero más productivo
- [x] Tab `Clientes CRM`: `CustomerDirectory` + segmentación + `CustomerProfileModal`
  - Datos via `useCRM` (a crear en Bloque 4)

---

## 🟪 BLOQUE 5: Refactorización POS & CRM Real (Fase 2)
> Meta: Evolución de base de datos y flujos internos.

- [ ] Internal POS: Interfaz interna en `AdminWaiter.jsx` para uso exclusivo de meseros
- [x] Migración SQL tabla `customers`: Campos `notas`, `etiquetas`, `tags` (ej: "VIP", "Alérgico")

## 🟧 BLOQUE 5.5: Estabilización POS & Flujo de Mesero [/]
> Meta: Pulir la experiencia de toma de pedidos y evitar duplicidad de comandas.

- [x] **UI de Selección de Mesa:**
  - [x] Reemplazar `window.confirm` en `AdminWaiter.jsx` con un modal estilizado (brand colors).
  - [x] Implementar estado `confirmMesaModal` para gestionar la advertencia de mesa ocupada.
- [x] **Fusión de Pedidos Activos:**
  - [x] Refactorizar `handleConfirmOrder` en `CartModal.jsx`.
  - [x] Lógica: Buscar orden activa (`new`, `preparing`, `ready`) para la mesa actual.
  - [x] Si existe: Anexar nuevos items a la orden existente y actualizar totales.
  - [x] Si no existe: Crear nueva orden normalmente.

---

## ⬛ PENDIENTES POST-Fase 2 (Bloque 6)
- [ ] Revisar y corregir perfiles de prueba en Supabase (brand_id, role) para asegurar que se listen en ActiveStaff.

---

## ✅ COMPLETADO — BLOQUE 7: Perfil & Gestión de Cuenta
> Meta: Autogestión de perfil, seguridad y roles administrativos.

- [x] **Vista de Mi Perfil (`/admin/profile`):**
  - [x] Interfaz para visualizar datos actuales (Nombre, Avatar, Rol).
  - [x] Edición de información personal básica.
- [x] **Seguridad & Credenciales:**
  - [x] Flujo de actualización de Email (Supabase Auth) con advertencias y re-auth.
  - [x] Formulario de cambio de contraseña con validación de contraseña actual y toggles visuales.
  - [x] Badge de estado de conexión con Google.
- [ ] **Gestión de Roles Globales (Solo Superadmin):**
  - [ ] Vista para que tú (Sebas) puedas editar roles de otros `profiles` sin ir a la DB.
  - [ ] Asignación/Cambio de `brand_id` para nuevos dueños de restaurantes.
- [x] **Accesos Rápidos:** Botón de "Perfil" integrado en el Header del Admin.

---

## 🏷️ BLOQUE 8: Menú Dinámico "Casas y Habitaciones" [/]
> Meta: Eliminar dependencias hardcodeadas y permitir gestión total de jerarquía.

### 8.1 Infraestructura & Migración ✅
- [x] **Audit DB:** Verificar columnas `tint_class`, `target_id` y `subcategory` (Completado)
- [x] **Migración:** Script de extracción de metadata de `categories.js` a Supabase (Completado)

### 8.2 Admin UX - Gestión de Categorías ("Casas") [/]
#### Bloque 1.1: Refactorización de CategoryForm [x]
- [x] Instalar `@hello-pangea/dnd` para ordenamiento (Hecho)
- [x] Implementar Drag & Drop para "Habitaciones" (subcategorías)
- [x] Integrar campos de estilo: `tint_class` y `accent_color`
- [x] Integrar campo técnico: `target_id` (anclaje ID)
- [x] Validación visual: Asegurar que el selector de vistas (section_type) siga funcionando
- [x] Test de persitencia: Guardar y verificar en Supabase Table Editor

### 8.3 Admin UX - Gestión de Productos
- [ ] **Filtrado Dinámico:** `ProductForm.jsx` filtrando subcategorías según la categoría elegida
- [ ] **Persistencia:** Guardado del campo `subcategory` en la tabla `products`

### 8.4 Experiencia Cliente (Frontend)
- [ ] **Refactor `ProductLists.jsx`:** Agrupamiento dinámico por subcategorías (respetando orden)
- [x] **Refactor `HeroHeadline.jsx` & `MenuHero.jsx`**: Pool de recomendaciones dinámico por horario (agnóstico a nombres)
- [x] **Refactor `PromoBannerCarousel.jsx`**: Carga de banners desde Supabase y resolución de productos vía contexto
- [x] **Cleanup**: Eliminar imports de `CATEGORIES_LIST` y `menuItems` estáticos
- [x] **Fallback "Otros":** Manejo automático de productos sin subcategoría (ya implementado en ProductLists)

### 8.5 Depuración Final ✅
- [x] Eliminar archivos legacy (`src/config/categories.js`, `src/data/menuItems.js`, `src/data/banners.js`, `src/utils/resolver.js`, `src/components/StockAdmin.jsx`, `src/components/StoryModal.jsx`)
- [x] Verificación cruzada (Admin -> DB -> Cliente)
- [x] 

## 🤖 BLOQUE 9: Corrección IA & Carrito [/]
> Meta: Resolver inconsistencias en sugerencias de IA y visualización de imágenes.

- [ ] **Estandarización de Payloads en MenuHero.jsx**
  - [ ] Añadir `productId` al dispatch de `aa:quickview`.
  - [ ] Asegurar campos `id`, `name`, `price`, `subtitle`, `image_url` e `image`.
- [ ] **Normalización en CartContext.jsx**
  - [ ] Refactorizar `addItem` para asegurar `productId` desde `id`.
  - [ ] Sincronizar campos de imagen en el objeto de item del carrito.
  - [ ] Mejorar resiliencia de `sameItem`.
- [ ] **Hidratación en ProductLists.jsx**
  - [x] Limpiar/Normalizar objeto recibido en el listener global `aa:quickview`.
- [ ] **Verificación en ProductQuickView.jsx**
  - [x] Asegurar que `handleAdd` pase el objeto completo al carrito.

---

## 🟢 BLOQUE 10: Gestión Avanzada de Categorías & Vistas Premium [/]
> Meta: Interfaz administrativa full-width y nuevas experiencias visuales para el menú.

### 10.1 Admin Categories: Rediseño Full-Width [x]
- [x] Modificar `useCategories.js` para incluir conteo de productos (activos / total). (Hecho)
- [x] Rediseñar `AdminCategories.jsx` para ocupar el 100% del ancho disponible. (Hecho)
- [x] Implementar tabla enriquecida:
    - [x] Columna **Imagen**: Miniatura o ícono de la categoría.
    - [x] Columna **Productos**: Badge con `activos / total`.
    - [x] Columna **Diseño**: Selector (Select) para `section_type` directamente en la fila.
    - [x] Columna **Estado**: Quick toggle (Switch) para visibilidad global.
    - [x] Columna **Hero**: Toggle para destacar en la página de inicio.
    - [x] Fix: ReferenceError `Icon` is not defined (Corrected)
- [ ] Mejorar visualmente:
    - [ ] Columna **Última Actualización**: Tiempo relativo de edición.
    - [ ] Visualización de **Subcategorías**: Badges con contador y lista.

### 10.2 Nuevas Vistas del Menú Público [/]
- [x] **Variante `grid-compact`**: Grid de 2 o 3 columnas con tarjetas minimalistas (Hecho).
- [x] **Variante `horizontal-slider`**: Carrusel de desplazamiento horizontal (Hecho).
- [x] **Variante `list-minimal`**: Lista de solo texto con precio alineado (Hecho).
- [/] **Variante `bento-grid`**: Diseño asimétrico moderno (En proceso).
- [/] **Variante `masonry`**: Diseño tipo Pinterest (En proceso).
- [x] Actualizar `ProductLists.jsx` y `ProductSection.jsx` para soportar estos nuevos `section_type`.
- [ ] Asegurar responsividad premium en todas las nuevas variantes.

### 10.3 Admin Extras: Rediseño Premium & Funcional [x]
- [x] Modificar `AdminModifierGroups.jsx` para ocupar el 100% del ancho disponible.
- [x] Implementar **Barra de Búsqueda** dinámica por nombre de grupo.
- [x] Añadir **Indicador de Uso**: Badge con el conteo de productos vinculados.
- [x] Implementar funcionalidad de **Duplicar Grupo** (Clone).
- [x] Mejorar visualización de tarjetas:
    - [x] Mostrar vista previa de las primeras 3 opciones.
    - [x] Aplicar efectos hover y sombras premium.
- [ ] Rediseño de Tabla de Inventario (Insumos)
    - [ ] Ampliar contenedor a `max-w-[1600px]`.
    - [ ] Implementar buscador avanzado con iconos.
    - [ ] Añadir Quick Status Toggle (`is_active`).
    - [ ] Pulir indicadores de stock y badges de proveedores.
    - [ ] Mejorar editor de costos inline.
- [ ] Implementar **Deep Search**: Búsqueda que incluya nombres de opciones.
- [ ] Implementar **Quick Status Toggle**: Switch de activo/inactivo en tarjeta.
- [ ] Relative Time en categorías ("Modificado hace 2m").
- [ ] Public Menu: Estilo Bento para item "Hero".
- [ ] Public Menu: Soporte para Masonry Layout.

### 10.4 Refinamientos de UI & UX
- [ ] **Admin Categories**: Implementar tiempo relativo (Hace X min) en columna de actualización.
- [ ] **Product Form**: Unificar estilos del selector de subcategorías con el sistema de diseño.
- [ ] **Public Menu**: Optimizar `ProductCard.jsx` para soporte premium de Bento y Masonry.

---

## 💎 BLOQUE 11: Rediseño Premium de Ajustes (Vision OS) [/]
> Meta: Unificar la estética "Glass-Bento" en todas las pestañas de configuración.

### 11.1 Rediseño de Sedes (`AdminSedes.jsx`) [x]
- [x] Implementar tarjetas "Physical Presence" con efectos de cristal.
- [x] Añadir indicadores visuales de estado (Principal, Activa) con micro-animaciones.
- [x] Rediseñar modal de creación/edición con estilo premium.
- [x] Optimizar vista de "Sede Vacía" con layout bento placeholders.

### 11.2 Rediseño de Staff (`AdminStaff.jsx`) [x]
- [x] Implementar tarjetas de personal con codificación de colores por rol.
- [x] Mejorar visibilidad de PIN y permisos de acceso.
- [x] Rediseñar modal de edición con secciones lógicas (Portal integration).
- [x] Añadir estados de carga y animaciones de entrada.

### 11.3 Rediseño de Pagos (`AdminPaymentMethods.jsx`) [/]
- [ ] Reestructurar cuadrícula de medios de pago para mejor uso de espacio.
- [ ] Implementar tarjetas con iconos distintivos para Nequi, Daviplata, Efectivo, etc.
- [ ] Mejorar visualmente los toggles de estado Activo/Inactivo.
- [ ] Rediseñar modal de configuración con selección visual de tipo de pago.

### 11.4 Pulido de Integración en `AdminSettings.jsx` [/]
- [ ] Verificación de responsive en todas las pestañas.
- [ ] Asegurar coherencia de bordes, sombras y desenfoques (blur).
- [ ] Test de flujo completo (Guardar/Editar/Eliminar) en todos los módulos.


---

## ✅ BLOQUE 12: Finalización de Auth & Onboarding (Aluna Core) [COMPLETADO] 🏆
> Meta: Flujo de entrada profesional, sin IDs técnicos y a prueba de balas.

- [x] Integrar Plan Chips en `GlobalPortal.jsx`
- [x] Join de tablas en `AuthContext.jsx` para traer nombres de planes
- [x] Centralización de Auth Provider para evitar bloqueos de Supabase
- [x] Redirección inteligente `needsOnboarding` → `/completar-registro`
- [x] Branding Audit: Títulos limpios en `App.jsx`
- [x] Registro multi-marca: Soporte para usuarios logueados en `RegisterPage.jsx`
- [x] Normalización de colores "Inteligencia" en sidebar (Premium Glass + Brand Primary)
- [x] Optimización de AuthContext para evitar flashes de carga en focus (TOKEN_REFRESH)
- [ ] Guía de marca personalizada para Google Console (Pendiente de USER)

---

## 🟢 BLOQUE 13: Fase 2.4 — Onboarding de Nueva Marca (GlobalPortal) [COMPLETADO] 🏆
> Meta: Flujo inline para crear una nueva marca directamente desde el portal global.

- [x] **Tarjeta "+" en el Brand Grid:** Tarjeta especial con borde punteado y animación hover rotativa al final del grid.
- [x] **Modal de Creación Inline:** Panel glass con formulario de nombre + tipo de negocio sin salir de la página.
- [x] **Helper `createBrand`:** Crea `brands`, `restaurant_settings`, `home_settings` y staff por defecto.
- [x] **Auto-switch de Marca:** Tras crear, llama a `switchBrand` para activar la nueva marca en sesión.
- [x] **Redirección al Onboarding:** Navega a `/{slug}/#admin/onboarding` para completar la configuración inicial.
- [x] **Feedback visual:** Animación de éxito (`CheckCircle2`) antes de la redirección.
