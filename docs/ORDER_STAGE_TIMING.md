# Tiempos operativos de pedidos

El servidor registra cada transición de estado en `orders.status_history` y la
entrada al estado actual en `status_started_at`. Esto cubre Pedidos, Cocina,
Barra, Repartidores y clientes anteriores, sin depender del reloj del navegador.
Cambiar pagos, notas o repetir el mismo estado no reinicia los relojes.

Las cuatro fases se muestran en tarjetas, detalle e historial:

- Espera inicial: recibido hasta empezar preparación, incluido esperar pago.
- Preparación: entrada a preparación hasta listo.
- Listo sin salir: listo hasta salida, servicio en mesa o retiro.
- Entrega / En mesa / Retiro: desde salida o servicio hasta finalizar el pedido.

«Recibido hasta listo» incluye espera inicial y preparación. «Tiempo total»
incluye todas las fases. Ninguno se etiqueta como tiempo de cocina. En mesa
mide hasta cerrar el pedido, no hasta el primer bocado. Las fases repetidas por
adiciones o retorno a cocina se suman por separado sin contar el despacho como
cocción. El indicador superior mide la fase actual, no todo el pedido.

Ejemplo: 3 minutos de espera + 15 de preparación = 18 hasta listo. Con 2 listo
y 8 de entrega, el total es 28 minutos. Sin hora de inicio de preparación, los
18 no se pueden atribuir íntegramente a cocina.

Se conservan las primeras marcas `preparing_at`, `ready_at`, `on_table_at` y
`on_the_way_at`. El historial conserva las vueltas posteriores a cada fase.
Los relojes de estaciones usan `kitchen_started_at` / `bar_started_at` y su
respectiva hora de listo para medir el último ciclo de cada estación.

La migración no reconstruye tiempos antiguos usando `updated_at`, que también
cambia por pagos y edición. Sin una marca verificable, se muestra «Sin registro».
El pedido histórico 5FF1 no tenía hora de listo, cocina o salida al investigar
el problema; no se modificaron sus tiempos a partir de estimaciones.

La migración incluye una prueba del trigger sobre filas temporales aisladas;
no crea pedidos de prueba en el tablero de producción. Las pruebas de JavaScript
se ejecutan con `node --test tests/orderTiming.test.mjs`.
