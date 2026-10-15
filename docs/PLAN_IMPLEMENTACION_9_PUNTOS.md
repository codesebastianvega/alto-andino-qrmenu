# 🗺️ Plan Maestro de Implementación: 9 Pasos de Operación, UI y Plataforma Aluna

> **Documento de Especificación y Hoja de Ruta Técnica**  
> **Proyecto:** Aluna QR Menu & POS  
> **Fecha:** 15 de Octubre de 2026  
> **Versión:** 1.0.0

---

## 📑 Índice de los 9 Pasos

1. [Paso 1: Modernización de UI y Responsive en Tablet para Pedidos (`AdminOrders.jsx`)](#paso-1-modernización-de-ui-y-responsive-en-tablet-para-pedidos)
2. [Paso 2: Coordinación Desacoplada Cocina (KDS) vs. Barra (BDS) con Notificaciones Cruzadas y Cronómetro](#paso-2-coordinación-desacoplada-cocina-kds-vs-barra-bds-con-notificaciones-cruzadas-y-cronómetro)
3. [Paso 3: Optimización Ergonómica de Toma de Pedidos en Tablet (`AdminWaiter.jsx`)](#paso-3-optimización-ergonómica-de-toma-de-pedidos-en-tablet)
4. [Paso 4: Fichas Técnicas & Layout de Estaciones de Cocina 100% Personalizable (`AdminRecipes.jsx`)](#paso-4-fichas-técnicas--layout-de-estaciones-de-cocina-100-personalizable)
5. [Paso 5: Lista de Compras Personalizada Multicanal con WhatsApp Libre (`ShoppingListBoard.jsx`)](#paso-5-lista-de-compras-personalizada-multicanal-con-whatsapp-libre)
6. [Paso 6: Sincronización Confiable de Horarios en Footer y Navegación (`Footer.jsx`)](#paso-6-sincronización-confiable-de-horarios-en-footer-y-navegación)
7. [Paso 7: Configuración y Despliegue de Medios de Pago Completos (Nequi, Bre-B, Transferencias)](#paso-7-configuración-y-despliegue-de-medios-de-pago-completos)
8. [Paso 8: Previsualización Dinámica de Enlace en WhatsApp y Redes por Marca (OpenGraph Serverless)](#paso-8-previsualización-dinámica-de-enlace-en-whatsapp-y-redes-por-marca)
9. [Paso 9: Dinamización Inteligente de Sección "Must Try" y Destacados del Catálogo Vivo](#paso-9-dinamización-inteligente-de-sección-must-try-y-destacados-del-catálogo-vivo)

---

## Paso 1: Modernización de UI y Responsive en Tablet para Pedidos

### 1.1 Objetivo
Eliminar el estilo excesivamente redondeado ("bubble") y resolver la compresión de información en tabletas (768px a 1180px), adoptando un estándar SaaS POS limpio, moderno y de alta densidad de información.

### 1.2 Archivos Involucrados
* `src/pages/AdminOrders.jsx`
* `src/components/admin/AdminLayout.jsx`

### 1.3 Cambios Específicos
1. **Rediseño Geométrico:**
   * Cambiar contenedores Kanban de `rounded-[2.5rem]` a `rounded-xl` (12px).
   * Cambiar tarjetas de pedido de `rounded-[2rem]` a `rounded-lg` (8px / 10px).
   * Sustituir bordes gruesos de 2px con gradientes saturados por bordes sutiles de 1px (`border-slate-200/80`).
   * Encabezados de columna con acento cromático superior (barra fina de 3px: azul para Nuevos, naranja para Cocina, verde para Listos, púrpura para En Mesa/Camino).
2. **Layout Adaptativo para Tablet (Ergonomía Táctil):**
   * Reemplazar la grilla rígida `md:grid-cols-4` (que forzaba 4 columnas de apenas 120-150px de ancho en pantallas de 768px a 1024px) por un contenedor Kanban con **desplazamiento horizontal fluido y snap**:
     ```jsx
     <div className="flex flex-row overflow-x-auto gap-4 snap-x pb-4">
       {/* Columnas con min-width ergonómico */}
       <div className="min-w-[300px] md:min-w-[320px] max-w-[360px] flex-1 snap-start ...">
     ```
   * En tablet, el usuario ve 2 o 3 columnas nítidas y puede deslizar con el dedo con total fluidez sin que los textos se apreten o quiebren.
3. **Optimización de Espaciados (Densidad de Información):**
   * Padding de tarjeta reducido de `p-6` a `p-4`.
   * Padding de columna reducido de `p-6` a `p-3.5`.
   * Espacio entre columnas optimizado a `gap-3.5`.

---

## Paso 2: Coordinación Desacoplada Cocina (KDS) vs. Barra (BDS) con Notificaciones Cruzadas y Cronómetro

### 2.1 Objetivo
Evitar que al marcar "Bebidas Listas" en la Barra desaparezca la orden de la Cocina (o viceversa), introducir una campana/notificación interna en tiempo real entre ambas estaciones, y dotar a cada comanda de un cronómetro con semáforo según el tiempo meta.

### 2.2 Esquema de Base de Datos (Supabase SQL)
Ejecutar migración en Postgres:
```sql
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS kitchen_status text DEFAULT 'pending' CHECK (kitchen_status IN ('none', 'pending', 'preparing', 'ready')),
ADD COLUMN IF NOT EXISTS bar_status text DEFAULT 'pending' CHECK (bar_status IN ('none', 'pending', 'preparing', 'ready')),
ADD COLUMN IF NOT EXISTS kitchen_ready_at timestamptz NULL,
ADD COLUMN IF NOT EXISTS bar_ready_at timestamptz NULL;
```

### 2.3 Archivos Involucrados
* `src/pages/AdminKitchen.jsx`
* `src/pages/AdminBar.jsx`
* `src/pages/AdminOrders.jsx`
* `src/utils/soundService.js`

### 2.4 Lógica de Coordinación
1. **Detección Automática de Ítems en la Comanda:**
   * Si el pedido contiene solo bebidas -> `kitchen_status = 'none'`.
   * Si el pedido contiene solo comida -> `bar_status = 'none'`.
   * Si contiene ambos -> ambos inician en `'pending'`.
2. **Despacho Independiente en Barra (`AdminBar.jsx`):**
   * Al hacer clic en *"Bebidas Listas ✓"*, actualiza `{ bar_status: 'ready', bar_ready_at: now() }`.
   * **Regla de despacho global:** Si `kitchen_status` ya está en `'ready'` o `'none'`, entonces y solo entonces la orden general pasa a `orders.status = 'ready'`. Si la cocina aún está preparando, la comanda sigue activa y visible en Cocina.
3. **Despacho Independiente en Cocina (`AdminKitchen.jsx`):**
   * Al hacer clic en *"Marcar Listo ✓"*, actualiza `{ kitchen_status: 'ready', kitchen_ready_at: now() }`.
   * Solo pasa a `orders.status = 'ready'` si `bar_status` ya está en `'ready'` o `'none'`.
4. **Notificación Cruzada en Tiempo Real (Postgres Changes):**
   * Si Barra marca listo: Cocina escucha el cambio en Realtime, reproduce un timbre suave (`soundService.playOrderReady()`), despliega un Toast discreto (*"🍸 Bebidas listas para Mesa 4 (#A1B2)"*) y enciende un badge `[🍸 BEBIDAS YA LISTAS]` en la tarjeta de cocina.
   * Si Cocina marca listo primero: Barra recibe *"🍳 Platos listos"* y enciende el badge `[🍳 COCINA YA LISTA]`.
5. **Cronómetro Inteligente de Preparación:**
   * Conteo visual en `mm:ss` desde `created_at`.
   * Comparación contra `target_prep_time_mins` (ej. 15 min):
     * *Verde (< 60% tiempo meta):* Preparación en tiempo óptimo.
     * *Ámbar (60% - 100%):* Próximo a tiempo límite.
     * *Rojo intermitente (> 100%):* Retrasado, indicando minutos de exceso (ej. `+4m`).

---

## Paso 3: Optimización Ergonómica de Toma de Pedidos en Tablet

### 3.1 Objetivo
Permitir que el mesero o cajero que opere una tablet tenga acceso inmediato al mapa de mesas sin tener que hacer scroll, optimizando la distribución del salón y las acciones rápidas.

### 3.2 Archivos Involucrados
* `src/pages/AdminWaiter.jsx`

### 3.3 Cambios Específicos
1. **Reordenamiento Vertical en Tablet (< 1024px):**
   * Invertir las clases `order-1` y `order-2` para que el **Mapa del Salón se ubique siempre primero en la parte superior**, permitiendo interactuar con las mesas de inmediato sin desplazar la pantalla.
2. **Barra de Acciones Rápidas Compacta:**
   * En tabletas, reemplazar el panel lateral derecho de 340px por una **barra superior de chips táctiles de 44px** (*"🛍️ Para Llevar"*, *"🛵 Domicilio"*), liberando el 100% del ancho del viewport para el salón de mesas.
3. **Rediseño de Tarjetas de Mesa:**
   * Cambiar de `rounded-[2rem]` a `rounded-xl` con borde nítido.
   * Mantener los indicadores visuales que gustan al usuario: números grandes en Outfit, colores de estado (verde disponible, ámbar ocupada, naranja sucia).
4. **Quick Peek Drawer al Tocar Mesa Ocupada:**
   * Panel lateral deslizable que muestra de un vistazo:
     * Consumo actual de la mesa con total a pagar.
     * Estado de preparación en cocina y barra.
     * Botones directos: *"➕ Agregar más"*, *"💳 Cobrar Mesa"*, *"🧹 Marcar Limpia"*.

---

## Paso 4: Fichas Técnicas & Layout de Estaciones de Cocina 100% Personalizable

### 4.1 Objetivo
Incorporar búsqueda y filtros por categoría, estación e ingrediente en el recetario, y transformar la pestaña de "Layout de Estaciones" en una **herramienta viva y editable donde cada restaurante pueda modelar las zonas físicas y equipos de su propia cocina** (deshardcodeando Boku Bento).

### 4.2 Base de Datos (Supabase SQL)
Agregar columna JSONB a `restaurant_settings`:
```sql
ALTER TABLE public.restaurant_settings 
ADD COLUMN IF NOT EXISTS kitchen_stations_layout jsonb DEFAULT '[]'::jsonb;
```

### 4.3 Archivos Involucrados
* `src/pages/AdminRecipes.jsx`
* `src/components/admin/KitchenStationLayout.jsx`
* `src/hooks/useAdminRecipes.js`

### 4.4 Cambios Específicos
1. **Barra de Búsqueda y Filtros en Recetas:**
   * Input de texto con lupa para filtrar en vivo por nombre o descripción de receta/sub-receta.
   * Filtro selector por Categoría de plato (Bowls, Bentos, Entradas, Bebidas, Postres).
   * Filtro selector por Estación asignada (`storage_location` o estación de prep).
   * Filtro selector por Insumo utilizado (ej. listar todas las recetas que usan *Pechuga de Pollo*).
   * Habilitar filtros de margen y costo también en sub-recetas (corrigiendo la exclusión en línea 515).
2. **Layout de Estaciones 100% Personalizable por el Admin:**
   * Modo Administrador en `KitchenStationLayout.jsx` con botón `+ Agregar Estación / Zona`.
   * Modal de Edición de Estación:
     * *Nombre de la estación:* (ej. Parrilla, Freidoras, Estación Fría, Pizzería, Barra, Nevera 1).
     * *Ubicación / Subtítulo:* (ej. Zona Caliente, Salón Principal).
     * *Temperatura / Ambiente:* (ej. 2°C - 4°C, Ambiente 20°C, Fuego 180°C).
     * *Color de Acento e Icono.*
     * *Descripción operativa.*
     * *Equipos & Mise en Place vinculados:* Lista dinámica de ítems con nombre, ubicación interna y criticidad.
   * Persistencia en Supabase: Se almacena en `restaurant_settings.kitchen_stations_layout`. Si un restaurante nuevo no ha configurado estaciones, se le ofrece un botón para "Cargar plantilla estándar de restaurante" o "Crear desde cero".

---

## Paso 5: Lista de Compras Personalizada Multicanal con WhatsApp Libre

### 5.1 Objetivo
Permitir al administrador consolidar insumos de varios proveedores o crear una lista de compras ad-hoc para enviarla por WhatsApp a cualquier número telefónico personalizado (sin obligar a separarlos rígidamente por proveedor).

### 5.2 Archivos Involucrados
* `src/pages/AdminModifiers.jsx` (pestaña Lista de Compras)
* `src/components/admin/ShoppingListBoard.jsx`
* Crear: `src/components/admin/CustomShoppingListModal.jsx`

### 5.3 Cambios Específicos
1. **Botón Destacado en Toolbar:**
   * En `ShoppingListBoard.jsx`, agregar el botón `"⚡ Enviar Lista Personalizada / Libre"`.
2. **Modal Interactivo `CustomShoppingListModal.jsx`:**
   * **Destinatario Flexible:** Selector para elegir un proveedor registrado o ingresar un número libre con indicativo internacional (por defecto `+57` para Colombia).
   * **Canasta de Insumos con Selección Rápida:**
     * Checkboxes para marcar qué insumos incluir de todo el inventario.
     * Edición de cantidades in-situ.
     * Campo de notas por ítem (ej. *"fresca, no congelada"*, *"maduro para hoy"*, *"paquete con tapa"*).
   * **Notas Generales de Entrega:** Horario límite de entrega, sede destino o instrucciones de facturación.
   * **Previsualizador de Mensaje en Tiempo Real:** Caja de vista previa que muestra el texto formateado con negritas de WhatsApp:
     ```text
     🛒 *LISTA DE COMPRAS - BOKU BENTO (Sede Principal)*
     Hola Don Pedro, requerimos el siguiente pedido:
     • 10 kg - Pechuga de Pollo _(fresca no congelada)_
     • 25 und - Aguacate Hass _(para hoy)_
     • 2 pqte - Bowls Kraft 32oz _(con tapa)_

     📝 *Instrucciones:* Entregar antes de las 10:00 AM.
     ```
   * **Acciones:** Botón directo *"Enviar por WhatsApp (`wa.me`)"* + botón *"Copiar Texto"* para pegarlo en chats grupales o correos.

---

## Paso 6: Sincronización Confiable de Horarios en Footer y Navegación

### 6.1 Objetivo
Garantizar que los horarios configurados en el panel de administración se reflejen de forma 100% fiel en el pie de página (`Footer.jsx`), resolviendo el desorden de días en Postgres y la pérdida de herencia entre sedes.

### 6.2 Archivos Involucrados
* `src/context/MenuDataContext.jsx`
* `src/components/Footer.jsx`
* `src/pages/AdminSettings.jsx`
* `src/utils/businessHours.js`

### 6.3 Cambios Específicos
1. **Ordenamiento SQL Determinista:**
   * En `MenuDataContext.jsx` (línea 131), modificar la consulta a:
     ```javascript
     brandFilter(supabase.from('business_hours').select('*').order('day_of_week', { ascending: true }))
     ```
2. **Normalización y Herencia en `Footer.jsx`:**
   * Asegurar el orden de días en memoria (`.sort((a, b) => a.day_of_week - b.day_of_week)`).
   * **Herencia automática de horarios:** Si la sede principal no cuenta con horarios específicos configurados, heredar de inmediato los horarios globales de la marca (`location_id IS NULL`), evitando caer en fallbacks quemados.
3. **Sincronización al Guardar en `AdminSettings.jsx`:**
   * Al guardar los 7 días en `business_hours`, generar automáticamente un string resumen (ej. *"Lun - Sáb: 12:00 - 20:00"*) y actualizar `brands.schedule_days` y `brands.schedule_hours`, asegurando que el fallback de emergencia coincida exactamente con la configuración real.

---

## Paso 7: Configuración y Despliegue de Medios de Pago Completos

### 7.1 Objetivo
Permitir a cada negocio ingresar los datos completos de sus cuentas (Bancolombia, Nequi, Daviplata, Llave Bre-B, QR de pago) y mostrarlos de forma clara y copiable tanto en el checkout del cliente (`CartModal.jsx`) como en el seguimiento del pedido (`OrderStatus.jsx`).

### 7.2 Archivos Involucrados
* `src/pages/AdminPaymentMethods.jsx`
* `src/components/CartModal.jsx`
* `src/pages/OrderStatus.jsx`
* `src/hooks/usePaymentMethods.js`

### 7.3 Cambios Específicos
1. **Estructuración del Campo `config` (JSONB) en `payment_methods`:**
   ```json
   {
     "bank_name": "Bancolombia",
     "account_number": "123-456789-00",
     "account_type": "Ahorros",
     "holder_name": "Boku Bento S.A.S.",
     "holder_id": "901.234.567-8",
     "phone": "3101234567",
     "bre_b_key": "bokubento@bancolombia",
     "qr_image_url": "https://.../qr.png",
     "instructions": "Envía tu comprobante con el número de pedido"
   }
   ```
2. **Formulario de Configuración en `AdminPaymentMethods.jsx`:**
   * Si el tipo es `transfer` o `digital_wallet`, desplegar campos dedicados para:
     * Banco y Tipo de Cuenta.
     * Número de Cuenta / Teléfono Nequi/Daviplata.
     * Nombre del Titular y Cédula/NIT.
     * Llave de interoperabilidad Bre-B.
     * Carga de imagen para Código QR de pago.
3. **Visualización en el Checkout del Cliente (`CartModal.jsx`):**
   * Al elegir Nequi, Daviplata, Bre-B o Transferencia, mostrar una tarjeta estética con:
     * El número de cuenta o celular en tamaño destacado con botón **"Copiar" en 1 clic**.
     * Botón para abrir modal con el QR de pago escaneable.
4. **Visualización en Pantalla de Seguimiento (`OrderStatus.jsx`):**
   * En el banner de "Confirmación de Pago Pendiente", desplegar la tarjeta con los datos de transferencia para que el comensal no tenga que preguntar por WhatsApp a qué número transferir.

---

## Paso 8: Previsualización Dinámica de Enlace en WhatsApp y Redes por Marca

### 8.1 Objetivo
Permitir que al compartir el enlace de cualquier restaurante (ej. `https://aluna-qrmenu.vercel.app/boku-bento/`) en WhatsApp, Facebook o redes sociales, se previsualice el logo o portada oficial de la marca y su descripción, en lugar del favicon genérico de Aluna.

### 8.2 Archivos Involucrados
* `vercel.json`
* `api/og.js` (o serverless edge function)
* `index.html`

### 8.3 Cambios Específicos
1. **Corrección de Rewrite para Bots en `vercel.json`:**
   * Configurar una regla compatible con Vercel Edge para interceptar a los crawlers de WhatsApp (`WhatsApp/`, `facebookexternalhit/`, `Twitterbot`, etc.) y dirigir la petición a la función serverless:
     ```json
     {
       "source": "/:slug",
       "has": [
         {
           "type": "header",
           "key": "user-agent",
           "value": "(?i).*(whatsapp|facebookexternalhit|twitterbot|telegrambot|slackbot|discordbot).*"
         }
       ],
       "destination": "/api/og?slug=:slug"
     }
     ```
2. **Generador Dinámico de HTML con Metaetiquetas OpenGraph (`api/og.js`):**
   * La función consulta en Supabase la marca por su `slug`.
   * Obtiene `name`, `description`, `logo_url` y `menu_banner_img`.
   * Genera dinámicamente un HTML ligero con:
     * `<meta property="og:title" content="Boku Bento | Menú Digital" />`
     * `<meta property="og:image" content="..." />`
     * `<meta property="og:description" content="..." />`
3. **Compatibilidad Estricta de WhatsApp para Imágenes:**
   * Asegurar que la imagen servida esté en formato **PNG o JPEG** (WhatsApp descarta SVGs y WebPs en sus previews) y que su tamaño sea inferior a 300 KB.

---

## Paso 9: Dinamización Inteligente de Sección "Must Try" y Destacados del Catálogo Vivo

### 9.1 Objetivo
Eliminar las fotos e ítems quemados de Unsplash ("Sunrise Bowl", "Green Salad") y los datos estáticos desactualizados en el inicio, haciendo que la sección "Must Try" muestre siempre productos vivos y fotos reales de la marca activa.

### 9.2 Archivos Involucrados
* `src/pages/LandingPage.jsx`
* `src/pages/AdminWebContent.jsx`
* `src/context/MenuDataContext.jsx`

### 9.3 Cambios Específicos
1. **Hidratación Reactiva por ID de Producto:**
   * En `LandingPage.jsx`, al procesar `homeSettings.featured_items`, buscar cada producto por su `product_id` en la lista viva de productos (`productsList`).
   * Tomar prioritariamente la imagen actual (`found.image_url`), el nombre actual y el precio actual de la base de datos, en vez de la captura congelada en `home_settings`.
2. **Fallback Inteligente de Marca (Cero Fotos de Unsplash):**
   * Si la marca no ha seleccionado platos específicos en "Must Try", el sistema autogenera los destacados usando:
     1. El plato del día activo de la marca (`is_daily_special`).
     2. Productos marcados con `is_upsell` o destacados.
     3. Los primeros 4 productos activos con foto de la primera categoría de la marca.
3. **Limpieza de UUIDs Quemados en el Plato del Día:**
   * En `MenuDataContext.jsx`, remover los IDs de prueba hardcodeados (`b0000b11...`) y utilizar una selección dinámica basada en el catálogo real de cada marca.

---

## 🚦 Matriz de Ejecución y Estado de Implementación

| Fase | Pasos Incluidos | Impacto Principal | Estado | Verificación |
|---|---|---|---|---|
| **Fase 1** | **Paso 1, Paso 2, Paso 3** | Operación KDS/BDS, despacho sin colisiones y UI de pedidos en tablet | ✅ **100% Completado** | Commit `82d4bd1` |
| **Fase 2** | **Paso 4, Paso 5** | Recetario con búsqueda/filtros, layout de estaciones 100% editable y lista de compras personalizada | ✅ **100% Completado** | Commit `52e5f50` |
| **Fase 3** | **Paso 6, Paso 7, Paso 8, Paso 9** | Horarios ordenados, cuentas bancarias/Bre-B en checkout, preview WhatsApp con Sharp PNG y Must-Try dinámico | ✅ **100% Completado** | Build Vite OK & Verificado |

---

*Plan Maestro completamente implementado y verificado en producción.*

