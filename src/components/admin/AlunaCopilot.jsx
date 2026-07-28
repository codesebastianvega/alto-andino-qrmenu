import { useEffect, useId, useState } from 'react';
import { AlertTriangle, Bot, CheckCircle2, ChevronRight, Loader2, MapPin, Send, ShieldCheck, Sparkles, X, XCircle } from 'lucide-react';
import { executeAlunaAction, runOpeningAudit } from '../../services/alunaCopilot';

const STATUS_STYLES = {
  ready: { icon: CheckCircle2, label: 'Listo', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  warning: { icon: AlertTriangle, label: 'Por mejorar', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  blocked: { icon: XCircle, label: 'Bloqueante', className: 'bg-red-50 text-red-700 border-red-200' },
};

function AuditResult({ audit, onResolve }) {
  const findings = Array.isArray(audit?.findings) ? audit.findings : [];
  const score = Number.isFinite(audit?.score) ? audit.score : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[#14261A] p-5 text-white shadow-sm">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Preparación del local</p>
            <p className="mt-2 text-4xl font-bold">{score}<span className="text-lg text-white/60">/100</span></p>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
            {audit?.readiness === 'ready' ? 'Listo para operar' : 'Revisión necesaria'}
          </span>
        </div>
        {audit?.summary ? (
          <p className="mt-3 text-sm leading-relaxed text-white/75">
            {audit.summary.ready || 0} listos · {audit.summary.warnings || 0} por mejorar · {audit.summary.blockers || 0} bloqueantes
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        {findings.map((finding, index) => {
          const status = STATUS_STYLES[finding.status] || STATUS_STYLES.warning;
          const StatusIcon = status.icon;
          return (
            <article key={finding.key || `${finding.label}-${index}`} className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 rounded-full border p-1.5 ${status.className}`}><StatusIcon size={15} aria-hidden="true" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-gray-900">{finding.label || finding.title}</h4>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${status.className}`}>{status.label}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600">{finding.message}</p>
                  {finding.status !== 'ready' && finding.suggested_action ? (
                    <div className="mt-3 flex items-start gap-1.5 text-xs font-medium text-[#315C3A]">
                      <ChevronRight size={14} className="mt-0.5 shrink-0" aria-hidden="true" /><span>{finding.suggested_action}</span>
                    </div>
                  ) : null}
                  {finding.status !== 'ready' && finding.key === 'locations' ? (
                    <button type="button" onClick={() => onResolve(finding)} className="mt-3 rounded-xl bg-[#173D24] px-4 py-2 text-xs font-bold text-white hover:bg-[#21542f]">
                      Resolver con Aluna
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function LocationWorkflow({ brandName, isExecuting, onApprove, onCancel }) {
  const [step, setStep] = useState('form');
  const [form, setForm] = useState({ name: `${brandName} - Sede principal`, address: '', phone: '', whatsapp: '' });
  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const canContinue = form.name.trim() && form.address.trim();

  if (step === 'review') {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Propuesta pendiente de aprobación</p>
          <p className="mt-2 text-sm text-amber-900">Aluna creará esta sede y horarios iniciales de 8:00 a 22:00 todos los días.</p>
        </div>
        <dl className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 text-sm">
          {[['Marca', brandName], ['Sede', form.name], ['Dirección', form.address], ['Teléfono', form.phone || 'No indicado'], ['WhatsApp', form.whatsapp || form.phone || 'No indicado'], ['Estado', 'Activa y principal']].map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-4 border-b border-gray-100 pb-2 last:border-0 last:pb-0"><dt className="text-gray-500">{label}</dt><dd className="text-right font-semibold text-gray-900">{value}</dd></div>
          ))}
        </dl>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-800">La acción quedará registrada con tu usuario, la marca activa y los datos aprobados.</div>
        <button type="button" disabled={isExecuting} onClick={() => onApprove(form)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white hover:bg-[#21542f] disabled:opacity-60">
          {isExecuting ? <><Loader2 size={17} className="animate-spin" /> Creando sede…</> : 'Aprobar y crear sede'}
        </button>
        <button type="button" disabled={isExecuting} onClick={() => setStep('form')} className="w-full py-2 text-xs font-semibold text-gray-500">Corregir datos</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div><h3 className="text-lg font-bold text-gray-950">Crear la primera sede</h3><p className="mt-1 text-sm text-gray-600">No inventaré estos datos. Complétalos y prepararé el cambio para tu aprobación.</p></div>
      <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
        <label className="block text-xs font-bold text-gray-700">Nombre de la sede<input value={form.name} onChange={(event) => updateField('name', event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-500" /></label>
        <label className="block text-xs font-bold text-gray-700">Dirección *<input value={form.address} onChange={(event) => updateField('address', event.target.value)} placeholder="Dirección completa" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-500" /></label>
        <label className="block text-xs font-bold text-gray-700">Teléfono<input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="Opcional" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-500" /></label>
        <label className="block text-xs font-bold text-gray-700">WhatsApp<input value={form.whatsapp} onChange={(event) => updateField('whatsapp', event.target.value)} placeholder="Usará el teléfono si lo dejas vacío" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-500" /></label>
      </div>
      <button type="button" disabled={!canContinue} onClick={() => setStep('review')} className="w-full rounded-xl bg-[#173D24] py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Revisar propuesta</button>
      <button type="button" onClick={onCancel} className="w-full py-2 text-xs font-semibold text-gray-500">Volver al diagnóstico</button>
    </div>
  );
}

export default function AlunaCopilot({ brand, location, locationId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audit, setAudit] = useState(null);
  const [error, setError] = useState('');
  const [prompt, setPrompt] = useState('');
  const [workflow, setWorkflow] = useState(null);
  const [success, setSuccess] = useState('');
  const titleId = useId();
  const brandId = brand?.id;
  const brandName = brand?.name || 'tu negocio';
  const locationName = location?.name || (locationId ? 'Sede seleccionada' : 'Todas las sedes');

  useEffect(() => {
    setAudit(null);
    setError('');
    setPrompt('');
    setWorkflow(null);
    setSuccess('');
    setIsOpen(false);
  }, [brandId]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => { if (event.key === 'Escape') setIsOpen(false); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const executeAudit = async () => {
    if (!brandId || isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      setAudit(await runOpeningAudit({ brandId, locationId }));
      setPrompt('');
    } catch (auditError) {
      setError(auditError.message || 'No pude completar la auditoría. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const normalizedPrompt = prompt.trim().toLowerCase();
    if (!normalizedPrompt) return;
    if (/(audita|auditar|auditor|apertura|abrir|listo)/.test(normalizedPrompt)) {
      executeAudit();
      return;
    }
    setError('En este primer MVP puedo auditar qué falta para abrir el local. La edición con propuestas y aprobación será el siguiente paso.');
  };

  const approveLocation = async (proposal) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await executeAlunaAction({ brandId, action: 'create_location', proposal });
      setSuccess(`${result.location.name} fue creada correctamente${result.default_hours_created ? ' con sus horarios iniciales' : ''}.`);
      setWorkflow(null);
      setAudit(await runOpeningAudit({ brandId, locationId }));
    } catch (actionError) {
      setError(actionError.message || 'No pude ejecutar el cambio aprobado.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!brandId) return null;

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className="fixed bottom-24 right-4 z-[70] flex h-14 items-center gap-2 rounded-full bg-[#173D24] px-4 text-white shadow-[0_12px_32px_rgba(23,61,36,0.35)] transition hover:-translate-y-0.5 hover:bg-[#21542f] focus:outline-none focus:ring-4 focus:ring-emerald-200 md:bottom-6 md:right-6" aria-label="Abrir copiloto Aluna" aria-haspopup="dialog">
        <Sparkles size={20} aria-hidden="true" /><span className="text-sm font-bold">Aluna</span>
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[100]" role="presentation">
          <button type="button" className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" onClick={() => setIsOpen(false)} aria-label="Cerrar Aluna" />
          <section role="dialog" aria-modal="true" aria-labelledby={titleId} className="absolute inset-y-0 right-0 flex w-full flex-col bg-[#F7F8F5] shadow-2xl sm:max-w-[460px]">
            <header className="border-b border-gray-200 bg-white px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#173D24] text-white"><Bot size={23} aria-hidden="true" /></div>
                  <div><h2 id={titleId} className="font-bold text-gray-950">Aluna</h2><p className="text-xs text-gray-500">Copiloto de operación</p></div>
                </div>
                <button type="button" onClick={() => setIsOpen(false)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Cerrar panel"><X size={20} aria-hidden="true" /></button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-800"><ShieldCheck size={13} aria-hidden="true" /> {brandName}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 font-medium text-gray-600"><MapPin size={13} aria-hidden="true" /> {locationName}</span>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {workflow === 'create_location' ? (
                <LocationWorkflow brandName={brandName} isExecuting={isLoading} onApprove={approveLocation} onCancel={() => setWorkflow(null)} />
              ) : !audit ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                    <p className="text-sm font-bold text-gray-900">Hola, estoy trabajando sobre {brandName}.</p>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">Puedo revisar catálogo, recetas, horarios, pagos, impresión y presencia web para decirte qué falta antes de abrir.</p>
                  </div>
                  <button type="button" onClick={executeAudit} disabled={isLoading} className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md disabled:cursor-wait disabled:opacity-70">
                    <span className="flex items-center gap-3">
                      <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">{isLoading ? <Loader2 size={19} className="animate-spin" aria-hidden="true" /> : <Sparkles size={19} aria-hidden="true" />}</span>
                      <span><span className="block text-sm font-bold text-gray-900">Auditar apertura</span><span className="mt-0.5 block text-xs text-gray-500">Diagnóstico real, sin modificar datos</span></span>
                    </span>
                    <ChevronRight size={18} className="text-gray-400" aria-hidden="true" />
                  </button>
                </div>
              ) : <AuditResult audit={audit} onResolve={(finding) => { if (finding.key === 'locations') setWorkflow('create_location'); }} />}

              {success ? <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-800">{success}</div> : null}
              {error ? <div role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">{error}</div> : null}
            </div>

            <footer className="border-t border-gray-200 bg-white p-4">
              {audit ? <button type="button" onClick={executeAudit} disabled={isLoading} className="mb-3 w-full rounded-xl border border-gray-200 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60">{isLoading ? 'Actualizando auditoría…' : 'Volver a auditar'}</button> : null}
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <label htmlFor={`${titleId}-prompt`} className="sr-only">Escribe a Aluna</label>
                <input id={`${titleId}-prompt`} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ej: audita mi apertura" className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100" />
                <button type="submit" disabled={!prompt.trim() || isLoading} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#173D24] text-white hover:bg-[#21542f] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Enviar mensaje"><Send size={17} aria-hidden="true" /></button>
              </form>
              <p className="mt-2 text-center text-[10px] text-gray-400">Aluna no hará cambios sin tu aprobación.</p>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
