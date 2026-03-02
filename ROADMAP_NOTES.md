# Alto Andino — Roadmap Notes

> Notas de features pendientes. Actualizar a medida que se avanza.

---

## V2 — Restaurante (En Progreso)

### 1. Mejoras UX en Modal y Menú (Sandwiches)
- **Eliminar selectores complejos del menú**: En `Sandwiches.jsx`, eliminar los botones de "Tamaño" y "Tipo de pan" del listado principal. El listado solo debe mostrar los nombres base de los sándwiches.
- **Trasladar opciones al Modal**: Usar el sistema de grupos de modificadores para manejar el Tamaño (Clásico/Grande) y el Pan (Baguette/Masa madre) dentro del `ProductQuickView`.
- **Mejorar UI de Modificadores (Modal)**: 
  - Cambiar el diseño de los "Chips" para que sea visualmente claro cuándo es selección múltiple (checkbox/opcional) y cuándo es selección única (radio button/requerido).
  - Suavizar colores: Quitar el rojo de los requeridos para un diseño más premium (tonos tierra o verde oscuro del branding).

### 2. Gestión de Insumos y Categorías (Aclaración de Arquitectura)
Hay dos conceptos separados que no deben mezclarse:
- **Categorías de Insumos (Bodega/Mercado)**: Organizan físicamente el inventario. Propuestas en español: *Básicos y Despensa, Frutas y Verduras, Lácteos y Huevos, Panadería, Proteínas y Carnes, Embutidos, Salsas y Aderezos, Empaques*.
- **Grupos de Modificadores (Menú/UI)**: Organizan cómo el cliente ve las opciones. Ej: *Opciones de leche, Adiciones Desayuno, Tipo de Pan, Tamaño Sándwich*.
*Flujo correcto*: Creas un insumo (ej: "Leche de Almendras") en la categoría "Lácteos y Huevos". Lo marcas como `is_modifier = true` y lo asignas al grupo "Opciones de leche". De esta forma el stock cuadra con la despensa, pero el menú agrupa lógicamente para la venta.

### 3. Control de Stock en Tiempo Real (Restaurant)
- Después de las ventas del día → botón "Importar/Calcular stock actual".
- Generar lista de compras: qué insumos están por debajo del mínimo (rojo = urgente, amarillo = bajo, verde = ok).
- Requiere: `min_stock` y `current_stock` en la tabla `ingredients`.

### 4. Historial de Ventas / Órdenes
- Registrar cada pedido confirmado en Supabase.
- Dashboard semanal/mensual en el admin.

---

## V3 — Tienda / POS

### POS para Tienda Física
- Sistema de punto de venta físico integrado con el mismo stock de insumos.
- Pagos presenciales, impresión de tickets.

### Marketplace / Multi-tenant (Sie Travel V2)
- Panel multi-operador (ventas, huella de carbono, asistentes).

---

## Deuda Técnica Conocida
- `ProductLists.jsx`: secciones hardcodeadas deberían ser genéricas y venir de DB.
- `breakfastAdditions` en `../data/menuItems` → migrar 100% a DB.
- `AdditionsAccordion` → eliminar cuando todos los extras pasen por el modal.

---
_Última actualización: 2026-03-01_