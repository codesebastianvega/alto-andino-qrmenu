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
        <div className="space-y-2">
          <p className="text-xs text-gray-500 px-1">Define los días de apertura y el horario continuo de atención al público.</p>
          {hours.map((day, index) => (
            <div key={day.day_of_week} className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">{DAYS[day.day_of_week]}</span>
                <label className="flex items-center gap-2 text-[11px] text-gray-500 cursor-pointer">
                  <input type="checkbox" checked={day.is_closed} onChange={(event) => setHours((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, is_closed: event.target.checked } : item))} className="rounded border-gray-300 text-emerald-700" />
                  <span>Cerrado todo el día</span>
                </label>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block mb-0.5">Hora apertura</span>
                  <input type="time" disabled={day.is_closed} value={day.open_time} onChange={(event) => setHours((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, open_time: event.target.value } : item))} className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs disabled:opacity-40" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block mb-0.5">Hora cierre</span>
                  <input type="time" disabled={day.is_closed} value={day.close_time} onChange={(event) => setHours((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, close_time: event.target.value } : item))} className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs disabled:opacity-40" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {action === 'create_payment_method' ? (
        <div className="space-y-3.5 rounded-2xl border border-gray-200 bg-white p-4">
          <div>
            <label className="block text-xs font-bold text-gray-700">Nombre visible del método de pago *</label>
            <input 
              value={payment.name} 
              onChange={(event) => setPayment((current) => ({ ...current, name: event.target.value }))} 
              placeholder="Ej: Transferencia Bancolombia / Nequi" 
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
            />
            <p className="mt-1 text-[11px] text-gray-400">Cómo verá el cliente esta opción en el checkout al pagar su pedido.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700">Tipo de método de pago *</label>
            <select 
              value={payment.type} 
              onChange={(event) => setPayment((current) => ({ ...current, type: event.target.value }))} 
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="cash">Efectivo contra entrega</option>
              <option value="transfer">Transferencia bancaria (Bancolombia, Nequi, Daviplata)</option>
              <option value="card">Tarjeta de débito / crédito (Datáfono)</option>
              <option value="digital_wallet">Billetera digital</option>
              <option value="other">Otro medio</option>
            </select>
            <p className="mt-1 text-[11px] text-gray-400">Clasificación para el arqueo y cuadre de caja diario.</p>
          </div>
        </div>
      ) : null}

      {action === 'update_printing_settings' ? (
        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
          <label className="flex items-center justify-between text-sm font-semibold text-gray-700 cursor-pointer">
            <div>
              <span>Imprimir comandas de cocina</span>
              <p className="text-[11px] font-normal text-gray-400">Envía ticket a cocina automáticamente al recibir una orden.</p>
            </div>
            <input type="checkbox" checked={printing.kitchen_print_enabled} onChange={(event) => setPrinting((current) => ({ ...current, kitchen_print_enabled: event.target.checked }))} className="rounded border-gray-300 text-emerald-700" />
          </label>
          <div className="border-t border-gray-100 pt-2">
            <label className="flex items-center justify-between text-sm font-semibold text-gray-700 cursor-pointer">
              <div>
                <span>Imprimir recibos de cuenta</span>
                <p className="text-[11px] font-normal text-gray-400">Imprime el recibo o ticket para el comensal en caja.</p>
              </div>
              <input type="checkbox" checked={printing.receipt_print_enabled} onChange={(event) => setPrinting((current) => ({ ...current, receipt_print_enabled: event.target.checked }))} className="rounded border-gray-300 text-emerald-700" />
            </label>
          </div>
          <div className="border-t border-gray-100 pt-2">
            <label className="block text-xs font-bold text-gray-700">Ancho del papel térmico</label>
            <select value={printing.thermal_paper_width} onChange={(event) => setPrinting((current) => ({ ...current, thermal_paper_width: event.target.value }))} className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-emerald-500">
              <option value="80">80 mm (Estándar para comanderas Epson, Bixolon, Star)</option>
              <option value="50">50 mm / 58 mm (Mini-impresoras portátiles o datáfonos)</option>
            </select>
            <p className="mt-1 text-[11px] text-gray-400">Formato del rollo de papel instalado en tu impresora térmica.</p>
          </div>
        </div>
      ) : null}

      {action === 'create_modifier_group' ? (
        <div className="space-y-3.5">
          <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
            <div>
              <label className="block text-xs font-bold text-gray-700">Nombre del grupo de extras u opciones *</label>
              <input 
                value={modifier.name} 
                onChange={(event) => setModifier((current) => ({ ...current, name: event.target.value }))} 
                placeholder="Ej: Nivel de Azúcar, Tipo de Término, Acompañamiento" 
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
              />
              <p className="mt-1 text-[11px] text-gray-400">Título que aparecerá en el modal de personalización del plato.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700">Instrucción para el comensal (opcional)</label>
              <textarea 
                value={modifier.description} 
                onChange={(event) => setModifier((current) => ({ ...current, description: event.target.value }))} 
                placeholder="Ej: Elige 1 término para tu corte de carne" 
                rows={2} 
                className="mt-1 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
              />
              <p className="mt-1 text-[11px] text-gray-400">Aclaración o regla rápida para guiar al cliente.</p>
            </div>

            <div className="pt-1 border-t border-gray-100">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={modifier.is_required} 
                  onChange={(event) => setModifier((current) => ({ ...current, is_required: event.target.checked, min_select: event.target.checked ? Math.max(1, Number(current.min_select)) : 0 }))} 
                  className="rounded border-gray-300 text-emerald-700 focus:ring-emerald-500"
                /> 
                <span>Selección obligatoria</span>
              </label>
              <p className="ml-5 mt-0.5 text-[11px] text-gray-400">Si está marcado, el comensal no podrá agregar el plato sin elegir al menos una opción.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-gray-700">Mínimo de opciones *</label>
                <input 
                  type="number" 
                  min="0" 
                  value={modifier.min_select} 
                  onChange={(event) => setModifier((current) => ({ ...current, min_select: Number(event.target.value) }))} 
                  placeholder="0" 
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                />
                <p className="mt-0.5 text-[10px] text-gray-400">0 si es opcional, 1+ si es requerido.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700">Máximo de opciones *</label>
                <input 
                  type="number" 
                  min="1" 
                  value={modifier.max_select} 
                  onChange={(event) => setModifier((current) => ({ ...current, max_select: Number(event.target.value) }))} 
                  placeholder="1" 
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                />
                <p className="mt-0.5 text-[10px] text-gray-400">Límite de opciones que puede marcar.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Opciones del Grupo</span>
              <span className="text-[11px] text-gray-400">Deja $0 si está incluida sin recargo</span>
            </div>

            {modifier.options.map((option, index) => (
              <div key={index} className="flex gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-2xs items-start">
                <div className="min-w-0 flex-1">
                  <label className="block text-[11px] font-semibold text-gray-600">Nombre de la opción *</label>
                  <input 
                    value={option.name} 
                    onChange={(event) => setModifier((current) => ({ ...current, options: current.options.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) }))} 
                    placeholder={`Ej: Opción ${index + 1} (ej. Bien cocido / Sin Azúcar)`} 
                    className="mt-1 w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-emerald-500" 
                  />
                </div>
                <div className="w-28 shrink-0">
                  <label className="block text-[11px] font-semibold text-gray-600">Precio extra</label>
                  <div className="relative mt-1">
                    <span className="absolute left-2 top-1.5 text-xs font-bold text-gray-400">$</span>
                    <input 
                      type="number" 
                      min="0" 
                      value={option.price} 
                      onChange={(event) => setModifier((current) => ({ ...current, options: current.options.map((item, itemIndex) => itemIndex === index ? { ...item, price: event.target.value } : item) }))} 
                      placeholder="0" 
                      className="w-full rounded-lg border border-gray-200 pl-5 pr-2 py-1.5 text-xs outline-none focus:border-emerald-500" 
                    />
                  </div>
                </div>
                {modifier.options.length > 1 ? (
                  <button 
                    type="button" 
                    onClick={() => setModifier((current) => ({ ...current, options: current.options.filter((_, itemIndex) => itemIndex !== index) }))} 
                    aria-label="Quitar opción"
                    className="mt-5 rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                ) : null}
              </div>
            ))}

            <button 
              type="button" 
              onClick={() => setModifier((current) => ({ ...current, options: [...current.options, { ...EMPTY_OPTION }] }))} 
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50/50 transition-colors"
            >
              <Plus size={15} /> Añadir otra opción
            </button>
          </div>
        </div>
      ) : null}

      <button type="button" disabled={!isValid} onClick={() => setReviewing(true)} className="w-full rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white disabled:opacity-40">Revisar propuesta</button>
      <button type="button" onClick={onCancel} className="w-full py-2 text-xs font-semibold text-gray-500">Cancelar</button>
    </div>
  );
}
