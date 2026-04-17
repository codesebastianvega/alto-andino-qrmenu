# 📋 Roadmap Operativo: Menú Dinámico "Casas y Habitaciones"
Progreso de la transición a un sistema 100% dinámico y jerárquico.

---

## 🏗️ Fase 1: Datos e Infraestructura
**Objetivo:** Garantizar que Supabase tenga toda la data necesaria.

### Bloque 1.1: Auditoría de Base de Datos
- [x] visualizar columnas `tint_class` y `target_id` en tabla `categories`
- [x] comprobar que `visibility_config` persiste correctamente el array `subcategories`
- [x] asegurar que la tabla `products` permita strings en el campo `subcategory`

### Bloque 1.2: Migración de Metadata
- [x] leer valores de `tintClass` en `src/config/categories.js`
- [x] subir dichos valores a la columna `tint_class` de las categorías correspondientes en DB
- [x] migrar subcategorías hardcodeadas de los archivos `.js` al campo `subcategories` de cada categoría

---

## 🛠️ Fase 2: Admin UX - El Dueño de la "Casa" (Categorías)
**Objetivo:** Gestión total de la jerarquía y estética de la sección.

### Bloque 2.1: Refactor de `CategoryForm.jsx`
- [x] **Tarea Atómica:** Importar y configurar `@hello-pangea/dnd` para la lista de subcategorías
- [x] **Tarea Atómica:** Reemplazar `textarea` de subcategorías por un componente de Lista Ordenable
- [x] **Tarea Atómica:** Añadir input de texto para `tint_class` (clase de fondo)
- [x] **Tarea Atómica:** Validar que el dropdown de `section_type` (Vistas) se mantiene intacto y funcional
- [x] **Tarea Atómica:** Asegurar que los cambios se guarden correctamente en Supabase

---

## 🛋️ Fase 3: Admin UX - Las "Habitaciones" (Productos)
**Objetivo:** Facilitar la organización de productos por subcategoría.

### Bloque 3.1: Refactor de `ProductForm.jsx`
- [x] **Tarea Atómica:** Implementar `useEffect` para detectar cambios en el selector de Categoría
- [x] **Tarea Atómica:** Filtrar el dropdown de Subcategorías basado en la `visibility_config` de la categoría seleccionada
- [x] **Tarea Atómica:** Manejar el estado de "Cargando subcategorías" al cambiar de categoría
- [x] **Tarea Atómica:** Garantizar que se pueda guardar un producto sin subcategoría (sección "Otros")

---

## 📱 Fase 4: El Menú del Cliente (Frontend Público)
**Objetivo:** Renderizado fluido y dinámico basado en las nuevas reglas.

### Bloque 4.1: Refactor de `ProductLists.jsx`
- [/] **Tarea Atómica:** Eliminar importación de `CATEGORIES_LIST`
- [/] **Tarea Atómica:** Implementar lógica de agrupación de productos por el orden establecido en la categoría
- [/] **Tarea Atómica:** Inyectar la clase `tint_class` dinámicamente en el contenedor de cada sección
- [ ] **Tarea Atómica:** Mapear `section_type` a los componentes específicos (SmoothiesSection, etc.)
- [ ] **Tarea Atómica:** Renderizar sección "Otros" al final de la categoría si hay productos huérfanos

---

## 🧹 Fase 5: Limpieza de Legado
**Objetivo:** Eliminar archivos obsoletos y verificar integridad.

### Bloque 5.1: Depuración Técnica
- [ ] eliminar `src/config/categories.js`
- [ ] eliminar `src/config/categories.veggie.js`
- [ ] verificar que ningún componente importe variables de estos archivos
- [ ] walkthrough final de creación y visualización
