# Estrategia de Planes Aluna 🚀

Aluna se posiciona como una plataforma premium de gestión para restaurantes, donde la escalabilidad está ligada al volumen de operación (pedidos) y al acceso a herramientas avanzadas de IA y rentabilidad.

## 1. La Escalera de Suscripción (Core)

El límite de pedidos mensuales es el motor principal para el upgrade de planes.

| Plan | Precio (COP/mes) | Pedidos al Mes | Beneficios Clave |
| :--- | :--- | :--- | :--- |
| **Emprendedor** | $49.900 | 60 | Subdominio propio, QR Menu, Soporte Base. |
| **Esencial** | $99.900 | 250 | Todo lo anterior + Multi-sedes (hasta 2). **Exclusivo Takeout/Delivery**. |
| **Profesional** | $149.900 | 800 | Todo lo anterior + Gestión de Mesas QR, KDS y Meseros. |
| **Premium** | $249.900 | 2.000 | Todo lo anterior + Negocios de alto volumen. |
| **Enterprise** | Custom | Ilimitados | Todo lo anterior + API Access, Soporte VIP. |

---

## 2. Módulos Add-on (Ingresos Extra)

Para mantener la rentabilidad y ofrecer tecnología de punta sin disparar los costos base:

### 🧠 Aluna Brain (Ecosistema IA)
**Costo Sugerido:** +$49.900 / mes (o incluido en Élite/Enterprise)

1. **Mesero IA:** Chatbot de WhatsApp que toma pedidos y resuelve dudas de la carta automáticamente.
2. **Analista de Datos IA:** Un "Gerente Virtual" que analiza las ventas y sugiere cambios de precios o promociones.
3. **Asistente de Compras IA:** Predice cuándo se acabarán los insumos y genera la lista de compras para proveedores.

### 💳 Pasarela de Pagos Directa
*   Integración con redes de pago locales (Nequi, Daviplata, PSE) con comisión reducida.

---

## 3. Comparativa de Mercado (Diferenciadores)

| Característica | Aluna | Competencia Típica |
| :--- | :--- | :--- |
| **Diseño UI/UX** | Premium, Minimalista, Inspirado en Apple/Notion. | Genérico, saturado de botones, anticuado. |
| **Onboarding** | Guiado por IA, configuración en < 5 min. | Manual, requiere capacitación o llamadas. |
| **Modelo de Cobro** | Por volumen de pedidos (transparente). | Por "usuarios" o "terminales" (complejo). |
| **IA Nativa** | Integrada en la operación real. | Solo como "juguete" o ausente. |

---

## 4. Lógica de Control de Límites

*   **Notificación de Umbral:** El sistema enviará una alerta automática (WhatsApp/Dashboard) cuando el restaurante alcance el **80%** de su límite mensual.
*   **Bloqueo Preventivo:** Al llegar al 100%, los nuevos pedidos vía QR quedarán pausados con un mensaje: *"Estamos procesando muchos pedidos, por favor contacta al mesero"*, incentivando al dueño a subir de plan.
*   **Reseteo Mensual:** Los contadores se reinician el día 1 de cada mes calendario.

---

## 5. Próximos Pasos Técnicos

1.  Añadir columna `max_orders_per_month` a la tabla `public.plans`.
2.  Implementar contador de pedidos mensuales en la tabla `public.brands` o mediante una vista agregada.
3.  Actualizar el panel de `SuperAdmin` para gestionar estos límites.
4.  Crear el middleware de validación de pedidos.
