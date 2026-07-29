import { AlertTriangle, CheckCircle2, Clock3, Loader2, XCircle } from 'lucide-react';

const STATUS = {
  completed: { label: 'Completado', icon: CheckCircle2, className: 'text-emerald-700 bg-emerald-50' },
  failed: { label: 'Falló', icon: XCircle, className: 'text-red-700 bg-red-50' },
  partially_failed: { label: 'Parcial', icon: AlertTriangle, className: 'text-amber-700 bg-amber-50' },
  executing: { label: 'Ejecutando', icon: Loader2, className: 'text-blue-700 bg-blue-50' },
};

export default function ChangeHistory({ changes, isLoading, onRefresh, onBack }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-bold text-gray-950">Historial de cambios</h3><p className="mt-1 text-sm text-gray-600">Acciones ejecutadas por Aluna en la marca activa.</p></div><button type="button" onClick={onRefresh} disabled={isLoading} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 disabled:opacity-50">Actualizar</button></div>
      {isLoading && changes.length === 0 ? <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500"><Loader2 size={17} className="animate-spin" /> Cargando cambios…</div> : null}
      {!isLoading && changes.length === 0 ? <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">Aluna todavía no ha ejecutado cambios en esta marca.</div> : null}
      <div className="space-y-3">{changes.map((change) => {
        const status = STATUS[change.status] || { label: change.status, icon: Clock3, className: 'text-gray-600 bg-gray-100' };
        const Icon = status.icon;
        return <article key={change.id} className="rounded-2xl border border-gray-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-bold text-gray-900">{change.title}</p>{change.summary ? <p className="mt-1 text-xs leading-relaxed text-gray-500">{change.summary}</p> : null}</div><span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${status.className}`}><Icon size={12} className={change.status === 'executing' ? 'animate-spin' : ''} /> {status.label}</span></div><div className="mt-3 flex items-center justify-between text-[10px] text-gray-400"><span>Riesgo {change.risk_level}</span><time>{new Date(change.created_at).toLocaleString('es-CO')}</time></div>{change.agent_actions?.some((action) => action.error_message) ? <p className="mt-2 rounded-lg bg-red-50 p-2 text-[11px] text-red-700">{change.agent_actions.find((action) => action.error_message)?.error_message}</p> : null}</article>;
      })}</div>
      <button type="button" onClick={onBack} className="w-full py-2 text-xs font-semibold text-gray-500">Volver a Aluna</button>
    </div>
  );
}
