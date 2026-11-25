# Préstamos recibidos y aportes

Disponible en Finanzas → Préstamos y aportes. COP, pesos enteros.

## Uso

1. Registrar persona o entidad, tipo (préstamo o aporte sin devolución), monto,
   sede opcional, fecha, motivo y enlace opcional al comprobante.
2. Elegir si entró a un bolsillo o si la persona pagó una compra directamente.
3. Para préstamos, ingresar intereses totales acordados (0 si no hay) y fecha
   prevista de devolución opcional. No se calculan tasas ni intereses automáticos.
4. Registrar cada devolución separando capital e intereses y el bolsillo de salida.

Los nombres ya guardados aparecen en el selector «Prestamista o aportante guardado».
Cada persona tiene una ficha con su saldo total y el botón «Nuevo préstamo de…».
Los nuevos desembolsos comparten esa ficha, pero conservan fechas, importes y abonos
separados. Los nombres se reutilizan desde los registros persistidos, incluso al
volver a abrir Finanzas. Mayúsculas y espacios adicionales no crean otra ficha.

La pestaña muestra toda la marca y todas las fechas, aunque el filtro de ventas
sea mensual. Incluye capital e intereses pendientes, vencimiento e historial de abonos.
Los aportes no generan deuda ni permiten devoluciones desde esta función.

## Tratamiento en Aluna

| Movimiento | Bolsillo | Deuda | Ventas | Gastos |
|---|---|---|---|---|
| Préstamo recibido en bolsillo | Aumenta | Aumenta capital | Sin cambio | Sin cambio |
| Aporte sin devolución en bolsillo | Aumenta | Sin cambio | Sin cambio | Sin cambio |
| Compra pagada directamente por prestamista | Sin cambio | Aumenta capital | Sin cambio | Registra compra |
| Compra pagada directamente como aporte | Sin cambio | Sin cambio | Sin cambio | Registra compra |
| Devolución de capital | Disminuye | Disminuye capital | Sin cambio | Sin cambio |
| Pago de intereses | Disminuye | Disminuye interés acordado | Sin cambio | Intereses separados |

Una compra directa no ingresa existencias al inventario. No debe registrarse otra
vez como gasto: el módulo ya la incluye. Cobrar fiados no cancela automáticamente
préstamos. Son movimientos independientes.

El saldo del préstamo se calcula con todos los abonos. El saldo del bolsillo
incluye entradas y devoluciones desde la fecha de apertura, para no sumar otra vez
financiación anterior ya incluida en un saldo inicial. Si se registran movimientos
con fecha del mismo día de apertura, se incluyen: el módulo usa fechas de calendario
en Colombia, sin horas para los desembolsos.

## Persistencia y permisos

- `finance_loans` y `finance_loan_payments` son registros separados del JSON de
  configuración financiera. No se sobrescriben al editar gastos o bolsillos.
- RLS: lectura para dueño de marca, owner/manager de la marca y superadmin.
  Visitantes, clientes y personal sin esos permisos no acceden a estos registros.
- Escrituras mediante RPC, con funciones privilegiadas en esquema privado y
  autorización de marca en servidor. No hay escritura directa desde el cliente.
- Los identificadores por operación y bloqueos transaccionales evitan duplicar un
  reintento y serializan abonos al mismo préstamo. El servidor rechaza montos
  fraccionarios, bolsillos inexistentes, fechas inválidas y sobrepagos.
- No se pueden editar ni eliminar los préstamos o abonos desde esta primera versión.
  Los movimientos derivados tampoco se editan como gastos independientes.
- El formulario comprueba saldo disponible del bolsillo antes de devolver dinero.
  Este control usa el saldo calculado por el módulo financiero existente; no es un
  bloqueo contable global frente a operaciones simultáneas de otros módulos.
- Los bolsillos vinculados a financiación no pueden eliminarse desde Finanzas.

## Verificación

- `node --test tests/financeLoans.test.mjs tests/financeIncome.test.mjs`.
- Compilación de aplicación completa.
- Pruebas transaccionales en servidor, con rollback: alta, reintentos, abonos,
  sobrepagos, aportes, compras directas, validación de bolsillo, importes y permisos.
- Prueba de interfaz con componente real y datos locales: alta, abono separado,
  compra directa, aporte y vista móvil. No se registraron préstamos reales.
