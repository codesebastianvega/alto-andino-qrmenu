import React, { useState } from 'react';
import { calculateDeliveryTariff, getDeliveryRules, validateDeliveryRules } from '../../../utils/deliveryPricing';
import { formatCOP } from '../../../utils/money';
const inputClass = 'w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900';
export default function DeliveryPricingRules({ form, setForm }) {
  const rules = getDeliveryRules(form);
  const [distanceM, setDistanceM] = useState(3600);
  const update = (key, value) => setForm(prev => ({ ...prev, delivery_pricing_rules: { ...getDeliveryRules(prev), [key]: value } }));
  const errors = validateDeliveryRules(rules);
  const result = calculateDeliveryTariff(rules, distanceM);
  const field = (label, key) => <label key={key} className="block space-y-1 text-xs font-semibold text-gray-700">{label}<input className={inputClass} type="number" min="0" step="1" value={rules[key] ?? ''} onChange={e => update(key, e.target.value === '' ? null : Number(e.target.value))} /></label>;
  return <section className="rounded-2xl border border-sky-200 bg-sky-50/40 p-4 sm:p-5 space-y-4">
    <h4 className="text-sm font-bold text-gray-900">Domicilio dinámico según el pin</h4>
    <p className="text-xs text-gray-600">Usa la distancia entre la sede y el pin multiplicada por 1,25 para aproximar el recorrido. No consulta rutas por calles ni cobra por subidas. No requiere Google Cloud.</p>
    <label className="flex gap-2 items-center text-sm font-semibold"><input type="checkbox" checked={rules.enabled} onChange={e => update('enabled', e.target.checked)} />Activar este cálculo en el carrito y el pedido manual</label>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {field('Distancia gratis hasta (metros estimados)', 'freeDistanceM')}
      {field('Distancia incluida en la base (metros estimados)', 'baseDistanceM')}
      {field('Tarifa base (COP)', 'baseFee')}
      {field('Valor por km adicional (COP)', 'extraKmFee')}
      {field('Tope adicional (metros; 0 = usar radio de la sede)', 'maxDistanceM')}
      <label className="block space-y-1 text-xs font-semibold text-gray-700">Kilómetro adicional<select className={inputClass} value={rules.extraKmMode} onChange={e => update('extraKmMode', e.target.value)}><option value="started">Cada kilómetro iniciado</option><option value="proportional">Proporcional a la distancia</option></select></label>
    </div>
    <p className="text-xs text-gray-600">La cobertura usa el menor límite positivo entre el radio de la sede y este tope. El cliente debe confirmar el pin para continuar.</p>
    {errors.length > 0 && <ul role="alert" className="list-disc pl-5 text-xs text-red-700">{errors.map(error => <li key={error}>{error}</li>)}</ul>}
    <div className="border-t border-sky-200 pt-4 space-y-3">
      <h5 className="text-sm font-bold">Probar la tarifa</h5>
      <label className="block space-y-1 text-xs font-semibold text-gray-700">Distancia estimada de prueba (metros)<input type="number" min="0" step="0.1" className={inputClass} value={distanceM ?? ''} onChange={e => setDistanceM(e.target.value === '' ? null : Number(e.target.value))} /></label>
      <div className="flex flex-wrap gap-2">{[500, 501, 3000, 3001, 4001].map(value => <button key={value} type="button" className="rounded-lg border bg-white px-3 py-2 text-xs font-semibold" onClick={() => setDistanceM(value)}>{value} m</button>)}</div>
      <div aria-live="polite" className="rounded-xl border border-sky-200 bg-white p-3 text-sm">
        {result.ready ? <><p className="font-bold">Simulación: {formatCOP(result.fee)}</p><p className="mt-1 text-xs text-gray-700">Base {formatCOP(result.breakdown.baseFee)} + adicionales {formatCOP(result.breakdown.extraFee)}</p></> : <p>{result.message}</p>}
      </div>
      <p className="text-xs text-gray-600">Guarda la sede para aplicar los cambios. Probar una distancia no guarda la configuración.</p>
    </div>
  </section>;
}
