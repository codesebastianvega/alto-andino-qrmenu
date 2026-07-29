import { useMemo, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DEFAULT_HOURS = DAYS.map((_, day_of_week) => ({ day_of_week, open_time: '08:00', close_time: '22:00', is_closed: false }));
const EMPTY_OPTION = { name: '', price: '' };

const TITLES = {
  update_business_hours: 'Configurar horarios',
  create_payment_method: 'Crear método de pago',
  update_printing_settings: 'Configurar impresión',
  create_modifier_group: 'Crear grupo de modificadores',
};

export default function OperationsWorkflow({ action, brandName, locationName, isExecuting, onApprove, onCancel }) {
  const [reviewing, setReviewing] = useState(false);
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [payment, setPayment] = useState({ name: '', type: 'cash', is_active: true });
  const [printing, setPrinting] = useState({ kitchen_print_enabled: true, receipt_print_enabled: true, thermal_paper_width: '80' });
  const [modifier, setModifier] = useState({ name: '', description: '', is_required: false, min_select: 0, max_select: 1, options: [{ ...EMPTY_OPTION }] });

  const proposal = useMemo(() => {
    if (action === 'update_business_hours') return { hours };
    if (action === 'create_payment_method') return payment;
    if (action === 'update_printing_settings') return printing;
    return {
      name: modifier.name.trim(),
      description: modifier.description.trim(),
      is_required: modifier.is_required,
      min_select: Number(modifier.min_select),
      max_select: Number(modifier.max_select),
      is_submodifier: false,
      options: modifier.options.map((option, index) => ({ name: option.name.trim(), price: Number(option.price) || 0, sort_order: index })),
    };
  }, [action, hours, modifier, payment, printing]);

  const isValid = useMemo(() => {
    if (action === 'update_business_hours') return hours.every((day) => day.is_closed || (day.open_time && day.close_time && day.open_time < day.close_time));
    if (action === 'create_payment_method') return payment.name.trim().length > 1;
    if (action === 'update_printing_settings') return ['50', '80'].includes(printing.thermal_paper_width);
    return modifier.name.trim().length > 1
      && modifier.options.length > 0
      && modifier.options.every((option) => option.name.trim())
      && Number(modifier.min_select) >= 0
      && Number(modifier.max_select) >= 1
      && Number(modifier.min_select) <= Number(modifier.max_select);
  }, [action, hours, modifier, payment, printing]);

  const summary = action === 'update_business_hours'
    ? `${hours.filter((day) => !day.is_closed).length} día(s) abiertos en ${locationName}`
    : action === 'create_payment_method'
      ? `${payment.name} · ${payment.type}`
      : action === 'update_printing_settings'
        ? `Comandas ${printing.kitchen_print_enabled ? 'activas' : 'inactivas'}, recibos ${printing.receipt_print_enabled ? 'activos' : 'inactivos'}, papel ${printing.thermal_paper_width} mm`
        : `${modifier.name} · ${modifier.options.length} opción(es) · selección ${modifier.min_select}-${modifier.max_select}`;

  if (reviewing) return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Cambio operativo pendiente</p>
        <p className="mt-2 text-sm leading-relaxed text-amber-900">Aluna aplicará este cambio únicamente en {brandName}, con alcance {locationName}. Quedará registrado en el historial.</p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <p className="text-xs text-gray-500">{TITLES[action]}</p>
        <p className="mt-1 text-sm font-bold text-gray-950">{summary}</p>
      </div>
      <button type="button" disabled={isExecuting} onClick={() => onApprove(action, proposal)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white disabled:opacity-60">
        {isExecuting ? <><Loader2 size={17} className="animate-spin" /> Aplicando…</> : 'Aprobar y aplicar cambio'}
      </button>
      <button type="button" disabled={isExecuting} onClick={() => setReviewing(false)} className="w-full py-2 text-xs font-semibold text-gray-500">Corregir propuesta</button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div><h3 className="text-lg font-bold text-gray-950">{TITLES[action]}</h3><p className="mt-1 text-sm text-gray-600">Aluna preparará el cambio y no lo guardará hasta que revises y apruebes.</p></div>

      {action === 'update_business_hours' ? (
        <div className="space-y-2">{hours.map((day, index) => (
          <div key={day.day_of_week} className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="flex items-center justify-between"><span className="text-xs font-bold text-gray-700">{DAYS[day.day_of_week]}</span><label className="flex items-center gap-2 text-[11px] text-gray-500"><input type="checkbox" checked={day.is_closed} onChange={(event) => setHours((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, is_closed: event.target.checked } : item))} /> Cerrado</label></div>
            <div className="mt-2 grid grid-cols-2 gap-2"><input type="time" disabled={day.is_closed} value={day.open_time} onChange={(event) => setHours((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, open_time: event.target.value } : item))} className="rounded-lg border border-gray-200 px-2 py-2 text-xs disabled:opacity-40" /><input type="time" disabled={day.is_closed} value={day.close_time} onChange={(event) => setHours((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, close_time: event.target.value } : item))} className="rounded-lg border border-gray-200 px-2 py-2 text-xs disabled:opacity-40" /></div>
          </div>
        ))}</div>
      ) : null}

      {action === 'create_payment_method' ? (
        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4"><input value={payment.name} onChange={(event) => setPayment((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre visible *" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" /><select value={payment.type} onChange={(event) => setPayment((current) => ({ ...current, type: event.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"><option value="cash">Efectivo</option><option value="transfer">Transferencia</option><option value="card">Tarjeta</option><option value="digital_wallet">Billetera digital</option><option value="other">Otro</option></select></div>
      ) : null}

      {action === 'update_printing_settings' ? (
        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4"><label className="flex items-center justify-between text-sm font-semibold text-gray-700">Imprimir comandas<input type="checkbox" checked={printing.kitchen_print_enabled} onChange={(event) => setPrinting((current) => ({ ...current, kitchen_print_enabled: event.target.checked }))} /></label><label className="flex items-center justify-between text-sm font-semibold text-gray-700">Imprimir recibos<input type="checkbox" checked={printing.receipt_print_enabled} onChange={(event) => setPrinting((current) => ({ ...current, receipt_print_enabled: event.target.checked }))} /></label><label className="block text-xs font-bold text-gray-700">Ancho térmico<select value={printing.thermal_paper_width} onChange={(event) => setPrinting((current) => ({ ...current, thermal_paper_width: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal"><option value="80">80 mm</option><option value="50">50 mm</option></select></label></div>
      ) : null}

      {action === 'create_modifier_group' ? (
        <div className="space-y-3"><div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4"><input value={modifier.name} onChange={(event) => setModifier((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre del grupo *" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" /><textarea value={modifier.description} onChange={(event) => setModifier((current) => ({ ...current, description: event.target.value }))} placeholder="Descripción opcional" rows={2} className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm" /><label className="flex items-center gap-2 text-xs font-semibold text-gray-600"><input type="checkbox" checked={modifier.is_required} onChange={(event) => setModifier((current) => ({ ...current, is_required: event.target.checked, min_select: event.target.checked ? Math.max(1, Number(current.min_select)) : 0 }))} /> Selección obligatoria</label><div className="grid grid-cols-2 gap-2"><input type="number" min="0" value={modifier.min_select} onChange={(event) => setModifier((current) => ({ ...current, min_select: Number(event.target.value) }))} placeholder="Mínimo" className="rounded-xl border border-gray-200 px-3 py-2 text-sm" /><input type="number" min="1" value={modifier.max_select} onChange={(event) => setModifier((current) => ({ ...current, max_select: Number(event.target.value) }))} placeholder="Máximo" className="rounded-xl border border-gray-200 px-3 py-2 text-sm" /></div></div>
          {modifier.options.map((option, index) => <div key={index} className="flex gap-2 rounded-xl border border-gray-200 bg-white p-3"><input value={option.name} onChange={(event) => setModifier((current) => ({ ...current, options: current.options.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) }))} placeholder={`Opción ${index + 1} *`} className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-2 text-xs" /><input type="number" min="0" value={option.price} onChange={(event) => setModifier((current) => ({ ...current, options: current.options.map((item, itemIndex) => itemIndex === index ? { ...item, price: event.target.value } : item) }))} placeholder="Precio extra" className="w-24 rounded-lg border border-gray-200 px-2 py-2 text-xs" />{modifier.options.length > 1 ? <button type="button" onClick={() => setModifier((current) => ({ ...current, options: current.options.filter((_, itemIndex) => itemIndex !== index) }))} aria-label="Quitar opción"><Trash2 size={15} className="text-red-500" /></button> : null}</div>)}
          <button type="button" onClick={() => setModifier((current) => ({ ...current, options: [...current.options, { ...EMPTY_OPTION }] }))} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300 py-3 text-xs font-bold text-emerald-700"><Plus size={15} /> Añadir opción</button>
        </div>
      ) : null}

      <button type="button" disabled={!isValid} onClick={() => setReviewing(true)} className="w-full rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white disabled:opacity-40">Revisar propuesta</button>
      <button type="button" onClick={onCancel} className="w-full py-2 text-xs font-semibold text-gray-500">Cancelar</button>
    </div>
  );
}
