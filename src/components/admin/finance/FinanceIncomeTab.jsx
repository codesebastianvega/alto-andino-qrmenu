import React, { useMemo, useState } from 'react';
import { summarizeIncome } from '../../../utils/financeIncome';
import { resolveOrderItemName } from '../../../utils/formatters';

const money = value => `$${Number(value).toLocaleString('es-CO')}`;
export default function FinanceIncomeTab({ orders = [], periodLabel }) {
  const data = useMemo(() => summarizeIncome(orders), [orders]);
  const [search, setSearch] = useState('');
  const rows = data.rows.filter(o => `${o.id} ${o.customer_name || ''} ${(o.order_items || []).map(resolveOrderItemName).join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-5">
    <div><h2 className="text-xl font-black text-gray-900">Ingresos y ventas · {periodLabel}</h2>
      <p className="text-xs text-gray-500 mt-1">Pedidos creados en el período y sede seleccionados. Sin cancelados ni pruebas descartadas. El cobrado muestra lo recibido hasta ahora de estos pedidos, aunque se haya pagado después.</p></div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[["Total vendido", money(data.sold)], ["Cobrado de estos pedidos", money(data.collected)], ["Pendiente por cobrar", money(data.pending)], ["Pedidos / unidades", `${orders.length} / ${data.units}`]].map(([label, value]) => <div key={label} className="bg-white border border-gray-200 rounded-2xl p-4"><p className="text-xs text-gray-500">{label}</p><p className="text-xl font-black text-gray-900 mt-2">{value}</p></div>)}
    </div>
    <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <h3 className="font-bold p-5">Qué vendiste</h3>
      <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-gray-50 text-xs text-gray-500"><tr><th className="p-4">Producto</th><th className="p-4 text-right">Unidades</th><th className="p-4 text-right">Importe de productos</th></tr></thead>
      <tbody>{data.products.map(p => <tr key={p.key} className="border-t border-gray-100"><td className="p-4 font-semibold">{p.name}</td><td className="p-4 text-right">{p.quantity}</td><td className="p-4 text-right">{money(p.amount)}</td></tr>)}{!data.products.length && <tr><td colSpan={3} className="p-8 text-center text-gray-400">No hay productos vendidos en este período.</td></tr>}</tbody></table></div>
      <p className="p-4 text-xs text-gray-500 border-t">Productos: {money(data.itemTotal)} · Diferencia por servicio, domicilio, descuentos u otros ajustes: {money(data.adjustments)} · Total pedidos: {money(data.sold)}</p>
    </section>
    <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="p-5 flex flex-wrap gap-3 justify-between items-center"><h3 className="font-bold">Detalle de pedidos</h3><input aria-label="Buscar pedido, cliente o producto" placeholder="Buscar pedido, cliente o producto" value={search} onChange={e => setSearch(e.target.value)} className="border rounded-xl p-2 text-sm w-full sm:w-72" /></div>
      <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-gray-50 text-xs text-gray-500"><tr>{['Fecha / Pedido', 'Cliente y productos', 'Vendido', 'Cobrado', 'Pendiente'].map(h => <th key={h} className="p-4">{h}</th>)}</tr></thead><tbody>
        {rows.map(o => <tr key={o.id} className="border-t border-gray-100 align-top"><td className="p-4 whitespace-nowrap">{new Date(o.created_at).toLocaleString('es-CO')}<span className="block text-xs text-gray-400">#{o.id.slice(0, 4).toUpperCase()}</span></td><td className="p-4 min-w-56"><p className="font-bold">{o.customer_name || 'Cliente de mostrador'}</p>{(o.order_items || []).map(i => <p key={i.id} className="text-xs text-gray-500 mt-1">{i.quantity} × {resolveOrderItemName(i)}</p>)}</td><td className="p-4 whitespace-nowrap">{money(o.total)}</td><td className="p-4 whitespace-nowrap text-emerald-700">{money(o.paid)}</td><td className="p-4 whitespace-nowrap text-amber-700">{money(o.due)}</td></tr>)}
        {!rows.length && <tr><td colSpan={5} className="p-8 text-center text-gray-400">No hay pedidos para mostrar.</td></tr>}
      </tbody></table></div>
    </section>
  </div>;
}
