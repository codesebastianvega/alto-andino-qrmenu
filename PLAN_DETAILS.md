# Estructura Comercial - Aluna SaaS

## Planes de Suscripción

| Plan | Pedidos / Mes | Precio Mensual (COP) | Gestión de Mesas QR | Ideal para |
| :--- | :--- | :--- | :--- | :--- |
| **Emprendedor** | 60 | $49.900 | No | Negocios iniciando, pruebas. |
| **Esencial** | 250 | $99.900 | No | Takeout, WhatsApp y Domicilios. |
| **Profesional** | 800 | $149.900 | **Sí** | Restaurantes con salón, KDS y meseros. |
| **Premium** | 2.000 | $249.900 | **Sí** | Negocios de alto volumen. |
| **Enterprise** | Ilimitados | Custom | **Sí** | Franquicias y grandes cadenas. |

## Add-ons Disponibles

### Asistente IA (Conserje Gastronómico)
*   **Precio:** $49.900 COP / mes
*   **Límite:** 1.000 interacciones o créditos de IA al mes.
*   **Restricción:** Este límite es vital para mantener la rentabilidad del servicio.

## Reglas de Implementación Técnica
1.  **Seguridad (RPC):** El conteo de pedidos mensuales debe realizarse vía RPC (`get_monthly_order_count`) con `SECURITY DEFINER` para evitar problemas de RLS con usuarios anónimos.
2.  **Límites:** El hook `usePlan.js` debe centralizar la lógica de bloqueo de pedidos cuando se alcanza el límite mensual.
3.  **Interfaz:** Al alcanzar el límite, el botón de "Finalizar Pedido" debe deshabilitarse y mostrar un mensaje invitando al upgrade.
