# Seguridad y Auditoría — Aluna HOS

Este documento establece los protocolos de trazabilidad y las salvaguardas de seguridad necesarias para garantizar que cada acción dentro del ecosistema Aluna sea responsable, auditable e inmutable.

---

## 1. El Desafío del SuperAdmin
El rol de `superadmin` posee capacidades de acceso global para soporte técnico y configuración avanzada. Sin embargo, este poder conlleva el riesgo de acciones no autorizadas. 

### 1.1. Impersonation (Suplantación)
Cuando un SuperAdmin entra en el panel de un cliente para resolver un problema, el sistema debe marcar explícitamente que la sesión es una **suplantación**.
- **Regla**: Toda acción realizada bajo impersonation debe llevar el flag `is_impersonation = true` y el `actor_id` del SuperAdmin real.

---

## 2. Sistema de Audit Logs (Trazabilidad)

Para cumplir con estándares Enterprise, implementaremos una tabla de auditoría centralizada.

### 2.1. Estructura de la Tabla `audit_logs`
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES auth.users(id),        -- Quién hizo la acción
  brand_id UUID REFERENCES brands(id),            -- A qué marca afecta
  location_id UUID REFERENCES locations(id),      -- A qué sede afecta
  action_type TEXT NOT NULL,                      -- CREATE, UPDATE, DELETE, LOGIN, IMPERSONATE
  entity_name TEXT NOT NULL,                      -- 'products', 'orders', 'legal_info', etc.
  entity_id UUID,                                 -- ID del registro afectado
  old_data JSONB,                                 -- Estado anterior
  new_data JSONB,                                 -- Estado nuevo
  ip_address TEXT,                                -- Origen de la conexión
  user_agent TEXT,                                -- Dispositivo/Navegador
  is_impersonation BOOLEAN DEFAULT FALSE,         -- ¿Fue un SuperAdmin suplantando?
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2. Acciones Críticas a Auditar
1.  **Cambios en Precios**: Variaciones en el catálogo de productos.
2.  **Configuración Legal**: Edición de NIT, resoluciones DIAN, datos bancarios.
3.  **Gestión de Usuarios**: Creación/Eliminación de administradores de local.
4.  **Impersonation Sessions**: Inicio y fin de una sesión de suplantación.
5.  **Destructive Actions**: Eliminación de marcas, sedes o registros históricos.

---

## 3. Garantías de Inmutabilidad

Para que un log sea válido, no debe poder ser modificado ni siquiera por el autor de la acción.
- **RLS**: Nadie (excepto el sistema via `service_role`) puede hacer `UPDATE` o `DELETE` en la tabla `audit_logs`. Solo se permite `INSERT` (vía triggers) y `SELECT` (para visualización).
- **Triggers**: Utilizaremos triggers de PostgreSQL para automatizar la captura de cambios en tablas sensibles, reduciendo la posibilidad de omitir logs desde el código frontend.

---

## 4. Visualización para el Cliente (Transparencia)

Los dueños de marcas (`owners`) tendrán acceso a un "Registro de Actividad" en su panel.
- **Transparencia**: Si un SuperAdmin modifica algo, el dueño verá: *"Modificado por Soporte Aluna (Admin: Juan Pérez) - Fecha - Detalle"*.
- **Confianza**: Esto elimina la percepción de que Aluna puede manipular datos sin supervisión del cliente.

---

## 5. Protocolo de Incidencias
En caso de detectar una acción sospechosa en los logs:
1.  Bloqueo preventivo de la cuenta del `actor_id`.
2.  Revisión manual de los cambios en la DB.
3.  Notificación automática al `owner` de la marca afectada.
