# Arquitectura Técnica — Aluna Ecosystem

Este documento detalla los fundamentos técnicos y las decisiones de diseño arquitectónico que sostienen a **Aluna (Hospitality Operating System)**. Está diseñado para proporcionar una visión de nivel CTO sobre la escalabilidad, seguridad y extensibilidad del sistema.

---

## 1. Modelo de Datos y Multi-Tenancy

Aluna utiliza una arquitectura **Shared-Database, Isolated-Schema (via RLS)**. Esto permite una gestión centralizada con un aislamiento estricto entre clientes.

### 1.1. Jerarquía de Entidades
La estructura de datos sigue una jerarquía de tres niveles:

1.  **Holding (Opcional)**: Agrupación corporativa para dueños de múltiples marcas.
2.  **Brand (Marca)**: La entidad legal y de identidad (ej: "Alto Andino"). Define el catálogo maestro, branding y configuración global.
3.  **Location (Sede/Punto de Venta)**: La instancia operativa física. Gestiona inventario local, pedidos, mesas y empleados específicos.

### 1.2. Aislamiento via Row Level Security (RLS)
Cada tabla en la base de datos de Supabase cuenta con políticas RLS activas.
- **`brand_id`**: Presente en todas las tablas de configuración y catálogo.
- **`location_id`**: Presente en todas las tablas transaccionales (pedidos, inventario, sesiones de mesa).

**Regla de Oro**: Ninguna consulta al cliente final o al administrador de local puede ejecutarse sin un filtro implícito de `brand_id` o `location_id` validado contra el JWT del usuario.

---

## 2. Seguridad y Trazabilidad

### 2.1. Autenticación y Autorización
- **Provider**: Supabase Auth (GoTrue).
- **JWT Claims**: Utilizamos `app_metadata` para almacenar el `role`, `brand_id` y `location_id`. Esto permite que las políticas RLS sean extremadamente eficientes al no requerir joins adicionales para validar permisos.
- **Roles**:
    - `superadmin`: Acceso global (bypass RLS vía service_role en casos críticos).
    - `owner`: Acceso total a nivel Brand.
    - `manager`: Acceso total a nivel Location.
    - `staff`: Acceso operativo (pedidos, cocina).

### 2.2. Estrategia de Audit Logs (Traceability)
Para garantizar la integridad, especialmente durante acciones de "Impersonation" por parte de SuperAdmins, se implementará un sistema de logs inmutables.
- **Tabla**: `audit_logs`.
- **Campos**: `actor_id`, `target_id`, `action_type`, `old_data`, `new_data`, `is_impersonation` (boolean), `timestamp`.
- **Mecanismo**: Triggers de base de datos que capturan cambios en tablas críticas (productos, precios, configuraciones legales) y los insertan en la tabla de auditoría.

---

## 3. Infraestructura Híbrida de IA (Aluna Brain)

Aluna no es solo un software de gestión, es una plataforma agentica. La IA se despliega de forma híbrida para optimizar costos y latencia.

### 3.1. Supabase Edge Functions (Lógica Síncrona)
Utilizadas para interactuar con LLMs (OpenAI/Anthropic) de forma segura.
- **Casos de uso**: Concierge Virtual, Generación de Menús Inteligentes, Análisis de sentimiento de reseñas.
- **Seguridad**: Las API Keys de IA residen exclusivamente en las variables de entorno de Supabase, nunca en el cliente (Vite).

### 3.2. n8n Self-hosted (Orquestación Asíncrona)
n8n actúa como el "sistema nervioso" para integraciones complejas y flujos de larga duración.
- **Mesero IA (WhatsApp)**: Procesamiento de mensajes entrantes de WhatsApp, validación con el menú en tiempo real y creación de pedidos en la DB.
- **Costos**: Al ser self-hosted, eliminamos los costos por ejecución de plataformas como Zapier o Make.

---

## 4. Extensibilidad y Ecosistema Enterprise

Aluna está diseñado para integrarse en el flujo contable y operativo de grandes empresas.

### 4.1. Webhooks Outbound
El sistema emite eventos en tiempo real cuando ocurren acciones clave:
- `order.completed` -> Sincronización automática con ERPs (ej. Siigo, Alegra).
- `inventory.low` -> Notificaciones a proveedores.

### 4.2. Public API (Estrategia API-First)
Exponemos una capa de API REST (vía PostgREST de Supabase) para que clientes Enterprise puedan construir sus propios tableros o integraciones personalizadas.
- **Documentación**: Generada automáticamente vía Swagger/OpenAPI a partir del esquema de la base de datos.

---

## 5. Stack Tecnológico

- **Frontend**: React (Vite) + Tailwind CSS. Arquitectura de componentes atómicos.
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions, Realtime).
- **PWA**: Soporte offline básico para el menú y visualización de pedidos en cocina.
- **Observabilidad**: Logs de Edge Functions + Supabase Reports.

---

## 6. Principios de Diseño
1.  **Mobile First**: Todo el flujo operativo debe ser ejecutable desde un smartphone.
2.  **Zero Configuration**: El sistema debe autoconfigurarse basado en la categoría del restaurante.
3.  **Invisible Tech**: La tecnología debe estar al servicio de la hospitalidad, no al revés.
