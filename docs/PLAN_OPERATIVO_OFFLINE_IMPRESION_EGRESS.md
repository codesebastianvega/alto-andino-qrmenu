# Plan operativo: offline, impresion y egress

## Objetivo de esta fase

Convertir el MVP actual en una base operativa tolerante a fallas para un primer local, sin presentar como terminadas la facturacion electronica DIAN ni la operacion multi-dispositivo sin internet.

## Alcance

- PWA instalable y cache del shell de la aplicacion.
- Indicador global de conexion y pedidos pendientes.
- Cache local del catalogo para consulta sin internet.
- Cola local de pedidos en IndexedDB.
- Identificador idempotente `client_order_id` para evitar duplicados al reintentar.
- Sincronizacion automatica cuando regresa la conexion.
- Plantillas termicas para comanda y recibo en 80 mm y 50 mm.
- Impresion de comanda opcional: el KDS sigue siendo el flujo principal.
- Estado de facturacion electronica visible como `proximamente`.
- Compresion, cache y carga diferida de imagenes como primera defensa de egress.

## Limites conocidos

1. Durante una caida total de internet, dos dispositivos diferentes no se comunican entre si. El POS conserva la orden, pero cocina no la vera hasta recuperar internet.
2. La operacion local entre caja, meseros y cocina requiere una fase posterior con un gateway en la red local.
3. La impresion silenciosa automatica necesita un puente local ESC/POS.
4. Factura electronica no es un recibo. La integracion DIAN debe realizarse con un proveedor tecnologico o software propio habilitado.

## Proxima fase

- Ejecutar la migracion y probar idempotencia contra Supabase.
- Probar impresoras fisicas de 80 mm y 50 mm.
- Elegir puente de impresion local.
- Medir egress por servicio durante siete dias.
- Migrar imagenes a Cloudflare R2 solo si Storage es el principal origen.
- Elegir proveedor DIAN y definir CUFE, XML/PDF, notas credito y contingencia.
