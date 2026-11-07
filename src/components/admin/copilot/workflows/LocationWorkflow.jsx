import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function LocationWorkflow({ brandName, isExecuting, onApprove, onCancel }) {
  const [step, setStep] = useState('form');
  const [form, setForm] = useState({
    name: `${brandName} - Sede principal`,
    address: '',
    phone: '',
    whatsapp: '',
  });

  const updateField = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));

  const canContinue = form.name.trim() && form.address.trim();

  if (step === 'review') {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-800">
            Propuesta pendiente de aprobación
          </p>
          <p className="mt-2 text-sm text-amber-900">
            Aluna creará esta sede y horarios iniciales de 8:00 a 22:00 todos los días.
          </p>
        </div>
        <dl className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 text-sm">
          {[
            ['Marca', brandName],
            ['Sede', form.name],
            ['Dirección', form.address],
            ['Teléfono', form.phone || 'No indicado'],
            ['WhatsApp', form.whatsapp || form.phone || 'No indicado'],
            ['Estado', 'Activa y principal'],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex items-start justify-between gap-4 border-b border-gray-100 pb-2 last:border-0 last:pb-0"
            >
              <dt className="text-gray-500">{label}</dt>
              <dd className="text-right font-semibold text-gray-900">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-800">
          La acción quedará registrada con tu usuario, la marca activa y los datos aprobados.
        </div>
        <button
          type="button"
          disabled={isExecuting}
          onClick={() => onApprove(form)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white hover:bg-[#21542f] disabled:opacity-60 transition-all"
        >
          {isExecuting ? (
            <>
              <Loader2 size={17} className="animate-spin" /> Creando sede…
            </>
          ) : (
            'Aprobar y crear sede'
          )}
        </button>
        <button
          type="button"
          disabled={isExecuting}
          onClick={() => setStep('form')}
          className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-700"
        >
          Corregir datos
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-950">Crear la primera sede</h3>
        <p className="mt-1 text-sm text-gray-600">
          Aluna preparará los datos de tu punto de venta para tu revisión y aprobación.
        </p>
      </div>

      <div className="space-y-3.5 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
        <div>
          <label className="block text-xs font-bold text-gray-700">Nombre de la sede *</label>
          <input
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="Ej: Sede Principal, Sede Poblado, Chapinero"
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
          <p className="mt-1 text-[11px] text-gray-400">
            Identificador visible de este punto de venta.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700">Dirección física completa *</label>
          <input
            value={form.address}
            onChange={(event) => updateField('address', event.target.value)}
            placeholder="Ej: Calle 93 # 12-45, Local 102"
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
          <p className="mt-1 text-[11px] text-gray-400">
            Dirección completa del local para cálculo de domicilios y cobertura.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700">Teléfono de contacto</label>
            <input
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              placeholder="Ej: +57 601 234 5678"
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            <p className="mt-1 text-[11px] text-gray-400">Línea fija o móvil de atención al cliente.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700">WhatsApp de pedidos</label>
            <input
              value={form.whatsapp}
              onChange={(event) => updateField('whatsapp', event.target.value)}
              placeholder="Ej: +57 310 987 6543"
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            <p className="mt-1 text-[11px] text-gray-400">Número celular para confirmaciones de órdenes.</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={!canContinue}
        onClick={() => setStep('review')}
        className="w-full rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white hover:bg-[#21542f] disabled:cursor-not-allowed disabled:opacity-40 transition-all"
      >
        Revisar propuesta
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-700"
      >
        Volver al diagnóstico
      </button>
    </div>
  );
}
