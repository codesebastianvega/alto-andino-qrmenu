# Estrategia de Notificaciones: Telegram (Cocina/Staff) & WhatsApp (Clientes/CRM)

**Plataforma:** Aluna SaaS / Alto Andino QR Menu  
**Fecha de Creación:** Septiembre 2026  
**Estado:** Telegram Operativo (V1) | WhatsApp Click-to-Chat Operativo | WhatsApp Cloud API en Roadmap  

---

## 1. Visión y Arquitectura General

En los restaurantes y dark kitchens, existen dos públicos completamente distintos con necesidades de comunicación opuestas:

1. **Equipo Interno (Cocina, Repartidores, Administrador):**
   - Requiere inmediatez, alta confiabilidad, bajo costo operativo, cero spam y una bitácora centralizada donde el equipo pueda coordinarse.
   - **Solución implementada:** **Telegram Bots & Supergrupos** (Add-on independiente por marca).

2. **Cliente Final (Comensal / Consumidor):**
   - Requiere familiaridad máxima, confianza y un canal directo de soporte y seguimiento.
   - **Solución actual:** **WhatsApp Click-to-Chat (`wa.me`)** sin costo.
   - **Solución futura:** **WhatsApp Business Cloud API** como módulo premium automatizado.

```
                  ┌───────────────────────────────┐
                  │       PEDIDO CONFIRMADO       │
                  │     (Menú Digital Aluna)      │
                  └───────────────┬───────────────┘
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
┌──────────────────────────────┐          ┌──────────────────────────────┐
│  INTERNO: COCINA & STAFF     │          │   EXTERNO: CLIENTE FINAL     │
│  Canal: Telegram Bot API     │          │   Canal: WhatsApp                │
├──────────────────────────────┤          ├──────────────────────────────┤
│ • $0 COP / Costo Cero        │          │ • Fase 1: Click-to-Chat      │
│ • Ilimitado y oficial        │          │   ($0 COP / Sin costo)       │
│ • Tickets HTML estructurados │          │ • Fase 2: Cloud API (Meta)   │
│ • Botones: WA, Call, Maps    │          │   (Notif. Estado & CRM)      │
│ • Independiente por marca    │          │ • Automatizado / Premium     │
└──────────────────────────────┘          └──────────────────────────────┘
```

---

## 2. Canal Interno: Telegram (Add-on Cocina y Bitácora)

### 2.1. ¿Por qué Telegram para Cocina?
- **Costo Operativo $0 COP:** La API de Bots de Telegram es 100% gratuita y sin límites de mensajes por día.
- **Cero Riesgo de Baneo:** A diferencia de números de WhatsApp automatizados no oficiales, Telegram promueve activamente el uso de bots oficiales.
- **Independencia por Marca:** Cada marca en Aluna (ej: *Boku Bento*, *Alto Andino*) configura su propio bot con su nombre y logo desde `@BotFather` y su propio grupo de despacho privado (`-100...`).
- **Comandas Enriquecidas:** Las comandas llegan formateadas en HTML con emojis, número de comanda (`#B1A2`), mesa destacada (`🪑 MESA 3`), desglose de platos, notas de cocina, dirección y botones interactivos para llamar, chatear o abrir Google Maps con 1 clic.
- **Bitácora Inmutable:** Funciona como un registro histórico searchable de todos los pedidos ingresados al sistema.

### 2.2. Resiliencia Técnica
- **Parse Mode HTML + Escape de Entidades:** Previene fallos por caracteres especiales en notas de clientes (`_`, `*`, `[ ]`).
- **Fallback en Texto Plano:** Si Telegram rechaza el formato, el sistema reintenta automáticamente enviando el contenido en texto plano. La cocina nunca pierde un pedido.
- **Fallback a Base de Datos:** Si un cliente anónimo ingresa por QR sin credenciales de sesión administrativa, el despachador consulta la configuración directamente en `restaurant_settings.brand_concepts`.

### 2.3. Guía Paso a Paso de Conexión (Onboarding para Cada Marca)

1. **Crear el Bot en Telegram con `@BotFather`:**
   - Enviar `/newbot`.
   - Elegir el **Nombre público** (Ej: `Cocina Boku Bento`).
   - Elegir el **Username único** (⚠️ **Regla estricta de Telegram:** debe terminar en `bot` o `_bot`, ej: `BokuBentobot` o `boku_cocina_bot`).
   - Copiar el **HTTP API Token** entregado (ej: `8693571421:AAGfuIeT-U78TBdup3hxyngmcUjCAWCIpnk`).
2. **Crear el Grupo de Telegram:**
   - Crear un grupo nuevo (ej: *"Comandas - Boku Bento"*).
   - Añadir a los cocineros y al bot recién creado (`@BokuBentobot`).
   - *(Recomendado)* Asignar permisos de administrador al bot.
3. **Obtener el ID del Grupo (`-100...`) en 1 Clic:**
   - En el grupo de Telegram, enviar cualquier mensaje (ej: `hola` o `/start`).
   - En Aluna Admin, pulsar el botón **"🔍 Detectar ID Automáticamente"**.
   - El sistema detecta el grupo y rellena el ID solo.
4. **Probar y Activar:**
   - Presionar **🧪 Probar Comanda** en Aluna Admin para recibir el ticket de prueba en tiempo real en Telegram.
   - Guardar la configuración.

---

## 3. Canal Externo: WhatsApp (Atención al Cliente y Marketing)

### 3.1. Estado Actual: WhatsApp "Click-to-Chat" (`wa.me`)
- **Costo:** **$0 COP (Completamente Gratis)**.
- **Mecanismo:** El menú genera URLs universales con texto pre-cargado (`https://wa.me/57300...?text=...`).
- **Ventajas:**
  - Inmediato de implementar.
  - Cero requisitos de verificación comercial con Meta.
  - El cliente se comunica con el número oficial del restaurante.
- **Limitaciones:**
  - Requiere acción humana (hacer clic en enviar).
  - No dispara notificaciones en segundo plano cuando cambia el estado del pedido en cocina.

---

### 3.2. Estado Futuro: WhatsApp Business Cloud API (Meta)

Para automatizar la comunicación hacia el cliente final sin intervención humana, Meta ofrece su API Oficial en la nube.

#### A. Estructura de Costos de Meta (Colombia / Latinoamérica)
Meta no cobra suscripción fija mensual, sino **tarifas por ventana de conversación de 24 horas**:

| Categoría de Mensaje | Ejemplo en Aluna | Costo Estimado (Meta Latam) |
| :--- | :--- | :--- |
| **Utilidad (Utility)** | "Tu pedido #B1A2 fue confirmado y está en preparación 🍳" | ~$0.015 - $0.035 USD (~$60 - $140 COP) |
| **Servicio (Customer Care)** | Cliente escribe preguntando una duda y el bot/staff responde | **Primeras 1.000 conversaciones/mes son GRATIS** por cuenta Meta Business |
| **Marketing** | "Hace 15 días no pides en Boku Bento. ¡Hoy tienes 15% de descuento!" | ~$0.045 - $0.070 USD (~$180 - $280 COP) |

#### B. Requisitos para la API Oficial de Meta
1. Cuenta de **Meta Business Manager** verificada (RUT, Cámara de Comercio o recibo público a nombre del negocio).
2. Número de teléfono limpio que no esté registrado en una app normal de WhatsApp.
3. Plantillas de mensajes pre-aprobadas por Meta.

---

## 4. Estrategia de Negocio y Monetización para Aluna

La combinación de **Telegram (Gratis/Eficiente)** + **WhatsApp (Alto Valor/Conversión)** crea una propuesta comercial muy atractiva:

### 4.1. Empaquetamiento en Planes Aluna

| Nivel de Servicio | Características Incluidas | Costo para el Restaurante |
| :--- | :--- | :--- |
| **Plan Básico / Free** | Menú QR + Enlace manual a WhatsApp (`wa.me`) | Incluido en el plan base |
| **Plan Add-on Cocina** | Despacho automático ilimitado a grupo de Telegram | Incluido / Add-on económico ($15.000 COP/mes) |
| **Plan Pro / WhatsApp Automático** | Notificaciones automáticas de estados de pedido por WhatsApp al cliente + Recordatorios | Tarifa mensual ($45.000 - $60.000 COP/mes) o bolsa de créditos de mensajes |

---

### 4.2. Casos de Uso de Alto Impacto para WhatsApp a Futuro

1. **Notificación Automática de Estados:**
   - Cocina presiona *"Listo"* o *"En Camino"* en Aluna -> El cliente recibe un WhatsApp automático:
     > *"¡Hola Mariana! 🛵 Tu pedido #B1A2 ya salió en camino con nuestro repartidor. Síguelo aquí: [enlace]"*

2. **Recuperación de Carritos Abandonados:**
   - Comensales que armaron su pedido pero no enviaron el checkout: enviar un mensaje suave a los 25 minutos con su carrito guardado.

3. **Recompra Automatizada (CRM Gastronómico):**
   - Segmentación automática:
     - Clientes recurrentes: mensajes de fidelidad con puntos o cortesías.
     - Clientes inactivos (+21 días sin pedir): cupón de reactivación.

4. **Bot Tomador de Pedidos Asistido por IA (Aluna Copilot):**
   - El cliente escribe *"Quiero 2 bentos de salmón y una gaseosa"* por WhatsApp -> Una IA consulta el menú de Supabase, crea el pedido en borrador y le envía el link de pago o confirmación directa.

---

## 5. Tabla Comparativa Resumen

| Criterio | Telegram (Staff/Cocina) | WhatsApp Click-to-Chat | WhatsApp Cloud API |
| :--- | :--- | :--- | :--- |
| **Destinatario** | Cocineros / Domiciliarios | Restaurante / Cliente | Cliente Final |
| **Costo por comanda** | **$0 COP** | **$0 COP** | ~$80 - $140 COP |
| **Automatización** | 100% Automático | Manual (1 clic) | 100% Automático |
| **Riesgo de Bloqueo** | Ninguno (Bots oficiales) | Ninguno | Muy bajo si cumple políticas |
| **Complejidad de Setup** | Baja (1 minuto con @BotFather) | Inmediata (Solo teléfono) | Media (Verificación Meta) |
| **Tasa de Apertura** | Alta (Notificaciones push) | N/A | Muy alta (>95%) |
| **Rol en Aluna** | **Motor de Cocina** | **Soporte Básico** | **Add-on Premium / CRM** |

---

## 6. Próximos Pasos Recomendados (Roadmap)

- [x] **Fase 1 (Completada):** Despacho robusto de comandas en vivo a Telegram por marca con soporte HTML y recuperación ante fallos.
- [x] **Fase 1 (Completada):** Botón directo de WhatsApp Click-to-Chat para comensales y botón de contacto en la comanda de Telegram.
- [ ] **Fase 2:** Disparador de eventos en cocina (Webhooks de cambio de estado en `orders` para preparar integraciones salientes).
- [ ] **Fase 3:** Integración opcional de WhatsApp Cloud API mediante Meta Webhooks o proveedor de pasarela (como Evolution API o WABA directa) para marcas que adquieran el módulo Pro.
