# Definición de Planes y Límites - Aluna SaaS

Este documento define la verdad absoluta sobre lo que incluye cada plan para su implementación en el código.

## 📊 Matriz de Planes (Base de Datos Real)

| Característica | Emprendedor | Esencial | Profesional | Enterprise |
| :--- | :---: | :---: | :---: | :---: |
| **Costo Mensual** | **$0** (Gratis) | **$49,000** | **$99,000** | **Custom** |
| **Límite Productos** | 20 | 50 | Ilimitado | Ilimitado |
| **Límite Categorías** | 5 (Propuesto) | 15 (Propuesto) | Ilimitado | Ilimitado |
| **Administradores** | 1 | 1 | 3 | Ilimitado |
| **Sedes (Locales)** | ❌ No | ❌ No | ✅ Sí | ✅ Sí |

## 🛠️ Feature Flags (Módulos)

| Módulo | Emprendedor | Esencial | Profesional | Enterprise |
| :--- | :---: | :---: | :---: | :---: |
| **Menú QR & WhatsApp** | ✅ | ✅ | ✅ | ✅ |
| **Panel de Control** | ✅ | ✅ | ✅ | ✅ |
| **Analítica** | Básico | Básico | Avanzado | Avanzado |
| **KDS (Cocina)** | ❌ | ❌ | ✅ | ✅ |
| **Inventario & Recetas** | ❌ | ❌ | ✅ | ✅ |
| **Branding Pro** | ❌ | ✅ | ✅ | ✅ |
| **CRM / Clientes** | ❌ | ❌ | ❌ | ✅ |

---

## 🚩 Acciones de Control Requeridas (El "Trabajo" que queda)

Para que estos límites funcionen, debemos aplicar estas reglas en el código:

1. **Sedes:** En el plan Emprendedor/Esencial, el usuario NO puede crear más de una sede. El `BrandSwitcher` o `AdminSedes` debe bloquear la creación.
2. **Categorías:** El campo `max_categories` está en NULL en la DB. Debemos definirlo (propongo 5 para Emprendedor) y validarlo en `AdminCategories.jsx`.
3. **Staff:** El plan Emprendedor no permite "Staff" (meseros/cocina). El acceso a `AdminStaff.jsx` debe estar bloqueado.
4. **KDS:** Si intentan entrar a `/admin/kitchen` con plan Esencial, debe mostrar un "Upgrade Prompt".

