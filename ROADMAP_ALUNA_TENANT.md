# 🗺️ Hoja de Ruta Aluna SaaS: Transformación Multi-Tenant

**Estado:** 🟢 Fase 1 - Perfil del Propietario Finalizada  
**Objetivo:** Escalar Aluna a una plataforma SaaS donde un dueño gestione múltiples marcas, cada una con múltiples sedes e inventarios independientes.

---

## 🟦 FASE 1: Identidad del Dueño (Mi Perfil) 🏁 [COMPLETADO] 🏆
> Gestión de la cuenta personal del usuario antes de saltar a las marcas.
- [x] **Preparación Base de Datos:** Columna `avatar_url` añadida a `profiles`.
- [x] **Infraestructura de Almacenamiento:** Bucket `avatars` configurado en Supabase.
- [x] **1.1 Página de Perfil (`AdminProfile.jsx`):** Interfaz premium para ver y editar datos de la cuenta (Nombre, Apellidos, Teléfono).
- [x] **1.2 Gestión de Avatar:** Carga de foto de perfil vinculada al usuario en `profiles` (Supabase Storage).
- [x] **1.3 Seguridad de Cuenta:** Formulario para cambio de contraseña integrada con Supabase Auth.
- [x] **1.4 Actualización de Email:** Flujo de cambio de correo con verificación de seguridad.

---

## 🟦 FASE 2: Portal Global & Brand Switcher 🏁 [COMPLETADO] 🏆
> El punto de entrada para usuarios con múltiples negocios.
- [x] **2.1 Brand Selector Canvas:** Nueva pantalla post-login que muestra tarjetas de todas las marcas asociadas al usuario.
- [x] **2.2 Lógica de Persistencia de Marca:** Guardar `activeBrandId` en localStorage para mantener la sesión en la marca elegida.
- [x] **2.3 Acceso Rápido desde Sidebar:** Botón en el sidebar para cambiar de marca sin cerrar sesión.
- [ ] **2.4 Onboarding de Nueva Marca:** Botón "+" para iniciar el flujo de creación de una marca desde cero.

---

## 🟦 FASE 3: Infraestructura de Datos Multi-Sede (Core DB)
> Preparar la base técnica para la segmentación operativa.
- [ ] **3.1 Refactor de la tabla `locations`:** Asegurar que cada registro dependa de un `brand_id`.
- [ ] **3.2 Inyección de `location_id`:** Añadir columna en las tablas `orders`, `analytics_events` y `tables`.
- [ ] **3.3 Tabla `location_inventory`:** Creación de tabla para mapear `product_id` + `location_id` + `stock`.
- [ ] **3.4 Tabla `location_product_status`:** Permitir que un producto esté "Agotado" en Sede A pero "Disponible" en Sede B.

---

## 🟦 FASE 4: Gestión de Sedes (Física & Operativa)
> Panel para que el Owner configure sus locales.
- [ ] **4.1 CRUD de Sedes Pro:** Mejora de `AdminSedes.jsx` con mapa, horarios y datos de contacto específicos.
- [ ] **4.2 Selector de Sede Global:** Switcher en el Header del Admin para filtrar TODA la vista actual por una sede específica.
- [ ] **4.3 QR Generator por Sede:** Lógica para generar códigos QR que apunten a la URL de la marca con el parámetro de sede pre-cargado.

---

## 🟦 FASE 5: Inventario Localizado (Stock por Sede)
> El corazón de la operación para marcas grandes.
- [ ] **5.1 UI de Inventario Multi-Sede:** En `AdminProducts`, al editar un producto, mostrar un desglose de stock por cada sede abierta.
- [ ] **5.2 Alertas de Stock Bajo por Sede:** Notificaciones específicas cuando un insumo se agota en una sucursal.
- [ ] **5.3 Transferencias entre Sedes:** (Opcional) Funcionalidad básica para mover stock de un inventario a otro.

---

## 🟦 FASE 6: Sistema RBAC (Roles & Invitaciones por Email)
> Seguridad y delegación basada en correos electrónicos.
- [ ] **6.1 Invitación por Email:** El Owner introduce un correo y selecciona un rol (Manager, Mesero, Cocina).
- [ ] **6.2 Tabla de Mapeo de Permisos:** Estructura que vincula `email` + `brand_id` + `role`.
- [ ] **6.3 Auto-Vinculación al Registro:** Cuando un invitado se registra, Aluna lo vincula automáticamente a la marca correspondiente.
- [ ] **6.4 Gestión de Staff:** Lista unificada en `AdminStaff` para revocar accesos o cambiar roles.

---

## 🟦 FASE 7: Gating de Funcionalidades (Planes & Límites)
> Programar el sistema de restricciones según la suscripción.
- [ ] **7.1 Definición de JSON de Planes:** Archivo `subscriptionPlans.js` con límites de productos, sedes y acceso a IA.
- [ ] **7.2 Hook `usePlanLimits`:** Función global para verificar si el usuario puede realizar una acción (ej: crear otra sede).
- [ ] **7.3 UI de Restricción:** Componente `PlanGuard` para bloquear secciones o mostrar botones de "Upgrade".

---

## 🟦 FASE 8: Plan Gratis (Menú Core)
> Optimización de la oferta base.
- [ ] **8.1 Límites del Plan Gratis:** (Ej: 1 Sede, 50 Productos, No Analíticas).
- [ ] **8.2 Menú QR Standard:** Acceso total al menú pero sin analíticas avanzadas.
- [ ] **8.3 Pedidos a WhatsApp:** Asegurar que el flujo básico de pedidos funcione sin costo.

---

## 🟦 FASE 9: Plan Esencial (Landing + Experiencias)
> Valor agregado para marcas que crecen.
- [ ] **9.1 Activación de Landing Page:** Habilitar la personalización de la página de inicio de la marca.
- [ ] **9.2 Módulo de Experiencias:** Permitir la creación de eventos, promociones y historias tipo Instagram.
- [ ] **9.3 Analíticas Básicas:** Acceso a métricas de visitas y productos más vistos.

---

## 🟦 FASE 10: Plan Pro (Inteligencia Operativa)
> Control total para negocios establecidos.
- [ ] **10.1 Analíticas Avanzadas:** Filtros de tiempo, ticket promedio y rendimiento por mesero.
- [ ] **10.2 IA Flash Integration:** El asistente de IA responde preguntas sobre ventas y stock.
- [ ] **10.3 Gestión de Recetas y Costos:** Acceso al módulo de rentabilidad y márgenes.

---

## 🟦 FASE 11: Plan Enterprise (Custom Tech)
> Personalización y features únicas.
- [ ] **11.1 Whitelabel Parcial:** Opción de ocultar "Potenciado por Aluna".
- [ ] **11.2 API Access:** Permitir que el cliente use sus propias llaves de OpenAI/Google para la IA.
- [ ] **11.3 Dominios Propios:** Soporte técnico para apuntar dominios personalizados a su menú.

---

## 🟦 FASE 12: Dashboard de Analíticas Localizadas
> Ver cómo rinde cada sucursal de forma independiente.
- [ ] **12.1 Comparativa entre Sedes:** Gráficos que comparan ventas de Sede A vs Sede B.
- [ ] **12.2 Reportes de Exportación:** Generar PDFs/CSVs con el rendimiento segmentado por sede.

---

## 🟦 FASE 13: Notificaciones & Alertas en Tiempo Real
> Informar al staff y al dueño sobre eventos críticos.
- [ ] **13.1 Notificaciones de Pedido:** Alerts sonoros y visuales segmentados por `location_id`.
- [ ] **13.2 Alertas de Gestión:** Notificar al Owner cuando una marca se queda sin stock o cuando llega una reseña negativa.

---

## 🟦 FASE 14: IA Nivel 1 — Lite (Sugerencias Básicas)
- [ ] **14.1 IA en el Menú:** Sugerencias inteligentes al cliente basadas en el JSON del menú.
- [ ] **14.2 IA de Redacción:** Ayuda al dueño a escribir descripciones de platos atractivas.

---

## 🟦 FASE 15: IA Nivel 2 — Flash (Data Insight)
- [ ] **15.1 Chat con tus Datos:** Bot en el Dashboard para preguntar "¿Cuál fue mi mejor hora el sábado pasado?".
- [ ] **15.2 Predicciones Simple:** Proyectar ventas basadas en el histórico de la sede.

---

## 🟦 FASE 16: IA Nivel 3 — Custom Enterprise
- [ ] **16.1 Panel de Modelos:** El cliente selecciona si quiere usar GPT-4, Gemini o Claude (usando sus propias llaves).
- [ ] **16.2 Entrenamiento Local:** (Concepto) IA que "aprende" del tono de voz de la marca específica.

---

## 🟦 FASE 17: Sistema de Landing Page CMS v2
> Mejorar cómo las marcas se venden al mundo.
- [x] **17.1 Editor Visual de Hero:** Cambiar imágenes y textos de la landing sin código.
- [x] **17.2 Bloque de Testimonios Dinámico:** Integración con las reseñas reales que dejan los clientes.

---

## 🟦 FASE 18: Seguridad & Auditoría Multi-Tenant
- [ ] **18.1 Revisión de RLS (Supabase):** Asegurar que NADIE pueda ver datos de otra marca aunque inyecten IDs.
- [ ] **18.2 Logs de Acceso:** Historial de quién hizo qué en el panel administrativo.

---

## 🟦 FASE 19: Marketplace & Add-ons
- [ ] **19.1 Tienda de Extensiones:** Activar/Desactivar módulos (ej: Solo CRM, Solo Inventario).
- [ ] **19.2 Sistema de Facturación SaaS:** Integración con pasarela de pagos para el cobro del plan mensual.

---

## 🟦 FASE 20: Pulido Final & Lanzamiento SaaS
- [ ] **20.1 Documentación para Usuario Final:** Guías de configuración de marca y sedes.
- [ ] **20.2 QA General:** Pruebas de estrés en el flujo de cambio entre múltiples marcas.
- [ ] **20.3 Readiness Check:** Verificación de que el sistema es 100% multi-tenant y escalable.

---

> [!NOTE]
> Esta hoja de ruta es flexible. Marcamos como completado a medida que avanzamos, pero el orden se mantiene para asegurar cimientos sólidos.
